# Portfolio API (Cloudflare Worker)

Serves the editable portfolio content (projects, skill groups, career roles) from a
Cloudflare D1 database, receives contact form messages, and powers the admin panel
(`/admin` on the site). Built with [Hono](https://hono.dev). The contract is documented in
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
| *      | `/api/v1/admin/*` | admin panel API, behind Cloudflare Access (see [API.md](../API.md#admin-api-admin)) |

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

## Admin panel

The site's `/admin` page edits projects, skill groups and roles (create, edit, reorder,
drafts) and lists contact messages. It talks to `/api/v1/admin/*`.

**Locally:** `.dev.vars` sets `ADMIN_DEV_BYPASS=true`, which signs you in as `dev@localhost`
for requests to localhost only. Run `pnpm dev` here and `pnpm start` in the repo root, then
open http://localhost:4200/admin. The admin API has no mock and always uses the local Worker.

**Production: Cloudflare Access.** The admin needs the API on the site's domain (Worker route
`mitjakurath.ch/api/*`, see below). Access works with cookies, so a separate workers.dev domain
won't do.

1. Cloudflare dashboard → Zero Trust → Access → Applications → Add → Self-hosted.
   - Application domain: `mitjakurath.ch`, paths `admin` **and** `api/v1/admin`.
   - Policy: Allow → Emails → your email address.
2. Copy the application's **AUD tag**. Your team domain is shown under Settings → Custom
   pages, e.g. `https://your-team.cloudflareaccess.com`.
3. Set both in `wrangler.jsonc` (`ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`). Optionally set
   `ADMIN_EMAILS` as a second check.
4. Optional "Rebuild site" button: Pages → Settings → Builds → Deploy hooks → add one, then
   `pnpm exec wrangler secret put DEPLOY_HOOK_URL`. This only exists for Git-connected Pages
   projects. Without it, visitors still see changes right away, and crawlers see them after
   the next deploy.

The Worker verifies Access's signed JWT on every admin request (signature, issuer, audience).
Never set `ADMIN_DEV_BYPASS` in production. It only works for localhost anyway.

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
     `Portfolio <contact@mitjakurath.ch>`) in `wrangler.jsonc`.
   - Without these, messages are only stored. The admin panel (next step) will list them.
3. Deploy the Worker first, then the site with the form enabled.

Locally, `.dev.vars` uses Cloudflare's test secret. It pairs with the invisible, always-passing
test site key in `environment.ts`. The widget runs in `interaction-only` mode, so visitors only
see it in the rare case Cloudflare wants a click.

## First deploy

```bash
cd api
pnpm exec wrangler login
pnpm exec wrangler d1 create portfolio      # answer "no" to adding it for you; put the printed
                                            # database_id into the existing DB binding in wrangler.jsonc
pnpm db:migrate:remote
pnpm db:seed:remote                         # once; later the admin panel edits the data
pnpm exec wrangler secret put TURNSTILE_SECRET_KEY   # see "Contact form"
pnpm run deploy                             # → https://portfolio-api.<account>.workers.dev
```

Then point the site at it, either:

- **Same domain (recommended, no CORS):** add a Worker route such as `mitjakurath.ch/api/*` in the
  Cloudflare dashboard (Workers → portfolio-api → Settings → Domains & Routes). The site's
  default `apiBaseUrl: '/api/v1'` then works as is.
- **workers.dev URL:** set `apiBaseUrl` in `src/environments/environment.prod.ts` to
  `https://portfolio-api.<account>.workers.dev/api/v1` and list the site's origin in
  `ALLOWED_ORIGINS`.

For pre-rendering with live content, build the site with
`PORTFOLIO_API_URL=https://…/api/v1` (Cloudflare Pages: Settings → Environment variables).

`pnpm db:seed:remote` deletes and re-inserts all content. Don't run it again once you've
started editing real data.
