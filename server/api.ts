import { Router, Request, Response } from 'express';
import { firestoreDb, hashPassword } from './db.ts';
import {
  generateToken,
  requireAuth,
  requireSuperAdmin,
  requireTenantAccess,
  AuthenticatedRequest,
} from './auth.ts';
import { resolveTenantFromRequest } from './tenant.ts';
import { SAAS_PLANS } from '../src/config/plans.ts';
import {
  resolveSafeThemeId,
  ROYAL_THEMES,
} from '../src/config/themes.ts';

export const apiRouter = Router();

// Tenant-specific PWA Manifest endpoint
apiRouter.get('/manifest/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    let tenant: any = null;
    if (!tenantsSnap.empty) {
      tenant = tenantsSnap.docs[0].data();
    }

    const salonName = tenant ? tenant.name : `${slug.toUpperCase()} Beauty Parlour`;
    let settings: any = {};
    try {
      settings = tenant && tenant.settings ? JSON.parse(tenant.settings) : {};
    } catch {}

    const themeId = resolveSafeThemeId(settings.themeId);
    const themeTokens = ROYAL_THEMES[themeId] || ROYAL_THEMES['royal-gold'];

    const manifest = {
      name: `${salonName} — Customer App`,
      short_name: salonName,
      description: `Book appointments and view styling lookbooks with ${salonName}.`,
      start_url: `/?tenant=${slug}`,
      scope: `/`,
      display: 'standalone',
      background_color: themeTokens.palette.canvasBg || '#ffffff',
      theme_color: themeTokens.palette.buttonBg || '#111111',
      icons: [
        {
          src: settings.logoUrl || themeTokens.previewSvgDataUri || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=192&q=80',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: settings.logoUrl || themeTokens.previewSvgDataUri || 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=512&q=80',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    };

    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(manifest);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 1. PUBLIC TENANT WEBSITE ENDPOINTS
// ==========================================

apiRouter.get('/public/tenant-resolve', async (req: Request, res: Response) => {
  const result = await resolveTenantFromRequest(req);
  res.json(result);
});

// Tenant Public Details
apiRouter.get('/tenant/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    if (tenantsSnap.empty) {
      return res.status(404).json({ error: 'Salon / Tenant not found.' });
    }
    const tenant = tenantsSnap.docs[0].data();
    res.json(tenant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant Services
apiRouter.get('/tenant/:slug/services', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    if (tenantsSnap.empty) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    const tenantId = tenantsSnap.docs[0].id;
    const servicesSnap = await firestoreDb.collection('services').where('tenant_id', '==', tenantId).get();
    const services = servicesSnap.docs.map((d: any) => d.data());
    res.json(services);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant Gallery
apiRouter.get('/tenant/:slug/gallery', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    if (tenantsSnap.empty) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    const tenantId = tenantsSnap.docs[0].id;
    const gallerySnap = await firestoreDb.collection('gallery').where('tenant_id', '==', tenantId).get();
    const gallery = gallerySnap.docs.map((d: any) => d.data());
    res.json(gallery);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Tenant Reviews
apiRouter.get('/tenant/:slug/reviews', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    if (tenantsSnap.empty) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    const tenantId = tenantsSnap.docs[0].id;
    const reviewsSnap = await firestoreDb.collection('reviews').where('tenant_id', '==', tenantId).get();
    const reviews = reviewsSnap.docs.map((d: any) => d.data());
    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Public Bookings creation
apiRouter.post('/tenant/:slug/bookings', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    if (tenantsSnap.empty) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    const tenant = tenantsSnap.docs[0].data();
    const tenantId = tenant.id;

    const { service_id, customer_name, customer_phone, customer_email, appointment_date, appointment_time, customer_notes } = req.body;
    if (!service_id || !customer_name || !customer_phone || !appointment_date || !appointment_time) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const bookingId = 'bk_' + Date.now() + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();
    const newBooking = {
      id: bookingId,
      tenant_id: tenantId,
      service_id,
      customer_name,
      customer_phone,
      customer_email: customer_email || '',
      appointment_date,
      appointment_time,
      end_time: appointment_time,
      status: 'pending',
      customer_notes: customer_notes || '',
      internal_notes: '',
      created_at: now,
      updated_at: now
    };

    await firestoreDb.collection('bookings').doc(bookingId).set(newBooking);
    res.status(201).json({ success: true, booking: newBooking });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 2. AUTHENTICATION ENDPOINTS
// ==========================================

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Login ID and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const hash = hashPassword(password);

    const usersSnap = await firestoreDb.collection('users').where('email', '==', cleanEmail).get();
    if (usersSnap.empty) {
      return res.status(401).json({ error: 'Invalid login ID or password.' });
    }

    const userDoc = usersSnap.docs[0];
    const user = userDoc.data() as any;

    if (user.password_hash !== hash) {
      return res.status(401).json({ error: 'Invalid login ID or password.' });
    }

    let tenant = null;
    if (user.tenant_id) {
      const tSnap = await firestoreDb.collection('tenants').doc(user.tenant_id).get();
      if (tSnap.exists) {
        tenant = tSnap.data();
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
      name: user.name
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id
      },
      tenant
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.user!;
    const userDoc = await firestoreDb.collection('users').doc(authUser.userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found.' });
    }
    const user = userDoc.data() as any;
    let tenant = null;
    if (user.tenant_id) {
      const tSnap = await firestoreDb.collection('tenants').doc(user.tenant_id).get();
      if (tSnap.exists) {
        tenant = tSnap.data();
      }
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id
      },
      tenant
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. SUPER ADMIN & OWNER DASHBOARD ENDPOINTS
// ==========================================

apiRouter.get('/admin/stats', requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantsSnap = await firestoreDb.collection('tenants').get();
    const bookingsSnap = await firestoreDb.collection('bookings').get();
    const renewalsSnap = await firestoreDb.collection('subscription_renewals').get();

    let totalTenants = tenantsSnap.size;
    let activeTenants = 0;
    let suspendedTenants = 0;
    let expiredTenants = 0;

    tenantsSnap.forEach((doc: any) => {
      const t = doc.data();
      if (t.status === 'active') activeTenants++;
      if (t.status === 'suspended') suspendedTenants++;
    });

    let totalRevenue = 0;
    renewalsSnap.forEach((doc: any) => {
      totalRevenue += Number(doc.data().amount || 0);
    });

    res.json({
      totalTenants,
      activeTenants,
      suspendedTenants,
      expiredTenants,
      totalBookings: bookingsSnap.size,
      confirmedBookings: bookingsSnap.docs.filter((d: any) => d.data().status === 'confirmed').length,
      totalRevenueCollected: totalRevenue
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/tenants', requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const tenantsSnap = await firestoreDb.collection('tenants').get();
    const tenants = tenantsSnap.docs.map((doc: any) => doc.data());
    res.json(tenants);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/audit-logs', requireSuperAdmin, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const logsSnap = await firestoreDb.collection('audit_logs').limit(100).get();
    const logs = logsSnap.docs.map((d: any) => d.data());
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/admin/plans', (_req: Request, res: Response) => {
  res.json(Object.values(SAAS_PLANS));
});

// Owner Tenant Summary
apiRouter.get('/owner/tenant/:tenantId', requireTenantAccess, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tenantId } = req.params;
    const tSnap = await firestoreDb.collection('tenants').doc(tenantId).get();
    if (!tSnap.exists) {
      return res.status(404).json({ error: 'Tenant not found.' });
    }
    const tenant = tSnap.data();

    const bookingsSnap = await firestoreDb.collection('bookings').where('tenant_id', '==', tenantId).get();
    const servicesSnap = await firestoreDb.collection('services').where('tenant_id', '==', tenantId).get();

    const bookings = bookingsSnap.docs.map((d: any) => d.data());
    res.json({
      tenant,
      servicesCount: servicesSnap.size,
      bookingsCount: bookings.length,
      bookings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// APK status
apiRouter.get('/apk/status/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', slug).limit(1).get();
    if (tenantsSnap.empty) {
      return res.status(404).json({ error: 'Tenant not found' });
    }
    const tenant = tenantsSnap.docs[0].data();
    res.json({
      ownerApp: {
        packageName: 'com.localboost.ai.owner',
        appName: 'LocalBoost Owner App',
        version: '1.0.0',
        status: 'ready',
        downloadUrl: '#github-actions-artifact',
        fileSize: '14.2 MB'
      },
      customerApp: {
        packageName: `com.localboost.ai.customer.${slug}`,
        appName: `${tenant.name} Customer App`,
        version: '1.0.0',
        status: 'ready',
        downloadUrl: `/?tenant=${slug}`,
        fileSize: '12.8 MB'
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
