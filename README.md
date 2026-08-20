# Kabura Tiling Group

Marketing site, quote pipeline and lead dashboard for **Kabura Tiling Group Pty
Ltd** — *We Tile. You Smile.* — Western Australia.

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · React Three
Fiber · Framer Motion · Lenis · Supabase.

---

## Contents

1. [Quick start](#quick-start)
2. [Commands](#commands)
3. [File structure](#file-structure)
4. [Environment variables](#environment-variables)
5. [Supabase setup](#supabase-setup)
6. [Assets](#assets)
7. [Deployment](#deployment)
8. [How honesty is enforced](#how-honesty-is-enforced)
9. [Performance and accessibility](#performance-and-accessibility)
10. [What Kabura still needs to supply](#what-kabura-still-needs-to-supply)

---

## Quick start

```bash
npm install
cp .env.example .env.local     # fill in what you have; blanks are safe
npm run dev                    # http://localhost:3000
```

The marketing site runs **fully without Supabase**. Without it, the quote form
explains that it is not connected instead of silently failing, and `/admin` is
switched off. Nothing else changes.

The quote intake degrades in one more step: with only the anon key it still
captures the enquiry (RLS grants `anon` INSERT and nothing more) and skips photo
uploads, because indexing an upload needs privileges `anon` does not have and
storing files nothing points at would be worse than not storing them. Losing a
lead to a missing environment variable is the worst outcome available, so that
path exists rather than a hard failure.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on :3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run check` | typecheck → lint → build, in order |
| `npm run assets:fetch` | Download the Higgsfield generations |
| `npm run assets:optimise` | Rebuild `public/media` + the media manifest |
| `npm run assets` | fetch → optimise |

## File structure

```
.
├── assets-src/                     source assets — see assets-src/README.md
│   ├── raw/                        originals supplied by Kabura
│   └── higgsfield/manifest.json    generated visuals: model, prompt, URL, usage
├── scripts/
│   ├── optimise-assets.mjs         crops, grades, transcodes → public/media
│   ├── materials.mjs               procedural stone/tile swatch generator
│   └── fetch-higgsfield-assets.mjs downloads from the manifest
├── supabase/migrations/            schema + row level security
├── legacy/                         the previous static site, kept for reference
├── public/media/
│   ├── scenes/                     graded photography
│   ├── materials/                  material swatches for the layout tools
│   ├── video/                      transcoded mp4 + poster frames
│   └── texture/grain.png           film-grain overlay
└── src/
    ├── app/
    │   ├── layout.tsx              root shell, fonts, base metadata
    │   ├── globals.css             design tokens and base layer
    │   ├── opengraph-image.tsx     social card, generated at build time
    │   ├── sitemap.ts / robots.ts
    │   ├── (marketing)/            public site — shares header/footer/chrome
    │   │   ├── page.tsx            homepage
    │   │   ├── services/[slug]/
    │   │   ├── projects/[slug]/
    │   │   ├── service-areas/[slug]/
    │   │   ├── bathrooms/ about/ contact/ quote/ privacy/ terms/
    │   ├── admin/                  private dashboard + server actions
    │   └── api/quote/route.ts      quote intake (service role, server only)
    ├── assets/fonts/               self-hosted Inter Tight + Instrument Serif
    ├── components/
    │   ├── layout/                 Header, Footer, MobileCTABar, SmoothScroll,
    │   │                           ScrollProgress, Cursor, PageTransition,
    │   │                           PageHero, Logo
    │   ├── ui/                     MagneticButton, Reveal, RevealText, Section,
    │   │                           AmbientVideo, BeforeAfterSlider, Marquee,
    │   │                           Skeleton, PlaceholderNotice
    │   ├── three/                  SlabScene (r3f), SlabStage (loader + fallback)
    │   ├── home/                   Hero, LayerStory, ServicesShowcase,
    │   │                           ProjectsShowcase, BeforeAfterSection,
    │   │                           VideoRail, WhyKabura, TileWall,
    │   │                           BathroomVisualiser, Testimonials,
    │   │                           ServiceAreasSection, CTASection
    │   ├── projects/               ProjectCard, ProjectsGrid, ProjectGallery
    │   ├── quote/                  QuoteWizard, Field
    │   ├── admin/                  AdminShell, LoginForm, StatusSelect,
    │   │                           StatusBadge, NoteForm
    │   └── seo/                    JsonLd, Breadcrumbs
    ├── hooks/                      media query, in-view, scroll, capability
    └── lib/
        ├── site.ts                 business facts (all from env vars)
        ├── services.ts             the twelve services
        ├── service-areas.ts        confirmed WA locations
        ├── projects.ts             placeholder project records
        ├── media.ts                typed access to the media manifest
        ├── data.ts                 Supabase reads with placeholder fallback
        ├── seo.ts                  metadata + structured data builders
        ├── quote-schema.ts         validation shared by client and server
        ├── admin-auth.ts           staff session resolution
        └── supabase/               client, server, admin (service role), types
```

## Environment variables

Copy `.env.example` to `.env.local`. **Every business detail is blank by
default and blank is safe** — the site renders a clearly-labelled "To be
supplied" placeholder rather than inventing a number, address or registration.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | production | Canonical URLs, OpenGraph, sitemap, robots |
| `NEXT_PUBLIC_BUSINESS_PHONE` | — | Header, footer, contact page, `tel:` links, LocalBusiness schema |
| `NEXT_PUBLIC_BUSINESS_EMAIL` | — | Footer, contact page, `mailto:` links |
| `NEXT_PUBLIC_BUSINESS_ABN` | — | Footer, contact page |
| `NEXT_PUBLIC_BUSINESS_STREET` | — | Optional — omit if there is no shopfront |
| `NEXT_PUBLIC_BUSINESS_SUBURB` | — | Postal address in structured data |
| `NEXT_PUBLIC_BUSINESS_POSTCODE` | — | Postal address in structured data |
| `NEXT_PUBLIC_BUSINESS_HOURS` | — | Contact page, `openingHours` in schema |
| `NEXT_PUBLIC_SOCIAL_INSTAGRAM` | — | **Already live** — real URL committed in `site.ts`. Set only to override |
| `NEXT_PUBLIC_SOCIAL_FACEBOOK` | — | as above |
| `NEXT_PUBLIC_SOCIAL_TIKTOK` | — | as above |
| `NEXT_PUBLIC_SOCIAL_YOUTUBE` | — | as above |
| `NEXT_PUBLIC_SOCIAL_GOOGLE` | — | as above, plus the "read our reviews" link |
| `NEXT_PUBLIC_SOCIAL_LINKEDIN` | — | No default. Hidden until a URL is supplied |
| `GOOGLE_PLACES_API_KEY` | for reviews | **Server only.** Places API (New). Unset ⇒ "reviews coming soon" |
| `GOOGLE_PLACE_ID` | for reviews | The business's Place ID |

> There is no Maps key. The coverage panel is drawn from the coordinates in `src/lib/service-areas.ts`, so it needs no Google Cloud project, no billing and no referrer allowlist — and cannot show "This page can't load Google Maps correctly" when one of those is wrong.

| `NEXT_PUBLIC_SUPABASE_URL` | for quotes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for quotes | Publishable key — safe in the browser, every table is behind RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | for photos + admin | **Server only.** Never prefix with `NEXT_PUBLIC_`, never commit. Without it enquiries are still captured through the anon key, but photo uploads are skipped and `/admin` stays off |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | — | Search Console token |

## Social posts ("Latest from Kabura")

The section on the home and services pages renders real published posts only,
listed by hand in `src/lib/social-posts.ts`. It ships empty and shows a follow
panel until entries are added.

There is no live feed, deliberately. Instagram and Facebook need a Meta app plus
a long-lived Page token that expires every 60 days; TikTok needs an approved
Display API app. Scraping the public pages or hot-linking their CDN breaks all
three platforms' terms and stops working without warning. YouTube is the
exception — its thumbnails and embeds are public and documented, so a
`youtubeId` is all an entry needs.

For everything else: save the image into `public/media/social/`, then add an
entry with the real post URL. The file documents the shape.

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run the migrations in `supabase/migrations/` in filename order — either
   with the CLI:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
   or by pasting each file into the SQL editor. They are idempotent, so
   re-running is safe. See `supabase/migrations/README.md` for what each does,
   and `supabase/verify-rls.sql` to re-check the security model afterwards.
3. Copy the project URL, the anon key and the service-role key from
   **Project Settings → API** into `.env.local`.
4. Create your staff login under **Authentication → Users**, then authorise it:
   ```sql
   insert into public.admin_users (user_id, email)
   values ('<the user uuid>', 'you@example.com');
   ```
5. Sign in at `/admin/login`.

### Schema

| Table | Purpose |
| --- | --- |
| `quote_requests` | One row per submission, with a human-readable `reference` (`KB-260818-A3F9C`) and a random `upload_token` linking it to its photos |
| `quote_request_files` | Metadata for each uploaded photo |
| `quote_request_notes` | Internal staff notes — never rendered publicly |
| `projects` / `project_media` | Portfolio content. `is_placeholder` defaults to `true` |
| `reviews` | Ships empty. Nothing appears publicly until `approved = true` |
| `jobs` | The private job calendar — customer names, addresses, notes. **Staff only**: RLS requires `private.is_admin()`, there is no `anon` policy, and base privileges are revoked from `anon`. The public site never reads it |
| `admin_users` | Staff allow-list. Signing up grants nothing on its own |

The public availability calendar does not read `jobs`. It calls
`public.service_availability(from_date, to_date)`, a `SECURITY DEFINER`
function that aggregates first and returns exactly two things per day: the
date, and one of `available` / `limited` / `booked`. There is no column in its
result type for a name, an address or a job — not even a count. Change the
`daily_capacity` constant inside that function to tune how many concurrent jobs
count as fully booked.

Storage bucket `quote-uploads` is **private** — no object is readable by URL.

### Security model

RLS is enabled on every table. The public can do exactly two things:

- `INSERT` a quote request, pinned to `status = 'new'`
- `INSERT` a file into `quote-uploads/<uuid>/…` under its own unguessable
  upload token

The public cannot list enquiries, read another customer's details, modify
anyone's enquiry, or browse uploads — there is no `SELECT`, `UPDATE` or
`DELETE` policy for `anon` on any of it. Staff access is granted only by
membership of `admin_users`, checked through a `SECURITY DEFINER` helper so the
policy does not recurse.

The service-role key is used in exactly one place — `src/app/api/quote/route.ts`
— which imports `server-only`, making it a build error for that module to reach
a client component.

## Assets

See [`assets-src/README.md`](assets-src/README.md) for the full pipeline.

`npm run assets:optimise` crops the burnt-in watermarks off the supplied
imagery, applies one warm-charcoal grade so every source reads as a single art
direction, generates procedural material swatches for the layout tools,
transcodes video with poster frames, and writes `src/lib/media-manifest.json`
with dimensions and blur placeholders.

Source precedence per slot: a Higgsfield generation wins, then a
client-supplied original, then a procedural material field. Components
reference a *key*, never a path, so replacing an image is a pipeline change.

## Deployment

### Vercel (recommended)

1. Push the repository and import it at [vercel.com/new](https://vercel.com/new).
   Framework, build command and output directory are all detected.
2. Add every variable from `.env.example` under **Settings → Environment
   Variables**. Add `SUPABASE_SERVICE_ROLE_KEY` to Production and Preview only,
   and leave it out of any client-visible scope.
3. Set `NEXT_PUBLIC_SITE_URL` to the production domain, without a trailing
   slash — canonicals, OpenGraph, the sitemap and robots.txt all derive from it.
4. Add the custom domain and let Vercel issue the certificate.
5. Submit `https://yourdomain.com/sitemap.xml` in Google Search Console.

### Anywhere else (Node)

```bash
npm ci
npm run build
npm start          # serves on $PORT, default 3000
```

Needs Node 20+. Put it behind a reverse proxy terminating TLS. Docker, Fly.io,
Railway and Render all work with the same two commands.

### Static export

Not supported, and shouldn't be: `/api/quote` and `/admin` are server-rendered
by design.

## How honesty is enforced

The brief asked for no invented business facts. That is enforced structurally
rather than by convention:

- **Contact details** live only in env vars. `site.phone` is `null` until set,
  and every consumer renders `PlaceholderNotice` or a "To be supplied" label
  instead of a broken `tel:` link.
- **Structured data** omits unsupplied fields entirely. An invented value in
  schema.org markup is worse than an absent one.
- **Projects** ship as placeholder records flagged `isPlaceholder`, badged in
  the UI, `noindex`, and excluded from the sitemap.
- **Reviews** ship as an empty table with a "Customer reviews coming soon"
  state. The carousel is fully built and takes over the moment approved rows
  exist.
- **Generated imagery** is labelled wherever it appears in a portfolio context,
  and its provenance is recorded in `assets-src/higgsfield/manifest.json`.
- **The layout tools** state plainly that the surfaces are representative
  swatches rather than specific tile ranges.
- **Service areas** list only confirmed locations, with an explicit "ask us
  about anywhere else" rather than an implied yes.
- **No claims** about years in business, project counts, awards, certifications
  or licence numbers appear anywhere.

## Performance and accessibility

- The 3D scene is a dynamic import that is never requested on the server, on a
  device that fails the capability check (cores, memory, save-data, pointer
  type, viewport width, WebGL support), or before the section nears the
  viewport. Mobile gets a CSS-3D fallback carrying the same message.
- Video mounts only near the viewport, pauses the moment it leaves, uses
  `preload="none"` (`metadata` for the hero), and is skipped entirely on
  save-data, slow connections and reduced-motion. The LCP element is always an
  optimised image, never a video.
- Every image goes through `next/image` with real dimensions and a blur
  placeholder from the manifest, so there is no layout shift.
- Device and viewport state is read through `useSyncExternalStore` rather than
  effect-then-setState, avoiding cascading renders on mount.
- `prefers-reduced-motion` collapses every animated component to its final
  state, and Lenis is not initialised at all.
Measured on the production build (localhost, no throttling):

| Route | JS transferred | LCP |
| --- | --- | --- |
| `/` desktop | 545 KB (incl. the on-demand 3D chunk) | 736 ms |
| `/` mobile | 265 KB (3D never requested) | 400 ms |
| `/services` | 291 KB | 400 ms |
| `/projects` | 303 KB | 340 ms |
| `/quote` | 291 KB | 456 ms |

Two deliberate deviations from the brief's suggested stack:

- **GSAP was removed.** It was wired in to drive ScrollTrigger, but nothing on
  the site ended up using it — every scroll-linked effect runs on Framer
  Motion's `useScroll`, which is already in the bundle. Keeping it meant about
  50 KB gzipped of dead weight on every page. `SmoothScroll.tsx` documents how
  to re-add it if ScrollTrigger-specific behaviour is wanted later.
- **Fonts are self-hosted** rather than fetched through `next/font/google`, so
  builds are deterministic offline and no visitor request reaches a third party.

The layer data behind the 3D slab lives in its own `layers.ts` with no three.js
imports. That is load-bearing: importing it from `SlabScene` pulled the entire
three.js bundle into the shared chunk and cost every page ~254 KB it never used.

- Semantic landmarks and heading order throughout; skip link; visible focus
  rings; the before/after divider is a keyboard-operable `role="slider"`; the
  gallery lightbox is a modal dialog with Escape and arrow keys; form fields
  use real labels with `aria-describedby` error wiring; animated split
  headlines keep the full string in the accessibility tree.

## What Kabura still needs to supply

Nothing below is guessed at anywhere in the code. Send these through and they
appear across the site automatically.

**Business details:**

- [x] ~~Public phone number~~ — 0481 000 331
- [x] ~~Public email address~~ — Kaburatiling@gmail.com
- [x] ~~ABN~~ — 84 668 679 114 (ATO checksum verified)
- [ ] Opening hours
- [ ] Street address, or confirmation that there is no public shopfront
- [x] ~~Instagram~~ — @kaburatilinggroupptyltd
- [ ] Facebook / LinkedIn URLs
- [ ] Google Business Profile: set `GOOGLE_PLACES_API_KEY` + `GOOGLE_PLACE_ID`
      to pull the real reviews (see `.env.example`)
- [ ] Any trade licence or certification numbers you want shown — with the
      registration numbers so they can be verified
- [ ] Confirmation of the suburbs to list in `src/lib/service-areas.ts`

**Content and assets:**

- [ ] Photography of completed projects — ideally 6–10 projects, 4+ images
      each, plus genuine matched before/after pairs from the same room
- [ ] For each project: suburb, project type, tile brand/format, services
      completed, and anything notable about the job
- [x] ~~On-site footage for the video rail~~ — four Higgsfield clips in use;
      real on-site footage would still be better where you have it
- [x] ~~Hero footage~~ — Higgsfield bathroom clip in use
- [ ] The official Kabura logo as a **vector file** (`.svg` or `.ai`).
      `src/components/layout/Logo.tsx` now draws the real lockup — the house-K
      mark, the diagonal two-tone KABURA wordmark and the full registered name
      — but it is reconstructed from the supplied image, and the wordmark is
      set in the site's own display face rather than the original typeface.
      With the vector file the component can point at the genuine artwork
- [x] ~~Google review content~~ — wired to the live Places API; supply the two
      keys above and real reviews appear, attributed and linked back to Google
- [ ] Any company history, team detail or credentials you want on `/about`

**Before launch:**

- [ ] Have a lawyer review `/privacy` and `/terms`
- [ ] Confirm the trading terms referenced on `/terms`
