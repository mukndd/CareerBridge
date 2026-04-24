import { describe, expect, it } from '@jest/globals';
import {
  dehyphenateLineWraps,
  dedupeVisibleAndHiddenText,
  normalizeUnicode,
  reconstructReadingOrder,
  stripRepeatedHeadersFooters,
} from './document-extraction.util';

describe('document extraction utilities', () => {
  it('normalizes unicode and whitespace', () => {
    expect(normalizeUnicode('Hello\u00a0world\u2014test')).toBe('Hello world-test');
  });

  it('dehyphenates wrapped words', () => {
    expect(dehyphenateLineWraps('hyphen-\nated text')).toContain('hyphenated');
  });

  it('removes repeated headers and footers', () => {
    const pages = stripRepeatedHeadersFooters([
      ['CareerBridge', 'Page 1', 'Content A', 'Footer'],
      ['CareerBridge', 'Page 2', 'Content B', 'Footer'],
    ]);

    expect(pages[0]).toEqual(['Page 1', 'Content A']);
    expect(pages[1]).toEqual(['Page 2', 'Content B']);
  });

  it('detects duplicated visible and hidden text', () => {
    const result = dedupeVisibleAndHiddenText('React TypeScript', 'React TypeScript');
    expect(result.duplicated).toBe(true);
  });

  it('reconstructs reading order for simple multi-column blocks', () => {
    const pages = reconstructReadingOrder([
      {
        width: 600,
        blocks: [
          { text: 'Left top', x: 50, y: 700, pageNumber: 1 },
          { text: 'Right top', x: 350, y: 705, pageNumber: 1 },
          { text: 'Left bottom', x: 50, y: 650, pageNumber: 1 },
          { text: 'Right bottom', x: 350, y: 645, pageNumber: 1 },
        ],
      },
    ]);

    expect(pages[0].text).toContain('Left top');
    expect(pages[0].text).toContain('Right top');
  });
});
