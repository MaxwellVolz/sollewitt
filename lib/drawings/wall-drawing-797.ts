import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing797: DrawingInstruction = {
  id: 'wall-drawing-797',
  title: 'Wall Drawing #797',
  description:
    'The first drafter has a black marker and makes an irregular horizontal line near the top of the wall. Then the second drafter tries to copy it (without touching it) using a red marker. The third drafter does the same, using a yellow marker. The fourth drafter does the same using a blue marker. Then the second drafter, followed by the third and fourth, copy the last line drawn until the bottom of the wall is reached.',
  year: 1996,
  medium: 'Black, red, yellow, and blue marker',
  steps: [
    {
      type: 'imitative-bands',
      params: {
        colors: ['#1a1a1a', '#c23b22', '#e8a735', '#2554c7'],
        startY: 0.045,
        verticalStep: 0.017,
        initialWobble: 0.035,
        driftAmount: 0.004,
        segmentsPerLine: 80,
        strokeWidth: { min: 1.4, max: 2.2 },
        opacity: { min: 0.85, max: 1.0 },
      },
    },
  ],
}
