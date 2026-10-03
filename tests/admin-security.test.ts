import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';

process.env.ADMIN_PASSWORD = 'unit-test-password';
process.env.ADMIN_SESSION_SECRET = 'unit-test-session-secret-which-is-long-enough-32';

const { createSessionToken, verifySessionToken } = await import('../src/server/auth-session.ts');
const { default: app } = await import('../src/server/app.ts');

let server: Server;
let baseUrl = '';

before(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine test server port');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
});

describe('admin authentication and route protection', () => {
  it('rejects protected API access without a session', async () => {
    const response = await fetch(`${baseUrl}/api/admin/stats`);
    assert.equal(response.status, 401);
  });

  it('rejects invalid admin credentials', async () => {
    const response = await fetch(`${baseUrl}/api/admin/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin', password: 'wrong-password' }),
    });
    assert.equal(response.status, 401);
  });

  it('creates and verifies signed sessions', () => {
    const token = createSessionToken({ email: 'admin@example.com', name: 'Administrator', role: 'admin' });
    const session = verifySessionToken(token);
    assert.ok(session);
    assert.equal(session?.role, 'admin');
    assert.equal(session?.email, 'admin@example.com');
  });

  it('accepts a valid session on the session endpoint without touching the database', async () => {
    const token = createSessionToken({ email: 'admin@example.com', name: 'Administrator', role: 'admin' });
    const response = await fetch(`${baseUrl}/api/admin/auth/me`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.authenticated, true);
    assert.equal(body.user.role, 'admin');
  });
});
