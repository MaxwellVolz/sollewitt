import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing154: DrawingInstruction = {
  id: 'wall-drawing-154',
  title: 'Wall Drawing #154',
  description:
    'A black outlined square with a red horizontal line from the midpoint of the left side toward the middle of the right side.',
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
          { from: [0, 0.5], to: [{ min: 0.1, max: 1 }, 0.5], color: '#c23b22', width: { min: 10, max: 25 }, opacity: { min: 0.85, max: 1 } },
        ],
      },
    },
  ],
}
