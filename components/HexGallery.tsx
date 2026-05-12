'use client'

import { useLayoutEffect, useMemo, useRef, useState } from 'react'
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
      // viewport. Mobile uses an explicit 110vw container (1.1× innerWidth)
      // to bleed past the viewport edges, so the previous strict
      // Math.min(clientWidth, innerWidth) clamp would clip the bleed to
      // 100vw. The 1.2× cap still catches the original failure mode (a
      // pre-settle desktop-sized clientWidth on a mobile viewport).
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
          width: `${cols * hexW + hexW * 0.5}px`,
          visibility: measured ? 'visible' : 'hidden',
        }}
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
