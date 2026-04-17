# Multi-Tenant Build Guide

One codebase → N branded iOS/Android apps, each locked to one gym.

## How it works

1. `tenants.config.js` — registry of every tenant (name, bundle ID, icon path, splash color, ASC app ID).
2. `app.config.js` — dynamic Expo config that reads `EXPO_PUBLIC_TENANT` at build time and pulls the matching entry from the registry.
3. `eas.json` — per-tenant build + submit profiles.
4. `app/assets/tenants/<slug>/` — branded icon, adaptive icon, splash per tenant.
5. `app/redux/slices/gymSlice.ts` — `BUNDLE_ID_TO_GYM_SLUG` map auto-selects the correct gym once the user signs in.

## Adding a new gym (recap)

1. Add a DB row via the gym seed script or admin UI.
2. Drop icon.png / adaptive-icon.png / splash.png into `app/assets/tenants/<slug>/`.
3. Add an entry to `tenants.config.js`.
4. Add build + submit profiles to `eas.json`.
5. Add the bundle ID → slug mapping to `gymSlice.ts`.
6. Create the App Store Connect record (see below).

---

## Shipping CrossFit Karuna to TestFlight

### Prerequisites

- Apple Developer account on team `ZM54C3W52G`
- EAS CLI installed (`npm i -g eas-cli`)
- Logged in: `eas login`

### Step 1: Register the bundle ID in Apple Developer

1. Go to <https://developer.apple.com/account/resources/identifiers/list>
2. Click `+` → **App IDs** → **App** → **Continue**
3. Description: `CrossFit Karuna`
4. Bundle ID: **Explicit** → `com.crossfitkaruna.app`
5. Capabilities: enable **Push Notifications** (to match Training Grounds)
6. Register

> EAS can do this automatically on first build, but doing it manually first avoids a timeout during the cert workflow.

### Step 2: Create the App Store Connect record

1. Go to <https://appstoreconnect.apple.com/apps>
2. Click `+` → **New App**
3. Platform: **iOS**
4. Name: `CrossFit Karuna`
5. Primary Language: **English (Australia)**
6. Bundle ID: `com.crossfitkaruna.app` (will appear in dropdown after step 1)
7. SKU: `crossfit-karuna-v1`
8. User Access: **Full Access**
9. Create

### Step 3: Copy the ASC App ID

On the new app's App Store page, the URL contains the numeric ID:
`https://appstoreconnect.apple.com/apps/<ASC_APP_ID>/appstore`

Paste that number into `packages/frontend/eas.json` →
`submit.crossfit-karuna.ios.ascAppId`, replacing the `REPLACE_WITH_KARUNA_ASC_APP_ID` placeholder.

### Step 4: Build + submit

From `packages/frontend/`:

```bash
# Build a production iOS binary for CrossFit Karuna
eas build --platform ios --profile crossfit-karuna

# After build finishes, submit to TestFlight
eas submit --platform ios --profile crossfit-karuna --latest
```

Total time: ~20–30 min for the build, ~10 min for App Review to release to internal testers.

### Step 5: Invite testers

1. App Store Connect → TestFlight → Internal Testing
2. Add testers by Apple ID email
3. They get a TestFlight link and can install the beta

---

## Shipping Training Grounds

Same flow, using the existing App Store Connect record:

```bash
eas build --platform ios --profile training-grounds
eas submit --platform ios --profile training-grounds --latest
```
