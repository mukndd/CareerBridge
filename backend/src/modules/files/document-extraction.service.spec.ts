import * as path from 'path';
import { describe, expect, it } from '@jest/globals';
import { DocumentExtractionService } from './document-extraction.service';

describe('DocumentExtractionService', () => {
  it('extracts readable text from a real PDF without crashing on module loading', async () => {
    const service = new DocumentExtractionService();
    const pdfPath = path.resolve(__dirname, '../../../../phase2-paper.pdf');

    const result = await service.extractFromFile(pdfPath, 'phase2-paper.pdf');

    expect(result.sourceType).toBe('pdf');
    expect(result.pageCount).toBeGreaterThan(0);
    expect(result.text.length).toBeGreaterThan(200);
    expect(result.text.toLowerCase()).toContain('skills');
    expect(result.warnings).toEqual(expect.any(Array));
  });
});
