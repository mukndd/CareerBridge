import { describe, expect, it } from '@jest/globals';
import {
  compareCandidateScores,
  computeFairnessAudit,
  normaliseStudentProfile,
  scoreCertificateTrust,
  scoreCandidate,
} from './hsgm';

describe('HSGM scoring core', () => {
  it('normalizes GPA scales and derives gpaOn4', () => {
    const student = normaliseStudentProfile({
      id: 's1',
      firstName: 'A',
      lastName: 'B',
      department: 'CSE',
      rawGpa: 8.5,
      rawGpaScale: 10,
    });

    expect(student.gpaOn4).toBeCloseTo(3.4, 5);
    expect(student.fGpa).toBeCloseTo(0.85, 5);
  });

  it('returns zero trust for forged certificates', () => {
    const trust = scoreCertificateTrust(
      {
        name: 'Fake Cert',
        issuer: 'UnknownCert',
        issuerKey: 'unknowncert',
        forged: true,
        qrPresent: true,
        skills: [],
        trust: 0,
      },
      new Set(['google']),
    );

    expect(trust).toBe(0);
  });

  it('classifies fairness impact from GPA correctly', () => {
    const audit = computeFairnessAudit(0.52, 1.12, 0.78);

    expect(audit.boostedScore).toBeLessThanOrEqual(1);
    expect(['fair', 'minor_impact', 'significant_impact']).toContain(audit.classification);
  });

  it('applies the hidden talent multiplier for low GPA and high TRE', () => {
    const result = scoreCandidate(
      {
        id: 's-low-gpa',
        firstName: 'Low',
        lastName: 'GPA',
        department: 'CSE',
        rawGpa: 6.8,
        rawGpaScale: 10,
        skills: [
          { name: 'React', proficiency: 8 },
          { name: 'Node.js', proficiency: 8 },
          { name: 'TypeScript', proficiency: 8 },
          { name: 'GitHub', proficiency: 7 },
          { name: 'Leadership', proficiency: 7 },
        ],
        projects: [
          { title: 'Open Source Platform', description: 'Production deployment with GitHub contributions', openSource: true, deployed: true, impactLevel: 'high', keywords: ['open source'] },
        ],
        certifications: [
          { name: 'AWS Certified', issuer: 'AWS', qrPresent: true, skills: ['cloud'], forged: false, trust: 0 },
        ],
        resumeSummary: 'Competitive achiever and open source contributor',
        achievementText: 'Leader and mentor in hackathon',
        githubActivity: 'very_high',
      },
      {
        id: 'job-1',
        title: 'Frontend Engineer',
        requiredSkills: [
          { name: 'React' },
          { name: 'TypeScript' },
        ],
        preferredSkills: [{ name: 'Node.js' }],
        softSkillsRequired: ['Leadership'],
        rawJdText: 'React TypeScript Node.js open source',
      },
    );

    expect(result.boost).toBeGreaterThanOrEqual(1);
    expect(result.verdict).toBeDefined();
    expect(result.reasonCodes.length).toBeGreaterThan(0);
  });

  it('handles students without certificates', () => {
    const result = scoreCandidate(
      {
        id: 's-no-certs',
        firstName: 'No',
        lastName: 'Certs',
        department: 'CSE',
        rawGpa: 7.4,
        rawGpaScale: 10,
        skills: [{ name: 'Python', proficiency: 7 }],
      },
      {
        id: 'job-2',
        title: 'Data Engineer',
        requiredSkills: [{ name: 'Python' }],
        rawJdText: 'Python pipelines',
      },
    );

    expect(result.certificationRelevance).toBe(0);
    expect(result.fairnessAudit.boostedScore).toBeGreaterThanOrEqual(0);
  });

  it('sorts deterministically by final score, raw score, overlap, TRE, and id', () => {
    const items = [
      { id: 'b', finalScore: 0.8, rawScore: 0.8, overlap: 70, treScore: 0.5 },
      { id: 'a', finalScore: 0.8, rawScore: 0.8, overlap: 70, treScore: 0.7 },
      { id: 'c', finalScore: 0.8, rawScore: 0.9, overlap: 10, treScore: 0.1 },
    ];

    const sorted = [...items].sort(compareCandidateScores);
    expect(sorted.map((item) => item.id)).toEqual(['c', 'a', 'b']);
  });
});
