import { drizzle } from 'drizzle-orm/libsql';
import { getDatabase } from '@/lib/database.mjs';
import * as schema from './schema';
export function getDb() { return drizzle(getDatabase().client, { schema }); }
