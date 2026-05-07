import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing1180: DrawingInstruction = {
  id: 'wall-drawing-1180',
  title: 'Wall Drawing #1180',
  description:
    'Within a circle, draw 10,000 straight and not-straight lines.',
  year: 2005,
  medium: 'Black pencil',
  steps: [
    {
      type: 'circle-scatter',
      params: {
        count: 10000,
        straightRatio: 0.5,
        circleFraction: 0.86,
        lengthRatio: { min: 0.04, max: 0.11 },
        wobble: { min: 0.004, max: 0.012 },
        segments: { min: 4, max: 9 },
        strokeWidth: { min: 0.35, max: 0.8 },
        opacity: { min: 0.35, max: 0.7 },
        color: '#222',
        drawBoundary: true,
      },
    },
  ],
}
