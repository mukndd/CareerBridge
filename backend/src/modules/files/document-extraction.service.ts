import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as mammoth from 'mammoth';
import {
  ExtractionResult,
  TextBlock,
  normalizeUnicode,
  normalizeWhitespace,
  dehyphenateLineWraps,
  reconstructReadingOrder,
  stripRepeatedHeadersFooters,
  dedupeVisibleAndHiddenText,
  computeExtractionConfidence,
} from './document-extraction.util';

@Injectable()
export class DocumentExtractionService {
  async extractFromFile(absolutePath: string, originalName: string): Promise<ExtractionResult> {
    const ext = originalName.toLowerCase().split('.').pop() || '';
    if (ext === 'pdf') {
      return this.extractPdf(absolutePath);
    }
    if (ext === 'docx' || ext === 'doc') {
      return this.extractDocx(absolutePath);
    }
    return {
      text: '',
      confidence: 0,
      warnings: [`Unsupported document type: .${ext}`],
      pageCount: 0,
      sourceType: 'unknown',
      containsLayeredText: false,
      needsManualReview: true,
    };
  }

  private async extractPdf(absolutePath: string): Promise<ExtractionResult> {
    const warnings: string[] = [];
    const buffer = fs.readFileSync(absolutePath);

    const tryPdfJs = async (): Promise<ExtractionResult> => {
      // Nest builds this service as CommonJS, so a direct static import of pdfjs-dist's
      // .mjs entrypoint gets rewritten into require() and crashes at runtime.
      // Using an indirect import keeps Node's native ESM loader in control.
      const loadModule = new Function(
        'specifier',
        'return import(specifier);',
      ) as (specifier: string) => Promise<any>;
      const pdfjs = await loadModule('pdfjs-dist/legacy/build/pdf.mjs');
      const document = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        isEvalSupported: false,
        disableFontFace: true,
      }).promise;

      const pages: Array<{ blocks: TextBlock[]; width?: number }> = [];
      let totalItems = 0;

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
        const page = await document.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.0 });
        const content = await page.getTextContent();
        const blocks: TextBlock[] = [];

        for (const item of content.items as any[]) {
          if (!item?.str || !item.str.trim()) continue;
          const transform = item.transform || [1, 0, 0, 1, 0, 0];
          const [, , , , x, y] = transform;
          blocks.push({
            text: normalizeUnicode(item.str),
            x: Number.isFinite(x) ? x : 0,
            y: Number.isFinite(y) ? y : 0,
            width: item.width,
            pageNumber,
          });
        }

        totalItems += blocks.length;
        pages.push({ blocks, width: viewport.width });
      }

      const orderedPages = reconstructReadingOrder(pages);
      const pageLines = orderedPages.map((page) => {
        const lines = normalizeWhitespace(page.text)
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
        return lines;
      });

      const dedupedPages = stripRepeatedHeadersFooters(pageLines);
      const pageTexts = dedupedPages.map((lines) => lines.join('\n').trim());
      const mergedText = dehyphenateLineWraps(pageTexts.join('\n\n'));
      const hiddenCheck = dedupeVisibleAndHiddenText(mergedText, pageTexts.join('\n'));

      if (totalItems < 20 || hiddenCheck.text.length < 400) {
        warnings.push('PDF text layer looks sparse; scanned pages may need OCR.');
      }
      if (hiddenCheck.duplicated) {
        warnings.push('Dual-layer OCR/visible text duplication detected; duplicate content was removed.');
      }
      if (!hiddenCheck.text.trim()) {
        warnings.push('No extractable text found in PDF.');
      }

      const confidence = computeExtractionConfidence({
        pageCount: document.numPages,
        textLength: hiddenCheck.text.length,
        itemCount: totalItems,
        duplicatedLayer: hiddenCheck.duplicated,
        sourceType: 'pdf',
        manualReviewRequired: totalItems < 20 || hiddenCheck.text.length < 400,
      });

      return {
        text: normalizeWhitespace(hiddenCheck.text),
        confidence,
        warnings,
        pageCount: document.numPages,
        sourceType: 'pdf',
        containsLayeredText: hiddenCheck.duplicated,
        needsManualReview: confidence < 0.55,
      };
    };

    try {
      return await tryPdfJs();
    } catch (error) {
      warnings.push(
        `Primary PDF parser failed; using fallback text extraction (${error instanceof Error ? error.message : 'unknown error'}).`,
      );

      const pdfParseModule = require('pdf-parse');
      const pdfParse = pdfParseModule.default ?? pdfParseModule;
      const fallback = await pdfParse(buffer);
      const text = normalizeWhitespace(dehyphenateLineWraps(fallback.text || ''));
      if (!text.trim()) {
        warnings.push('No extractable text found in PDF.');
      }

      const confidence = computeExtractionConfidence({
        pageCount: fallback.numpages || 1,
        textLength: text.length,
        itemCount: text.split(/\s+/).filter(Boolean).length,
        duplicatedLayer: false,
        sourceType: 'pdf',
        manualReviewRequired: text.length < 400,
      });

      return {
        text,
        confidence,
        warnings,
        pageCount: fallback.numpages || 1,
        sourceType: 'pdf',
        containsLayeredText: false,
        needsManualReview: confidence < 0.55,
      };
    }
  }

  private async extractDocx(absolutePath: string): Promise<ExtractionResult> {
    const result = await mammoth.extractRawText({ path: absolutePath });
    const text = normalizeWhitespace(dehyphenateLineWraps(result.value));
    const warnings: string[] = [];
    if (!text.trim()) warnings.push('No readable text extracted from DOCX/DOC.');

    const confidence = computeExtractionConfidence({
      pageCount: 1,
      textLength: text.length,
      itemCount: text.split(/\s+/).length,
      duplicatedLayer: false,
      sourceType: 'docx',
      manualReviewRequired: text.length < 200,
    });

    return {
      text,
      confidence,
      warnings,
      pageCount: 1,
      sourceType: 'docx',
      containsLayeredText: false,
      needsManualReview: confidence < 0.55,
    };
  }
}
