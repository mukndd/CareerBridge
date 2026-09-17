# DSU CareerBridge

A full-stack campus placement platform built for Dayananda Sagar University: separate student, recruiter, and admin flows (browsing/posting jobs, applications, shortlisting, resume/profile management) plus an OpenAI-assisted layer that scores and ranks candidate-to-job fit instead of a plain keyword match.

The matching approach is written up in more depth in [`phase2-paper.pdf`](./phase2-paper.pdf), a co-authored paper (with Senthilnathan R and Anshul Hiremath, supervised by Dr. Sudha D and Dr. Ramandeep Kaur) on a talent-first, fairness-aware scoring framework that caps GPA's influence on a candidate's rank and applies a bonus for high-talent/low-GPA profiles.

## What I built

This repository's implementation (backend, frontend, database schema, seed data, and the OpenAI-assisted matching integration) was written solely by me: the git history here is 100% mine. The underlying scoring approach it implements was designed collaboratively as a three-person academic project with a formally co-authored paper; I'm crediting my collaborators here rather than presenting the whole thing as a solo idea, even though the code itself is not shared with anyone else.

## Structure

```
dsu-careerbridge/
├── backend/    # NestJS + PostgreSQL + Prisma + Redis + OpenAI
└── frontend/   # React + Vite + TypeScript + Tailwind + TanStack Query
```

## Backend

```bash
cd backend
npm install
# Copy .env.example to .env and fill in values
npm run prisma:migrate
npm run seed
npm run start:dev
```

Runs on **http://localhost:3000**, API prefix: `/api/v1`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:5173**, proxies `/api` to `http://localhost:3000`

## Demo accounts

`npm run seed` creates one Admin, a few Recruiter, and a few Student accounts with a password generated fresh for that run and printed once to the console, not committed anywhere. For a shared/public deployment, set `SEED_ADMIN_PASSWORD`, `SEED_RECRUITER_PASSWORD`, and `SEED_STUDENT_PASSWORD` before seeding so the login isn't a predictable, publicly-documented value. See `backend/prisma/seed.ts`.

If you're looking at a live demo of this and it still logs in with a password that was ever published in this README's git history, that credential is stale and needs rotating, not reused.
