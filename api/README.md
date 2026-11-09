# Portfolio API (Cloudflare Worker)

Serves the editable portfolio content (projects, skill groups, career roles) from a
Cloudflare D1 database, and receives contact form messages. Built with [Hono](https://hono.dev). The contract is documented in
[../API.md](../API.md); the TypeScript types are shared with the frontend
(`src/app/core/api/api.models.ts`).

Static site texts (name, headings, links, footer) are **not** served here; they live in the
frontend (`src/app/core/content/site-content.ts`).

## Local development

```bash
cd api
pnpm install
cp .dev.vars.example .dev.vars   # Turnstile test secret for the contact form
pnpm db:migrate:local   # create the tables in a local D1 (.wrangler/)
pnpm db:seed:local      # fill them with the original content (from the frontend mock data)
pnpm dev                # http://localhost:8080/api/v1/portfolio
```

To use it from the site: set `useMock: false` in `src/environments/environment.ts` and run
`pnpm start` in the repo root. `ng serve` proxies `/api` to port 8080, so no CORS setup is needed.

```bash
pnpm test        # integration tests (real SQL on Node's built-in SQLite)
pnpm typecheck
```

## Endpoints

| Method | Path                 | Response |
|--------|----------------------|----------|
| GET    | `/api/v1/portfolio`  | `{ projects, skills, experience: { roles } }` (used by the site) |
| GET    | `/api/v1/projects`   | published projects, by `order` |
| GET    | `/api/v1/skills`     | skill groups, by `order` |
| GET    | `/api/v1/experience` | `{ roles }`, by `order` |
| POST   | `/api/v1/contact-messages` | stores a message, emails you (see below) |

- Responses are cacheable for 60 s (`stale-while-revalidate` 10 min) and carry an `ETag`.
- Errors are `application/problem+json` (RFC 7807), never cached.
- CORS allows the origins in `ALLOWED_ORIGINS` (`wrangler.jsonc`).
- Projects with `published = 0` are drafts: stored, but not served.

## Data model (`migrations/`)

| Table          | Notes |
|----------------|-------|
| `projects`     | `art_variant` 1–4, `coordinates` JSON array, optional `layout_class` / `url`, `published` |
| `skill_groups` | `items` JSON array |
| `roles`        | `is_current` marks the role shown as NOW |
| `contact_messages` | name, email, message, `created_at`, `read_at` (no IP or user agent) |

The content tables have `sort_order` (→ `order` in the API). Schema changes go in a new numbered
migration file (`0002_….sql`); never edit one that has already been applied remotely.

## Contact form

`POST /api/v1/contact-messages` validates the input and verifies the Cloudflare Turnstile token.
It allows 5 posts per IP per minute, ignores bots that fill the honeypot field, stores the
message in D1, and emails it to you through [Resend](https://resend.com) (optional).

Setup for production:

1. **Turnstile:** Cloudflare dashboard → Turnstile → Add widget. Add your site's hostname(s).
   Mode: Managed.
   - Put the **site key** in `src/environments/environment.prod.ts` (`contactForm.turnstileSiteKey`)
     and set `contactForm.enabled: true`.
   - Store the **secret key**: `pnpm exec wrangler secret put TURNSTILE_SECRET_KEY`.
2. **Email (optional):** create a Resend account and verify your domain.
   - `pnpm exec wrangler secret put RESEND_API_KEY`
   - Set `CONTACT_TO_EMAIL` (your inbox) and `CONTACT_FROM_EMAIL` (e.g.
     `Portfolio <contact@kurath.dev>`) in `wrangler.jsonc`.
   - Without these, messages are only stored. The admin panel (next step) will list them.
3. Deploy the Worker first, then the site with the form enabled.

Locally, `.dev.vars` uses Cloudflare's test secret. It pairs with the always-passing test site
key in `environment.ts`, so the widget shows "for testing only".

## First deploy

```bash
cd api
pnpm exec wrangler login
pnpm exec wrangler d1 create portfolio      # copy the printed database_id into wrangler.jsonc
pnpm db:migrate:remote
pnpm db:seed:remote                         # once; later the admin panel edits the data
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY   # see "Contact form"
pnpm run deploy                             # → https://portfolio-api.<account>.workers.dev
```

Then point the site at it, either:

- **Same domain (recommended, no CORS):** add a Worker route such as `kurath.dev/api/*` in the
  Cloudflare dashboard (Workers → portfolio-api → Settings → Domains & Routes). The site's
  default `apiBaseUrl: '/api/v1'` then works as is.
- **workers.dev URL:** set `apiBaseUrl` in `src/environments/environment.prod.ts` to
  `https://portfolio-api.<account>.workers.dev/api/v1` and list the site's origin in
  `ALLOWED_ORIGINS`.

For pre-rendering with live content, build the site with
`PORTFOLIO_API_URL=https://…/api/v1` (Cloudflare Pages: Settings → Environment variables).

`pnpm db:seed:remote` deletes and re-inserts all content. Don't run it again once you've
started editing real data.
