'use client'

import { useState, useEffect } from 'react'
import { Play, Square, Dices, Download, Share } from 'lucide-react'

interface ControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  onReroll: () => void
  onDownload: () => void
}

export function Controls({ isPlaying, onPlay, onStop, onReroll, onDownload }: ControlsProps) {
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // Check if Web Share API with files is available (typically mobile)
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare)
  }, [])

  return (
    <div className="controls">
      {isPlaying ? (
        <button onClick={onStop} aria-label="Stop">
          <Square size={16} />
        </button>
      ) : (
        <button onClick={onPlay} aria-label="Play">
          <Play size={16} />
        </button>
      )}
      <button onClick={onReroll} aria-label="Re-roll">
        <Dices size={16} />
      </button>
      <button onClick={onDownload} aria-label={canShare ? 'Share' : 'Download'}>
        {canShare ? <Share size={16} /> : <Download size={16} />}
      </button>
    </div>
  )
}
