'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { drawings } from '@/lib/drawings'
import { HexPreview } from './HexPreview'

const HEX_W_DESKTOP = 128
const HEX_W_MOBILE = 84

// Deterministic string → integer hash so fall-in order can be randomized
// without breaking SSR/hydration: server and client compute the same
// shuffle from the drawing IDs.
function hashCode(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function HexGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(8)
  const [hexW, setHexW] = useState(HEX_W_DESKTOP)

  // Shuffle the fall-in order by sorting indices by a stable hash of each
  // drawing's id. The mapping is array-position → fall-order-rank, so a
  // tile's animation-delay no longer correlates with its grid position.
  const fallOrder = useMemo(() => {
    const ranked = drawings.map((d, i) => ({ i, h: hashCode(d.id) }))
    ranked.sort((a, b) => a.h - b.h)
    const order: number[] = new Array(drawings.length)
    ranked.forEach((entry, rank) => {
      order[entry.i] = rank
    })
    return order
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      // Clamp by both the container's measured width AND the viewport width.
      // On mobile, the container can briefly report a desktop-sized width
      // before flex layout settles, which would otherwise size the grid
      // wider than the viewport.
      const w = Math.min(el.clientWidth, window.innerWidth)
      const cellW = w < 640 ? HEX_W_MOBILE : HEX_W_DESKTOP
      // Allow half-hex of horizontal slack for the offset rows so they
      // don't overflow the container width.
      const fit = Math.max(1, Math.floor((w - cellW * 0.5) / cellW))
      setCols(fit)
      setHexW(cellW)
    }

    compute()
    const obs = new ResizeObserver(compute)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hexH = hexW * (2 / Math.sqrt(3))
  const rowStep = hexH * 0.75
  const rows = Math.ceil(drawings.length / cols)
  const totalHeight = rowStep * (rows - 1) + hexH

  return (
    <div className="hex-gallery" aria-label="Drawing index" ref={containerRef}>
      <div
        className="hex-grid"
        style={{ height: `${totalHeight}px`, width: `${cols * hexW + hexW * 0.5}px` }}
      >
        {drawings.map((drawing, i) => {
          const row = Math.floor(i / cols)
          const colInRow = i % cols
          const xOffset = row % 2 === 1 ? hexW * 0.5 : 0
          const left = colInRow * hexW + xOffset
          const top = row * rowStep
          return (
            <HexPreview
              key={drawing.id}
              instruction={drawing}
              index={i}
              style={{
                left: `${left}px`,
                top: `${top}px`,
                width: `${hexW}px`,
                height: `${hexH}px`,
                ['--i' as string]: fallOrder[i],
              } as React.CSSProperties}
            />
          )
        })}
      </div>
    </div>
  )
}
