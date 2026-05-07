# Sol LeWitt — Wall Drawing Instructions

A reference of the original instruction texts that drive the gallery. Each block is a faithful (or near-faithful) transcription of LeWitt's first-installation instructions; the engine in `lib/engine.ts` is the interpreter. New step types may be required to add a drawing — see `CLAUDE.md` for the workflow.

The four "kinds of lines" referenced throughout LeWitt's early work are: **vertical**, **horizontal**, **diagonal-left** (lower-left to upper-right), and **diagonal-right** (upper-left to lower-right).

---

## Implemented

### #11

A wall divided horizontally and vertically into four equal parts. Within each part, three of the four kinds of lines are superimposed.

May 1969 · Black pencil

### #16

Bands of lines 12 inches (30 cm) wide, in three directions (vertical, horizontal, diagonal right) intersecting.

September 1969 · Black pencil

### #17

Four-part drawing with a different line direction in each part.

September 1969 · Black pencil

### #19

A wall divided vertically into six equal parts, with two of the four kinds of line directions superimposed in each part.

September 1969 · Black pencil

### #38

Tissue paper cut into 1½-inch (4 cm) squares and inserted into holes in the gray pegboard walls. All holes in the walls are filled randomly.

April 1970 · Colored tissue papers, gray pegboard walls

### #46

Vertical lines, not straight, not touching, covering the wall evenly.

May 1970 · Black pencil

### #47

A wall divided into fifteen equal parts, each with a different line direction, and all combinations.

July 1970 · Black pencil

### #51

All architectural points connected by straight lines.

May 1970 · Blue snap lines

### #56

A square is divided horizontally and vertically into four equal parts, each with lines in four directions superimposed progressively.

October 1970 · Black pencil

### #65

Lines not short, not straight, crossing and touching, drawn at random, using four colors, uniformly dispersed with maximum density, covering the entire surface of the wall.

January 1971 · Red, yellow, blue, and black pencil

### #85

A wall is divided into four horizontal parts. In the top row are four equal divisions, each with lines in a different direction. In the second row, six double combinations; in the third row, four triple combinations; in the bottom row, all four combinations superimposed.

May 1971 · Black pencil

### #86

Ten thousand lines about 10 inches (25 cm) long, covering the wall evenly.

May 1971 · Black pencil

### #87

A square divided horizontally and vertically into four equal parts, each with lines and colors in four directions superimposed progressively.

June 1971 · Red, yellow, blue, and black crayon

### #88

A 6-inch (15 cm) grid covering the wall. Within each square, not straight lines in either of four directions. Only one direction in each square but as many as desired, and at least one line in each square.

June 1971 · Black pencil

### #95

On a wall divided vertically into fifteen equal parts, vertical lines, not straight, using four colors in all one-, two-, three-, and four-part combinations.

September 1971 · Red, yellow, blue, and black crayon

### #130

Grid and arcs from four corners.

July 1972 · Black pencil

### #138

Circles and arcs from the midpoints of four sides.

July 1972 · Black pencil

### #142

A 10-inch (25 cm) grid covering the wall. An increasing number of vertical not straight lines from the left side and horizontal not straight lines from bottom to top, adding one line per row of the grid. All lines are spaced evenly based on the number of lines, filling the last row of each direction.

August 1972 · Black pencil

### #273

A six-inch (15 cm) grid covering each of the four black walls. White lines to points on the grids. First wall: 24 lines from the center; second wall: 12 lines from the midpoint of each of the sides; third wall: 12 lines from each corner; fourth wall: 24 lines from the center, 12 lines from the midpoint of each of the sides, and 12 lines from each corner.

August 1975 · White crayon on black walls

### #289

A 6-inch (15 cm) grid covering the wall. White lines to specific points on the grid.

1976 · White crayon on black wall

### #154

A black outlined square with a red horizontal line from the midpoint of the left side toward the middle of the right side.

January 1973 · Black and red pencil

### #159

A black outlined square with a red diagonal line from the lower left corner toward the upper right corner; and another red line from the lower right corner to the upper left.

January 1973 · Black and red pencil

### #160

A black outlined square with a red diagonal line centered on the axis between the upper left and lower right corners and another red diagonal line centered on the axis between the lower left and upper right corners.

January 1973 · Black and red pencil

### #164

A black outlined square with a red horizontal line from the midpoint of the right side toward the middle of the left side.

January 1973 · Black and red pencil

### #335

White vertical parallel lines on four black walls.

1977 · White crayon on black wall

### #422

A wall divided vertically into fifteen equal parts, each with a different line direction and color, and all combinations.

1984 · Color ink wash

### #630

A wall divided horizontally into two parts. Each part with alternating black and white bands.

1989 · Black and white paint

### #631

A wall divided diagonally into two parts. Each part with alternating black and white bands.

1989 · Black and white paint

### #797

The first drafter has a black marker and makes an irregular horizontal line near the top of the wall. Then the second drafter tries to copy it (without touching it) using a red marker. The third drafter does the same, using a yellow marker. The fourth drafter does the same using a blue marker. Then the second drafter, followed by the third and fourth, copy the last line drawn until the bottom of the wall is reached.

1996 · Black, red, yellow, and blue marker

### #1180

Within a circle, draw 10,000 straight and not-straight lines.

2005 · Black pencil

---

## Candidates (not yet implemented)

These are authentic LeWitt instructions sourced from museum collections — included as a backlog of next-up implementations. Each will need a step type in `lib/engine.ts` (some can reuse existing types).

### #122

All combinations of two lines crossing, placed at random, using arcs from corners and sides, straight, not-straight, and broken lines.

October 1972 · Black pencil

> New step type: `pair-combinations`. Primitives needed: corner/side arcs, broken lines.

### #260

On black walls, all two-part combinations of white arcs from corners and sides, and white straight, not-straight, and broken lines.

July 1975 · White crayon on black walls

> Variant of #122 with black ground. `backgroundColor: '#000'` plus white strokes.

### #273

A six-inch (15 cm) grid covering each of the four black walls. White lines to points on the grids. First wall: 24 lines from the center; second wall: 12 lines from the midpoint of each of the sides; third wall: 12 lines from each corner; fourth wall: 24 lines from the center, 12 lines from the midpoint of each of the sides, and 12 lines from each corner.

August 1975 · White crayon on black walls

> Four-section panel; could be presented as a four-cell `divide` with a custom `lines-to-points` step.

### #305

The location of one hundred random specific points. (Each point located by a written sentence describing it geometrically.)

October 1976 · Black pencil

> Conceptual outlier — the wall becomes a labelled point cloud. Engine would need a text-rendering primitive.

---

## Notes on transcription

LeWitt's instructions were edited and re-issued multiple times across the catalogue raisonné. Phrasing here favors the form most commonly cited by museums (MoMA, MASS MoCA, Whitney, SFMOMA). When in doubt, the authoritative source is the *Sol LeWitt Wall Drawings Catalogue Raisonné* (Artifex Press, in collaboration with the LeWitt Estate).
