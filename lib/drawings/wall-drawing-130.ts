import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing130: DrawingInstruction = {
  id: 'wall-drawing-130',
  title: 'Wall Drawing #130',
  description: 'Grid and arcs from four corners.',
  year: 1972,
  medium: 'Black pencil',
  steps: [
    {
      type: 'grid-and-arcs',
      params: {
        gridSize: 0.05,
        arcCount: { min: 25, max: 65 },
        arcSpacing: 0.03,
      },
    },
  ],
}
