import { DrawingInstruction, StrokeElement, LineKind } from '@/types/drawings'

function seededRandom(seed: number) {
  let s = seed | 0
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randRange(rand: () => number, range: { min: number; max: number }): number {
  return range.min + rand() * (range.max - range.min)
}

function generateLinesForCell(
  kind: LineKind,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
): [number, number][][] {
  const lines: [number, number][][] = []
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    switch (kind) {
      case 'horizontal':
        lines.push([[x, y + t * h], [x + w, y + t * h]])
        break
      case 'vertical':
        lines.push([[x + t * w, y], [x + t * w, y + h]])
        break
      case 'diagonal-right': {
        // Parallel \ lines at 45°. Sweep offset k along the anti-diagonal.
        // In local coords: ly = lx + k, k ranges from -w to h.
        // Evenly space count lines across that range.
        const k = -w + (i + 0.5) / count * (w + h)
        const lx0 = Math.max(0, -k)
        const ly0 = Math.max(0, k)
        const lx1 = Math.min(w, h - k)
        const ly1 = Math.min(h, w + k)
        if (lx0 < lx1) {
          lines.push([[x + lx0, y + ly0], [x + lx1, y + ly1]])
        }
        break
      }
      case 'diagonal-left': {
        // Parallel / lines at 45°. Sweep offset k along the diagonal.
        // In local coords: ly = -lx + k, k ranges from 0 to w + h.
        const k = (i + 0.5) / count * (w + h)
        const lx0 = Math.max(0, k - h)
        const ly0 = Math.min(k, h)
        const lx1 = Math.min(w, k)
        const ly1 = Math.max(0, k - w)
        if (lx0 < lx1) {
          lines.push([[x + lx0, y + ly0], [x + lx1, y + ly1]])
        }
        break
      }
    }
  }
  return lines
}

function pushStroke(
  strokes: StrokeElement[],
  path: [number, number][],
  style: { color: string; width: number; opacity: number },
): void {
  const order = strokes.length
  strokes.push({ id: order, path, style, drawOrder: order })
}

// --- Step handlers ---

function handleDivideAndLines(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const divideStep = instruction.steps.find((s) => s.type === 'divide')
  const linesStep = instruction.steps.find((s) => s.type === 'lines')
  if (!divideStep || !linesStep) return

  const rows = (divideStep.params.rows as number) || 2
  const cols = (divideStep.params.cols as number) || 2
  const cellW = w / cols
  const cellH = h / rows

  const drawGrid = divideStep.params.drawGrid as boolean | undefined
  if (drawGrid) {
    const gridStyle = { color: '#222', width: 1.5, opacity: 0.8 }
    // Vertical dividers
    for (let c = 1; c < cols; c++) {
      pushStroke(strokes, [[c * cellW, 0], [c * cellW, h]], gridStyle)
    }
    // Horizontal dividers
    for (let r = 1; r < rows; r++) {
      pushStroke(strokes, [[0, r * cellH], [w, r * cellH]], gridStyle)
    }
  }

  const allKinds = (linesStep.params.lineKinds as LineKind[]) || []
  const colors = (linesStep.params.colors as string[] | undefined)
  const pick = (linesStep.params.pickPerCell as number) || 3
  const density = linesStep.params.density as { min: number; max: number }
  const unique = linesStep.params.unique as boolean | undefined
  const progressive = linesStep.params.progressive as boolean | undefined

  // For unique mode (#17), shuffle all kinds and assign one per cell without repeats
  // Shuffle indices to keep kinds and colors paired
  const indices = allKinds.map((_, i) => i)
  const shuffledIndices = unique || progressive ? shuffle(indices, rand) : null
  let cellIndex = 0

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let cellIndices: number[]
      if (progressive) {
        // Progressive mode (#56, #87): cell 0 gets 1 kind, cell 1 gets 2, etc.
        const numKinds = Math.min(cellIndex + 1, shuffledIndices!.length)
        cellIndices = shuffledIndices!.slice(0, numKinds)
        cellIndex++
      } else if (shuffledIndices) {
        cellIndices = [shuffledIndices[cellIndex % shuffledIndices.length]]
        cellIndex++
      } else {
        cellIndices = shuffle(indices, rand).slice(0, pick)
      }

      const x = c * cellW
      const y = r * cellH

      for (const idx of cellIndices) {
        const kind = allKinds[idx]
        const color = colors ? colors[idx % colors.length] : '#222'
        const count = Math.floor(randRange(rand, density))
        const lines = generateLinesForCell(kind, x, y, cellW, cellH, count)

        for (const path of lines) {
          pushStroke(strokes, path, {
            color,
            width: 0.5 + rand() * 1,
            opacity: colors ? 0.6 + rand() * 0.3 : 0.4 + rand() * 0.4,
          })
        }
      }
    }
  }
}

function handleBands(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'bands')
  if (!step) return

  const bandWidthRatio = (step.params.bandWidth as number) || 0.15
  const directions = (step.params.directions as LineKind[]) || []
  const lineDensity = step.params.lineDensity as { min: number; max: number }
  const bandCount = step.params.bandCount as { min: number; max: number }

  const bandW = bandWidthRatio * Math.min(w, h)

  for (const dir of directions) {
    const count = Math.floor(randRange(rand, bandCount))
    for (let b = 0; b < count; b++) {
      const linesInBand = Math.floor(randRange(rand, lineDensity))

      if (dir === 'vertical') {
        const cx = rand() * (w - bandW) + bandW / 2
        for (let i = 0; i < linesInBand; i++) {
          const lx = cx - bandW / 2 + (i + 0.5) / linesInBand * bandW
          pushStroke(strokes, [[lx, 0], [lx, h]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      } else if (dir === 'horizontal') {
        const cy = rand() * (h - bandW) + bandW / 2
        for (let i = 0; i < linesInBand; i++) {
          const ly = cy - bandW / 2 + (i + 0.5) / linesInBand * bandW
          pushStroke(strokes, [[0, ly], [w, ly]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      } else if (dir === 'diagonal-right') {
        const offset = rand() * (w + h) - h
        for (let i = 0; i < linesInBand; i++) {
          const d = (i + 0.5) / linesInBand * bandW - bandW / 2
          pushStroke(strokes, [[offset + d, 0], [offset + d + h, h]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      } else if (dir === 'diagonal-left') {
        const offset = rand() * (w + h) - h
        for (let i = 0; i < linesInBand; i++) {
          const d = (i + 0.5) / linesInBand * bandW - bandW / 2
          pushStroke(strokes, [[w - offset - d, 0], [w - offset - d - h, h]], {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.3 + rand() * 0.4,
          })
        }
      }
    }
  }
}

function handlePegboard(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'pegboard')
  if (!step) return

  const cellRatio = (step.params.cellSize as number) || 0.025
  const gapRatio = (step.params.gapRatio as number) || 0.2
  const colors = (step.params.colors as string[]) || ['#c23b22']

  const cellSize = cellRatio * Math.min(w, h)
  const gap = cellSize * gapRatio
  const squareSize = cellSize - gap

  const cols = Math.floor(w / cellSize)
  const rows = Math.floor(h / cellSize)

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize + gap / 2
      const y = r * cellSize + gap / 2
      const color = colors[Math.floor(rand() * colors.length)]

      // Represent each square as a small filled quad (4-point closed path)
      pushStroke(strokes, [
        [x, y],
        [x + squareSize, y],
        [x + squareSize, y + squareSize],
        [x, y + squareSize],
        [x, y],
      ], {
        color,
        width: squareSize,
        opacity: 0.85 + rand() * 0.15,
      })
    }
  }
}

function handleWobblyLines(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'wobbly-lines')
  if (!step) return

  const countRange = step.params.count as { min: number; max: number }
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segRange = step.params.segments as { min: number; max: number }

  const lineCount = Math.floor(randRange(rand, countRange))

  for (let i = 0; i < lineCount; i++) {
    const x = (i + 0.5) / lineCount * w
    const segments = Math.floor(randRange(rand, segRange))
    const wobble = randRange(rand, wobbleRange)
    const path: [number, number][] = []

    for (let s = 0; s <= segments; s++) {
      const t = s / segments
      const offsetX = (rand() - 0.5) * 2 * wobble
      path.push([x + offsetX, t * h])
    }

    pushStroke(strokes, path, {
      color: '#222',
      width: 0.5 + rand() * 1,
      opacity: 0.4 + rand() * 0.4,
    })
  }
}

function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  const withFirst = getCombinations(rest, k - 1).map((c) => [first, ...c])
  const withoutFirst = getCombinations(rest, k)
  return [...withFirst, ...withoutFirst]
}

function handleCombinatorial(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'combinatorial')
  if (!step) return

  const allKinds = (step.params.lineKinds as LineKind[]) || []
  const density = step.params.density as { min: number; max: number }

  // Generate all combinations: singles, pairs, triples, quadruple
  const singles = getCombinations(allKinds, 1) // 4 combinations
  const pairs = getCombinations(allKinds, 2) // 6 combinations
  const triples = getCombinations(allKinds, 3) // 4 combinations
  const quadruple = getCombinations(allKinds, 4) // 1 combination

  // Row layout: [4 cells, 6 cells, 4 cells, 1 cell]
  const rows = [
    { combinations: shuffle(singles, rand), cols: 4 },
    { combinations: shuffle(pairs, rand), cols: 6 },
    { combinations: shuffle(triples, rand), cols: 4 },
    { combinations: quadruple, cols: 1 },
  ]

  const totalRows = rows.length
  const rowHeight = h / totalRows

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]
    const y = r * rowHeight
    const cellW = w / row.cols

    for (let c = 0; c < row.cols; c++) {
      const x = c * cellW
      const cellKinds = row.combinations[c] || []

      for (const kind of cellKinds) {
        const count = Math.floor(randRange(rand, density))
        const lines = generateLinesForCell(kind, x, y, cellW, rowHeight, count)

        for (const path of lines) {
          pushStroke(strokes, path, {
            color: '#222',
            width: 0.5 + rand() * 1,
            opacity: 0.4 + rand() * 0.4,
          })
        }
      }
    }
  }
}

function handleScatteredLines(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'scattered-lines')
  if (!step) return

  const count = (step.params.count as number) || 1000
  const lengthRatio = (step.params.lengthRatio as number) || 0.08
  const angleVariation = (step.params.angleVariation as number) || Math.PI

  const lineLength = lengthRatio * Math.min(w, h)

  for (let i = 0; i < count; i++) {
    const cx = rand() * w
    const cy = rand() * h
    const angle = rand() * angleVariation * 2 - angleVariation

    const dx = Math.cos(angle) * lineLength / 2
    const dy = Math.sin(angle) * lineLength / 2

    pushStroke(strokes, [
      [cx - dx, cy - dy],
      [cx + dx, cy + dy],
    ], {
      color: '#222',
      width: 0.3 + rand() * 0.5,
      opacity: 0.3 + rand() * 0.4,
    })
  }
}

function handleGridWobbly(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'grid-wobbly')
  if (!step) return

  const cellRatio = (step.params.cellSize as number) || 0.08
  const lineKinds = (step.params.lineKinds as LineKind[]) || ['horizontal', 'vertical', 'diagonal-left', 'diagonal-right']
  const linesPerCell = step.params.linesPerCell as { min: number; max: number }
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segRange = step.params.segments as { min: number; max: number }
  const drawGrid = step.params.drawGrid as boolean | undefined

  const fillViewport = step.params.fillViewport as boolean | undefined
  let cellSize: number
  let cellW: number
  let cellH: number
  let cols: number
  let rows: number

  if (fillViewport) {
    const approxCell = cellRatio * Math.min(w, h)
    cols = Math.max(1, Math.round(w / approxCell))
    rows = Math.max(1, Math.round(h / approxCell))
    cellW = w / cols
    cellH = h / rows
    cellSize = Math.min(cellW, cellH)
  } else {
    cellSize = cellRatio * Math.min(w, h)
    cols = Math.floor(w / cellSize)
    rows = Math.floor(h / cellSize)
    cellW = cellSize
    cellH = cellSize
  }

  // Draw grid lines if requested
  if (drawGrid) {
    const gridStyle = { color: '#ccc', width: 0.5, opacity: 0.5 }
    for (let c = 0; c <= cols; c++) {
      pushStroke(strokes, [[c * cellW, 0], [c * cellW, rows * cellH]], gridStyle)
    }
    for (let r = 0; r <= rows; r++) {
      pushStroke(strokes, [[0, r * cellH], [cols * cellW, r * cellH]], gridStyle)
    }
  }

  // Generate wobbly lines for each cell
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW
      const y = r * cellH
      const kind = lineKinds[Math.floor(rand() * lineKinds.length)]
      const lineCount = Math.floor(randRange(rand, linesPerCell))

      for (let i = 0; i < lineCount; i++) {
        const t = (i + 0.5) / lineCount
        const segments = Math.floor(randRange(rand, segRange))
        const wobble = randRange(rand, wobbleRange) * cellSize
        const path: [number, number][] = []

        // Calculate line start/end points based on direction
        let x0: number, y0: number, x1: number, y1: number

        switch (kind) {
          case 'horizontal':
            x0 = 0; y0 = t * cellH
            x1 = cellW; y1 = t * cellH
            break
          case 'vertical':
            x0 = t * cellW; y0 = 0
            x1 = t * cellW; y1 = cellH
            break
          case 'diagonal-right': {
            // Parallel \ lines spread across the cell
            const k = -cellSize + t * 2 * cellSize
            x0 = Math.max(0, -k) * (cellW / cellSize)
            y0 = Math.max(0, k) * (cellH / cellSize)
            x1 = Math.min(cellSize, cellSize - k) * (cellW / cellSize)
            y1 = Math.min(cellSize, cellSize + k) * (cellH / cellSize)
            break
          }
          case 'diagonal-left': {
            // Parallel / lines spread across the cell
            const k = t * 2 * cellSize
            x0 = Math.max(0, k - cellSize) * (cellW / cellSize)
            y0 = Math.min(k, cellSize) * (cellH / cellSize)
            x1 = Math.min(cellSize, k) * (cellW / cellSize)
            y1 = Math.max(0, k - cellSize) * (cellH / cellSize)
            break
          }
        }

        // Generate wobbly path along the line
        for (let s = 0; s <= segments; s++) {
          const st = s / segments
          const wobbleOffset = (rand() - 0.5) * 2 * wobble

          // Interpolate along the line
          const lx = x0 + st * (x1 - x0)
          const ly = y0 + st * (y1 - y0)

          // Add perpendicular wobble
          const dx = x1 - x0
          const dy = y1 - y0
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const perpX = -dy / len
          const perpY = dx / len

          path.push([x + lx + perpX * wobbleOffset, y + ly + perpY * wobbleOffset])
        }

        if (path.length > 1) {
          pushStroke(strokes, path, {
            color: '#222',
            width: 0.5 + rand() * 0.8,
            opacity: 0.4 + rand() * 0.4,
          })
        }
      }
    }
  }
}

function handleCombinatorialWobbly(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'combinatorial-wobbly')
  if (!step) return

  const colors = (step.params.colors as string[]) || []
  const linesPerColor = step.params.linesPerColor as { min: number; max: number }
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segRange = step.params.segments as { min: number; max: number }

  // Generate all color combinations: singles, pairs, triples, all four
  const singles = getCombinations(colors, 1)
  const pairs = getCombinations(colors, 2)
  const triples = getCombinations(colors, 3)
  const quads = getCombinations(colors, 4)

  // Shuffle and combine all (4 + 6 + 4 + 1 = 15 combinations)
  const allCombinations = [
    ...shuffle(singles, rand),
    ...shuffle(pairs, rand),
    ...shuffle(triples, rand),
    ...quads,
  ]

  const cols = allCombinations.length
  const colWidth = w / cols

  for (let c = 0; c < cols; c++) {
    const x = c * colWidth
    const colorSet = allCombinations[c]

    // Draw wobbly vertical lines for each color in this combination
    for (const color of colorSet) {
      const lineCount = Math.floor(randRange(rand, linesPerColor))

      for (let i = 0; i < lineCount; i++) {
        const t = (i + 0.5) / lineCount
        const lineX = x + t * colWidth
        const segments = Math.floor(randRange(rand, segRange))
        const wobble = randRange(rand, wobbleRange) * w
        const path: [number, number][] = []

        for (let s = 0; s <= segments; s++) {
          const st = s / segments
          const wobbleOffset = (rand() - 0.5) * 2 * wobble
          path.push([lineX + wobbleOffset, st * h])
        }

        pushStroke(strokes, path, {
          color,
          width: 0.5 + rand() * 1,
          opacity: 0.5 + rand() * 0.4,
        })
      }
    }
  }
}

function handleGridAndArcs(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'grid-and-arcs')
  if (!step) return

  const gridRatio = (step.params.gridSize as number) || 0.05
  const arcCountRange = step.params.arcCount as { min: number; max: number }
  const arcSpacingRatio = (step.params.arcSpacing as number) || 0.03

  const gridSize = gridRatio * Math.min(w, h)
  const arcSpacing = arcSpacingRatio * Math.min(w, h)
  const arcCount = Math.floor(randRange(rand, arcCountRange))

  const gridStyle = { color: '#222', width: 0.5, opacity: 0.3 }

  // Draw grid
  const cols = Math.ceil(w / gridSize)
  const rows = Math.ceil(h / gridSize)

  for (let c = 0; c <= cols; c++) {
    pushStroke(strokes, [[c * gridSize, 0], [c * gridSize, h]], gridStyle)
  }
  for (let r = 0; r <= rows; r++) {
    pushStroke(strokes, [[0, r * gridSize], [w, r * gridSize]], gridStyle)
  }

  // Draw arcs from four corners
  const corners: { x: number; y: number; startAngle: number; endAngle: number }[] = [
    { x: 0, y: 0, startAngle: 0, endAngle: Math.PI / 2 },           // top-left
    { x: w, y: 0, startAngle: Math.PI / 2, endAngle: Math.PI },     // top-right
    { x: w, y: h, startAngle: Math.PI, endAngle: 3 * Math.PI / 2 }, // bottom-right
    { x: 0, y: h, startAngle: 3 * Math.PI / 2, endAngle: 2 * Math.PI }, // bottom-left
  ]

  const arcStyle = { color: '#222', width: 0.8, opacity: 0.5 }
  const segments = 32 // segments per arc for smoothness

  for (const corner of corners) {
    for (let i = 1; i <= arcCount; i++) {
      const radius = i * arcSpacing
      const path: [number, number][] = []

      for (let s = 0; s <= segments; s++) {
        const angle = corner.startAngle + (s / segments) * (corner.endAngle - corner.startAngle)
        const px = corner.x + Math.cos(angle) * radius
        const py = corner.y + Math.sin(angle) * radius
        path.push([px, py])
      }

      pushStroke(strokes, path, {
        ...arcStyle,
        width: 0.5 + rand() * 0.5,
        opacity: 0.4 + rand() * 0.3,
      })
    }
  }
}

function handleMidpointArcs(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'midpoint-arcs')
  if (!step) return

  const arcCountRange = step.params.arcCount as { min: number; max: number }
  const arcSpacingRatio = (step.params.arcSpacing as number) || 0.03

  const arcSpacing = arcSpacingRatio * Math.min(w, h)
  const arcCount = Math.floor(randRange(rand, arcCountRange))

  const arcStyle = { color: '#222', width: 0.8, opacity: 0.5 }
  const segments = 48

  // Midpoints of four sides with their sweep angles (into the canvas)
  const midpoints: { x: number; y: number; startAngle: number; endAngle: number }[] = [
    { x: w / 2, y: 0, startAngle: 0, endAngle: Math.PI },                   // top — sweeps down
    { x: w, y: h / 2, startAngle: Math.PI / 2, endAngle: 3 * Math.PI / 2 }, // right — sweeps left
    { x: w / 2, y: h, startAngle: Math.PI, endAngle: 2 * Math.PI },         // bottom — sweeps up
    { x: 0, y: h / 2, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },    // left — sweeps right
  ]

  for (const mp of midpoints) {
    for (let i = 1; i <= arcCount; i++) {
      const radius = i * arcSpacing
      const path: [number, number][] = []

      for (let s = 0; s <= segments; s++) {
        const angle = mp.startAngle + (s / segments) * (mp.endAngle - mp.startAngle)
        const px = mp.x + Math.cos(angle) * radius
        const py = mp.y + Math.sin(angle) * radius
        path.push([px, py])
      }

      pushStroke(strokes, path, {
        ...arcStyle,
        width: 0.5 + rand() * 0.5,
        opacity: 0.4 + rand() * 0.3,
      })
    }
  }
}

function handleProgressiveWobblyGrid(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'progressive-wobbly-grid')
  if (!step) return

  const gridRatio = (step.params.gridSize as number) || 0.09
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segPerCellRange = step.params.segmentsPerCell as { min: number; max: number }

  const fillViewport = step.params.fillViewport as boolean | undefined
  let gridW: number
  let gridH: number
  let cols: number
  let rows: number

  if (fillViewport) {
    const approxGrid = gridRatio * Math.min(w, h)
    cols = Math.max(1, Math.round(w / approxGrid))
    rows = Math.max(1, Math.round(h / approxGrid))
    gridW = w / cols
    gridH = h / rows
  } else {
    const gridSize = gridRatio * Math.min(w, h)
    cols = Math.floor(w / gridSize)
    rows = Math.floor(h / gridSize)
    gridW = gridSize
    gridH = gridSize
  }

  const totalW = cols * gridW
  const totalH = rows * gridH

  // Draw grid
  const gridStyle = { color: '#222', width: 0.5, opacity: 0.3 }
  for (let c = 0; c <= cols; c++) {
    pushStroke(strokes, [[c * gridW, 0], [c * gridW, totalH]], gridStyle)
  }
  for (let r = 0; r <= rows; r++) {
    pushStroke(strokes, [[0, r * gridH], [totalW, r * gridH]], gridStyle)
  }

  const lineStyle = { color: '#222', width: 0.5, opacity: 0.5 }

  // Vertical wobbly lines — column c (0-indexed from left) has (c+1) lines
  for (let c = 0; c < cols; c++) {
    const lineCount = c + 1
    const colX = c * gridW

    for (let i = 0; i < lineCount; i++) {
      const t = (i + 0.5) / lineCount
      const x = colX + t * gridW
      const segments = rows * Math.floor(randRange(rand, segPerCellRange))
      const wobble = randRange(rand, wobbleRange) * gridW
      const path: [number, number][] = []

      for (let s = 0; s <= segments; s++) {
        const st = s / segments
        const offsetX = (rand() - 0.5) * 2 * wobble
        path.push([x + offsetX, st * totalH])
      }

      pushStroke(strokes, path, {
        ...lineStyle,
        width: 0.5 + rand() * 0.8,
        opacity: 0.4 + rand() * 0.4,
      })
    }
  }

  // Horizontal wobbly lines — drawn from bottom to top
  // In canvas coords, row 0 is top, row (rows-1) is bottom
  // Bottom row gets 1 line, top row gets `rows` lines
  for (let r = rows - 1; r >= 0; r--) {
    const lineCount = rows - r // top row = rows lines, bottom row = 1 line
    const rowY = r * gridH

    for (let i = lineCount - 1; i >= 0; i--) {
      const t = (i + 0.5) / lineCount
      const y = rowY + t * gridH
      const segments = cols * Math.floor(randRange(rand, segPerCellRange))
      const wobble = randRange(rand, wobbleRange) * gridH
      const path: [number, number][] = []

      for (let s = 0; s <= segments; s++) {
        const st = s / segments
        const offsetY = (rand() - 0.5) * 2 * wobble
        path.push([st * totalW, y + offsetY])
      }

      pushStroke(strokes, path, {
        ...lineStyle,
        width: 0.5 + rand() * 0.8,
        opacity: 0.4 + rand() * 0.4,
      })
    }
  }
}

function resolveRange(rand: () => number, value: unknown): number {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'min' in value && 'max' in value) {
    return randRange(rand, value as { min: number; max: number })
  }
  return 0
}

function handleSquareAndLine(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'square-and-line')
  if (!step) return

  const squareColor = (step.params.squareColor as string) || '#222'
  const squareWidth = resolveRange(rand, step.params.squareWidth) || 2
  const squareOpacity = resolveRange(rand, step.params.squareOpacity) || 1
  const lines = (step.params.lines as { from: [unknown, unknown]; to: [unknown, unknown]; color: string; width: unknown; opacity?: unknown; length?: unknown; centered?: boolean }[]) || []

  // Center a square that fits within the canvas with some margin
  const margin = 0.1 * Math.min(w, h)
  const size = Math.min(w, h) - margin * 2
  const ox = (w - size) / 2
  const oy = (h - size) / 2

  // Draw square outline as 4 edges
  const sq = { color: squareColor, width: squareWidth, opacity: squareOpacity }
  pushStroke(strokes, [[ox, oy], [ox + size, oy]], sq)                       // top
  pushStroke(strokes, [[ox + size, oy], [ox + size, oy + size]], sq)         // right
  pushStroke(strokes, [[ox + size, oy + size], [ox, oy + size]], sq)         // bottom
  pushStroke(strokes, [[ox, oy + size], [ox, oy]], sq)                       // left

  // Draw lines (coordinates are normalized 0-1 relative to the square, support ranges)
  for (const line of lines) {
    let startX: number, startY: number, endX: number, endY: number
    const fX = resolveRange(rand, line.from[0])
    const fY = resolveRange(rand, line.from[1])
    const tX = resolveRange(rand, line.to[0])
    const tY = resolveRange(rand, line.to[1])

    if (line.length !== undefined) {
      const t = resolveRange(rand, line.length)
      if (line.centered) {
        // Line segment centered on the midpoint of from→to
        const midX = (fX + tX) / 2
        const midY = (fY + tY) / 2
        const dx = (tX - fX) / 2
        const dy = (tY - fY) / 2
        startX = midX - t * dx
        startY = midY - t * dy
        endX = midX + t * dx
        endY = midY + t * dy
      } else {
        // Interpolate from→to, preserving exact angle
        startX = fX
        startY = fY
        endX = fX + t * (tX - fX)
        endY = fY + t * (tY - fY)
      }
    } else {
      startX = fX
      startY = fY
      endX = tX
      endY = tY
    }

    pushStroke(strokes, [
      [ox + startX * size, oy + startY * size],
      [ox + endX * size, oy + endY * size],
    ], {
      color: line.color || '#c23b22',
      width: resolveRange(rand, line.width) || 2,
      opacity: resolveRange(rand, line.opacity) || 1,
    })
  }
}

function handleArchitecturalPoints(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'architectural-points')
  if (!step) return

  const includeCorners = (step.params.cornerPoints as boolean | undefined) ?? true
  const includeMidpoints = (step.params.midpointPoints as boolean | undefined) ?? true
  const featurePointCount = step.params.featurePointCount as { min: number; max: number } | undefined
  const color = (step.params.color as string) || '#2554c7'
  const strokeWidthRange = step.params.strokeWidth as { min: number; max: number } | undefined
  const opacityRange = step.params.opacity as { min: number; max: number } | undefined

  const points: [number, number][] = []

  if (includeCorners) {
    points.push([0, 0], [w, 0], [w, h], [0, h])
  }

  if (includeMidpoints) {
    points.push([w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2])
  }

  if (featurePointCount) {
    const n = Math.round(randRange(rand, featurePointCount))
    for (let i = 0; i < n; i++) {
      // Place each feature point on a random edge at a random position along it.
      const edge = Math.floor(rand() * 4)
      const t = rand()
      switch (edge) {
        case 0: points.push([t * w, 0]); break        // top
        case 1: points.push([w, t * h]); break        // right
        case 2: points.push([t * w, h]); break        // bottom
        case 3: points.push([0, t * h]); break        // left
      }
    }
  }

  // Connect every pair of points with a straight line.
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const width = strokeWidthRange ? randRange(rand, strokeWidthRange) : 0.6
      const opacity = opacityRange ? randRange(rand, opacityRange) : 0.7
      pushStroke(strokes, [points[i], points[j]], { color, width, opacity })
    }
  }
}

// --- Main entry ---

export function generateStrokes(
  instruction: DrawingInstruction,
  seed: number,
  canvasWidth: number,
  canvasHeight: number,
): StrokeElement[] {
  const rand = seededRandom(seed)
  const strokes: StrokeElement[] = []

  const stepTypes = new Set(instruction.steps.map((s) => s.type))

  if (stepTypes.has('divide') && stepTypes.has('lines')) {
    handleDivideAndLines(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('bands')) {
    handleBands(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('pegboard')) {
    handlePegboard(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('wobbly-lines')) {
    handleWobblyLines(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('combinatorial')) {
    handleCombinatorial(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('scattered-lines')) {
    handleScatteredLines(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('grid-wobbly')) {
    handleGridWobbly(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('combinatorial-wobbly')) {
    handleCombinatorialWobbly(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('grid-and-arcs')) {
    handleGridAndArcs(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('midpoint-arcs')) {
    handleMidpointArcs(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('progressive-wobbly-grid')) {
    handleProgressiveWobblyGrid(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('square-and-line')) {
    handleSquareAndLine(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('architectural-points')) {
    handleArchitecturalPoints(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  return strokes
}
