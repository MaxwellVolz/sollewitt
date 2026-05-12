import { DrawingInstruction } from '@/types/drawings'

export const wallDrawing305: DrawingInstruction = {
  id: 'wall-drawing-305',
  title: 'Wall Drawing #305',
  description:
    "The location of one hundred random specific points. Uses Sol LeWitt's vocabulary and geometric lexicon to guide the mapping of the points. This lexicon includes the corners, midpoints and center of each wall, which serve as reference points that are connected and traversed by lines and arcs. The one hundred points are specific in that they are created at the meeting of the junctures of these formal elements. As the draftsman maps out each generated point, he or she writes a description of how he or she arrived at that point next to it. This allows the viewers to trace the process of the placement of the points.",
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
