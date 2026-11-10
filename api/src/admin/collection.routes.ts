import { type Context, Hono } from 'hono';
import type { AdminEnv } from '../env';
import { imageUrl } from '../images/images';
import { invalid, problem, readJson } from '../problem';
import { Validator } from './validator';

export type SqlValue = string | number | null;

/** Describes one ordered content table for the generic admin endpoints. */
export interface Collection<Dto extends { id: string; order: number }> {
  table: 'projects' | 'skill_groups' | 'roles';
  /** Selected columns; must include `id` and `sort_order`. */
  columns: string;
  toDto(row: Record<string, unknown>, imageUrl: (key: string) => string): Dto;
  /** Reads the editable fields from a create/update body as column → value. */
  read(v: Validator): Record<string, SqlValue>;
  /** Columns holding R2 image keys; replaced or deleted images are removed from R2. */
  imageColumns?: readonly string[];
}

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

/**
 * CRUD + reorder for an ordered collection:
 * GET / · POST / · PUT /order · PUT /:id · DELETE /:id
 */
export function collectionRoutes<Dto extends { id: string; order: number }>(
  col: Collection<Dto>,
): Hono<AdminEnv> {
  const listSql = `SELECT ${col.columns} FROM ${col.table} ORDER BY sort_order, id`;
  const byIdSql = `SELECT ${col.columns} FROM ${col.table} WHERE id = ?`;

  const toDto = (c: Context<AdminEnv>, row: Record<string, unknown>) =>
    col.toDto(row, (key) => imageUrl(c.req.url, key));
  const list = async (c: Context<AdminEnv>) => {
    const { results } = await c.env.DB.prepare(listSql).all<Record<string, unknown>>();
    return results.map((row) => toDto(c, row));
  };
  const find = async (c: Context<AdminEnv>, id: string) => {
    const row = await c.env.DB.prepare(byIdSql).bind(id).first<Record<string, unknown>>();
    return row ? toDto(c, row) : null;
  };
  const imageColumns = col.imageColumns ?? [];
  /** Current image keys of an entry (column → key). */
  const imagesOf = async (c: Context<AdminEnv>, id: string): Promise<Record<string, unknown>> => {
    if (imageColumns.length === 0) return {};
    const sql = `SELECT ${imageColumns.join(', ')} FROM ${col.table} WHERE id = ?`;
    return (await c.env.DB.prepare(sql).bind(id).first<Record<string, unknown>>()) ?? {};
  };
  /** Deletes images that are no longer referenced (in the background). */
  const dropImages = (c: Context<AdminEnv>, keys: unknown[]) => {
    const stale = keys.filter((key): key is string => typeof key === 'string' && key !== '');
    if (stale.length) c.executionCtx.waitUntil(c.env.IMAGES.delete(stale));
  };
  const notFound = (c: Context<AdminEnv>, id: string) =>
    problem(c, 404, 'Not Found', `No entry with id "${id}".`);

  return new Hono<AdminEnv>()
    .get('/', async (c) => c.json(await list(c)))

    .post('/', async (c) => {
      const v = new Validator(await readJson(c));
      const id = v.slug('id');
      const values = col.read(v);
      if (!v.ok) return invalid(c, v.errors);
      if (await find(c, id)) return problem(c, 409, 'Conflict', `An entry with id "${id}" already exists.`);

      const names = Object.keys(values);
      await c.env.DB.prepare(
        `INSERT INTO ${col.table} (id, sort_order, ${names.join(', ')}) ` +
          `VALUES (?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM ${col.table}), ${names.map(() => '?').join(', ')})`,
      )
        .bind(id, ...Object.values(values))
        .run();
      c.header('Location', `${c.req.path.replace(/\/$/, '')}/${id}`);
      return c.json(await find(c, id), 201);
    })

    .put('/order', async (c) => {
      const body = (await readJson(c)) as { ids?: unknown };
      const ids = Array.isArray(body.ids) ? body.ids : null;
      const current = (await list(c)).map((item) => item.id);
      const valid =
        ids !== null &&
        ids.every((id) => typeof id === 'string') &&
        ids.length === current.length &&
        new Set(ids).size === ids.length &&
        current.every((id) => ids.includes(id));
      if (!valid) {
        return invalid(c, { ids: 'Send every id of the collection exactly once, in the new order.' });
      }
      await c.env.DB.batch(
        (ids as string[]).map((id, index) =>
          c.env.DB.prepare(`UPDATE ${col.table} SET sort_order = ? WHERE id = ?`).bind(index + 1, id),
        ),
      );
      return c.json(await list(c));
    })

    .put('/:id', async (c) => {
      const id = c.req.param('id');
      const v = new Validator(await readJson(c));
      const values = col.read(v);
      if (!v.ok) return invalid(c, v.errors);

      const before = await imagesOf(c, id);
      const assignments = Object.keys(values).map((name) => `${name} = ?`);
      const { meta } = await c.env.DB.prepare(
        `UPDATE ${col.table} SET ${assignments.join(', ')}, updated_at = ${NOW} WHERE id = ?`,
      )
        .bind(...Object.values(values), id)
        .run();
      if (!meta.changes) return notFound(c, id);
      dropImages(
        c,
        imageColumns.filter((name) => before[name] !== values[name]).map((name) => before[name]),
      );
      return c.json(await find(c, id));
    })

    .delete('/:id', async (c) => {
      const id = c.req.param('id');
      const before = await imagesOf(c, id);
      const { meta } = await c.env.DB.prepare(`DELETE FROM ${col.table} WHERE id = ?`).bind(id).run();
      if (!meta.changes) return notFound(c, id);
      dropImages(c, Object.values(before));
      return c.body(null, 204);
    });
}
