# Luna Shift marketing site

Single-page marketing site for Luna Shift, a private, local-first iOS app for tracking
perimenopause symptoms.

## Run it

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run preview    # serve dist/ locally
```

## Before you share it

Edit `src/site.ts`:

- `appStoreHref`: the App Store listing, once the app is live. Until then the page shows
  "Live on the App Store" as plain text rather than a button that leads nowhere
- `contactEmail`: the real support address
- `privacyHref`: the published privacy policy page (currently points at the on-page section)

`npm run build` prints a reminder for anything still unfilled. It warns, it does not fail.

If the site moves to its own domain, set `VITE_SITE_URL` so the social card points at the
right place:

```bash
VITE_SITE_URL=https://lunashift.app npm run build
```

## Where things live

- `src/index.css`: brand tokens (light and dark), the generated background, the phone
  wrapper and the phone-trio arrangements
- `src/sections/`: Hero, Features (the four phone groups), Privacy, Closing (final call to
  action plus footer)
- `src/lib/screens.ts`: every app capture and its alt text
- `screens-src/`: the official captures plus `iphone-frame.webp`, the source of truth
- `public/screens/`: the build output, each capture already inside the iPhone render

## Regenerating imagery

| Command | What it does |
| --- | --- |
| `npm run images` | Composites every capture in `screens-src/` into `iphone-frame.webp` and writes `public/screens/` at 520px and 870px |
| `npm run hero` | Rebuilds `public/hero-phone.webp`: maps the Today capture onto the photographic mockup's screen and lifts the phones off their grey backdrop |
| `npm run trio` | Rebuilds `public/trio-log.webp` for the "Log in seconds" section from the three-phone mockup |
| `npm run og` | Rebuilds `public/og.jpg`, the 1200x630 social card |
| `npm run icon` | Re-renders the site icon from the app's Icon Composer layers on the SSD project |

To add or replace an app screen, drop a capture into `screens-src/` named after its screen
id and run `npm run images`. Captures must match the phone screen's aspect ratio (roughly
0.459, e.g. 920x2000); the script refuses anything further off than that.

The hero uses a different source: `mock-soft-studio-light.png`, a photographic mockup.
It ships flattened, so `npm run hero` does the work the template would have: it finds the
screen's four corners, perspective-maps the Today capture onto them, masks it to the
screen's exact rounded shape, and cuts the phones off their grey backdrop. The helpers
live in `scripts/lib/mockup.mjs` and work on the other mockups in `screens-src/` too.

`model-src/` holds the iPhone model from the earlier 3D hero. Nothing uses it now; it can
be deleted whenever you like.

## Deploy

The build is fully static. No server, no environment variables required.

**GitHub Pages (currently live).** From the repository root:

```bash
cd luna-shift && npm run build:pages && cd ..
git add lunashift && git commit -m "chore: rebuild site" && git push
```

That writes the site into `../lunashift/` with the correct base path, and GitHub Pages
serves it at <https://solomon-69.github.io/UI-components/lunashift/>.

**Any other host.** `npm run build` produces `dist/`; upload that folder to Hostinger,
Netlify, Vercel or Cloudflare Pages. Set `VITE_SITE_URL` first so the social card resolves.
