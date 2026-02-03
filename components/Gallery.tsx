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
      <footer className="about-section">
        <div className="about-content">
          <h2>About This Project</h2>
          <p>
            A generative tribute to Sol LeWitt&apos;s instruction-based wall drawings.
            Each piece is rendered algorithmically from LeWitt&apos;s original instructions,
            producing unique variations with every reload.
          </p>
          <a href="https://intervolz.com/developing-sollewitt/" target="_blank" rel="noopener noreferrer">
            Read about how this was built →
          </a>
        </div>
      </footer>
    </>
  )
}
