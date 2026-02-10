import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing138: DrawingInstruction = {
  id: 'wall-drawing-138',
  title: 'Wall Drawing #138',
  description: 'Circles and arcs from the midpoints of four sides.',
  year: 1972,
  medium: 'Black pencil',
  steps: [
    {
      type: 'midpoint-arcs',
      params: {
        arcCount: { min: 25, max: 65 },
        arcSpacing: 0.03,
      },
    },
  ],
}
