---
paths:
  - "packages/backend/src/entities/**/*.ts"
  - "packages/backend/src/migrations/**/*.ts"
---

# Database Rules (PostgreSQL + TypeORM — Multi-Tenant)

## Multi-Tenant Schema Rule (CRITICAL)
Every tenant-scoped table MUST have a `gym_id` column with a foreign key to `gyms(id)` and an index. This is non-negotiable.

```sql
-- EVERY new tenant-scoped table must include:
gym_id UUID NOT NULL REFERENCES gyms(id),
INDEX idx_{table}_gym (gym_id)
```

## Schema Conventions
- Table names: snake_case plural (users, badges, journal_entries)
- Column names: snake_case (created_at, referral_code, total_xp, gym_id)
- Primary keys: UUID v4 (`@PrimaryGeneratedColumn('uuid')`)
- Timestamps: All tables include created_at, updated_at
- Soft deletes: User-facing data uses deleted_at column
- Tenant column: `gym_id UUID NOT NULL` on all tenant-scoped tables

## Table Classification

### Global Tables (no gym_id)
- `users` — User accounts are global (one account, many gyms)
- `gyms` — The tenant root entity
- `gym_memberships` — Maps users to gyms with role

### Tenant-Scoped Tables (require gym_id)
- `attendance_records`, `badges`, `user_badges`
- `channels`, `channel_messages`, `message_reactions`
- `class_schedules`, `courses`, `course_modules`
- `journal_entries`, `journal_comments`
- `quests`, `user_quests`
- `streaks`, `leaderboards`
- `referrals`, `referral_status_log`, `rewards`
- `videos`, `video_feedback`, `video_likes`
- `goals`, `belt_promotions`, `technique_milestones`
- `class_plans`, `class_materials`, `drill_templates`
- `push_subscriptions`, `notification_preferences`

## Core Relationships
- Gym → has many GymMemberships → has many Users (via join table)
- Gym → has many Channels, ClassSchedules, Badges, Quests, etc.
- User → has many GymMemberships (can belong to multiple gyms)
- User → has one activeGymId (currently selected gym)
- All tenant-scoped entities → belong to one Gym

## Index Strategy
Always add indexes for:
- `gym_id` on every tenant-scoped table (mandatory)
- Foreign keys (user_id, class_id, channel_id, etc.)
- Composite: `(gym_id, user_id)` on per-user tables
- Composite: `(gym_id, created_at)` on time-series tables
- Status/enum columns used in WHERE clauses
- Unique constraints (email on users, slug on gyms, referral_code scoped to gym)
- Note: `(gym_id, name)` unique constraint on channels (name is unique per gym, not globally)

## Migration Rules
1. NEVER modify an entity without creating a migration
2. Migrations must be reversible (implement both `up` and `down`)
3. Name migrations descriptively: `AddGymIdToAttendance`, `CreateGymMemberships`
4. Test migrations on a production snapshot before deploying
5. Never drop columns in production — deprecate first, remove later
6. When adding gym_id to existing tables: add nullable → backfill → make NOT NULL

## Query Patterns
- EVERY query on a tenant-scoped table MUST filter by gymId
- Use QueryBuilder for complex queries (joins, aggregations)
- Use `.createQueryBuilder()` with explicit `.select()` — never select *
- Paginate all list endpoints: `LIMIT/OFFSET` or cursor-based
- Cache hot queries in Redis with gym-scoped keys

```typescript
// CORRECT — gym-scoped query:
const badges = await this.badgeRepo.find({
  where: { gymId, category: 'attendance' },
  order: { createdAt: 'DESC' },
});

// WRONG — missing gymId, returns badges from ALL gyms:
const badges = await this.badgeRepo.find({
  where: { category: 'attendance' },
});
```

## Transactions
Use transactions for multi-step operations:
```typescript
await this.dataSource.transaction(async (manager) => {
  await manager.save(attendance);  // includes gymId
  await manager.increment(User, { id: userId }, 'totalXp', xpEarned);
  await manager.update(Streak, { gymId, userId }, { currentStreak: newStreak });
});
```

## Row-Level Security (Defense in Depth)
PostgreSQL RLS is enabled on tenant-scoped tables as a safety net. The TenantMiddleware sets `app.current_gym_id` at the start of each request. RLS policies ensure a query can never return rows from a different gym, even if the application code has a bug.

## Redis Cache Strategy
- All keys prefixed with `gym:{gymId}:`
- Leaderboards: Sorted sets, refresh every 5 minutes
- User sessions: Hash, TTL 24 hours
- Streak data: Hash per user, TTL 48 hours
- Rate limits: Counter with TTL
- WebSocket presence: Set per channel
- Gym config/theme: Hash, TTL 1 hour (invalidate on update)
