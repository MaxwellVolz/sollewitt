'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import { drawings } from '@/lib/drawings'
import { HexPreview } from './HexPreview'

const HEX_W_DESKTOP = 128
const HEX_W_MOBILE = 84

function computeDims(width: number) {
  const cellW = width < 640 ? HEX_W_MOBILE : HEX_W_DESKTOP
  const fit = Math.max(1, Math.floor((width - cellW * 0.5) / cellW))
  return { cols: fit, hexW: cellW }
}

export function HexGallery() {
  const containerRef = useRef<HTMLDivElement>(null)
  // Default to desktop sizing so SSR and the first client paint produce
  // identical markup. Real measurement happens in useLayoutEffect before
  // the browser paints, so the user never sees this default.
  const [{ cols, hexW }, setDims] = useState(() => ({ cols: 8, hexW: HEX_W_DESKTOP }))
  const [measured, setMeasured] = useState(false)

  // useLayoutEffect runs synchronously after the DOM is committed but
  // before the browser paints — so the user only ever sees the corrected
  // measurement, never the SSR default. Without this, the grid paints
  // once at the default size, then snaps to the measured size on the
  // next frame: the visible jitter the user reported.
  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      // Trust the container's measured width up to a sane multiple of the
      // viewport. The 1.2× cap catches the original failure mode (a
      // pre-settle desktop-sized clientWidth on a mobile viewport) while
      // staying loose enough not to clip a normally-sized container.
      const w = Math.min(el.clientWidth, window.innerWidth * 1.2)
      const next = computeDims(w)
      setDims((prev) => (prev.cols === next.cols && prev.hexW === next.hexW ? prev : next))
    }

    compute()
    setMeasured(true)
    const obs = new ResizeObserver(compute)
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const hexH = hexW * (2 / Math.sqrt(3))
  const rowStep = hexH * 0.75
  const rows = Math.ceil(drawings.length / cols)
  const totalHeight = rowStep * (rows - 1) + hexH
  const gridW = cols * hexW + hexW * 0.5

  // Place every tile, then rank tiles by distance from the grid center so
  // the entrance animation blooms outward in rings (closest tile = first to
  // appear). The ranking is a pure function of cols/hexW, so SSR and the
  // first client paint agree (both use the default 8-col layout) — no
  // hydration drift, and no Math.random/Date to break determinism.
  const tiles = drawings.map((drawing, i) => {
    const row = Math.floor(i / cols)
    const colInRow = i % cols
    const xOffset = row % 2 === 1 ? hexW * 0.5 : 0
    const left = colInRow * hexW + xOffset
    const top = row * rowStep
    return { drawing, i, left, top }
  })

  const centerX = gridW / 2
  const centerY = totalHeight / 2
  const bloomOrder = new Array<number>(tiles.length)
  tiles
    .map((t) => ({
      i: t.i,
      d: Math.hypot(t.left + hexW / 2 - centerX, t.top + hexH / 2 - centerY),
    }))
    .sort((a, b) => a.d - b.d)
    .forEach((entry, rank) => {
      bloomOrder[entry.i] = rank
    })

  return (
    <div className="hex-gallery" aria-label="Drawing index" ref={containerRef}>
      <div
        className="hex-grid"
        // Hidden until first measurement commits. Prevents the brief flash
        // of the SSR default layout in the (rare) case where measured cols
        // differ — and prevents fall-in animations starting against an
        // about-to-change grid position.
        style={{
          height: `${totalHeight}px`,
          width: `${gridW}px`,
          visibility: measured ? 'visible' : 'hidden',
        }}
      >
        {tiles.map(({ drawing, i, left, top }) => (
          <HexPreview
            key={drawing.id}
            instruction={drawing}
            index={i}
            style={{
              left: `${left}px`,
              top: `${top}px`,
              width: `${hexW}px`,
              height: `${hexH}px`,
              ['--i' as string]: bloomOrder[i],
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  )
}
