/**
 * Utility functions for parsing clipboard / spreadsheet data copied from Excel, Google Sheets, CSVs, or web tables (Markdown/HTML).
 */

export interface ParsedSpreadsheet {
  rawGrid: string[][]
  hasHeaderRow: boolean
  hasHeaderCol: boolean
  labelColIndex: number
  includedColIndices: number[]
  datasetNames: string[]
  sliceLabels: string[]
  // datasetValues[datasetIndex][sliceIndex]
  datasetValues: number[][]
  coordinatePoints?: Array<{
    name: string
    x: number
    y: number
    r?: number
  }>
}

export interface DetectedGridInfo {
  hasHeaderRow: boolean
  hasHeaderCol: boolean
  labelColIndex: number
  indexColIndex: number | null
  numericColIndices: number[]
  textColIndices: number[]
  defaultDatasetColIndices: number[]
}

/**
 * Strip Markdown formatting (bold, italic, links, code, html tags/entities)
 */
export function stripMarkdown(str: string): string {
  if (!str) return ''
  return str
    // Remove bold/italic: **text**, *text*, __text__, _text_
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove HTML tags
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, '')
    // HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

/**
 * Check if a cell contains a valid number or financial number
 * (handling commas, currency signs $ € £ ¥ ₹ ₩, percentages, accounting parens (100), notes (est),
 * suffixes B/M/K/T, prefixes like &, citations [1], asterisks 100*, exclamations 100!, ellipses 100...)
 */
export function isNumericString(val: string | number | undefined | null): boolean {
  if (val === undefined || val === null) return false
  if (typeof val === 'number') return !isNaN(val)
  let str = stripMarkdown(String(val)).trim()
  if (!str) return false

  // Strip standalone asterisks, exclamations, tildes, backticks, carets, question marks, citations
  str = str.replace(/[*_~`!^?†‡#@&]/g, '').trim()
  str = str.replace(/\[\w+\]/g, '').trim() // [1], [a]
  str = str.replace(/\.{2,}/g, '').trim() // ellipses ...

  // Accounting parens (100) -> 100
  if (str.startsWith('(') && str.endsWith(')')) {
    str = str.slice(1, -1).trim()
  }
  // Strip parenthetical text notes like 100 (est) or (approx)
  str = str.replace(/\s*\([^)]*\)/g, '').trim()

  // Remove currency symbols, commas, percent, spaces, plus
  str = str.replace(/[$€£¥₹₩₽¢,%\s+]/g, '')
  if (str.startsWith('-') || str.endsWith('-')) {
    str = str.replace(/-/g, '').trim()
  }

  // Remove optional multiplier suffix: B, M, K, T (case-insensitive)
  str = str.replace(/[bBmMkKtT]$/, '').trim()

  return str !== '' && !isNaN(Number(str))
}

/**
 * Clean and parse numeric strings from Excel / Web tables
 * (handling commas, currency signs, multipliers B/M/K, percentages, accounting parens (100) -> -100,
 * parenthetical notes, citations [1], asterisks 100*, exclamations 100!, ellipses 100..., prefixes like &)
 */
export function cleanNumber(val: string | number | undefined | null, fallback = 0): number {
  if (val === undefined || val === null) return fallback
  if (typeof val === 'number') return isNaN(val) ? fallback : val
  let cleanStr = stripMarkdown(String(val)).trim()
  if (!cleanStr) return fallback

  // Strip standalone asterisks, exclamations, tildes, backticks, carets, question marks, citations
  cleanStr = cleanStr.replace(/[*_~`!^?†‡#@&]/g, '').trim()
  cleanStr = cleanStr.replace(/\[\w+\]/g, '').trim() // [1], [a]
  cleanStr = cleanStr.replace(/\.{2,}/g, '').trim() // ellipses ...

  let isNegative = false

  // Handle accounting format (100) -> -100
  if (cleanStr.startsWith('(') && cleanStr.endsWith(')')) {
    isNegative = true
    cleanStr = cleanStr.slice(1, -1).trim()
  } else if (cleanStr.startsWith('-')) {
    isNegative = true
    cleanStr = cleanStr.slice(1).trim()
  } else if (cleanStr.endsWith('-')) {
    isNegative = true
    cleanStr = cleanStr.slice(0, -1).trim()
  }

  // Strip parenthetical text notes like 100 (est) or (approx)
  cleanStr = cleanStr.replace(/\s*\([^)]*\)/g, '').trim()

  // Strip currency symbols, percentages, commas, plus, spaces
  cleanStr = cleanStr.replace(/[$€£¥₹₩₽¢,%\s+]/g, '').trim()

  // Suffix handling: strip multiplier suffix (B, M, K, T) to get clean numeric value
  cleanStr = cleanStr.replace(/[bBmMkKtT]$/, '').trim()

  const num = parseFloat(cleanStr)
  if (isNaN(num)) return fallback
  return isNegative ? -num : num
}

/**
 * Check if text matches a Markdown table
 */
export function isMarkdownTable(text: string): boolean {
  if (!text) return false
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  if (lines.length < 2) return false

  // Check for standard markdown divider row (e.g. |---|---| or | :--- | ---: |)
  const dividerRegex = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/
  const hasDivider = lines.some(l => dividerRegex.test(l))
  if (hasDivider) return true

  // Or if multiple lines have pipe delimiters
  const pipeLines = lines.filter(l => (l.match(/\|/g) || []).length >= 2)
  return pipeLines.length >= 2 && pipeLines.length >= lines.length * 0.6
}

/**
 * Parse Markdown table into a 2D string grid
 */
export function parseMarkdownTable(text: string): string[][] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
  const dividerRegex = /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?$/

  const rows: string[][] = []

  for (const line of lines) {
    if (dividerRegex.test(line)) continue

    let content = line
    if (content.startsWith('|')) content = content.slice(1)
    if (content.endsWith('|')) content = content.slice(0, -1)

    const cells = content.split('|').map(cell => stripMarkdown(cell.trim()))
    if (cells.length > 0 && cells.some(c => c.length > 0)) {
      rows.push(cells)
    }
  }

  return normalizeGrid(rows)
}

/**
 * Parse HTML table from clipboard HTML string
 */
export function parseHtmlTable(html: string): string[][] | null {
  if (!html || typeof window === 'undefined' || !html.includes('<table')) return null
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const table = doc.querySelector('table')
    if (!table) return null

    const rows: string[][] = []
    const trElements = table.querySelectorAll('tr')
    for (const tr of Array.from(trElements)) {
      const cells = tr.querySelectorAll('th, td')
      if (cells.length === 0) continue
      const rowData: string[] = []
      for (const cell of Array.from(cells)) {
        const cellClone = cell.cloneNode(true) as HTMLElement
        const brs = cellClone.querySelectorAll('br')
        brs.forEach(br => br.replaceWith(' '))
        const text = (cellClone.textContent || '').trim().replace(/\s+/g, ' ')
        rowData.push(stripMarkdown(text))
      }
      if (rowData.length > 0 && rowData.some(c => c.length > 0)) {
        rows.push(rowData)
      }
    }
    return rows.length > 0 ? normalizeGrid(rows) : null
  } catch {
    return null
  }
}

/**
 * Normalize 2D grid to ensure all rows have equal column length
 */
export function normalizeGrid(rows: string[][]): string[][] {
  if (rows.length === 0) return []
  const maxCols = Math.max(...rows.map(r => r.length), 0)
  if (maxCols === 0) return []

  return rows.map(r => {
    const padded = [...r]
    while (padded.length < maxCols) {
      padded.push('')
    }
    return padded
  })
}

/**
 * Parse raw text (or HTML) from clipboard into a 2D grid of strings
 */
export function parseDelimitedText(text: string, html?: string): string[][] {
  // If HTML table is present, prefer it
  if (html) {
    const htmlGrid = parseHtmlTable(html)
    if (htmlGrid && htmlGrid.length > 0 && htmlGrid[0].length > 0) {
      return htmlGrid
    }
  }

  if (!text) return []

  // Check for Markdown table
  if (isMarkdownTable(text)) {
    return parseMarkdownTable(text)
  }

  // Check if text itself contains an HTML table
  if (text.includes('<table') && text.includes('</table>')) {
    const htmlGrid = parseHtmlTable(text)
    if (htmlGrid && htmlGrid.length > 0) return htmlGrid
  }

  // Split lines without stripping leading indentation / tabs
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)
  if (lines.length === 0) return []

  // Check delimiters
  const hasTabs = lines.some(line => line.includes('\t'))
  const hasPipes = lines.some(line => line.includes('|'))
  const hasSemicolons = lines.some(line => line.includes(';'))

  let delimiter = '\t'
  if (hasTabs) {
    delimiter = '\t'
  } else if (hasPipes && lines.filter(l => l.includes('|')).length >= lines.length * 0.5) {
    delimiter = '|'
  } else if (hasSemicolons && !lines[0].includes(',')) {
    delimiter = ';'
  } else {
    delimiter = ','
  }

  if (delimiter === '\t' || delimiter === '|') {
    const rows = lines.map(line => {
      let l = line
      if (delimiter === '|' && l.startsWith('|')) l = l.slice(1)
      if (delimiter === '|' && l.endsWith('|')) l = l.slice(0, -1)
      return l.split(delimiter).map(cell => stripMarkdown(cell.trim().replace(/^["']|["']$/g, '')))
    })
    return normalizeGrid(rows)
  }

  // CSV with quote support
  const rows: string[][] = []
  for (const line of lines) {
    const row: string[] = []
    let inQuotes = false
    let current = ''
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        row.push(stripMarkdown(current.trim().replace(/^["']|["']$/g, '')))
        current = ''
      } else {
        current += char
      }
    }
    row.push(stripMarkdown(current.trim().replace(/^["']|["']$/g, '')))
    rows.push(row)
  }

  return normalizeGrid(rows)
}

/**
 * Transpose a 2D grid of strings (swap rows and columns)
 */
export function transposeGrid(grid: string[][]): string[][] {
  if (!grid.length || !grid[0].length) return []
  const rows = grid.length
  const cols = grid[0].length
  const transposed: string[][] = []
  for (let c = 0; c < cols; c++) {
    const newRow: string[] = []
    for (let r = 0; r < rows; r++) {
      newRow.push(grid[r][c] || '')
    }
    transposed.push(newRow)
  }
  return transposed
}

/**
 * Delete a specific column from the grid
 */
export function deleteGridColumn(grid: string[][], colIdx: number): string[][] {
  if (grid.length === 0 || colIdx < 0 || colIdx >= grid[0].length) return grid
  return grid.map(row => row.filter((_, idx) => idx !== colIdx))
}

/**
 * Delete a specific row from the grid
 */
export function deleteGridRow(grid: string[][], rowIdx: number): string[][] {
  if (rowIdx < 0 || rowIdx >= grid.length) return grid
  return grid.filter((_, idx) => idx !== rowIdx)
}

/**
 * Intelligent heuristics to detect table structure:
 * - Header row
 * - Slice label column
 * - Rank / index column
 * - Numeric dataset columns
 * - Non-numeric text columns
 */
export function detectGridHeaders(grid: string[][]): DetectedGridInfo {
  if (grid.length === 0 || grid[0].length === 0) {
    return {
      hasHeaderRow: false,
      hasHeaderCol: false,
      labelColIndex: 0,
      indexColIndex: null,
      numericColIndices: [],
      textColIndices: [],
    }
  }

  const numRows = grid.length
  const numCols = grid[0].length

  // Check row 0: if row 0 has text and subsequent rows have numbers
  let row0NumericCount = 0
  for (let c = 0; c < numCols; c++) {
    if (isNumericString(grid[0][c])) row0NumericCount++
  }

  let subsequentNumericCount = 0
  let subsequentTotal = 0
  for (let r = 1; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      subsequentTotal++
      if (isNumericString(grid[r][c])) subsequentNumericCount++
    }
  }

  // If top-left cell is empty (Excel matrices), or row 0 is text and subsequent rows have numbers
  const topLeftEmpty = grid[0][0].trim() === ''
  const hasHeaderRow =
    topLeftEmpty ||
    (numRows > 1 && row0NumericCount < numCols / 2 && subsequentNumericCount > 0) ||
    (numRows > 1 && row0NumericCount === 0)

  const startRow = hasHeaderRow ? 1 : 0
  const dataRowCount = Math.max(1, numRows - startRow)

  // Analyze each column
  const numericColIndices: number[] = []
  const textColIndices: number[] = []

  for (let c = 0; c < numCols; c++) {
    let numCount = 0
    for (let r = startRow; r < numRows; r++) {
      if (isNumericString(grid[r][c])) {
        numCount++
      }
    }
    if (numCount >= dataRowCount * 0.5) {
      numericColIndices.push(c)
    } else {
      textColIndices.push(c)
    }
  }

  // Check if Column 0 is a Rank or ID or Index column
  let indexColIndex: number | null = null
  if (numCols > 1) {
    const col0Header = grid[0][0].trim().toLowerCase()
    const isRankHeader = /^(rank|#|no\.?|s\.?no\.?|id|index|pos|position|row)$/i.test(col0Header)

    // Check if column 0 data cells are sequential integers (1, 2, 3...)
    let isSequentialIntegers = true
    if (dataRowCount >= 2) {
      for (let r = startRow; r < numRows; r++) {
        const val = cleanNumber(grid[r][0], -999999)
        const expected = r - startRow + 1
        if (Math.round(val) !== expected) {
          isSequentialIntegers = false
          break
        }
      }
    } else {
      isSequentialIntegers = false
    }

    if (isRankHeader || isSequentialIntegers) {
      indexColIndex = 0
    }
  }

  // Detect primary label column
  let labelColIndex = 0
  if (indexColIndex === 0 && numCols > 1) {
    // If col 0 is rank/index, check if col 1 is text
    if (textColIndices.includes(1) || !numericColIndices.includes(1)) {
      labelColIndex = 1
    } else {
      labelColIndex = textColIndices.length > 0 ? textColIndices[0] : 0
    }
  } else if (textColIndices.length > 0) {
    labelColIndex = textColIndices[0]
  } else {
    labelColIndex = 0
  }

  // Active numeric columns are those that are NOT the label column and NOT the index column
  const activeNumeric = numericColIndices.filter(c => c !== labelColIndex && c !== indexColIndex)

  // Default dataset columns: ALL non-label columns are datasets by default!
  // No column is ever excluded automatically unless explicitly done by user
  const defaultDatasetColIndices = Array.from({ length: numCols }, (_, i) => i).filter(
    c => c !== labelColIndex
  )

  const hasHeaderCol = numCols > 1 && (topLeftEmpty || textColIndices.includes(labelColIndex))

  return {
    hasHeaderRow,
    hasHeaderCol,
    labelColIndex,
    indexColIndex,
    numericColIndices: activeNumeric.length > 0 ? activeNumeric : defaultDatasetColIndices,
    textColIndices,
    defaultDatasetColIndices: defaultDatasetColIndices.length > 0 ? defaultDatasetColIndices : [0],
  }
}

/**
 * Analyze a 2D string grid and extract dataset names, slice labels, and values matrix
 */
export function parseGridToModel(
  grid: string[][],
  options?: {
    hasHeaderRow?: boolean
    hasHeaderCol?: boolean
    labelColIndex?: number
    includedColIndices?: number[]
    isCoordinate?: boolean
  }
): ParsedSpreadsheet {
  if (grid.length === 0 || grid[0].length === 0) {
    return {
      rawGrid: grid,
      hasHeaderRow: false,
      hasHeaderCol: false,
      labelColIndex: 0,
      includedColIndices: [],
      datasetNames: [],
      sliceLabels: [],
      datasetValues: [],
    }
  }

  const detected = detectGridHeaders(grid)
  const hasHeaderRow = options?.hasHeaderRow ?? detected.hasHeaderRow
  const hasHeaderCol = options?.hasHeaderCol ?? detected.hasHeaderCol
  const labelColIndex = options?.labelColIndex ?? (hasHeaderCol ? detected.labelColIndex : -1)
  const isCoordinate = options?.isCoordinate ?? false

  const startRow = hasHeaderRow ? 1 : 0
  const numRows = grid.length
  const numCols = grid[0].length

  // Determine active columns to convert into datasets (all non-label columns by default)
  let activeColIndices = options?.includedColIndices
  if (!activeColIndices || activeColIndices.length === 0) {
    activeColIndices = detected.defaultDatasetColIndices
  }

  // Extract slice / category labels
  const sliceLabels: string[] = []
  const numSlices = Math.max(0, numRows - startRow)

  for (let r = startRow; r < numRows; r++) {
    if (labelColIndex >= 0 && labelColIndex < numCols) {
      const label = grid[r][labelColIndex].trim()
      sliceLabels.push(label || `Slice ${sliceLabels.length + 1}`)
    } else {
      sliceLabels.push(`Slice ${sliceLabels.length + 1}`)
    }
  }

  // Extract dataset names & values
  const datasetNames: string[] = []
  const datasetValues: number[][] = []

  for (let i = 0; i < activeColIndices.length; i++) {
    const colIdx = activeColIndices[i]
    let name = ''
    if (hasHeaderRow && colIdx < numCols) {
      name = grid[0][colIdx].trim()
    }
    if (!name) {
      name = activeColIndices.length === 1 ? 'Dataset 1' : `Dataset ${i + 1}`
    }
    datasetNames.push(name)

    const colValues: number[] = []
    for (let r = startRow; r < numRows; r++) {
      const cellVal = colIdx < numCols ? grid[r][colIdx] : '0'
      colValues.push(cleanNumber(cellVal, 0))
    }
    datasetValues.push(colValues)
  }

  // Fallbacks if no data rows existed
  if (sliceLabels.length === 0) {
    sliceLabels.push('Slice 1')
  }
  if (datasetNames.length === 0) {
    datasetNames.push('Dataset 1')
    datasetValues.push(Array.from({ length: sliceLabels.length }, () => 0))
  }

  // Handle Coordinate charts (Scatter/Bubble)
  let coordinatePoints: Array<{ name: string; x: number; y: number; r?: number }> | undefined
  if (isCoordinate && numRows > startRow) {
    coordinatePoints = []
    for (let r = startRow; r < numRows; r++) {
      let name = `Point ${r - startRow + 1}`
      let x = 0
      let y = 0
      let rad = 10

      if (labelColIndex >= 0 && labelColIndex < numCols) {
        name = grid[r][labelColIndex].trim() || name
      }

      // X, Y from first two active numeric columns
      const xCol = activeColIndices[0] ?? (labelColIndex === 0 ? 1 : 0)
      const yCol = activeColIndices[1] ?? (labelColIndex === 1 ? 2 : 1)
      const rCol = activeColIndices[2]

      if (xCol < numCols) x = cleanNumber(grid[r][xCol], 0)
      if (yCol < numCols) y = cleanNumber(grid[r][yCol], 0)
      if (rCol !== undefined && rCol < numCols) rad = cleanNumber(grid[r][rCol], 10)

      coordinatePoints.push({ name, x, y, r: rad })
    }
  }

  return {
    rawGrid: grid,
    hasHeaderRow,
    hasHeaderCol: labelColIndex >= 0,
    labelColIndex: labelColIndex >= 0 ? labelColIndex : 0,
    includedColIndices: activeColIndices,
    datasetNames,
    sliceLabels,
    datasetValues,
    coordinatePoints,
  }
}

/**
 * Convert chart datasets, slice labels, and values into a 2D spreadsheet grid
 */
export function chartDataToGrid(params: {
  datasetNames: string[]
  sliceLabels: string[]
  datasetValues: (number | string)[][]
  isCoordinate?: boolean
  coordinatePoints?: Array<{ name: string; x: number; y: number; r?: number }>
}): string[][] {
  const { datasetNames, sliceLabels, datasetValues, isCoordinate, coordinatePoints } = params

  if (isCoordinate && coordinatePoints && coordinatePoints.length > 0) {
    const hasRadius = coordinatePoints.some(p => p.r !== undefined && p.r !== 10)
    const header = hasRadius ? ['Point', 'X', 'Y', 'Radius'] : ['Point', 'X', 'Y']
    const rows = coordinatePoints.map((p, i) => {
      const name = p.name || `Point ${i + 1}`
      return hasRadius
        ? [name, String(p.x ?? 0), String(p.y ?? 0), String(p.r ?? 10)]
        : [name, String(p.x ?? 0), String(p.y ?? 0)]
    })
    return [header, ...rows]
  }

  // Categorical charts
  const header = ['', ...datasetNames.map((name, i) => name || `Dataset ${i + 1}`)]
  const rows: string[][] = []

  for (let sIdx = 0; sIdx < sliceLabels.length; sIdx++) {
    const label = sliceLabels[sIdx] || `Slice ${sIdx + 1}`
    const row = [label]
    for (let dsIdx = 0; dsIdx < datasetNames.length; dsIdx++) {
      const val = datasetValues[dsIdx]?.[sIdx] ?? 0
      row.push(String(val))
    }
    rows.push(row)
  }

  return rows.length > 0 ? [header, ...rows] : []
}
