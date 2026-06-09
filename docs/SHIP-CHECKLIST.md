# Ship Checklist — what's done & what needs your credentials

_Last updated by the review pass._

## ✅ Done autonomously

### Code review & fixes (committed + pushed to GitHub `main`)
- **Multi-tenant security hole closed** (`fix(backend): close multi-tenant security gaps`, commit `14f7d69`):
  - JWT auth now verifies the user is an active member of the gym in `X-Gym-Id` — previously any logged-in user could pass any gym id and act inside it.
  - Coach check-in resolves members within the coach's gym only.
  - Profile stats scoped per-gym (no more cross-gym aggregation).
- **App Review account fixed**: `appreview@crossfitkaruna.app` had zero gym memberships — the new membership check would have locked Apple's reviewers out with a 403. Added memberships in both gyms (production DB).

### Verification (all green)
- Backend `tsc` ✅ clean · Frontend `tsc` ✅ clean · Shared `tsc` ✅ clean · Admin `tsc` ✅ clean
- Backend test suite ✅ all pass
- Admin web build ✅ exit 0
- Navigation audit ✅ every `navigate()` target is a registered route
- Redux ✅ all 5 slices wired, `refreshUser` thunk present

### Builds
- **CrossFit Karuna** `.ipa` — built, signed, exported → `build/karuna/export/CrossFitKaruna.ipa`
- **Training Grounds** `.ipa` — building now → will land at `build/tg/export/TrainingGrounds.ipa`

---

## 🔑 Blocked on your credentials (3 things)

### 1. App-specific password → uploads both apps to TestFlight
Create one: <https://appleid.apple.com/account/manage> → Sign-In and Security → App-Specific Passwords → `+`

Then I run (or you can):
```bash
xcrun altool --upload-app --type ios \
  --file build/karuna/export/CrossFitKaruna.ipa \
  --username chris@zorro-studios.com --password <app-specific-password>

xcrun altool --upload-app --type ios \
  --file build/tg/export/TrainingGrounds.ipa \
  --username chris@zorro-studios.com --password <app-specific-password>
```
- Karuna App Store record: `6762426665`
- Training Grounds App Store record: `6761029689`

### 2. `railway login` → deploys the backend security fix to production
```bash
railway login
cd packages/backend && railway up --detach   # from the worktree that's linked
```
Until this runs, the security fixes are in GitHub but **not yet live** on the Railway backend.

### 3. (Optional) App Store Connect API key → fully hands-off future releases
<https://appstoreconnect.apple.com/access/integrations/api> → `+` Admin → download `.p8`.
Reusable forever; lets `eas submit` / `altool` upload without a password each time.

---

## After upload
Apple processes each build ~10 min, then invite testers:
- Karuna: <https://appstoreconnect.apple.com/apps/6762426665/distribution/ios/testflight>
- Training Grounds: <https://appstoreconnect.apple.com/apps/6761029689/distribution/ios/testflight>
