import { createHmac, timingSafeEqual, createHash } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export interface AdminSessionUser {
  email: string;
  name: string;
  role: 'admin' | 'superadmin';
  issuedAt: number;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = 'dbi_admin_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSecretKey(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters.');
  }
  return secret;
}

/**
 * Signs an admin session payload and creates a verifiable token.
 */
export function createSessionToken(user: Omit<AdminSessionUser, 'issuedAt' | 'expiresAt'>): string {
  const now = Date.now();
  const session: AdminSessionUser = {
    ...user,
    issuedAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };

  const payloadStr = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = createHmac('sha256', getSecretKey()).update(payloadStr).digest('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verifies a session token string.
 */
export function verifySessionToken(token: string): AdminSessionUser | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signature] = parts;

  let expectedSig: string;
  try {
    expectedSig = createHmac('sha256', getSecretKey()).update(payloadStr).digest('base64url');
  } catch {
    // Missing/invalid production secret must fail closed as an invalid session.
    return null;
  }

  // Constant-time signature comparison to prevent timing attacks
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSig);

  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const session: AdminSessionUser = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (Date.now() > session.expiresAt) {
      return null; // Expired
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Extracts session from HTTP cookies or Authorization header.
 */
export function getSessionFromRequest(req: Request): AdminSessionUser | null {
  let token: string | undefined = req.cookies?.[SESSION_COOKIE_NAME];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7);
  }

  if (!token) return null;
  return verifySessionToken(token);
}

/**
 * Express middleware to guard admin routes.
 */
export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required',
    });
  }

  (req as any).adminUser = session;
  return next();
}

/**
 * Securely compares entered password against administrator credential.
 */
export function verifyAdminPassword(provided: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;

  const providedHash = createHash('sha256').update(provided).digest();
  const actualHash = createHash('sha256').update(adminPassword).digest();

  return timingSafeEqual(providedHash, actualHash);
}

export { SESSION_COOKIE_NAME, SESSION_DURATION_MS };
