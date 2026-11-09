import { Hono } from 'hono';
import type { ContactMessageDto } from '../../../src/app/core/api/admin.models';
import type { AdminEnv } from '../env';
import { invalid, problem, readJson } from '../problem';

interface MessageRow {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

const toDto = (row: MessageRow): ContactMessageDto => ({
  id: row.id,
  name: row.name,
  email: row.email,
  message: row.message,
  receivedAt: row.created_at,
  readAt: row.read_at,
});

const COLUMNS = 'id, name, email, message, created_at, read_at';

/** Contact messages: GET / (newest first) · PATCH /:id { read } · DELETE /:id */
export const messagesRoutes = new Hono<AdminEnv>()
  .get('/', async (c) => {
    const { results } = await c.env.DB.prepare(
      `SELECT ${COLUMNS} FROM contact_messages ORDER BY created_at DESC LIMIT 500`,
    ).all<MessageRow>();
    return c.json(results.map(toDto));
  })

  .patch('/:id', async (c) => {
    const id = c.req.param('id');
    const body = (await readJson(c)) as { read?: unknown };
    if (typeof body.read !== 'boolean') return invalid(c, { read: 'Must be true or false.' });

    const { meta } = await c.env.DB.prepare(
      `UPDATE contact_messages
       SET read_at = CASE WHEN ? THEN COALESCE(read_at, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) END
       WHERE id = ?`,
    )
      .bind(body.read ? 1 : 0, id)
      .run();
    if (!meta.changes) return problem(c, 404, 'Not Found', `No message with id "${id}".`);

    const row = await c.env.DB.prepare(`SELECT ${COLUMNS} FROM contact_messages WHERE id = ?`)
      .bind(id)
      .first<MessageRow>();
    return c.json(toDto(row!));
  })

  .delete('/:id', async (c) => {
    const id = c.req.param('id');
    const { meta } = await c.env.DB.prepare('DELETE FROM contact_messages WHERE id = ?').bind(id).run();
    if (!meta.changes) return problem(c, 404, 'Not Found', `No message with id "${id}".`);
    return c.body(null, 204);
  });
