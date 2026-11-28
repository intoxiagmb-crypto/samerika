// Deterministic synthetic/local measurements, never production credentials or data.
// Usage: node scripts/benchmark-performance.mjs [baseline-commit]
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { createClient } from '@libsql/client';
import { Business } from '../lib/business.mjs';
import { migrate } from '../lib/migrations.mjs';
import { ROLES } from '../lib/policy.mjs';

const baseline = process.argv[2] || '5379602';
assert.match(baseline, /^[a-f0-9]{7,40}$/);
const output = new URL('../outputs/performance/', import.meta.url);
await mkdir(output, { recursive: true });
const beforeSource = execFileSync('git', ['show', `${baseline}:lib/business.mjs`], { encoding: 'utf8' })
  .replace(/from '(\.\/[^']+)'/g, (_, name) => `from '${new URL('../lib/' + name, import.meta.url).href}'`);
await writeFile(new URL('business-before.mjs', output), beforeSource);
const { Business: Before } = await import(new URL('business-before.mjs', output));
const count = 5000;
const users = ROLES.map(role => ({ id: role.toLowerCase(), role, status: 'Active', email: `${role.toLowerCase()}@example.test`, name: role, profile: '{}' }));
const leads = Array.from({ length: count }, (_, i) => ({
  id: `l${i}`, owner_id: i % 5 ? 'admin' : 'manager', partner_id: i % 2 ? 'partner' : 'other',
  assigned_to: i % 3 ? 'sales' : null, customer_email: i % 7 ? 'other@example.test' : 'customer@example.test',
  name: `Synthetic ${i}`, status: 'New', data: JSON.stringify({ source: i % 2 ? 'Website' : 'Other', internalNotes: 'internal' }),
}));
const projects = Array.from({ length: count }, (_, i) => ({
  id: `p${i}`, lead_id: `l${i}`, manager_id: i % 3 ? 'manager' : 'other', technician_id: i % 2 ? 'technical' : 'other',
  verifier_id: i % 5 ? 'verifier' : 'other', status: 'Survey', data: JSON.stringify(i % 11 ? {} : { deletedAt: '2026-01-01' }),
}));
const records = projects.flatMap((p, i) => ['quote','document','ticket'].map(kind => ({
  id: `${p.id}-${kind}`, project_id: p.id, owner_id: i % 2 ? 'partner' : 'other', kind,
  status: kind === 'quote' ? 'Sent' : 'Submitted', data: JSON.stringify({ name: 'Synthetic', fileKey: 'private-key' }),
})));
const db = {
  prepare(sql) { return { bind(...args) { return { sql, args }; } }; },
  async readBatch(statements) { return statements.map(({ sql }) => ({ results:
    sql.startsWith('SELECT * FROM projects') ? projects : sql.startsWith('SELECT * FROM leads') ? leads :
    sql.startsWith('SELECT * FROM records') ? records : sql.startsWith('SELECT * FROM users') ? users : [],
  })); },
};
const before = new Before(db), after = new Business(db);
// Full output parity includes role filtering, pending/suspended access and deleted history.
for (const user of users) for (const status of ['Active', 'Pending', 'Suspended']) {
  assert.deepEqual(await after.snapshot({ ...user, status }), await before.snapshot({ ...user, status }));
}
const median = values => [...values].sort((a,b) => a-b)[Math.floor(values.length / 2)];
async function time(fn) { const start=performance.now(); await fn(); return performance.now()-start; }
async function compare(oldFn, newFn, rounds=9) {
  await oldFn(); await newFn();
  const oldTimes=[],newTimes=[];
  for(let i=0;i<rounds;i++) {
    if(i%2){newTimes.push(await time(newFn));oldTimes.push(await time(oldFn));}
    else {oldTimes.push(await time(oldFn));newTimes.push(await time(newFn));}
  }
  const beforeMs=median(oldTimes),afterMs=median(newTimes);
  return { beforeMedianMs:beforeMs, afterMedianMs:afterMs, reductionPercent:100*(beforeMs-afterMs)/beforeMs, rounds };
}
const snapshot = {};
for(const role of ['FINANCE','TECHNICAL','ADMIN']) {
  const user=users.find(user=>user.role===role);
  snapshot[role]=await compare(()=>before.snapshot(user),()=>after.snapshot(user));
}
const amounts=Array.from({length:1000},(_,i)=>i*12345);
const formatOptions={style:'currency',currency:'INR',maximumFractionDigits:0};
const formatter=new Intl.NumberFormat('en-IN',formatOptions);
const oldMoney=()=>amounts.map(n=>new Intl.NumberFormat('en-IN',formatOptions).format(n/100));
const newMoney=()=>amounts.map(n=>formatter.format(n/100));
assert.deepEqual(oldMoney(),newMoney());
const currency=await compare(oldMoney,newMoney);

// Real SQLite planner and timings with the same SQL used by the notification API.
const client=createClient({url:':memory:'});
let notifications;
try {
  await migrate(client);
  await client.execute('DROP INDEX notifications_user_created_idx');
  await client.execute("INSERT INTO users VALUES('fixture','fixture@example.test','Fixture','ADMIN','Active','{}','2026-01-01')");
  await client.execute("WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<50000) INSERT INTO notifications(id,user_id,message,entity_id,created_at) SELECT 'n'||x,'fixture','Synthetic','',printf('%012d',x) FROM n");
  const query={sql:'SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',args:['fixture']};
  const explain=()=>client.execute({...query,sql:'EXPLAIN QUERY PLAN '+query.sql});
  const beforePlan=(await explain()).rows.map(row=>row.detail);
  const expected=(await client.execute(query)).rows;
  const oldTimes=[];for(let i=0;i<20;i++)oldTimes.push(await time(()=>client.execute(query)));
  await client.execute('CREATE INDEX notifications_user_created_idx ON notifications(user_id,created_at)');
  const afterPlan=(await explain()).rows.map(row=>row.detail);
  assert.deepEqual((await client.execute(query)).rows,expected);
  assert.ok(afterPlan.some(plan=>plan.includes('notifications_user_created_idx')));
  assert.ok(!afterPlan.some(plan=>plan.includes('TEMP B-TREE')));
  const newTimes=[];for(let i=0;i<20;i++)newTimes.push(await time(()=>client.execute(query)));
  notifications={rows:50000,beforePlan,afterPlan,beforeMedianMs:median(oldTimes),afterMedianMs:median(newTimes)};
} finally {client.close();}
const report={baseline,node:process.version,platform:process.platform,arch:process.arch,
  scope:'Synthetic local measurements; not Android startup, RAM, frame rate, network latency or production API timing.',
  fixture:{leads:count,projects:count,records:records.length,roleStatusParityCases:users.length*3},snapshot,currency,notifications};
await writeFile(new URL('measurements.json',output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
