# CrossFit Karuna — TestFlight Submission Status

**Last updated:** 2026-04-18

Use this doc to pick up where the Karuna TestFlight submission left off. Supersedes any older notes in [tenant-builds.md](tenant-builds.md) for Karuna specifically.

---

## Where we are

The multi-tenant Xcode setup is shipped (merged in [PR #2](https://github.com/cchiofalo35/training-grounds-app/pull/2)). A signed, distribution-ready Karuna IPA exists on disk, built from the pre-merge codebase via the old `ship-karuna-local.sh` workflow. The code that matters at runtime (tenant routing via bundle ID in [gymSlice.ts](../packages/frontend/app/redux/slices/gymSlice.ts)) was already in place before the merge, so that IPA is functionally equivalent to what the new scheme would produce.

```
/Users/chrischiofalo/Desktop/training-grounds-app/build/karuna/export/CrossFitKaruna.ipa
```

- 16 MB, signed by `Apple Distribution: ZORRO STUDIOS PTY LTD (ZM54C3W52G)`
- `CFBundleIdentifier=com.crossfitkaruna.app`, display name `CrossFit Karuna`
- Valid embedded provisioning profile, thin arm64, TestFlight-ready

---

## To ship (human steps, ~15 min total)

### 1. Upload IPA (~5 min)

- Open **Transporter.app** (free in Mac App Store)
- Sign in with `chris@zorro-studios.com`
- Drag `build/karuna/export/CrossFitKaruna.ipa` into Transporter → **Deliver**
- Wait for "Delivered successfully," then ~10 min for App Store Connect to finish processing the build

### 2. Fill ASC metadata

- Open https://appstoreconnect.apple.com/apps/6762426665
- Paste values from [karuna-asc-metadata.md](karuna-asc-metadata.md)
- **For TestFlight Internal Testing only**, the minimum required:
  - App Information (name, bundle ID, category, age rating)
  - Pricing = Free (Tier 0)
  - Export Compliance answer (standard encryption exempt)
- Screenshots, description, privacy policy, support URL are **only required** for public App Store release, not TestFlight Internal.

### 3. Add testers

- ASC → **TestFlight** → Internal Testing → pick/create a group → add testers by Apple ID email
- Testers get a TestFlight invite email and can install immediately

---

## Architecture chosen

**Scheme-based multi-tenant** (see [PR #2](https://github.com/cchiofalo35/training-grounds-app/pull/2)):

- One Xcode target (`TrainingGrounds`) with four build configurations: `Debug`, `Release`, `Debug-Karuna`, `Release-Karuna`
- Karuna configs override `PRODUCT_BUNDLE_IDENTIFIER`, `PRODUCT_NAME`, `DISPLAY_NAME`, `ASSETCATALOG_COMPILER_APPICON_NAME`, `TENANT_URL_SCHEME`, `TENANT_EXPO_URL_SCHEME`
- Info.plist uses `$(VAR)` interpolation for these values
- Separate scheme `CrossFitKaruna.xcscheme` selects Karuna configs for Archive/Run

**Rejected alternatives:**
- **EAS / Expo cloud build** — decided against (see memory file `feedback_no_eas.md`). Local Xcode only.
- **Target duplication** — higher risk, requires Podfile surgery, no real benefit over configurations for this use case.
- **`expo prebuild --clean` per tenant** — the old `scripts/ship-karuna-local.sh` approach. Wipes the checked-in `ios/` folder on every build, incompatible with keeping native edits in git. Superseded.

---

## Known issues / future rebuilds

### Xcode 26.4 + RN 0.76 clang null-character bug

Fresh `xcodebuild archive -scheme CrossFitKaruna` on Xcode 26.4 + React Native 0.76.6 fails with:

```
error: null character ignored [-Werror,-Wnull-character]
  (in node_modules/react-native/ReactCommon/yoga/yoga/event/event.cpp)
```

The file is valid ASCII on disk; the compiler is reading null bytes from somewhere (likely stale module cache / SDK stat cache). Also reproduced after `rm -rf ~/Library/Developer/Xcode/DerivedData/TrainingGrounds-*`.

**Not blocking the current TestFlight ship** — we're using the existing signed IPA. Needs investigation before the next rebuild. Paths to try:
- `xcrun --reset-caches`
- `rm -rf ~/Library/Developer/Xcode/DerivedData/ModuleCache.noindex`
- `rm -rf ~/Library/Developer/Xcode/DerivedData/SDKStatCaches.noindex`
- Add `GCC_TREAT_WARNINGS_AS_ERRORS=NO` or `WARNING_CFLAGS=-Wno-null-character` to the Karuna configs
- Upgrade RN (0.76 → 0.77) or Xcode toolchain reinstall

### Obsolete artifacts in main checkout

The old prebuild-per-tenant workflow left leftovers in the main checkout:

- `packages/frontend/ios/CrossFitKaruna.xcodeproj/`
- `packages/frontend/ios/CrossFitKaruna.xcworkspace/`
- `packages/frontend/ios/CrossFitKaruna/`
- `scripts/ship-karuna-local.sh` (uses `expo prebuild --clean`, incompatible with new approach)

All gitignored / uncommitted. Safe to `rm -rf` the first three; delete or rewrite `ship-karuna-local.sh` to just `xcodebuild archive -scheme CrossFitKaruna`.

### User WIP stashed

At the time this doc was written, the main checkout had substantial uncommitted WIP across ~20 frontend files (auth, check-in, community, journal, rewards). Stashed as:

```
stash@{0}: On main: pre-karuna-ship WIP (frontend screens, ship-karuna-local.sh)
```

Auto-pop failed with `fatal: mmap failed: Operation timed out` (transient system issue). Run `git stash pop` manually when picking back up.

After popping the stash, the two tracked files that show modified (`packages/frontend/ios/Podfile.lock`, `packages/frontend/ios/TrainingGrounds.xcodeproj/project.pbxproj`) are pod-install regenerations identical to what PR #2 merged — safe to `git checkout` those files.

---

## After TestFlight ships, before public App Store release

- [ ] Write working Support URL + Privacy Policy URL (placeholders in [karuna-asc-metadata.md](karuna-asc-metadata.md))
- [ ] Capture 6.7" + 6.5" iPhone screenshots (3–10 each) from Karuna build on iPhone 16 Pro Max simulator
- [ ] Set `ITSAppUsesNonExemptEncryption=false` in [Info.plist](../packages/frontend/ios/TrainingGrounds/Info.plist) to stop TestFlight export-compliance prompts per build
- [ ] Fix the clang null-character bug so `xcodebuild archive -scheme CrossFitKaruna` works clean on Xcode 26.4
- [ ] Bump `CFBundleVersion` before each new upload (ASC rejects duplicates)
- [ ] Register `com.crossfitkaruna.app` App ID in Apple Developer with Push Notifications capability (probably done during the earlier IPA build, verify before re-archive)
