import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'

interface TrailDot {
  id: number
  x: number
  y: number
}

export function MouseTrail() {
  const [trail, setTrail] = useState<TrailDot[]>([])
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })
  const containerRef = useRef<HTMLDivElement>(null)
  const idCounter = useRef(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouseX.set(x)
      mouseY.set(y)

      const newDot: TrailDot = { id: idCounter.current++, x, y }
      setTrail(prev => [...prev.slice(-10), newDot])
    }

    const handleMouseLeave = () => {
      setTrail([])
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [mouseX, mouseY])

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-[9999] pointer-events-none overflow-hidden"
    >
      {/* Main cursor follower */}
      <motion.div
        className="w-3 h-3 rounded-full bg-cyan/30 backdrop-blur-sm border border-cyan/40"
        style={{
          x: springX,
          y: springY,
          translateX: '-50%',
          translateY: '-50%',
        }}
      />

      {/* Fading trail dots */}
      <AnimatePresence>
        {trail.map((dot) => (
          <motion.div
            key={dot.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-violet/40 backdrop-blur-sm"
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              left: dot.x,
              top: dot.y,
              translateX: '-50%',
              translateY: '-50%',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}