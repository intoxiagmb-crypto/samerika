import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Business } from './business.mjs';
import { assert } from './policy.mjs';

const text = z.string().trim().min(1);
export const enquirySchema = z.object({
  name: text.max(120),
  mobile: z.string().transform(value => value.replace(/[\s()+-]/g, '').replace(/^91(?=\d{10}$)/, '')).refine(value => /^[6-9]\d{9}$/.test(value), 'Enter a valid 10-digit Indian mobile number.'),
  email: z.union([z.string().trim().email('Enter a valid email address.').max(254), z.literal('')]).default('').transform(value => value.toLowerCase()),
  city: text.max(100),
  pin: z.union([z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code.'), z.literal('')]).default(''),
  property: z.enum(['Residential', 'Commercial', 'Industrial']),
  remarks: z.string().trim().max(2000).default(''),
  website: z.string().max(0, 'Unable to submit this enquiry.').default(''),
});

// This entry point accepts public contact details only, never identity, ownership or status.
export async function submitPublicEnquiry(db, input) {
  const data = enquirySchema.parse(input), service = new Business(db);
  const time = Date.now(), expires = time + 15 * 60 * 1000;
  const digest = value => createHash('sha256').update(value).digest('hex');
  const buckets = [[`enquiry:phone:${digest(data.mobile)}`, 5], ...(data.email ? [[`enquiry:email:${digest(data.email)}`, 5]] : []), ['enquiry:global', 150]];
  await db.batch([
    service.stmt("DELETE FROM request_limits WHERE key LIKE 'enquiry:%' AND expires_at<?", time),
    ...buckets.map(([key]) => service.stmt('INSERT INTO request_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<=? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<=? THEN ? ELSE expires_at END', key, expires, time, time, expires)),
  ]);
  for (const [key, maximum] of buckets) {
    const limit = await service.one('SELECT count FROM request_limits WHERE key=?', key);
    assert(limit.count <= maximum, 'Too many enquiries. Please try again in 15 minutes.', 429);
  }
  const staff = await service.all("SELECT id FROM users WHERE role IN ('SALES','MANAGER') AND status='Active' ORDER BY created_at");
  assert(staff.length, 'Enquiries are temporarily unavailable. Please try again later.', 503);
  const id = `LEAD-${new Date().getUTCFullYear()}-${randomUUID().replaceAll('-', '').slice(0, 12).toUpperCase()}`;
  const at = new Date().toISOString();
  const details = { name: data.name, mobile: data.mobile, email: data.email, city: data.city, pin: data.pin, property: data.property, remarks: data.remarks, address: '', state: '', capacity: null, system: 'To be confirmed', finance: 'To be confirmed', monthlyBill: 0, roofArea: 0, source: 'Website', qualificationRequired: true, activities: [{ by: 'Website visitor', status: 'New', note: 'Public website enquiry received. Contact details are unverified; confirm site requirements during follow-up.', at }] };
  // Conditional insert and notifications share one transaction. Retries never overwrite a lead or its referral.
  await db.batch([
    service.stmt("INSERT INTO leads(id,owner_id,partner_id,customer_email,name,mobile,assigned_to,status,data,created_at,updated_at,version) SELECT ?,?,NULL,?,?,?,NULL,'New',?,?,?,1 WHERE NOT EXISTS(SELECT 1 FROM leads WHERE mobile=? OR (?<>'' AND customer_email=?))", id, staff[0].id, data.email, data.name, data.mobile, JSON.stringify(details), at, at, data.mobile, data.email, data.email),
    service.stmt("INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) SELECT ?,?,?,'enquiry.received',?,? WHERE EXISTS(SELECT 1 FROM leads WHERE id=?)", randomUUID(), staff[0].id, id, JSON.stringify({ source: 'Website', actor: 'Public visitor', contactVerified: false }), at, id),
    ...staff.map(employee => service.stmt('INSERT INTO notifications(id,user_id,message,entity_id,created_at) SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM leads WHERE id=?)', randomUUID(), employee.id, `New website enquiry from ${data.name}`, id, at, id)),
  ]);
  // The same response for a new enquiry or a repeat avoids exposing existing customer records.
  return { ok: true };
}
