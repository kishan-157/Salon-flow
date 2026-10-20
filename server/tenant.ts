import { Request } from 'express';
import { firestoreDb } from './db.ts';

export const RESERVED_SUBDOMAINS = new Set([
  'app',
  'admin',
  'api',
  'www',
  'localhost',
  'staging',
  'dev',
  'demo',
  'mail',
  'static',
  'assets',
  'dashboard',
  'superadmin',
  'platform',
  'glamhub',
  'test',
]);

export interface TenantResolutionResult {
  isTenantSite: boolean;
  tenantSlug: string | null;
  tenant: any | null;
  status: 'valid' | 'platform' | 'reserved' | 'not_found' | 'suspended' | 'expired' | 'invalid_host';
  reason?: string;
}

/**
 * Normalizes hostnames and resolves tenant identity safely using Firestore.
 */
export async function resolveTenantFromRequest(req: Request): Promise<TenantResolutionResult> {
  const headerSlug = req.headers['x-tenant-slug'];
  const querySlug = req.query.tenant || req.query.tenant_slug;

  let candidateSlug: string | null = null;

  if (typeof headerSlug === 'string' && headerSlug.trim()) {
    candidateSlug = headerSlug.trim().toLowerCase();
  } else if (typeof querySlug === 'string' && querySlug.trim()) {
    candidateSlug = querySlug.trim().toLowerCase();
  } else {
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = Array.isArray(rawHost) ? rawHost[0] : rawHost.split(',')[0].trim();
    const cleanHost = host.split(':')[0].toLowerCase();

    const parts = cleanHost.split('.');

    if (parts.length >= 3 && !cleanHost.includes('run.app')) {
      const subdomain = parts[0];
      if (RESERVED_SUBDOMAINS.has(subdomain)) {
        return { isTenantSite: false, tenantSlug: subdomain, tenant: null, status: 'reserved' };
      }
      candidateSlug = subdomain;
    }
  }

  if (!candidateSlug) {
    return { isTenantSite: false, tenantSlug: null, tenant: null, status: 'platform' };
  }

  if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(candidateSlug)) {
    return {
      isTenantSite: false,
      tenantSlug: candidateSlug,
      tenant: null,
      status: 'invalid_host',
      reason: 'Malformed or invalid subdomain format',
    };
  }

  if (RESERVED_SUBDOMAINS.has(candidateSlug)) {
    return { isTenantSite: false, tenantSlug: candidateSlug, tenant: null, status: 'reserved' };
  }

  // Query Firestore for tenant
  const tenantsSnap = await firestoreDb.collection('tenants').where('slug', '==', candidateSlug).limit(1).get();
  if (tenantsSnap.empty) {
    return {
      isTenantSite: true,
      tenantSlug: candidateSlug,
      tenant: null,
      status: 'not_found',
      reason: `No salon parlour found registered under subdomain '${candidateSlug}'.`,
    };
  }

  const tenantDoc = tenantsSnap.docs[0];
  const tenant = tenantDoc.data();

  // Fetch owner details if available
  if (tenant.owner_id) {
    const ownerDoc = await firestoreDb.collection('users').doc(tenant.owner_id).get();
    if (ownerDoc.exists) {
      const owner = ownerDoc.data() as any;
      tenant.owner_name = owner.name;
      tenant.owner_email = owner.email;
    }
  }

  try {
    tenant.settings = typeof tenant.settings === 'string' ? JSON.parse(tenant.settings) : tenant.settings;
  } catch {
    tenant.settings = {};
  }

  if (tenant.status === 'suspended') {
    return {
      isTenantSite: true,
      tenantSlug: candidateSlug,
      tenant,
      status: 'suspended',
      reason: 'This salon website is currently suspended by platform administration.',
    };
  }

  const now = new Date().toISOString();
  if (tenant.subscription_status === 'expired' || tenant.subscription_expires_at < now) {
    return {
      isTenantSite: true,
      tenantSlug: candidateSlug,
      tenant,
      status: 'expired',
      reason: 'This salon subscription has expired. Public appointments are temporarily paused.',
    };
  }

  return {
    isTenantSite: true,
    tenantSlug: candidateSlug,
    tenant,
    status: 'valid',
  };
}
