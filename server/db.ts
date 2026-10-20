import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { INDIAN_SALON_PHOTO_LIBRARY } from '../src/config/indianPhotoLibrary.ts';
import { getRoseLuxeSalonHeroUri } from '../src/config/themes.ts';

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'glamhub.db');
export const db = new DatabaseSync(DB_PATH);

// Configure pragmas for performance and data integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function hashPassword(password: string): string {
  const salt = 'glamhub_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
      plan_id TEXT NOT NULL DEFAULT 'starter',
      subscription_status TEXT NOT NULL DEFAULT 'active' CHECK (subscription_status IN ('active', 'expired', 'suspended')),
      subscription_starts_at TEXT NOT NULL,
      subscription_expires_at TEXT NOT NULL,
      settings TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('superadmin', 'owner', 'staff')),
      tenant_id TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_popular INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      service_id TEXT NOT NULL REFERENCES services(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      appointment_date TEXT NOT NULL,
      appointment_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'completed', 'cancelled')),
      customer_notes TEXT,
      internal_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      service_tag TEXT NOT NULL,
      date TEXT NOT NULL,
      is_verified INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS subscription_renewals (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      plan_name TEXT NOT NULL,
      amount REAL NOT NULL,
      period_months INTEGER NOT NULL,
      starts_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      recorded_by TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      tenant_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
    CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_gallery_tenant ON gallery(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_tenant ON bookings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(tenant_id, appointment_date);
    CREATE INDEX IF NOT EXISTS idx_reviews_tenant ON reviews(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_renewals_tenant ON subscription_renewals(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
  `);

  seedInitialData();
  ensureTenantThemeDefaults();
}

function ensureTenantThemeDefaults() {
  const rows = db.prepare('SELECT id, slug, name, settings FROM tenants').all() as Array<{
    id: string;
    slug: string;
    name: string;
    settings: string;
  }>;

  const defaultBySlug: Record<string, string> = {
    royal: 'royal-gold',
    glamour: 'rose-luxe',
    aura: 'emerald-luxe',
    velvet: 'bridal-royale',
  };

  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.settings || '{}');
      let changed = false;
      if (!parsed.themeId) {
        parsed.themeId = defaultBySlug[row.slug] || 'royal-gold';
        changed = true;
      }
      // If heroImageUrl was a legacy unsplash link or old watermarked SVG, clear it so the active theme's own hero backdrop loads automatically
      if (
        parsed.heroImageUrl &&
        (parsed.heroImageUrl.includes('images.unsplash.com') ||
          parsed.heroImageUrl.startsWith('data:image/svg+xml'))
      ) {
        parsed.heroImageUrl = '';
        changed = true;
      }
      if (!parsed.aboutImageUrl || parsed.aboutImageUrl.includes('images.unsplash.com') || parsed.aboutImageUrl.startsWith('data:image/svg+xml')) {
        parsed.aboutImageUrl = INDIAN_SALON_PHOTO_LIBRARY[7].imageUrl; // Watermark-free Heritage Salon Suite
        changed = true;
      }
      if (parsed.logoUrl && (parsed.logoUrl.includes('images.unsplash.com') || parsed.logoUrl.startsWith('data:image/svg+xml'))) {
        parsed.logoUrl = INDIAN_SALON_PHOTO_LIBRARY[8].imageUrl; // Watermark-free Gold Crest
        changed = true;
      }
      // Clean foreign addresses / currencies / emails from initial demo tenants
      if (parsed.city && (parsed.city.includes('Beverly Hills') || parsed.city.includes('Miami') || parsed.city.includes('Portland') || parsed.city.includes('New York'))) {
        parsed.city = 'Ahmedabad';
        parsed.address = 'CG Road, Navrangpura';
        parsed.phone = '+91 98765 43210';
        parsed.currency = '₹';
        changed = true;
      }
      if (parsed.email && (parsed.email.includes('royalblossom') || parsed.email.includes('glamourlounge') || parsed.email.includes('aurabotanicals') || parsed.email.includes('velvetchic'))) {
        parsed.email = `contact@${row.slug}.com`;
        changed = true;
      }
      if (changed) {
        db.prepare('UPDATE tenants SET settings = ? WHERE id = ?').run(JSON.stringify(parsed), row.id);
      }
    } catch {
      // Keep existing row untouched if malformed
    }
  }

  // Upgrade all gallery photos that use unsplash or old watermarked SVGs to the watermark-free Indian Salon Photo Library
  const galleryRows = db.prepare('SELECT id, title, category, image_url FROM gallery').all() as Array<{
    id: string;
    title: string;
    category: string;
    image_url: string;
  }>;

  let presetIndex = 0;
  for (const gRow of galleryRows) {
    if (
      !gRow.image_url ||
      gRow.image_url.includes('images.unsplash.com') ||
      gRow.image_url.startsWith('data:image/svg+xml')
    ) {
      const preset = INDIAN_SALON_PHOTO_LIBRARY[presetIndex % 8];
      presetIndex++;
      db.prepare('UPDATE gallery SET title = ?, category = ?, image_url = ? WHERE id = ?').run(
        preset.title,
        preset.category,
        preset.imageUrl,
        gRow.id
      );
    }
  }

  // Clean any foreign salon names from seeded reviews so no third-party branding ever appears
  db.prepare(`
    UPDATE reviews
    SET author_name = 'Priya Sharma',
        comment = 'Amazing bridal makeup and hair styling! The team made my wedding day look truly royal and flawless.'
    WHERE comment LIKE '%Genevieve%' OR comment LIKE '%Royal Blossom%'
  `).run();
}

function seedInitialData() {
  const userCount = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return; // Already initialized
  }

  const now = new Date().toISOString();
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // 1. Super Admin
  const adminId = 'usr_superadmin_01';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(adminId, 'admin@glamhub.com', hashPassword('SuperAdmin2026!'), 'Victoria Sterling (Super Admin)', 'superadmin', null, now);

  // 2. Tenant 1: Royal Blossom Couture & Spa (Slug: royal)
  const tenant1Id = 'ten_royal_001';
  const owner1Id = 'usr_owner_royal';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(owner1Id, 'owner.royal@glamhub.com', hashPassword('RoyalPass123!'), 'Madame Genevieve Roy', 'owner', tenant1Id, now);

  const royalSettings = {
    themeId: 'royal-gold',
    tagline: 'High-Fashion Hair Artistry & Holistic Skin Sanctuary',
    phone: '+1 (555) 234-8901',
    email: 'concierge@royalblossom.com',
    address: '450 Haute Boulevard, Suite 100',
    city: 'Beverly Hills, CA 90210',
    mapEmbedUrl: 'https://maps.google.com',
    primaryColor: '#be123c', // Luxury Rose Red
    secondaryColor: '#f43f5e',
    heroHeadline: 'Exquisite Hair Artistry & Rejuvenating Spa Sanctuaries',
    heroSubheadline: 'Immerse in bespoke couture styling, master balayage, and clinical age-defying facials curated by our celebrity artisans.',
    heroImageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1200&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=200&q=80',
    currency: '$',
    noticeBanner: 'Spring Bridal Packages Now Open — Reserve early for wedding season consultations.',
    openingHours: [
      { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '19:00' },
      { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
      { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '20:00' },
      { day: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
    ],
    socialLinks: {
      instagram: 'https://instagram.com/royalblossom',
      facebook: 'https://facebook.com/royalblossom',
      whatsapp: '+15552348901',
    },
  };

  db.prepare(`
    INSERT INTO tenants (id, slug, name, owner_id, status, plan_id, subscription_status, subscription_starts_at, subscription_expires_at, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tenant1Id,
    'royal',
    'Royal Blossom Couture & Spa',
    owner1Id,
    'active',
    'pro',
    'active',
    now,
    nextYear,
    JSON.stringify(royalSettings),
    now,
    now
  );

  // Tenant 1 Services
  const royalServices = [
    { id: 'svc_r1', cat: 'Bridal & Styling', name: 'Signature Bridal Hair & Glow Couture', desc: 'Complete bespoke wedding day hair sculpture, veil placement, and radiant airbrush makeup with trial included.', price: 380, dur: 120, pop: 1 },
    { id: 'svc_r2', cat: 'Hair Color', name: 'Parisian Master Balayage & Glaze', desc: 'Custom hand-painted French balayage, botanical bond protector, gloss toner, and blowdry blowout.', price: 260, dur: 150, pop: 1 },
    { id: 'svc_r3', cat: 'Facial & Skin', name: '24K Gold Cellular Renewal Facial', desc: 'Infusion of pure 24-karat gold leaf, hyaluronic deep micro-current, and lymphatic drainage contour massage.', price: 195, dur: 75, pop: 1 },
    { id: 'svc_r4', cat: 'Nail Lounge', name: 'Royal Velvet Spa Manicure & Pedicure', desc: 'Rose petal foot soak, organic scrub exfoliation, hot stone calf massage, and paraffin hydration treatment.', price: 110, dur: 90, pop: 0 },
    { id: 'svc_r5', cat: 'Hair Treatment', name: 'Organic Brazilian Keratin Gloss Infusion', desc: 'Formaldehyde-free smoothing treatment that restores ultra-shine, eliminates frizz, and seals split ends for 4 months.', price: 290, dur: 120, pop: 0 },
    { id: 'svc_r6', cat: 'Facial & Skin', name: 'Diamond Dermabrasion & Oxygen Peel', desc: 'Medical-grade crystal exfoliation paired with pure hyperbaric oxygen hyper-infusion for instant luminosity.', price: 165, dur: 60, pop: 0 },
  ];

  for (const s of royalServices) {
    db.prepare(`
      INSERT INTO services (id, tenant_id, category, name, description, price, duration_minutes, is_active, is_popular, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(s.id, tenant1Id, s.cat, s.name, s.desc, s.price, s.dur, 1, s.pop, now);
  }

  // Tenant 1 Gallery
  const royalGallery = [
    { id: 'gal_r1', title: 'Haute Bridal Chignon', cat: 'Bridal', url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_r2', title: 'Dimensional Honey Balayage', cat: 'Color', url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_r3', title: 'Luxury 24K Facial Treatment', cat: 'Aesthetics', url: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_r4', title: 'Velvet Rose Nail Artistry', cat: 'Nails', url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_r5', title: 'Couture Editorial Curls', cat: 'Styling', url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_r6', title: 'Luxe Private Sanctuary Room', cat: 'Interior', url: 'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80' },
  ];

  for (const g of royalGallery) {
    db.prepare(`
      INSERT INTO gallery (id, tenant_id, title, category, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(g.id, tenant1Id, g.title, g.cat, g.url, now);
  }

  // Tenant 1 Reviews
  const royalReviews = [
    { id: 'rev_r1', author: 'Sophia Vanderbilt', rating: 5, comment: 'Genevieve and her team designed my wedding day hair and makeup. I have never felt more radiant! Absolute perfection.', tag: 'Bridal & Styling', date: '2026-09-14' },
    { id: 'rev_r2', author: 'Elena Rostova', rating: 5, comment: 'The 24K Gold Cellular facial erased months of travel fatigue within 75 minutes. The atmosphere is quiet, opulent, and ultra-hygienic.', tag: 'Facial & Skin', date: '2026-10-02' },
    { id: 'rev_r3', author: 'Camilla Dupont', rating: 5, comment: 'My balayage has that seamless Californian-sunlit blend. Royal Blossom is easily the best salon in town.', tag: 'Hair Color', date: '2026-10-11' },
  ];

  for (const r of royalReviews) {
    db.prepare(`
      INSERT INTO reviews (id, tenant_id, author_name, rating, comment, service_tag, date, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(r.id, tenant1Id, r.author, r.rating, r.comment, r.tag, r.date, 1);
  }

  // Tenant 1 Bookings (Realistic initial bookings)
  const royalBookings = [
    {
      id: 'bk_r001',
      service_id: 'svc_r1',
      name: 'Charlotte Kensington',
      phone: '+1 (555) 782-9912',
      email: 'charlotte.k@luxurymail.com',
      date: '2026-10-22',
      time: '10:00',
      endTime: '12:00',
      status: 'confirmed',
      notes: 'Final bridal styling rehearsal ahead of Saturday ceremony.',
    },
    {
      id: 'bk_r002',
      service_id: 'svc_r3',
      name: 'Isabella Moreno',
      phone: '+1 (555) 341-8844',
      email: 'isabella.m@gmail.com',
      date: '2026-10-22',
      time: '14:00',
      endTime: '15:15',
      status: 'pending',
      notes: 'Please recommend skincare aftercare products.',
    },
    {
      id: 'bk_r003',
      service_id: 'svc_r2',
      name: 'Miriam Al-Hassan',
      phone: '+1 (555) 902-1133',
      email: 'miriam.h@outlook.com',
      date: '2026-10-23',
      time: '11:00',
      endTime: '13:30',
      status: 'pending',
      notes: 'First time visiting. Looking for subtle honey tones.',
    },
  ];

  for (const b of royalBookings) {
    db.prepare(`
      INSERT INTO bookings (id, tenant_id, service_id, customer_name, customer_phone, customer_email, appointment_date, appointment_time, end_time, status, customer_notes, internal_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(b.id, tenant1Id, b.service_id, b.name, b.phone, b.email, b.date, b.time, b.endTime, b.status, b.notes, '', now, now);
  }

  // 3. Tenant 2: Glamour Lounge Aesthetics (Slug: glamour)
  const tenant2Id = 'ten_glamour_002';
  const owner2Id = 'usr_owner_glamour';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(owner2Id, 'owner.glamour@glamhub.com', hashPassword('GlamPass123!'), 'Kendra Morales', 'owner', tenant2Id, now);

  const glamourSettings = {
    themeId: 'rose-luxe',
    tagline: 'BECAUSE YOU DESERVE TO SHINE',
    phone: '+1 (555) 492-7711',
    email: 'hello@glamourlounge.com',
    address: '88 Fashion Walkway, Floor 2',
    city: 'Miami, FL 33139',
    mapEmbedUrl: 'https://maps.google.com',
    primaryColor: '#7c3aed', // Chic Violet / Lavender
    secondaryColor: '#a855f7',
    heroHeadline: 'Modern Beauty Architecture for the Trendsetter',
    heroSubheadline: 'Specialized in precision lash extensions, Korean glass-skin facials, and structured brow laminations.',
    heroImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=200&q=80',
    currency: '$',
    noticeBanner: 'Grand Opening Specials: Mention Instagram for complimentary collagen hand mask.',
    openingHours: [
      { day: 'Monday', isOpen: true, openTime: '10:00', closeTime: '19:00' },
      { day: 'Tuesday', isOpen: true, openTime: '10:00', closeTime: '19:00' },
      { day: 'Wednesday', isOpen: true, openTime: '10:00', closeTime: '19:00' },
      { day: 'Thursday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
      { day: 'Friday', isOpen: true, openTime: '10:00', closeTime: '20:00' },
      { day: 'Saturday', isOpen: true, openTime: '10:00', closeTime: '18:00' },
      { day: 'Sunday', isOpen: true, openTime: '11:00', closeTime: '16:00' },
    ],
    socialLinks: {
      instagram: 'https://instagram.com/glamourlounge',
      facebook: 'https://facebook.com/glamourlounge',
      tiktok: 'https://tiktok.com/@glamourlounge',
    },
  };

  db.prepare(`
    INSERT INTO tenants (id, slug, name, owner_id, status, plan_id, subscription_status, subscription_starts_at, subscription_expires_at, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tenant2Id,
    'glamour',
    'Glamour Lounge Aesthetics',
    owner2Id,
    'active',
    'growth',
    'active',
    now,
    nextYear,
    JSON.stringify(glamourSettings),
    now,
    now
  );

  // Tenant 2 Services
  const glamourServices = [
    { id: 'svc_g1', cat: 'Lash Studio', name: 'Russian Volume Velvet Lash Extensions', desc: 'Handcrafted ultra-light Russian volume fans for dramatic density and lightweight comfort.', price: 185, dur: 90, pop: 1 },
    { id: 'svc_g2', cat: 'Brows', name: 'HD Brow Lamination & Tint Sculpt', desc: 'Keratin infused brow lifting, shaping, and long-lasting bespoke tint for bold natural arches.', price: 85, dur: 45, pop: 1 },
    { id: 'svc_g3', cat: 'Skin Clinic', name: 'Korean Hydration Glass-Skin Glow', desc: 'Multi-step Korean ampoule ultrasonic infusion, LED light therapy, and spirulina rubber mask.', price: 140, dur: 60, pop: 1 },
    { id: 'svc_g4', cat: 'Lash Studio', name: 'Lash Lift & Deep Keratin Glaze', desc: 'Natural lash curl lift lasting 6 to 8 weeks with deep nourishing black keratin pigment.', price: 95, dur: 50, pop: 0 },
  ];

  for (const s of glamourServices) {
    db.prepare(`
      INSERT INTO services (id, tenant_id, category, name, description, price, duration_minutes, is_active, is_popular, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(s.id, tenant2Id, s.cat, s.name, s.desc, s.price, s.dur, 1, s.pop, now);
  }

  // Tenant 2 Gallery
  const glamourGallery = [
    { id: 'gal_g1', title: 'Mega Volume Lash Art', cat: 'Lashes', url: 'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_g2', title: 'Glass Skin Radiance', cat: 'Facial', url: 'https://images.unsplash.com/photo-1512290900672-1f4869c968f7?auto=format&fit=crop&w=800&q=80' },
    { id: 'gal_g3', title: 'Feather Brow Sculpting', cat: 'Brows', url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?auto=format&fit=crop&w=800&q=80' },
  ];

  for (const g of glamourGallery) {
    db.prepare(`
      INSERT INTO gallery (id, tenant_id, title, category, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(g.id, tenant2Id, g.title, g.cat, g.url, now);
  }

  // Tenant 2 Bookings
  const glamourBookings = [
    {
      id: 'bk_g001',
      service_id: 'svc_g1',
      name: 'Maya Lin',
      phone: '+1 (555) 612-4409',
      email: 'maya.lin@designer.co',
      date: '2026-10-24',
      time: '13:00',
      endTime: '14:30',
      status: 'confirmed',
      notes: 'Prefers cat-eye mapping styling.',
    },
  ];

  for (const b of glamourBookings) {
    db.prepare(`
      INSERT INTO bookings (id, tenant_id, service_id, customer_name, customer_phone, customer_email, appointment_date, appointment_time, end_time, status, customer_notes, internal_notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(b.id, tenant2Id, b.service_id, b.name, b.phone, b.email, b.date, b.time, b.endTime, b.status, b.notes, '', now, now);
  }

  // 4. Tenant 3: Aura Botanical Salon (Slug: aura) - Expired Subscription demo
  const tenant3Id = 'ten_aura_003';
  const owner3Id = 'usr_owner_aura';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(owner3Id, 'owner.aura@glamhub.com', hashPassword('AuraPass123!'), 'Silvia Greene', 'owner', tenant3Id, now);

  const auraSettings = {
    themeId: 'emerald-luxe',
    tagline: 'Organic Hair Herbal Care & Ayurvedic Therapy',
    phone: '+1 (555) 777-3321',
    email: 'info@aurabotanicals.com',
    address: '12 Green Leaf Plaza',
    city: 'Portland, OR 97201',
    primaryColor: '#059669', // Emerald green
    heroHeadline: 'Pure Botanical Organic Beauty Rituals',
    heroSubheadline: 'Zero chemical toxins, 100% certified organic herbal hair coloring and holistic head spas.',
    currency: '$',
    openingHours: [
      { day: 'Monday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'Tuesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'Wednesday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'Thursday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'Friday', isOpen: true, openTime: '09:00', closeTime: '17:00' },
      { day: 'Saturday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
      { day: 'Sunday', isOpen: false, openTime: '10:00', closeTime: '16:00' },
    ],
  };

  db.prepare(`
    INSERT INTO tenants (id, slug, name, owner_id, status, plan_id, subscription_status, subscription_starts_at, subscription_expires_at, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tenant3Id,
    'aura',
    'Aura Botanical Salon',
    owner3Id,
    'active',
    'starter',
    'expired', // EXPIRED SUBSCRIPTION
    pastDate,
    yesterday,
    JSON.stringify(auraSettings),
    now,
    now
  );

  // 5. Tenant 4: Velvet Chic Parlour (Slug: velvet) - Suspended demo
  const tenant4Id = 'ten_velvet_004';
  const owner4Id = 'usr_owner_velvet';
  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, role, tenant_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(owner4Id, 'owner.velvet@glamhub.com', hashPassword('VelvetPass123!'), 'Vivienne Fox', 'owner', tenant4Id, now);

  const velvetSettings = {
    themeId: 'bridal-royale',
    tagline: 'Glamour & Nail Studio',
    phone: '+1 (555) 998-1122',
    email: 'contact@velvetchic.com',
    address: '77 Broad Street',
    city: 'New York, NY 10004',
    primaryColor: '#db2777',
    heroHeadline: 'High-Impact Nails & Express Beauty',
    heroSubheadline: 'Express blowout and luxury acrylic nails.',
    currency: '$',
    openingHours: [],
  };

  db.prepare(`
    INSERT INTO tenants (id, slug, name, owner_id, status, plan_id, subscription_status, subscription_starts_at, subscription_expires_at, settings, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    tenant4Id,
    'velvet',
    'Velvet Chic Parlour',
    owner4Id,
    'suspended', // SUSPENDED BY ADMIN
    'growth',
    'suspended',
    pastDate,
    nextYear,
    JSON.stringify(velvetSettings),
    now,
    now
  );

  // Record initial renewal history for Tenant 1
  db.prepare(`
    INSERT INTO subscription_renewals (id, tenant_id, plan_name, amount, period_months, starts_at, expires_at, recorded_by, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('rnw_001', tenant1Id, 'Luxury Pro & Spa', 149.0, 12, now, nextYear, 'Victoria Sterling (Super Admin)', 'Annual onboarding discount verified by manual bank wire transfer.', now);

  console.log('Database initialized and successfully seeded with realistic multi-tenant data.');
}
