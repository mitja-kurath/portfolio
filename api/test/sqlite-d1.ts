import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync, type SQLInputValue } from 'node:sqlite';

/**
 * Minimal D1 stand-in backed by Node's built-in SQLite (D1 is SQLite too).
 * Covers what the API uses: prepare/bind/first/all/run and batch.
 */
class Statement {
  constructor(
    private readonly db: DatabaseSync,
    private readonly sql: string,
    private readonly params: SQLInputValue[] = [],
  ) {}

  bind(...params: SQLInputValue[]): Statement {
    return new Statement(this.db, this.sql, params);
  }

  async first<T>(): Promise<T | null> {
    return (this.db.prepare(this.sql).get(...this.params) as T | undefined) ?? null;
  }

  async all<T>(): Promise<{ results: T[]; success: true; meta: object }> {
    return { results: this.db.prepare(this.sql).all(...this.params) as T[], success: true, meta: {} };
  }

  async run(): Promise<{ results: []; success: true; meta: { changes: number } }> {
    const { changes } = this.db.prepare(this.sql).run(...this.params);
    return { results: [], success: true, meta: { changes: Number(changes) } };
  }
}

export function createTestD1(...sqlScripts: string[]): { d1: D1Database; db: DatabaseSync } {
  const db = new DatabaseSync(':memory:');
  const migrations = new URL('../migrations/', import.meta.url);
  for (const file of readdirSync(migrations).sort()) {
    db.exec(readFileSync(new URL(file, migrations), 'utf8'));
  }
  for (const script of sqlScripts) db.exec(script);
  return { d1: wrapD1(db), db };
}

/** Exposes a node:sqlite database through the D1 interface. */
export function wrapD1(db: DatabaseSync): D1Database {
  const d1 = {
    prepare: (sql: string) => new Statement(db, sql),
    // D1 runs a batch as one transaction.
    batch: async (statements: Statement[]) => {
      db.exec('BEGIN');
      try {
        const results = await Promise.all(statements.map((s) => s.all()));
        db.exec('COMMIT');
        return results;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  return d1 as unknown as D1Database;
}
