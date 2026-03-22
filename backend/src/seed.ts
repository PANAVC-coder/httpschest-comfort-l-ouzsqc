import type { App } from './index.js';
import { eq } from 'drizzle-orm';
import * as authSchema from './db/schema/auth-schema.js';
import * as schema from './db/schema/schema.js';
import { randomBytes } from 'crypto';

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return bcrypt.hash(password, 10);
}

function generateId(): string {
  return randomBytes(12).toString('hex');
}

export async function seedDemoData(app: App) {
  try {
    // Check if demo user already exists
    const existingUser = await app.db.query.user.findFirst({
      where: eq(authSchema.user.email, 'demo@example.com'),
    });

    if (existingUser) {
      app.logger.info('Demo user already exists, skipping seed');
      return;
    }

    // Create user
    const userId = generateId();
    const hashedPassword = await hashPassword('demo1234');

    await app.db.insert(authSchema.user).values({
      id: userId,
      name: 'Demo User',
      email: 'demo@example.com',
      emailVerified: true,
    });

    // Create account with password
    await app.db.insert(authSchema.account).values({
      id: generateId(),
      accountId: 'demo@example.com',
      providerId: 'credential',
      userId,
      password: hashedPassword,
    });

    app.logger.info('Demo user created');

    // Check if demo entries already exist
    const existingEntries = await app.db
      .select()
      .from(schema.entries)
      .where(eq(schema.entries.userId, userId));

    if (existingEntries.length > 0) {
      app.logger.info('Demo entries already exist, skipping seed');
      return;
    }

    // Create 20 sample entries spread over last 30 days
    const now = new Date();
    const sampleEntries = [
      {
        comfort_level: 4,
        triggers: ['stress', 'anxiety'],
        notes: 'Felt tightness during work meeting',
        dayOffset: 28,
        hour: 14,
      },
      {
        comfort_level: 7,
        triggers: ['exercise'],
        notes: 'Light walk helped ease discomfort',
        dayOffset: 27,
        hour: 18,
      },
      {
        comfort_level: 5,
        triggers: ['food', 'caffeine'],
        notes: 'Heavy lunch followed by coffee, mild pressure',
        dayOffset: 26,
        hour: 13,
      },
      {
        comfort_level: 8,
        triggers: ['sleep'],
        notes: 'Slept well, woke up feeling much better',
        dayOffset: 25,
        hour: 8,
      },
      {
        comfort_level: 3,
        triggers: ['stress', 'posture'],
        notes: 'Long hours at desk, significant tightness',
        dayOffset: 24,
        hour: 17,
      },
      {
        comfort_level: 6,
        triggers: ['weather'],
        notes: 'Cold front came in, slight chest heaviness',
        dayOffset: 23,
        hour: 15,
      },
      {
        comfort_level: 9,
        triggers: [],
        notes: 'Great day, almost no discomfort',
        dayOffset: 22,
        hour: 19,
      },
      {
        comfort_level: 5,
        triggers: ['anxiety', 'caffeine'],
        notes: 'Too much coffee, heart racing slightly',
        dayOffset: 21,
        hour: 10,
      },
      {
        comfort_level: 4,
        triggers: ['food'],
        notes: 'Spicy dinner caused reflux-like sensation',
        dayOffset: 20,
        hour: 20,
      },
      {
        comfort_level: 7,
        triggers: ['exercise', 'sleep'],
        notes: 'Morning jog and good rest, feeling decent',
        dayOffset: 19,
        hour: 9,
      },
      {
        comfort_level: 6,
        triggers: ['posture'],
        notes: 'Noticed slouching at desk all afternoon',
        dayOffset: 18,
        hour: 16,
      },
      {
        comfort_level: 3,
        triggers: ['stress', 'anxiety', 'sleep'],
        notes: 'Poor sleep and stressful day, worst discomfort this week',
        dayOffset: 17,
        hour: 11,
      },
      {
        comfort_level: 8,
        triggers: ['exercise'],
        notes: 'Yoga session really helped open up chest',
        dayOffset: 16,
        hour: 17,
      },
      {
        comfort_level: 5,
        triggers: ['weather', 'anxiety'],
        notes: 'Stormy weather, felt anxious and tight',
        dayOffset: 15,
        hour: 14,
      },
      {
        comfort_level: 7,
        triggers: ['food'],
        notes: 'Light salad for lunch, felt noticeably better',
        dayOffset: 14,
        hour: 12,
      },
      {
        comfort_level: 4,
        triggers: ['caffeine', 'stress'],
        notes: 'Deadline pressure and multiple coffees',
        dayOffset: 13,
        hour: 15,
      },
      {
        comfort_level: 6,
        triggers: ['posture', 'sleep'],
        notes: 'Slept on wrong side, stiff chest in morning',
        dayOffset: 12,
        hour: 7,
      },
      {
        comfort_level: 9,
        triggers: ['exercise'],
        notes: 'Swimming session, chest felt very open',
        dayOffset: 11,
        hour: 18,
      },
      {
        comfort_level: 5,
        triggers: ['food', 'stress'],
        notes: 'Ate quickly between meetings, some tightness',
        dayOffset: 10,
        hour: 13,
      },
      {
        comfort_level: 8,
        triggers: ['sleep', 'exercise'],
        notes: 'Early night and morning stretch, feeling good',
        dayOffset: 9,
        hour: 8,
      },
    ];

    const entriesToInsert = sampleEntries.map((sample) => {
      const occurredAt = new Date(now);
      occurredAt.setDate(occurredAt.getDate() - sample.dayOffset);
      occurredAt.setHours(sample.hour, Math.floor(Math.random() * 60), 0, 0);

      return {
        userId,
        comfortLevel: sample.comfort_level,
        triggers: sample.triggers,
        notes: sample.notes,
        occurredAt,
      };
    });

    await app.db.insert(schema.entries).values(entriesToInsert);
    app.logger.info({ count: entriesToInsert.length }, 'Demo entries created successfully');
  } catch (error) {
    app.logger.warn({ err: error }, 'Failed to seed demo data');
  }
}
