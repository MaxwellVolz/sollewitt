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
  const [hasPlayed, setHasPlayed] = useState(false)
  const [showInstructions, setShowInstructions] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [timelineProgress, setTimelineProgress] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number>(0)
  const progressRef = useRef(0)
  const timelineBarRef = useRef<HTMLDivElement>(null)
  const canvasHandle = useRef<DrawingCanvasHandle>(null)

  const play = useCallback(() => {
    setIsPlaying(true)
    setHasPlayed(true)
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

  const handleCreate = useCallback(() => {
    setFadeOut(true)
    setTimeout(() => {
      setShowInstructions(false)
      setFadeOut(false)
      play()
    }, 400)
  }, [play])

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
    progressRef.current = 0
    setTimelineProgress(0)
    setHasPlayed(false)
    setShowInstructions(true)
    onReroll()
  }, [onReroll])

  const handleDownload = useCallback(async () => {
    const buffer = canvasHandle.current?.getCanvas()
    if (!buffer) return

    // Create a composite canvas with background + strokes
    const composite = document.createElement('canvas')
    composite.width = buffer.width
    composite.height = buffer.height
    const ctx = composite.getContext('2d')!

    // Fill background
    ctx.fillStyle = instruction.backgroundColor || '#ffffff'
    ctx.fillRect(0, 0, composite.width, composite.height)

    // Draw strokes on top
    ctx.drawImage(buffer, 0, 0)

    const filename = `${instruction.id}_${seed}.png`

    // Try Web Share API on mobile for better UX (native share sheet with "Save Image")
    if (navigator.share && navigator.canShare) {
      try {
        const blob = await new Promise<Blob>((resolve) =>
          composite.toBlob((b) => resolve(b!), 'image/png')
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
    link.href = composite.toDataURL('image/png')
    link.click()
  }, [instruction.backgroundColor, instruction.id, instruction.title, seed])

  const drawingDone = hasPlayed && !isPlaying

  return (
    <section className="wall-section" style={{ backgroundColor: instruction.backgroundColor || '#ffffff' }}>
      {showInstructions && (
        <div className={`instruction-header${fadeOut ? ' fade-out' : ''}`}>
          <span className="instruction-label">
            {instruction.title} ({instruction.year})
          </span>
          <span className="instruction-subtitle">{instruction.description}</span>
          <button className="create-button" onClick={handleCreate}>Create</button>
        </div>
      )}
      <DrawingCanvas ref={canvasHandle} instruction={instruction} seed={seed} progressRef={progressRef} />
      {drawingDone && (
        <Controls onReroll={handleReroll} onDownload={handleDownload} />
      )}
      <Timeline ref={timelineBarRef} progress={timelineProgress} onSeek={handleSeek} />
    </section>
  )
}
