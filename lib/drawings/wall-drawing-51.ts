import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing51: DrawingInstruction = {
  id: 'wall-drawing-51',
  title: 'Wall Drawing #51',
  description: 'All architectural points connected by straight lines.',
  year: 1970,
  medium: 'Blue snap lines',
  steps: [
    {
      type: 'architectural-points',
      params: {
        cornerPoints: true,
        midpointPoints: true,
        featurePointCount: { min: 4, max: 8 },
        color: '#2554c7',
        strokeWidth: { min: 0.4, max: 1.0 },
        opacity: { min: 0.55, max: 0.85 },
      },
    },
  ],
}
