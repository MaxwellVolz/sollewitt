import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing142: DrawingInstruction = {
  id: 'wall-drawing-142',
  title: 'Wall Drawing #142',
  description:
    'A 10-inch (25 cm) grid covering the wall. An increasing number of vertical not straight lines from the left side and horizontal not straight lines from bottom to top, adding one line per row of the grid. All lines are spaced evenly based on the number of lines, filling the last row of each direction.',
  year: 1972,
  medium: 'Black pencil',
  steps: [
    {
      type: 'progressive-wobbly-grid',
      params: {
        gridSize: 0.09,
        fillViewport: true,
        wobble: { min: 0.04, max: 0.08 },
        segmentsPerCell: { min: 4, max: 7 },
      },
    },
  ],
}
