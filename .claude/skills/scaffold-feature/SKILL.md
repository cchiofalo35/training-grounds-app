---
name: scaffold-feature
description: Generate a complete NestJS feature module with controller, service, entity, DTOs, and tests
---

# Scaffold a Backend Feature Module

Create a complete NestJS feature module for the given feature name.

## What to Generate

Given a feature name (e.g., "attendance", "journal", "video"), create:

1. **Entity** at `packages/backend/src/modules/{feature}/{feature}.entity.ts`
   - Extend BaseEntity with id (UUID), createdAt, updatedAt
   - Add all columns from the ARCHITECTURE.md schema for this feature
   - Define relationships with @ManyToOne, @OneToMany, etc.
   - Add @Index decorators on queryable columns

2. **DTOs** at `packages/backend/src/modules/{feature}/dto/`
   - `create-{feature}.dto.ts` — Input validation with class-validator
   - `update-{feature}.dto.ts` — Partial update DTO
   - `{feature}-response.dto.ts` — Response shape (no sensitive fields)

3. **Service** at `packages/backend/src/modules/{feature}/{feature}.service.ts`
   - Inject TypeORM repository
   - Implement CRUD: create, findAll (paginated), findById, update, delete
   - Add feature-specific business logic from ARCHITECTURE.md
   - Use transactions for multi-entity operations
   - Emit events for gamification triggers

4. **Controller** at `packages/backend/src/modules/{feature}/{feature}.controller.ts`
   - RESTful endpoints matching the API design in ARCHITECTURE.md
   - Apply JwtAuthGuard, RolesGuard where needed
   - Use DTOs for request validation
   - Return consistent response format

5. **Module** at `packages/backend/src/modules/{feature}/{feature}.module.ts`
   - Register entity, service, controller
   - Import dependent modules

6. **Tests** at `packages/backend/src/modules/{feature}/{feature}.service.spec.ts`
   - Unit tests for all service methods
   - Mock repository and dependencies
   - Test happy paths and error cases

## After Scaffolding
- Register the new module in `app.module.ts`
- Run `npm run typeorm migration:generate` if new entity columns exist
- Run `npm test` to verify
