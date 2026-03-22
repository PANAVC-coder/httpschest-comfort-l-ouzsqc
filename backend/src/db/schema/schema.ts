import { pgTable, uuid, text, timestamp, integer, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth-schema.js';

export const entries = pgTable(
  'entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    comfortLevel: integer('comfort_level').notNull(),
    triggers: text('triggers').array().notNull().default([]),
    notes: text('notes'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check('comfort_level_range', sql`"comfort_level" >= 1 AND "comfort_level" <= 10`),
  ]
);
