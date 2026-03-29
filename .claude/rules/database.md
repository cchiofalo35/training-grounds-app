---
paths:
  - "packages/backend/src/entities/**/*.ts"
  - "packages/backend/src/migrations/**/*.ts"
---

# Database Rules (PostgreSQL + TypeORM)

## Schema Conventions
- Table names: snake_case plural (users, badges, journal_entries)
- Column names: snake_case (created_at, referral_code, total_xp)
- Primary keys: UUID v4 (`@PrimaryGeneratedColumn('uuid')`)
- Timestamps: All tables include created_at, updated_at
- Soft deletes: User-facing data uses deleted_at column

## Core Tables (21+ entities)
See full schema in @docs/ARCHITECTURE.md Section 4

Key relationships:
- User → has many Attendance, Badges, Streaks, JournalEntries, Goals
- User → has many Referrals (as referrer), has one Referral (as referee)
- Class → belongs to Instructor (User), has many Attendance records
- Channel → has many Messages → has many Reactions
- Video → belongs to User (uploader), has many Comments/Feedback
- JournalEntry → belongs to User, linked to Attendance record
- ClassPlan → belongs to Coach (User), has many StudyMaterials

## Index Strategy
Always add indexes for:
- Foreign keys (user_id, class_id, channel_id, etc.)
- Status/enum columns used in WHERE clauses
- Columns used in ORDER BY (created_at, xp_earned, rank)
- Unique constraints (email, referral_code)
- Composite indexes for common query patterns (user_id + created_at)

## Migration Rules
1. NEVER modify an entity without creating a migration
2. Migrations must be reversible (implement both `up` and `down`)
3. Name migrations descriptively: `AddVideoLibraryTables`, `AddJournalCoachReview`
4. Test migrations on a fresh database before committing
5. Never drop columns in production — deprecate first, remove later

## Query Patterns
- Use QueryBuilder for complex queries (joins, aggregations)
- Use `.createQueryBuilder()` with explicit `.select()` — never select *
- Paginate all list endpoints: `LIMIT/OFFSET` or cursor-based
- Cache hot queries in Redis (leaderboards, streak counts, XP totals)

## Transactions
Use transactions for multi-step operations:
```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.save(attendance);
  await manager.increment(User, { id: userId }, 'totalXp', xpEarned);
  await manager.update(Streak, { userId }, { currentStreak: newStreak });
});
```

## Redis Cache Strategy
- Leaderboards: Sorted sets, refresh every 5 minutes
- User sessions: Hash, TTL 24 hours
- Streak data: Hash per user, TTL 48 hours
- Rate limits: Counter with TTL
- WebSocket presence: Set per channel
