/**
 * DSU CareerBridge — Seed Script
 * Realistic campus placement demo data
 * Run: npm run seed
 */

import {
  PrismaClient,
  Role,
  Gender,
  AchievementType,
  JobType,
  JobStatus,
  ResumeType,
  ResumeStatus,
  SkillCategory,
  SkillConfidence,
  ApplicationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

// Demo passwords are read from env vars so a deployed instance doesn't ship
// with the same publicly-documented password forever. Locally (no env var
// set) a random one is generated per run and printed below — copy it from
// the console output, don't hardcode it anywhere.
function demoPassword(envVar: string): string {
  return process.env[envVar] ?? crypto.randomBytes(9).toString('base64url');
}

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// SKILL TAXONOMY SEED
// ─────────────────────────────────────────────

const SKILL_TAXONOMY = [
  // Programming Languages
  { name: 'Python', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['python', 'py'] },
  { name: 'JavaScript', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['javascript', 'js'] },
  { name: 'TypeScript', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['typescript', 'ts'] },
  { name: 'Java', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['java'] },
  { name: 'C++', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['cpp', 'c++', 'c plus plus'] },
  { name: 'C', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['c language'] },
  { name: 'Go', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['golang', 'go lang'] },
  { name: 'Rust', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['rust lang'] },
  { name: 'SQL', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['sql', 'structured query language'] },
  { name: 'HTML', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['html5', 'html'] },
  { name: 'CSS', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['css3', 'css'] },
  { name: 'Dart', category: SkillCategory.PROGRAMMING_LANGUAGE, aliases: ['dart'] },

  // Frameworks / Libraries
  { name: 'React.js', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['react', 'reactjs', 'react.js'] },
  { name: 'Next.js', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['next', 'nextjs', 'next.js'] },
  { name: 'Node.js', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['node', 'nodejs', 'node.js'] },
  { name: 'Express.js', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['express', 'expressjs'] },
  { name: 'NestJS', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['nestjs', 'nest.js'] },
  { name: 'Django', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['django'] },
  { name: 'FastAPI', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['fastapi', 'fast api'] },
  { name: 'Spring Boot', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['spring', 'springboot'] },
  { name: 'Vue.js', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['vue', 'vuejs'] },
  { name: 'Flutter', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['flutter'] },
  { name: 'TensorFlow', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['tensorflow', 'tf'] },
  { name: 'PyTorch', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['pytorch', 'torch'] },
  { name: 'Pandas', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['pandas'] },
  { name: 'NumPy', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['numpy', 'np'] },
  { name: 'scikit-learn', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['sklearn', 'scikit learn'] },
  { name: 'Tailwind CSS', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['tailwind', 'tailwindcss'] },
  { name: 'GraphQL', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['graphql', 'gql'] },
  { name: 'REST API', category: SkillCategory.FRAMEWORK_LIBRARY, aliases: ['rest', 'restful', 'rest api'] },

  // Databases
  { name: 'PostgreSQL', category: SkillCategory.DATABASE, aliases: ['postgres', 'postgresql', 'psql'] },
  { name: 'MySQL', category: SkillCategory.DATABASE, aliases: ['mysql'] },
  { name: 'MongoDB', category: SkillCategory.DATABASE, aliases: ['mongo', 'mongodb'] },
  { name: 'Redis', category: SkillCategory.DATABASE, aliases: ['redis'] },
  { name: 'Firebase', category: SkillCategory.DATABASE, aliases: ['firebase', 'firestore'] },
  { name: 'SQLite', category: SkillCategory.DATABASE, aliases: ['sqlite'] },

  // Cloud / DevOps
  { name: 'AWS', category: SkillCategory.CLOUD_DEVOPS, aliases: ['aws', 'amazon web services'] },
  { name: 'Google Cloud Platform', category: SkillCategory.CLOUD_DEVOPS, aliases: ['gcp', 'google cloud'] },
  { name: 'Microsoft Azure', category: SkillCategory.CLOUD_DEVOPS, aliases: ['azure'] },
  { name: 'Docker', category: SkillCategory.CLOUD_DEVOPS, aliases: ['docker'] },
  { name: 'Kubernetes', category: SkillCategory.CLOUD_DEVOPS, aliases: ['k8s', 'kubernetes', 'kube'] },
  { name: 'CI/CD', category: SkillCategory.CLOUD_DEVOPS, aliases: ['ci/cd', 'cicd', 'continuous integration'] },
  { name: 'Git', category: SkillCategory.TOOLS_PLATFORMS, aliases: ['git'] },
  { name: 'GitHub', category: SkillCategory.TOOLS_PLATFORMS, aliases: ['github'] },
  { name: 'Linux', category: SkillCategory.TOOLS_PLATFORMS, aliases: ['linux', 'ubuntu', 'bash'] },

  // AI / ML
  { name: 'Machine Learning', category: SkillCategory.AI_ML, aliases: ['ml', 'machine learning'] },
  { name: 'Deep Learning', category: SkillCategory.AI_ML, aliases: ['dl', 'deep learning'] },
  { name: 'Natural Language Processing', category: SkillCategory.AI_ML, aliases: ['nlp', 'natural language processing'] },
  { name: 'Computer Vision', category: SkillCategory.AI_ML, aliases: ['cv', 'computer vision'] },
  { name: 'Generative AI', category: SkillCategory.AI_ML, aliases: ['genai', 'generative ai', 'llm'] },

  // Data / Analytics
  { name: 'Data Analysis', category: SkillCategory.DATA_ANALYTICS, aliases: ['data analysis', 'data analytics'] },
  { name: 'Data Visualization', category: SkillCategory.DATA_ANALYTICS, aliases: ['data visualization', 'tableau', 'powerbi'] },
  { name: 'Statistics', category: SkillCategory.DATA_ANALYTICS, aliases: ['statistics', 'statistical analysis'] },

  // CS Fundamentals
  { name: 'Data Structures', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['dsa', 'data structures'] },
  { name: 'Algorithms', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['algorithms', 'algo'] },
  { name: 'Object-Oriented Programming', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['oops', 'oop', 'object oriented'] },
  { name: 'System Design', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['system design', 'hld', 'lld'] },
  { name: 'Operating Systems', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['os', 'operating systems'] },
  { name: 'Computer Networks', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['cn', 'networking', 'computer networks'] },
  { name: 'DBMS', category: SkillCategory.CS_FUNDAMENTALS, aliases: ['dbms', 'database management'] },

  // Soft Skills
  { name: 'Problem Solving', category: SkillCategory.SOFT_SKILLS, aliases: ['problem solving'] },
  { name: 'Team Collaboration', category: SkillCategory.SOFT_SKILLS, aliases: ['teamwork', 'team collaboration'] },
  { name: 'Communication', category: SkillCategory.SOFT_SKILLS, aliases: ['communication'] },
  { name: 'Leadership', category: SkillCategory.SOFT_SKILLS, aliases: ['leadership'] },
  { name: 'Agile', category: SkillCategory.DOMAIN_SKILLS, aliases: ['agile', 'scrum', 'kanban'] },
];

async function seedSkills() {
  console.log('🌱 Seeding skill taxonomy...');
  let count = 0;
  for (const skill of SKILL_TAXONOMY) {
    await prisma.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: { ...skill },
    });
    count++;
  }
  console.log(`   ✅ ${count} skills seeded`);
}

// ─────────────────────────────────────────────
// COMPANIES
// ─────────────────────────────────────────────

const COMPANIES = [
  {
    name: 'Infosys Limited',
    website: 'https://infosys.com',
    industry: 'Information Technology',
    description: 'Global leader in next-generation digital services and consulting.',
    location: 'Bengaluru, Karnataka',
    size: '10000+',
    isVerified: true,
  },
  {
    name: 'Wipro Technologies',
    website: 'https://wipro.com',
    industry: 'Information Technology',
    description: 'Leading global information technology, consulting and business process services company.',
    location: 'Bengaluru, Karnataka',
    size: '10000+',
    isVerified: true,
  },
  {
    name: 'Zoho Corporation',
    website: 'https://zoho.com',
    industry: 'Software Products',
    description: 'Indian multinational technology company that makes web-based business tools and SaaS.',
    location: 'Chennai, Tamil Nadu',
    size: '10000+',
    isVerified: true,
  },
  {
    name: 'Razorpay',
    website: 'https://razorpay.com',
    industry: 'FinTech',
    description: 'India\'s leading payment gateway and financial infrastructure company.',
    location: 'Bengaluru, Karnataka',
    size: '1000-5000',
    isVerified: true,
  },
  {
    name: 'Groww',
    website: 'https://groww.in',
    industry: 'FinTech',
    description: 'India\'s fastest growing investment platform for stocks, mutual funds and more.',
    location: 'Bengaluru, Karnataka',
    size: '500-2000',
    isVerified: true,
  },
];

// ─────────────────────────────────────────────
// JOBS
// ─────────────────────────────────────────────

const JOBS_TEMPLATE = [
  {
    title: 'Software Engineer — Backend',
    companyIndex: 0,
    description: `Infosys is hiring Software Engineers for backend development roles across various client projects.
You will be working on enterprise-grade distributed systems handling millions of transactions per day.

Responsibilities:
- Design and develop scalable RESTful APIs using Node.js or Java
- Work with PostgreSQL databases for data modeling
- Collaborate with frontend and DevOps teams
- Write unit tests and participate in code reviews
- Deploy on AWS cloud infrastructure

This is a campus placement role for the 2025 and 2026 batch.`,
    jobType: JobType.FULL_TIME,
    ctcMin: 4.5, ctcMax: 6.5,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering', 'Electronics & Communication'],
    minCgpa: 7.0,
    maxBacklogs: 0,
    allowedGraduationYears: [2025, 2026],
    requiredSkills: ['Node.js', 'REST API', 'PostgreSQL', 'JavaScript', 'Data Structures', 'Algorithms'],
    preferredSkills: ['AWS', 'Docker', 'TypeScript', 'System Design'],
    responsibilities: [
      'Design and develop scalable RESTful APIs',
      'Work with relational databases',
      'Participate in agile ceremonies',
      'Deploy and monitor cloud applications',
    ],
  },
  {
    title: 'Systems Engineer',
    companyIndex: 1,
    description: `Wipro is hiring Systems Engineers for infrastructure and backend roles.
You will work on enterprise IT systems for global clients across banking, healthcare, and retail.

Eligibility: CSE/ISE/ECE students with CGPA >= 7.0, no active backlogs.
Package: 3.5 LPA to 5 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 3.5, ctcMax: 5.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering', 'Electronics & Communication', 'Electrical Engineering'],
    minCgpa: 7.0,
    maxBacklogs: 0,
    allowedGraduationYears: [2025, 2026],
    requiredSkills: ['Java', 'SQL', 'Data Structures', 'Object-Oriented Programming'],
    preferredSkills: ['Linux', 'Python', 'DBMS', 'Computer Networks'],
    responsibilities: [
      'Support and maintain enterprise IT systems',
      'Write automation scripts',
      'Troubleshoot production issues',
    ],
  },
  {
    title: 'Product Engineer',
    companyIndex: 2,
    description: `Zoho is looking for Product Engineers who will own and build core product features end-to-end.
At Zoho, you will write code, ship products, and directly impact 80 million+ users worldwide.

We believe in meritocracy. Your code will be running in production within your first week.

Eligible: CSE/ISE/AI&DS with CGPA 8.0+. No backlogs. Batch 2025 only.
CTC: 8 LPA base + performance bonus`,
    jobType: JobType.FULL_TIME,
    ctcMin: 8.0, ctcMax: 10.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering', 'Artificial Intelligence & Data Science'],
    minCgpa: 8.0,
    maxBacklogs: 0,
    allowedGraduationYears: [2025],
    requiredSkills: ['Python', 'JavaScript', 'Data Structures', 'Algorithms', 'DBMS', 'Object-Oriented Programming'],
    preferredSkills: ['React.js', 'Node.js', 'PostgreSQL', 'System Design', 'Git'],
    responsibilities: [
      'Build and own product features from design to deployment',
      'Solve complex algorithmic challenges at scale',
      'Write clean, maintainable code with comprehensive tests',
    ],
  },
  {
    title: 'Software Development Engineer — Frontend',
    companyIndex: 3,
    description: `Razorpay is hiring talented frontend engineers for our payments and banking products.
You will build delightful, fast and accessible UIs for India's leading financial platform.

Required: Strong React.js fundamentals, TypeScript, performance optimization skills.
Eligibility: CSE/ISE. CGPA >= 8.0. 2025 batch only.
CTC: 14 LPA to 18 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 14.0, ctcMax: 18.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering'],
    minCgpa: 8.0,
    maxBacklogs: 0,
    allowedGraduationYears: [2025],
    requiredSkills: ['React.js', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'REST API'],
    preferredSkills: ['Next.js', 'Tailwind CSS', 'GraphQL', 'Performance Optimization', 'Testing'],
    responsibilities: [
      'Build user-facing features for payment products',
      'Ensure performance and accessibility',
      'Collaborate with design and backend teams',
      'Write component tests and E2E tests',
    ],
  },
  {
    title: 'Data Engineer',
    companyIndex: 4,
    description: `Groww is hiring Data Engineers to build the data infrastructure powering financial insights for 7M+ investors.

You will design and maintain ETL pipelines, data warehouses, and real-time processing systems.

Eligibility: CSE/ISE/AI&DS. CGPA >= 7.5. Batch 2025-2026.
CTC: 12-16 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 12.0, ctcMax: 16.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering', 'Artificial Intelligence & Data Science'],
    minCgpa: 7.5,
    maxBacklogs: 0,
    allowedGraduationYears: [2025, 2026],
    requiredSkills: ['Python', 'SQL', 'Data Analysis', 'PostgreSQL'],
    preferredSkills: ['Apache Spark', 'Kafka', 'AWS', 'Data Visualization', 'Statistics'],
    responsibilities: [
      'Build and maintain data pipelines',
      'Design data models for analytics',
      'Work with large-scale distributed systems',
    ],
  },
  {
    title: 'Machine Learning Engineer',
    companyIndex: 4,
    description: `Groww ML team is building the next generation of personalized financial recommendation systems.
Looking for ML engineers who can take models from research to production.

Eligibility: CSE/ISE/AI&DS. CGPA 8.0+. No backlogs. Batch 2025.
CTC: 16-22 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 16.0, ctcMax: 22.0,
    eligibleBranches: ['Computer Science & Engineering', 'Artificial Intelligence & Data Science', 'Information Science & Engineering'],
    minCgpa: 8.0,
    maxBacklogs: 0,
    allowedGraduationYears: [2025],
    requiredSkills: ['Python', 'Machine Learning', 'scikit-learn', 'Pandas', 'NumPy', 'Statistics'],
    preferredSkills: ['TensorFlow', 'PyTorch', 'Deep Learning', 'Natural Language Processing', 'AWS'],
    responsibilities: [
      'Build and deploy ML models at scale',
      'A/B test model improvements',
      'Work with large datasets for training',
    ],
  },
  {
    title: 'Software Engineer Intern',
    companyIndex: 0,
    description: `Infosys Summer Internship Program 2025.
6-month internship with stipend and PPO opportunity.
Eligible: 7th semester students (CSE/ISE) with CGPA 7.0+.`,
    jobType: JobType.INTERNSHIP,
    ctcMin: 1.5, ctcMax: 2.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering'],
    minCgpa: 7.0,
    maxBacklogs: 1,
    allowedGraduationYears: [2026],
    requiredSkills: ['JavaScript', 'Data Structures', 'SQL'],
    preferredSkills: ['React.js', 'Node.js', 'Git'],
    responsibilities: ['Work on real features', 'Participate in agile sprints', 'Learn cloud deployment'],
  },
  {
    title: 'DevOps Engineer',
    companyIndex: 3,
    description: `Razorpay DevOps team ensures our payment infrastructure runs at 99.99% uptime.
Looking for engineers passionate about reliability, automation, and cloud.

Eligibility: CSE/ISE. CGPA 7.5+. Batch 2025.
CTC: 12-16 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 12.0, ctcMax: 16.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering'],
    minCgpa: 7.5,
    maxBacklogs: 0,
    allowedGraduationYears: [2025],
    requiredSkills: ['Docker', 'Kubernetes', 'Linux', 'CI/CD', 'AWS'],
    preferredSkills: ['Python', 'Terraform', 'Monitoring', 'Git', 'Bash'],
    responsibilities: ['Manage Kubernetes clusters', 'Build CI/CD pipelines', 'Monitor and alert on production'],
  },
  {
    title: 'Full Stack Developer',
    companyIndex: 2,
    description: `Zoho is looking for full stack developers who can build complete products independently.
CSE/ISE. CGPA 8.5+. No backlogs. Batch 2025 only.
CTC: 9-12 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 9.0, ctcMax: 12.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering'],
    minCgpa: 8.5,
    maxBacklogs: 0,
    allowedGraduationYears: [2025],
    requiredSkills: ['JavaScript', 'React.js', 'Node.js', 'PostgreSQL', 'REST API', 'HTML', 'CSS'],
    preferredSkills: ['TypeScript', 'Docker', 'Redis', 'System Design', 'Testing'],
    responsibilities: ['Build end-to-end features', 'Design APIs and databases', 'Ship products'],
  },
  {
    title: 'Android Developer',
    companyIndex: 3,
    description: `Razorpay Android team builds the payment SDK used by 10M+ apps in India.
Strong Android + Java/Kotlin skills required.
CSE/ISE. CGPA 8.0+. Batch 2025. CTC: 14-18 LPA`,
    jobType: JobType.FULL_TIME,
    ctcMin: 14.0, ctcMax: 18.0,
    eligibleBranches: ['Computer Science & Engineering', 'Information Science & Engineering'],
    minCgpa: 8.0,
    maxBacklogs: 0,
    allowedGraduationYears: [2025],
    requiredSkills: ['Java', 'Android Development', 'REST API', 'Data Structures', 'Object-Oriented Programming'],
    preferredSkills: ['Kotlin', 'MVVM', 'Jetpack Compose', 'Git', 'Firebase'],
    responsibilities: ['Build Android SDK features', 'Ensure SDK performance and stability', 'Write unit tests'],
  },
];

// ─────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────

const STUDENTS = [
  {
    email: 'ravi.kumar@dsu.edu.in',
    firstName: 'Ravi', lastName: 'Kumar',
    phone: '+919876543210',
    usn: '1DS21CS001',
    department: 'Computer Science & Engineering',
    semester: 7,
    yearOfAdmission: 2021,
    expectedGraduationYear: 2025,
    cgpa: 8.9,
    activeBacklogs: 0, totalBacklogs: 0,
    tenthPercentage: 95.2,
    twelfthPercentage: 91.0,
    linkedinUrl: 'https://linkedin.com/in/ravikumar',
    githubUrl: 'https://github.com/ravikumar',
    gender: Gender.MALE,
    projects: [
      {
        title: 'AI-Powered Resume Parser',
        description: 'Built a full-stack web application that uses OpenAI GPT-4 to parse and analyze resumes. Implemented REST APIs using Node.js and Express with MongoDB for storage. The system extracts structured data from PDF/DOCX resumes with 95% accuracy.',
        techStack: ['Node.js', 'Express.js', 'MongoDB', 'React.js', 'OpenAI API', 'PDF.js'],
        repoUrl: 'https://github.com/ravikumar/ai-resume-parser',
        highlights: ['Achieved 95% extraction accuracy', 'Processed 1000+ resumes in beta', 'Reduced manual review time by 70%'],
      },
      {
        title: 'Distributed Task Queue',
        description: 'Implemented a distributed task queue system using Redis and Node.js. Supports priority queues, delayed tasks, job retries, and real-time monitoring dashboard.',
        techStack: ['Node.js', 'Redis', 'TypeScript', 'WebSocket', 'PostgreSQL'],
        repoUrl: 'https://github.com/ravikumar/task-queue',
        highlights: ['Handles 10K+ tasks/second', 'Built monitoring dashboard with real-time updates'],
      },
    ],
    certifications: [
      { name: 'AWS Certified Developer – Associate', issuingOrganization: 'Amazon Web Services', credentialId: 'AWS-DEV-2024' },
      { name: 'Meta Frontend Developer Professional Certificate', issuingOrganization: 'Coursera / Meta', credentialId: 'META-FE-2024' },
    ],
    achievements: [
      { type: AchievementType.HACKATHON, title: 'Smart India Hackathon 2024 — Finalist', description: 'Built an AI-based crop disease detection system using Computer Vision for 5 lakh farmers. Reached national finals.', organization: 'Ministry of Education, GOI', position: 'Finalist' },
      { type: AchievementType.INTERNSHIP, title: 'Software Engineering Intern — Infosys', description: 'Worked on backend APIs for Infosys Finacle banking platform. Implemented 15 REST API endpoints in Java Spring Boot.', organization: 'Infosys', startDate: '2024-05-01', endDate: '2024-07-31' },
    ],
    skills: [
      { name: 'JavaScript', confidence: SkillConfidence.HIGH },
      { name: 'Node.js', confidence: SkillConfidence.HIGH },
      { name: 'React.js', confidence: SkillConfidence.HIGH },
      { name: 'TypeScript', confidence: SkillConfidence.HIGH },
      { name: 'MongoDB', confidence: SkillConfidence.HIGH },
      { name: 'PostgreSQL', confidence: SkillConfidence.MEDIUM },
      { name: 'Redis', confidence: SkillConfidence.HIGH },
      { name: 'AWS', confidence: SkillConfidence.HIGH },
      { name: 'REST API', confidence: SkillConfidence.HIGH },
      { name: 'Docker', confidence: SkillConfidence.MEDIUM },
      { name: 'Data Structures', confidence: SkillConfidence.HIGH },
      { name: 'Algorithms', confidence: SkillConfidence.HIGH },
    ],
  },
  {
    email: 'priya.sharma@dsu.edu.in',
    firstName: 'Priya', lastName: 'Sharma',
    phone: '+919876543211',
    usn: '1DS21AI002',
    department: 'Artificial Intelligence & Data Science',
    semester: 7,
    yearOfAdmission: 2021,
    expectedGraduationYear: 2025,
    cgpa: 9.2,
    activeBacklogs: 0, totalBacklogs: 0,
    tenthPercentage: 97.4,
    twelfthPercentage: 94.0,
    gender: Gender.FEMALE,
    linkedinUrl: 'https://linkedin.com/in/priyasharma',
    githubUrl: 'https://github.com/priyasharma',
    projects: [
      {
        title: 'Sentiment Analysis Platform for Product Reviews',
        description: 'Developed an NLP-based sentiment analysis system using BERT transformers to classify product reviews with 92% accuracy. Deployed as a FastAPI service with React dashboard for real-time analysis of 10K+ reviews/hour.',
        techStack: ['Python', 'PyTorch', 'BERT', 'FastAPI', 'React.js', 'PostgreSQL', 'Docker'],
        highlights: ['92% classification accuracy on Amazon dataset', 'Real-time processing of 10K reviews/hour', 'Published methodology at IEEE ICACCI 2024'],
      },
      {
        title: 'Stock Price Prediction using LSTM',
        description: 'Built LSTM-based model for stock price prediction using NSE historical data. Used technical indicators as features with data preprocessing pipeline in Pandas.',
        techStack: ['Python', 'TensorFlow', 'Pandas', 'NumPy', 'scikit-learn', 'Matplotlib'],
        highlights: ['Achieved RMSE of 2.3% on test set', 'Analyzed 5 years of NIFTY50 data'],
      },
    ],
    certifications: [
      { name: 'TensorFlow Developer Certificate', issuingOrganization: 'Google', credentialId: 'TF-2024-001' },
      { name: 'IBM Data Science Professional Certificate', issuingOrganization: 'Coursera / IBM', credentialId: 'IBM-DS-2024' },
      { name: 'AWS Machine Learning Specialty', issuingOrganization: 'Amazon Web Services', credentialId: 'AWS-ML-2024' },
    ],
    achievements: [
      { type: AchievementType.RESEARCH_PAPER, title: 'Published: Transformer-based Sentiment Analysis at IEEE ICACCI 2024', description: 'Co-authored research paper on efficient transformer fine-tuning for sentiment analysis. Accepted at IEEE ICACCI 2024.', organization: 'IEEE' },
      { type: AchievementType.AWARD, title: 'Best Project Award — AI&DS Department 2024', description: 'Awarded best final year project in the AI&DS department for sentiment analysis platform.', organization: 'DSU' },
    ],
    skills: [
      { name: 'Python', confidence: SkillConfidence.HIGH },
      { name: 'Machine Learning', confidence: SkillConfidence.HIGH },
      { name: 'Deep Learning', confidence: SkillConfidence.HIGH },
      { name: 'Natural Language Processing', confidence: SkillConfidence.HIGH },
      { name: 'TensorFlow', confidence: SkillConfidence.HIGH },
      { name: 'PyTorch', confidence: SkillConfidence.HIGH },
      { name: 'Pandas', confidence: SkillConfidence.HIGH },
      { name: 'NumPy', confidence: SkillConfidence.HIGH },
      { name: 'scikit-learn', confidence: SkillConfidence.HIGH },
      { name: 'FastAPI', confidence: SkillConfidence.HIGH },
      { name: 'PostgreSQL', confidence: SkillConfidence.MEDIUM },
      { name: 'Docker', confidence: SkillConfidence.MEDIUM },
      { name: 'AWS', confidence: SkillConfidence.HIGH },
    ],
  },
  {
    email: 'arjun.nair@dsu.edu.in',
    firstName: 'Arjun', lastName: 'Nair',
    usn: '1DS21CS015',
    department: 'Computer Science & Engineering',
    semester: 7,
    yearOfAdmission: 2021,
    expectedGraduationYear: 2025,
    cgpa: 8.1,
    activeBacklogs: 0, totalBacklogs: 0,
    tenthPercentage: 88.0,
    twelfthPercentage: 84.5,
    gender: Gender.MALE,
    githubUrl: 'https://github.com/arjunnair',
    projects: [
      {
        title: 'E-Commerce Platform with Microservices',
        description: 'Built a scalable e-commerce platform using microservices architecture. API Gateway, Auth service, Product service, and Order service deployed with Docker and Kubernetes on AWS EKS.',
        techStack: ['Node.js', 'TypeScript', 'Docker', 'Kubernetes', 'PostgreSQL', 'Redis', 'AWS EKS', 'React.js'],
        highlights: ['Handles 5K concurrent users', 'Zero downtime deployments with K8s rolling updates'],
      },
    ],
    certifications: [
      { name: 'Certified Kubernetes Administrator (CKA)', issuingOrganization: 'CNCF', credentialId: 'CKA-2024' },
    ],
    achievements: [
      { type: AchievementType.HACKATHON, title: 'HackDSU 2024 — 1st Place', description: 'Won first place in the college hackathon with a real-time traffic management system using ML.', organization: 'DSU', position: '1st Place' },
    ],
    skills: [
      { name: 'TypeScript', confidence: SkillConfidence.HIGH },
      { name: 'Node.js', confidence: SkillConfidence.HIGH },
      { name: 'Docker', confidence: SkillConfidence.HIGH },
      { name: 'Kubernetes', confidence: SkillConfidence.HIGH },
      { name: 'AWS', confidence: SkillConfidence.HIGH },
      { name: 'PostgreSQL', confidence: SkillConfidence.HIGH },
      { name: 'Redis', confidence: SkillConfidence.HIGH },
      { name: 'React.js', confidence: SkillConfidence.MEDIUM },
      { name: 'CI/CD', confidence: SkillConfidence.HIGH },
      { name: 'System Design', confidence: SkillConfidence.HIGH },
    ],
  },
  {
    email: 'sneha.patel@dsu.edu.in',
    firstName: 'Sneha', lastName: 'Patel',
    usn: '1DS21CS022',
    department: 'Computer Science & Engineering',
    semester: 7,
    yearOfAdmission: 2021,
    expectedGraduationYear: 2025,
    cgpa: 9.4,
    activeBacklogs: 0, totalBacklogs: 0,
    tenthPercentage: 98.2,
    twelfthPercentage: 96.5,
    gender: Gender.FEMALE,
    linkedinUrl: 'https://linkedin.com/in/snehapatel',
    githubUrl: 'https://github.com/snehapatel',
    projects: [
      {
        title: 'DSU Campus Connect — Full Stack App',
        description: 'Developed a React Native + Node.js mobile app for campus announcements and events. Used Firebase for real-time updates and push notifications. 2000+ student users.',
        techStack: ['React Native', 'Node.js', 'Firebase', 'PostgreSQL', 'REST API', 'TypeScript'],
        highlights: ['2000+ active student users', 'Push notification system reaching 99% delivery'],
      },
    ],
    certifications: [
      { name: 'Google Associate Android Developer', issuingOrganization: 'Google', credentialId: 'AAD-2024' },
      { name: 'React Developer Certification', issuingOrganization: 'freeCodeCamp' },
    ],
    achievements: [
      { type: AchievementType.CLUB_LEADERSHIP, title: 'Technical Head — CodeClub DSU', description: 'Led the college programming club, organized 10+ workshops, mentored 50+ juniors on DSA and competitive programming.', organization: 'DSU CodeClub' },
    ],
    skills: [
      { name: 'JavaScript', confidence: SkillConfidence.HIGH },
      { name: 'TypeScript', confidence: SkillConfidence.HIGH },
      { name: 'React.js', confidence: SkillConfidence.HIGH },
      { name: 'Node.js', confidence: SkillConfidence.HIGH },
      { name: 'Firebase', confidence: SkillConfidence.HIGH },
      { name: 'PostgreSQL', confidence: SkillConfidence.HIGH },
      { name: 'REST API', confidence: SkillConfidence.HIGH },
      { name: 'Data Structures', confidence: SkillConfidence.HIGH },
      { name: 'Algorithms', confidence: SkillConfidence.HIGH },
      { name: 'HTML', confidence: SkillConfidence.HIGH },
      { name: 'CSS', confidence: SkillConfidence.HIGH },
      { name: 'Tailwind CSS', confidence: SkillConfidence.HIGH },
    ],
  },
  {
    email: 'kiran.rao@dsu.edu.in',
    firstName: 'Kiran', lastName: 'Rao',
    usn: '1DS21IS005',
    department: 'Information Science & Engineering',
    semester: 7,
    yearOfAdmission: 2021,
    expectedGraduationYear: 2025,
    cgpa: 7.6,
    activeBacklogs: 1, totalBacklogs: 2,
    tenthPercentage: 80.4,
    twelfthPercentage: 76.0,
    gender: Gender.MALE,
    githubUrl: 'https://github.com/kiranrao',
    projects: [
      {
        title: 'Student Attendance Management System',
        description: 'Built a web-based attendance system with face recognition using Python OpenCV. Teachers can mark attendance via webcam with 90% accuracy. Django backend with MySQL.',
        techStack: ['Python', 'Django', 'OpenCV', 'MySQL', 'HTML', 'CSS', 'JavaScript'],
        highlights: ['90% face recognition accuracy', 'Deployed in 3 classrooms at DSU'],
      },
    ],
    certifications: [
      { name: 'Python for Data Science', issuingOrganization: 'Coursera / IBM' },
    ],
    achievements: [
      { type: AchievementType.WORKSHOP, title: 'AWS Cloud Foundations Workshop', description: 'Completed 2-day intensive workshop on AWS fundamentals.', organization: 'AWS Educate' },
    ],
    skills: [
      { name: 'Python', confidence: SkillConfidence.HIGH },
      { name: 'Django', confidence: SkillConfidence.HIGH },
      { name: 'MySQL', confidence: SkillConfidence.HIGH },
      { name: 'Computer Vision', confidence: SkillConfidence.MEDIUM },
      { name: 'HTML', confidence: SkillConfidence.HIGH },
      { name: 'CSS', confidence: SkillConfidence.HIGH },
      { name: 'JavaScript', confidence: SkillConfidence.MEDIUM },
      { name: 'SQL', confidence: SkillConfidence.HIGH },
    ],
  },
];

// ─────────────────────────────────────────────
// MAIN SEED FUNCTION
// ─────────────────────────────────────────────

async function main() {
  console.log('\n🌱 DSU CareerBridge Seed Script\n');

  // Clean existing data (dev only)
  await prisma.$executeRaw`TRUNCATE TABLE audit_logs, notifications, shortlists, applications, match_results, student_skills, resume_sections, resumes, certifications, projects, achievements, job_skills, jobs, companies, recruiter_profiles, admin_profiles, student_profiles, users, skills RESTART IDENTITY CASCADE;`;
  console.log('🗑️  Cleaned existing data');

  // 1. Seed skills
  await seedSkills();

  // 2. Create admin
  const adminPassword = demoPassword('SEED_ADMIN_PASSWORD');
  const adminHash = await bcrypt.hash(adminPassword, 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@dsu.edu.in',
      passwordHash: adminHash,
      role: Role.ADMIN,
      isVerified: true,
      adminProfile: {
        create: {
          firstName: 'Placement',
          lastName: 'Cell Admin',
          department: 'Placement Cell',
          designation: 'Placement Coordinator',
        },
      },
    },
  });
  console.log(`\n👤 Admin created: admin@dsu.edu.in (Password: ${adminPassword})`);

  // 3. Create companies + recruiters
  const recruiterPassword = demoPassword('SEED_RECRUITER_PASSWORD');
  const companyRecords: Awaited<ReturnType<typeof prisma.company.create>>[] = [];
  for (const companyData of COMPANIES) {
    const company = await prisma.company.create({ data: companyData });
    companyRecords.push(company);

    const hash = await bcrypt.hash(recruiterPassword, 12);
    await prisma.user.create({
      data: {
        email: `recruiter@${company.name.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        passwordHash: hash,
        role: Role.RECRUITER,
        isVerified: true,
        recruiterProfile: {
          create: {
            firstName: 'HR',
            lastName: `Team ${company.name.split(' ')[0]}`,
            designation: 'Campus Recruiter',
            companyId: company.id,
          },
        },
      },
    });
  }
  console.log(`🏢 ${companyRecords.length} companies + recruiters created`);

  // 4. Create jobs
  const jobRecords: Awaited<ReturnType<typeof prisma.job.create>>[] = [];
  for (const jobTemplate of JOBS_TEMPLATE) {
    const company = companyRecords[jobTemplate.companyIndex];
    const { companyIndex, requiredSkills, preferredSkills, responsibilities, ...jobData } = jobTemplate;

    const job = await prisma.job.create({
      data: {
        ...jobData,
        companyId: company.id,
        status: JobStatus.OPEN,
        rawJdText: jobData.description,
        responsibilities: responsibilities || [],
      },
    });

    // Add skills
    for (const skillName of requiredSkills) {
      const skill = await prisma.skill.findFirst({ where: { name: { equals: skillName, mode: 'insensitive' } } });
      if (skill) {
        await prisma.jobSkill.create({ data: { jobId: job.id, skillId: skill.id, type: 'REQUIRED', importance: 8 } });
      }
    }
    for (const skillName of preferredSkills) {
      const skill = await prisma.skill.findFirst({ where: { name: { equals: skillName, mode: 'insensitive' } } });
      if (skill) {
        await prisma.jobSkill.create({ data: { jobId: job.id, skillId: skill.id, type: 'PREFERRED', importance: 5 } });
      }
    }

    jobRecords.push(job);
  }
  console.log(`💼 ${jobRecords.length} jobs created`);

  // 5. Create students
  const studentPassword = demoPassword('SEED_STUDENT_PASSWORD');
  for (const studentData of STUDENTS) {
    const { projects, certifications, achievements, skills, ...profileData } = studentData;
    const hash = await bcrypt.hash(studentPassword, 12);

    const user = await prisma.user.create({
      data: {
        email: profileData.email,
        passwordHash: hash,
        role: Role.STUDENT,
        isVerified: true,
        studentProfile: {
          create: {
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phone: profileData.phone,
            usn: profileData.usn,
            department: profileData.department,
            semester: profileData.semester,
            yearOfAdmission: profileData.yearOfAdmission,
            expectedGraduationYear: profileData.expectedGraduationYear,
            cgpa: profileData.cgpa,
            activeBacklogs: profileData.activeBacklogs,
            totalBacklogs: profileData.totalBacklogs,
            tenthPercentage: profileData.tenthPercentage,
            twelfthPercentage: profileData.twelfthPercentage,
            linkedinUrl: profileData.linkedinUrl,
            githubUrl: profileData.githubUrl,
            gender: profileData.gender,
            profileCompleteness: 85,
          },
        },
      },
      include: { studentProfile: true },
    });

    const profile = user.studentProfile!;

    // Create projects
    for (const proj of projects) {
      await prisma.project.create({
        data: { studentProfileId: profile.id, ...proj },
      });
    }

    // Create certifications
    for (const cert of certifications) {
      await prisma.certification.create({
        data: { studentProfileId: profile.id, ...cert, inferredSkills: [] },
      });
    }

    // Create achievements
    for (const ach of achievements) {
      const { startDate, endDate, ...achRest } = ach as any;
      await prisma.achievement.create({
        data: {
          studentProfileId: profile.id,
          ...achRest,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
        },
      });
    }

    // Add skills
    for (const skillData of skills) {
      const skill = await prisma.skill.findFirst({
        where: { name: { equals: skillData.name, mode: 'insensitive' } },
      });
      if (skill) {
        await prisma.studentSkill.create({
          data: {
            studentProfileId: profile.id,
            skillId: skill.id,
            confidence: skillData.confidence,
            source: 'seed',
          },
        });
      }
    }
  }
  console.log(`🎓 ${STUDENTS.length} students created`);

  // 6. Create a few applications
  const allStudents = await prisma.studentProfile.findMany({ take: 5 });
  for (let i = 0; i < Math.min(3, jobRecords.length); i++) {
    const job = jobRecords[i];
    for (const student of allStudents.slice(0, 3)) {
      try {
        await prisma.application.create({
          data: {
            studentProfileId: student.id,
            jobId: job.id,
            status: ApplicationStatus.APPLIED,
          },
        });
      } catch {
        // ignore duplicates
      }
    }
  }
  console.log('📝 Sample applications created');

  console.log('\n✅ Seed complete!\n');
  console.log('📋 Demo credentials (this run only, not stored anywhere else):');
  console.log(`   Admin:     admin@dsu.edu.in / ${adminPassword}`);
  console.log(`   Students:  ravi.kumar@dsu.edu.in / ${studentPassword}`);
  console.log(`             priya.sharma@dsu.edu.in / ${studentPassword}`);
  console.log(`   Recruiter: recruiter@infosyslimited.com / ${recruiterPassword}`);
  console.log('\n⚠️  Set SEED_ADMIN_PASSWORD / SEED_RECRUITER_PASSWORD / SEED_STUDENT_PASSWORD');
  console.log('   before seeding any publicly-reachable deployment.\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
