'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { DrawingInstruction } from '@/types/drawings'
import { DrawingCanvas, type DrawingCanvasHandle } from './DrawingCanvas'
import { Timeline } from './Timeline'
import { Controls } from './Controls'

interface WallSectionProps {
  instruction: DrawingInstruction
  seed: number
  onReroll: () => void
}

const PLAY_DURATION = 5000

export function WallSection({ instruction, seed, onReroll }: WallSectionProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [timelineProgress, setTimelineProgress] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const progressRef = useRef(0)
  const timelineBarRef = useRef<HTMLDivElement>(null)
  const canvasHandle = useRef<DrawingCanvasHandle>(null)

  const play = useCallback(() => {
    setIsPlaying(true)
    progressRef.current = 0
    setTimelineProgress(0)
    startRef.current = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startRef.current
      const t = Math.min(elapsed / PLAY_DURATION, 1)
      progressRef.current = t

      if (timelineBarRef.current) {
        const bar = timelineBarRef.current.firstElementChild as HTMLElement | null
        if (bar) bar.style.width = `${t * 100}%`
      }

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setTimelineProgress(1)
        setIsPlaying(false)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setTimelineProgress(progressRef.current)
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const handleSeek = useCallback((t: number) => {
    cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
    progressRef.current = t
    setTimelineProgress(t)
  }, [])

  const handleReroll = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    setIsPlaying(false)
    progressRef.current = 0
    setTimelineProgress(0)
    onReroll()
  }, [onReroll])

  const handleDownload = useCallback(async () => {
    const buffer = canvasHandle.current?.getCanvas()
    if (!buffer) return

    const filename = `${instruction.id}_${seed}.png`

    // Try Web Share API on mobile for better UX (native share sheet with "Save Image")
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await new Promise<Blob>((resolve) =>
          buffer.toBlob((b) => resolve(b!), 'image/png')
        )
        const file = new File([blob], filename, { type: 'image/png' })

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: instruction.title,
          })
          return
        }
      } catch (err) {
        // User cancelled or share failed - fall through to download
        if ((err as Error).name === 'AbortError') return
      }
    }

    // Fallback: direct download
    const link = document.createElement('a')
    link.download = filename
    link.href = buffer.toDataURL('image/png')
    link.click()
  }, [instruction.id, instruction.title, seed])

  return (
    <section className="wall-section" style={instruction.backgroundColor ? { backgroundColor: instruction.backgroundColor } : undefined}>
      <div className="instruction-header">
        <span className="instruction-label">
          {instruction.title} ({instruction.year})
        </span>
        <span className="instruction-subtitle">{instruction.description}</span>
      </div>
      <DrawingCanvas ref={canvasHandle} instruction={instruction} seed={seed} progressRef={progressRef} />
      <Controls isPlaying={isPlaying} onPlay={play} onStop={stop} onReroll={handleReroll} onDownload={handleDownload} />
      <Timeline ref={timelineBarRef} progress={timelineProgress} onSeek={handleSeek} />
    </section>
  )
}
