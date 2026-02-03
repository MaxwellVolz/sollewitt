'use client'

import { Play, Square, Dices, Download } from 'lucide-react'

interface ControlsProps {
  isPlaying: boolean
  onPlay: () => void
  onStop: () => void
  onReroll: () => void
  onDownload: () => void
}

export function Controls({ isPlaying, onPlay, onStop, onReroll, onDownload }: ControlsProps) {
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
      <button onClick={onDownload} aria-label="Download">
        <Download size={16} />
      </button>
    </div>
  )
}
