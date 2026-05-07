import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing335: DrawingInstruction = {
  id: 'wall-drawing-335',
  title: 'Wall Drawing #335',
  description: 'White vertical parallel lines on four black walls.',
  year: 1977,
  medium: 'White crayon on black wall',
  backgroundColor: '#0e0e0e',
  steps: [
    {
      type: 'parallel-lines',
      params: {
        direction: 'vertical',
        count: 60,
        color: '#f4f1ea',
        strokeWidth: { min: 0.7, max: 1.4 },
        opacity: { min: 0.6, max: 0.9 },
      },
    },
  ],
}
