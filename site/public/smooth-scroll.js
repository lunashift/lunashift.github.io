// Smooth scrolling for every page of the site. Phones keep their native scroll,
// and anyone who asks their device for reduced motion gets normal scrolling.
(function () {
  if (!window.Lenis || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  var root = document.documentElement
  root.style.scrollBehavior = 'auto' // the page's own smooth setting would fight this one
  var lenis = new window.Lenis({ autoRaf: true, lerp: 0.1 })

  // In-page links glide to their section, then move keyboard focus there as a jump would.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[href^="#"]')
    var id = link && link.getAttribute('href').slice(1)
    var target = id && document.getElementById(id)
    if (!target) return
    event.preventDefault()
    var padding = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0
    lenis.scrollTo(target, { offset: -padding })
    history.pushState(null, '', '#' + id)
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  })
})()
