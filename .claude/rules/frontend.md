---
paths:
  - "packages/frontend/**/*.{tsx,ts}"
---

# Frontend Development Rules (React Native + Expo)

## Component Structure
```
packages/frontend/app/
  screens/          — Full screen components (DashboardScreen, ProfileScreen, etc.)
  components/       — Reusable UI components (Card, Badge, Button, Avatar, etc.)
  hooks/            — Custom hooks (useAuth, useStreak, useWebSocket, useApi)
  redux/            — Redux Toolkit store, slices, thunks
    store.ts
    slices/         — Feature slices (userSlice, gymSlice, communitySlice)
  navigation/       — React Navigation stacks and tab config
  services/         — API client, WebSocket client, storage helpers
  assets/           — Images, fonts, icons
```

## Component Rules
- Functional components ONLY — no class components
- One component per file, named export matching filename
- Props interface defined above component: `interface DashboardProps { ... }`
- Use `React.memo()` for expensive list items
- Extract complex logic into custom hooks

## Styling
- Use `StyleSheet.create()` — NOT inline styles (except dynamic values)
- Import brand tokens from `@shared/theme`: colors, spacing, typography, borderRadius
- Follow the Training Grounds brand:
  - Dark backgrounds (#1E1E1E, #2A2A2A)
  - Gold accents (#C9A87C) for CTAs, active states, highlights
  - Steel (#B0B5B8) for muted text
  - Bebas Neue for headings (uppercase, letter-spacing 0.02em)
  - Inter for body text (weights: 300, 500, 700)
  - Card border-radius: 14px, button border-radius: 6px
  - Subtle borders: rgba(255,255,255,0.06) on dark backgrounds

## State Management
- **Global state** (Redux Toolkit): user profile, auth, gym data, notifications
- **Server state** (React Query or RTK Query): API responses with caching
- **Local state** (useState): form inputs, UI toggles, animation state
- NEVER store derived data in Redux — use selectors

## Navigation
- Bottom tab navigator: Home, Community, Video, Journal, Profile
- Stack navigators nested inside each tab for sub-screens
- Type-safe routes: define `RootStackParamList` in `navigation/types.ts`
- Deep linking support for push notification targets

## API Integration
- Centralized API client in `services/api.ts` using axios
- Base URL from environment config
- JWT token automatically attached via axios interceptor
- Error interceptor for 401 → redirect to login

## Performance
- Use `FlatList` with `keyExtractor` for all lists (never ScrollView for dynamic lists)
- Lazy load screens with `React.lazy()` where appropriate
- Optimize images: use cached thumbnails, progressive loading
- Avoid re-renders: memoize callbacks with `useCallback`, values with `useMemo`

## Testing
- Component tests with React Native Testing Library
- Hook tests with `@testing-library/react-hooks`
- Redux slice tests for reducers and selectors
- Snapshot tests for critical UI components
