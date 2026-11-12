import { Pool } from 'pg';
import { executeMockQuery } from './mock-db';

const rawConn = (process.env.DATABASE_URL || '').trim();

export const isSimulationMode =
  process.env.SIMULATION_MODE === 'true' ||
  !rawConn ||
  rawConn.includes('placeholder') ||
  rawConn === 'none';

const mockPool: any = {
  query: async (text: string, params: any[] = []) => {
    return executeMockQuery(text, params);
  },
  connect: async () => {
    return {
      query: async (text: string, params: any[] = []) => {
        return executeMockQuery(text, params);
      },
      release: () => {},
    };
  },
};

let pool: any;

if (isSimulationMode) {
  pool = mockPool;
} else {
  const isCloudDb =
    rawConn.includes('sslmode=require') ||
    rawConn.includes('neon.tech') ||
    rawConn.includes('supabase.co') ||
    rawConn.includes('supabase.com') ||
    rawConn.includes('amazonaws.com') ||
    process.env.NODE_ENV === 'production';

  const sslConfig = isCloudDb && !rawConn.includes('127.0.0.1') && !rawConn.includes('localhost')
    ? { rejectUnauthorized: false }
    : undefined;

  declare global {
    var _pgPool: Pool | undefined;
  }

  if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
      connectionString: rawConn,
      ssl: sslConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  } else {
    if (!global._pgPool) {
      global._pgPool = new Pool({
        connectionString: rawConn,
        ssl: sslConfig,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }
    pool = global._pgPool;
  }
}

export default pool;
