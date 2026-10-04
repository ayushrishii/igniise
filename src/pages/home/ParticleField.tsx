import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * ParticleField (design.md v2 §5): the landing-page animation, in the
 * language of the xfx.io dotted-particle morph. ~1200 ink dots on canvas
 * move through three formations, scrubbed by ScrollTrigger across the
 * hero:
 *
 *   1. SPHERE   one consensus, two venues pricing the same event
 *   2. SPLIT    the venues disagree, the sphere tears into two lobes
 *   3. BAND     the disagreement becomes a number: two rows, a measured gap
 *
 * Scroll progress 0..1 maps sphere->split, 1..2 split->band. Rendering
 * runs on gsap.ticker (no scroll listeners), pauses while the canvas is
 * offscreen, halves particle count below 768px, caps DPR at 2. Reduced
 * motion: the band formation renders once, static. The canvas is
 * aria-hidden and pointer-events-none; the argument reads without it.
 */

const INK = '18, 61, 47'
const WIDE = '168, 104, 28'

interface Particle {
  // per-formation targets, normalized to the canvas box
  sx: number; sy: number
  tx: number; ty: number
  bx: number; by: number
  r: number
  a: number
  phase: number
  speed: number
  amp: number
  wide: boolean
}

function buildParticles(count: number): Particle[] {
  const pts: Particle[] = []
  const golden = Math.PI * (1 + Math.sqrt(5))

  // Formation 1: fibonacci sphere, slightly flattened, centered right of
  // the headline column (xfx keeps the field off the copy).
  const scx = 0.7, scy = 0.46, sr = 0.3
  // Formation 2: two lobes pulled apart: venue A left, venue B right.
  const lobes = [
    { cx: 0.55, cy: 0.46, r: 0.17 },
    { cx: 0.86, cy: 0.46, r: 0.17 },
  ]
  // Formation 3: two quantized rows with a visible gap: the spread.
  const rowY = [0.47, 0.54]
  const bandX0 = 0.34, bandX1 = 0.97

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const phi = Math.acos(1 - 2 * t)
    const theta = golden * i
    const sx = scx + sr * Math.sin(phi) * Math.cos(theta)
    const sy = scy + sr * Math.cos(phi) * 0.92

    const lobe = lobes[i % 2]
    const lt = ((i >> 1) + 0.5) / (count / 2)
    const lphi = Math.acos(1 - 2 * lt)
    const ltheta = golden * i
    const tx = lobe.cx + lobe.r * Math.sin(lphi) * Math.cos(ltheta)
    const ty = lobe.cy + lobe.r * Math.cos(lphi) * 0.92

    const row = i % 2
    const bx = bandX0 + ((i >> 1) + 0.5) / (count / 2) * (bandX1 - bandX0)
    const by = rowY[row]

    pts.push({
      sx, sy, tx, ty, bx, by,
      r: 0.8 + ((i * 2654435761) % 100) / 100 * 1.1,
      a: 0.16 + ((i * 40503) % 100) / 100 * 0.26,
      phase: (i * 0.6180339887) % (Math.PI * 2),
      speed: 0.5 + ((i * 97) % 100) / 100 * 0.7,
      amp: 0.002 + ((i * 57) % 100) / 100 * 0.004,
      wide: i % 12 === 0,
    })
  }
  return pts
}

const smooth = (t: number) => t * t * (3 - 2 * t)

export default function ParticleField({
  trigger,
  reducedMotion,
}: {
  trigger: React.RefObject<HTMLElement | null>
  reducedMotion: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const host = canvas?.parentElement
    if (!canvas || !host) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let particles = buildParticles(
      window.innerWidth < 768 ? 620 : 1240,
    )
    let w = 0
    let h = 0
    let dpr = 1
    const progress = { p: reducedMotion ? 2 : 0 }
    let visible = true
    let alive = true

    const resize = () => {
      const rect = host.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.max(rect.width, 1)
      h = Math.max(rect.height, 1)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      // setting canvas.width clears the bitmap; repaint the static
      // formation immediately so reduced motion never shows an empty field
      if (reducedMotion) draw(0)
    }
    const ro = new ResizeObserver(resize)

    const draw = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const p = progress.p
      const seg = p < 1 ? 0 : 1
      const t = smooth(seg === 0 ? p : p - 1)
      // the sphere keeps a slow rotation so the consensus feels alive
      const rot = seg === 0 ? time * 0.00012 : 0.1
      const cosR = Math.cos(rot)
      const sinR = Math.sin(rot)

      for (let i = 0; i < particles.length; i++) {
        const q = particles[i]
        let nx: number
        let ny: number
        if (seg === 0) {
          // rotate sphere target around its center before blending
          const dx = q.sx - 0.7
          const dy = q.sy - 0.46
          const rx = 0.7 + dx * cosR - dy * sinR * 0.6
          const ry = 0.46 + dx * sinR * 0.6 + dy * cosR
          nx = rx + (q.tx - rx) * t
          ny = ry + (q.ty - ry) * t
        } else {
          nx = q.tx + (q.bx - q.tx) * t
          ny = q.ty + (q.by - q.ty) * t
        }
        const drift = Math.sin(time * 0.001 * q.speed + q.phase) * q.amp
        const x = nx * w + drift * w
        const y = ny * h + drift * h * 0.6
        ctx.fillStyle = q.wide
          ? `rgba(${WIDE}, ${q.a + 0.08})`
          : `rgba(${INK}, ${q.a})`
        ctx.beginPath()
        ctx.arc(x, y, q.r, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Initial sizing runs only after draw is defined: resize() repaints
    // immediately under reduced motion.
    resize()
    ro.observe(host)

    if (reducedMotion) {
      draw(0)
    } else {
      const st = ScrollTrigger.create({
        trigger: trigger.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 0.6,
        onUpdate: (self) => {
          progress.p = self.progress * 2
        },
        onToggle: (self) => {
          visible = self.isActive
        },
      })

      const tick = (time: number) => {
        if (!alive || !visible) return
        draw(time)
      }
      gsap.ticker.add(tick)

      return () => {
        alive = false
        gsap.ticker.remove(tick)
        st.kill()
        ro.disconnect()
      }
    }

    return () => {
      alive = false
      ro.disconnect()
    }
  }, [trigger, reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  )
}
