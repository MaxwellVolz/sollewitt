import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing273: DrawingInstruction = {
  id: 'wall-drawing-273',
  title: 'Wall Drawing #273',
  description:
    'A six-inch (15 cm) grid covering each of the four black walls. White lines to points on the grids. First wall: 24 lines from the center; second wall: 12 lines from the midpoint of each of the sides; third wall: 12 lines from each corner; fourth wall: 24 lines from the center, 12 lines from the midpoint of each of the sides, and 12 lines from each corner.',
  year: 1975,
  medium: 'White crayon on black walls',
  backgroundColor: '#0e0e0e',
  steps: [
    {
      type: 'lines-to-grid-points',
      params: {
        gridSize: 0.08,
        panels: [
          { anchors: ['center'], linesPerAnchor: 24 },
          { anchors: ['side-midpoints'], linesPerAnchor: 12 },
          { anchors: ['corners'], linesPerAnchor: 12 },
          { anchors: ['center', 'side-midpoints', 'corners'], linesPerAnchor: 12 },
        ],
        color: '#f4f1ea',
        drawGrid: true,
        lineOpacity: 0.7,
        lineWidth: 0.55,
      },
    },
  ],
}
