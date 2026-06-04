# CrossFit Karuna — Build 9 Wake-Up Handoff

**Written while you napped, 2026-06-04.**

## What I could NOT do autonomously (and why)
**Upload build 9 to TestFlight.** It needs the Xcode Organizer *Distribute* click — that flow is interactive and uses your logged-in Xcode session, which command-line tools can't reach. There's no App Store Connect API key or app-specific password on the machine, so there's no headless path. (If you want fully autonomous uploads next time, create an ASC API key — see bottom.)

## What I DID do
1. **Reloaded the simulator** (iPhone 14 Plus) with the latest build — branding fix, channel icons, and the new **Lifts** bottom tab. Open it to see all three.
2. **Built + staged a signed Build 9 archive** in Xcode Organizer, with all of today's changes baked in and pointed at the **production** Railway backend.
3. **Bumped CFBundleVersion → 9** and pushed everything to GitHub (`origin/main`).

## Everything in Build 9 (vs the build 8 already on TestFlight)
- Pre-auth branding fix — Karuna login shows green "CROSSFIT KARUNA" (build 8 showed "Training Grounds")
- Primary buttons themed per tenant (green on Karuna)
- Per-channel icons in Community (no more plain `#`)
- **Lifts** bottom tab replaces the QR Check In tab on Karuna (check-in still on Home via "Quick Check-In")
- Export-compliance auto-answered (no more encryption prompt)
- Architecture cleanups (config-driven features)

## Your one job on wake: upload Build 9 (~5 min)
1. **Xcode → Window → Organizer → Archives tab.**
2. Select **CrossFit Karuna … build9** (dated 2026-06-04).
3. **Distribute App → App Store Connect → Upload** → through the prompts → Upload.
4. After it processes (~10 min) in App Store Connect → TestFlight, it becomes the active beta build. Internal testers get it automatically; for external, submit for Beta App Review.

*(If Organizer doesn't show the build9 archive, close + reopen the Organizer window — it re-reads the Archives folder.)*

## Still outstanding (not blocking the upload)
- **Privacy Policy URL** — required before *public* App Store release (not TestFlight). `crossfitkaruna.com.au/privacy` is a 404. I can draft a hostable privacy policy on request.
- **App Store screenshots** — login screen captured at 1284×2778 (`build/karuna-screenshots/01-login.png`). The logged-in screens need capturing; the simulator is signed in to the demo account and ready — open it and I can grab Home / Lifts / Leaderboard / Community / Profile.
- **Redundant Home button** — the Home dashboard still has a "LIFT TRACKER" button now that Lifts is a tab; harmless, can be removed for tidiness.

## Reference: accounts + backend
- **Production reviewer/login** (real Firebase + Railway): `appreview@crossfitkaruna.app` / `CFKaruna2026!`
- **Simulator demo** (local backend + emulator, rich seeded data): `demo@traininggrounds.app` / `Demo1234!`
- Backend: `https://backend-production-3469.up.railway.app/api/v1` — live.

## To make future uploads fully autonomous
Create an App Store Connect API key (App Store Connect → Users and Access → Integrations → Team Keys → Generate, role App Manager), download the `.p8`, drop it in `~/.appstoreconnect/private_keys/AuthKey_<KEYID>.p8`, and give me the Key ID + Issuer ID. Then I can sign + upload builds with `xcrun altool` headlessly — no Organizer clicks.
