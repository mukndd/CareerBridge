export interface TextBlock {
  text: string;
  x: number;
  y: number;
  width?: number;
  pageNumber: number;
}

export interface PageText {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  text: string;
  confidence: number;
  warnings: string[];
  pageCount: number;
  sourceType: 'pdf' | 'docx' | 'ocr' | 'unknown';
  containsLayeredText: boolean;
  needsManualReview: boolean;
}

export function normalizeUnicode(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u00ad/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
}

export function normalizeWhitespace(value: string): string {
  return normalizeUnicode(value)
    .split('\n')
    .map((line) => line.trim().replace(/\s+/g, ' '))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function dehyphenateLineWraps(value: string): string {
  return normalizeWhitespace(value)
    .replace(/(\w)-\n(\w)/g, '$1$2')
    .replace(/-\n/g, '')
    .replace(/\n([a-z])/g, ' $1');
}

export function normaliseTextBlockText(value: string): string {
  return normalizeWhitespace(value).replace(/\s+/g, ' ').trim();
}

export function dedupeConsecutiveLines(lines: string[]): string[] {
  const output: string[] = [];
  for (const line of lines) {
    const current = line.trim();
    if (!current) continue;
    if (output.length && output[output.length - 1] === current) continue;
    output.push(current);
  }
  return output;
}

function normalizeForComparison(value: string): string {
  return normaliseTextBlockText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function stripRepeatedHeadersFooters(pageLines: string[][]): string[][] {
  const lineFrequency = new Map<string, number>();

  for (const lines of pageLines) {
    const candidates = [...lines.slice(0, 2), ...lines.slice(-2)];
    for (const line of candidates) {
      const key = normalizeForComparison(line);
      if (!key || key.length < 4) continue;
      lineFrequency.set(key, (lineFrequency.get(key) || 0) + 1);
    }
  }

  const repeated = new Set(
    [...lineFrequency.entries()]
      .filter(([, count]) => count >= Math.max(2, Math.ceil(pageLines.length * 0.5)))
      .map(([key]) => key),
  );

  return pageLines.map((lines) => {
    const filtered = lines.filter((line, index) => {
      const key = normalizeForComparison(line);
      if (!key) return false;
      if (repeated.has(key) && (index < 2 || index > lines.length - 3)) return false;
      return true;
    });
    return dedupeConsecutiveLines(filtered);
  });
}

export function dedupeVisibleAndHiddenText(visibleText: string, hiddenText: string): { text: string; duplicated: boolean } {
  const visible = normalizeForComparison(visibleText);
  const hidden = normalizeForComparison(hiddenText);
  if (!visible || !hidden) {
    return { text: normaliseTextBlockText(visibleText || hiddenText), duplicated: false };
  }
  const visibleTokens = new Set(visible.split(' ').filter(Boolean));
  const hiddenTokens = new Set(hidden.split(' ').filter(Boolean));
  const intersection = [...visibleTokens].filter((token) => hiddenTokens.has(token)).length;
  const similarity = intersection / Math.max(1, Math.max(visibleTokens.size, hiddenTokens.size));
  return {
    text: normaliseTextBlockText(visibleText),
    duplicated: similarity >= 0.65,
  };
}

function splitColumns(blocks: TextBlock[], pageWidth?: number): TextBlock[][] {
  if (!blocks.length) return [];
  if (!pageWidth || pageWidth <= 0) return [blocks];
  const xs = blocks.map((block) => block.x).sort((a, b) => a - b);
  const minX = xs[0];
  const maxX = xs[xs.length - 1];
  if (maxX - minX < pageWidth * 0.35) return [blocks];
  const midpoint = pageWidth / 2;
  const left = blocks.filter((block) => block.x <= midpoint);
  const right = blocks.filter((block) => block.x > midpoint);
  if (!left.length || !right.length) return [blocks];
  return [left, right];
}

function assembleColumnText(blocks: TextBlock[]): string {
  const sorted = [...blocks].sort((a, b) => {
    const yDelta = b.y - a.y;
    if (Math.abs(yDelta) > 3) return yDelta;
    return a.x - b.x;
  });

  const lines: string[] = [];
  let currentY: number | null = null;
  let currentLine: string[] = [];

  for (const block of sorted) {
    if (currentY === null || Math.abs(block.y - currentY) > 3) {
      if (currentLine.length) {
        lines.push(currentLine.join(' ').trim());
      }
      currentY = block.y;
      currentLine = [block.text];
    } else {
      currentLine.push(block.text);
    }
  }

  if (currentLine.length) {
    lines.push(currentLine.join(' ').trim());
  }

  return dedupeConsecutiveLines(lines).join('\n');
}

export function reconstructReadingOrder(
  pages: Array<{ blocks: TextBlock[]; width?: number }>,
): PageText[] {
  return pages.map((page) => {
    const columns = splitColumns(page.blocks, page.width);
    const orderedBlocks = columns.length > 1
      ? columns
          .sort((left, right) => {
            const leftX = left.reduce((sum, block) => sum + block.x, 0) / Math.max(1, left.length);
            const rightX = right.reduce((sum, block) => sum + block.x, 0) / Math.max(1, right.length);
            return leftX - rightX;
          })
      : [page.blocks];

    return {
      pageNumber: page.blocks[0]?.pageNumber ?? 0,
      text: orderedBlocks
        .map((column) => assembleColumnText(column))
        .filter(Boolean)
        .join('\n'),
    };
  });
}

export function computeExtractionConfidence(params: {
  pageCount: number;
  textLength: number;
  itemCount: number;
  duplicatedLayer: boolean;
  sourceType: 'pdf' | 'docx' | 'ocr' | 'unknown';
  manualReviewRequired: boolean;
}): number {
  const base = params.sourceType === 'pdf'
    ? 0.84
    : params.sourceType === 'docx'
      ? 0.9
      : params.sourceType === 'ocr'
        ? 0.5
        : 0.35;
  const textBoost = clamp01(params.textLength / 2000) * 0.08;
  const pageBoost = clamp01(params.pageCount / 10) * 0.04;
  const itemBoost = clamp01(params.itemCount / 200) * 0.04;
  const duplicationPenalty = params.duplicatedLayer ? 0.2 : 0;
  const reviewPenalty = params.manualReviewRequired ? 0.18 : 0;
  return Math.max(0, Math.min(1, base + textBoost + pageBoost + itemBoost - duplicationPenalty - reviewPenalty));
}

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
