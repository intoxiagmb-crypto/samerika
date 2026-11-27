export function isProjectLeadConflict(error) {
  return /UNIQUE constraint failed:\s*projects\.lead_id\b/i.test(String(error));
}

// Older deployments may still have the original all-projects unique index.
// Upgrade only that exact known index, after a failed atomic creation batch.
// Archived projects and their records stay intact; active duplicates remain blocked.
export async function createProjectRecords(db, statements) {
  try {
    return await db.batch(statements);
  } catch (error) {
    if (!isProjectLeadConflict(error)) throw error;
    const index = await db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND name='projects_lead_id_unique'").first();
    const definition = String(index?.sql || '').replace(/["`\[\]]/g, '').replace(/\s+/g, ' ').replace(/\s*([(),])\s*/g, '$1').trim().replace(/;$/, '').toLowerCase().replace('json_extract(projects.data,', 'json_extract(data,');
    const legacyDefinition = 'create unique index projects_lead_id_unique on projects(lead_id)';
    if (definition === legacyDefinition) {
      await db.batch([
        db.prepare('DROP INDEX IF EXISTS projects_lead_id_unique'),
        db.prepare("CREATE UNIQUE INDEX projects_lead_id_unique ON projects(lead_id) WHERE json_extract(data,'$.deletedAt') IS NULL"),
      ]);
    } else if (definition !== `${legacyDefinition} where json_extract(data,'$.deletedat') is null`) {
      throw error;
    }
    // Another request may have repaired the index after this request failed.
    return db.batch(statements);
  }
}
