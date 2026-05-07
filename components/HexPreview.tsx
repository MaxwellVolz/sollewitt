'use client'

import { useEffect, useRef } from 'react'
import { DrawingInstruction, StrokeElement } from '@/types/drawings'
import { generateStrokes } from '@/lib/engine'

interface HexPreviewProps {
  instruction: DrawingInstruction
  index: number
  style?: React.CSSProperties
}

function drawAll(ctx: CanvasRenderingContext2D, strokes: StrokeElement[]) {
  for (const stroke of strokes) {
    const { path, style } = stroke
    if (path.length < 2) continue

    ctx.save()
    ctx.globalAlpha = style.opacity
    ctx.lineWidth = style.width
    ctx.strokeStyle = style.color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

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
}

export function HexPreview({ instruction, index, style }: HexPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const render = () => {
      const w = parent.clientWidth
      const h = parent.clientHeight
      if (w === 0 || h === 0) return

      const dpr = window.devicePixelRatio || 1
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`

      const ctx = canvas.getContext('2d')!
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = instruction.backgroundColor || '#ffffff'
      ctx.fillRect(0, 0, w, h)

      // Deterministic seed per drawing so previews are stable across reloads.
      const seed = (index + 1) * 1009
      const strokes = generateStrokes(instruction, seed, w, h)
      drawAll(ctx, strokes)
    }

    render()
    const obs = new ResizeObserver(render)
    obs.observe(parent)
    return () => obs.disconnect()
  }, [instruction, index])

  const handleClick = () => {
    const target = document.getElementById(instruction.id)
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const number = instruction.title.replace(/[^0-9]/g, '')

  return (
    <button
      type="button"
      className="hex-preview"
      onClick={handleClick}
      aria-label={`Jump to ${instruction.title}`}
      style={style}
    >
      <div className="hex-clip">
        <canvas ref={canvasRef} />
      </div>
      <span className="hex-label">#{number}</span>
    </button>
  )
}
