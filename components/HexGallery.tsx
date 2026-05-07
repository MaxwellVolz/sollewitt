'use client'

import { useEffect, useRef, useState } from 'react'
import { drawings } from '@/lib/drawings'
import { HexPreview } from './HexPreview'

const HEX_W_DESKTOP = 96
const HEX_W_MOBILE = 64

export function HexGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cols, setCols] = useState(8)
  const [hexW, setHexW] = useState(HEX_W_DESKTOP)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      const w = el.clientWidth
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
              style={{ left: `${left}px`, top: `${top}px`, width: `${hexW}px`, height: `${hexH}px` }}
            />
          )
        })}
      </div>
    </div>
  )
}
