---
name: run-tests
description: Run all tests, lint, and type-check across the monorepo
---

# Run Tests & Verification

Execute the full verification suite for the project.

## Steps

1. **Type Check** (all packages)
   ```bash
   cd packages/shared && npx tsc --noEmit
   cd packages/backend && npx tsc --noEmit
   cd packages/frontend && npx tsc --noEmit
   ```

2. **Lint** (all packages)
   ```bash
   npm run lint
   ```

3. **Backend Unit Tests**
   ```bash
   cd packages/backend && npm test
   ```

4. **Backend Integration Tests** (if database is available)
   ```bash
   cd packages/backend && npm run test:e2e
   ```

5. **Frontend Tests**
   ```bash
   cd packages/frontend && npm test
   ```

6. **Report Results**
   - List any failing tests with file path and error
   - List any TypeScript errors
   - List any lint warnings/errors
   - Suggest fixes for each issue found

## If Tests Fail
- Fix the issue
- Re-run only the affected test file
- Verify the fix doesn't break other tests
- Only mark as complete when ALL tests pass
