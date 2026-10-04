import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import Hero from './home/Hero'
import Mechanism from './home/Mechanism'
import Credibility from './home/Credibility'

gsap.registerPlugin(ScrollTrigger)

/**
 * Manifesto (`/`). One scroll-length editorial argument:
 * hook -> mechanism -> live credibility -> Enter the Terminal.
 * Lenis smooth scroll is active on this page only (design.md §6);
 * it is not initialized under prefers-reduced-motion.
 */
export default function Home() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis()
    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.refresh()
    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
    }
  }, [reducedMotion])

  return (
    <>
      <Hero />
      <Mechanism />
      <Credibility />
    </>
  )
}
