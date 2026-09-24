# Luna Shift website — one repo, auto-published

Everything for the Luna Shift website lives here, and publishing is automatic.

## Where things are

- **`site/`** — the whole website source (Vite + React + TypeScript). This is the only place
  you edit. `site/public/privacy.html` and `site/public/support.html` are the two hand-written
  legal pages; the build copies them out as-is, so one build produces all three pages.
- **`.github/workflows/deploy.yml`** — builds `site/` and publishes to GitHub Pages on every
  push that touches `site/`. GitHub Pages is set to "GitHub Actions", so it serves whatever the
  workflow produces. There are no built files committed to the repo.

## How to publish

Just edit anything under `site/` and push to `main`. The Action builds and deploys within a
minute or two. The live URLs never change:

- Marketing: https://lunashift.github.io
- Privacy:   https://lunashift.github.io/privacy.html
- Support:   https://lunashift.github.io/support.html

Watch a run at https://github.com/lunashift/lunashift.github.io/actions — a green check means
it's live.

## Working locally (optional)

```bash
cd site
npm install          # a .npmrc sets legacy-peer-deps, so this just works
npm run dev          # preview at http://localhost:5173
npm run build        # production build into site/dist
```

## Notes

- Do not delete `site/public/privacy.html` or `site/public/support.html` — the App Store
  listing points at those two URLs.
- To roll back, revert the commit and push; the Action redeploys the previous version.
