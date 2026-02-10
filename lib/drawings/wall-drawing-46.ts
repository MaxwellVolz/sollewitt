import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing46: DrawingInstruction = {
  id: 'wall-drawing-46',
  title: 'Wall Drawing #46',
  description: 'Vertical lines, not straight, not touching, covering the wall evenly.',
  year: 1970,
  medium: 'Black pencil',
  steps: [
    {
      type: 'wobbly-lines',
      params: {
        direction: 'vertical',
        count: { min: 30, max: 50 },
        wobble: { min: 3, max: 5 },
        segments: { min: 15, max: 30 },
        strokeWidth: { min: 0.5, max: 1.5 },
      },
    },
  ],
}
