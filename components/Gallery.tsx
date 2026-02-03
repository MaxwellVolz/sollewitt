'use client'

import { useState } from 'react'
import { drawings } from '@/lib/drawings'
import { WallSection } from './WallSection'

export function Gallery() {
  const [seeds, setSeeds] = useState<Record<string, number>>(() =>
    Object.fromEntries(drawings.map((d) => [d.id, Math.floor(Math.random() * 100000)])),
  )

  const reroll = (id: string) => {
    setSeeds((prev) => ({ ...prev, [id]: Math.floor(Math.random() * 100000) }))
  }

  return (
    <>
      {drawings.map((drawing) => (
        <WallSection
          key={drawing.id}
          instruction={drawing}
          seed={seeds[drawing.id]}
          onReroll={() => reroll(drawing.id)}
        />
      ))}
    </>
  )
}
