'use client'

import { useState, useEffect } from 'react'
import { Dices, Download, Share } from 'lucide-react'

interface ControlsProps {
  onReroll: () => void
  onDownload: () => void
}

export function Controls({ onReroll, onDownload }: ControlsProps) {
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share && !!navigator.canShare)
  }, [])

  return (
    <div className="controls">
      <button onClick={onReroll} aria-label="Re-draw">
        <Dices size={16} />
      </button>
      <button onClick={onDownload} aria-label={canShare ? 'Share' : 'Download'}>
        {canShare ? <Share size={16} /> : <Download size={16} />}
      </button>
    </div>
  )
}
