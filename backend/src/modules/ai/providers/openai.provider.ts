import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import {
  IAIProvider,
  ParsedResumeContent,
  ExtractedSkill,
  ParsedJobDescription,
  ResumeGenerationInput,
  GeneratedResume,
  EnhancedResume,
  TailoredResume,
} from '../interfaces/ai-provider.interface';
import { RESUME_TEMPLATE_HTML } from '../templates/resume.template';
import { extractSkillsLocal, extractJDSkillsLocal } from '../skill-extractor.util';

@Injectable()
export class AnthropicProvider implements IAIProvider {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly logger = new Logger('AnthropicProvider');

  constructor(private readonly configService: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.configService.get<string>('app.anthropic.apiKey'),
    });
    this.model = this.configService.get<string>('app.anthropic.model', 'claude-sonnet-4-5');
  }

  private async chat(systemPrompt: string, userContent: string, temperature = 0.2): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\n${userContent}`,
          },
        ],
        temperature,
      });
      const block = response.content[0];
      return block.type === 'text' ? block.text : '{}';
    } catch (error) {
      this.logger.error('Anthropic API error:', error.message);
      throw error;
    }
  }

  private extractJSON(raw: string): string {
    // Strip markdown code fences if Claude wraps output in them
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) return fenced[1].trim();
    // Try to find first { or [ and return from there
    const start = raw.search(/[{[]/);
    if (start !== -1) return raw.slice(start);
    return raw.trim();
  }

  async parseResume(rawText: string): Promise<ParsedResumeContent> {
    const system = `You are an expert resume parser. Extract structured information from the resume text.
Return a JSON object with these fields:
- summary (string): professional summary if present
- contactInfo: { name, email, phone, linkedin, github, portfolio }
- education: array of { institution, degree, field, cgpa, year }
- experience: array of { company, role, duration, description, bullets[] }
- projects: array of { title, description, techStack[], bullets[] }
- skills: array of strings
- certifications: array of { name, issuer, year }
- achievements: array of strings
Respond with ONLY valid JSON, no markdown fences.`;

    const result = await this.chat(system, `Parse this resume:\n\n${rawText}`);
    return JSON.parse(this.extractJSON(result)) as ParsedResumeContent;
  }

  async extractSkillsFromText(text: string, _context: string): Promise<ExtractedSkill[]> {
    return extractSkillsLocal(text) as ExtractedSkill[];
  }

  async parseJobDescription(rawText: string): Promise<ParsedJobDescription> {
    // Extract skills locally (no API call needed)
    const { requiredSkills, preferredSkills } = extractJDSkillsLocal(rawText);

    // Use Claude only for metadata
    const system = `You are an expert at parsing campus placement job descriptions for Indian universities.

Extract structured metadata from the JD. Return JSON with:
- jobTitle (string)
- company (string)
- location (string)
- jobType: "FULL_TIME" | "INTERNSHIP" | "CONTRACT" | "PART_TIME"
- ctcMin (number in LPA, null if not mentioned)
- ctcMax (number in LPA, null if not mentioned)
- ctcCurrency: "INR"
- experienceLevel: "fresher" (default for campus)
- eligibleBranches: array of strings (e.g. ["CSE", "ISE", "AI&DS"])
- minCgpa (number, e.g. 7.5)
- maxBacklogs (number, e.g. 0)
- allowedGraduationYears: array of numbers
- softSkills: array of interpersonal/behavioral skill strings
- responsibilities: array of strings
- keywords: array of important keywords
- additionalNotes: string

Do NOT include requiredSkills or preferredSkills — those are handled separately.
Respond with ONLY valid JSON, no markdown fences.`;

    try {
      const result = await this.chat(system, `Parse this JD:\n\n${rawText}`);
      const metadata = JSON.parse(this.extractJSON(result)) as ParsedJobDescription;
      return { ...metadata, requiredSkills, preferredSkills };
    } catch {
      // If Claude fails, return skill-only result
      return { requiredSkills, preferredSkills };
    }
  }

  async generateResume(input: ResumeGenerationInput): Promise<GeneratedResume> {
    const system = `You are an expert resume writer specializing in ATS-optimized resumes for freshers and campus placement.

Given student profile data, generate a professional resume. Rules:
- Use action-oriented bullet points (start with strong verbs)
- Be truthful — only use provided information
- Optimize for ATS systems
- Follow reverse chronological order
- Include quantified achievements where possible
- Keep summary concise (3-4 lines)

Return JSON:
{
  "summary": "Professional summary text",
  "sections": [
    {
      "type": "education|experience|projects|skills|certifications|achievements",
      "title": "Section Title",
      "content": <structured content for section>,
      "order": 1
    }
  ],
  "atsKeywords": ["keyword1", "keyword2"]
}
Respond with ONLY valid JSON, no markdown fences.`;

    const userContent = JSON.stringify(input, null, 2);
    const result = await this.chat(system, `Generate resume for:\n${userContent}`, 0.4);
    const parsed = JSON.parse(this.extractJSON(result)) as GeneratedResume;
    parsed.htmlContent = RESUME_TEMPLATE_HTML(parsed);
    return parsed;
  }

  async enhanceResume(parsedContent: ParsedResumeContent, rawText: string): Promise<EnhancedResume> {
    const system = `You are an expert resume enhancement specialist for campus placements.

Analyze the resume and:
1. Identify weak/passive bullet points and rewrite them with action verbs + impact
2. Identify missing standard sections
3. Infer skills from project/experience descriptions
4. Improve the professional summary
5. NEVER fabricate experiences or skills not implied by provided content
6. Label inferred skills clearly

Return JSON:
{
  "originalContent": <the parsed resume>,
  "improvedSummary": "Enhanced summary",
  "improvedBullets": [{ "original": "...", "improved": "...", "section": "projects|experience" }],
  "missingSections": ["Certifications", "GitHub Projects"],
  "suggestedSkills": [{ "name": "...", "rawName": "...", "confidence": "MEDIUM", "category": "...", "source": "inferred", "inferenceReason": "..." }],
  "enhancementNotes": ["Note 1", "Note 2"],
  "htmlContent": ""
}
Respond with ONLY valid JSON, no markdown fences.`;

    const result = await this.chat(
      system,
      `Parsed resume: ${JSON.stringify(parsedContent)}\n\nRaw text: ${rawText.substring(0, 3000)}`,
      0.4,
    );
    const enhanced = JSON.parse(this.extractJSON(result)) as EnhancedResume;
    return enhanced;
  }

  async tailorResumeToJob(
    studentData: Record<string, any>,
    jobDescription: ParsedJobDescription,
    rawJdText: string,
  ): Promise<TailoredResume> {
    const system = `You are an expert at tailoring resumes to specific job descriptions for campus placements.

Given student profile + parsed JD, create a tailored resume that:
1. Leads with most relevant skills/projects for this specific role
2. Adjusts summary to target this role
3. Prioritizes relevant experience/projects
4. Highlights matching skills truthfully
5. Improves ATS match for the JD keywords
6. NEVER fabricate or exaggerate — only reorganize and reframe existing truths
7. Assign relevanceScore (0-100) to each section

Return JSON:
{
  "jobTitle": "Target job title",
  "targetedSummary": "Role-specific summary",
  "prioritizedSections": [
    { "type": "...", "title": "...", "content": {...}, "order": 1, "relevanceScore": 85 }
  ],
  "highlightedSkills": ["skill1", "skill2"],
  "tailoringNotes": ["Note explaining key changes"],
  "htmlContent": ""
}
Respond with ONLY valid JSON, no markdown fences.`;

    const result = await this.chat(
      system,
      `Student data: ${JSON.stringify(studentData)}\n\nJob Description: ${JSON.stringify(jobDescription)}\n\nRaw JD: ${rawJdText.substring(0, 2000)}`,
      0.5,
    );
    return JSON.parse(this.extractJSON(result)) as TailoredResume;
  }

  async generateEmbedding(_text: string): Promise<number[]> {
    // Anthropic does not provide an embeddings API.
    // computeSemanticSimilarity catches this and returns 0.
    throw new Error('Embeddings not supported with Anthropic provider');
  }

  async normalizeSkillName(rawSkillName: string): Promise<string> {
    // First try deterministic normalization
    const normalized = SKILL_NORMALIZATIONS[rawSkillName.toLowerCase().trim()];
    if (normalized) return normalized;

    // Fall back to Claude
    const system = `You are a skill name normalizer. Given a raw skill name, return the canonical normalized version.
Examples: "JS" => "JavaScript", "Postgres" => "PostgreSQL", "Node" => "Node.js", "ML" => "Machine Learning"
Return ONLY the canonical name as JSON: { "canonical": "..." }
Respond with ONLY valid JSON, no markdown fences.`;

    try {
      const result = await this.chat(system, `Normalize: "${rawSkillName}"`);
      const parsed = JSON.parse(this.extractJSON(result));
      return parsed.canonical || rawSkillName;
    } catch {
      return rawSkillName;
    }
  }
}

// Keep alias for backward compatibility in ai.service.ts import
export { AnthropicProvider as OpenAIProvider };

// Deterministic skill normalization table (fast path before LLM)
const SKILL_NORMALIZATIONS: Record<string, string> = {
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'react': 'React.js',
  'reactjs': 'React.js',
  'react.js': 'React.js',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'python': 'Python',
  'java': 'Java',
  'c++': 'C++',
  'cpp': 'C++',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mysql': 'MySQL',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'redis': 'Redis',
  'aws': 'AWS',
  'gcp': 'Google Cloud Platform',
  'azure': 'Microsoft Azure',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'k8s': 'Kubernetes',
  'ml': 'Machine Learning',
  'ai': 'Artificial Intelligence',
  'dl': 'Deep Learning',
  'nlp': 'Natural Language Processing',
  'cv': 'Computer Vision',
  'sql': 'SQL',
  'nosql': 'NoSQL',
  'rest': 'REST API',
  'graphql': 'GraphQL',
  'git': 'Git',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'linux': 'Linux',
  'html': 'HTML',
  'css': 'CSS',
  'sass': 'Sass',
  'tailwind': 'Tailwind CSS',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'fastapi': 'FastAPI',
  'django': 'Django',
  'flask': 'Flask',
  'spring': 'Spring Boot',
  'springboot': 'Spring Boot',
  'tensorflow': 'TensorFlow',
  'pytorch': 'PyTorch',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'sklearn': 'scikit-learn',
  'scikit-learn': 'scikit-learn',
};
