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
  style: { color: string; width: number; opacity: number; mode?: 'stroke' | 'fill' | 'auto' },
): void {
  const order = strokes.length
  strokes.push({ id: order, path, style, drawOrder: order })
}

function pushText(
  strokes: StrokeElement[],
  position: [number, number],
  content: string,
  size: number,
  color: string,
  opacity: number,
  align: CanvasTextAlign = 'left',
): void {
  const order = strokes.length
  strokes.push({
    id: order,
    path: [position],
    style: { color, width: 0, opacity },
    drawOrder: order,
    text: { content, size, align },
  })
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
  const layout = (step.params.layout as 'rows' | 'strip') || 'rows'
  const colors = step.params.colors as string[] | undefined

  // Generate all combinations: singles, pairs, triples, quadruple
  const singles = getCombinations(allKinds, 1) // 4 combinations
  const pairs = getCombinations(allKinds, 2) // 6 combinations
  const triples = getCombinations(allKinds, 3) // 4 combinations
  const quadruple = getCombinations(allKinds, 4) // 1 combination

  if (layout === 'strip') {
    // Single horizontal strip of 15 vertical columns, one combination per
    // column. Used by #422 to lay out 4+6+4+1 = 15 unique combinations
    // across the wall left-to-right with optional per-column colors.
    const all = [...shuffle(singles, rand), ...shuffle(pairs, rand), ...shuffle(triples, rand), ...quadruple]
    const cellW = w / all.length
    for (let c = 0; c < all.length; c++) {
      const x = c * cellW
      const cellKinds = all[c]
      const colColor = colors ? colors[c % colors.length] : '#222'
      for (const kind of cellKinds) {
        const count = Math.floor(randRange(rand, density))
        const lines = generateLinesForCell(kind, x, 0, cellW, h, count)
        for (const path of lines) {
          pushStroke(strokes, path, {
            color: colColor,
            width: 0.5 + rand() * 1,
            opacity: 0.45 + rand() * 0.4,
          })
        }
      }
    }
    return
  }

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

function handleRandomWobbly(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'random-wobbly')
  if (!step) return

  const colors = (step.params.colors as string[]) || ['#222']
  const count = Math.floor(randRange(rand, step.params.count as { min: number; max: number }))
  const lengthRange = step.params.lengthRatio as { min: number; max: number }
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segRange = step.params.segments as { min: number; max: number }
  const widthRange = step.params.strokeWidth as { min: number; max: number }
  const opacityRange = step.params.opacity as { min: number; max: number }

  const minDim = Math.min(w, h)

  // Round-robin color assignment so each color is uniformly dispersed.
  // Build a shuffled index sequence to keep the four streams interleaved
  // visually rather than blocked by color.
  const order: number[] = []
  for (let i = 0; i < count; i++) order.push(i)
  shuffle(order, rand)

  for (let i = 0; i < count; i++) {
    const color = colors[order[i] % colors.length]
    const cx = rand() * w
    const cy = rand() * h
    const angle = rand() * Math.PI * 2
    const length = randRange(rand, lengthRange) * minDim
    const segments = Math.floor(randRange(rand, segRange))
    const wobbleAmount = randRange(rand, wobbleRange) * minDim

    const dx = Math.cos(angle)
    const dy = Math.sin(angle)
    // Perpendicular unit vector (rotated 90°)
    const px = -dy
    const py = dx

    const x0 = cx - dx * length / 2
    const y0 = cy - dy * length / 2

    const path: [number, number][] = []
    for (let s = 0; s <= segments; s++) {
      const t = s / segments
      const onLineX = x0 + dx * length * t
      const onLineY = y0 + dy * length * t
      // Endpoints stay anchored; only interior segments wobble.
      const wobble = (s === 0 || s === segments) ? 0 : (rand() - 0.5) * 2 * wobbleAmount
      path.push([onLineX + px * wobble, onLineY + py * wobble])
    }

    pushStroke(strokes, path, {
      color,
      width: randRange(rand, widthRange),
      opacity: randRange(rand, opacityRange),
    })
  }
}

function handleCircleScatter(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'circle-scatter')
  if (!step) return

  const count = (step.params.count as number) || 10000
  const straightRatio = (step.params.straightRatio as number) ?? 0.5
  const lengthRange = step.params.lengthRatio as { min: number; max: number }
  const wobbleRange = step.params.wobble as { min: number; max: number }
  const segRange = step.params.segments as { min: number; max: number }
  const widthRange = step.params.strokeWidth as { min: number; max: number }
  const opacityRange = step.params.opacity as { min: number; max: number }
  const color = (step.params.color as string) || '#222'
  const circleFraction = (step.params.circleFraction as number) ?? 0.85
  const drawBoundary = (step.params.drawBoundary as boolean | undefined) ?? true

  const cx0 = w / 2
  const cy0 = h / 2
  const radius = (Math.min(w, h) / 2) * circleFraction
  // Place each line's center inside an inner circle small enough that the
  // line endpoints are guaranteed to land inside the outer (visible) circle.
  const maxLength = lengthRange.max * radius * 2
  const innerRadius = Math.max(0, radius - maxLength / 2)

  if (drawBoundary) {
    // Approximate the boundary circle with a many-segment polyline.
    const segs = 96
    const path: [number, number][] = []
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2
      path.push([cx0 + radius * Math.cos(a), cy0 + radius * Math.sin(a)])
    }
    pushStroke(strokes, path, { color, width: 1.5, opacity: 0.85 })
  }

  for (let i = 0; i < count; i++) {
    // Sqrt-uniform polar sample → uniform area distribution inside circle.
    const r = Math.sqrt(rand()) * innerRadius
    const theta = rand() * Math.PI * 2
    const cx = cx0 + r * Math.cos(theta)
    const cy = cy0 + r * Math.sin(theta)

    const orient = rand() * Math.PI * 2
    const length = randRange(rand, lengthRange) * radius * 2
    const dx = Math.cos(orient)
    const dy = Math.sin(orient)
    const x0 = cx - dx * length / 2
    const y0 = cy - dy * length / 2

    const isStraight = rand() < straightRatio
    const path: [number, number][] = []

    if (isStraight) {
      path.push([x0, y0], [cx + dx * length / 2, cy + dy * length / 2])
    } else {
      const segments = Math.floor(randRange(rand, segRange))
      const wobbleAmount = randRange(rand, wobbleRange) * radius
      const px = -dy
      const py = dx
      for (let s = 0; s <= segments; s++) {
        const t = s / segments
        const onLineX = x0 + dx * length * t
        const onLineY = y0 + dy * length * t
        const wobble = (s === 0 || s === segments) ? 0 : (rand() - 0.5) * 2 * wobbleAmount
        path.push([onLineX + px * wobble, onLineY + py * wobble])
      }
    }

    pushStroke(strokes, path, {
      color,
      width: randRange(rand, widthRange),
      opacity: randRange(rand, opacityRange),
    })
  }
}

function handleImitativeBands(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'imitative-bands')
  if (!step) return

  const colors = (step.params.colors as string[]) || ['#1a1a1a', '#c23b22', '#e8a735', '#2554c7']
  const verticalStep = (step.params.verticalStep as number) ?? 0.018
  const initialWobble = (step.params.initialWobble as number) ?? 0.04
  const driftAmount = (step.params.driftAmount as number) ?? 0.0035
  const segmentsPerLine = (step.params.segmentsPerLine as number) ?? 80
  const widthRange = step.params.strokeWidth as { min: number; max: number }
  const opacityRange = step.params.opacity as { min: number; max: number }
  const startY = (step.params.startY as number) ?? 0.04

  const stepH = verticalStep * h
  const initialAmp = initialWobble * h
  const driftAmp = driftAmount * h
  const topY = startY * h

  // Generate the very first line (the "first drafter's" black mark) as a
  // multi-point path with random vertical jitter at each control point.
  let prevPath: [number, number][] = []
  for (let s = 0; s <= segmentsPerLine; s++) {
    const x = (s / segmentsPerLine) * w
    const y = topY + (rand() - 0.5) * 2 * initialAmp
    prevPath.push([x, y])
  }

  // Color rule from the instruction: first line is the seed color (black).
  // After that, drafters 2/3/4 (red/yellow/blue) take turns copying the
  // last line drawn — black is never used again.
  const colorAt = (i: number) => i === 0 ? colors[0] : colors[1 + ((i - 1) % Math.max(1, colors.length - 1))]

  // Emit the first line.
  pushStroke(strokes, prevPath, {
    color: colorAt(0),
    width: randRange(rand, widthRange),
    opacity: randRange(rand, opacityRange),
  })

  // Each subsequent line tries to copy its predecessor, shifted down one
  // step plus a per-control-point drift.
  let i = 1
  while (true) {
    const newPath: [number, number][] = []
    let maxY = 0
    for (let s = 0; s <= segmentsPerLine; s++) {
      const [px, py] = prevPath[s]
      const dy = stepH + (rand() - 0.5) * 2 * driftAmp
      const ny = py + dy
      newPath.push([px, ny])
      if (ny > maxY) maxY = ny
    }
    if (maxY > h - topY * 0.5) break  // hit the bottom of the wall

    pushStroke(strokes, newPath, {
      color: colorAt(i),
      width: randRange(rand, widthRange),
      opacity: randRange(rand, opacityRange),
    })

    prevPath = newPath
    i++
    if (i > 500) break  // hard safety cap
  }
}

function handleSolidBands(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  // Iterate every solid-bands step (instead of the first match) so a single
  // drawing can stack multiple regions — e.g. #630 has horizontal bands in
  // the top half and vertical bands in the bottom half.
  const allSteps = instruction.steps.filter((s) => s.type === 'solid-bands')
  if (allSteps.length === 0) return

  // Pick a single shared band thickness (in pixels) once per drawing when any
  // step opts in via bandThicknessFrac or bandThicknessFracRange. All steps
  // then use this same thickness, so #630's horizontal top bands and vertical
  // bottom bands have identical pixel widths — matching LeWitt's "8-inch
  // bands" rule that applies equally to both halves.
  let sharedBandPx: number | null = null
  for (const s of allSteps) {
    const range = s.params.bandThicknessFracRange as { min: number; max: number } | undefined
    if (range) {
      sharedBandPx = (range.min + rand() * (range.max - range.min)) * w
      break
    }
    const fixed = s.params.bandThicknessFrac as number | undefined
    if (fixed != null) {
      sharedBandPx = fixed * w
      break
    }
  }

  const emitRect = (path: [number, number][], color: string) => {
    pushStroke(strokes, path, { color, width: 0, opacity: 1 })
  }

  // Sutherland-Hodgman convex polygon clip. Used by `clipPolygon` to clip
  // each band's parallelogram/rect to a triangular (or other convex) wall
  // region — e.g. #631's two corner-to-corner triangular halves. Clip
  // polygon must be wound so its interior is on the right of each directed
  // edge (clockwise in screen coords with y down).
  const clipConvex = (subjectClosed: [number, number][], clip: [number, number][]): [number, number][] => {
    const isClosed = subjectClosed.length > 1
      && subjectClosed[0][0] === subjectClosed[subjectClosed.length - 1][0]
      && subjectClosed[0][1] === subjectClosed[subjectClosed.length - 1][1]
    let output: [number, number][] = isClosed ? subjectClosed.slice(0, -1) : subjectClosed.slice()

    const segIntersect = (p1: [number, number], p2: [number, number], q1: [number, number], q2: [number, number]): [number, number] => {
      const x1 = p1[0], y1 = p1[1], x2 = p2[0], y2 = p2[1]
      const x3 = q1[0], y3 = q1[1], x4 = q2[0], y4 = q2[1]
      const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
      if (denom === 0) return [p2[0], p2[1]]
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
      return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)]
    }

    for (let e = 0; e < clip.length; e++) {
      if (output.length === 0) break
      const cp1 = clip[e]
      const cp2 = clip[(e + 1) % clip.length]
      const input = output
      output = []
      let s = input[input.length - 1]
      for (const ep of input) {
        const cE = (cp2[0] - cp1[0]) * (ep[1] - cp1[1]) - (cp2[1] - cp1[1]) * (ep[0] - cp1[0])
        const cS = (cp2[0] - cp1[0]) * (s[1] - cp1[1]) - (cp2[1] - cp1[1]) * (s[0] - cp1[0])
        const insideE = cE <= 0
        const insideS = cS <= 0
        if (insideE) {
          if (!insideS) output.push(segIntersect(s, ep, cp1, cp2))
          output.push(ep)
        } else if (insideS) {
          output.push(segIntersect(s, ep, cp1, cp2))
        }
        s = ep
      }
    }

    if (output.length >= 3) output.push(output[0])
    return output
  }

  for (const step of allSteps) {
    const direction = (step.params.direction as 'horizontal' | 'vertical' | 'diagonal-right' | 'diagonal-left') || 'horizontal'
    const colors = (step.params.colors as string[]) || ['#1a1a1a', '#faf8f4']
    // LeWitt's instruction says "alternating" without specifying which color
    // leads. When this flag is set, flip the order based on the seed so each
    // region varies independently across rerolls.
    const orderedColors = step.params.randomizeColorStart && rand() < 0.5
      ? [...colors].reverse()
      : colors

    // Optional region: a sub-rectangle of the wall in relative coords
    // (0..1). Defaults to the full wall when absent.
    const region = (step.params.region as { x?: number; y?: number; w?: number; h?: number } | undefined) || {}
    const rx = (region.x ?? 0) * w
    const ry = (region.y ?? 0) * h
    const rw = (region.w ?? 1) * w
    const rh = (region.h ?? 1) * h

    // Optional convex clip polygon in relative wall coords (0..1). When set,
    // each band polygon is intersected with this shape. Used for non-rect
    // halves like the corner-to-corner triangles in #631.
    const clipPolyRel = step.params.clipPolygon as Array<[number, number]> | undefined
    const clipPoly: [number, number][] | null = clipPolyRel
      ? clipPolyRel.map(([px, py]) => [px * w, py * h] as [number, number])
      : null

    const emitBand = (rawPoly: [number, number][], color: string) => {
      if (!clipPoly) {
        emitRect(rawPoly, color)
        return
      }
      const clipped = clipConvex(rawPoly, clipPoly)
      if (clipped.length < 4) return
      emitRect(clipped, color)
    }

    // When no shared thickness is set, fall back to per-step bandCount as
    // before. Shared thickness mode derives the count from region extent so
    // every band renders at exactly sharedBandPx.
    const bandCountFallback = (step.params.bandCount as number) || 8

    if (direction === 'horizontal') {
      const bandH = sharedBandPx ?? (rh / bandCountFallback)
      const bandCount = sharedBandPx != null
        ? Math.max(1, Math.ceil(rh / bandH))
        : bandCountFallback
      for (let i = 0; i < bandCount; i++) {
        const y0 = ry + i * bandH
        if (y0 >= ry + rh) break
        const y1 = Math.min(ry + (i + 1) * bandH, ry + rh)
        const c = orderedColors[i % orderedColors.length]
        emitBand([[rx, y0], [rx + rw, y0], [rx + rw, y1], [rx, y1], [rx, y0]], c)
      }
    } else if (direction === 'vertical') {
      const bandW = sharedBandPx ?? (rw / bandCountFallback)
      const bandCount = sharedBandPx != null
        ? Math.max(1, Math.ceil(rw / bandW))
        : bandCountFallback
      for (let i = 0; i < bandCount; i++) {
        const x0 = rx + i * bandW
        if (x0 >= rx + rw) break
        const x1 = Math.min(rx + (i + 1) * bandW, rx + rw)
        const c = orderedColors[i % orderedColors.length]
        emitBand([[x0, ry], [x1, ry], [x1, ry + rh], [x0, ry + rh], [x0, ry]], c)
      }
    } else {
      // Diagonal bands: tile along the diagonal axis perpendicular to the
      // band direction. We emit each band as a parallelogram clipped to the
      // region rectangle. All math is in region-local coords [0..rw]×[0..rh],
      // then translated by (rx, ry) on emit.
      const sign = direction === 'diagonal-right' ? 1 : -1
      const totalSpan = rw + rh
      // For diagonal bands, sharedBandPx is measured perpendicular to the
      // band edges (diagonal at 45° in unit space). The u-axis spans rw + rh,
      // so a band of perpendicular thickness sharedBandPx corresponds to a
      // u-axis span of sharedBandPx * sqrt(2).
      const diagBandSpan = sharedBandPx != null ? sharedBandPx * Math.SQRT2 : null
      const bandSpan = diagBandSpan ?? (totalSpan / bandCountFallback)
      const bandCount = diagBandSpan != null
        ? Math.max(1, Math.ceil(totalSpan / bandSpan))
        : bandCountFallback
      for (let i = 0; i < bandCount; i++) {
        const c = orderedColors[i % orderedColors.length]
        const t0 = i * bandSpan
        const t1 = (i + 1) * bandSpan
        const ud = sign === 1
          ? (x: number, y: number) => x + y
          : (x: number, y: number) => (rw - x) + y
        const corners: [number, number][] = [[0, 0], [rw, 0], [rw, rh], [0, rh]]
        const edgeIntersections = (uTarget: number): [number, number][] => {
          const pts: [number, number][] = []
          for (let e = 0; e < 4; e++) {
            const [ax, ay] = corners[e]
            const [bx, by] = corners[(e + 1) % 4]
            const ua = ud(ax, ay)
            const ub = ud(bx, by)
            if ((ua - uTarget) * (ub - uTarget) <= 0 && ua !== ub) {
              const t = (uTarget - ua) / (ub - ua)
              pts.push([ax + t * (bx - ax), ay + t * (by - ay)])
            }
          }
          return pts
        }
        const lo = edgeIntersections(t0)
        const hi = edgeIntersections(t1)
        const insideCorners = corners.filter(([cx, cy]) => {
          const u = ud(cx, cy)
          return u > t0 && u < t1
        })
        const all = [...lo, ...insideCorners, ...hi]
        if (all.length < 3) continue
        const cx = all.reduce((s, p) => s + p[0], 0) / all.length
        const cy = all.reduce((s, p) => s + p[1], 0) / all.length
        all.sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx))
        const polyPoints: [number, number][] = all.map(([x, y]) => [x + rx, y + ry])
        polyPoints.push(polyPoints[0])
        emitBand(polyPoints, c)
      }
    }
  }
}

function handleParallelLines(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'parallel-lines')
  if (!step) return

  const direction = (step.params.direction as 'horizontal' | 'vertical') || 'vertical'
  const count = (step.params.count as number) || 30
  const color = (step.params.color as string) || '#faf8f4'
  const widthRange = step.params.strokeWidth as { min: number; max: number } | undefined
  const opacityRange = step.params.opacity as { min: number; max: number } | undefined

  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count
    const path: [number, number][] = direction === 'vertical'
      ? [[t * w, 0], [t * w, h]]
      : [[0, t * h], [w, t * h]]
    pushStroke(strokes, path, {
      color,
      width: widthRange ? randRange(rand, widthRange) : 1,
      opacity: opacityRange ? randRange(rand, opacityRange) : 0.9,
    })
  }
}

function handleLinesToGridPoints(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'lines-to-grid-points')
  if (!step) return

  type Panel = { anchors: ('center' | 'side-midpoints' | 'corners')[]; linesPerAnchor?: number }

  const gridSize = (step.params.gridSize as number) ?? 0.05
  const panels = (step.params.panels as Panel[]) || [{ anchors: ['center'], linesPerAnchor: 24 }]
  const color = (step.params.color as string) || '#faf8f4'
  const drawGrid = (step.params.drawGrid as boolean | undefined) ?? true
  const lineOpacity = (step.params.lineOpacity as number) ?? 0.7
  const lineWidth = (step.params.lineWidth as number) ?? 0.7
  const drawDividers = panels.length > 1

  const numPanels = panels.length
  const panelW = w / numPanels

  for (let p = 0; p < numPanels; p++) {
    const panel = panels[p]
    const px0 = p * panelW
    const pw = panelW
    const ph = h

    const cellSize = gridSize * Math.min(pw, ph)
    const cols = Math.max(2, Math.floor(pw / cellSize))
    const rows = Math.max(2, Math.floor(ph / cellSize))
    const stepX = pw / cols
    const stepY = ph / rows

    if (drawGrid) {
      for (let gx = 0; gx <= cols; gx++) {
        pushStroke(strokes, [[px0 + gx * stepX, 0], [px0 + gx * stepX, ph]], {
          color,
          width: 0.35,
          opacity: 0.2,
        })
      }
      for (let gy = 0; gy <= rows; gy++) {
        pushStroke(strokes, [[px0, gy * stepY], [px0 + pw, gy * stepY]], {
          color,
          width: 0.35,
          opacity: 0.2,
        })
      }
    }

    if (drawDividers && p > 0) {
      pushStroke(strokes, [[px0, 0], [px0, h]], {
        color,
        width: 1,
        opacity: 0.5,
      })
    }

    const gridPoints: [number, number][] = []
    for (let gy = 0; gy <= rows; gy++) {
      for (let gx = 0; gx <= cols; gx++) {
        gridPoints.push([px0 + gx * stepX, gy * stepY])
      }
    }

    const linesPerAnchor = panel.linesPerAnchor ?? 12
    for (const anchorType of panel.anchors) {
      const anchors: [number, number][] = []
      if (anchorType === 'center') {
        anchors.push([px0 + pw / 2, ph / 2])
      } else if (anchorType === 'side-midpoints') {
        anchors.push(
          [px0 + pw / 2, 0],
          [px0 + pw, ph / 2],
          [px0 + pw / 2, ph],
          [px0, ph / 2],
        )
      } else if (anchorType === 'corners') {
        anchors.push(
          [px0, 0],
          [px0 + pw, 0],
          [px0 + pw, ph],
          [px0, ph],
        )
      }

      for (const anchor of anchors) {
        const shuffled = shuffle([...gridPoints], rand)
        const n = Math.min(linesPerAnchor, shuffled.length)
        for (let i = 0; i < n; i++) {
          const target = shuffled[i]
          // Skip lines of zero length (anchor sits exactly on a grid point)
          if (target[0] === anchor[0] && target[1] === anchor[1]) continue
          pushStroke(strokes, [anchor, target], {
            color,
            width: lineWidth,
            opacity: lineOpacity,
          })
        }
      }
    }
  }
}

// --- Labelled shapes (#237, #238, #274, #295) ---

type ShapeKind = 'trapezoid' | 'parallelogram' | 'triangle' | 'rectangle' | 'rhombus' | 'pentagon' | 'hexagon' | 'square'

// Single-letter codes for construction-line labels (LeWitt #274 documentation
// mode). Each line on the wall reads as e.g. "R12" — rectangle, group 1, line 2.
const SHAPE_LETTERS: Record<ShapeKind, string> = {
  rectangle: 'R',
  triangle: 'T',
  trapezoid: 'Z',
  parallelogram: 'P',
  rhombus: 'M',
  pentagon: 'G',
  hexagon: 'H',
  square: 'S',
}

// LeWitt's geometric lexicon: each wall has nine reference points — four
// corners, four side midpoints, and the center. Construction lines are
// drawn between these.
function wallAnchors(w: number, h: number): [number, number][] {
  return [
    [0, 0], [w, 0], [w, h], [0, h],
    [w / 2, 0], [w, h / 2], [w / 2, h], [0, h / 2],
    [w / 2, h / 2],
  ]
}

// Build a construction line: pick a wall anchor, then draw the line from
// that anchor through the shape's center, extended to the far wall edge.
// Guarantees every construction line visually passes through the shape it
// helps locate.
function constructionLine(
  cx: number,
  cy: number,
  w: number,
  h: number,
  rand: () => number,
): [[number, number], [number, number]] {
  const anchors = wallAnchors(w, h)
  const a = anchors[Math.floor(rand() * anchors.length)]
  const dx = cx - a[0]
  const dy = cy - a[1]
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return [a, [cx, cy]]

  // Find the largest t such that (a.x + t·dx, a.y + t·dy) stays inside the
  // wall rectangle. Beyond t=1 we're past the shape's center and continuing
  // outward; we want to terminate at the far wall edge.
  const ts: number[] = []
  if (dx > 1e-9) ts.push((w - a[0]) / dx)
  else if (dx < -1e-9) ts.push(-a[0] / dx)
  if (dy > 1e-9) ts.push((h - a[1]) / dy)
  else if (dy < -1e-9) ts.push(-a[1] / dy)
  const tMax = ts.length ? Math.min(...ts) : 1
  return [a, [a[0] + tMax * dx, a[1] + tMax * dy]]
}

function generateShape(
  kind: ShapeKind,
  rand: () => number,
  cx: number,
  cy: number,
  size: number,
): [number, number][] {
  const points: [number, number][] = []
  const r = size / 2
  switch (kind) {
    case 'square':
      points.push([cx - r, cy - r], [cx + r, cy - r], [cx + r, cy + r], [cx - r, cy + r])
      break
    case 'rectangle': {
      const wf = r * (1 + rand() * 0.6)
      const hf = r * (0.5 + rand() * 0.5)
      points.push([cx - wf, cy - hf], [cx + wf, cy - hf], [cx + wf, cy + hf], [cx - wf, cy + hf])
      break
    }
    case 'trapezoid': {
      const top = r * (0.4 + rand() * 0.4)
      const bot = r * (0.9 + rand() * 0.2)
      const ht = r
      points.push([cx - top, cy - ht], [cx + top, cy - ht], [cx + bot, cy + ht], [cx - bot, cy + ht])
      break
    }
    case 'parallelogram': {
      const skew = r * (0.3 + rand() * 0.4)
      const wf = r * (0.9 + rand() * 0.2)
      points.push([cx - wf + skew, cy - r], [cx + wf + skew, cy - r], [cx + wf - skew, cy + r], [cx - wf - skew, cy + r])
      break
    }
    case 'triangle': {
      points.push([cx, cy - r], [cx + r * 0.95, cy + r * 0.6], [cx - r * 0.95, cy + r * 0.6])
      break
    }
    case 'rhombus':
      points.push([cx, cy - r], [cx + r * 0.7, cy], [cx, cy + r], [cx - r * 0.7, cy])
      break
    case 'pentagon':
    case 'hexagon': {
      const sides = kind === 'pentagon' ? 5 : 6
      const offset = kind === 'pentagon' ? -Math.PI / 2 : 0
      for (let i = 0; i < sides; i++) {
        const a = offset + (i / sides) * Math.PI * 2
        points.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
      }
      break
    }
  }
  // Close the polygon
  points.push(points[0])
  return points
}

function locationLabel(rand: () => number): string {
  const fragments = [
    'centered on the wall',
    'in the upper left quadrant',
    'in the upper right quadrant',
    'in the lower left quadrant',
    'in the lower right quadrant',
    'between the center and the upper edge',
    'between the center and the lower edge',
    'between the center and the left edge',
    'between the center and the right edge',
  ]
  return fragments[Math.floor(rand() * fragments.length)]
}

// Scanline hatch fill for a polygon. Returns line segments inside the polygon
// at the given angle (radians) and spacing. Uses the standard rotate-fill-
// unrotate trick: rotate polygon by -angle so scanlines are axis-aligned,
// emit horizontal segments between odd/even edge crossings, rotate back.
function hatchFillPolygon(
  poly: [number, number][],
  spacing: number,
  angle: number,
): [number, number][][] {
  // De-duplicate the closing point if present, otherwise the (last,first)
  // edge has zero length and contributes garbage to the crossings.
  const open = poly.length > 1 && poly[0][0] === poly[poly.length - 1][0] && poly[0][1] === poly[poly.length - 1][1]
    ? poly.slice(0, -1)
    : poly
  if (open.length < 3) return []

  const cosN = Math.cos(-angle)
  const sinN = Math.sin(-angle)
  const cosP = Math.cos(angle)
  const sinP = Math.sin(angle)
  const rotN = (p: [number, number]): [number, number] => [p[0] * cosN - p[1] * sinN, p[0] * sinN + p[1] * cosN]
  const rotP = (p: [number, number]): [number, number] => [p[0] * cosP - p[1] * sinP, p[0] * sinP + p[1] * cosP]

  const rotated = open.map(rotN)

  let minY = Infinity
  let maxY = -Infinity
  for (const p of rotated) {
    if (p[1] < minY) minY = p[1]
    if (p[1] > maxY) maxY = p[1]
  }

  const segments: [number, number][][] = []
  const startY = Math.ceil(minY / spacing) * spacing

  for (let y = startY; y <= maxY; y += spacing) {
    const xs: number[] = []
    for (let i = 0; i < rotated.length; i++) {
      const a = rotated[i]
      const b = rotated[(i + 1) % rotated.length]
      // Half-open scanline rule: vertex on the lower edge counts, upper does
      // not. Avoids double-counting at shared vertices.
      if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
        const t = (y - a[1]) / (b[1] - a[1])
        xs.push(a[0] + t * (b[0] - a[0]))
      }
    }
    xs.sort((p, q) => p - q)
    for (let i = 0; i + 1 < xs.length; i += 2) {
      segments.push([rotP([xs[i], y]), rotP([xs[i + 1], y])])
    }
  }
  return segments
}

function handleLabelledShapes(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'labelled-shapes')
  if (!step) return

  const kinds = (step.params.kinds as ShapeKind[]) || ['trapezoid']
  const showLabels = (step.params.showLabels as boolean | undefined) ?? true
  const color = (step.params.color as string) || '#222'
  const labelColor = (step.params.labelColor as string) || color
  const lineWidth = (step.params.lineWidth as number) ?? 1.6
  const labelSize = (step.params.labelSize as number) ?? 14
  // 'outline' (default) — closed polygon outline only (LeWitt #237/#238).
  // 'solid'   — filled polygon (no outline emphasis needed).
  // 'lines'   — outline + crayon-style hatch fill inside (LeWitt #274/#295).
  const fillStyle = (step.params.fillStyle as 'outline' | 'solid' | 'lines' | undefined) ?? 'outline'
  const fillColors = (step.params.fillColors as string[] | undefined) ?? [color]
  const hatchSpacing = (step.params.hatchSpacing as number | undefined) ?? Math.max(4, Math.min(w, h) / 90)
  const hatchAngles = (step.params.hatchAngles as number[] | undefined) ?? [Math.PI / 4]
  const hatchWidth = (step.params.hatchWidth as number | undefined) ?? 1.0
  const hatchOpacity = (step.params.hatchOpacity as number | undefined) ?? 0.85
  // Stack all shapes at the wall center, layered (LeWitt #295 superimposed).
  const superimposed = (step.params.superimposed as boolean | undefined) ?? false

  // Construction-line documentation mode (LeWitt #274). Every line on the
  // wall reads as e.g. "R12" — rectangle, group 1, line 2 — turning the
  // wall into its own wiring diagram.
  const showConstructionLines = (step.params.showConstructionLines as boolean | undefined) ?? false
  const constructionGroups = (step.params.constructionGroups as number | undefined) ?? 2
  const constructionLinesPerGroup = (step.params.constructionLinesPerGroup as number | undefined) ?? 2
  const constructionColor = (step.params.constructionColor as string | undefined) ?? '#7a7a7a'
  const constructionLabelColor = (step.params.constructionLabelColor as string | undefined) ?? '#444'
  const constructionLineWidth = (step.params.constructionLineWidth as number | undefined) ?? 0.5
  const constructionOpacity = (step.params.constructionOpacity as number | undefined) ?? 0.42
  const constructionLabelSize = (step.params.constructionLabelSize as number | undefined) ?? 10

  const count = kinds.length

  for (let i = 0; i < count; i++) {
    let cx: number
    let cy: number
    let shapeSize: number

    if (superimposed) {
      // All shapes share the wall center; size them so overlaps read.
      cx = w / 2
      cy = h / 2
      shapeSize = Math.min(w, h) * 0.7
    } else {
      const cols = count <= 1 ? 1 : count <= 4 ? 2 : 3
      const cellW = w / cols
      const cellH = h / Math.ceil(count / cols)
      const c = i % cols
      const r = Math.floor(i / cols)
      cx = c * cellW + cellW / 2
      cy = r * cellH + cellH / 2
      shapeSize = Math.min(cellW, cellH) * 0.55
    }

    const path = generateShape(kinds[i], rand, cx, cy, shapeSize)
    const fillColor = fillColors[i % fillColors.length]

    // Emit construction lines per shape FIRST so they sit underneath the
    // shape outline and hatch in paint order. Each line reads from a wall
    // anchor (corner / midpoint / center) through the shape's center to
    // the far wall edge, with a small alphanumeric label at one third
    // along its length.
    if (showConstructionLines) {
      const letter = SHAPE_LETTERS[kinds[i]] ?? 'X'
      for (let g = 1; g <= constructionGroups; g++) {
        for (let l = 1; l <= constructionLinesPerGroup; l++) {
          const [a, b] = constructionLine(cx, cy, w, h, rand)
          pushStroke(strokes, [a, b], {
            color: constructionColor,
            width: constructionLineWidth,
            opacity: constructionOpacity,
          })
          // Label at a randomized t along the line — staggered placements
          // keep adjacent labels from stacking on top of each other.
          const t = 0.18 + rand() * 0.55
          const lx = a[0] + (b[0] - a[0]) * t
          const ly = a[1] + (b[1] - a[1]) * t
          pushText(
            strokes,
            [lx, ly],
            `${letter}${g}${l}`,
            constructionLabelSize,
            constructionLabelColor,
            0.85,
            'center',
          )
        }
      }
    }

    if (fillStyle === 'lines') {
      // Outlined polygon (mode='stroke' overrides the auto-fill for closed
      // paths) plus hatched interior in the per-shape crayon color.
      pushStroke(strokes, path, { color, width: lineWidth, opacity: 0.9, mode: 'stroke' })
      for (const angle of hatchAngles) {
        const segs = hatchFillPolygon(path, hatchSpacing, angle)
        for (const seg of segs) {
          pushStroke(strokes, seg, { color: fillColor, width: hatchWidth, opacity: hatchOpacity })
        }
      }
    } else if (fillStyle === 'outline') {
      pushStroke(strokes, path, { color, width: lineWidth, opacity: 0.9, mode: 'stroke' })
    } else {
      pushStroke(strokes, path, { color, width: lineWidth, opacity: 0.9 })
    }

    if (showLabels) {
      pushText(
        strokes,
        [cx, cy + shapeSize / 2 + labelSize * 1.4],
        kinds[i].toUpperCase() + ' ' + locationLabel(rand),
        labelSize,
        labelColor,
        0.7,
        'center',
      )
    }
  }
}

function handleLabelledPoints(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'labelled-points')
  if (!step) return

  const count = (step.params.count as number) ?? 100
  const color = (step.params.color as string) || '#222'
  const dotRadius = (step.params.dotRadius as number) ?? 3
  const labelSize = (step.params.labelSize as number) ?? 9
  const margin = (step.params.margin as number) ?? 0.05

  // LeWitt's "geometric lexicon" for #305: nine reference points formed by
  // the four corners, four side midpoints, and center of the wall. Each
  // point in the drawing is constructed from these references via one of:
  //   - the reference itself                                        (9)
  //   - halfway between two distinct references                     (36)
  //   - 1/3 of the way from A toward B, ordered                     (72)
  //   - 1/4 of the way from A toward B, ordered                     (72)
  //   - halfway between A and the midpoint of two other refs        (252)
  // Total: 441 unique constructions. We shuffle, take `count` (100), and
  // place each label with a greedy collision-avoidance pass so neighbouring
  // labels can't visually overlap.
  type Ref = { rx: number; ry: number; name: string }
  const refs: Ref[] = [
    { rx: 0, ry: 0, name: 'top left corner' },
    { rx: 1, ry: 0, name: 'top right corner' },
    { rx: 0, ry: 1, name: 'bottom left corner' },
    { rx: 1, ry: 1, name: 'bottom right corner' },
    { rx: 0.5, ry: 0, name: 'midpoint of top side' },
    { rx: 0.5, ry: 1, name: 'midpoint of bottom side' },
    { rx: 0, ry: 0.5, name: 'midpoint of left side' },
    { rx: 1, ry: 0.5, name: 'midpoint of right side' },
    { rx: 0.5, ry: 0.5, name: 'center of wall' },
  ]

  type Construction = { rx: number; ry: number; name: string }
  const lex: Construction[] = []

  for (const r of refs) {
    lex.push({ rx: r.rx, ry: r.ry, name: `the ${r.name}` })
  }

  for (let i = 0; i < refs.length; i++) {
    for (let j = i + 1; j < refs.length; j++) {
      const a = refs[i]
      const b = refs[j]
      lex.push({
        rx: (a.rx + b.rx) / 2,
        ry: (a.ry + b.ry) / 2,
        name: `halfway between the ${a.name} and the ${b.name}`,
      })
    }
  }

  const fracs: Array<{ t: number; phrase: string }> = [
    { t: 1 / 3, phrase: 'one third' },
    { t: 1 / 4, phrase: 'one quarter' },
  ]
  for (const { t, phrase } of fracs) {
    for (let i = 0; i < refs.length; i++) {
      for (let j = 0; j < refs.length; j++) {
        if (i === j) continue
        const a = refs[i]
        const b = refs[j]
        lex.push({
          rx: a.rx * (1 - t) + b.rx * t,
          ry: a.ry * (1 - t) + b.ry * t,
          name: `${phrase} of the way from the ${a.name} toward the ${b.name}`,
        })
      }
    }
  }

  // Depth-2: halfway between an anchor and a midpoint of two other refs.
  //   point = (A + (B+C)/2) / 2
  for (let i = 0; i < refs.length; i++) {
    for (let j = 0; j < refs.length; j++) {
      if (j === i) continue
      for (let k = j + 1; k < refs.length; k++) {
        if (k === i) continue
        const A = refs[i]
        const B = refs[j]
        const C = refs[k]
        const mx = (B.rx + C.rx) / 2
        const my = (B.ry + C.ry) / 2
        lex.push({
          rx: (A.rx + mx) / 2,
          ry: (A.ry + my) / 2,
          name: `halfway between the ${A.name} and a point halfway between the ${B.name} and the ${C.name}`,
        })
      }
    }
  }

  // Fisher-Yates shuffle so the seed determines which subset we pick.
  for (let i = lex.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[lex[i], lex[j]] = [lex[j], lex[i]]
  }

  const picked = lex.slice(0, Math.min(count, lex.length))
  // Sort spatially so #1 is the top-left-most point and #100 is the bottom-
  // right-most. Sequential numbering follows reading order, which matches the
  // top-to-bottom timeline reveal and lets viewers trace the points easily.
  picked.sort((a, b) => a.ry - b.ry || a.rx - b.rx)

  const xMin = margin * w
  const yMin = margin * h
  const xRange = (1 - 2 * margin) * w
  const yRange = (1 - 2 * margin) * h

  type Box = { x0: number; y0: number; x1: number; y1: number }
  const charW = labelSize * 0.52
  const lineH = labelSize * 1.2
  const dotPad = dotRadius + 4

  // Pre-compute every dot position and prefix the description with its
  // spatial number ("#42 halfway between..."). Pre-computing every dot box
  // upfront lets each label avoid every dot — not just labels placed so far —
  // so a label can never end up drawn on top of an unrelated dot it would
  // otherwise meet later in the loop.
  type Point = { x: number; y: number; text: string; lw: number; dotBox: Box }
  const points: Point[] = picked.map((p, i) => {
    const x = xMin + p.rx * xRange
    const y = yMin + p.ry * yRange
    const text = `#${i + 1} ${p.name}`
    return {
      x,
      y,
      text,
      lw: text.length * charW,
      dotBox: {
        x0: x - dotRadius - 2,
        y0: y - dotRadius - 2,
        x1: x + dotRadius + 2,
        y1: y + dotRadius + 2,
      },
    }
  })

  // occupied seeds with every dot box, then accumulates label boxes as we
  // place them. Labels avoid both.
  const occupied: Box[] = points.map((pp) => pp.dotBox)

  for (const pp of points) {
    pushStroke(strokes, [
      [pp.x - dotRadius, pp.y - dotRadius],
      [pp.x + dotRadius, pp.y - dotRadius],
      [pp.x + dotRadius, pp.y + dotRadius],
      [pp.x - dotRadius, pp.y + dotRadius],
      [pp.x - dotRadius, pp.y - dotRadius],
    ], { color, width: 0, opacity: 0.95 })

    const lw = pp.lw
    const lh = lineH

    // Candidate offsets for a label, in priority order. Tried in turn; the
    // first clean fit wins. If none fit cleanly, the candidate with the
    // smallest overlap is used as a graceful fallback (instead of slamming
    // it down on the first slot like the old code).
    const candidates: Array<{ ox: number; oy: number }> = [
      // Primary axis stacks (most legible — directly above/below the dot)
      { ox: 0, oy: dotPad + lh / 2 },
      { ox: 0, oy: -(dotPad + lh / 2) },
      { ox: 0, oy: dotPad + lh * 1.6 },
      { ox: 0, oy: -(dotPad + lh * 1.6) },
      { ox: 0, oy: dotPad + lh * 2.7 },
      { ox: 0, oy: -(dotPad + lh * 2.7) },
      { ox: 0, oy: dotPad + lh * 3.8 },
      { ox: 0, oy: -(dotPad + lh * 3.8) },
      // Direct sides
      { ox: lw / 2 + dotPad, oy: 0 },
      { ox: -(lw / 2 + dotPad), oy: 0 },
      // Diagonal nudges, primary distance
      { ox: lw / 2 + dotPad, oy: dotPad + lh / 2 },
      { ox: -(lw / 2 + dotPad), oy: dotPad + lh / 2 },
      { ox: lw / 2 + dotPad, oy: -(dotPad + lh / 2) },
      { ox: -(lw / 2 + dotPad), oy: -(dotPad + lh / 2) },
      // Diagonal nudges, extended distance
      { ox: lw / 2 + dotPad, oy: dotPad + lh * 1.6 },
      { ox: -(lw / 2 + dotPad), oy: dotPad + lh * 1.6 },
      { ox: lw / 2 + dotPad, oy: -(dotPad + lh * 1.6) },
      { ox: -(lw / 2 + dotPad), oy: -(dotPad + lh * 1.6) },
      // Half-shifted horizontals — sometimes thread between a tight pair of
      // labels above/below by sliding the center off-axis without going
      // fully sideways.
      { ox: lw / 4, oy: dotPad + lh / 2 },
      { ox: -lw / 4, oy: dotPad + lh / 2 },
      { ox: lw / 4, oy: -(dotPad + lh / 2) },
      { ox: -lw / 4, oy: -(dotPad + lh / 2) },
    ]

    let chosenBox: Box | null = null
    let chosenOx = candidates[0].ox
    let chosenOy = candidates[0].oy
    let bestOverlap = Infinity
    let bestBox: Box | null = null
    let bestOx = candidates[0].ox
    let bestOy = candidates[0].oy

    for (const c of candidates) {
      const cx = pp.x + c.ox
      const cy = pp.y + c.oy
      const box: Box = { x0: cx - lw / 2, y0: cy - lh / 2, x1: cx + lw / 2, y1: cy + lh / 2 }
      if (box.x0 < 0 || box.x1 > w || box.y0 < 0 || box.y1 > h) continue

      let overlap = 0
      for (const pb of occupied) {
        const ow = Math.min(box.x1, pb.x1) - Math.max(box.x0, pb.x0)
        const oh = Math.min(box.y1, pb.y1) - Math.max(box.y0, pb.y0)
        if (ow > 0 && oh > 0) overlap += ow * oh
      }

      if (overlap === 0) {
        chosenBox = box
        chosenOx = c.ox
        chosenOy = c.oy
        break
      }
      if (overlap < bestOverlap) {
        bestOverlap = overlap
        bestBox = box
        bestOx = c.ox
        bestOy = c.oy
      }
    }

    if (!chosenBox) {
      if (bestBox) {
        chosenBox = bestBox
        chosenOx = bestOx
        chosenOy = bestOy
      } else {
        // Every candidate was off-canvas — fall back to the primary slot.
        const cx = pp.x + chosenOx
        const cy = pp.y + chosenOy
        chosenBox = { x0: cx - lw / 2, y0: cy - lh / 2, x1: cx + lw / 2, y1: cy + lh / 2 }
      }
    }
    occupied.push(chosenBox)

    pushText(
      strokes,
      [pp.x + chosenOx, pp.y + chosenOy],
      pp.text,
      labelSize,
      color,
      0.7,
      'center',
    )
  }
}

function handleWallsWithFigures(
  instruction: DrawingInstruction,
  rand: () => number,
  w: number,
  h: number,
  strokes: StrokeElement[],
) {
  const step = instruction.steps.find((s) => s.type === 'walls-with-figures')
  if (!step) return

  const lineColor = (step.params.lineColor as string) || '#f4f1ea'
  const bgCount = (step.params.bgLineCount as number) ?? 60
  const bgWidthRange = (step.params.bgStrokeWidth as { min: number; max: number }) ?? { min: 0.7, max: 1.4 }
  const bgOpacityRange = (step.params.bgOpacity as { min: number; max: number }) ?? { min: 0.6, max: 0.9 }
  const figureNames = (step.params.figures as string[]) ?? ['square', 'circle', 'triangle', 'cross', 'x', 'diamond', 'hexagon', 'trapezoid']
  const cols = (step.params.cols as number) ?? 4
  const rows = (step.params.rows as number) ?? 2
  const figureSizeFrac = (step.params.figureSizeFrac as number) ?? 0.13
  const figureGapFrac = (step.params.figureGapFrac as number) ?? 0.5
  const figureLineDensity = (step.params.figureLineDensity as number) ?? 9
  const outlineWidth = (step.params.outlineWidth as number) ?? 1.4
  // Spacing jitter: each line shifts within its slot by up to ±jitter/2 of the
  // slot width. 0 = perfectly even (the old behavior). Values in [0, 0.8]
  // stay collision-free. Hand-painted lines on LeWitt's actual installations
  // were never perfectly equidistant, so a little jitter reads as authentic.
  const bgSpacingJitter = (step.params.bgSpacingJitter as number) ?? 0
  const figureSpacingJitter = (step.params.figureSpacingJitter as number) ?? 0

  // Unit shape templates centered at origin within a [-0.5, 0.5] bbox.
  const t = 0.18
  const greekCross: [number, number][] = [
    [-t, -0.5], [t, -0.5], [t, -t], [0.5, -t], [0.5, t], [t, t],
    [t, 0.5], [-t, 0.5], [-t, t], [-0.5, t], [-0.5, -t], [-t, -t],
  ]
  const c45 = Math.cos(Math.PI / 4)
  const s45 = Math.sin(Math.PI / 4)
  const xShape: [number, number][] = greekCross.map(([x, y]) => [x * c45 - y * s45, x * s45 + y * c45])

  const shapes: Record<string, [number, number][]> = {
    square: [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]],
    triangle: [[0, -0.5], [0.5, 0.4], [-0.5, 0.4]],
    circle: Array.from({ length: 36 }, (_, i) => {
      const a = (i / 36) * Math.PI * 2
      return [Math.cos(a) * 0.5, Math.sin(a) * 0.5] as [number, number]
    }),
    cross: greekCross,
    x: xShape,
    diamond: [[0, -0.5], [0.5, 0], [0, 0.5], [-0.5, 0]],
    hexagon: Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      return [Math.cos(a) * 0.5, Math.sin(a) * 0.5] as [number, number]
    }),
    trapezoid: [[-0.5, 0.4], [-0.3, -0.4], [0.3, -0.4], [0.5, 0.4]],
    pentagon: Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2
      return [Math.cos(a) * 0.5, Math.sin(a) * 0.5] as [number, number]
    }),
    octagon: Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2 - Math.PI / 8
      return [Math.cos(a) * 0.5, Math.sin(a) * 0.5] as [number, number]
    }),
  }

  // Lay figures out in a grid centered on the wall. The requested size is
  // figureSizeFrac × min(wallW, wallH); we auto-shrink (preserving the
  // requested gap-to-size ratio) if that pushes the grid past 90% of either
  // wall dimension. This lets the configured sizeFrac stay generous on
  // desktop without overflowing on narrow mobile walls.
  const requested = figureSizeFrac * Math.min(w, h)
  const reqPitch = requested * (1 + figureGapFrac)
  const reqGridW = (cols - 1) * reqPitch + requested
  const reqGridH = (rows - 1) * reqPitch + requested
  const fit = Math.min(1, (0.9 * w) / reqGridW, (0.9 * h) / reqGridH)
  const figureSize = requested * fit
  const cellPitch = figureSize * (1 + figureGapFrac)
  const gridW = (cols - 1) * cellPitch + figureSize
  const gridH = (rows - 1) * cellPitch + figureSize
  const gridX0 = (w - gridW) / 2 + figureSize / 2
  const gridY0 = (h - gridH) / 2 + figureSize / 2

  const placedFigures: Array<{ name: string; poly: [number, number][] }> = []
  for (let i = 0; i < figureNames.length && i < cols * rows; i++) {
    const name = figureNames[i]
    const tmpl = shapes[name]
    if (!tmpl) continue
    const r = Math.floor(i / cols)
    const cIdx = i % cols
    const cx = gridX0 + cIdx * cellPitch
    const cy = gridY0 + r * cellPitch
    const poly = tmpl.map(([px, py]) => [cx + px * figureSize, cy + py * figureSize] as [number, number])
    placedFigures.push({ name, poly })
  }

  const unionIntervals = (ivs: Array<[number, number]>): Array<[number, number]> => {
    if (ivs.length === 0) return []
    const sorted = ivs.map((iv) => [iv[0], iv[1]] as [number, number]).sort((a, b) => a[0] - b[0])
    const out: Array<[number, number]> = [sorted[0]]
    for (let i = 1; i < sorted.length; i++) {
      const last = out[out.length - 1]
      if (sorted[i][0] <= last[1]) {
        last[1] = Math.max(last[1], sorted[i][1])
      } else {
        out.push(sorted[i])
      }
    }
    return out
  }

  const complement = (inside: Array<[number, number]>, lo: number, hi: number): Array<[number, number]> => {
    const out: Array<[number, number]> = []
    let cursor = lo
    for (const iv of inside) {
      if (iv[0] > cursor) out.push([cursor, iv[0]])
      cursor = Math.max(cursor, iv[1])
    }
    if (cursor < hi) out.push([cursor, hi])
    return out
  }

  // Crossings of axis-aligned line with a polygon. axis 'x' = vertical line
  // at x=v, returns ys; axis 'y' = horizontal line at y=v, returns xs.
  const crossings = (poly: [number, number][], v: number, axis: 'x' | 'y'): Array<[number, number]> => {
    const ts: number[] = []
    const idx = axis === 'x' ? 0 : 1
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i]
      const b = poly[(i + 1) % poly.length]
      const av = a[idx]
      const bv = b[idx]
      if ((av - v) * (bv - v) < 0 && av !== bv) {
        const tInterp = (v - av) / (bv - av)
        const other = a[1 - idx] + tInterp * (b[1 - idx] - a[1 - idx])
        ts.push(other)
      }
    }
    ts.sort((a, b) => a - b)
    const ivs: Array<[number, number]> = []
    for (let i = 0; i + 1 < ts.length; i += 2) ivs.push([ts[i], ts[i + 1]])
    return ivs
  }

  // 1) Background vertical lines, clipped to OUTSIDE all figures.
  for (let i = 0; i < bgCount; i++) {
    const jitter = bgSpacingJitter * (rand() - 0.5)
    const tFrac = (i + 0.5 + jitter) / bgCount
    const xv = tFrac * w
    const allInside: Array<[number, number]> = []
    for (const fig of placedFigures) {
      for (const iv of crossings(fig.poly, xv, 'x')) allInside.push(iv)
    }
    const inside = unionIntervals(allInside)
    const segs = complement(inside, 0, h)
    const sw = randRange(rand, bgWidthRange)
    const op = randRange(rand, bgOpacityRange)
    for (const [y0, y1] of segs) {
      pushStroke(strokes, [[xv, y0], [xv, y1]], { color: lineColor, width: sw, opacity: op })
    }
  }

  // 2) For each figure, draw its outline then horizontal lines INSIDE.
  for (const fig of placedFigures) {
    const closed: [number, number][] = [...fig.poly, fig.poly[0]]
    pushStroke(strokes, closed, {
      color: lineColor,
      width: outlineWidth,
      opacity: 0.95,
      mode: 'stroke',
    })

    const ys = fig.poly.map((p) => p[1])
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const figH = maxY - minY
    const lineCount = Math.max(2, Math.round(figH / (figureSize / figureLineDensity)))
    for (let j = 0; j < lineCount; j++) {
      const jitter = figureSpacingJitter * (rand() - 0.5)
      const tFrac = (j + 0.5 + jitter) / lineCount
      const yh = minY + tFrac * figH
      const xivs = crossings(fig.poly, yh, 'y')
      const sw = randRange(rand, bgWidthRange)
      const op = randRange(rand, bgOpacityRange)
      for (const [x0, x1] of xivs) {
        pushStroke(strokes, [[x0, yh], [x1, yh]], { color: lineColor, width: sw, opacity: op })
      }
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

  if (stepTypes.has('random-wobbly')) {
    handleRandomWobbly(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('circle-scatter')) {
    handleCircleScatter(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('imitative-bands')) {
    handleImitativeBands(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('solid-bands')) {
    handleSolidBands(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('parallel-lines')) {
    handleParallelLines(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('lines-to-grid-points')) {
    handleLinesToGridPoints(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('labelled-shapes')) {
    handleLabelledShapes(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('labelled-points')) {
    handleLabelledPoints(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  if (stepTypes.has('walls-with-figures')) {
    handleWallsWithFigures(instruction, rand, canvasWidth, canvasHeight, strokes)
  }

  return strokes
}
