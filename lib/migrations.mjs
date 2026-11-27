import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export async function migrate(client, directory = new URL('../drizzle/', import.meta.url)) {
  const tx = await client.transaction('write');
  try {
    await tx.execute('CREATE TABLE IF NOT EXISTS solaris_migrations (name TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL)');
    for (const name of (await readdir(directory)).filter(name => name.endsWith('.sql')).sort()) {
      const sql = await readFile(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const existing = await tx.execute({ sql: 'SELECT checksum FROM solaris_migrations WHERE name=?', args: [name] });
      if (existing.rows.length) {
        if (existing.rows[0].checksum !== checksum) throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      // These checked-in migrations contain no triggers or quoted semicolons.
      for (const statement of sql.replace(/--[^\n]*/g, '').split(';').map(s => s.trim()).filter(Boolean)) {
        await tx.execute(statement);
      }
      await tx.execute({ sql: 'INSERT INTO solaris_migrations VALUES(?,?,?)', args: [name, checksum, new Date().toISOString()] });
    }
    await tx.commit();
  } catch (error) {
    await tx.rollback();
    throw error;
  } finally { tx.close(); }
}
