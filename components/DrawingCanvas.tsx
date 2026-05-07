'use client'

import { useRef, useEffect, useImperativeHandle, forwardRef, type MutableRefObject } from 'react'
import { DrawingInstruction, StrokeElement } from '@/types/drawings'
import { generateStrokes } from '@/lib/engine'

interface DrawingCanvasProps {
  instruction: DrawingInstruction
  seed: number
  progressRef: MutableRefObject<number>
}

export interface DrawingCanvasHandle {
  getCanvas: () => HTMLCanvasElement | null
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: StrokeElement) {
  const { path, style, text } = stroke

  if (text) {
    ctx.save()
    ctx.globalAlpha = style.opacity
    ctx.fillStyle = style.color
    ctx.font = `${text.size}px var(--font-space-grotesk), sans-serif`
    ctx.textAlign = text.align || 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(text.content, path[0][0], path[0][1])
    ctx.restore()
    return
  }

  if (path.length < 2) return

  ctx.save()
  ctx.globalAlpha = style.opacity
  ctx.lineWidth = style.width
  ctx.strokeStyle = style.color
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Closed path (first == last) → fill as polygon (pegboard squares)
  const isClosed =
    path.length > 3 &&
    path[0][0] === path[path.length - 1][0] &&
    path[0][1] === path[path.length - 1][1]

  ctx.beginPath()
  ctx.moveTo(path[0][0], path[0][1])
  for (let j = 1; j < path.length; j++) {
    ctx.lineTo(path[j][0], path[j][1])
  }

  if (isClosed) {
    ctx.fillStyle = style.color
    ctx.fill()
  } else {
    ctx.stroke()
  }
  ctx.restore()
}

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(function DrawingCanvas({ instruction, seed, progressRef }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const strokesRef = useRef<StrokeElement[]>([])
  const drawnCountRef = useRef(0)
  const bufferRef = useRef<HTMLCanvasElement | null>(null)
  const sizeRef = useRef({ w: 0, h: 0 })
  const rafRef = useRef(0)

  useImperativeHandle(ref, () => ({
    getCanvas: () => bufferRef.current,
  }))

  // Generate strokes and set up the offscreen buffer
  const rebuild = (w: number, h: number) => {
    if (w === 0 || h === 0) return

    const dpr = window.devicePixelRatio || 1
    sizeRef.current = { w, h }

    // Display canvas
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = w * dpr
    canvas.height = h * dpr
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`

    // Offscreen buffer (accumulates drawn strokes)
    let buffer = bufferRef.current
    if (!buffer) {
      buffer = document.createElement('canvas')
      bufferRef.current = buffer
    }
    buffer.width = w * dpr
    buffer.height = h * dpr

    const bufCtx = buffer.getContext('2d')!
    bufCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
    bufCtx.clearRect(0, 0, w, h)

    // Generate strokes
    const strokes = generateStrokes(instruction, seed, w, h)
    strokesRef.current = strokes
    drawnCountRef.current = 0

    console.log(`[${instruction.id}] seed=${seed} size=${w}x${h} strokes=${strokes.length}`)
    if (strokes.length > 0) {
      const pathLens = new Set(strokes.map((s) => s.path.length))
      const wMin = strokes.reduce((m, s) => Math.min(m, s.style.width), Infinity)
      const wMax = strokes.reduce((m, s) => Math.max(m, s.style.width), 0)
      const oMin = strokes.reduce((m, s) => Math.min(m, s.style.opacity), Infinity)
      const oMax = strokes.reduce((m, s) => Math.max(m, s.style.opacity), 0)
      console.log(`[${instruction.id}] path lengths: ${[...pathLens].join(', ')} | width: ${wMin.toFixed(2)}–${wMax.toFixed(2)} | opacity: ${oMin.toFixed(2)}–${oMax.toFixed(2)}`)
    }
  }

  // Animation loop — runs every frame, draws incrementally
  useEffect(() => {
    const paint = () => {
      const canvas = canvasRef.current
      const buffer = bufferRef.current
      const strokes = strokesRef.current
      if (!canvas || !buffer || strokes.length === 0) {
        rafRef.current = requestAnimationFrame(paint)
        return
      }

      const total = strokes.length
      const targetCount = Math.floor(progressRef.current * total)
      const drawn = drawnCountRef.current

      // If progress went backward (seek/reroll), clear buffer and redraw up to target
      if (targetCount < drawn) {
        const { w, h } = sizeRef.current
        const dpr = window.devicePixelRatio || 1
        const bufCtx = buffer.getContext('2d')!
        bufCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
        bufCtx.clearRect(0, 0, w, h)
        for (let i = 0; i < targetCount; i++) {
          drawStroke(bufCtx, strokes[i])
        }
        drawnCountRef.current = targetCount
      }
      // Draw new strokes incrementally
      else if (targetCount > drawn) {
        const dpr = window.devicePixelRatio || 1
        const bufCtx = buffer.getContext('2d')!
        bufCtx.setTransform(dpr, 0, 0, dpr, 0, 0)
        for (let i = drawn; i < targetCount; i++) {
          drawStroke(bufCtx, strokes[i])
        }
        drawnCountRef.current = targetCount
      }

      // Blit buffer to display canvas
      const ctx = canvas.getContext('2d')!
      const { w, h } = sizeRef.current
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, w * dpr, h * dpr)
      ctx.drawImage(buffer, 0, 0)

      rafRef.current = requestAnimationFrame(paint)
    }

    rafRef.current = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(rafRef.current)
  }, [progressRef])

  // ResizeObserver — rebuild on size change
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      const h = entry.contentRect.height
      if (w > 0 && h > 0) rebuild(w, h)
    })
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instruction, seed])

  return (
    <div ref={containerRef} className="drawing-canvas">
      <canvas ref={canvasRef} />
    </div>
  )
})
