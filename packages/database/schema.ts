import { pgTable, uuid, text, timestamp, varchar, integer, boolean } from 'drizzle-orm/pg-core';

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  tenant_id: text('tenant_id').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: varchar('phone', { length: 20 }).notNull().unique(),
  role: text('role').notNull(), // 'SUPERADMIN', 'ORG_ADMIN', 'AGENT', 'USER'
  subscriptionTier: text('subscription_tier').default('FREE'),
  verificationCode: text('verification_code'),
  isVerified: boolean('is_verified').default(false),
  orgId: uuid('org_id').references(() => organizations.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const calls = pgTable('calls', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  orgId: uuid('org_id').references(() => organizations.id),
  callerNumber: varchar('caller_number', { length: 20 }).notNull(),
  language: varchar('language', { length: 10 }).default('en'),
  sentiment: text('sentiment'),
  summary: text('summary'),
  duration: integer('duration'),
  status: text('status').notNull(), // 'ACTIVE', 'COMPLETED', 'FAILED'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').references(() => calls.id).notNull(),
  speaker: text('speaker').notNull(), // 'ASSISTANT', 'USER'
  content: text('content').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const actions = pgTable('actions', {
  id: uuid('id').primaryKey().defaultRandom(),
  callId: uuid('call_id').references(() => calls.id).notNull(),
  type: text('type').notNull(),
  description: text('description').notNull(),
  priority: text('priority').notNull(), // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status: text('status').default('PENDING').notNull(),
  followUpDate: timestamp('follow_up_date'),
  assignedTo: uuid('assigned_to').references(() => users.id),
});
