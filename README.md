# TrainHub — GP Bookkeeper Training Platform

An internal training platform built for the GP Bookkeeper team (~30 members across 3 pods).

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Auth & Database**: Supabase (PostgreSQL + Auth)
- **Editor**: TipTap rich text with inline video embeds (Loom, YouTube, Tango, Scribe, Google Drive)
- **AI Assistant**: Anthropic Claude with Knowledge Base context injection
- **Deployment**: Netlify

## Features

- Training Library — modules → topics → steps
- Rich text editor with inline image & video embedding
- Quiz builder with pass/fail grading
- Per-module access control (Manage Access)
- Knowledge Base — admin uploads SOPs/guides used as AI context
- AI Assistant (Ctrl+K) — answers questions using uploaded documents
- User progress tracking & completion rates
- Admin/User view toggle
- Google OAuth login

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:3000
