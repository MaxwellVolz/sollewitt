import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing86: DrawingInstruction = {
  id: 'wall-drawing-86',
  title: 'Wall Drawing #86',
  description: 'Ten thousand lines about 10 inches (25 cm) long, covering the wall evenly.',
  year: 1971,
  medium: 'Black pencil',
  steps: [
    {
      type: 'scattered-lines',
      params: {
        count: 10000,
        lengthRatio: 0.08, // ~10 inches relative to wall
        angleVariation: Math.PI, // full rotation
      },
    },
  ],
}
