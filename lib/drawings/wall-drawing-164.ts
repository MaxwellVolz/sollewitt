import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing164: DrawingInstruction = {
  id: 'wall-drawing-164',
  title: 'Wall Drawing #164',
  description:
    'A black outlined square with a red horizontal line from the midpoint of the right side toward the middle of the left side.',
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
          { from: [1, 0.5], to: [{ min: 0, max: 0.9 }, 0.5], color: '#c23b22', width: { min: 10, max: 25 }, opacity: { min: 0.85, max: 1 } },
        ],
      },
    },
  ],
}
