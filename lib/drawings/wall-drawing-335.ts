import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing335: DrawingInstruction = {
  id: 'wall-drawing-335',
  title: 'Wall Drawing #335',
  description:
    'On four black walls, white vertical parallel lines, and in the center of the walls, eight geometric figures (including cross, X) within which are white horizontal parallel lines. The vertical lines do not enter the figures.',
  year: 1980,
  medium: 'White crayon on black wall',
  backgroundColor: '#0e0e0e',
  steps: [
    {
      type: 'walls-with-figures',
      params: {
        lineColor: '#f4f1ea',
        bgLineCount: 60,
        bgStrokeWidth: { min: 0.7, max: 1.4 },
        bgOpacity: { min: 0.6, max: 0.9 },
        bgSpacingJitter: 0.7,
        figureSpacingJitter: 0.45,
        figures: ['square', 'circle', 'triangle', 'cross', 'x', 'diamond', 'hexagon', 'trapezoid'],
        cols: 4,
        rows: 2,
        figureSizeFrac: 0.22,
        figureGapFrac: 0.45,
        figureLineDensity: 9,
        outlineWidth: 1.4,
      },
    },
  ],
}
