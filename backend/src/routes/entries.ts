import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';
import * as schema from '../db/schema/schema.js';
import type { App } from '../index.js';

interface CreateEntryBody {
  comfort_level: number;
  triggers: string[];
  notes?: string;
  occurred_at: string;
}

interface UpdateEntryBody {
  comfort_level?: number;
  triggers?: string[];
  notes?: string;
  occurred_at?: string;
}

interface InsightsQuery {
  days?: string;
}

export function registerEntriesRoutes(app: App) {
  const requireAuth = app.requireAuth();

  // POST /api/entries - Create new entry
  app.fastify.post(
    '/api/entries',
    {
      schema: {
        description: 'Create a new comfort level entry',
        tags: ['entries'],
        body: {
          type: 'object',
          required: ['comfort_level', 'triggers', 'occurred_at'],
          properties: {
            comfort_level: { type: 'integer', minimum: 1, maximum: 10 },
            triggers: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
            occurred_at: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          201: {
            description: 'Entry created successfully',
            type: 'object',
            properties: {
              id: { type: 'string' },
              user_id: { type: 'string' },
              comfort_level: { type: 'integer' },
              triggers: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
              occurred_at: { type: 'string', format: 'date-time' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Body: CreateEntryBody }>,
      reply: FastifyReply
    ) => {
      app.logger.info({ body: request.body }, 'Creating entry');
      const session = await requireAuth(request, reply);
      if (!session) return;

      const entry = await app.db
        .insert(schema.entries)
        .values({
          userId: session.user.id,
          comfortLevel: request.body.comfort_level,
          triggers: request.body.triggers,
          notes: request.body.notes,
          occurredAt: new Date(request.body.occurred_at),
        })
        .returning();

      app.logger.info({ entryId: entry[0].id }, 'Entry created successfully');
      reply.status(201);
      return {
        id: entry[0].id,
        user_id: entry[0].userId,
        comfort_level: entry[0].comfortLevel,
        triggers: entry[0].triggers,
        notes: entry[0].notes,
        occurred_at: entry[0].occurredAt,
        created_at: entry[0].createdAt,
      };
    }
  );

  // GET /api/entries - List entries
  app.fastify.get(
    '/api/entries',
    {
      schema: {
        description: 'List all entries for the authenticated user',
        tags: ['entries'],
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'integer', default: 50 },
            offset: { type: 'integer', default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              entries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    user_id: { type: 'string' },
                    comfort_level: { type: 'integer' },
                    triggers: { type: 'array', items: { type: 'string' } },
                    notes: { type: 'string' },
                    occurred_at: { type: 'string', format: 'date-time' },
                    created_at: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: { limit?: string; offset?: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const limit = Math.min(parseInt(request.query.limit || '50'), 1000);
      const offset = parseInt(request.query.offset || '0');

      app.logger.info({ userId: session.user.id, limit, offset }, 'Listing entries');

      const entries = await app.db
        .select()
        .from(schema.entries)
        .where(eq(schema.entries.userId, session.user.id))
        .orderBy(desc(schema.entries.occurredAt))
        .limit(limit)
        .offset(offset);

      return {
        entries: entries.map((e) => ({
          id: e.id,
          user_id: e.userId,
          comfort_level: e.comfortLevel,
          triggers: e.triggers,
          notes: e.notes,
          occurred_at: e.occurredAt,
          created_at: e.createdAt,
        })),
      };
    }
  );

  // GET /api/entries/:id - Get single entry
  app.fastify.get(
    '/api/entries/:id',
    {
      schema: {
        description: 'Get a single entry by ID',
        tags: ['entries'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              user_id: { type: 'string' },
              comfort_level: { type: 'integer' },
              triggers: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
              occurred_at: { type: 'string', format: 'date-time' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info({ entryId: id, userId: session.user.id }, 'Getting entry');

      const entry = await app.db.query.entries.findFirst({
        where: eq(schema.entries.id, id),
      });

      if (!entry) {
        app.logger.warn({ entryId: id }, 'Entry not found');
        return reply.status(404).send({ error: 'Entry not found' });
      }

      if (entry.userId !== session.user.id) {
        app.logger.warn({ entryId: id, userId: session.user.id }, 'Unauthorized access attempt');
        return reply.status(403).send({ error: 'Forbidden' });
      }

      return {
        id: entry.id,
        user_id: entry.userId,
        comfort_level: entry.comfortLevel,
        triggers: entry.triggers,
        notes: entry.notes,
        occurred_at: entry.occurredAt,
        created_at: entry.createdAt,
      };
    }
  );

  // PUT /api/entries/:id - Update entry
  app.fastify.put(
    '/api/entries/:id',
    {
      schema: {
        description: 'Update an entry',
        tags: ['entries'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            comfort_level: { type: 'integer', minimum: 1, maximum: 10 },
            triggers: { type: 'array', items: { type: 'string' } },
            notes: { type: 'string' },
            occurred_at: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              user_id: { type: 'string' },
              comfort_level: { type: 'integer' },
              triggers: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' },
              occurred_at: { type: 'string', format: 'date-time' },
              created_at: { type: 'string', format: 'date-time' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateEntryBody }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info({ entryId: id, userId: session.user.id, body: request.body }, 'Updating entry');

      const entry = await app.db.query.entries.findFirst({
        where: eq(schema.entries.id, id),
      });

      if (!entry) {
        app.logger.warn({ entryId: id }, 'Entry not found');
        return reply.status(404).send({ error: 'Entry not found' });
      }

      if (entry.userId !== session.user.id) {
        app.logger.warn({ entryId: id, userId: session.user.id }, 'Unauthorized update attempt');
        return reply.status(403).send({ error: 'Forbidden' });
      }

      const updates = {
        ...(request.body.comfort_level !== undefined && { comfortLevel: request.body.comfort_level }),
        ...(request.body.triggers !== undefined && { triggers: request.body.triggers }),
        ...(request.body.notes !== undefined && { notes: request.body.notes }),
        ...(request.body.occurred_at !== undefined && { occurredAt: new Date(request.body.occurred_at) }),
      };

      const updated = await app.db
        .update(schema.entries)
        .set(updates)
        .where(eq(schema.entries.id, id))
        .returning();

      app.logger.info({ entryId: id }, 'Entry updated successfully');
      return {
        id: updated[0].id,
        user_id: updated[0].userId,
        comfort_level: updated[0].comfortLevel,
        triggers: updated[0].triggers,
        notes: updated[0].notes,
        occurred_at: updated[0].occurredAt,
        created_at: updated[0].createdAt,
      };
    }
  );

  // DELETE /api/entries/:id - Delete entry
  app.fastify.delete(
    '/api/entries/:id',
    {
      schema: {
        description: 'Delete an entry',
        tags: ['entries'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          403: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          404: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const { id } = request.params;
      app.logger.info({ entryId: id, userId: session.user.id }, 'Deleting entry');

      const entry = await app.db.query.entries.findFirst({
        where: eq(schema.entries.id, id),
      });

      if (!entry) {
        app.logger.warn({ entryId: id }, 'Entry not found');
        return reply.status(404).send({ error: 'Entry not found' });
      }

      if (entry.userId !== session.user.id) {
        app.logger.warn({ entryId: id, userId: session.user.id }, 'Unauthorized delete attempt');
        return reply.status(403).send({ error: 'Forbidden' });
      }

      await app.db.delete(schema.entries).where(eq(schema.entries.id, id));
      app.logger.info({ entryId: id }, 'Entry deleted successfully');

      return { success: true };
    }
  );

  // GET /api/insights - Get aggregated insights
  app.fastify.get(
    '/api/insights',
    {
      schema: {
        description: 'Get aggregated insights for the authenticated user',
        tags: ['entries'],
        querystring: {
          type: 'object',
          properties: {
            days: { type: 'integer', default: 30 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              average_comfort: { type: 'number' },
              total_entries: { type: 'integer' },
              trend: { type: 'string', enum: ['improving', 'worsening', 'stable'] },
              top_triggers: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    trigger: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              daily_averages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    date: { type: 'string' },
                    average: { type: 'number' },
                  },
                },
              },
            },
          },
          401: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (
      request: FastifyRequest<{ Querystring: InsightsQuery }>,
      reply: FastifyReply
    ) => {
      const session = await requireAuth(request, reply);
      if (!session) return;

      const days = parseInt(request.query.days || '30');
      app.logger.info({ userId: session.user.id, days }, 'Getting insights');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get all entries for the user in the period
      const entries = await app.db
        .select()
        .from(schema.entries)
        .where(
          and(
            eq(schema.entries.userId, session.user.id),
            gte(schema.entries.occurredAt, cutoffDate)
          )
        )
        .orderBy(schema.entries.occurredAt);

      // Calculate average comfort
      const averageComfort =
        entries.length > 0
          ? Math.round(
              (entries.reduce((sum, e) => sum + e.comfortLevel, 0) / entries.length) * 100
            ) / 100
          : 0;

      // Calculate trend
      const midpoint = new Date(cutoffDate);
      midpoint.setDate(midpoint.getDate() + days / 2);

      const firstHalf = entries.filter((e) => e.occurredAt < midpoint);
      const secondHalf = entries.filter((e) => e.occurredAt >= midpoint);

      let trend: 'improving' | 'worsening' | 'stable' = 'stable';
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstHalfAvg = firstHalf.reduce((sum, e) => sum + e.comfortLevel, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, e) => sum + e.comfortLevel, 0) / secondHalf.length;

        if (secondHalfAvg > firstHalfAvg + 0.5) {
          trend = 'improving';
        } else if (firstHalfAvg > secondHalfAvg + 0.5) {
          trend = 'worsening';
        }
      }

      // Get top triggers
      const triggerCounts: Record<string, number> = {};
      entries.forEach((entry) => {
        entry.triggers.forEach((trigger) => {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        });
      });

      const topTriggers = Object.entries(triggerCounts)
        .map(([trigger, count]) => ({ trigger, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate daily averages
      const dailyAverages: Record<string, number[]> = {};
      entries.forEach((entry) => {
        const dateStr = entry.occurredAt.toISOString().split('T')[0];
        if (!dailyAverages[dateStr]) {
          dailyAverages[dateStr] = [];
        }
        dailyAverages[dateStr].push(entry.comfortLevel);
      });

      const dailyAveragesArray = Object.entries(dailyAverages)
        .map(([date, levels]) => ({
          date,
          average:
            Math.round(
              (levels.reduce((sum, level) => sum + level, 0) / levels.length) * 100
            ) / 100,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return {
        average_comfort: averageComfort,
        total_entries: entries.length,
        trend,
        top_triggers: topTriggers,
        daily_averages: dailyAveragesArray,
      };
    }
  );
}
