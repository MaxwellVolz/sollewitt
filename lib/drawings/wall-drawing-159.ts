import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing159: DrawingInstruction = {
  id: 'wall-drawing-159',
  title: 'Wall Drawing #159',
  description:
    'A black outlined square with a red diagonal line from the lower left corner toward the upper right corner; and another red line from the lower right corner to the upper left.',
  year: 1973,
  medium: 'Black and red pencil',
  steps: [
    {
      type: 'square-and-line',
      params: {
        squareColor: '#222',
        squareWidth: { min: 10, max: 25 },
        squareOpacity: { min: 0.85, max: 1 },
        lines: [
          { from: [0, 1], to: [1, 0], length: { min: 0.3, max: 1 }, color: '#c23b22', width: { min: 10, max: 25 }, opacity: { min: 0.85, max: 1 } },
          { from: [1, 1], to: [0, 0], length: { min: 0.3, max: 1 }, color: '#c23b22', width: { min: 10, max: 25 }, opacity: { min: 0.85, max: 1 } },
        ],
      },
    },
  ],
}
