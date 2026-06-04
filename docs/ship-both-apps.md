# Shipping Both Apps — Training Grounds & CrossFit Karuna

**One codebase → two App Store apps.** This is the source-of-truth doc for getting both apps onto TestFlight.

## The architecture (read this first)

There is **one monorepo, one React Native codebase**. It produces **two distinct App Store apps** via Xcode build configurations:

| | Training Grounds | CrossFit Karuna |
|---|---|---|
| Bundle ID | `com.traininggrounds.app` | `com.crossfitkaruna.app` |
| ASC App ID | `6761029689` | `6762426665` |
| Xcode scheme | `TrainingGrounds` | `CrossFitKaruna` |
| Archive config | `Release` | `Release-Karuna` |
| Gym slug (runtime) | `training-grounds` | `crossfit-karuna` |
| Brand color | `#C9A87C` (gold) | `#8BC53F` (green) |
| Icon set | `AppIcon` | `AppIcon-Karuna` |

**The two apps have different features — but the code is NOT forked.** Feature differences are driven by two clean mechanisms, never by hardcoded `if (slug === ...)` checks in business logic:

1. **Per-gym feature flags** (columns on the `gyms` table): `prTrackingEnabled`, `benchmarkWodEnabled`, `streakFreezeEnabled`, `communityEnabled`, etc. CrossFit Karuna has `prTrackingEnabled=true` + `benchmarkWodEnabled=true`, so it shows the LIFT TRACKER, PR logging, and benchmark-WOD content. Training Grounds has them `false` and shows belt progression instead.
2. **Seed data** (`packages/backend/src/seeds/`): each gym is seeded with its own badges, quests, and channels. `karuna-crossfit.ts` loads CrossFit content (Fran, Murph, PR Bell…); `gym.ts` loads MMA content.

Plus exactly **two designed seams** that legitimately map identity → behavior:
- `BUNDLE_ID_TO_GYM_SLUG` in `app/redux/slices/gymSlice.ts` — locks each branded build to its gym at runtime.
- `SLUG_TO_COPY` in `app/utils/gymCopy.ts` — per-tenant UI copy (league names, discipline labels, belt-picker visibility).

Adding a third gym = new seed file + one line in each of those two maps + a `tenants.config.js` entry + brand assets. No business-logic edits. **Do not split this into two repos** — you'd double every future fix.

## Feature differences (what testers will see)

**Training Grounds (MMA):** belt ranks (white→black), BJJ/Muay Thai/Wrestling/MMA disciplines, belt-themed leagues, MMA badges & quests.

**CrossFit Karuna (CrossFit):** no belts (everyone "Member"), CrossFit/Weightlifting/HYROX disciplines, LIFT TRACKER + PR logging, benchmark WODs (Fran/Murph/Grace), Scaled/RX/Games leagues, WOD-based badges/quests/channels (#pr-bell, #wod-results).

## Backend (shared, LIVE)

Both apps talk to the same Railway backend: `https://backend-production-3469.up.railway.app/api/v1`
- Status: **LIVE** (revived 2026-06-04). `GET /api/v1/gyms` returns both gyms.
- The backend is multi-tenant: it serves whichever gym the signed-in user belongs to, identified by the branded build's bundle ID.
- Postgres + the app both run on Railway under project `training-grounds` (`298b4b2a-9349-4df2-89b3-e14a5952cef0`).

## Build numbers

Shared `CFBundleVersion` is **8** (bumped from 7). ASC tracks build numbers per-app, so both apps upload as build 8 independently. If either app's ASC record already has build 8, bump `packages/frontend/ios/TrainingGrounds/Info.plist` → `CFBundleVersion` and re-archive.

## Archives

Both archives are built **unsigned** (no Apple Distribution cert is in the keychain — Xcode creates one on first Distribute). They're staged in `~/Library/Developer/Xcode/Archives/` so **Xcode → Window → Organizer** auto-lists them.

- CrossFit Karuna: `build/karuna/CrossFitKaruna.xcarchive` + Organizer copy
- Training Grounds: `build/training-grounds/TrainingGrounds.xcarchive` + Organizer copy

## Ship each app (Xcode, ~10 min each)

For EACH app:
1. **Xcode → Window → Organizer → Archives tab.**
2. Select the archive (`CrossFit Karuna …` or `Training Grounds …`).
3. **Distribute App → App Store Connect → Upload.**
4. First time only: when prompted for a distribution certificate, click **Create** (needs Xcode signed in to `chris@zorro-studios.com` under Settings → Accounts, team `ZORRO STUDIOS PTY LTD / ZM54C3W52G`).
5. Accept auto-managed signing → Upload. ~3-5 min.
6. After ASC finishes processing (~10 min): **App Store Connect → [the app] → TestFlight → Internal Testing → add testers by Apple ID email.**

Repeat for the second app. The two apps are independent ASC records — uploading one never touches the other.

## Metadata

- CrossFit Karuna: see [karuna-asc-metadata.md](karuna-asc-metadata.md). Paste into <https://appstoreconnect.apple.com/apps/6762426665>.
- Training Grounds: see the "Training Grounds metadata" section below. Paste into <https://appstoreconnect.apple.com/apps/6761029689>.

For TestFlight **Internal Testing**, you only need: App Information (name, bundle ID, category, age rating), Pricing = Free, and the Export Compliance answer (standard encryption, exempt). Screenshots / description / privacy URL are only required for a public App Store release.

---

## Training Grounds metadata

| Field | Value |
| --- | --- |
| **Name** | `Training Grounds` |
| **Subtitle** (30 char) | `Train. Track. Level Up.` |
| **Primary Language** | English (US) |
| **Bundle ID** | `com.traininggrounds.app` |
| **SKU** | `training-grounds-v1` |
| **Primary Category** | Health & Fitness |
| **Secondary Category** | Sports |
| **Age Rating** | 4+ (answer None/No to all) |
| **Price** | Free (Tier 0) |

**Promotional text:** Your gym in your pocket. Check in, build streaks, earn XP and badges, climb the leaderboard, and track your belt progression across BJJ, Muay Thai, wrestling and MMA.

**Description:**
> Training Grounds is the member app for multi-discipline MMA gyms. Check in to classes, keep your training streak alive, and level up.
>
> • Quick class check-in
> • Streaks, XP and badges (Duolingo-style)
> • Belt & stripe progression across BJJ, Muay Thai, wrestling, MMA
> • Leaderboards and leagues
> • Session journal with coach review
> • Community channels and referrals
>
> Sign in with your gym account to get started.

**Keywords:** `mma,bjj,jiu jitsu,muay thai,gym,martial arts,training,streak,leaderboard,belt,wrestling,fitness`

**Support URL:** https://training-grounds.app/support *(placeholder — replace)*
**Privacy Policy URL:** https://training-grounds.app/privacy *(placeholder — required before public release, not for TestFlight)*

---

## Known follow-ups

- **Export compliance**: add `<key>ITSAppUsesNonExemptEncryption</key><false/>` to Info.plist to stop TestFlight asking each build (HTTPS-only, exempt).
- **Support / Privacy URLs**: both apps use placeholders. Apple requires reachable URLs before public App Store release (not for TestFlight internal).
- **Screenshots**: capture 6.7" iPhone sets per app from the simulator before public release.
- **Toolchain note**: builds must run with **Node 20** (`.xcode.env.local` pins it). Node 25 silently hangs Metro. Keep Node 20 as the active node for any local Expo/Xcode work.
