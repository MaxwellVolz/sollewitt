import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing16: DrawingInstruction = {
  id: 'wall-drawing-16',
  title: 'Wall Drawing #16',
  description:
    'Bands of lines 12 inches (30 cm) wide, in three directions (vertical, horizontal, diagonal right) intersecting.',
  year: 1969,
  medium: 'Black pencil',
  steps: [
    {
      type: 'bands',
      params: {
        bandWidth: 0.15,
        directions: ['vertical', 'horizontal', 'diagonal-right'],
        lineDensity: { min: 12, max: 24 },
        bandCount: { min: 2, max: 4 },
      },
    },
  ],
}
