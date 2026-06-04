# CrossFit Karuna — Overnight Build Status & Morning Steps

**Last touched:** 2026-06-04 10:05 AEST
**Result:** ✅ Karuna `.xcarchive` built and staged in Xcode Organizer.

## TL;DR — what to do in the morning

1. **Open Xcode → Window → Organizer.** Under "Archives" you'll see `CrossFit Karuna 2026-06-04`.
2. **Click "Distribute App" → "App Store Connect" → "Upload".** Xcode will detect no distribution cert exists for `ZORRO STUDIOS PTY LTD` and offer to create one — click **Create** when prompted (requires being signed in via Settings → Accounts).
3. **Watch the upload finish** (~3-5 min).
4. **App Store Connect → CrossFit Karuna (app ID 6762426665) → TestFlight → Internal Testing →** add tester emails.

That's it. Total time should be under 15 min.

If Xcode complains about being signed out: Settings → Accounts → + → Apple ID → `chris@zorro-studios.com`. Then re-try step 2.

## What got done overnight

- ✅ **Karuna archive built** at `~/Library/Developer/Xcode/Archives/2026-06-04/CrossFitKaruna-2026-06-04.xcarchive` (125 MB) AND the original at `build/karuna/CrossFitKaruna.xcarchive`.
  - `CFBundleIdentifier=com.crossfitkaruna.app`
  - `CFBundleDisplayName=CrossFit Karuna`
  - `CFBundleIconName=AppIcon-Karuna` (real Karuna green hex-cube logo, scraped from crossfitkaruna.com.au, committed in `efde1c0`)
  - `CFBundleShortVersionString=1.0.0`
  - `CFBundleVersion=7` — if ASC rejects this as duplicate, bump to `8` in `packages/frontend/ios/TrainingGrounds/Info.plist` and re-archive (~10 min)
  - Built against iOS 26.5 SDK with Node 20.20.2 (pinned in `.xcode.env.local`)
  - **Unsigned** — Xcode Organizer will sign it during distribution
- ✅ **iOS 26.5 platform downloaded** (8.5 GB simulator + device support) — Xcode 26.5 had upgraded the toolchain but not pulled the platform
- ✅ **Backend on localhost:3000** + Firebase Auth emulator on :9099 + 3 demo accounts seeded:
  - `demo@traininggrounds.app` / `Demo1234!` — Alex Demo, blue belt, 47 classes
  - `coach@traininggrounds.app` / `Coach1234!` — Coach Martinez, black belt, 312 classes
  - `newbie@traininggrounds.app` / `Newbie1234!` — Jordan New, white belt
- ✅ **Postgres** has Karuna gym with `slug='crossfit-karuna'` (was `karuna-crossfit`), brand colors `#8BC53F` / `#1A1A1A`
- ✅ **All commits pushed to origin/main**: gym wiring (`bc266f1`), Karuna brand assets (`efde1c0`), this doc (`9a8aff8`)

## Why a single TestFlight upload still wasn't autonomous

Two missing things you'll handle in step 2 above:

1. **No Apple Distribution cert in your keychain.** Only the `Apple Development: Christopher Chiofalo` cert exists (and it's on personal team `2MDC3558SG`, not `ZORRO STUDIOS ZM54C3W52G`). The April 2026 IPA was signed by an `Apple Distribution: ZORRO STUDIOS` cert that has since been removed/expired. Xcode can create one in seconds once you click "Distribute App" — it's interactive, can't be scripted.
2. **No App Store Connect API key on disk** (`~/.appstoreconnect/private_keys/` is empty). For future fully-autonomous uploads, generate a `.p8` API key in ASC → Users and Access → Keys and drop it there as `AuthKey_<KEY_ID>.p8`. Then `xcrun altool --apiKey <KEY_ID> --apiIssuer <ISSUER> --upload-app -f file.ipa` works headlessly.

## Backend reality check

The IPA bakes in `EXPO_PUBLIC_API_URL=https://backend-production-3469.up.railway.app/api/v1`, which currently returns 404. **Testers will install the app but every API call will fail** until you either:

- **Revive Railway**: `railway login` (interactive), then `railway up` from the backend directory. Or:
- **Redeploy elsewhere**: Render / Fly.io / Heroku — the backend is a standard NestJS app needing Postgres + Redis (optional) + Firebase Admin SDK.

Until that's done, treat the TestFlight build as a *brand/UI preview* for testers, not a functional QA build. Once a working public backend URL is live, bump the build number in Info.plist, re-archive, and re-upload.

## What broke between April and now

- **Node was upgraded to v25.8.1**. RN 0.76 / Expo 52 Metro silently hangs on Node 25 — no error logged, the dev server just never returns bundles. Spent ~1.5 hours diagnosing this. Switched to Node 20 LTS (installed via Homebrew). `.xcode.env.local` now pins `NODE_BINARY=/opt/homebrew/opt/node@20/bin/node` so Xcode's React Native bundle phase uses Node 20 too.
- **Xcode upgraded to 26.5** but iOS 26.5 device platform wasn't auto-downloaded. Required `xcodebuild -downloadPlatform iOS` (~30 min, 8.5 GB).
- **Apple Distribution cert disappeared.** Either expired, revoked, or removed from the keychain at some point.
- **Railway backend offline.** 404 across all endpoints.
- **Watchman wasn't installed**, Metro fell back to fs polling — slow but workable.

## File / state inventory

- **Repo head**: `main` at `9a8aff8` ("docs: Karuna overnight TestFlight status…"), pushed
- **Recent commits relevant to this work**:
  - `9a8aff8` docs handoff (this file's previous revision)
  - `efde1c0` real Karuna brand assets
  - `bc266f1` reapply gym wiring
  - `942a87b` (revert, then reapplied) — diagnostic only
  - `7e38799` original gym wiring (now in `bc266f1`)
  - `f01ed64` CrossFitKaruna scheme + configs (PR #2)
- **Archive locations**:
  - `~/Library/Developer/Xcode/Archives/2026-06-04/CrossFitKaruna-2026-06-04.xcarchive` ← Organizer auto-discovers this
  - `build/karuna/CrossFitKaruna.xcarchive` ← original output
- **Background processes running** (kill if you want to free RAM):
  - Backend: `node dist/main.js` on :3000
  - Firebase Auth emulator: on :9099 + UI on :4000
- **Env tweaks**:
  - `packages/frontend/.env` — reverted to Railway URL + emulator host commented out (so the archive bakes in the production URL, not the local emulator)
  - `packages/frontend/ios/.xcode.env.local` — Node 20 path pinned

## Sanity checks (optional, run before re-archiving)

```bash
# Backend reachable on the URL the IPA will bake in?
curl -sS https://<your-prod-url>/api/v1/gyms | jq '.data | length'   # expect 2

# Karuna gym slug matches frontend mapping?
psql -U chrischiofalo -d training_grounds -c "SELECT slug FROM gyms WHERE slug='crossfit-karuna';"
grep "com.crossfitkaruna.app" packages/frontend/app/redux/slices/gymSlice.ts

# Xcode build settings resolve correctly?
cd packages/frontend/ios
xcodebuild -showBuildSettings -workspace TrainingGrounds.xcworkspace -scheme CrossFitKaruna -configuration Release-Karuna 2>&1 \
  | grep -E "^\s+(PRODUCT_BUNDLE_IDENTIFIER|DISPLAY_NAME|ASSETCATALOG_COMPILER_APPICON_NAME)\s"
# Want: com.crossfitkaruna.app, CrossFit Karuna, AppIcon-Karuna
```
