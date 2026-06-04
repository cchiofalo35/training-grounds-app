# CrossFit Karuna — Complete App Store Connect Setup

Everything for <https://appstoreconnect.apple.com/apps/6762426665>, in the order ASC presents it. Copy each value as-is.

**Two things only you can supply** (Apple requires reachable pages): a **Support URL** and a **Privacy Policy URL**. Everything else below is final copy. Suggested quick fix: create two simple pages on `crossfitkaruna.com.au` (or a free Notion/Carrd page) and use those URLs.

**For TestFlight testing you need almost none of this** — only the bits marked 🟢 TESTFLIGHT. The rest is for the public App Store release later.

---

## 🟢 TESTFLIGHT — what you actually need to test now

App Store Connect → app `6762426665` → **TestFlight** tab:

1. **Build 8 (1.0.0)** finishes processing (~5–15 min after upload).
2. Click **Manage** beside the build → encryption question → it's now answered automatically in the binary (`ITSAppUsesNonExemptEncryption=false`), so this may not even appear. If it does: **No** / exempt.
3. **Test Information** (left sidebar, one-time):
   - **Beta App Description:** `CrossFit Karuna member app — beta. Check in to classes, log WODs and PRs, track streaks, and see the leaderboard.`
   - **Feedback Email:** `chris@zorro-studios.com`
   - **Marketing URL / Privacy Policy:** optional for internal testing — leave blank.
4. **What to Test** (per build):
   > First beta of CrossFit Karuna. Please test: sign-in, class check-in, logging a WOD/PR, the leaderboard, and community channels. Tell us anything that crashes or looks off.
5. **Internal Testing** → create a group (e.g. "Coaches") → add testers (must be in Users & Access). Instant, no review. **OR External Testing** → group / public link → testers by email (first build needs a ~1-day Beta App Review).

That's all that's required to test. Everything below is for the public store listing.

---

## App Information (App Store tab)

| Field | Value |
| --- | --- |
| **Name** | `CrossFit Karuna` |
| **Subtitle** (30 char) | `Train. Track. Thrive.` |
| **Primary Language** | English (Australia) |
| **Bundle ID** | `com.crossfitkaruna.app` *(pre-filled)* |
| **SKU** | `crossfit-karuna-v1` |
| **Primary Category** | Health & Fitness |
| **Secondary Category** | Sports |
| **Content Rights** | Does not use third-party content |

## Pricing and Availability

- **Price:** Free (Tier 0)
- **Availability:** Australia (or all countries — your call)

## Age Rating questionnaire → produces **4+**

Answer every question **None / No**:
- Cartoon/Fantasy Violence, Realistic Violence, Sexual Content, Nudity, Profanity, Alcohol/Tobacco/Drugs, Gambling, Horror, Mature/Suggestive: **None**
- Unrestricted Web Access: **No**
- Gambling / Contests: **No**

---

## App Store Listing (public release)

### Promotional Text (170 char)
> Your box in your pocket. Check in to WODs, log PRs, keep your streak alive, climb the leaderboard, and stay connected with the CrossFit Karuna community.

### Description
> CrossFit Karuna is the member app for the CrossFit Karuna community in West Gosford. Check in to classes, track your training, and stay connected — all in one place.
>
> TRAIN
> • Fast class check-in at the box
> • Log your WOD results, weights and reps
> • Track lifts and PRs across CrossFit, Weightlifting and conditioning
>
> TRACK
> • Daily training streaks with freezes
> • Earn XP and badges for attendance and milestones
> • Personal records and full training history
> • Benchmark WODs — Fran, Murph, Grace and more
>
> THRIVE
> • Community channels for WOD results, PRs and competition prep
> • Leaderboards — weekly, monthly and all-time
> • Journal your sessions and share with your coach
> • Refer friends and earn rewards
>
> Built for CrossFit Karuna members. Sign in with your gym account to get started.

### Keywords (100 char, comma-separated, no spaces)
> `crossfit,wod,pr,fitness,gym,workout,training,karuna,weightlifting,strength,leaderboard,box`

### Copyright
> © 2026 CrossFit Karuna

### Support URL  ⚠️ YOU MUST SUPPLY
> e.g. `https://crossfitkaruna.com.au/app-support` — must load. Apple rejects dead links.

### Marketing URL (optional)
> `https://crossfitkaruna.com.au`

### Privacy Policy URL  ⚠️ YOU MUST SUPPLY (public release only)
> e.g. `https://crossfitkaruna.com.au/privacy` — must load.

---

## Screenshots (public release only — NOT needed for TestFlight)

Apple needs a **6.9"/6.7" iPhone** set (3–10 images, 1290×2796 or 1320×2868 portrait PNG). Capture from the running app on an iPhone 16/17 Pro Max simulator:
1. Dashboard (streak, XP, today's WODs) 2. Check-in 3. Log a PR / LIFT TRACKER 4. Leaderboard 5. A community channel 6. Profile / badges

*(I can generate these from the simulator on request — say the word.)*

---

## Export Compliance — now automatic ✅

`ITSAppUsesNonExemptEncryption=false` is set in the binary (Info.plist + app.config.js), so **future builds won't ask** the encryption question. The already-uploaded build 8 may ask once; answer **No / exempt**.

---

## Status checklist

- [x] Build 8 uploaded to ASC (via Xcode Organizer)
- [x] Real Karuna branding (icon, splash, colors)
- [x] Backend live — testers can sign in and use the app
- [x] Export-compliance auto-answered for future builds
- [ ] Build finished processing → **Ready to Test**
- [ ] Test Information + testers added (🟢 above)
- [ ] *(public launch)* Support URL, Privacy URL, screenshots, then Submit for Review
