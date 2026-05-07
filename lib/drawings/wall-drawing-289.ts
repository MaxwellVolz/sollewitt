import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing289: DrawingInstruction = {
  id: 'wall-drawing-289',
  title: 'Wall Drawing #289',
  description:
    'A 6-inch (15 cm) grid covering the wall. White lines to specific points on the grid.',
  year: 1976,
  medium: 'White crayon on black wall',
  backgroundColor: '#0e0e0e',
  steps: [
    {
      type: 'lines-to-grid-points',
      params: {
        gridSize: 0.045,
        panels: [
          { anchors: ['center', 'side-midpoints', 'corners'], linesPerAnchor: 14 },
        ],
        color: '#f4f1ea',
        drawGrid: true,
        lineOpacity: 0.6,
        lineWidth: 0.6,
      },
    },
  ],
}
