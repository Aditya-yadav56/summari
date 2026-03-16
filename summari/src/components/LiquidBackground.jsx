import { useEffect, useRef } from 'react'

// ─── Spring-mesh cloth simulation ──────────────────────────────────────────
const COLS = 22
const ROWS = 16
const STIFFNESS = 0.06
const DAMPING = 0.88
const MOUSE_RADIUS = 130
const MOUSE_STRENGTH = 0.38

function buildMesh(w, h) {
    const pts = []
    for (let r = 0; r <= ROWS; r++) {
        pts[r] = []
        for (let c = 0; c <= COLS; c++) {
            pts[r][c] = {
                x: (c / COLS) * w,
                y: (r / ROWS) * h,
                ox: (c / COLS) * w,   // origin x
                oy: (r / ROWS) * h,   // origin y
                vx: 0,
                vy: 0,
            }
        }
    }
    return pts
}

function updateMesh(pts, mouse, w, h) {
    for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
            const p = pts[r][c]
            // Spring back to origin
            let fx = (p.ox - p.x) * STIFFNESS
            let fy = (p.oy - p.y) * STIFFNESS

            // Mouse repulsion
            if (mouse.active) {
                const dx = p.x - mouse.x
                const dy = p.y - mouse.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < MOUSE_RADIUS) {
                    const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * MOUSE_STRENGTH
                    fx += (dx / dist) * force * w * 0.08
                    fy += (dy / dist) * force * h * 0.08
                }
            }

            p.vx = (p.vx + fx) * DAMPING
            p.vy = (p.vy + fy) * DAMPING
            p.x += p.vx
            p.y += p.vy
        }
    }
}

// ─── Blob layers (soft gray shadows) ───────────────────────────────────────
function initBlobs(w, h) {
    return Array.from({ length: 7 }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 180 + Math.random() * 220,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        phase: Math.random() * Math.PI * 2,
        // subtle gray, very low alpha
        alpha: 0.08 + Math.random() * 0.1,
    }))
}

function updateBlobs(blobs, w, h, t) {
    blobs.forEach((b) => {
        b.x += b.speedX + Math.sin(t * 0.0008 + b.phase) * 0.4
        b.y += b.speedY + Math.cos(t * 0.0006 + b.phase) * 0.4
        if (b.x < -b.r) b.x = w + b.r
        if (b.x > w + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = h + b.r
        if (b.y > h + b.r) b.y = -b.r
    })
}

// ─── Draw ───────────────────────────────────────────────────────────────────
function draw(ctx, pts, blobs, w, h, isDark) {
    ctx.clearRect(0, 0, w, h)

    // Base color
    ctx.fillStyle = isDark ? '#0a0a0a' : '#ffffff'
    ctx.fillRect(0, 0, w, h)

    // Draw blurred blobs (soft cloth shadows)
    blobs.forEach((b) => {
        const grd = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r)
        if (isDark) {
            grd.addColorStop(0, `rgba(40,40,60,${b.alpha * 1.5})`)
            grd.addColorStop(0.5, `rgba(30,30,45,${b.alpha * 0.8})`)
            grd.addColorStop(1, `rgba(15,15,20,0)`)
        } else {
            grd.addColorStop(0, `rgba(140,140,160,${b.alpha})`)
            grd.addColorStop(0.5, `rgba(170,170,185,${b.alpha * 0.55})`)
            grd.addColorStop(1, `rgba(200,200,215,0)`)
        }
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fill()
    })

    // Draw cloth mesh as filled quads — distorted grid gives cloth feel
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const p00 = pts[r][c]
            const p10 = pts[r][c + 1]
            const p01 = pts[r + 1][c]
            const p11 = pts[r + 1][c + 1]

            // Shade based on deformation
            const dx = p10.x - p00.x
            const dy = p01.y - p00.y
            const warpX = Math.abs(p00.x - p00.ox) + Math.abs(p10.x - p10.ox)
            const shade = Math.min(warpX * 1.8, 22)

            const alpha = 0.055 + shade / 1400

            ctx.beginPath()
            ctx.moveTo(p00.x, p00.y)
            ctx.lineTo(p10.x, p10.y)
            ctx.lineTo(p11.x, p11.y)
            ctx.lineTo(p01.x, p01.y)
            ctx.closePath()

            const grd = ctx.createLinearGradient(p00.x, p00.y, p11.x, p11.y)
            if (isDark) {
                grd.addColorStop(0, `rgba(60,60,80,${alpha + 0.02})`)
                grd.addColorStop(1, `rgba(30,30,40,${alpha})`)
            } else {
                grd.addColorStop(0, `rgba(180,180,195,${alpha + 0.02})`)
                grd.addColorStop(1, `rgba(210,210,220,${alpha})`)
            }
            ctx.fillStyle = grd
            ctx.fill()

            // Thin grid lines for cloth texture
            ctx.strokeStyle = isDark ? `rgba(80,80,100,${alpha * 0.4})` : `rgba(190,190,205,${alpha * 0.6})`
            ctx.lineWidth = 0.5
            ctx.stroke()
        }
    }
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function LiquidBackground() {
    const canvasRef = useRef(null)

    useEffect(() => {
        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        let animId
        let pts, blobs
        const mouse = { x: 0, y: 0, active: false }
        let startTime = performance.now()
        let isDark = document.documentElement.classList.contains('dark')

        // Observe theme changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    isDark = document.documentElement.classList.contains('dark')
                }
            })
        })
        observer.observe(document.documentElement, { attributes: true })

        function resize() {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
            pts = buildMesh(canvas.width, canvas.height)
            blobs = initBlobs(canvas.width, canvas.height)
        }

        function onMouseMove(e) {
            mouse.x = e.clientX
            mouse.y = e.clientY
            mouse.active = true
        }
        function onMouseLeave() {
            mouse.active = false
        }

        function loop() {
            const t = performance.now() - startTime
            updateMesh(pts, mouse, canvas.width, canvas.height)
            updateBlobs(blobs, canvas.width, canvas.height, t)
            draw(ctx, pts, blobs, canvas.width, canvas.height, isDark)
            animId = requestAnimationFrame(loop)
        }

        resize()
        window.addEventListener('resize', resize)
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseleave', onMouseLeave)
        loop()

        return () => {
            cancelAnimationFrame(animId)
            observer.disconnect()
            window.removeEventListener('resize', resize)
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseleave', onMouseLeave)
        }
    }, [])

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 0,
                display: 'block',
                // CSS-level blur to soften the whole canvas
                filter: 'blur(18px) saturate(1.1)',
                transform: 'scale(1.04)', // avoids edge artifacts from blur
            }}
        />
    )
}
