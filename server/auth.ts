import crypto from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'glamhub_super_secret_jwt_sign_key_9941';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'superadmin' | 'owner' | 'staff';
  tenantId: string | null;
  name: string;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function generateToken(user: { id: string; email: string; role: 'superadmin' | 'owner' | 'staff'; tenant_id: string | null; name: string }): string {
  const payload: AuthPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: user.tenant_id,
    name: user.name,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(tokenString?: string): AuthPayload | null {
  if (!tokenString) return null;
  try {
    const parts = tokenString.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    const payload: AuthPayload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function extractAuth(req: Request): AuthPayload | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifyToken(authHeader.substring(7));
  }
  return null;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  req.user = user;
  next();
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  if (user.role !== 'superadmin') {
    // Log violation
    db.prepare(`
      INSERT INTO audit_logs (id, tenant_id, user_id, action, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
      user.tenantId,
      user.userId,
      'UNAUTHORIZED_SUPERADMIN_ACCESS',
      `User ${user.email} attempted to execute superadmin action: ${req.method} ${req.originalUrl}`,
      req.ip || 'unknown',
      new Date().toISOString()
    );
    return res.status(403).json({ error: 'Access denied: Super Admin privileges required.' });
  }
  req.user = user;
  next();
}

/**
 * Middleware ensuring the authenticated user is authorized to manage the requested tenant.
 * SuperAdmin has universal access.
 * Salon Owner can ONLY manage their assigned tenantId.
 */
export function requireTenantAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractAuth(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  // Resolve requested tenant ID from route params or body
  const targetTenantId = req.params.tenantId || req.body?.tenant_id || (req.query?.tenant_id as string);

  if (user.role === 'superadmin') {
    req.user = user;
    return next();
  }

  if (user.role === 'owner' && user.tenantId && user.tenantId === targetTenantId) {
    req.user = user;
    return next();
  }

  // Security breach attempt: Log and reject immediately
  db.prepare(`
    INSERT INTO audit_logs (id, tenant_id, user_id, action, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    'log_' + Date.now() + Math.random().toString(36).substring(2, 6),
    targetTenantId || null,
    user.userId,
    'CROSS_TENANT_ACCESS_DENIED',
    `User ${user.email} (Tenant: ${user.tenantId}) attempted to access Tenant: ${targetTenantId} on ${req.method} ${req.originalUrl}`,
    req.ip || 'unknown',
    new Date().toISOString()
  );

  return res.status(403).json({
    error: 'Access denied: You do not have permission to access or modify data for another salon business.',
  });
}
