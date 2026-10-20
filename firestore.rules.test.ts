/**
 * Firestore Security Rules Adversarial Test Suite ("Dirty Dozen" Verification)
 * Verifies that all 12 adversarial payloads defined in security_spec.md return PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: {
    uid: string;
    email: string;
    email_verified: boolean;
  } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on Tenant Create (ownerId != request.auth.uid)',
    operation: 'create',
    path: '/tenants/ten_royal_001',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      tenantId: 'ten_royal_001',
      slug: 'royal',
      name: 'Royal Parlour',
      ownerId: 'spoofed_other_user_uid',
      status: 'active',
      planId: 'pro',
      themeId: 'royal-gold',
      tagline: 'Luxury',
      heroTitle: 'Royal',
      heroSubtitle: 'Bridal',
      heroImageUrl: 'https://example.com/h.jpg',
      aboutImageUrl: 'https://example.com/a.jpg',
      logoUrl: 'https://example.com/l.jpg',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow Field Injection on Tenant Update',
    operation: 'update',
    path: '/tenants/ten_royal_001',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      name: 'Royal Parlour Updated',
      isSuperVerified: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Admin Spoof (email_verified == false)',
    operation: 'update',
    path: '/tenants/ten_royal_001',
    auth: { uid: 'attacker_1', email: 'ladanikishan8@gmail.com', email_verified: false },
    payload: {
      status: 'suspended',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'ID Poisoning / Invalid Characters in Document ID',
    operation: 'create',
    path: '/tenants/ten_royal_001/services/invalid$id!with@symbols',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      serviceId: 'invalid$id!with@symbols',
      tenantId: 'ten_royal_001',
      ownerId: 'user_owner_1',
      category: 'Bridal',
      name: 'Bridal Makeup',
      description: 'HD Makeup',
      price: 15000,
      durationMinutes: 120,
      isActive: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Orphaned Subcollection Write (Non-Existent Parent Tenant)',
    operation: 'create',
    path: '/tenants/non_existent_tenant/services/srv_01',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      serviceId: 'srv_01',
      tenantId: 'non_existent_tenant',
      ownerId: 'user_owner_1',
      category: 'Bridal',
      name: 'Bridal Makeup',
      description: 'HD Makeup',
      price: 15000,
      durationMinutes: 120,
      isActive: true,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Cross-Tenant Service Hijack by Another Tenant Owner',
    operation: 'update',
    path: '/tenants/ten_royal_001/services/srv_01',
    auth: { uid: 'user_owner_2', email: 'owner2@example.com', email_verified: true },
    payload: {
      price: 1,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Value Poisoning on Whitelisted Update Field (Invalid Theme Enum)',
    operation: 'update',
    path: '/tenants/ten_royal_001',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      themeId: 'hacked-theme-id',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Immortal Field Mutation (Attempting to change ownerId on update)',
    operation: 'update',
    path: '/tenants/ten_royal_001',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      ownerId: 'hacker_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Client Timestamp Forgery (createdAt != request.time)',
    operation: 'create',
    path: '/tenants/ten_royal_001/gallery/gal_01',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      itemId: 'gal_01',
      tenantId: 'ten_royal_001',
      ownerId: 'user_owner_1',
      title: 'Bridal Look',
      category: 'Bridal Makeup',
      imageUrl: 'https://example.com/photo.jpg',
      createdAt: '1999-01-01T00:00:00Z',
      updatedAt: '1999-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'PII Blanket Read / Cross-Tenant Booking Scrape',
    operation: 'list',
    path: '/tenants/ten_royal_001/bookings',
    auth: { uid: 'random_signed_in_user', email: 'random@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Terminal State Unlocking Attack (Updating completed booking)',
    operation: 'update',
    path: '/tenants/ten_royal_001/bookings/bk_completed_01',
    auth: { uid: 'user_owner_1', email: 'owner1@example.com', email_verified: true },
    payload: {
      status: 'pending',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Self-Assigned Admin Privilege Escalation',
    operation: 'create',
    path: '/admins/attacker_uid',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      adminId: 'attacker_uid',
      email: 'attacker@example.com',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
];
