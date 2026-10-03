import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  // eslint-disable-next-line no-var
  var _postgresPool: Pool | undefined;
}

function getConnectionString(): string {
  const value = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!value || !value.trim()) {
    throw new Error('DATABASE_URL is not configured');
  }
  return value.trim();
}

export const createPool = () => {
  if (!global._postgresPool) {
    const connectionString = getConnectionString();
    const isLocalhost =
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1');

    global._postgresPool = new Pool({
      connectionString,
      ssl: isLocalhost ? false : { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
      keepAlive: true,
    });

    global._postgresPool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err);
    });
  }

  return global._postgresPool;
};

const pool = createPool();
export const db = drizzle(pool, { schema });
