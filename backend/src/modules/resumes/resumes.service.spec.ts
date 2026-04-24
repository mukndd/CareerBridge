import { describe, expect, it, jest } from '@jest/globals';
import { ResumesService } from './resumes.service';

describe('ResumesService', () => {
  it('keeps resume uploads working when the AI parser is unavailable', async () => {
    const resumeCreate = jest.fn() as any;
    resumeCreate.mockResolvedValue({ id: 'resume-1' });
    const resumeUpdate = jest.fn() as any;
    resumeUpdate.mockResolvedValue({
      id: 'resume-1',
      structuredContent: { skills: ['Python', 'React'] },
    });
    const parseResume = jest.fn() as any;
    parseResume.mockRejectedValue(new Error('missing api key'));
    const saveFile = jest.fn() as any;
    saveFile.mockResolvedValue({ id: 'file-1', originalName: 'resume.pdf' });
    const extractDocumentFromFile = jest.fn() as any;
    extractDocumentFromFile.mockResolvedValue({
      text: [
        'Python React TypeScript Node.js GitHub Docker',
        'Machine Learning NLP TensorFlow PyTorch SQL Tableau Power BI',
      ].join(' '.repeat(4)),
      confidence: 0.91,
      warnings: [],
      sourceType: 'pdf',
      containsLayeredText: false,
      needsManualReview: false,
      pageCount: 2,
    });
    const extractAndUpsertStudentSkills = jest.fn() as any;
    extractAndUpsertStudentSkills.mockResolvedValue({
      skills: [
        { skillId: 'skill-1', name: 'Python', confidence: 'HIGH', source: 'resume:file-1' },
        { skillId: 'skill-2', name: 'React', confidence: 'HIGH', source: 'resume:file-1' },
      ],
      rawExtracted: [],
    });
    const ensureProfile = jest.fn() as any;
    ensureProfile.mockResolvedValue({ id: 'student-1' });

    const prisma = {
      resume: {
        create: resumeCreate,
        update: resumeUpdate,
      },
      studentProfile: {
        findUnique: jest.fn(),
      },
    };

    const aiService = {
      parseResume,
    };

    const filesService = {
      saveFile,
      extractDocumentFromFile,
    };

    const skillsService = {
      extractAndUpsertStudentSkills,
    };

    const studentsService = {
      ensureProfile,
    };

    const service = new ResumesService(
      prisma as any,
      aiService as any,
      filesService as any,
      skillsService as any,
      studentsService as any,
    );

    const result = await service.uploadResume('user-1', {
      originalname: 'resume.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('pdf'),
    } as any);

    expect(aiService.parseResume).toHaveBeenCalled();
    expect(result.parsedContent.skills).toEqual(expect.arrayContaining(['Python', 'React']));
    expect((result.resume.structuredContent as any).skills).toEqual(expect.arrayContaining(['Python', 'React']));
    expect(prisma.resume.update).toHaveBeenCalled();
  });
});
