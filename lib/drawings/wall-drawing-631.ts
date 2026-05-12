import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing631: DrawingInstruction = {
  id: 'wall-drawing-631',
  title: 'Wall Drawing #631',
  description:
    'A wall is divided into two equal parts by a line drawn from corner to corner. Left: alternating diagonal black and white 8-inch (20 cm) bands from the lower left. Right: alternating diagonal black and white 8-inch (20 cm) bands from the upper right.',
  year: 1989,
  medium: 'Black and white paint',
  steps: [
    {
      type: 'solid-bands',
      params: {
        direction: 'diagonal-right',
        bandThicknessFracRange: { min: 0.04, max: 0.09 },
        colors: ['#1a1a1a', '#faf8f4'],
        randomizeColorStart: true,
        // Lower-left triangle (TL → BL → BR), wound CW in screen coords.
        clipPolygon: [[0, 0], [0, 1], [1, 1]],
      },
    },
    {
      type: 'solid-bands',
      params: {
        direction: 'diagonal-left',
        colors: ['#1a1a1a', '#faf8f4'],
        randomizeColorStart: true,
        // Upper-right triangle (TL → BR → TR), wound CW in screen coords.
        clipPolygon: [[0, 0], [1, 1], [1, 0]],
      },
    },
  ],
}
