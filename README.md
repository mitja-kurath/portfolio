# Mitja Kurath – Base Camp

An Angular 21 rebuild of the React portfolio, pixel-faithful to the original.

- **Static texts** (name, SEO, navigation, hero, section headings, about, contact links,
  footer) live in `src/app/core/content/site-content.ts`. Edit and redeploy.
- **Editable content** (projects, skill groups, career roles) comes from the REST API in
  [`api/`](api/README.md), a Cloudflare Worker with a D1 database. Contract: [API.md](API.md).

## Run

```bash
pnpm install
pnpm start            # ng serve → http://localhost:4200, mock API, no backend needed
pnpm test             # Vitest unit tests (ng test)
pnpm build            # production build, pre-rendered → dist/portfolio/browser
```

## Production build & pre-rendering

`ng build` pre-renders the page to static HTML (`outputMode: "static"`). Crawlers, link
previews (Open Graph / Twitter tags) and visitors without JavaScript get the full content.
Deploy `dist/portfolio/browser/` to any static host, or let Spring Boot serve it from
`src/main/resources/static`.

Point the build at your API so the real content is baked into the HTML:

```bash
PORTFOLIO_API_URL=http://localhost:8080/api/v1 pnpm build     # bash
$env:PORTFOLIO_API_URL="http://localhost:8080/api/v1"; pnpm build   # PowerShell
```

Without `PORTFOLIO_API_URL`, the build pre-renders the mock content and prints a warning.

At runtime the browser starts from the pre-rendered content and fetches
`environment.apiBaseUrl` + `/portfolio` once in the background:
- A newer response replaces the content, so content changes show up without a rebuild.
- A failed request keeps the pre-rendered content on screen.

Rebuild whenever you want crawlers to see new content.

## Deploy (Cloudflare Pages)

- **From your machine:** `pnpm run deploy` builds and uploads `dist/portfolio/browser` (see
  `wrangler.jsonc`). Use `pnpm run deploy`, not `pnpm deploy`: the latter is a built-in pnpm
  command and ignores the script.
- **Git integration** (Pages → Settings → Builds):
  - Build command: `pnpm build`
  - Build output directory: `dist/portfolio/browser`
  - Node version comes from `.node-version` (22); pnpm is detected from `pnpm-lock.yaml`.
  - Optional environment variable: `PORTFOLIO_API_URL` (pre-render real content; see below).

## Mock API vs. real API

| File | `useMock` | Used by |
|------|-----------|---------|
| `src/environments/environment.ts` | `true` | `ng serve`, `ng build --configuration development` |
| `src/environments/environment.prod.ts` | `false` | `ng build` (production) |

- **Mock mode:** `mockApiInterceptor` answers every API call from
  `src/app/core/mock/mock-data.ts` after a ~150 ms delay (`mockDelayMs`). The mock data
  is a lazily loaded chunk, so production never downloads it.
- **Real backend:** start the Worker (`cd api && pnpm dev`, see [api/README.md](api/README.md))
  and set `useMock: false` in `environment.ts`. The Worker listens on `http://localhost:8080`. `ng serve` proxies `/api/*` there (`proxy.conf.json`), so there
  is no CORS setup in development. Change `target` in `proxy.conf.json` for another port.
- **Other API host:** set `apiBaseUrl` to an absolute URL, e.g.
  `https://api.example.com/api/v1`, and enable CORS on the server (see API.md).

Other flags in the environment files:

- `persistTheme`: set it to `true` to remember light/dark mode in `localStorage`. Default: off.
- `contactForm.enabled` / `contactForm.turnstileSiteKey`: the contact form posts to the API and
  is protected by Cloudflare Turnstile.
  - Dev: on, with Cloudflare's test key.
  - Production: off until the API is deployed (see [api/README.md](api/README.md#contact-form)).

## Structure

```
src/
  styles.css                 original index.css (Tailwind import → vendored preflight),
                             with tracking/alignment fixes for overlapping type
  styles/preflight.css       Tailwind v4 base reset the design relies on
  styles/a11y.css            accessibility fixes on top of the original (pointer cursor,
                             visible focus incl. clip-path shapes, minimum text sizes)
  main.server.ts             server entry, used only for build-time pre-rendering
  environments/              apiBaseUrl / useMock / mockDelayMs / persistTheme
  app/
    app.ts|html              shell: static sections + API sections (loading / error / ready)
    app.config.ts            HttpClient (fetch) + interceptors, router, hydration
    app.config.server.ts     build-time API (PORTFOLIO_API_URL or mock)
    core/content/            static site texts (site-content.ts) and their types
    core/api/                DTOs, typed client, api + mock interceptors, ApiError
    core/state/              PortfolioStore (httpResource), Theme, Clock, Breakpoint, SEO
    core/mock/mock-data.ts   original projects / skills / roles as API payload (also the DB seed)
    core/util/               pad2/byOrder, nav-counter derivation
    shared/                  contour svg, section label, display heading
    features/                topbar, hero, work (+card, art, route layout), about,
                             equipment (+kit group), experience, contact (+sign, form),
                             footer, status (loading / error)
api/                         Cloudflare Worker API (Hono + D1), see api/README.md
```

Components use attribute selectors (`section[appHero]`, `article[appProjectCard]`,
`svg[appContour]`, …). The host element is the original element, so the DOM and class names
match the React version exactly. With `ViewEncapsulation.None`, the global stylesheet styles
them unchanged.
