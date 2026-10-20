import { Request } from 'express';
import { db } from './db.ts';

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
 * Normalizes hostnames and resolves tenant identity safely.
 * Handles production custom subdomains (e.g., royal.glamhub.com),
 * verified query parameter/headers for preview iframe (e.g., ?tenant=royal or X-Tenant-Slug),
 * and prevents host header injection/spoofing.
 */
export function resolveTenantFromRequest(req: Request): TenantResolutionResult {
  // 1. Check verified explicit query or header override (for iframe preview / testing)
  const headerSlug = req.headers['x-tenant-slug'];
  const querySlug = req.query.tenant || req.query.tenant_slug;

  let candidateSlug: string | null = null;

  if (typeof headerSlug === 'string' && headerSlug.trim()) {
    candidateSlug = headerSlug.trim().toLowerCase();
  } else if (typeof querySlug === 'string' && querySlug.trim()) {
    candidateSlug = querySlug.trim().toLowerCase();
  } else {
    // 2. Parse host header
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const host = Array.isArray(rawHost) ? rawHost[0] : rawHost.split(',')[0].trim();
    const cleanHost = host.split(':')[0].toLowerCase();

    // Check if host matches typical SaaS domain patterns (e.g., [slug].domain.com)
    const parts = cleanHost.split('.');

    // If it's an IP address or single part localhost, treat as platform main host
    if (parts.length >= 3 && !cleanHost.includes('run.app')) {
      const subdomain = parts[0];
      if (RESERVED_SUBDOMAINS.has(subdomain)) {
        return { isTenantSite: false, tenantSlug: subdomain, tenant: null, status: 'reserved' };
      }
      candidateSlug = subdomain;
    }
  }

  // If no subdomain detected, this is the SaaS platform central site
  if (!candidateSlug) {
    return { isTenantSite: false, tenantSlug: null, tenant: null, status: 'platform' };
  }

  // Validate candidate slug format (alphanumeric and dashes only, 2-50 chars)
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

  // Query database for tenant
  const tenant = db.prepare(`
    SELECT t.*, u.name as owner_name, u.email as owner_email
    FROM tenants t
    LEFT JOIN users u ON t.owner_id = u.id
    WHERE t.slug = ?
  `).get(candidateSlug) as any;

  if (!tenant) {
    return {
      isTenantSite: true,
      tenantSlug: candidateSlug,
      tenant: null,
      status: 'not_found',
      reason: `No salon parlour found registered under subdomain '${candidateSlug}'.`,
    };
  }

  // Parse JSON settings safely
  try {
    tenant.settings = JSON.parse(tenant.settings || '{}');
  } catch {
    tenant.settings = {};
  }

  // Check tenant status
  if (tenant.status === 'suspended') {
    return {
      isTenantSite: true,
      tenantSlug: candidateSlug,
      tenant,
      status: 'suspended',
      reason: 'This salon website is currently suspended by platform administration.',
    };
  }

  // Check subscription status
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
