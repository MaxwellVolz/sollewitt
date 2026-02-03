'use client'

import { forwardRef, useCallback, useRef } from 'react'

interface TimelineProps {
  progress: number
  onSeek: (t: number) => void
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  function Timeline({ progress, onSeek }, ref) {
    const internalRef = useRef<HTMLDivElement>(null)
    const barRef = (ref as React.RefObject<HTMLDivElement | null>) || internalRef

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        const bar = barRef.current
        if (!bar) return
        const rect = bar.getBoundingClientRect()
        const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
        onSeek(t)
      },
      [onSeek, barRef],
    )

    return (
      <div ref={barRef} className="timeline" onClick={handleClick}>
        <div className="timeline-progress" style={{ width: `${progress * 100}%` }} />
      </div>
    )
  },
)
