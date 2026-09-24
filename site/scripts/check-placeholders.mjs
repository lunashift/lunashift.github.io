// Warns when the site is about to ship with a link nobody has filled in yet.
// Warns rather than fails, so a preview deploy is never blocked.
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const checks = [
  { file: 'src/site.ts', needle: 'hello@lunashift.app', what: 'the support address in src/site.ts (contactEmail)' },
  { file: 'src/site.ts', needle: 'APP_IS_LIVE = false', what: 'the App Store launch switch in src/site.ts (set APP_IS_LIVE = true once the app is live)' },
]

const found = []
for (const { file, needle, what } of checks) {
  const text = await readFile(path.resolve(file), 'utf8')
  if (text.includes(needle)) found.push(what)
}

if (found.length) {
  console.warn('\n[33m! Still to fill in before you share this site:[0m')
  for (const what of found) console.warn(`  - ${what}`)
  console.warn('')
} else {
  console.log('placeholders: all filled in')
}
