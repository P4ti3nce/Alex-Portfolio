const header = document.querySelector('#header')
const nav = document.querySelector('#nav')
const menuBtn = document.querySelector('#menu-btn')
const navAnchors = document.querySelectorAll('.nav-links a')
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
const interactive = finePointer && !reduceMotion

function setMenu(open) {
    nav.classList.toggle('open', open)
    header.classList.toggle('menu-open', open)
    menuBtn.setAttribute('aria-expanded', String(open))
    menuBtn.firstElementChild.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars'
}

menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')))
navAnchors.forEach(a => a.addEventListener('click', () => setMenu(false)))
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') setMenu(false)
})

function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 20)
}

window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

const sections = document.querySelectorAll('main section[id]')

const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return
        navAnchors.forEach(a => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id)
        })
    })
}, { rootMargin: '-45% 0px -50% 0px' })

sections.forEach(s => sectionObserver.observe(s))

const revealItems = document.querySelectorAll('.reveal')

if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach(el => el.classList.add('visible'))
} else {
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('visible')
            revealObserver.unobserve(entry.target)
        })
    }, { threshold: 0.12 })

    revealItems.forEach(el => revealObserver.observe(el))
}

const filters = document.querySelectorAll('.filter')
const cards = document.querySelectorAll('.project-card')

filters.forEach(btn => {
    btn.addEventListener('click', () => {
        const filter = btn.dataset.filter
        filters.forEach(b => b.classList.toggle('active', b === btn))
        cards.forEach(card => {
            const match = filter === 'all' || card.dataset.category.split(' ').includes(filter)
            card.classList.toggle('hidden', !match)
            if (match) card.classList.add('visible')
        })
    })
})

const copyBtn = document.querySelector('#copy-email')
const copyLabel = copyBtn.querySelector('span')

copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(copyBtn.dataset.email)
        copyLabel.textContent = 'Copied'
    } catch {
        copyLabel.textContent = copyBtn.dataset.email
    }
    setTimeout(() => {
        copyLabel.textContent = 'Copy email'
    }, 2000)
})

document.querySelector('#year').textContent = new Date().getFullYear()

function pointerOffset(el, e) {
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    return {
        x: x,
        y: y,
        nx: x / rect.width - 0.5,
        ny: y / rect.height - 0.5
    }
}

function clearVars(el, names) {
    names.forEach(name => el.style.removeProperty(name))
}

if (finePointer) {
    document.querySelectorAll('.project-card, .skill-group, .timeline-body, .facts div, .contact-card').forEach(el => {
        el.addEventListener('pointermove', e => {
            const p = pointerOffset(el, e)
            el.style.setProperty('--mx', p.x + 'px')
            el.style.setProperty('--my', p.y + 'px')
        })
    })
}

if (interactive) {
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('pointermove', e => {
            const p = pointerOffset(card, e)
            card.style.setProperty('--rx', (p.ny * -6).toFixed(2) + 'deg')
            card.style.setProperty('--ry', (p.nx * 6).toFixed(2) + 'deg')
            card.style.setProperty('--px', (p.nx * -10).toFixed(1) + 'px')
            card.style.setProperty('--py', (p.ny * -10).toFixed(1) + 'px')
        })
        card.addEventListener('pointerleave', () => {
            clearVars(card, ['--rx', '--ry', '--px', '--py'])
        })
    })

    document.querySelectorAll('.btn, .socials a').forEach(el => {
        el.addEventListener('pointermove', e => {
            const p = pointerOffset(el, e)
            const tx = Math.max(-6, Math.min(6, p.nx * 14))
            const ty = Math.max(-5, Math.min(5, p.ny * 12))
            el.style.setProperty('--tx', tx.toFixed(1) + 'px')
            el.style.setProperty('--ty', ty.toFixed(1) + 'px')
        })
        el.addEventListener('pointerleave', () => {
            clearVars(el, ['--tx', '--ty'])
        })
    })

    const aboutPhoto = document.querySelector('.about-photo')

    aboutPhoto.addEventListener('pointermove', e => {
        const p = pointerOffset(aboutPhoto, e)
        aboutPhoto.style.setProperty('--rx', (p.ny * -8).toFixed(2) + 'deg')
        aboutPhoto.style.setProperty('--ry', (p.nx * 8).toFixed(2) + 'deg')
        aboutPhoto.style.setProperty('--fx', (p.nx * -16).toFixed(1) + 'px')
        aboutPhoto.style.setProperty('--fy', (p.ny * -16).toFixed(1) + 'px')
    })
    aboutPhoto.addEventListener('pointerleave', () => {
        clearVars(aboutPhoto, ['--rx', '--ry', '--fx', '--fy'])
    })
}

const canvas = document.querySelector('#terrain')
const ctx = canvas.getContext('2d')
const seedBtn = document.querySelector('#seed-btn')
const seedValue = document.querySelector('#seed-value')
const hero = document.querySelector('.hero')

const ROWS = 26
const STEP = 14
let seed = 0
let width = 0
let height = 0
let time = 0
let running = false
let frameId = 0
let pointerX = 0
let pointerY = 0
let hillX = 0
let hillY = 0
let hill = 0
let hillTarget = 0

function hash(x, y) {
    const n = Math.sin(x * 127.1 + y * 311.7 + seed * 0.137) * 43758.5453
    return n - Math.floor(n)
}

function smooth(t) {
    return t * t * (3 - 2 * t)
}

function noise(x, y) {
    const ix = Math.floor(x)
    const iy = Math.floor(y)
    const fx = smooth(x - ix)
    const fy = smooth(y - iy)
    const a = hash(ix, iy)
    const b = hash(ix + 1, iy)
    const c = hash(ix, iy + 1)
    const d = hash(ix + 1, iy + 1)
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

function fbm(x, y) {
    return noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.28 + noise(x * 4.3, y * 4.3) * 0.12
}

function hillHeight(x, y) {
    if (hill < 0.01) return 0
    const dx = (x - hillX) / 130
    const dy = (y - hillY) / 170
    return Math.exp(-(dx * dx + dy * dy)) * 70 * hill
}

function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    width = hero.clientWidth
    height = hero.clientHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    draw()
}

function draw() {
    ctx.clearRect(0, 0, width, height)
    const top = height * 0.38
    const gap = (height - top) / (ROWS - 4)
    const amp = Math.min(height * 0.22, 170)

    for (let r = 0; r < ROWS; r++) {
        const depth = r / (ROWS - 1)
        const baseY = top + r * gap
        const rowAmp = amp * (0.35 + depth * 0.75)

        ctx.beginPath()
        for (let x = -STEP; x <= width + STEP; x += STEP) {
            const edge = Math.min(1, Math.max(0, (x / width - 0.18) * 1.6))
            const n = fbm(x * 0.0042 + time, r * 0.17 - time * 0.6)
            const y = baseY - Math.pow(n, 1.6) * rowAmp * (0.25 + edge * 0.75) - hillHeight(x, baseY)
            if (x === -STEP) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
        }

        ctx.lineTo(width + STEP, height + 10)
        ctx.lineTo(-STEP, height + 10)
        ctx.closePath()
        ctx.fillStyle = '#0f1012'
        ctx.fill()

        const accentRow = r % 7 === 3
        ctx.strokeStyle = accentRow
            ? `rgba(255, 77, 69, ${0.25 + depth * 0.5})`
            : `rgba(237, 236, 231, ${0.05 + depth * 0.17})`
        ctx.lineWidth = accentRow ? 1.4 : 1
        ctx.stroke()
    }
}

function loop() {
    time += 0.0016
    hillX += (pointerX - hillX) * 0.08
    hillY += (pointerY - hillY) * 0.08
    hill += (hillTarget - hill) * 0.05
    draw()
    frameId = requestAnimationFrame(loop)
}

function start() {
    if (running || reduceMotion) return
    running = true
    frameId = requestAnimationFrame(loop)
}

function stop() {
    running = false
    cancelAnimationFrame(frameId)
}

function newSeed() {
    seed = Math.floor(Math.random() * 900000) + 100000
    seedValue.textContent = seed
    time = 0
    draw()
}

seedBtn.addEventListener('click', newSeed)
window.addEventListener('resize', resize)

if (interactive) {
    hero.addEventListener('pointermove', e => {
        const rect = canvas.getBoundingClientRect()
        pointerX = e.clientX - rect.left
        pointerY = e.clientY - rect.top
        if (hill < 0.01) {
            hillX = pointerX
            hillY = pointerY
        }
        hillTarget = 1
    })
    hero.addEventListener('pointerleave', () => {
        hillTarget = 0
    })
}

new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) start()
    else stop()
}).observe(hero)

document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop()
    else if (hero.getBoundingClientRect().bottom > 0) start()
})

newSeed()
resize()
