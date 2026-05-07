'use client'

import { useEffect, useRef } from 'react'
import { DrawingInstruction, StrokeElement } from '@/types/drawings'
import { generateStrokes } from '@/lib/engine'

interface HexPreviewProps {
  instruction: DrawingInstruction
  index: number
  style?: React.CSSProperties
}

// Virtual render size: each preview is generated at this resolution and
// then scaled down to fit its hex tile via CSS. Rendering at the engine's
// "natural" tuning size keeps line densities, stroke widths, and grid
// spacings looking right — at the actual ~96px tile size, drawings tuned
// for a full wall would otherwise be too dense or too sparse to read.
const RENDER_W = 480
const RENDER_H = Math.round(RENDER_W * (2 / Math.sqrt(3)))

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

    // Pixel buffer is the virtual render size; CSS sizes it to the tile.
    canvas.width = RENDER_W
    canvas.height = RENDER_H

    const ctx = canvas.getContext('2d')!
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = instruction.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, RENDER_W, RENDER_H)

    // Deterministic seed per drawing so previews are stable across reloads.
    const seed = (index + 1) * 1009
    const strokes = generateStrokes(instruction, seed, RENDER_W, RENDER_H)
    drawAll(ctx, strokes)
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
      <svg className="hex-border" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon
          points="50,0 100,25 100,75 50,100 0,75 0,25"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="hex-label">#{number}</span>
    </button>
  )
}
