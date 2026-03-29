# Training Grounds — MMA Gym Retention App

## Project Overview
Training Grounds is a mobile-first retention platform for multi-discipline MMA gyms. It uses gamification (Duolingo-style streaks, XP, badges), Whoop-inspired training analytics, Discord-like community channels, a referral program, video library, session journaling, and coach tools to drive member engagement and reduce churn.

Full architecture: @docs/ARCHITECTURE.md
System diagram: @docs/system-diagram.mermaid
Screen prototype: @docs/prototype.jsx

## Tech Stack
- **Frontend**: React Native + Expo (TypeScript), React Navigation, Redux Toolkit
- **Backend**: NestJS (TypeScript), TypeORM, PostgreSQL 15, Redis
- **Real-time**: Socket.io (chat, notifications, leaderboard updates, presence)
- **Media**: AWS S3 + CloudFront CDN (photos, videos, rolling footage)
- **Auth**: Firebase Auth (JWT + OAuth2 social login)
- **Push**: Firebase Cloud Messaging
- **Queue**: BullMQ + Redis (async XP calc, badge triggers, video transcoding)
- **Search**: Elasticsearch (video library, content search)
- **Infra**: Docker, AWS ECS/Fargate (prod), Railway (MVP)

## Monorepo Structure
```
packages/
  backend/     — NestJS API server
  frontend/    — React Native + Expo app
  shared/      — Shared TypeScript types, utils, constants
scripts/       — Dev tooling, migrations, seed data
docs/          — Architecture doc, prototype, diagrams
```

## Build & Run Commands
- Install all: `npm install` (workspaces)
- Backend dev: `cd packages/backend && npm run start:dev`
- Frontend dev: `cd packages/frontend && npx expo start`
- Run all tests: `npm test`
- Backend tests: `cd packages/backend && npm test`
- Lint: `npm run lint`
- DB migrate: `cd packages/backend && npm run typeorm migration:run`
- DB seed: `cd packages/backend && npm run seed`

## Code Standards
- **Language**: TypeScript strict mode, no `any`
- **Indentation**: 2 spaces
- **Imports**: ES modules (import/export), absolute paths via `@/` alias
- **Naming**: camelCase (functions/variables), PascalCase (components/classes/interfaces), UPPER_SNAKE (constants)
- **Components**: Functional components with hooks only, no class components
- **State**: Redux Toolkit for global state, useState for local
- **Errors**: Custom AppError class for HTTP errors, consistent error response format
- **Commits**: Conventional commits — `feat(backend): add attendance endpoint`

## Architecture Patterns

### Backend (NestJS)
- **Modules**: Each feature is a NestJS module (auth, gamification, attendance, referral, community, video, journal, coach, content, profile, notification)
- **Flow**: Controller (HTTP routing) → Service (business logic) → Repository (data access)
- **DTOs**: Always validate input with class-validator DTOs
- **Guards**: JwtAuthGuard for protected routes, RolesGuard for coach-only endpoints
- **Entities**: TypeORM entities in `packages/backend/src/entities/`
- **Migrations**: Always create a migration before schema changes

### Frontend (React Native)
- **Navigation**: React Navigation with typed routes in `app/navigation/`
- **Screens**: One file per screen in `app/screens/`
- **Components**: Reusable UI in `app/components/`, feature-specific in screen folders
- **Hooks**: Custom hooks in `app/hooks/` (useAuth, useStreak, useWebSocket, etc.)
- **Redux**: Slices in `app/redux/slices/`, async thunks for API calls
- **Styling**: StyleSheet.create with brand tokens from `shared/src/theme.ts`

### Shared Package
- **Types**: All shared TypeScript interfaces/enums in `packages/shared/src/types/`
- **Theme**: Brand colors, fonts, spacing tokens in `packages/shared/src/theme.ts`
- **Utils**: Shared utility functions (date formatting, XP calculations, etc.)

## Brand Theme
All UI must match the Training Grounds website:
- **Colors**: Charcoal #1E1E1E, Dark Grey #2A2A2A, Warm Gold #C9A87C, Steel #B0B5B8, Off-White #FAFAF8, Soft White #F7F5F2
- **Fonts**: Bebas Neue (headings), Inter (body)
- **Style**: Dark premium aesthetic, warm gold accents, subtle borders (rgba(255,255,255,0.06)), border-radius 14px on cards, 6px on buttons

## Database
- PostgreSQL with 21+ tables — see full schema in @docs/ARCHITECTURE.md Section 4
- Key entities: Users, Attendance, Classes, Badges, UserBadges, Streaks, Referrals, Rewards, Channels, Messages, Reactions, Leaderboards, TrainingLogs, Videos, JournalEntries, Goals, SkillTracking, ClassPlans, CoachTemplates, StudyMaterials
- Always add indexes for frequently queried columns
- Use transactions for multi-step operations (XP + badge + streak updates)

## Core Feature Modules
1. **Auth & Profiles** — JWT auth, social login, role-based access (member/coach/admin)
2. **Gamification Engine** — XP system, streaks with freezes, badges, leaderboards with leagues
3. **Attendance** — QR/NFC check-in, training load scoring, weekly/monthly reports
4. **Referral Program** — Pipeline tracking (Invited→Trial→SignedUp→Active30), tiered rewards
5. **Community Hub** — Discord-style channels, threads, reactions, media uploads
6. **Video Library** — Upload, transcode, categorize (demos, rounds, insights, highlights)
7. **Journal** — Prompted post-session reflections, coach review with permission
8. **Progress Tracking** — Skill radar, session logs, goals, belt/stripe progression
9. **Coaches Corner** — Session planner, game builder, class templates, student journal review
10. **Content** — Class plans, study materials, curriculum management
11. **Notifications** — Push, email, in-app streak reminders and social triggers

## MVP Phasing
- **Phase 1 (Month 1-2)**: Auth, profiles, attendance check-in, basic XP/streaks, push notifications
- **Phase 2 (Month 3-4)**: Full badges, leaderboards, referral program, progress tracking, journal
- **Phase 3 (Month 5-6)**: Community hub, video library, class plans, coaches corner
- **Phase 4 (Month 7+)**: Advanced analytics, wearable integrations, voice channels

## Important Notes
- When modifying shared types, update `packages/shared/` FIRST, then backend, then frontend
- Database schema changes always need a migration before code changes
- Always run tests before committing: `npm test`
- WebSocket events must be documented in `docs/websocket-events.md`
- Media uploads go through S3 pre-signed URLs — never accept binary in the API directly
