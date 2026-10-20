import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from '../firebase.ts';
import { resolveSafeThemeId } from '../config/themes.ts';

// Regex and length constants verbatim from firebase-blueprint.json & firestore.rules
const ID_REGEX = /^[a-zA-Z0-9_\-]+$/;
const SLUG_REGEX = /^[a-z0-9\-]+$/;
const DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const TIME_REGEX = /^[0-9]{2}:[0-9]{2}$/;

function sanitizeId(raw: string, fallback: string): string {
  const cleaned = String(raw || fallback)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return ID_REGEX.test(cleaned) ? cleaned : fallback;
}

function sanitizeSlug(raw: string, fallback: string): string {
  const cleaned = String(raw || fallback)
    .toLowerCase()
    .replace(/[^a-z0-9\-]/g, '-')
    .slice(0, 64);
  return SLUG_REGEX.test(cleaned) ? cleaned : fallback;
}

function clampString(val: unknown, maxLen: number, minLen = 0, fallback = ''): string {
  const str = String(val ?? fallback).trim().slice(0, maxLen);
  if (str.length < minLen) {
    return fallback.padEnd(minLen, ' ').slice(0, maxLen);
  }
  return str;
}

export interface CloudSyncSummary {
  syncedAt: string;
  tenantSynced: boolean;
  servicesCount: number;
  galleryCount: number;
  bookingsCount: number;
  firestoreProjectId: string;
}

export const firebaseCloudSync = {
  /**
   * Sync a tenant's configuration, services, gallery, and bookings to Google Cloud Firestore.
   * Requires an authenticated Firebase user with emailVerified == true.
   */
  async syncTenantToFirestore(
    tenant: any,
    services: any[],
    gallery: any[],
    bookings: any[]
  ): Promise<CloudSyncSummary> {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid) {
      throw new Error('Please sign in with Google Firebase first to sync with Cloud Firestore.');
    }

    const ownerUid = sanitizeId(currentUser.uid, 'owner_default');
    const tenantId = sanitizeId(tenant.id, 'ten_royal_001');
    const settings = tenant.settings || {};

    // 1. Sync /tenants/{tenantId}
    const tenantPath = `tenants/${tenantId}`;
    const tenantRef = doc(db, 'tenants', tenantId);

    const statusAllowed = ['active', 'suspended', 'archived'];
    const safeStatus = statusAllowed.includes(tenant.status) ? tenant.status : 'active';
    const safeThemeId = resolveSafeThemeId(settings.themeId);

    let existingTenantSnap;
    try {
      existingTenantSnap = await getDoc(tenantRef);
    } catch (err) {
      // If doc does not exist yet or cannot be read prior to creation, treat as non-existent
      existingTenantSnap = null;
    }

    if (!existingTenantSnap || !existingTenantSnap.exists()) {
      const createPayload = {
        tenantId,
        slug: sanitizeSlug(tenant.slug, 'royal'),
        name: clampString(tenant.name, 120, 1, 'Royal Glow Parlour'),
        ownerId: ownerUid,
        status: safeStatus,
        planId: clampString(tenant.plan_id || 'pro', 40, 1, 'pro'),
        themeId: safeThemeId,
        tagline: clampString(settings.tagline, 250),
        heroTitle: clampString(settings.heroTitle, 200),
        heroSubtitle: clampString(settings.heroSubtitle, 500),
        heroImageUrl: clampString(settings.heroImageUrl, 500000),
        aboutImageUrl: clampString(settings.aboutImageUrl, 500000),
        logoUrl: clampString(settings.logoUrl, 500000),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      try {
        await setDoc(tenantRef, createPayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, tenantPath);
      }
    } else {
      const existingData = existingTenantSnap.data();
      const updatePayload = {
        tenantId: existingData.tenantId,
        slug: existingData.slug,
        name: clampString(tenant.name, 120, 1, existingData.name),
        ownerId: existingData.ownerId,
        status: existingData.status,
        planId: existingData.planId,
        themeId: safeThemeId,
        tagline: clampString(settings.tagline, 250),
        heroTitle: clampString(settings.heroTitle, 200),
        heroSubtitle: clampString(settings.heroSubtitle, 500),
        heroImageUrl: clampString(settings.heroImageUrl, 500000),
        aboutImageUrl: clampString(settings.aboutImageUrl, 500000),
        logoUrl: clampString(settings.logoUrl, 500000),
        createdAt: existingData.createdAt,
        updatedAt: serverTimestamp(),
      };
      try {
        await updateDoc(tenantRef, updatePayload);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, tenantPath);
      }
    }

    // 2. Sync /tenants/{tenantId}/services/{serviceId}
    let servicesSynced = 0;
    for (const srv of services) {
      const serviceId = sanitizeId(srv.id, `srv_${servicesSynced + 1}`);
      const servicePath = `tenants/${tenantId}/services/${serviceId}`;
      const serviceRef = doc(db, 'tenants', tenantId, 'services', serviceId);

      let existingSrv;
      try {
        existingSrv = await getDoc(serviceRef);
      } catch {
        existingSrv = null;
      }

      const safePrice = Math.max(0, Math.min(1000000, Number(srv.price) || 0));
      const safeDuration = Math.max(5, Math.min(1440, Number(srv.duration_minutes) || 60));

      if (!existingSrv || !existingSrv.exists()) {
        try {
          await setDoc(serviceRef, {
            serviceId,
            tenantId,
            ownerId: ownerUid,
            category: clampString(srv.category, 80, 1, 'General'),
            name: clampString(srv.name, 120, 1, 'Salon Service'),
            description: clampString(srv.description, 600),
            price: safePrice,
            durationMinutes: safeDuration,
            isActive: Boolean(srv.is_active ?? true),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          servicesSynced++;
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, servicePath);
        }
      } else {
        const ex = existingSrv.data();
        try {
          await updateDoc(serviceRef, {
            serviceId: ex.serviceId,
            tenantId: ex.tenantId,
            ownerId: ex.ownerId,
            category: clampString(srv.category, 80, 1, 'General'),
            name: clampString(srv.name, 120, 1, 'Salon Service'),
            description: clampString(srv.description, 600),
            price: safePrice,
            durationMinutes: safeDuration,
            isActive: Boolean(srv.is_active ?? true),
            createdAt: ex.createdAt,
            updatedAt: serverTimestamp(),
          });
          servicesSynced++;
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, servicePath);
        }
      }
    }

    // 3. Sync /tenants/{tenantId}/gallery/{itemId}
    let gallerySynced = 0;
    for (const item of gallery) {
      const itemId = sanitizeId(item.id, `gal_${gallerySynced + 1}`);
      const galleryPath = `tenants/${tenantId}/gallery/${itemId}`;
      const galleryRef = doc(db, 'tenants', tenantId, 'gallery', itemId);

      let existingGal;
      try {
        existingGal = await getDoc(galleryRef);
      } catch {
        existingGal = null;
      }

      if (!existingGal || !existingGal.exists()) {
        try {
          await setDoc(galleryRef, {
            itemId,
            tenantId,
            ownerId: ownerUid,
            title: clampString(item.title, 120, 1, 'Bridal Look'),
            category: clampString(item.category, 80, 1, 'Bridal Makeup'),
            imageUrl: clampString(item.image_url, 500000, 1, 'https://example.com/photo.jpg'),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          gallerySynced++;
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, galleryPath);
        }
      } else {
        const ex = existingGal.data();
        try {
          await updateDoc(galleryRef, {
            itemId: ex.itemId,
            tenantId: ex.tenantId,
            ownerId: ex.ownerId,
            title: clampString(item.title, 120, 1, 'Bridal Look'),
            category: clampString(item.category, 80, 1, 'Bridal Makeup'),
            imageUrl: clampString(item.image_url, 500000, 1, 'https://example.com/photo.jpg'),
            createdAt: ex.createdAt,
            updatedAt: serverTimestamp(),
          });
          gallerySynced++;
        } catch (error) {
          handleFirestoreError(error, OperationType.UPDATE, galleryPath);
        }
      }
    }

    // 4. Sync /tenants/{tenantId}/bookings/{bookingId}
    let bookingsSynced = 0;
    for (const bk of bookings) {
      const bookingId = sanitizeId(bk.id, `bk_${bookingsSynced + 1}`);
      const serviceId = sanitizeId(bk.service_id, services[0]?.id || 'srv_royal_1');
      const bookingPath = `tenants/${tenantId}/bookings/${bookingId}`;
      const bookingRef = doc(db, 'tenants', tenantId, 'bookings', bookingId);

      let existingBk;
      try {
        existingBk = await getDoc(bookingRef);
      } catch {
        existingBk = null;
      }

      const rawDate = String(bk.appointment_date || '2026-10-25').slice(0, 10);
      const safeDate = DATE_REGEX.test(rawDate) ? rawDate : '2026-10-25';
      const rawTime = String(bk.appointment_time || '11:00').slice(0, 5);
      const safeTime = TIME_REGEX.test(rawTime) ? rawTime : '11:00';
      const allowedStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      const safeBkStatus = allowedStatuses.includes(bk.status) ? bk.status : 'pending';

      if (!existingBk || !existingBk.exists()) {
        try {
          await setDoc(bookingRef, {
            bookingId,
            tenantId,
            ownerId: ownerUid,
            serviceId,
            customerName: clampString(bk.customer_name, 120, 1, 'Valued Client'),
            customerPhone: clampString(bk.customer_phone, 30, 7, '9876543210'),
            customerEmail: clampString(bk.customer_email, 150),
            appointmentDate: safeDate,
            appointmentTime: safeTime,
            status: safeBkStatus,
            customerNotes: clampString(bk.customer_notes, 500),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          bookingsSynced++;
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, bookingPath);
        }
      }
    }

    return {
      syncedAt: new Date().toISOString(),
      tenantSynced: true,
      servicesCount: servicesSynced,
      galleryCount: gallerySynced,
      bookingsCount: bookingsSynced,
      firestoreProjectId: db.app.options.projectId || 'firebase-cloud',
    };
  },

  /**
   * Fetch synced cloud records for the current authenticated owner from Firestore.
   */
  async getSyncedCountsFromFirestore(tenantIdRaw: string): Promise<{
    services: number;
    gallery: number;
    bookings: number;
  }> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { services: 0, gallery: 0, bookings: 0 };
    }
    const tenantId = sanitizeId(tenantIdRaw, 'ten_royal_001');
    const ownerUid = currentUser.uid;

    const servicesPath = `tenants/${tenantId}/services`;
    const galleryPath = `tenants/${tenantId}/gallery`;
    const bookingsPath = `tenants/${tenantId}/bookings`;

    let servicesCount = 0;
    let galleryCount = 0;
    let bookingsCount = 0;

    try {
      const srvSnap = await getDocs(
        query(collection(db, 'tenants', tenantId, 'services'), where('ownerId', '==', ownerUid))
      );
      servicesCount = srvSnap.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, servicesPath);
    }

    try {
      const galSnap = await getDocs(
        query(collection(db, 'tenants', tenantId, 'gallery'), where('ownerId', '==', ownerUid))
      );
      galleryCount = galSnap.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, galleryPath);
    }

    try {
      const bkSnap = await getDocs(
        query(collection(db, 'tenants', tenantId, 'bookings'), where('ownerId', '==', ownerUid))
      );
      bookingsCount = bkSnap.size;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, bookingsPath);
    }

    return {
      services: servicesCount,
      gallery: galleryCount,
      bookings: bookingsCount,
    };
  },
};
