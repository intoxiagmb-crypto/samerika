import { getDatabase } from '../lib/database.mjs';
import { migrate } from '../lib/migrations.mjs';
const db = getDatabase();
try { await migrate(db.client); console.log('Database migrations applied.'); }
finally { db.client.close(); }
