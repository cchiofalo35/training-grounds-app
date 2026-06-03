# CrossFit Karuna — Overnight TestFlight Push, Status & Morning Steps

**Last touched:** 2026-06-04 ~08:00 AEST (overnight run)
**Goal:** Karuna IPA in TestFlight Internal Testing so you can share with testers.

## TL;DR

You wanted me to finish autonomously while you slept. Two hard blockers stopped a fully autonomous ship:

1. **No Apple Distribution certificate in your keychain.** Only an Apple Development cert (and on the wrong team — your personal `2MDC3558SG`, not `ZORRO STUDIOS ZM54C3W52G`). The April 2026 IPA was signed by an `Apple Distribution: ZORRO STUDIOS PTY LTD` cert that is gone. Without it, no App Store export → no TestFlight upload.
2. **iOS 26.5 device platform was not installed** (Xcode 26.5 updated the toolchain but skipped the platform). Without it, `xcodebuild archive` fails immediately with "Found no destinations for action archive." I kicked off `xcodebuild -downloadPlatform iOS` before sleeping — check `/private/tmp/claude-501/.../tasks/blbfwxohp.output` for status.

Plus two background-but-relevant gaps:

3. **No App Store Connect API key / app-specific password on disk.** Can't auto-upload even if the IPA exists. Final upload has to be a manual Transporter click.
4. **Railway backend is dead.** The IPA bakes in `EXPO_PUBLIC_API_URL=https://backend-production-3469.up.railway.app/api/v1` at build time, which currently returns 404. Testers will install the app but every API call fails. To make the build actually useful, revive Railway OR redeploy the backend to a public HTTPS URL and rebuild the IPA pointing there.

## What's working now

- ✅ **Backend running locally** on `localhost:3000` (`node dist/main.js`, started this session)
- ✅ **Firebase Auth emulator** on `localhost:9099` (started this session)
- ✅ **3 demo accounts seeded** in Firebase emulator + Postgres:
  - `demo@traininggrounds.app` / `Demo1234!` — Alex Demo, blue belt, 47 classes, 14 badges
  - `coach@traininggrounds.app` / `Coach1234!` — Coach Martinez, black belt, 312 classes
  - `newbie@traininggrounds.app` / `Newbie1234!` — Jordan New, white belt, 5 classes
- ✅ **Postgres** has both gyms: `crossfit-karuna` (slug fixed from `karuna-crossfit`, brand colors `#8BC53F` / `#1A1A1A`) and `training-grounds`
- ✅ **Real CrossFit Karuna brand assets** committed (`efde1c0` on `main`): green isometric hex-cube logo scraped from `crossfitkaruna.com.au`, baked into `Images.xcassets/AppIcon-Karuna.appiconset/` and `app/assets/tenants/crossfit-karuna/` (icon, adaptive-icon, splash). Replaces the TG-shield placeholders that were sitting in those paths.
- ✅ **Frontend gym wiring re-applied** (`bc266f1`): `ThemeProvider`, `GymProvider`, `GymGate`, `GymSelectorScreen`, `GymBrandingScreen`. Resolved a Metro hang that turned out to be Node 25 silently breaking the bundler — switching to Node 20 fixed it.
- ✅ **Provisioning profile for Karuna exists**: `b7db30f4-...mobileprovision`, app ID `ZM54C3W52G.com.crossfitkaruna.app`, valid until 2027-04-17. This is a **development** profile (has `get-task-allow=true` and a `ProvisionedDevices` list) — fine for sideload to your own device, not enough for App Store.
- ✅ **`.xcode.env.local` pinned to Node 20** so future Xcode builds don't hit the same Metro hang during the React Native bundle phase.
- ✅ **Node 20 + watchman installed** via Homebrew (`node@20`, `watchman` 2026.06.01.00)

## What broke between April and now

- **Node was upgraded to v25.8.1**. RN 0.76 / Expo 52 Metro silently hangs on Node 25 — no error logged, the dev server just never returns bundles. This wasted significant time before being root-caused.
- **Xcode was upgraded to 26.5**, but the iOS 26.5 device platform was not auto-downloaded. SDKs alone aren't enough — `xcodebuild` needs the platform too.
- **Apple Distribution cert is gone**. Either expired, revoked, or removed from the keychain. The April 2026 IPA at `build/karuna/export/CrossFitKaruna.ipa` was signed by it.
- **Railway production backend is offline**. Returns 404 Application not found across all `api/v1/*` endpoints.

## Morning steps (~15 min to TestFlight if iOS platform finished downloading)

### 1. Check whether iOS platform download finished

```bash
ls /Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS26.5.sdk
# Or just open Xcode → Settings → Platforms — iOS 26.5 should show "Installed"
```

If not finished or it errored, kick it off manually: **Xcode → Settings → Platforms → iOS → ↓ Download**. ~4–6 GB.

### 2. Get an Apple Distribution cert into the keychain

In Xcode:
1. **Settings → Accounts** — confirm `chris@zorro-studios.com` is signed in, and `ZORRO STUDIOS PTY LTD (ZM54C3W52G)` shows in the team list.
2. Select that team → **Manage Certificates…** → **+** → **Apple Distribution** → create.
3. (Optional but useful) **Download Manual Profiles** to refresh the local provisioning profile cache.

After this `security find-identity -v -p codesigning` should list a second identity:
`"Apple Distribution: ZORRO STUDIOS PTY LTD (ZM54C3W52G)"`.

### 3. Archive + distribute

Open `packages/frontend/ios/TrainingGrounds.xcworkspace` in Xcode:
1. Scheme picker → **CrossFitKaruna**.
2. Destination → **Any iOS Device (arm64)**.
3. **Product → Archive** (~5–10 min).
4. Organizer auto-opens → select the new archive → **Distribute App** → **App Store Connect** → **Upload** → accept the auto-managed signing → Next → Next → Upload.
5. Wait ~10 min for ASC to finish processing the build.

### 4. Invite testers

App Store Connect → **CrossFit Karuna** (app ID `6762426665`) → **TestFlight** → **Internal Testing** → pick group or add testers by Apple ID email.

### 5. Make the app actually function for testers (separate ticket)

The IPA you just shipped points at the dead Railway URL. Two options:

- **A. Revive Railway**: `cd /Users/chrischiofalo/Desktop/training-grounds-app && railway login` (interactive — needs you), then `railway up` on the backend service.
- **B. Redeploy elsewhere**: free tiers on Render / Fly.io / Heroku work. The backend is a standard NestJS app, needs Postgres + (optional) Redis + Firebase Admin SDK creds. Rebuild the IPA after with `EXPO_PUBLIC_API_URL=<new-url>` and ship a new TestFlight build.

Until either is done, testers will install the app, see the splash, then get stuck on login (no backend to validate Firebase tokens against).

## Why we couldn't auto-upload

Order of attempts that failed:

| Method | Why it failed |
|---|---|
| `xcrun altool --upload-app --apiKey ...` | `~/.appstoreconnect/private_keys/` empty — no ASC API key |
| `xcrun altool --username ... --password @keychain:AC_PASSWORD` | No app-specific password in keychain |
| `iTMSTransporter` CLI | No saved creds in `~/Library/Application Support/iTMSTransporter` |
| Fastlane Pilot | No `~/.fastlane/` setup |
| `xcrun notarytool` with stored creds | No notarytool credential profiles |

To make next time fully autonomous, drop a `.p8` API key into `~/.appstoreconnect/private_keys/` (App Store Connect → Users and Access → Keys → +). Name it `AuthKey_<KEY_ID>.p8`. Then `xcrun altool --apiKey <KEY_ID> --apiIssuer <ISSUER> --upload-app -f file.ipa` works headlessly.

## File / state inventory (so the next person can pick up cold)

- **Repo head**: `main` at `bc266f1` (Reapply gym wiring) → already pushed to origin
- **Open PRs**: `#3` (handoff doc from April) still open and unmerged at <https://github.com/cchiofalo35/training-grounds-app/pull/3>
- **Build artifacts (April)**:
  - `build/karuna/CrossFitKaruna.xcarchive/` — April archive (old TG branding, dead Railway URL)
  - `build/karuna/export/CrossFitKaruna.ipa` — April signed IPA, 16 MB, still has the old `Apple Distribution: ZORRO STUDIOS` signature
- **DerivedData (this session)**:
  - `/tmp/karuna-archive-build/` — was target for the failed overnight archive attempts; safe to delete
- **Background processes left running** (kill if you want to free CPU):
  - Backend: `node dist/main.js` (PID will differ; was PID 51355)
  - Firebase Auth emulator: `firebase emulators:start --only auth` on 9099 + UI on 4000
- **Env changes I made**:
  - `packages/frontend/.env` — currently reverted to the Railway URL + emulator commented out (so the production build doesn't accidentally bake in the emulator host); backup at `.env.bak`
  - `packages/frontend/ios/.xcode.env.local` — set to `/opt/homebrew/opt/node@20/bin/node` (was Node 25)

## Sanity checks before shipping a fresh build

```bash
# Backend reachable on the URL the IPA will bake in?
curl -sS https://<your-prod-url>/api/v1/gyms | jq '.data | length'   # should be 2

# Karuna gym slug matches frontend mapping?
psql -U chrischiofalo -d training_grounds -c "SELECT slug FROM gyms WHERE slug='crossfit-karuna';"
grep "com.crossfitkaruna.app" packages/frontend/app/redux/slices/gymSlice.ts
# Both should print crossfit-karuna

# Xcode build settings resolve correctly?
cd packages/frontend/ios
xcodebuild -showBuildSettings -workspace TrainingGrounds.xcworkspace -scheme CrossFitKaruna -configuration Release-Karuna 2>&1 \
  | grep -E "^\s+(PRODUCT_BUNDLE_IDENTIFIER|DISPLAY_NAME|ASSETCATALOG_COMPILER_APPICON_NAME)\s"
# Want: com.crossfitkaruna.app, CrossFit Karuna, AppIcon-Karuna
```
