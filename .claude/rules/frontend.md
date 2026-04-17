---
paths:
  - "packages/frontend/**/*.{tsx,ts}"
---

# Frontend Development Rules (React Native + Expo — Multi-Tenant Theming)

## Multi-Tenant Theming Rule (CRITICAL)
NEVER hardcode brand colors. Always use the `useTheme()` hook to get the active gym's colors. The theme is fetched from the API at login and applied via `ThemeProvider`.

```typescript
// CORRECT — dynamic theme:
const theme = useTheme();
const styles = useMemo(() => StyleSheet.create({
  button: { backgroundColor: theme.primaryColor },
  card: { backgroundColor: theme.surfaceColor },
}), [theme]);

// WRONG — hardcoded colors:
const styles = StyleSheet.create({
  button: { backgroundColor: '#C9A87C' },
  card: { backgroundColor: '#2A2A2A' },
});
```

The only place static color values appear is in `DEFAULT_THEME` (the fallback before a gym theme loads).

## Component Structure
```
packages/frontend/app/
  screens/          — Full screen components (DashboardScreen, ProfileScreen, etc.)
  components/       — Reusable UI components (Card, Badge, Button, Avatar, etc.)
  hooks/            — Custom hooks (useAuth, useTheme, useStreak, useWebSocket, useApi)
  contexts/         — React contexts (ThemeContext, GymContext)
  redux/            — Redux Toolkit store, slices, thunks
    store.ts
    slices/         — Feature slices (authSlice, gymSlice, attendanceSlice, etc.)
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
- All styling via `useTheme()` — never import `colors` directly from shared

## ThemeProvider & GymContext
- `ThemeProvider` wraps the entire app inside `<Provider store={store}>`
- `useTheme()` returns the current `GymTheme` object
- `useGym()` returns the active gym info (id, slug, name, config flags)
- When user switches gyms, the theme updates automatically

```typescript
// At app root:
<Provider store={store}>
  <ThemeProvider>
    <GymProvider>
      <RootNavigator />
    </GymProvider>
  </ThemeProvider>
</Provider>
```

## Styling
- Use `StyleSheet.create()` inside `useMemo()` that depends on `theme`
- Theme tokens available via `useTheme()`:
  - `primaryColor` — Accent (CTAs, active states, highlights) — replaces old `colors.warmAccent`
  - `secondaryColor` — Background — replaces old `colors.charcoal`
  - `surfaceColor` — Card/surface bg — replaces old `colors.darkGrey`
  - `textPrimary` — Primary text — replaces old `colors.offWhite`
  - `textMuted` — Muted text — replaces old `colors.steel`
  - `headingFont`, `bodyFont` — Typography
- Static tokens that DON'T change per gym (import from shared):
  - `spacing`, `borderRadius`, `shadows` — layout tokens
  - `colors.belt.*` — belt rank colors are universal
  - `colors.league.*` — league colors are universal
  - `colors.success/error/warning/info` — semantic colors are universal

## State Management
- **Global state** (Redux Toolkit): user profile, auth, active gym, gym theme
- **Server state** (RTK Query): API responses with caching
- **Local state** (useState): form inputs, UI toggles, animation state
- NEVER store derived data in Redux — use selectors
- `gymSlice` stores: activeGymId, gym list, gym config

## Navigation
- Bottom tab navigator: Home, Community, Video, Journal, Profile
- Stack navigators nested inside each tab for sub-screens
- Type-safe routes: define `RootStackParamList` in `navigation/types.ts`
- Deep linking support for push notification targets
- Gym selector screen shown when user belongs to multiple gyms

## API Integration
- Centralized API client in `services/api.ts` using axios
- Base URL from environment config
- JWT token automatically attached via axios interceptor
- **`X-Gym-Id` header automatically attached** from active gym in Redux store
- Error interceptor for 401 → redirect to login

```typescript
// Axios interceptor adds gym context:
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  const gymId = store.getState().gym.activeGymId;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (gymId) config.headers['X-Gym-Id'] = gymId;
  return config;
});
```

## Performance
- Use `FlatList` with `keyExtractor` for all lists (never ScrollView for dynamic lists)
- Lazy load screens with `React.lazy()` where appropriate
- Optimize images: use cached thumbnails, progressive loading
- Memoize styles with `useMemo` keyed on theme to avoid re-creating on every render
- Avoid re-renders: memoize callbacks with `useCallback`, values with `useMemo`

## Testing
- Component tests with React Native Testing Library
- Hook tests with `@testing-library/react-hooks`
- Redux slice tests for reducers and selectors
- Snapshot tests for critical UI components
- **Theme tests**: Verify components render correctly with non-default themes
