import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AnthropicProvider } from './providers/openai.provider';
import {
  IAIProvider,
  ParsedResumeContent,
  ExtractedSkill,
  ParsedJobDescription,
  ResumeGenerationInput,
  GeneratedResume,
  EnhancedResume,
  TailoredResume,
} from './interfaces/ai-provider.interface';

// Cosine similarity between two embedding vectors
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA === 0 || normB === 0 ? 0 : dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

@Injectable()
export class AiService implements IAIProvider {
  private readonly provider: IAIProvider;
  private readonly logger = new Logger('AiService');

  constructor(private readonly configService: ConfigService) {
    this.provider = new AnthropicProvider(configService);
  }

  async parseResume(rawText: string): Promise<ParsedResumeContent> {
    this.logger.log('Parsing resume text...');
    return this.provider.parseResume(rawText);
  }

  async extractSkillsFromText(text: string, context: string): Promise<ExtractedSkill[]> {
    this.logger.log(`Extracting skills from text (context: ${context})`);
    return this.provider.extractSkillsFromText(text, context);
  }

  async parseJobDescription(rawText: string): Promise<ParsedJobDescription> {
    this.logger.log('Parsing job description...');
    return this.provider.parseJobDescription(rawText);
  }

  async generateResume(input: ResumeGenerationInput): Promise<GeneratedResume> {
    this.logger.log('Generating professional resume...');
    return this.provider.generateResume(input);
  }

  async enhanceResume(parsedContent: ParsedResumeContent, rawText: string): Promise<EnhancedResume> {
    this.logger.log('Enhancing resume...');
    return this.provider.enhanceResume(parsedContent, rawText);
  }

  async tailorResumeToJob(
    studentData: Record<string, any>,
    jobDescription: ParsedJobDescription,
    rawJdText: string,
  ): Promise<TailoredResume> {
    this.logger.log('Tailoring resume to JD...');
    return this.provider.tailorResumeToJob(studentData, jobDescription, rawJdText);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    return this.provider.generateEmbedding(text);
  }

  async normalizeSkillName(rawSkillName: string): Promise<string> {
    return this.provider.normalizeSkillName(rawSkillName);
  }

  async computeSemanticSimilarity(textA: string, textB: string): Promise<number> {
    try {
      const [embA, embB] = await Promise.all([
        this.generateEmbedding(textA),
        this.generateEmbedding(textB),
      ]);
      const similarity = cosineSimilarity(embA, embB);
      return Math.round(similarity * 100);
    } catch (error) {
      this.logger.warn('Semantic similarity computation failed, returning 0:', error.message);
      return 0;
    }
  }
}
