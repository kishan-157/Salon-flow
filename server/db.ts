import { createRequire } from 'node:module';
import crypto from 'node:crypto';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const require = createRequire(import.meta.url);
const rawAdmin = require('firebase-admin');
const adminSDK: any = rawAdmin.default?.default || rawAdmin.default || rawAdmin;
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin SDK for Serverless / Node.js
if (!adminSDK.apps || !adminSDK.apps.length) {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminSDK.initializeApp({
        credential: adminSDK.credential.cert(serviceAccount),
        projectId: firebaseConfig.projectId,
      });
    } else {
      adminSDK.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
  } catch (err) {
    console.error('Firebase Admin initialization fallback error:', err);
    try {
      adminSDK.initializeApp({
        projectId: firebaseConfig.projectId,
      });
    } catch (e) {
      console.error('Fatal Firebase init error:', e);
    }
  }
}

let dbInstance: any = null;
try {
  dbInstance = getFirestore(adminSDK, firebaseConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  try {
    dbInstance = getFirestore(adminSDK);
  } catch (err) {
    console.error('Could not initialize Firestore instance:', err);
  }
}

export const firestoreDb = dbInstance;

export function hashPassword(password: string): string {
  const salt = 'glamhub_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export async function initFirestore() {
  if (!firestoreDb) {
    console.warn('Firestore DB not available. Skipping initial seed.');
    return;
  }
  try {
    console.log('Checking Firestore connection & seeding initial data if empty...');
    const usersRef = firestoreDb.collection('users');
    const adminSnap = await usersRef.where('role', '==', 'superadmin').limit(1).get();

    if (adminSnap.empty) {
      console.log('Seeding Super Admin and default tenants into Firestore...');
      
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

      // 1. Seed Super Admins
      await usersRef.doc('usr_super_001').set({
        id: 'usr_super_001',
        email: 'ladanikishan8@gmail.com',
        password_hash: hashPassword('12345678'),
        name: 'Kishan Ladani (Super Admin)',
        role: 'superadmin',
        tenant_id: null,
        created_at: now
      });

      await usersRef.doc('usr_super_002').set({
        id: 'usr_super_002',
        email: 'admin@glamhub.com',
        password_hash: hashPassword('SuperAdmin2026!'),
        name: 'System Super Admin',
        role: 'superadmin',
        tenant_id: null,
        created_at: now
      });

      // 2. Seed Default Tenants
      const tenantsRef = firestoreDb.collection('tenants');
      
      const tenant1 = {
        id: 'ten_royal_001',
        slug: 'royal',
        name: 'Royal Glow Luxury Salon',
        owner_id: 'usr_owner_001',
        status: 'active',
        plan_id: 'pro',
        subscription_status: 'active',
        subscription_starts_at: now,
        subscription_expires_at: future,
        settings: JSON.stringify({
          tagline: 'Experience Regal Beauty & Grooming',
          heroTitle: 'Luxury Hair & Skin Care in Mumbai',
          heroSubtitle: 'Step into elegance with master stylists and premium organic products.',
          themeId: 'royal-gold',
          phone: '+91 98765 43210',
          address: 'Linking Road, Bandra West, Mumbai',
          currency: '₹'
        }),
        created_at: now,
        updated_at: now
      };

      await tenantsRef.doc(tenant1.id).set(tenant1);

      await usersRef.doc('usr_owner_001').set({
        id: 'usr_owner_001',
        email: 'royal@glamhub.com',
        password_hash: hashPassword('owner123'),
        name: 'Rajesh Royal',
        role: 'owner',
        tenant_id: tenant1.id,
        created_at: now
      });

      // Seed Services for Royal Glow
      const servicesRef = firestoreDb.collection('services');
      await servicesRef.doc('srv_royal_001').set({
        id: 'srv_royal_001',
        tenant_id: tenant1.id,
        category: 'Hair Styling',
        name: 'Royal Signature Haircut & Styling',
        description: 'Includes consultation, shampoo, precision haircut, blowdry and luxury styling.',
        price: 1200,
        duration_minutes: 45,
        is_active: 1,
        is_popular: 1,
        created_at: now
      });

      await servicesRef.doc('srv_royal_002').set({
        id: 'srv_royal_002',
        tenant_id: tenant1.id,
        category: 'Skin Care',
        name: '24K Gold Facial Treatment',
        description: 'Rejuvenating facial infused with 24K pure gold foil for radiant glowing skin.',
        price: 3500,
        duration_minutes: 60,
        is_active: 1,
        is_popular: 1,
        created_at: now
      });

      console.log('Firestore initial seeding completed successfully.');
    } else {
      console.log('Firestore already contains data. Skipping initial seed.');
    }
  } catch (err) {
    console.error('Error during Firestore initialization/seeding:', err);
  }
}
