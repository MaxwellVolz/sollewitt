import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing305: DrawingInstruction = {
  id: 'wall-drawing-305',
  title: 'Wall Drawing #305',
  description:
    'The location of one hundred random specific points. (Each point located by a written sentence describing it geometrically.)',
  year: 1977,
  medium: 'Black pencil',
  steps: [
    {
      type: 'labelled-points',
      params: {
        count: 100,
        color: '#1a1a1a',
        dotRadius: 2.5,
        labelSize: 9,
        margin: 0.06,
      },
    },
  ],
}
