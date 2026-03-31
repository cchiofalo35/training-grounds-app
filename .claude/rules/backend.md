---
paths:
  - "packages/backend/**/*.ts"
---

# Backend Development Rules (NestJS)

## Module Structure
Every feature follows this pattern:
```
packages/backend/src/modules/{feature}/
  {feature}.module.ts      — NestJS module with providers/imports
  {feature}.controller.ts  — HTTP routes, validation, guards
  {feature}.service.ts     — Business logic, no HTTP concepts
  {feature}.entity.ts      — TypeORM entity definition
  {feature}.dto.ts         — Request/response DTOs with class-validator
  {feature}.spec.ts        — Unit tests for service
  {feature}.e2e-spec.ts    — Integration tests for controller
```

## Controller Rules
- Controllers ONLY handle HTTP routing — no business logic
- Always use `@UseGuards(JwtAuthGuard)` on protected routes
- Coach-only routes use `@Roles('coach', 'admin')` + `@UseGuards(RolesGuard)`
- Validate all input with DTOs: `@Body() dto: CreateClassDto`
- Return consistent response format: `{ success: true, data: {...} }`
- Use proper HTTP status codes (201 for creation, 204 for deletion)

## Service Rules
- Services contain ALL business logic
- Use dependency injection: `constructor(private readonly userService: UserService)`
- Throw custom `AppException` for errors (not raw HTTP exceptions)
- Use transactions for multi-entity operations (e.g., check-in + XP + streak update)
- Emit events for async processing: `this.eventEmitter.emit('attendance.checkin', payload)`

## Entity Rules
- All entities extend `BaseEntity` with id, createdAt, updatedAt
- Use UUID for primary keys: `@PrimaryGeneratedColumn('uuid')`
- Add `@Index()` on frequently queried columns
- Define relationships explicitly with `@ManyToOne`, `@OneToMany`, etc.
- Soft delete for user-facing data: `@DeleteDateColumn()`

## DTO Rules
- Use class-validator decorators: `@IsString()`, `@IsEmail()`, `@IsOptional()`
- Separate Create, Update, and Response DTOs
- Never expose password hashes or internal IDs in response DTOs
- Use `@Transform()` for data sanitization

## Database & Migrations
- NEVER modify entities without creating a migration first
- Generate migration: `npm run typeorm migration:generate -- -n DescriptiveName`
- Run migration: `npm run typeorm migration:run`
- Revert: `npm run typeorm migration:revert`
- Seed data goes in `packages/backend/src/seeds/`

## Error Handling
```typescript
// Use this pattern for all errors:
throw new AppException('User not found', HttpStatus.NOT_FOUND);
throw new AppException('Insufficient XP', HttpStatus.BAD_REQUEST);
```

## Testing
- Unit tests: mock all dependencies, test service logic in isolation
- Integration tests: use test database, test full HTTP flow
- Always test error paths, not just happy paths
- Minimum coverage target: 80% on services

## WebSocket (Socket.io)
- Gateway files in `packages/backend/src/websocket/`
- Authenticate WebSocket connections with JWT
- Room naming: `channel:{channelId}`, `user:{userId}`, `leaderboard:{type}`
- Emit events with consistent naming: `message.new`, `badge.earned`, `streak.updated`
