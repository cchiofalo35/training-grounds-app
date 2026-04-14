---
paths:
  - "packages/backend/**/*.ts"
---

# Backend Development Rules (NestJS — Multi-Tenant)

## Multi-Tenant Rule (CRITICAL)
Every service method that reads or writes tenant-scoped data MUST accept `gymId` as its first parameter. Every repository query on tenant-scoped tables MUST include `gymId` in the WHERE clause. Missing a gymId filter is a **data leak**.

```typescript
// CORRECT:
async findByUser(gymId: string, userId: string) {
  return this.repo.find({ where: { gymId, userId } });
}

// WRONG — leaks data across gyms:
async findByUser(userId: string) {
  return this.repo.find({ where: { userId } });
}
```

Gym-scoped tables: attendance, badges, user_badges, channels, messages, reactions, class_schedules, courses, journal_entries, quests, user_quests, streaks, leaderboards, referrals, videos, goals, class_plans.

Global tables (no gymId needed): users, gyms, gym_memberships.

## Request Flow
```
Request → TenantMiddleware (resolves gymId) → FirebaseAuthGuard → RolesGuard → Controller → Service → Repository
```
- `req.gymId` is available in every controller after TenantMiddleware runs
- `req.gym` contains the full gym entity (id, slug, name, config flags)
- Controllers pass `req.gymId` to service methods

## Module Structure
Every feature follows this pattern:
```
packages/backend/src/modules/{feature}/
  {feature}.module.ts      — NestJS module with providers/imports
  {feature}.controller.ts  — HTTP routes, validation, guards
  {feature}.service.ts     — Business logic, always gymId-scoped
  {feature}.entity.ts      — TypeORM entity with gymId column
  {feature}.dto.ts         — Request/response DTOs with class-validator
  {feature}.spec.ts        — Unit tests (include cross-tenant test cases)
  {feature}.e2e-spec.ts    — Integration tests
```

## Controller Rules
- Controllers ONLY handle HTTP routing — no business logic
- Always use `@UseGuards(FirebaseAuthGuard)` on protected routes
- Coach-only routes use `@Roles('coach', 'admin')` + `@UseGuards(RolesGuard)`
- Validate all input with DTOs: `@Body() dto: CreateClassDto`
- Pass `req.gymId` to every service call: `this.service.findAll(req.gymId, ...)`
- Return consistent response format: `{ success: true, data: {...} }`
- Use proper HTTP status codes (201 for creation, 204 for deletion)

## Service Rules
- Tenant-scoped services extend `BaseTenantService<T>`
- First parameter of every method is `gymId: string`
- Use dependency injection: `constructor(private readonly userService: UserService)`
- Throw custom `AppException` for errors (not raw HTTP exceptions)
- Use transactions for multi-entity operations (e.g., check-in + XP + streak update)
- Emit events for async processing: `this.eventEmitter.emit('attendance.checkin', { gymId, ...payload })`

## Entity Rules
- All entities extend `BaseEntity` with id, createdAt, updatedAt
- Tenant-scoped entities MUST have: `@Column() @Index() gymId: string`
- Use UUID for primary keys: `@PrimaryGeneratedColumn('uuid')`
- Add `@Index()` on frequently queried columns
- Add composite index on `(gymId, userId)` or `(gymId, createdAt)` for common queries
- Define relationships explicitly with `@ManyToOne`, `@OneToMany`, etc.
- Soft delete for user-facing data: `@DeleteDateColumn()`

## DTO Rules
- Use class-validator decorators: `@IsString()`, `@IsEmail()`, `@IsOptional()`
- Separate Create, Update, and Response DTOs
- NEVER include gymId in request DTOs — it comes from TenantMiddleware, not the client
- Never expose password hashes or internal IDs in response DTOs
- Use `@Transform()` for data sanitization

## Database & Migrations
- NEVER modify entities without creating a migration first
- Generate migration: `npm run typeorm migration:generate -- -n DescriptiveName`
- Run migration: `npm run typeorm migration:run`
- Revert: `npm run typeorm migration:revert`
- Seed data goes in `packages/backend/src/seeds/`
- New tenant-scoped tables MUST include `gym_id UUID NOT NULL REFERENCES gyms(id)` + index

## Error Handling
```typescript
throw new AppException('User not found', HttpStatus.NOT_FOUND);
throw new AppException('No access to this gym', HttpStatus.FORBIDDEN);
```

## Testing
- Unit tests: mock all dependencies, test service logic in isolation
- Integration tests: use test database, test full HTTP flow
- **Cross-tenant tests**: ALWAYS verify that querying as Gym A never returns Gym B data
- Always test error paths, not just happy paths
- Minimum coverage target: 80% on services

## WebSocket (Socket.io)
- Gateway files in `packages/backend/src/websocket/`
- Authenticate WebSocket connections with JWT
- Room naming is gym-scoped: `gym:{gymId}:channel:{channelId}`, `gym:{gymId}:user:{userId}`
- Emit events with consistent naming: `message.new`, `badge.earned`, `streak.updated`
- NEVER broadcast to rooms without the gym prefix

## Redis Cache
- All cache keys must be gym-scoped: `gym:{gymId}:leaderboard:{type}:{period}`
- TTLs: leaderboards 5min, streaks 48hr, sessions 24hr, presence 5min
