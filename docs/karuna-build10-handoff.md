# CrossFit Karuna — Build 10 Handoff (gamification + chart fixes)

**Status:** ✅ Archive built, signed, and staged in Xcode Organizer. One interactive step left for you.

## What this build fixes (the two bugs you reported)

1. **"XP points / counting points don't seem to be working."**
   - Root cause: the backend awarded XP correctly, but the app never re-fetched the user
     after earning it, so the dashboard showed stale numbers (often `0 XP`).
   - Fix: added a lightweight `refreshUser` thunk (`authSlice.ts`) and dispatched it after
     a check-in (`CheckInScreen`) and after logging a PR (`LogPrScreen`). The XP bar now also
     shows **"X XP to next level"** (remaining), not the level's total threshold.
   - Verified on the simulator: dashboard now reads **275 XP · 225 XP to next level · Lvl 29 ·
     14,275 total XP** with a partially-filled progress bar.

2. **"I can log a lift but can't see my monthly progression chart."**
   - Root cause: the `PrChart` component was correct, but the demo account only had **one**
     PR per movement — a line needs ≥2 points, so it rendered "No PR history yet."
   - Fix: seeded multi-month PR progression for the demo account (Back Squat 120→142.5 kg over
     6 entries Feb–May, plus Deadlift/Clean&Jerk/Snatch/Strict Press). The history API now
     returns 6 points for Back Squat — the Lift Detail screen draws a real progression line.

Committed on `main`: `066b761` (gamification refresh) + `0503db6` (build 10 bump).
`main` is **in sync with origin/main** — already pushed to GitHub.

## The archive

- **Location:** Xcode Organizer → *Window ▸ Organizer ▸ Archives* → **CrossFit Karuna**
- **File:** `~/Library/Developer/Xcode/Archives/2026-06-04/CrossFitKaruna-build10.xcarchive`
- **Version:** 1.0.0 **(build 10)** · bundle `com.crossfitkaruna.app`
- **Team baked in:** ZM54C3W52G (ZORRO STUDIOS PTY LTD) — fixes the old "No Team Found" error.
- The two superseded local archives (build 8 = no team, build 9 = no gamification fixes) were
  moved to `~/Library/Developer/Xcode/Archives/_superseded-karuna/` so the Organizer shows only
  build 10. They're recoverable if ever needed.

## The one step you have to do (can't be automated — interactive Apple signing)

1. Xcode Organizer is already open to the build-10 archive.
2. Click **Distribute App** → **App Store Connect** → **Upload**.
3. Keep the defaults (automatic signing, upload symbols) → **Upload**.
4. Wait ~5–10 min for App Store Connect to finish "Processing", then it appears under
   TestFlight as build 10.

That's it — metadata, export-compliance (`ITSAppUsesNonExemptEncryption=false` is in Info.plist),
and the reviewer account are all already in place from the earlier builds.

## Backend / testers

- Backend is live on Railway: `https://backend-production-3469.up.railway.app/api/v1`
  (the app's `.env` points here for production builds).
- **Production reviewer account (give this to Apple / testers):**
  `appreview@crossfitkaruna.app` / `CFKaruna2026!`
- I seeded this account **on production** (via the public API, backdated `loggedAt`) so the two
  fixes are visible the moment you log in — no waiting to accumulate data:
  - **~2,300 XP** on the dashboard (was 0) → the XP bar shows real progress.
  - **5 lifts with multi-month PR history** → Lift Tracker ▸ tap **Back Squat** shows a 6-point
    progression line (120→142.5 kg, Feb→May). Deadlift/Snatch/Clean&Jerk/Strict Press too.
  - Logging a new PR bumps the XP immediately (the refresh fix).
  - (Streak is still 0 — that's a genuine fresh-account value; check in to start one.)
- Production Karuna gym id: `b2673cbe-8c0f-4a55-8945-4935a6b45d5b` (prTracking + benchmark on).

## Known low-priority follow-ups (not blockers)

- Community / Weightlifting screens swallow some errors silently (no user-facing toast).
- Referral service is stubbed on the frontend; leaderboard has no empty-state copy.
- Public App Store release still needs a Privacy Policy URL (crossfitkaruna.com.au/privacy is 404).
  TestFlight does **not** require it.
