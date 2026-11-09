# Portfolio API — v1

The Angular frontend loads **all** its content from this API. To change the site, change
the API response. No template edits are needed.

- **Base URL:** `/api/v1` (configurable via `environment.apiBaseUrl`)
- **Format:** `application/json; charset=utf-8`, camelCase property names
- **Ordering:** arrays with an `order` field are sorted ascending by the client, so the server may return them in any order
- **Errors:** RFC 7807 `application/problem+json` (Spring Boot: `spring.mvc.problemdetails.enabled=true`)
- **Auth:** none (public, read-only content plus one public `POST`)

| Method | Path                | Purpose                                         | Used by the UI |
|--------|---------------------|-------------------------------------------------|----------------|
| GET    | `/site`             | Global site, hero, sections, contact, footer    | via `/portfolio` |
| GET    | `/projects`         | Ordered list of projects                        | via `/portfolio` |
| GET    | `/skills`           | Ordered skill groups                            | via `/portfolio` |
| GET    | `/experience`       | Ordered career roles                            | via `/portfolio` |
| GET    | `/portfolio`        | Aggregate of the four above (one-shot load)     | **yes, on start** |
| POST   | `/contact-messages` | Submit a contact message                        | contact form (when enabled) |

The TypeScript source of truth for the contract is `src/app/core/api/api.models.ts`.
The sample responses below are generated from `src/app/core/mock/mock-data.ts`, which is
what the app serves in mock mode.

---

## GET /portfolio

Returns everything the page needs in a single request:

```json
{
  "site":       { …SiteDto, see GET /site },
  "projects":   [ …ProjectDto, see GET /projects ],
  "skills":     [ …SkillGroupDto, see GET /skills ],
  "experience": { …ExperienceDto, see GET /experience }
}
```

`200 OK` · Recommended: `Cache-Control: public, max-age=300` and an `ETag`.

---

## GET /site

`200 OK`. A `SiteDto`.

Field notes:

| Field | Meaning |
|-------|---------|
| `seo.title` / `seo.description` / `seo.language` | Sets `<title>`, `<meta name="description">` and `<html lang>`. |
| `person.firstName` / `lastName` | Hero headline line 1 / outlined line 2. `initials` is used in the brand and the portrait. |
| `timezone` | IANA zone for the footer clock (falls back to `Europe/Zurich` if invalid). `timezoneLabel` is the text next to it. |
| `navigation[].counter` | `projects` = number of projects, `notes` = 1 (about section), `skills` = total number of skill items; `null` → `glyph` is shown instead. Counters are zero-padded. |
| `hero.coordinates`, `hero.taglineLines` | Arrays of lines, rendered separated by `<br>`. |
| `sections.*.number` / `title` / `elevation` | Section label, e.g. `01 / THE ROUTE … 1,240 M` (the unit ` M` is added by the UI). |
| `sections.*.headingLines` + `emphasis` | Big heading: lines separated by `<br>`, then the emphasised `<em>` part. `emphasisInline: true` continues the last line (“the *pack.*”); otherwise the emphasis starts a new line. |
| `sections.experience.altitudes` | Chart altitude labels, bottom to top (max. 3 positions are styled). |
| `sections.experience.currentLabel` | Year label for a role with `isCurrent: true` (e.g. `NOW`). |
| `contactLinks[].kind` | `email` \| `github` \| `linkedin`. Selects the signpost arm (`.sign-{kind}`). `direction: "left"` puts the arrow before the label. `external: true` opens a new tab with `rel="noreferrer"`. |
| `contactForm.enabled` | Shows an extra contact form under the heading. It is **not** part of the original design, so keep it `false` for pixel parity. All its labels come from here. |

```json
{
  "seo": {
    "title": "Mitja Kurath – Base Camp",
    "description": "Mitja Kurath, software developer and scout based in Switzerland. Building things that hold up in any weather.",
    "language": "en"
  },
  "person": {
    "firstName": "MITJA",
    "lastName": "KURATH",
    "initials": "MK",
    "ariaHomeLabel": "Mitja Kurath, home"
  },
  "timezone": "Europe/Zurich",
  "timezoneLabel": "CET",
  "footerCity": "ZÜRICH, CH",
  "brandCoordinates": "46°57′N",
  "navigation": [
    {
      "label": "Work",
      "href": "#work",
      "counter": "projects"
    },
    {
      "label": "Notes",
      "href": "#about",
      "counter": "notes"
    },
    {
      "label": "Kit",
      "href": "#equipment",
      "counter": "skills"
    },
    {
      "label": "Contact",
      "href": "#contact",
      "counter": null,
      "glyph": "↗"
    }
  ],
  "hero": {
    "kicker": "BASE CAMP",
    "routeCode": "ROUTE / MK—25",
    "coordinates": [
      "47° 22′ 00″ N",
      "08° 33′ 00″ E"
    ],
    "altitudeLabel": "ALT.",
    "altitude": 408,
    "taglineLines": [
      "Software developer. Scout.",
      "Building things that hold up",
      "in any weather."
    ],
    "ctaLabel": "Follow the trail",
    "ctaHref": "#work",
    "scrollNote": "SCROLL TO ASCEND"
  },
  "sections": {
    "work": {
      "number": "01",
      "title": "THE ROUTE",
      "elevation": "1,240",
      "headingLines": [
        "Selected"
      ],
      "emphasis": "waypoints.",
      "emphasisInline": false,
      "intro": "A selection of digital products, systems, and experiments made with clarity and built for the long route."
    },
    "about": {
      "number": "02",
      "title": "FIELD NOTES",
      "elevation": "1,872",
      "eyebrowLines": [
        "DEVELOPER BY TRADE",
        "PATHFINDER BY NATURE"
      ],
      "quote": {
        "before": "Good systems, like good trails, should make the way forward",
        "emphasis": "feel obvious."
      },
      "paragraphs": [
        "I’m Mitja, a software developer based in Switzerland. I care about thoughtful interfaces, durable code, and reducing complex problems to their clearest form.",
        "Away from the screen, I lead a local scout group. It keeps me practical: plan well, adapt quickly, leave things better than you found them."
      ],
      "portraitLabel": "// PORTRAIT, SOMEWHERE OUTSIDE",
      "stampLines": [
        "OUT",
        "THERE"
      ],
      "stampSmall": "EST. 1997",
      "linkLabel": "More about the route",
      "linkHref": "#contact"
    },
    "equipment": {
      "number": "03",
      "title": "EQUIPMENT",
      "elevation": "2,310",
      "headingLines": [
        "What’s in",
        "the"
      ],
      "emphasis": "pack.",
      "emphasisInline": true,
      "intro": "// A working kit for taking digital products from first sketch to reliable release."
    },
    "experience": {
      "number": "04",
      "title": "THE ASCENT",
      "elevation": "2,780",
      "headingLines": [
        "Experience,"
      ],
      "emphasis": "in elevation.",
      "emphasisInline": false,
      "introLines": [
        "Every role added perspective.",
        "Every project raised the bar."
      ],
      "altitudes": [
        "1,200 M",
        "2,000 M",
        "2,800 M"
      ],
      "currentLabel": "NOW"
    },
    "contact": {
      "number": "05",
      "title": "SUMMIT",
      "elevation": "3,463",
      "note": [
        "// THE VIEW IS BETTER",
        "WHEN SHARED"
      ],
      "headingLines": [
        "LET’S BUILD",
        "SOMETHING"
      ],
      "emphasis": "TOGETHER.",
      "emphasisInline": false
    }
  },
  "contactLinks": [
    {
      "kind": "email",
      "label": "Email",
      "href": "mailto:hello@mitjakurath.ch",
      "hint": "0.0 KM · NOW",
      "external": false,
      "direction": "right"
    },
    {
      "kind": "github",
      "label": "GitHub",
      "href": "https://github.com/",
      "hint": "1 CLICK · NEARBY",
      "external": true,
      "direction": "left"
    },
    {
      "kind": "linkedin",
      "label": "LinkedIn",
      "href": "https://linkedin.com/",
      "hint": "2 MIN · NORTH",
      "external": true,
      "direction": "right"
    }
  ],
  "contactForm": {
    "enabled": false,
    "title": "Send a message",
    "nameLabel": "Name",
    "emailLabel": "Email",
    "messageLabel": "Message",
    "submitLabel": "Send message",
    "sendingLabel": "Sending…",
    "successMessage": "Message received. I’ll get back to you soon.",
    "errorMessage": "The message could not be sent. Please try again or use email."
  },
  "footer": {
    "localTimeLabel": "LOCAL TIME",
    "compassNorth": "N",
    "compassLabelLines": [
      "KEEP",
      "EXPLORING"
    ],
    "credit": "Made with care & a little trail dust.",
    "ownerName": "MITJA KURATH",
    "backToTopLabel": "BACK TO BASE CAMP",
    "backToTopHref": "#base-camp"
  }
}
```

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
`/portfolio` fails, the page shows an error block with a **Try again** button.

---

## Spring Boot notes

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
  @GetMapping("/site")        SiteDto site()                 { … }
  @GetMapping("/projects")    List<ProjectDto> projects()    { … }
  @GetMapping("/skills")      List<SkillGroupDto> skills()   { … }
  @GetMapping("/experience")  ExperienceDto experience()     { … }
  @GetMapping("/portfolio")   PortfolioDto portfolio()       { return new PortfolioDto(site(), projects(), skills(), experience()); }

  @PostMapping("/contact-messages")
  ResponseEntity<ContactMessageResponse> contact(@Valid @RequestBody ContactMessageRequest req) { … }
}
```

Java records map 1:1 to the TypeScript interfaces (Jackson serialises camelCase by default).
Optional fields (`glyph`, `layoutClass`, `url`, `emphasisInline`) can be omitted or `null`.
