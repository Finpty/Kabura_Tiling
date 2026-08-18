# Source assets

Nothing in `public/media/` is edited by hand. It is all generated from this
folder by `npm run assets:optimise`.

```
assets-src/
├── raw/          originals supplied by Kabura — never modified
└── higgsfield/   AI-generated brand visuals + manifest.json
```

## `raw/` — client-supplied originals

The photographs and renders Kabura provided. Several carry a burnt-in
watermark, and two of those watermarks reference Victorian suburbs (Narre
Warren North, Endeavour Hills) and a phone number, none of which belong on a
Western Australian site. The pipeline crops every watermark out rather than
covering it, and two files are excluded from the site entirely:

| File | Status |
| --- | --- |
| `master-bathroom-…-3drender.jpg` | used — cropped above the watermark |
| `13.jpg` | used — cropped above the watermark |
| `3d-rendering-luxury-modern-kitchen.jpg` | used — cropped above the watermark |
| `3d-rendering-classic-modern-bathroom-…jpg` | used — cropped, red cast neutralised |
| `modern-contemporary-white-kitchen.jpg` | used — cropped |
| `tiler-is-putting-spacer-ceramic-tiles.jpg` | used — real trade photography |
| `worker-putting-tiles-wall-kitchen.jpg` | used — cropped, blue overlay neutralised |
| `286743063_…n.mp4` | used — trimmed, caption band and editing-app outro cropped off |
| `12.jpg` | **excluded** — contains a phone number we cannot verify |
| `370681-PBLW2N-600.jpg` | **excluded** — stock "welcome" graphic, off-brand |
| `Kabura55.png`, `Woklkl.jpg` | **excluded** — social-post collages, not usable imagery |
| `Kabura.png` | **excluded** — reads "Kabura Services", not "Kabura Tiling Group" |

## `higgsfield/` — generated brand visuals

Cinematic imagery and video commissioned through Higgsfield for atmosphere and
art direction. `manifest.json` records the model, job id, prompt, download URL
and where each asset is used.

**These are brand visuals, not photographs of completed Kabura work.** Every
surface that shows one in a portfolio context carries a visible placeholder
label, and placeholder project pages are excluded from search indexing and the
sitemap. Replace them with real project photography before presenting anything
as a case study.

```bash
npm run assets:fetch      # download them into this folder
npm run assets:optimise   # transcode into public/media and rewrite the manifest
```

Higgsfield result URLs can expire. If `assets:fetch` reports failures, re-open
the generations in the Higgsfield dashboard, update the `url` fields in
`manifest.json`, and run it again.

## Adding new imagery

1. Drop the file into `raw/`.
2. Add an entry to `IMAGES` (or `VIDEOS`) in `scripts/optimise-assets.mjs`,
   giving it a `key`, output filename, alt text, target width and aspect ratio.
3. Run `npm run assets:optimise`.
4. Reference it by key: `imageProps("yourKey")`.

Components never reference a path, only a key, so swapping the underlying
source is a pipeline change rather than a code change.
