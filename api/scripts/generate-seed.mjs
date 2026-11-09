// Writes seed/seed.sql from the frontend's mock content (the original site texts).
// Node 22.18+ runs the TypeScript mock file directly (type stripping).
import { mkdirSync, writeFileSync } from 'node:fs';
import { buildSeedSql } from './seed-sql.mjs';

const { MOCK_PORTFOLIO } = await import('../../src/app/core/mock/mock-data.ts');

const target = new URL('../seed/seed.sql', import.meta.url);
mkdirSync(new URL('.', target), { recursive: true });
writeFileSync(target, buildSeedSql(MOCK_PORTFOLIO));
console.log(`Wrote ${target.pathname}`);
