import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// 1. Users table (linked to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email'),
  displayName: text('display_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Automated Care Plans table
export const carePlans = pgTable('care_plans', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull(), // User's Firebase UID
  plantName: text('plant_name').notNull(),
  scientificName: text('scientific_name'),
  plantCategory: text('plant_category').default('indoor'), // indoor, vegetable, fruit, flower, herb, bonsai
  location: text('location').notNull(), // e.g. Ban công hướng đông, Phòng khách, Ngoài vườn
  sunlight: text('sunlight').notNull(), // full_sun, partial_sun, indirect, shade
  environmentNotes: text('environment_notes'),
  temperatureRange: text('temperature_range'), // e.g. 22°C - 30°C
  humidityLevel: text('humidity_level'), // e.g. 60% - 75%
  wateringFrequencyDays: integer('watering_frequency_days').notNull().default(3),
  fertilizingFrequencyDays: integer('fertilizing_frequency_days').notNull().default(14),
  pruningFrequencyDays: integer('pruning_frequency_days').notNull().default(30),
  pestCheckFrequencyDays: integer('pest_check_frequency_days').notNull().default(7),
  recommendedWaterAmount: text('recommended_water_amount').default('500ml'),
  recommendedFertilizer: text('recommended_fertilizer').default('Phân trùn quế / NPK loãng'),
  pruningInstructions: text('pruning_instructions'),
  specialCareNotes: text('special_care_notes'),
  isActive: boolean('is_active').notNull().default(true),
  notificationEnabled: boolean('notification_enabled').notNull().default(true),
  notificationTime: text('notification_time').default('07:30'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// 3. Care Tasks schedule items
export const careTasks = pgTable('care_tasks', {
  id: serial('id').primaryKey(),
  planId: integer('plan_id')
    .references(() => carePlans.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_id').notNull(),
  taskType: text('task_type').notNull(), // water, fertilize, prune, pest_check, repot, rotate
  title: text('title').notNull(),
  description: text('description'),
  scheduledDate: text('scheduled_date').notNull(), // YYYY-MM-DD
  frequencyDays: integer('frequency_days').notNull().default(3),
  status: text('status').notNull().default('pending'), // pending, completed, skipped
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  carePlans: many(carePlans),
}));

export const carePlansRelations = relations(carePlans, ({ many }) => ({
  tasks: many(careTasks),
}));

export const careTasksRelations = relations(careTasks, ({ one }) => ({
  plan: one(carePlans, {
    fields: [careTasks.planId],
    references: [carePlans.id],
  }),
}));
