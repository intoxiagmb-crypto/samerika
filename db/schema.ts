import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const users = sqliteTable('users', {
 id: text('id').primaryKey(), email: text('email').notNull().unique(), name: text('name').notNull(),
 role: text('role').notNull(), status: text('status').notNull(), profile: text('profile').notNull().default('{}'), createdAt: text('created_at').notNull(),
});
export const leads = sqliteTable('leads', {
 id: text('id').primaryKey(), ownerId: text('owner_id').notNull().references(()=>users.id), partnerId: text('partner_id').references(()=>users.id),
 customerEmail: text('customer_email').notNull(), name: text('name').notNull(), mobile: text('mobile').notNull().unique(),
 assignedTo: text('assigned_to').references(()=>users.id), status: text('status').notNull(), data: text('data').notNull(),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(), version: integer('version').notNull().default(1),
}, t=>[index('leads_partner_idx').on(t.partnerId), uniqueIndex('leads_email_unique').on(t.customerEmail).where(sql`${t.customerEmail} <> ''`)]);
export const projects = sqliteTable('projects', {
 id: text('id').primaryKey(), leadId: text('lead_id').notNull().references(()=>leads.id),
 managerId: text('manager_id').references(()=>users.id), technicianId: text('technician_id').references(()=>users.id), verifierId: text('verifier_id').references(()=>users.id),
 status: text('status').notNull(), data: text('data').notNull(), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(), version: integer('version').notNull().default(1),
}, t=>[uniqueIndex('projects_lead_id_unique').on(t.leadId).where(sql`json_extract(${t.data}, '$.deletedAt') IS NULL`),index('projects_lead_history_idx').on(t.leadId)]);
export const records = sqliteTable('records', {
 id: text('id').primaryKey(), kind: text('kind').notNull(), projectId: text('project_id').references(()=>projects.id), ownerId: text('owner_id').notNull().references(()=>users.id),
 status: text('status').notNull(), amount: integer('amount').notNull().default(0), reference: text('reference'), data: text('data').notNull(),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(), version: integer('version').notNull().default(1),
},t=>[index('records_project_idx').on(t.projectId,t.kind),uniqueIndex('record_reference_unique').on(t.kind,t.reference)]);
export const audit = sqliteTable('audit', {
 id: text('id').primaryKey(), actorId: text('actor_id').notNull().references(()=>users.id), entityId: text('entity_id').notNull(), action: text('action').notNull(),
 detail: text('detail').notNull(), createdAt: text('created_at').notNull(),
},t=>[index('audit_entity_idx').on(t.entityId)]);
export const notifications = sqliteTable('notifications', {
 id: text('id').primaryKey(), userId: text('user_id').notNull().references(()=>users.id), message: text('message').notNull(), entityId: text('entity_id').notNull(), read: integer('read').notNull().default(0), createdAt: text('created_at').notNull(),
},t=>[index('notifications_user_created_idx').on(t.userId,t.createdAt)]);
export const settings = sqliteTable('settings', { key: text('key').primaryKey(), data: text('data').notNull() });
export const requestLimits = sqliteTable('request_limits', { key: text('key').primaryKey(), count: integer('count').notNull(), expiresAt: integer('expires_at').notNull() });

export const paymentReferences = sqliteTable('payment_references', {reference:text('reference').primaryKey(),recordId:text('record_id').notNull().unique().references(()=>records.id),createdAt:text('created_at').notNull()});

export const localCredentials=sqliteTable('local_credentials',{userId:text('user_id').primaryKey().references(()=>users.id),salt:text('salt').notNull(),passwordHash:text('password_hash').notNull()});
export const localSessions=sqliteTable('local_sessions',{tokenHash:text('token_hash').primaryKey(),userId:text('user_id').notNull().references(()=>users.id),expiresAt:integer('expires_at').notNull()},t=>[index('local_sessions_expiry').on(t.expiresAt)]);
