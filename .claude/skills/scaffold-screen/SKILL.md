---
name: scaffold-screen
description: Generate a complete React Native screen with navigation, Redux integration, and styling
---

# Scaffold a Frontend Screen

Create a complete React Native screen for the given screen name.

## What to Generate

Given a screen name (e.g., "Dashboard", "Journal", "VideoLibrary"), create:

1. **Screen Component** at `packages/frontend/app/screens/{Screen}Screen.tsx`
   - Functional component with TypeScript props interface
   - Import navigation hooks from React Navigation
   - Connect to Redux store for relevant state
   - Use brand theme tokens from @shared/theme
   - Match the visual design from @docs/prototype.jsx
   - Loading and error states

2. **Sub-components** at `packages/frontend/app/screens/{Screen}/components/`
   - Break complex screens into smaller components
   - Each component in its own file

3. **Screen-specific hook** at `packages/frontend/app/hooks/use{Screen}.ts` (if needed)
   - Encapsulate screen-specific logic (API calls, computed values)
   - Use RTK Query or Redux thunks for data fetching

4. **Redux slice updates** (if new state is needed)
   - Add to existing slice or create new one in `app/redux/slices/`
   - Define async thunks for API calls
   - Add selectors for derived data

5. **Navigation registration**
   - Add screen to the appropriate stack navigator
   - Define route params type in `navigation/types.ts`

## Styling Rules
- Use StyleSheet.create with brand tokens
- Dark theme: backgrounds #1E1E1E/#2A2A2A, gold accents #C9A87C
- Cards: borderRadius 14, border rgba(255,255,255,0.06)
- Headings: Bebas Neue, uppercase
- Body: Inter, fontWeight 300-700
- Refer to @docs/prototype.jsx for exact screen layouts
