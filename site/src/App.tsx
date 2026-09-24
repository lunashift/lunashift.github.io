import { Nav } from './components/Nav'
import { Hero } from './sections/Hero'
import { Features } from './sections/Features'
import { Privacy } from './sections/Privacy'
import { Closing } from './sections/Closing'

export default function App() {
  return (
    <>
      <div className="site-bg" aria-hidden="true" />
      <div className="site-grain" aria-hidden="true" />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-cta focus:px-4 focus:py-2 focus:text-on-cta"
      >
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Features />
        <Privacy />
        <Closing />
      </main>
    </>
  )
}
