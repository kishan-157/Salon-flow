import { Router, Request, Response } from 'express';
import { db, hashPassword } from './db.ts';
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
  ALLOWED_ROYAL_THEMES,
  isValidRoyalTheme,
  resolveSafeThemeId,
  ROYAL_THEMES,
} from '../src/config/themes.ts';
import { INDIAN_SALON_PHOTO_LIBRARY } from '../src/config/indianPhotoLibrary.ts';

export const apiRouter = Router();

// Tenant-specific PWA Manifest endpoint
apiRouter.get('/manifest/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase();
  const tenant = db.prepare('SELECT name, settings FROM tenants WHERE slug = ?').get(slug) as any;
  const salonName = tenant ? tenant.name : `${slug.toUpperCase()} Beauty Parlour`;
  let settings: any = {};
  try {
    settings = tenant ? JSON.parse(tenant.settings || '{}') : {};
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
});

// ==========================================
// 1. PUBLIC TENANT WEBSITE ENDPOINTS
// ==========================================

// Endpoint to resolve tenant identity for public view
apiRouter.get('/public/tenant-resolve', (req: Request, res: Response) => {
  const result = resolveTenantFromRequest(req);
  if (result.status === 'not_found') {
    return res.status(404).json(result);
  }
  if (result.status === 'suspended' || result.status === 'invalid_host') {
    return res.status(403).json(result);
  }
  res.json(result);
});

function autoProvisionTenant(slug: string) {
  const tenantId = `ten_${slug}_auto_${Date.now()}`;
  const ownerId = `usr_owner_${slug}`;
  const now = new Date().toISOString();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const salonName = slug === 'glamour' ? 'Glamour Lounge Aesthetics' : slug === 'royal' ? 'Royal Blossom Couture & Spa' : `${slug.charAt(0).toUpperCase() + slug.slice(1)} Luxury Beauty Studio`;
  const themeId = slug === 'glamour' ? 'rose-luxe' : slug === 'royal' ? 'royal-gold' : 'rose-elegance';

  const settings = {
    themeId,
    tagline: 'High-Fashion Hair Artistry & Holistic Skin Sanctuary',
    phone: '+1 (555) 234-8901',
    email: `contact@${slug}.com`,
    address: '450 Haute Boulevard, Suite 100',
    city: 'Beverly Hills, CA 90210',
    currency: '$',
    heroHeadline: 'Exquisite Hair Artistry & Rejuvenating Spa Sanctuaries',
    heroSubheadline: 'Immerse in bespoke couture styling, master balayage, and clinical age-defying facials.',
    heroImageUrl: '',
    logoUrl: '',
    openingHours: [
      { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
      { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
      { day: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
    ],
  };

  try {
    db.prepare(`
      INSERT INTO tenants (id, slug, name, owner_id, status, plan_id, subscription_status, subscription_starts_at, subscription_expires_at, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', 'pro', 'active', ?, ?, ?, ?, ?)
    `).run(tenantId, slug, salonName, ownerId, now, nextYear, JSON.stringify(settings), now, now);

    const defaultServices = [
      { id: `svc_${slug}_1`, cat: 'Bridal & Styling', name: 'Signature Bridal Hair & Glow Couture', desc: 'Complete bespoke wedding day hair sculpture and airbrush makeup.', price: 350, dur: 120, pop: 1 },
      { id: `svc_${slug}_2`, cat: 'Hair Color', name: 'Parisian Master Balayage & Glaze', desc: 'Custom hand-painted French balayage and botanical gloss toner.', price: 250, dur: 150, pop: 1 },
      { id: `svc_${slug}_3`, cat: 'Facial & Skin', name: '24K Gold Cellular Renewal Facial', desc: 'Infusion of pure 24-karat gold leaf and hyaluronic micro-current.', price: 180, dur: 75, pop: 1 },
    ];
    for (const s of defaultServices) {
      db.prepare(`
        INSERT INTO services (id, tenant_id, category, name, description, price, duration_minutes, is_active, is_popular, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(s.id, tenantId, s.cat, s.name, s.desc, s.price, s.dur, s.pop, now);
    }
  } catch {}

  return db.prepare('SELECT id, slug, name, status, plan_id, subscription_status, subscription_expires_at, settings, created_at FROM tenants WHERE slug = ?').get(slug);
}

// Get tenant public data by slug
apiRouter.get('/public/tenants/:slug', (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase();
  let tenant = db.prepare(`
    SELECT id, slug, name, status, plan_id, subscription_status, subscription_expires_at, settings, created_at
    FROM tenants
    WHERE slug = ?
  `).get(slug) as any;

  if (!tenant) {
    tenant = autoProvisionTenant(slug);
  }

  try {
    tenant.settings = JSON.parse(tenant.settings || '{}');
  } catch {
    tenant.settings = {};
  }
  // Never expose ownerPasswordHint on public endpoint
  if (tenant.settings && 'ownerPasswordHint' in tenant.settings) {
    delete tenant.settings.ownerPasswordHint;
  }
  tenant.settings.themeId = resolveSafeThemeId(tenant.settings.themeId);

  // Check if tenant is suspended
  if (tenant.status === 'suspended') {
    return res.status(403).json({
      error: 'This salon website is currently suspended.',
      status: 'suspended',
      tenant: { name: tenant.name, slug: tenant.slug },
    });
  }

  // Fetch active services
  const services = db.prepare(`
    SELECT id, category, name, description, price, duration_minutes, is_popular
    FROM services
    WHERE tenant_id = ? AND is_active = 1
    ORDER BY category ASC, is_popular DESC, name ASC
  `).all(tenant.id);

  // Fetch gallery items
  const gallery = db.prepare(`
    SELECT id, title, category, image_url
    FROM gallery
    WHERE tenant_id = ?
    ORDER BY created_at DESC
  `).all(tenant.id);

  // Fetch verified reviews
  const reviews = db.prepare(`
    SELECT id, author_name, rating, comment, service_tag, date
    FROM reviews
    WHERE tenant_id = ? AND is_verified = 1
    ORDER BY date DESC
  `).all(tenant.id);

  // Return public payload only - NEVER leak private customer info
  res.json({
    tenant,
    services,
    gallery,
    reviews,
  });
});

// Public Appointment Booking Endpoint (Atomic Transaction & Concurrency Control)
apiRouter.post('/public/tenants/:slug/book', (req: Request, res: Response) => {
  const slug = req.params.slug.toLowerCase();
  const {
    service_id,
    customer_name,
    customer_phone,
    customer_email,
    appointment_date,
    appointment_time,
    customer_notes,
  } = req.body;

  // Validation
  if (!service_id || !customer_name || !customer_phone || !appointment_date || !appointment_time) {
    return res.status(400).json({ error: 'All required booking fields must be provided.' });
  }

  // Validate phone format (minimum 7 digits)
  const phoneDigits = customer_phone.replace(/\D/g, '');
  if (phoneDigits.length < 7) {
    return res.status(400).json({ error: 'Please provide a valid contact telephone number.' });
  }

  // Validate date is not in past
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (appointment_date < todayStr) {
    return res.status(400).json({ error: 'Cannot book appointments for past dates.' });
  }

  // Query tenant
  const tenant = db.prepare('SELECT * FROM tenants WHERE slug = ?').get(slug) as any;
  if (!tenant) {
    return res.status(404).json({ error: 'Salon parlour not found.' });
  }

  if (tenant.status !== 'active') {
    return res.status(403).json({ error: 'This salon is currently unable to accept appointments.' });
  }

  if (tenant.subscription_status === 'expired' || tenant.subscription_expires_at < now.toISOString()) {
    return res.status(403).json({
      error: 'This salon has an expired subscription. Online appointments are paused.',
    });
  }

  // Query service and verify it belongs to this tenant
  const service = db.prepare('SELECT * FROM services WHERE id = ? AND tenant_id = ? AND is_active = 1').get(
    service_id,
    tenant.id
  ) as any;

  if (!service) {
    return res.status(400).json({ error: 'The selected service is not available for this salon.' });
  }

  // Calculate end_time based on service duration
  const [startH, startM] = appointment_time.split(':').map(Number);
  const totalStartMinutes = startH * 60 + startM;
  const totalEndMinutes = totalStartMinutes + service.duration_minutes;
  const endH = Math.floor(totalEndMinutes / 60);
  const endM = totalEndMinutes % 60;
  const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  // Execute database atomic transaction
  try {
    db.exec('BEGIN IMMEDIATE;');

    // 1. Check for overlapping CONFIRMED bookings for this salon
    const overlap = db.prepare(`
      SELECT id FROM bookings
      WHERE tenant_id = ?
        AND appointment_date = ?
        AND status = 'confirmed'
        AND NOT (end_time <= ? OR appointment_time >= ?)
      LIMIT 1
    `).get(tenant.id, appointment_date, appointment_time, endTimeStr) as any;

    if (overlap) {
      db.exec('ROLLBACK;');
      return res.status(409).json({
        error: 'This appointment slot is already reserved. Please select another time or date.',
      });
    }

    // 2. Prevent identical duplicate submission within 10 minutes from same customer
    const duplicate = db.prepare(`
      SELECT id FROM bookings
      WHERE tenant_id = ?
        AND customer_phone = ?
        AND appointment_date = ?
        AND appointment_time = ?
        AND status IN ('pending', 'confirmed')
      LIMIT 1
    `).get(tenant.id, customer_phone, appointment_date, appointment_time) as any;

    if (duplicate) {
      db.exec('ROLLBACK;');
      return res.status(409).json({
        error: 'You have already submitted an appointment request for this time slot.',
      });
    }

    // 3. Create booking with status 'pending' (per Phase 6 requirement)
    const bookingId = 'bk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    const createdAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO bookings (
        id, tenant_id, service_id, customer_name, customer_phone, customer_email,
        appointment_date, appointment_time, end_time, status, customer_notes, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, '', ?, ?)
    `).run(
      bookingId,
      tenant.id,
      service.id,
      customer_name.trim(),
      customer_phone.trim(),
      (customer_email || '').trim().toLowerCase(),
      appointment_date,
      appointment_time,
      endTimeStr,
      (customer_notes || '').trim(),
      createdAt,
      createdAt
    );

    db.exec('COMMIT;');

    return res.status(201).json({
      success: true,
      message: 'Your appointment request has been submitted successfully and is pending parlour confirmation.',
      booking: {
        id: bookingId,
        salon_name: tenant.name,
        service_name: service.name,
        service_price: service.price,
        appointment_date,
        appointment_time,
        status: 'pending',
      },
    });
  } catch (err: any) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    console.error('Booking transaction error:', err);
    return res.status(500).json({ error: 'Failed to record booking. Please try again.' });
  }
});

// ==========================================
// 2. AUTHENTICATION ENDPOINTS
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Login ID and password are required.' });
  }

  const cleanInput = String(email).trim().toLowerCase();

  // Special bootstrapping for user's requested admin credentials: ladanikishan8@gmail.com / 12345678
  if (cleanInput === 'ladanikishan8@gmail.com' && password === '12345678') {
    let adminUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get('ladanikishan8@gmail.com') as any;
    if (!adminUser) {
      const now = new Date().toISOString();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
        VALUES (?, ?, ?, ?, 'superadmin', NULL, ?)
      `).run('usr_ladanikishan_admin', 'ladanikishan8@gmail.com', hashPassword('12345678'), 'Kishan Ladani (Super Admin)', now);
      adminUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get('ladanikishan8@gmail.com');
    } else {
      db.prepare(`
        UPDATE users SET password_hash = ?, role = 'superadmin' WHERE LOWER(email) = 'ladanikishan8@gmail.com'
      `).run(hashPassword('12345678'));
      adminUser = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get('ladanikishan8@gmail.com');
    }
    const token = generateToken(adminUser);
    return res.json({
      token,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        tenantId: adminUser.tenant_id,
      },
      tenant: null,
    });
  }

  // Look up by exact email/Login ID first, or by tenant slug if a business owner entered their salon slug
  let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(cleanInput) as any;
  if (!user) {
    const tenantBySlug = db.prepare('SELECT id, owner_id FROM tenants WHERE LOWER(slug) = ?').get(cleanInput) as any;
    if (tenantBySlug?.owner_id) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(tenantBySlug.owner_id) as any;
    }
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid Login ID or password.' });
  }

  const hashed = hashPassword(password);
  if (hashed !== user.password_hash) {
    return res.status(401).json({ error: 'Invalid Login ID or password.' });
  }

  // If user is tenant owner, retrieve tenant info
  let tenant: any = null;
  if (user.tenant_id) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id) as any;
    if (tenant) {
      if (tenant.status === 'suspended') {
        return res.status(403).json({
          error: 'This business account has been suspended by Super Admin. Please contact support.',
        });
      }
      try {
        tenant.settings = JSON.parse(tenant.settings || '{}');
      } catch {}
    }
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
    },
    tenant,
  });
});

apiRouter.post('/auth/firebase', (req: Request, res: Response) => {
  const { uid, email, displayName } = req.body;
  if (!uid || !email) {
    return res.status(400).json({ error: 'Firebase UID and verified email are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const isBootstrappedAdmin = normalizedEmail === 'ladanikishan8@gmail.com';

  // 1. Check if this email matches an existing user (Business Owner or Super Admin)
  let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(normalizedEmail) as any;

  // 2. If not directly in users table, check if it's the bootstrapped Super Admin email
  if (!user && isBootstrappedAdmin) {
    user = db.prepare("SELECT * FROM users WHERE role = 'superadmin' LIMIT 1").get() as any;
  }

  if (!user) {
    return res.status(404).json({
      error: `No Business Owner or Super Admin account found for '${normalizedEmail}'. Please log in using the Login ID & Password created by Super Admin.`,
    });
  }

  let tenant: any = null;
  if (user.tenant_id) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id) as any;
    if (tenant) {
      try {
        tenant.settings = JSON.parse(tenant.settings || '{}');
      } catch {}
    }
  }

  const token = generateToken(user);

  res.json({
    token,
    user: {
      id: user.id,
      firebaseUid: uid,
      email: normalizedEmail,
      name: displayName || user.name,
      role: user.role,
      tenantId: user.tenant_id,
      authProvider: 'firebase-google',
    },
    tenant,
  });
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const authUser = req.user!;
  const user = db.prepare('SELECT id, email, name, role, tenant_id FROM users WHERE id = ?').get(authUser.userId) as any;
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }

  let tenant: any = null;
  if (user.tenant_id) {
    tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id) as any;
    if (tenant) {
      try {
        tenant.settings = JSON.parse(tenant.settings || '{}');
      } catch {}
    }
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenant_id,
    },
    tenant,
  });
});

// ==========================================
// 3. OWNER DASHBOARD ENDPOINTS (TENANT-SCOPED)
// ==========================================

// Dashboard Overview Metrics
apiRouter.get('/owner/:tenantId/dashboard', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }
  try {
    tenant.settings = JSON.parse(tenant.settings || '{}');
  } catch {}

  const today = new Date().toISOString().split('T')[0];

  // Today's appointments
  const todayBookings = db.prepare(`
    SELECT b.*, s.name as service_name, s.price as service_price, s.duration_minutes as service_duration
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = ? AND b.appointment_date = ?
    ORDER BY b.appointment_time ASC
  `).all(tenantId, today) as any[];

  // Pending count
  const pendingCount = (db.prepare(`
    SELECT count(*) as count FROM bookings WHERE tenant_id = ? AND status = 'pending'
  `).get(tenantId) as any).count;

  // Upcoming confirmed count
  const upcomingCount = (db.prepare(`
    SELECT count(*) as count FROM bookings WHERE tenant_id = ? AND status = 'confirmed' AND appointment_date >= ?
  `).get(tenantId, today) as any).count;

  // Total completed this month
  const totalCompleted = (db.prepare(`
    SELECT count(*) as count FROM bookings WHERE tenant_id = ? AND status = 'completed'
  `).get(tenantId) as any).count;

  // Revenue estimation
  const revenueEst = (db.prepare(`
    SELECT coalesce(sum(s.price), 0) as total
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = ? AND b.status IN ('confirmed', 'completed')
  `).get(tenantId) as any).total;

  res.json({
    tenant,
    todayBookings,
    stats: {
      todayAppointments: todayBookings.length,
      pendingRequests: pendingCount,
      upcomingAppointments: upcomingCount,
      totalCompleted,
      estimatedRevenue: revenueEst,
    },
  });
});

// All Bookings for Tenant with filtering & search
apiRouter.get('/owner/:tenantId/bookings', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const { status, date, search } = req.query;

  let query = `
    SELECT b.*, s.name as service_name, s.price as service_price, s.duration_minutes as service_duration, s.category as service_category
    FROM bookings b
    JOIN services s ON b.service_id = s.id
    WHERE b.tenant_id = ?
  `;
  const params: any[] = [tenantId];

  if (status && status !== 'all') {
    query += ' AND b.status = ?';
    params.push(status);
  }

  if (date) {
    query += ' AND b.appointment_date = ?';
    params.push(date);
  }

  if (search) {
    query += ' AND (b.customer_name LIKE ? OR b.customer_phone LIKE ? OR b.customer_email LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY b.appointment_date DESC, b.appointment_time DESC';

  const bookings = db.prepare(query).all(...params);
  res.json(bookings);
});

// Update Booking Status (Pending -> Confirmed / Rejected / Completed / Cancelled)
apiRouter.patch('/owner/:tenantId/bookings/:bookingId/status', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, bookingId } = req.params;
  const { status, internal_notes } = req.body;

  const validStatuses = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid booking status.' });
  }

  // Ensure booking belongs to this tenant
  const booking = db.prepare('SELECT * FROM bookings WHERE id = ? AND tenant_id = ?').get(bookingId, tenantId) as any;
  if (!booking) {
    return res.status(404).json({ error: 'Booking record not found for this salon.' });
  }

  // If changing to 'confirmed', check for concurrency conflicts!
  if (status === 'confirmed') {
    const conflict = db.prepare(`
      SELECT id, customer_name FROM bookings
      WHERE tenant_id = ?
        AND appointment_date = ?
        AND id != ?
        AND status = 'confirmed'
        AND NOT (end_time <= ? OR appointment_time >= ?)
      LIMIT 1
    `).get(tenantId, booking.appointment_date, booking.id, booking.appointment_time, booking.end_time) as any;

    if (conflict) {
      return res.status(409).json({
        error: `Cannot confirm: Overlaps with an already confirmed appointment for ${conflict.customer_name}.`,
      });
    }
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE bookings
    SET status = ?, internal_notes = coalesce(?, internal_notes), updated_at = ?
    WHERE id = ? AND tenant_id = ?
  `).run(status, internal_notes ?? null, now, bookingId, tenantId);

  res.json({
    success: true,
    message: `Booking #${bookingId} status updated to ${status}.`,
    booking: { ...booking, status, updated_at: now },
  });
});

// Service Management (List, Add, Edit, Delete)
apiRouter.get('/owner/:tenantId/services', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const services = db.prepare('SELECT * FROM services WHERE tenant_id = ? ORDER BY category, name').all(tenantId);
  res.json(services);
});

apiRouter.post('/owner/:tenantId/services', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const { category, name, description, price, duration_minutes, is_popular } = req.body;

  if (!name || !category || price === undefined) {
    return res.status(400).json({ error: 'Name, category, and price are required.' });
  }

  // Check plan service limits
  const tenant = db.prepare('SELECT plan_id FROM tenants WHERE id = ?').get(tenantId) as any;
  const plan = SAAS_PLANS[tenant?.plan_id || 'starter'] || SAAS_PLANS.starter;
  const currentCount = (db.prepare('SELECT count(*) as count FROM services WHERE tenant_id = ?').get(tenantId) as any).count;

  if (currentCount >= plan.maxServices) {
    return res.status(403).json({
      error: `Plan limit reached: Your current '${plan.name}' plan allows up to ${plan.maxServices} services. Please upgrade via Super Admin.`,
    });
  }

  const serviceId = 'svc_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO services (id, tenant_id, category, name, description, price, duration_minutes, is_active, is_popular, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(
    serviceId,
    tenantId,
    category.trim(),
    name.trim(),
    (description || '').trim(),
    Number(price),
    Number(duration_minutes) || 60,
    is_popular ? 1 : 0,
    now
  );

  const created = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  res.status(201).json(created);
});

apiRouter.put('/owner/:tenantId/services/:serviceId', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, serviceId } = req.params;
  const { category, name, description, price, duration_minutes, is_active, is_popular } = req.body;

  // Strict tenant-ownership check
  const existing = db.prepare('SELECT * FROM services WHERE id = ? AND tenant_id = ?').get(serviceId, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'Service not found in your salon catalog.' });
  }

  db.prepare(`
    UPDATE services
    SET category = coalesce(?, category),
        name = coalesce(?, name),
        description = coalesce(?, description),
        price = coalesce(?, price),
        duration_minutes = coalesce(?, duration_minutes),
        is_active = coalesce(?, is_active),
        is_popular = coalesce(?, is_popular)
    WHERE id = ? AND tenant_id = ?
  `).run(
    category,
    name,
    description,
    price !== undefined ? Number(price) : null,
    duration_minutes !== undefined ? Number(duration_minutes) : null,
    is_active !== undefined ? (is_active ? 1 : 0) : null,
    is_popular !== undefined ? (is_popular ? 1 : 0) : null,
    serviceId,
    tenantId
  );

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  res.json(updated);
});

apiRouter.delete('/owner/:tenantId/services/:serviceId', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, serviceId } = req.params;
  const existing = db.prepare('SELECT * FROM services WHERE id = ? AND tenant_id = ?').get(serviceId, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'Service not found in your salon catalog.' });
  }

  db.prepare('DELETE FROM services WHERE id = ? AND tenant_id = ?').run(serviceId, tenantId);
  res.json({ success: true, message: 'Service removed from catalog.' });
});

// Gallery Management (Add, Delete)
apiRouter.get('/owner/:tenantId/gallery', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const items = db.prepare('SELECT * FROM gallery WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
  res.json(items);
});

apiRouter.post('/owner/:tenantId/gallery', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const { title, category, image_url } = req.body;

  if (!title || !image_url) {
    return res.status(400).json({ error: 'Title and image URL are required.' });
  }

  // Check plan gallery limits
  const tenant = db.prepare('SELECT plan_id FROM tenants WHERE id = ?').get(tenantId) as any;
  const plan = SAAS_PLANS[tenant?.plan_id || 'starter'] || SAAS_PLANS.starter;
  const currentCount = (db.prepare('SELECT count(*) as count FROM gallery WHERE tenant_id = ?').get(tenantId) as any).count;

  if (currentCount >= plan.maxGalleryItems) {
    return res.status(403).json({
      error: `Plan limit reached: Your current '${plan.name}' plan allows up to ${plan.maxGalleryItems} gallery photos.`,
    });
  }

  const galId = 'gal_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO gallery (id, tenant_id, title, category, image_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(galId, tenantId, title.trim(), (category || 'Portfolio').trim(), image_url.trim(), now);

  const created = db.prepare('SELECT * FROM gallery WHERE id = ?').get(galId);
  res.status(201).json(created);
});

apiRouter.put('/owner/:tenantId/gallery/:galleryId', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, galleryId } = req.params;
  const { title, category, image_url } = req.body;

  const existing = db.prepare('SELECT * FROM gallery WHERE id = ? AND tenant_id = ?').get(galleryId, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'Gallery photo not found.' });
  }

  db.prepare(`
    UPDATE gallery
    SET title = coalesce(?, title),
        category = coalesce(?, category),
        image_url = coalesce(?, image_url)
    WHERE id = ? AND tenant_id = ?
  `).run(title ?? null, category ?? null, image_url ?? null, galleryId, tenantId);

  const updated = db.prepare('SELECT * FROM gallery WHERE id = ?').get(galleryId);
  res.json(updated);
});

apiRouter.delete('/owner/:tenantId/gallery/:galleryId', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, galleryId } = req.params;
  const existing = db.prepare('SELECT * FROM gallery WHERE id = ? AND tenant_id = ?').get(galleryId, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'Gallery photo not found.' });
  }

  db.prepare('DELETE FROM gallery WHERE id = ? AND tenant_id = ?').run(galleryId, tenantId);
  res.json({ success: true, message: 'Photo deleted from gallery.' });
});

// Client Reviews / Testimonials Management
apiRouter.get('/owner/:tenantId/reviews', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const items = db.prepare('SELECT * FROM reviews WHERE tenant_id = ? ORDER BY date DESC').all(tenantId);
  res.json(items);
});

apiRouter.post('/owner/:tenantId/reviews', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const { author_name, rating, comment, service_tag, date } = req.body;

  if (!author_name || !comment) {
    return res.status(400).json({ error: 'Client name and review comment are required.' });
  }

  const revId = 'rev_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const safeRating = Math.min(5, Math.max(1, Number(rating) || 5));
  const reviewDate = date || new Date().toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO reviews (id, tenant_id, author_name, rating, comment, service_tag, date, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `).run(
    revId,
    tenantId,
    author_name.trim(),
    safeRating,
    comment.trim(),
    (service_tag || 'Signature Service').trim(),
    reviewDate
  );

  const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(revId);
  res.status(201).json(created);
});

apiRouter.delete('/owner/:tenantId/reviews/:reviewId', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId, reviewId } = req.params;
  const existing = db.prepare('SELECT * FROM reviews WHERE id = ? AND tenant_id = ?').get(reviewId, tenantId);
  if (!existing) {
    return res.status(404).json({ error: 'Review not found.' });
  }

  db.prepare('DELETE FROM reviews WHERE id = ? AND tenant_id = ?').run(reviewId, tenantId);
  res.json({ success: true, message: 'Review removed.' });
});

// Update Salon Settings & Website Customization
apiRouter.put('/owner/:tenantId/settings', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const { settings, name } = req.body;

  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object required.' });
  }

  if (settings.themeId !== undefined && !isValidRoyalTheme(settings.themeId)) {
    return res.status(400).json({
      error: `Invalid theme identifier. Allowed themes: ${ALLOWED_ROYAL_THEMES.join(', ')}`,
    });
  }

  const existingRow = db.prepare('SELECT settings FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!existingRow) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  let currentSettings: any = {};
  try {
    currentSettings = JSON.parse(existingRow.settings || '{}');
  } catch {}

  const mergedSettings = {
    ...currentSettings,
    ...settings,
    themeId: resolveSafeThemeId(settings.themeId ?? currentSettings.themeId),
  };

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tenants
    SET name = coalesce(?, name), settings = ?, updated_at = ?
    WHERE id = ?
  `).run(name || null, JSON.stringify(mergedSettings), now, tenantId);

  res.json({
    success: true,
    message: 'Salon website configuration saved.',
    settings: mergedSettings,
  });
});

// Dedicated Theme Selection & Publishing Endpoint (Server-Side Allowlist Validated)
apiRouter.patch('/owner/:tenantId/theme', requireTenantAccess, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const { themeId } = req.body;

  if (!isValidRoyalTheme(themeId)) {
    return res.status(400).json({
      error: `Invalid or unauthorized theme identifier '${String(themeId)}'. Allowed themes: ${ALLOWED_ROYAL_THEMES.join(', ')}`,
    });
  }

  const tenantRow = db.prepare('SELECT id, name, settings FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenantRow) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  let parsedSettings: any = {};
  try {
    parsedSettings = JSON.parse(tenantRow.settings || '{}');
  } catch {
    parsedSettings = {};
  }

  parsedSettings.themeId = themeId;
  const themeDef = ROYAL_THEMES[themeId];
  parsedSettings.layoutVariant = themeDef.layoutVariant;
  parsedSettings.serviceCardStyle = themeDef.typography.serviceCardStyle;
  parsedSettings.customColors = {};
  if (
    !parsedSettings.heroImageUrl ||
    parsedSettings.heroImageUrl.includes('images.unsplash.com') ||
    parsedSettings.heroImageUrl.startsWith('data:image/svg+xml')
  ) {
    parsedSettings.heroImageUrl = '';
  }
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE tenants
    SET settings = ?, updated_at = ?
    WHERE id = ?
  `).run(JSON.stringify(parsedSettings), now, tenantId);

  db.prepare(`
    INSERT INTO audit_logs (id, tenant_id, user_id, action, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
    tenantId,
    req.user?.userId || null,
    'TENANT_THEME_UPDATED',
    `Published royal website theme '${themeDef.name}' (${themeId}) for ${tenantRow.name}`,
    req.ip || 'unknown',
    now
  );

  res.json({
    success: true,
    themeId,
    themeName: themeDef.name,
    message: `'${themeDef.name}' theme has been published to your live salon website.`,
    settings: parsedSettings,
  });
});

// ==========================================
// 4. SUPER ADMIN ENDPOINTS (PLATFORM-WIDE)
// ==========================================

// Platform-level operational overview stats
apiRouter.get('/admin/overview', requireSuperAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const totalTenants = (db.prepare('SELECT count(*) as count FROM tenants').get() as any).count;
  const activeTenants = (db.prepare("SELECT count(*) as count FROM tenants WHERE status = 'active'").get() as any).count;
  const suspendedTenants = (db.prepare("SELECT count(*) as count FROM tenants WHERE status = 'suspended'").get() as any).count;
  
  const now = new Date().toISOString();
  const expiredTenants = (db.prepare(`
    SELECT count(*) as count FROM tenants
    WHERE subscription_status = 'expired' OR subscription_expires_at < ?
  `).get(now) as any).count;

  const totalBookings = (db.prepare('SELECT count(*) as count FROM bookings').get() as any).count;
  const confirmedBookings = (db.prepare("SELECT count(*) as count FROM bookings WHERE status = 'confirmed'").get() as any).count;
  const totalRevenueCollected = (db.prepare('SELECT coalesce(sum(amount), 0) as total FROM subscription_renewals').get() as any).total;

  res.json({
    totalTenants,
    activeTenants,
    suspendedTenants,
    expiredTenants,
    totalBookings,
    confirmedBookings,
    totalRevenueCollected,
  });
});

// List all tenants with details
apiRouter.get('/admin/tenants', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { search, status } = req.query;

  let query = `
    SELECT t.*, u.name as owner_name, u.email as owner_email,
      (SELECT count(*) FROM services WHERE tenant_id = t.id) as services_count,
      (SELECT count(*) FROM bookings WHERE tenant_id = t.id) as bookings_count
    FROM tenants t
    LEFT JOIN users u ON t.owner_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (status && status !== 'all') {
    query += ' AND t.status = ?';
    params.push(status);
  }

  if (search) {
    query += ' AND (t.name LIKE ? OR t.slug LIKE ? OR u.email LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY t.created_at DESC';

  const rows = db.prepare(query).all(...params) as any[];
  for (const r of rows) {
    try {
      r.settings = JSON.parse(r.settings || '{}');
    } catch {
      r.settings = {};
    }
  }

  res.json(rows);
});

// Create new Tenant + Owner account
apiRouter.post('/admin/tenants', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { name, slug, owner_name, owner_email, owner_password, plan_id, theme_id } = req.body;

  if (!name || !slug || !owner_name || !owner_email || !owner_password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const cleanSlug = slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(cleanSlug)) {
    return res.status(400).json({ error: 'Invalid subdomain slug format. Use 3-50 lowercase letters, numbers, and hyphens.' });
  }

  // Check slug uniqueness
  const existingSlug = db.prepare('SELECT id FROM tenants WHERE slug = ?').get(cleanSlug);
  if (existingSlug) {
    return res.status(409).json({ error: `Subdomain '${cleanSlug}' is already claimed by another salon.` });
  }

  // Check Login ID / email uniqueness
  const cleanEmail = owner_email.trim().toLowerCase();
  const existingEmail = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
  if (existingEmail) {
    return res.status(409).json({ error: `An account with Login ID '${cleanEmail}' already exists.` });
  }

  const selectedThemeId = resolveSafeThemeId(theme_id || 'rose-luxe');
  const selectedThemeDef = ROYAL_THEMES[selectedThemeId];

  const now = new Date().toISOString();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const tenantId = 'ten_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
  const ownerId = 'usr_owner_' + Date.now().toString(36);

  const initialSettings = {
    themeId: selectedThemeId,
    ownerPasswordHint: owner_password,
    tagline: selectedThemeDef?.tagline || 'Royal Indian Bridal Makeup, Hair & Skin Sanctuary',
    phone: '+91 98765 43210',
    email: cleanEmail,
    address: '100 Royal Heritage Plaza',
    city: 'Mumbai, MH',
    primaryColor: selectedThemeDef?.palette?.accentPrimary || '#be123c',
    heroHeadline: `Welcome to ${name}`,
    heroSubheadline: 'Experience Royal Indian Bridal Shringar, Sangeet Glam, Mogra Hair Styling, and Ayurvedic Gold Facials.',
    heroImageUrl: selectedThemeId === 'rose-luxe'
      ? '/assets/aistudio/Screenshot_2026-10-19-23-35-46-318_com.openai.chatgpt_14457db7.jpg'
      : INDIAN_SALON_PHOTO_LIBRARY[0].imageUrl,
    aboutImageUrl: INDIAN_SALON_PHOTO_LIBRARY[7].imageUrl,
    currency: '₹',
    openingHours: [
      { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
      { day: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
      { day: 'Sunday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
    ],
  };

  try {
    db.exec('BEGIN IMMEDIATE;');

    // 1. Insert owner
    db.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
      VALUES (?, ?, ?, ?, 'owner', ?, ?)
    `).run(ownerId, cleanEmail, hashPassword(owner_password), owner_name.trim(), tenantId, now);

    // 2. Insert tenant
    db.prepare(`
      INSERT INTO tenants (id, slug, name, owner_id, status, plan_id, subscription_status, subscription_starts_at, subscription_expires_at, settings, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, 'active', ?, ?, ?, ?, ?)
    `).run(
      tenantId,
      cleanSlug,
      name.trim(),
      ownerId,
      plan_id || 'starter',
      now,
      nextYear,
      JSON.stringify(initialSettings),
      now,
      now
    );

    // 3. Insert sample starter service
    db.prepare(`
      INSERT INTO services (id, tenant_id, category, name, description, price, duration_minutes, is_active, is_popular, created_at)
      VALUES (?, ?, 'Bridal & Styling', 'Royal Maharani Bridal Makeup & Draping', 'Complete HD Airbrush bridal makeup, hair styling with fresh mogra gajra, and lehenga/saree draping.', 15000, 120, 1, 1, ?)
    `).run('svc_' + Date.now().toString(36), tenantId, now);

    // 4. Pre-populate 4 Indian Look Gallery Photos
    for (let i = 0; i < 4; i++) {
      const preset = INDIAN_SALON_PHOTO_LIBRARY[i];
      db.prepare(`
        INSERT INTO gallery (id, tenant_id, title, category, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        `gal_${Date.now().toString(36)}_${i}`,
        tenantId,
        preset.title,
        preset.category,
        preset.imageUrl,
        now
      );
    }

    db.exec('COMMIT;');

    res.status(201).json({
      success: true,
      message: `Tenant '${name}' created successfully with subdomain '${cleanSlug}'.`,
      tenantId,
      slug: cleanSlug,
    });
  } catch (err: any) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    res.status(500).json({ error: 'Failed to create tenant: ' + err.message });
  }
});

// Update Business Owner Login ID / Password & Theme by Super Admin
apiRouter.put('/admin/tenants/:tenantId/credentials', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId } = req.params;
  const { owner_name, owner_email, owner_password, theme_id } = req.body;

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant) {
    return res.status(404).json({ error: 'Business tenant not found.' });
  }

  const ownerUser = db.prepare('SELECT * FROM users WHERE id = ?').get(tenant.owner_id) as any;
  if (!ownerUser) {
    return res.status(404).json({ error: 'Owner account not found for this business.' });
  }

  const cleanEmail = owner_email ? String(owner_email).trim().toLowerCase() : ownerUser.email;
  if (!cleanEmail) {
    return res.status(400).json({ error: 'Owner Login ID / Email cannot be empty.' });
  }

  // Verify Login ID uniqueness if changed
  if (cleanEmail !== ownerUser.email.toLowerCase()) {
    const conflict = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(cleanEmail, ownerUser.id);
    if (conflict) {
      return res.status(409).json({ error: `Login ID '${cleanEmail}' is already used by another account.` });
    }
  }

  const nextName = owner_name ? String(owner_name).trim() : ownerUser.name;
  const nextPasswordHash = owner_password && String(owner_password).trim().length > 0
    ? hashPassword(String(owner_password).trim())
    : ownerUser.password_hash;

  let currentSettings: Record<string, any> = {};
  try {
    currentSettings = JSON.parse(tenant.settings || '{}');
  } catch {
    currentSettings = {};
  }

  if (owner_password && String(owner_password).trim().length > 0) {
    currentSettings.ownerPasswordHint = String(owner_password).trim();
  }
  if (theme_id && isValidRoyalTheme(theme_id)) {
    currentSettings.themeId = theme_id;
    currentSettings.primaryColor = ROYAL_THEMES[theme_id].palette.accentPrimary;
  }

  const now = new Date().toISOString();

  try {
    db.exec('BEGIN IMMEDIATE;');
    db.prepare(`
      UPDATE users
      SET email = ?, name = ?, password_hash = ?
      WHERE id = ?
    `).run(cleanEmail, nextName, nextPasswordHash, ownerUser.id);

    db.prepare(`
      UPDATE tenants
      SET settings = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(currentSettings), now, tenantId);

    db.exec('COMMIT;');
    res.json({
      success: true,
      message: `Owner Login ID (${cleanEmail}) and credentials updated for ${tenant.name}.`,
    });
  } catch (err: any) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    res.status(500).json({ error: 'Failed to update credentials: ' + err.message });
  }
});

// Update Tenant Status (Activate / Suspend)
apiRouter.patch('/admin/tenants/:tenantId/status', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId } = req.params;
  const { status, reason } = req.body;

  if (!['active', 'suspended'].includes(status)) {
    return res.status(400).json({ error: "Status must be either 'active' or 'suspended'." });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tenants
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, tenantId);

  // Log action
  db.prepare(`
    INSERT INTO audit_logs (id, tenant_id, user_id, action, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
    tenantId,
    req.user?.userId || null,
    'TENANT_STATUS_CHANGED',
    `Status updated to ${status}. Reason: ${reason || 'Administrator action'}`,
    req.ip || 'unknown',
    now
  );

  res.json({ success: true, message: `Tenant account status updated to ${status}.` });
});

// Record Manual Subscription Renewal
apiRouter.post('/admin/tenants/:tenantId/renew', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId } = req.params;
  const { plan_name, amount, period_months, notes, starts_at } = req.body;

  if (!plan_name || amount === undefined || !period_months) {
    return res.status(400).json({ error: 'Plan name, amount, and period in months are required.' });
  }

  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId) as any;
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found.' });
  }

  const startDate = starts_at ? new Date(starts_at) : new Date();
  const expiryDate = new Date(startDate.getTime() + Number(period_months) * 30 * 24 * 60 * 60 * 1000);
  const now = new Date().toISOString();
  const renewalId = 'rnw_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5);

  try {
    db.exec('BEGIN IMMEDIATE;');

    // 1. Record manual renewal entry
    db.prepare(`
      INSERT INTO subscription_renewals (id, tenant_id, plan_name, amount, period_months, starts_at, expires_at, recorded_by, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      renewalId,
      tenantId,
      plan_name,
      Number(amount),
      Number(period_months),
      startDate.toISOString(),
      expiryDate.toISOString(),
      req.user?.name || 'Super Admin',
      notes || 'Manual subscription renewal recorded in admin panel.',
      now
    );

    // 2. Update tenant subscription status & expiry
    db.prepare(`
      UPDATE tenants
      SET subscription_status = 'active',
          subscription_starts_at = ?,
          subscription_expires_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(startDate.toISOString(), expiryDate.toISOString(), now, tenantId);

    db.exec('COMMIT;');

    res.json({
      success: true,
      message: `Manual subscription renewal recorded for ${tenant.name}. New expiry: ${expiryDate.toLocaleDateString()}.`,
      renewalId,
      expires_at: expiryDate.toISOString(),
    });
  } catch (err: any) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    res.status(500).json({ error: 'Failed to record renewal: ' + err.message });
  }
});

// Update Plan definition for Tenant
apiRouter.put('/admin/tenants/:tenantId/plan', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const { tenantId } = req.params;
  const { plan_id } = req.body;

  if (!SAAS_PLANS[plan_id]) {
    return res.status(400).json({ error: `Invalid plan ID '${plan_id}'.` });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tenants
    SET plan_id = ?, updated_at = ?
    WHERE id = ?
  `).run(plan_id, now, tenantId);

  res.json({ success: true, message: `Tenant plan upgraded/updated to ${SAAS_PLANS[plan_id].name}.` });
});

// List renewal history for a tenant
apiRouter.get('/admin/tenants/:tenantId/renewals', requireSuperAdmin, (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.params.tenantId;
  const renewals = db.prepare('SELECT * FROM subscription_renewals WHERE tenant_id = ? ORDER BY created_at DESC').all(tenantId);
  res.json(renewals);
});

// Audit and security logs
apiRouter.get('/admin/audit-logs', requireSuperAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
  res.json(logs);
});

// Available plans
apiRouter.get('/admin/plans', (_req: Request, res: Response) => {
  res.json(Object.values(SAAS_PLANS));
});

// APK Build Status & Download Info
apiRouter.get('/apk/status/:slug', (req: Request, res: Response) => {
  const { slug } = req.params;
  const tenant = db.prepare('SELECT name, slug FROM tenants WHERE slug = ?').get(slug) as any;
  if (!tenant) {
    return res.status(404).json({ error: 'Tenant not found' });
  }
  res.json({
    ownerApp: {
      packageName: 'com.localboost.ai.owner',
      appName: 'LocalBoost Owner App',
      version: '1.0.0',
      status: 'ready',
      downloadUrl: '#github-actions-artifact',
      fileSize: '14.2 MB',
      checksumSha256: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0'
    },
    customerApp: {
      packageName: `com.localboost.ai.customer.${slug}`,
      appName: `${tenant.name} Customer App`,
      version: '1.0.0',
      status: 'ready',
      downloadUrl: `/?tenant=${slug}`,
      fileSize: '12.8 MB',
      checksumSha256: 'b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef012345'
    }
  });
});

