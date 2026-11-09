# Portfolio API — v1

The API serves the content that changes: **projects, skill groups and career roles**.
Static site texts (name, SEO, navigation, hero, section headings, about text, contact links,
footer) ship with the frontend in `src/app/core/content/site-content.ts`.

The reference implementation is the Cloudflare Worker in [`api/`](api/README.md)
(Hono + D1).

- **Base URL:** `/api/v1` (configurable via `environment.apiBaseUrl`)
- **Format:** `application/json; charset=utf-8`, camelCase property names
- **Ordering:** arrays with an `order` field are sorted ascending by the client, so the server may return them in any order
- **Errors:** RFC 7807 `application/problem+json` (Spring Boot: `spring.mvc.problemdetails.enabled=true`)
- **Auth:** none (public, read-only content plus one public `POST`)

| Method | Path                | Purpose                                         | Used by the UI |
|--------|---------------------|-------------------------------------------------|----------------|
| GET    | `/projects`         | Ordered list of projects                        | via `/portfolio` |
| GET    | `/skills`           | Ordered skill groups                            | via `/portfolio` |
| GET    | `/experience`       | Ordered career roles                            | via `/portfolio` |
| GET    | `/portfolio`        | Aggregate of the three above (one-shot load)    | **yes, on start** |
| POST   | `/contact-messages` | Submit a contact message                        | contact form (when enabled) |

The TypeScript source of truth for the contract is `src/app/core/api/api.models.ts`.
The sample responses below are generated from `src/app/core/mock/mock-data.ts`, which is
what the app serves in mock mode.

---

## GET /portfolio

Returns everything the page needs in a single request:

```json
{
  "projects":   [ …ProjectDto, see GET /projects ],
  "skills":     [ …SkillGroupDto, see GET /skills ],
  "experience": { …ExperienceDto, see GET /experience }
}
```

`200 OK` · The Worker sends `Cache-Control: public, max-age=60, stale-while-revalidate=600`
and an `ETag` (repeat requests with `If-None-Match` get `304`).

---

## GET /projects

`200 OK`. `ProjectDto[]`.

| Field | Meaning |
|-------|---------|
| `order` | Sort key (ascending). The card position `01`, `02`… is derived from the sorted index. |
| `artVariant` | `1` signal rings · `2` needle grid · `3` contour lines · `4` fire symbol. |
| `coordinates` | Lines shown in the top-left of the artwork. |
| `layoutClass` | *Optional.* `project-a` … `project-d`. If omitted it cycles a, b, c, d by index. |
| `url` | *Optional.* When present, the card's ↗ arrow links to it (new tab). |

Layout: exactly **4** projects reproduce the original fixed layout. Any other count is laid
out generically (415px steps, alternating sides).

```json
[
  {
    "id": "alpine-signal",
    "order": 1,
    "name": "Alpine Signal",
    "type": "Field communication",
    "year": "2025",
    "stack": "React / TypeScript / WebSockets",
    "description": "A resilient coordination platform built for teams operating beyond reliable coverage.",
    "artVariant": 1,
    "coordinates": [
      "N 47.3769°",
      "E 08.5417°"
    ]
  },
  {
    "id": "nadel",
    "order": 2,
    "name": "Nadel",
    "type": "Design infrastructure",
    "year": "2024",
    "stack": "Storybook / Tokens / Figma API",
    "description": "A precise design system that helps product teams find one shared direction.",
    "artVariant": 2,
    "coordinates": [
      "N 47.3769°",
      "E 08.5417°"
    ]
  },
  {
    "id": "contour",
    "order": 3,
    "name": "Contour",
    "type": "Data exploration",
    "year": "2024",
    "stack": "D3.js / Mapbox / Node",
    "description": "Complex environmental data translated into a landscape people can understand.",
    "artVariant": 3,
    "coordinates": [
      "N 47.3769°",
      "E 08.5417°"
    ]
  },
  {
    "id": "feuerstelle",
    "order": 4,
    "name": "Feuerstelle",
    "type": "Community platform",
    "year": "2023",
    "stack": "Next.js / PostgreSQL / PWA",
    "description": "A digital gathering place for local groups, made to work in the field.",
    "artVariant": 4,
    "coordinates": [
      "N 47.3769°",
      "E 08.5417°"
    ]
  }
]
```

---

## GET /skills

`200 OK`. `SkillGroupDto[]`. The group count (`05`) and item indices (`01`, `02`, …) are
derived from `items`. The original grid has 3 columns.

```json
[
  {
    "id": "essentials",
    "order": 1,
    "title": "Essentials",
    "items": [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "CSS systems"
    ]
  },
  {
    "id": "navigation",
    "order": 2,
    "title": "Navigation",
    "items": [
      "Product thinking",
      "UX engineering",
      "Prototyping",
      "Accessibility"
    ]
  },
  {
    "id": "base-layer",
    "order": 3,
    "title": "Base layer",
    "items": [
      "PostgreSQL",
      "Docker",
      "CI / CD",
      "Cloud infrastructure"
    ]
  }
]
```

---

## GET /experience

`200 OK`. `ExperienceDto`. Up to 4 roles use the original chart positions (`.role-1` …
`.role-4`). More roles are spread along the ridge automatically.

```json
{
  "roles": [
    {
      "id": "junior-developer",
      "order": 1,
      "year": "2018",
      "title": "Junior Developer",
      "subtitle": "First ascent",
      "isCurrent": false
    },
    {
      "id": "software-engineer",
      "order": 2,
      "year": "2020",
      "title": "Software Engineer",
      "subtitle": "Product team",
      "isCurrent": false
    },
    {
      "id": "senior-developer",
      "order": 3,
      "year": "2022",
      "title": "Senior Developer",
      "subtitle": "Technical lead",
      "isCurrent": false
    },
    {
      "id": "independent",
      "order": 4,
      "year": "2025",
      "title": "Independent",
      "subtitle": "New routes",
      "isCurrent": true
    }
  ]
}
```

---

## POST /contact-messages

Request (`Content-Type: application/json`):

```json
{
  "name": "Ada Lovelace",
  "email": "ada@example.com",
  "message": "Let’s build something together."
}
```

Validation: `name` required (≤ 200), `email` required and valid (≤ 320), `message` required (≤ 5000).

`201 Created` (optionally with a `Location: /api/v1/contact-messages/{id}` header):

```json
{
  "id": "0b8f6a2e-5d0c-4f1e-9a51-0c7b8d2e1f3a",
  "receivedAt": "2025-11-09T10:15:30Z"
}
```

`400 Bad Request` (`application/problem+json`):

```json
{
  "type": "about:blank",
  "title": "Bad Request",
  "status": 400,
  "detail": "name, email and message are required.",
  "instance": "/api/v1/contact-messages"
}
```

Recommended: rate-limit by IP (e.g. `429 Too Many Requests` as problem+json).

---

## Errors

Every non-2xx response should be `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "Content store is not reachable.",
  "instance": "/api/v1/portfolio"
}
```

The client maps this to `ApiError { status, title, detail, type, instance }`. If loading
`/portfolio` fails, the static sections stay visible and the data sections are replaced by
an error block with a **Try again** button.

---

## Spring Boot notes (alternative backend)

**Problem details:**

```properties
spring.mvc.problemdetails.enabled=true
```

**CORS.** Only needed when the frontend is *not* served through the dev proxy or the same
origin. The dev proxy (`proxy.conf.json`, `/api → http://localhost:8080`) avoids CORS
locally. Otherwise:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:4200")   // add your production origin
        .allowedMethods("GET", "POST")
        .allowedHeaders("Content-Type", "Accept");
  }
}
```

You can also annotate the controller with `@CrossOrigin(origins = "http://localhost:4200")`.

**Controller sketch:**

```java
@RestController
@RequestMapping("/api/v1")
class PortfolioController {
  @GetMapping("/projects")    List<ProjectDto> projects()    { … }
  @GetMapping("/skills")      List<SkillGroupDto> skills()   { … }
  @GetMapping("/experience")  ExperienceDto experience()     { … }
  @GetMapping("/portfolio")   PortfolioDto portfolio()       { return new PortfolioDto(projects(), skills(), experience()); }

  @PostMapping("/contact-messages")
  ResponseEntity<ContactMessageResponse> contact(@Valid @RequestBody ContactMessageRequest req) { … }
}
```

Java records map 1:1 to the TypeScript interfaces (Jackson serialises camelCase by default).
Optional fields (`layoutClass`, `url`) can be omitted or `null`.
