import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing65: DrawingInstruction = {
  id: 'wall-drawing-65',
  title: 'Wall Drawing #65',
  description:
    'Lines not short, not straight, crossing and touching, drawn at random, using four colors, uniformly dispersed with maximum density, covering the entire surface of the wall.',
  year: 1971,
  medium: 'Red, yellow, blue, and black pencil',
  steps: [
    {
      type: 'random-wobbly',
      params: {
        colors: ['#c23b22', '#e8a735', '#2e5fa1', '#1a1a1a'],
        count: { min: 280, max: 380 },
        lengthRatio: { min: 0.18, max: 0.32 },
        wobble: { min: 0.012, max: 0.03 },
        segments: { min: 6, max: 12 },
        strokeWidth: { min: 0.5, max: 1.0 },
        opacity: { min: 0.55, max: 0.85 },
      },
    },
  ],
}
