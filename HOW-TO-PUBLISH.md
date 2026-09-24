# Luna Shift website — one repo

This repository holds everything for the Luna Shift website in one place:

- **The live site**, served by GitHub Pages at https://lunashift.github.io — the built files
  live at the repository root (`index.html`, `assets/`, `screens/`, `fonts/`, images).
- **Two hand-written legal pages** at the root: `privacy.html` and `support.html`. These are
  standalone and are **not** produced by a build. Apple's reviewer opens the privacy and
  support URLs, so never delete or break them.
- **The marketing page source** in [`site/`](site/) — a Vite + React + TypeScript project.

## How the site is published today

GitHub Pages is set to **Deploy from a branch → `main` / root**. It serves the files that are
committed at the repository root. Publishing is therefore a manual build-and-copy:

```bash
cd site
npm install --legacy-peer-deps
VITE_SITE_URL=https://lunashift.github.io npm run build   # base is /
```

Then copy the freshly built files from `site/dist/` into the repository root (replacing
`index.html`, `assets/`, `screens/`, `fonts/` and the images), **keeping `privacy.html`,
`support.html` and `.nojekyll`**, and commit. The three live URLs never change:

- Marketing: https://lunashift.github.io
- Privacy:   https://lunashift.github.io/privacy.html
- Support:   https://lunashift.github.io/support.html

## Later: automate it (do this AFTER the app is approved)

A GitHub Action can build `site/` and publish automatically on every push, removing the manual
copy step. Turning that on requires switching Pages from "Deploy from a branch" to
"GitHub Actions", which changes how Pages serves and briefly re-deploys. **Do not do this while
the app is in App Store review** — a momentary gap on the privacy/support URLs could fail the
review. Once the app is approved, add the workflow and flip the Pages source.
