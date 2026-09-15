import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import './style.css'

gsap.registerPlugin(ScrollTrigger)
gsap.registerPlugin(MotionPathPlugin)

/* ------------------------------------------------------------
   Lenis smooth scroll wired into GSAP ticker
   ------------------------------------------------------------ */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
})

lenis.on('scroll', ScrollTrigger.update)

gsap.ticker.add((time) => {
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

/* Curve-swipe page transition for anchor navigation */
const TRANSITION_LABELS = {
  '#about': 'About Me',
  '#projects': 'Work',
  '#testimonial': 'Testimonials',
  '#faq': 'FAQ',
  '#contact': 'Contact',
  '#home': 'Home',
}

/* per-section transition colors (our palette) */
const TRANSITION_COLORS = {
  '#home': { bg: '#ffffff', edge: '#c9c2ae', text: '#2b2a22' },
  '#about': { bg: '#5b6b47', edge: '#3e4d32', text: '#fff9e9' },
  '#projects': { bg: '#7d2e46', edge: '#5c2235', text: '#fff9e9' },
  '#testimonial': { bg: '#d89fae', edge: '#b97a89', text: '#2b2a22' },
  '#faq': { bg: '#f6f1e6', edge: '#c9c2ae', text: '#2b2a22' },
  '#contact': { bg: '#a9b98c', edge: '#7d8f68', text: '#2b2a22' },
}

function initPageTransition() {
  const overlay = document.querySelector('.page-transition')
  const curtain = document.querySelector('.pt-curtain')
  const edge = document.querySelector('.pt-edge')
  const label = document.querySelector('.pt-label')
  const main = document.querySelector('.site-content')
  if (!overlay || !curtain || !edge || !label) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  /* bouayaben-style curve: single Q whose control bulges by 13·sin(πe) */
  const AMP = 13
  const edgeIn = (p) => {
    const t = 100 * (1 - p)
    return `M 0 ${t} Q 50 ${t - AMP * Math.sin(Math.PI * p)} 100 ${t}`
  }
  const curtainIn = (p) => `${edgeIn(p)} L 100 101 L 0 101 Z`
  const edgeOut = (p) => {
    const t = 100 * (1 - p)
    return `M 0 ${t} Q 50 ${t + AMP * Math.sin(Math.PI * p)} 100 ${t}`
  }
  const curtainOut = (p) => `${edgeOut(p)} L 100 -1 L 0 -1 Z`

  async function goTo(hash, linkText) {
    const target = document.querySelector(hash)
    if (!target) return

    /* the hero is position:sticky (pinned), so its measured position equals the
       current scroll — treat #home as "go to the very top" instead */
    const isTop = hash === '#home'
    const scrollToTarget = (opts) =>
      isTop ? lenis.scrollTo(0, opts) : lenis.scrollTo(target, { offset: -60, ...opts })

    if (reduced) {
      scrollToTarget({ duration: 1.2 })
      return
    }

    const labelText = TRANSITION_LABELS[hash] || linkText || ''
    const colors = TRANSITION_COLORS[hash] || TRANSITION_COLORS['#about']
    overlay.style.setProperty('--pt-bg', colors.bg)
    overlay.style.setProperty('--pt-edge', colors.edge)
    overlay.style.setProperty('--pt-text', colors.text)
    label.textContent = labelText
    overlay.classList.add('is-active')

    const proxy = { p: 0 }
    const setIn = () => {
      curtain.setAttribute('d', curtainIn(proxy.p))
      edge.setAttribute('d', edgeIn(proxy.p))
    }
    const setOut = () => {
      curtain.setAttribute('d', curtainOut(proxy.p))
      edge.setAttribute('d', edgeOut(proxy.p))
    }

    /* cover: curve sweeps bottom→top, main scales down, label rises in */
    await new Promise((resolve) => {
      gsap
        .timeline({ onComplete: resolve })
        .to(proxy, { p: 1, duration: 0.55, ease: 'expo.inOut', onUpdate: setIn }, 0)
        .to(main, { scale: 0.98, autoAlpha: 0.9, transformOrigin: '50% 30%', duration: 0.55, ease: 'expo.inOut' }, 0)
        .fromTo(label, { autoAlpha: 0, yPercent: 80 }, { autoAlpha: 1, yPercent: 0, duration: 0.35, ease: 'power3.out' }, 0.28)
    })

    /* navigate while covered */
    scrollToTarget({ immediate: true })

    /* reveal: curve sweeps bottom→top opening the page, label exits, main settles */
    proxy.p = 0
    gsap.set(main, { clearProps: 'all' })
    await new Promise((resolve) => {
      gsap
        .timeline({
          onComplete: () => {
            overlay.classList.remove('is-active')
            curtain.setAttribute('d', '')
            edge.setAttribute('d', '')
            resolve()
          },
        })
        .to(label, { autoAlpha: 0, yPercent: -60, duration: 0.3, ease: 'power2.in' })
        .to(proxy, { p: 1, duration: 0.7, ease: 'expo.inOut', onUpdate: setOut }, 0.08)
        .fromTo(
          main,
          { scale: 1.015, transformOrigin: '50% 12%' },
          { scale: 1, duration: 0.7, ease: 'expo.out', clearProps: 'all' },
          0.2
        )
    })
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const hash = link.getAttribute('href')
      if (!document.querySelector(hash)) return
      e.preventDefault()
      goTo(hash, link.textContent.trim()).then(() => ScrollTrigger.refresh())
    })
  })
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ------------------------------------------------------------
   Selected Work - pinned card stack (ported from joeyjaqlino v4.js)
   ------------------------------------------------------------ */
function initWorkStack() {
  if (reduced || window.innerWidth < 901) return

  const stack = document.querySelector('.w-stack')
  const cards = stack ? gsap.utils.toArray(stack.querySelectorAll('[data-w-card]')) : []
  if (!stack || cards.length < 2) return

  stack.classList.add('is-stacked')

  /* how far below the stage a waiting card must park so its top edge is just
     past the bottom of the viewport (stage is centred) */
  function parkPct() {
    const h = stack.offsetHeight || 1
    const gapBelow = (window.innerHeight - h) / 2
    return ((window.innerHeight - Math.max(gapBelow, 0)) / h) * 100 + 4
  }

  gsap.set(cards, { yPercent: (i) => (i === 0 ? 0 : parkPct()) })

  const steps = cards.length - 1
  const TAIL = 0.4
  const LIFT = 18 // px a covered card rises per layer above it
  const SHRINK = 0.032

  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: stack,
      start: 'center center',
      end: () => '+=' + Math.round((steps + TAIL) * stack.offsetHeight * 1.02),
      pin: true,
      pinSpacing: true,
      scrub: 0.7,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  })

  cards.forEach((card, i) => {
    if (i === 0) return
    const at = i - 1
    tl.to(card, { yPercent: 0, duration: 1 }, at)
    for (let j = 0; j < i; j++) {
      const layers = i - j
      tl.to(cards[j], { y: -LIFT * layers, scale: 1 - SHRINK * layers, duration: 1 }, at)
    }
  })

  tl.to({}, { duration: TAIL }, steps)
}

/* ------------------------------------------------------------
   Helper: reveal masked lines
   ------------------------------------------------------------ */
function revealLines(root, scroll = true) {
  const masks = root.querySelectorAll('.line-mask .line')
  if (!masks.length) return
  gsap.set(masks, { yPercent: 120 })
  const anim = gsap.to(masks, {
    yPercent: 0,
    duration: 1.1,
    ease: 'power4.out',
    stagger: 0.12,
    delay: 0.1,
    ...(scroll
      ? {
          scrollTrigger: {
            trigger: root,
            start: 'top 82%',
          },
        }
      : {}),
  })
  return anim
}

/* ------------------------------------------------------------
   Hero entrance - pinned sky, sun, clouds & name
   ------------------------------------------------------------ */
function initHero() {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } })

  tl.fromTo(
    '.hero-sun',
    { opacity: 0, y: -24 },
    { opacity: 1, y: 0, duration: 1.4 },
    0.1
  )
    .fromTo(
      '.hero-cloud',
      { opacity: 0, x: 30 },
      { opacity: 1, x: 0, duration: 1.4, stagger: 0.15 },
      0.2
    )
    .fromTo(
      '.hero-eyebrow, .hero-headline, .hero-rollwrap',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 1.1, stagger: 0.12, ease: 'power3.out' },
      0.5
    )
}

/* ------------------------------------------------------------
   Hero scroll departure - hero pinned, content scales down
   as the next section rises over it (zainabkabira style)
   ------------------------------------------------------------ */
function initHeroScroll() {
  const hero = document.querySelector('.hero')
  const content = document.querySelector('.hero-content')
  if (!hero || !content) return

  gsap.fromTo(
    content,
    { scale: 1 },
    {
      scale: 0.88,
      ease: 'none',
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => `+=${hero.offsetHeight * 0.8}`,
        scrub: true,
      },
    }
  )
}

/* ------------------------------------------------------------
   Section title reveals
   ------------------------------------------------------------ */
function initSectionTitles() {
  document.querySelectorAll('.section-head, .cta, .testimonials').forEach((root) => {
    revealLines(root)
  })
}

/* ------------------------------------------------------------
   Journey line - Zainab-style: wide dotted trail + plane flying
   from the sky band, weaving left→right over the whole About
   ------------------------------------------------------------ */
function initJourneyLine() {
  const about = document.querySelector('.about')
  const svg = document.querySelector('.journey-line')
  const trail = document.getElementById('journeyTrail')
  const maskPath = document.getElementById('journeyMaskPath')
  const motion = document.getElementById('journeyMotion')
  const plane = document.querySelector('.journey-plane')
  const blurb = document.querySelector('.about-intro')
  if (!about || !svg || !trail || !maskPath || !motion || !plane || !blurb) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const PLANE_OFFSET = 0 // paper-plane nose points exactly right
  const PLANE_SPEED = 1.1 // >1 → the plane flies the trail with less scroll
  const isMobile = () => window.innerWidth <= 767

  /* Zainab's fixed-px opening arc + the real Figma trail vectors (seg 2 & 3),
     anchored to the centred blurb exactly like the reference site. */
  const ARC = {
    start: [210, 110],
    curves: [
      [[110, 200], [70, 325], [88, 410]],
      [[103, 488], [192, 528], [255, 555]],
    ],
    end: [255, 555],
  }
  const FBLURB = { x: 220.55078, y: 309.10114, w: 998.8994 }
  const FSEGS = [
    {
      start: [1225.129, 513.643],
      curves: [[[1400.529, 571.048], [1408.849, 837.583], [1177.289, 928.232]]],
    },
    {
      start: [526.523, 944.189],
      curves: [
        [[343.309, 950.485], [-12.056, 1108.034], [114.406, 1503.226]],
        [[181.773, 1632.295], [428.301, 1799.056], [685.184, 1627.938]],
        [[1049.722, 1385.108], [1402.934, 1429.163], [1402.934, 1762.044]],
        [[1402.934, 2099.399], [1089.394, 2154.919], [826.844, 2073.699]],
        [[564.3, 1992.479], [279.257, 1966.169], [203.537, 2255.019]],
        [[123.17, 2561.609], [552.967, 2708.339], [800.401, 2549.679]],
        [[1047.835, 2391.019], [1393.484, 2589.339], [1253.714, 2887.779]],
      ],
    },
  ]

  const norm = (v) => {
    const m = Math.hypot(v[0], v[1]) || 1
    return [v[0] / m, v[1] / m]
  }
  const makeSeg = (pts) => {
    const fmt = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`
    let d = `M ${fmt(pts.start)}`
    for (const c of pts.curves) d += ` C ${fmt(c[0])}, ${fmt(c[1])}, ${fmt(c[2])}`
    const last = pts.curves[pts.curves.length - 1]
    return {
      start: pts.start,
      end: last[2],
      startTan: norm([pts.curves[0][0][0] - pts.start[0], pts.curves[0][0][1] - pts.start[1]]),
      endTan: norm([last[2][0] - last[1][0], last[2][1] - last[1][1]]),
      d,
    }
  }

  let motionLen = 0
  let pathTopY = 0
  let pathBotY = 0
  let onScroll = null
  let segs = []

  /* Centre each note over the trail, spread down its vertical span. CSS keeps
     them horizontally centred; here we only choose the y of each note. The note
     plate (page colour) knocks the dotted line out behind it, so the line reads
     as passing behind the text - the same interference the intro has. */
  function placeStops() {
    const items = gsap.utils.toArray('.about .timeline-item')
    if (!items.length || !segs.length) return
    const last = segs[segs.length - 1]
    const tmp = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    tmp.setAttribute('d', last.d)
    tmp.setAttribute('fill', 'none')
    svg.appendChild(tmp)
    const len = tmp.getTotalLength()

    /* Each note is pinned to a specific turn of the plane's flight (fraction of
       the trail length), following the arrow's down → up → down rhythm:
         1 start (top)        2 first descent (left)   3 rise (right top)
         4 next descent (right) 5 descent from left    6 last rise (right top)
       The note is centred on the line there; its plate knocks the line out. */
    const FRACTIONS = [0, 0.1239, 0.354, 0.52, 0.7238, 0.8986]
    const SIDES = ['center', 'left', 'right', 'right', 'left', 'right']

    const w = about.clientWidth
    const margin = Math.max(24, w * 0.04)
    items.forEach((el, i) => {
      const f = FRACTIONS[i] ?? (i + 0.5) / items.length
      const p = tmp.getPointAtLength(Math.max(0, Math.min(1, f)) * len)
      const itemW = el.getBoundingClientRect().width || 560

      el.style.top = `${p.y.toFixed(1)}px`
      if (SIDES[i] === 'center') {
        el.style.left = `${(w / 2).toFixed(1)}px`
        el.style.transform = 'translate(-50%, -50%)'
        el.style.textAlign = 'center'
      } else if (SIDES[i] === 'left') {
        el.style.left = `${margin.toFixed(1)}px`
        el.style.transform = 'translate(0, -50%)'
        el.style.textAlign = 'left'
      } else {
        el.style.left = `${(w - margin - itemW).toFixed(1)}px`
        el.style.transform = 'translate(0, -50%)'
        el.style.textAlign = 'right'
      }
    })
    tmp.remove()
  }

  function buildPath() {
    if (isMobile()) {
      about.style.height = ''
      segs = []
      return
    }
    const aboutRect = about.getBoundingClientRect()
    const bl = blurb.getBoundingClientRect()
    const blLeft = bl.left - aboutRect.left
    const blTop = bl.top - aboutRect.top
    const s = bl.width / FBLURB.w

    const A = (pt) => [pt[0] + (blLeft + 26 - ARC.end[0]), pt[1] + (blTop - 33 - ARC.end[1])]
    const F = (pt) => [
      blLeft + (pt[0] - FBLURB.x) * s,
      blTop + (pt[1] - FBLURB.y) * s,
    ]

    segs = [makeSeg({ start: A(ARC.start), curves: ARC.curves.map((c) => c.map(A)) })]
    for (const fs of FSEGS) {
      segs.push(makeSeg({ start: F(fs.start), curves: fs.curves.map((c) => c.map(F)) }))
    }

    /* one continuous dotted trail: the segments are joined with the same tangent
       bridges the plane flies, so the line never shows a break before a note.
       The notes' plates knock the line out where it passes behind them. */
    let motionD = segs[0].d
    for (let i = 1; i < segs.length; i++) {
      const prev = segs[i - 1]
      const cur = segs[i]
      const span = Math.hypot(cur.start[0] - prev.end[0], cur.start[1] - prev.end[1]) * 0.4
      const b1 = [prev.end[0] + prev.endTan[0] * span, prev.end[1] + prev.endTan[1] * span]
      const b2 = [cur.start[0] - cur.startTan[0] * span, cur.start[1] - cur.startTan[1] * span]
      const bridge = ` C ${b1[0].toFixed(1)} ${b1[1].toFixed(1)} ${b2[0].toFixed(1)} ${b2[1].toFixed(1)} ${cur.start[0].toFixed(1)} ${cur.start[1].toFixed(1)}`
      motionD += bridge + cur.d.replace(/^M[^C]*/, '')
    }
    trail.setAttribute('d', motionD)
    motion.setAttribute('d', motionD)
    maskPath.setAttribute('d', motionD)
    motionLen = motion.getTotalLength()
    maskPath.style.strokeDasharray = motionLen

    const bb = motion.getBBox()
    pathTopY = bb.y
    pathBotY = bb.y + bb.height

    /* size the section to the trail so the line is never clipped */
    const H = Math.ceil(pathBotY + Math.max(40, window.innerHeight * 0.06))
    about.style.height = `${H}px`
    svg.setAttribute('viewBox', `0 0 ${about.clientWidth} ${H}`)

    placeStops()
  }

  function apply(p) {
    p = Math.max(0, Math.min(1, p))
    const md = p * motionLen
    maskPath.style.strokeDashoffset = motionLen - md
    const pt = motion.getPointAtLength(md)
    const pA = motion.getPointAtLength(Math.max(0, md - 1))
    const pB = motion.getPointAtLength(Math.min(motionLen, md + 1))
    const ang = (Math.atan2(pB.y - pA.y, pB.x - pA.x) * 180) / Math.PI
    plane.style.transform = `translate(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px) translate(-50%, -50%) rotate(${(ang + PLANE_OFFSET).toFixed(1)}deg)`
  }

  /* plane is hidden while on the hero; fades in as About is entered */
  const easeSmooth = (t) => {
    t = Math.max(0, Math.min(1, t))
    return t * t * (3 - 2 * t)
  }
  const updateAppear = () => {
    const scrolled = window.scrollY || window.pageYOffset || 0
    plane.style.opacity = easeSmooth(scrolled / (window.innerHeight * 0.95))
  }
  window.addEventListener('scroll', updateAppear, { passive: true })
  updateAppear()

  function setup() {
    buildPath()
    if (onScroll) {
      window.removeEventListener('scroll', onScroll)
      onScroll = null
    }
    maskPath.style.strokeDashoffset = motionLen

    if (isMobile()) {
      plane.style.opacity = '0'
      return
    }

    if (reduced) {
      apply(1)
      return
    }

    onScroll = () => {
      const aboutTopVp = about.getBoundingClientRect().top
      const vh = window.innerHeight
      const topVp = aboutTopVp + pathTopY
      const botVp = aboutTopVp + pathBotY
      let p = (vh * 0.5 - topVp) / (botVp - topVp)
      p = Math.max(0, Math.min(1, p * PLANE_SPEED))
      apply(p)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }

  setup()
  apply(0)
  window.addEventListener('resize', () => {
    setup()
    ScrollTrigger.refresh()
  })
}

/* ------------------------------------------------------------
   Falling stickers - ported from haoqi-revamp (scene/stickers.js).
   The three.js sprite config is reproduced in DOM: stickers drift
   down with a sine wind, spin and recycle. About + Work only.
   ------------------------------------------------------------ */
function initStickers() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const STICKERS = Array.from(
    { length: 12 },
    (_, i) => `/sticker_img/s_${String(i + 1).padStart(2, '0')}.png`,
  )
  /* reference world: fov 60°, camera.z 32, stickers at z ≈ −6 → 43.9u tall */
  const WORLD_HEIGHT = 43.9
  const CFG = {
    fallSpeed: 1.8, // world units / s (original haoqi speed)
    size: 6.3, // uniform sticker height in world units (~129px on a 900px screen)
    windStrength: 1.8,
    windFrequency: 0.3,
    rotationSpeed: 0.8,
    growSpeed: 3.4,
    burstCount: 9,
    burstRadius: 130,
  }
  const COUNT = 46

  /* ONE sticker field across the whole .site-content: it sits above the cream
     background but below the Work transition layer, so stickers fall all the
     way down without a hard cut, and are hidden behind the pink cover in Work. */
  const host = document.querySelector('.site-content')
  if (!host) return

  const layer = document.createElement('div')
  layer.className = 'sticker-layer'
  layer.setAttribute('aria-hidden', 'true')
  host.prepend(layer)

  const L = { host, layer, items: [], width: 0, height: 0, unit: 1, top: 0, topPad: 0 }

  const pick = () => STICKERS[Math.floor(Math.random() * STICKERS.length)]
  const worldUnit = () => window.innerHeight / WORLD_HEIGHT
  const randomY = () => L.topPad + Math.random() * Math.max(1, L.height - L.topPad)

  function measure() {
    const hr = host.getBoundingClientRect()
    L.width = host.clientWidth
    L.unit = worldUnit()
    const band = host.querySelector('.about-band')
    L.top = band ? band.getBoundingClientRect().top - hr.top : 0
    layer.style.top = `${Math.round(L.top)}px`
    layer.style.height = 'auto'
    L.height = layer.clientHeight
    L.topPad = L.unit * CFG.size * 0.6
  }

  function newItem(opts = {}) {
    const img = document.createElement('img')
    img.src = pick()
    img.alt = ''
    img.draggable = false
    img.decoding = 'async'
    layer.appendChild(img)

    const size = L.unit * CFG.size
    img.style.height = `${size.toFixed(1)}px`

    const it = {
      el: img,
      size,
      x: opts.x != null ? opts.x : Math.random() * L.width,
      y: opts.y != null ? opts.y : randomY(),
      fall: CFG.fallSpeed * L.unit * (0.6 + Math.random() * 0.8),
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * CFG.rotationSpeed * 2,
      windPhase: Math.random() * Math.PI * 2,
      windAmp:
        ((0.3 + Math.random() * CFG.windStrength) / CFG.windFrequency) * L.unit * 0.45,
      grow: 0,
      oneShot: !!opts.oneShot,
    }
    L.items.push(it)
    return it
  }

  function removeItem(it) {
    it.el.remove()
    const i = L.items.indexOf(it)
    if (i >= 0) L.items.splice(i, 1)
  }

  function burst(x, y) {
    const live = L.items.filter((it) => it.oneShot)
    let excess = live.length + CFG.burstCount - 72
    while (excess > 0 && live.length) {
      removeItem(live.shift())
      excess--
    }
    for (let i = 0; i < CFG.burstCount; i++) {
      newItem({
        x: x + (Math.random() - 0.5) * 2 * CFG.burstRadius,
        y: y + (Math.random() - 0.5) * 2 * CFG.burstRadius,
        oneShot: true,
      })
    }
  }

  function render(t) {
    for (const it of L.items) {
      const dx = Math.sin(t * CFG.windFrequency + it.windPhase) * it.windAmp
      it.el.style.transform = `translate3d(${(it.x + dx).toFixed(1)}px, ${it.y.toFixed(1)}px, 0) rotate(${it.rot.toFixed(3)}rad) scale(${it.grow.toFixed(3)})`
      it.el.style.opacity = it.grow.toFixed(3)
    }
  }

  let last = performance.now()
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    const t = now / 1000
    for (let i = L.items.length - 1; i >= 0; i--) {
      const it = L.items[i]
      it.grow = Math.min(1, it.grow + dt * CFG.growSpeed)
      it.y += it.fall * dt
      it.rot += it.rotSpeed * dt

      if (it.oneShot) {
        if (it.y > L.height + it.size) {
          removeItem(it)
          continue
        }
      } else if (it.y > L.height + it.size) {
        it.y = randomY()
        it.x = Math.random() * L.width
        it.el.src = pick()
        it.grow = 0
      }
    }
    render(t)
    requestAnimationFrame(frame)
  }

  measure()
  for (let i = 0; i < COUNT; i++) newItem()
  requestAnimationFrame(frame)

  host.addEventListener('pointerdown', (e) => {
    const r = host.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top - L.top
    burst(x, Math.max(L.topPad, Math.min(y, L.height)))
  })

  window.addEventListener('resize', () => {
    measure()
    L.items.forEach((it) => {
      it.x = Math.random() * L.width
      if (it.y > L.height) it.y = randomY()
    })
  })
}

/* ------------------------------------------------------------
   Scroll reveals (generic)
   ------------------------------------------------------------ */
function initReveals() {
  // Journey notes pinned along the trail (opacity only - JS owns transform)
  gsap.utils.toArray('.about .timeline-item').forEach((item) => {
    gsap.fromTo(
      item,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: item, start: 'top 92%' },
      }
    )
  })

  // Work cards
  gsap.utils.toArray('.work-item').forEach((card, i) => {
    gsap.fromTo(
      card,
      { opacity: 0, y: 48 },
      {
        opacity: 1,
        y: 0,
        duration: 0.95,
        ease: 'power3.out',
        delay: (i % 3) * 0.06,
        scrollTrigger: { trigger: card, start: 'top 90%' },
      }
    )
  })

}

/* ------------------------------------------------------------
   Timeline "Read more" expand
   ------------------------------------------------------------ */
function initTimelineExpand() {
  document.querySelectorAll('[data-expand]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.timeline-item')
      const detail = item.querySelector('.timeline-detail')
      const isOpen = detail.classList.toggle('is-open')
      btn.textContent = isOpen ? 'Read less' : 'Read more'
      if (isOpen) ScrollTrigger.refresh()
    })
  })
}

/* ------------------------------------------------------------
   Scrollspy - highlight active nav link
   ------------------------------------------------------------ */
function initActiveLinks() {
  const links = document.querySelectorAll('.nav-link')
  if (!links.length) return

  links.forEach((link) => {
    const id = link.getAttribute('href')
    const section = document.querySelector(id)
    if (!section) return

    ScrollTrigger.create({
      trigger: section,
      start: 'top 45%',
      end: 'bottom 45%',
      onToggle: (self) => {
        if (self.isActive) {
          links.forEach((l) => l.classList.remove('is-active'))
          link.classList.add('is-active')
        }
      },
    })
  })
}

/* ------------------------------------------------------------
   Navbar contrast on scroll - white over hero, dark in content
   ------------------------------------------------------------ */
function initNavTheme() {
  const hero = document.querySelector('.hero')
  const update = () => {
    const y = window.scrollY || window.pageYOffset || 0
    const threshold = hero ? hero.offsetHeight * 0.6 : 60
    document.body.classList.toggle('scrolled', y > threshold)
  }
  window.addEventListener('scroll', update, { passive: true })
  update()
}

/* ------------------------------------------------------------
   Dark mode toggle (persisted in localStorage)
   ------------------------------------------------------------ */
function initTheme() {
  const btns = document.querySelectorAll('#theme-toggle, [data-theme-toggle]')
  if (!btns.length) return

  const set = (night) => {
    document.body.classList.toggle('night', night)
    btns.forEach((b) => b.setAttribute('aria-pressed', night ? 'true' : 'false'))
    try {
      localStorage.setItem('theme', night ? 'night' : 'day')
    } catch (e) {}
  }

  btns.forEach((b) =>
    b.addEventListener('click', () => set(!document.body.classList.contains('night'))),
  )
  set(document.body.classList.contains('night'))
}

/* ------------------------------------------------------------
   Hero headline - split into letters for hover tilt (zainab style)
   ------------------------------------------------------------ */
function initHeroLetters() {
  const h = document.querySelector('.hero-headline')
  if (!h) return
  const text = h.textContent
  h.textContent = ''
  for (const ch of text) {
    const s = document.createElement('span')
    s.className = 'h-letter'
    s.textContent = ch === ' ' ? '\u00A0' : ch
    h.appendChild(s)
  }
}

/* ------------------------------------------------------------
   Hero rotating words - roll up through roles (zainabkabira style)
   ------------------------------------------------------------ */
function initHeroRoll() {
  const host = document.getElementById('hero-roll')
  if (!host) return

  const WORDS = ['Project Management', 'UI/UX', 'Digital Product']
  const HOLD = 1200
  const DUR = 560
  const EASE = 'cubic-bezier(0.22, 1.15, 0.36, 1)'
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let index = 0

  const track = document.createElement('span')
  track.className = 'hero-roll'
  host.appendChild(track)

  const makeWord = (text) => {
    const w = document.createElement('span')
    w.className = 'hero-roll-word'
    for (const ch of text) {
      const s = document.createElement('span')
      s.className = 'h-letter'
      s.textContent = ch === ' ' ? '\u00A0' : ch
      w.appendChild(s)
    }
    return w
  }

  track.appendChild(makeWord(WORDS[0]))

  function next() {
    const word = WORDS[(index + 1) % WORDS.length]
    if (reduce) {
      track.firstChild.textContent = word
      index = (index + 1) % WORDS.length
      setTimeout(next, HOLD)
      return
    }
    track.appendChild(makeWord(word))

    const h = track.firstChild.getBoundingClientRect().height
    track.style.transition = `transform ${DUR}ms ${EASE}`
    requestAnimationFrame(() => {
      track.style.transform = `translateY(${-h}px)`
    })

    function done(e) {
      if (e.propertyName !== 'transform') return
      track.removeEventListener('transitionend', done)
      track.style.transition = 'none'
      track.style.transform = 'none'
      track.removeChild(track.firstChild)
      index = (index + 1) % WORDS.length
      setTimeout(next, HOLD)
    }
    track.addEventListener('transitionend', done)
  }

  setTimeout(next, HOLD)
}

/* ------------------------------------------------------------
   Day wind gust - cirrus clouds drift left→right when theme
   flips night→day (zainabkabira style)
   ------------------------------------------------------------ */
function initSkyGust() {
  const sky = document.querySelector('.hero-sky')
  if (!sky || !('MutationObserver' in window) || reduced) return

  let wasNight = document.body.classList.contains('night')

  sky.addEventListener('animationend', () => {
    sky.style.animation = 'none'
  })

  new MutationObserver(() => {
    const night = document.body.classList.contains('night')
    if (!night && wasNight) {
      sky.style.animation = 'none'
      void sky.offsetWidth
      sky.style.animation = 'hero-sky-gust 3s cubic-bezier(0.2, 0.7, 0.3, 1)'
    }
    wasNight = night
  }).observe(document.body, { attributes: true, attributeFilter: ['class'] })
}

/* ------------------------------------------------------------
   Night shooting star (zainabkabira style) - one meteor at a time
   ------------------------------------------------------------ */
function initMeteor() {
  const hero = document.querySelector('.hero')
  const star = document.querySelector('.hero-meteor')
  if (!hero || !star || reduced) return

  let timer = 0
  let wasNight = document.body.classList.contains('night')

  const rnd = (a, b) => a + Math.random() * (b - a)
  const schedule = (ms) => {
    clearTimeout(timer)
    timer = setTimeout(fire, ms)
  }

  const onHero = () => {
    const y = window.scrollY || window.pageYOffset || 0
    return y < (hero.offsetHeight || window.innerHeight) * 0.9
  }
  let wasOnHero = onHero()

  function fire() {
    if (!document.body.classList.contains('night') || !onHero()) {
      schedule(4000)
      return
    }
    const h = hero.offsetHeight || window.innerHeight
    const w = hero.offsetWidth || window.innerWidth
    star.style.setProperty('--m-top', Math.round(rnd(0.05, 0.28) * h) + 'px')
    star.style.setProperty('--m-len', Math.round(rnd(130, 260)) + 'px')
    star.style.setProperty('--m-angle', rnd(7, 13).toFixed(1) + 'deg')
    star.style.setProperty('--m-travel', Math.round(w * 1.15 + 260) + 'px')
    star.style.animation = 'none'
    void star.offsetWidth
    star.style.animation = 'hero-meteor-fly ' + rnd(1.1, 1.8).toFixed(2) + 's linear'
  }

  star.addEventListener('animationend', () => {
    star.style.animation = 'none'
    schedule(rnd(5200, 13000))
  })

  if ('MutationObserver' in window) {
    new MutationObserver(() => {
      const night = document.body.classList.contains('night')
      if (night && !wasNight) schedule(600)
      wasNight = night
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] })
  }

  const onScroll = () => {
    const now = onHero()
    if (now && !wasOnHero) schedule(700)
    wasOnHero = now
  }
  window.addEventListener('scroll', onScroll, { passive: true })

  schedule(1400)
}

/* ------------------------------------------------------------
   Email copy-to-clipboard
   ------------------------------------------------------------ */
function initEmailCopy() {
  const email = document.querySelector('[data-email]')
  if (!email) return
  email.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email.dataset.email)
      email.classList.add('copied')
      const label = email.querySelector('.clipboard-wrap')
      if (label) label.textContent = 'Copied!'
      setTimeout(() => {
        email.classList.remove('copied')
        if (label) label.textContent = '⎘ Copy'
      }, 2000)
    } catch {
      /* clipboard unavailable */
    }
  })
}

/* ------------------------------------------------------------
   Project detail overlay (joeyjaqlino style)
   ------------------------------------------------------------ */
function initProjectView() {
  const page = document.getElementById('project-view')
  if (!page) return

  const cards = gsap.utils.toArray('.w-card')
  if (!cards.length) return

  const PROJECTS = cards.map((card) => {
    const foot = gsap.utils.toArray(card.querySelectorAll('.w-foot span')).map((s) => s.textContent.trim())
    const tags = gsap.utils.toArray(card.querySelectorAll('.w-tags span')).map((s) => s.textContent.trim())
    return {
      title: card.querySelector('.w-title')?.textContent.trim() || '',
      year: foot[0] || '',
      role: foot[1] || '',
      discipline: tags[0] || '',
      tags,
      note: card.querySelector('.w-note')?.textContent.trim() || '',
      hero: card.querySelector('.w-shot img')?.getAttribute('src') || '',
      shots: gsap.utils.toArray(card.querySelectorAll('.w-gal img')).map((i) => i.getAttribute('src')),
    }
  })

  const titleEl = page.querySelector('[data-pj-title]')
  const factsEl = page.querySelector('[data-pj-facts]')
  const tagsEl = page.querySelector('[data-pj-tags]')
  const intro = page.querySelector('[data-pj-intro]')
  const heroImg = page.querySelector('[data-pj-hero]')
  const shotsWrap = page.querySelector('[data-pj-shots]')
  const nextA = page.querySelector('[data-pj-next]')
  const nextH = page.querySelector('[data-pj-next-h]')
  const nextY = page.querySelector('[data-pj-next-y]')
  const nextC = page.querySelector('[data-pj-next-c]')
  const nextImg = page.querySelector('[data-pj-next-img]')
  const back = page.querySelector('.pj-back-btn')

  let current = 0
  let ctx = null

  function kill() {
    if (ctx) {
      ctx.revert()
      ctx = null
    }
    gsap.killTweensOf(page.querySelectorAll('[data-pj-word], [data-pj-fact], [data-pj-shot]'))
  }

  function render(i) {
    current = ((i % PROJECTS.length) + PROJECTS.length) % PROJECTS.length
    const p = PROJECTS[current]
    const n = PROJECTS[(current + 1) % PROJECTS.length]

    titleEl.innerHTML = p.title
      .split(/\s+/)
      .filter((w) => /[\w'’&-]/.test(w))
      .map((w) => `<span class="pj-w"><span data-pj-word>${w}</span></span>`)
      .join('')

    factsEl.innerHTML = [
      ['Year', p.year],
      ['Role', p.role],
      ['Discipline', p.discipline],
    ]
      .map(([k, v]) => `<div data-pj-fact><dt>${k}</dt><dd>${v}</dd></div>`)
      .join('')

    tagsEl.innerHTML = p.tags.map((t) => `<li>${t}</li>`).join('')

    intro.textContent = p.note
    heroImg.src = p.hero
    heroImg.alt = p.title
    shotsWrap.innerHTML = p.shots
      .map(
        (s) =>
          `<figure class="pj-shot" data-pj-shot><div class="pj-shot-in"><img src="${s}" alt="" loading="lazy" /></div></figure>`,
      )
      .join('')

    nextH.textContent = n.title
    nextY.textContent = n.year
    nextC.textContent = n.discipline
    nextImg.src = n.hero
    nextImg.alt = n.title

    kill()
    page.scrollTop = 0

    if (!reduced) {
      ctx = gsap.context(() => {
        const words = gsap.utils.toArray('[data-pj-word]')
        const tl = gsap.timeline({ delay: 0.12 })

        if (words.length) {
          gsap.set(words, { yPercent: 110 })
          tl.to(words, { yPercent: 0, duration: 1.15, ease: 'expo.out', stagger: 0.06 })
        }

        const facts = gsap.utils.toArray('[data-pj-fact]')
        if (facts.length) {
          gsap.set(facts, { opacity: 0, y: 18 })
          tl.to(facts, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 }, '-=0.75')
        }

        if (intro) {
          gsap.fromTo(
            intro,
            { opacity: 0, y: 24 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'expo.out',
              scrollTrigger: { scroller: page, trigger: intro, start: 'top 85%', once: true },
            },
          )
        }

        gsap.utils.toArray('[data-pj-shot]').forEach((fig) => {
          const box = fig.querySelector('.pj-shot-in')
          const img = fig.querySelector('img')
          if (!box) return

          gsap.fromTo(
            box,
            { clipPath: 'inset(14% 0% 14% 0% round 6px)' },
            {
              clipPath: 'inset(0% 0% 0% 0% round 6px)',
              duration: 1.2,
              ease: 'expo.out',
              scrollTrigger: { scroller: page, trigger: fig, start: 'top 88%', once: true },
            },
          )

          if (img) {
            gsap.fromTo(
              img,
              { yPercent: -8, scale: 1.16 },
              {
                yPercent: 8,
                ease: 'none',
                scrollTrigger: {
                  scroller: page,
                  trigger: fig,
                  start: 'top bottom',
                  end: 'bottom top',
                  scrub: 0.6,
                },
              },
            )
          }
        })

        if (nextH) {
          gsap.fromTo(
            nextH,
            { opacity: 0, y: 30 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: 'expo.out',
              scrollTrigger: { scroller: page, trigger: nextH, start: 'top 90%', once: true },
            },
          )
        }
      }, page)
    }

    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      const imgs = page.querySelectorAll('img')
      imgs.forEach((img) => {
        if (!img.complete) img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true })
      })
    })
  }

  function open(i) {
    page.classList.add('is-open')
    page.setAttribute('aria-hidden', 'false')
    document.body.classList.add('pj-open')
    if (lenis && lenis.stop) lenis.stop()
    render(i)
  }

  function close() {
    kill()
    page.classList.remove('is-open')
    page.setAttribute('aria-hidden', 'true')
    document.body.classList.remove('pj-open')
    if (lenis && lenis.start) lenis.start()
  }

  cards.forEach((card, i) => {
    card.querySelectorAll('.w-open a').forEach((a) => {
      a.addEventListener('click', (e) => {
        e.preventDefault()
        open(i)
      })
    })
  })

  nextA.addEventListener('click', (e) => {
    e.preventDefault()
    render(current + 1)
  })

  back.addEventListener('click', close)
  page.querySelectorAll('.pj-nav a[href^="#"]').forEach((a) => a.addEventListener('click', close))
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && page.classList.contains('is-open')) close()
  })
}

/* ------------------------------------------------------------
   Contact reveal + footer ghost wordmark fit (joeyjaqlino)
   ------------------------------------------------------------ */
function initContactReveal() {
  if (reduced) return
  const els = gsap.utils.toArray('.contact [data-v4-up]')
  if (!els.length) return
  gsap.set(els, { opacity: 0, y: 24 })
  ScrollTrigger.batch(els, {
    start: 'top 88%',
    once: true,
    interval: 0.08,
    batchMax: 6,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, overwrite: true }),
  })
}

function initFooterGhost() {
  const ghost = document.querySelector('.f-ghost')
  if (!ghost) return
  const REF = 100
  const fit = () => {
    const wrap = ghost.parentElement
    if (!wrap) return
    ghost.style.setProperty('--ghost-fs', `${REF}px`)
    const w = ghost.scrollWidth || 1
    ghost.style.setProperty('--ghost-fs', `${((wrap.clientWidth / w) * REF * 0.98).toFixed(2)}px`)
  }
  fit()
  window.addEventListener('resize', fit)
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit)
}

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */
window.addEventListener('load', () => {
  initPageTransition()
  initTheme()
  initNavTheme()
  initSkyGust()
  initMeteor()
  initHeroLetters()
  initHeroRoll()
  if (reduced) {
    gsap.set(['.hero-sun', '.hero-cloud', '.hero-eyebrow', '.hero-headline', '.hero-rollwrap'], { clearProps: 'all' })
    initProjectView()
    initFooterGhost()
    initTimelineExpand()
    initEmailCopy()
    return
  }
  initHero()
  initHeroScroll()
  initSectionTitles()
  initReveals()
  initJourneyLine()
  initStickers()
  initWorkStack()
  initProjectView()
  initContactReveal()
  initFooterGhost()
  initTimelineExpand()
  initEmailCopy()
  initActiveLinks()

  ScrollTrigger.refresh()
})
