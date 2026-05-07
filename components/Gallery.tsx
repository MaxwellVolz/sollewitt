'use client'

import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { drawings } from '@/lib/drawings'
import { WallSection } from './WallSection'
import { HexGallery } from './HexGallery'

export function Gallery() {
  const [seeds, setSeeds] = useState<Record<string, number>>(() =>
    Object.fromEntries(drawings.map((d) => [d.id, Math.floor(Math.random() * 100000)])),
  )

  const reroll = (id: string) => {
    setSeeds((prev) => ({ ...prev, [id]: Math.floor(Math.random() * 100000) }))
  }

  return (
    <>
      <section className="about-section">
        <a
          href="https://intervolz.com/developing-sollewitt/"
          target="_blank"
          rel="noopener noreferrer"
          className="help-icon"
          aria-label="How this was built"
          title="how this was built"
        >
          <HelpCircle size={18} aria-hidden="true" />
        </a>
        <div className="about-content">
          <h2>About This Project</h2>
          <p>
            A generative tribute to Sol LeWitt&apos;s instruction-based wall drawings.
            Each piece is rendered algorithmically from LeWitt&apos;s original instructions,
            producing unique variations with every reload.
          </p>
          <div className="about-links">
            <a href="https://massmoca.org/sol-lewitt/" target="_blank" rel="noopener noreferrer">
              Visit the Sol LeWitt collection at MASS MoCA →
            </a>
          </div>
        </div>
        <HexGallery />
      </section>
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
