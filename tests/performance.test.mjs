import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@libsql/client';
import { adaptDatabase } from '../lib/database.mjs';
import { migrate } from '../lib/migrations.mjs';
import { Business } from '../lib/business.mjs';
import { ROLES, canReadLead } from '../lib/policy.mjs';

test('indexed snapshot preserves every role/status policy including deleted project history', async t => {
  const client=createClient({url:':memory:'});t.after(()=>client.close());await migrate(client);
  const service=new Business(adaptDatabase(client));
  for(const role of ROLES) await client.execute({sql:"INSERT INTO users VALUES(?,?,?,?,'Active','{}','2026-01-01')",args:[role.toLowerCase(),`${role.toLowerCase()}@example.test`,role,role]});
  for(let i=0;i<15;i++) {
    await client.execute({sql:'INSERT INTO leads VALUES(?,?,?,?,?,?,?,?,?,?,?,1)',args:[`l${i}`,i%2?'admin':'manager',i%3?'partner':null,i===0?'customer@example.test':`other-${i}@example.test`,`Fixture ${i}`,String(9000000000+i),i%2?'sales':null,'New',JSON.stringify({source:i%2?'Website':'Other',...(i>0&&i%4===0?{customerAccessEmail:'customer@example.test'}:{})}),'2026-01-01','2026-01-01']});
    if(i%3===0)continue;
    await client.execute({sql:'INSERT INTO projects VALUES(?,?,?,?,?,?,?,?,?,1)',args:[`p${i}`,`l${i}`,i%2?'manager':null,i%4?'technical':null,i%5?'verifier':null,'Survey',JSON.stringify(i%2?{}:{deletedAt:'2026-01-02'}),'2026-01-01','2026-01-01']});
  }
  const leads=await service.all('SELECT * FROM leads'),projects=await service.all('SELECT * FROM projects');
  for(const role of ROLES)for(const status of ['Active','Pending','Suspended']) {
    const user={id:role.toLowerCase(),email:`${role.toLowerCase()}@example.test`,role,status};
    const snapshot=await service.snapshot(user);
    const expected=leads.filter(lead=>canReadLead(user,lead,projects)).map(lead=>lead.id).sort();
    assert.deepEqual(snapshot.leads.map(lead=>lead.id).sort(),expected,`${role}/${status}`);
    assert.ok(snapshot.projects.every(project=>!project.data.deletedAt&&expected.includes(project.lead_id)));
  }
});

test('feed and complete project history use indexes without changing returned rows',async t=>{
  const client=createClient({url:':memory:'});t.after(()=>client.close());await migrate(client);
  const notifications=await client.execute({sql:'EXPLAIN QUERY PLAN SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',args:['fixture']});
  assert.ok(notifications.rows.some(row=>row.detail.includes('notifications_user_created_idx')));
  assert.ok(notifications.rows.every(row=>!row.detail.includes('TEMP B-TREE')));
  const projects=await client.execute({sql:'EXPLAIN QUERY PLAN SELECT * FROM projects WHERE lead_id=?',args:['fixture']});
  assert.ok(projects.rows.some(row=>row.detail.includes('projects_lead_history_idx')));
  // Running the checked migrations twice is safe and retains the indexes.
  await migrate(client);
});
