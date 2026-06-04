# CrossFit Karuna — App Store Connect Metadata

Paste these values into https://appstoreconnect.apple.com/apps/6762426665 → App Information and App Store tabs. Fields marked **(required)** block submission; the rest can be deferred to the App Store release but TestFlight works without them.

---

## App Information

| Field | Value |
| --- | --- |
| **Name** *(required)* | `CrossFit Karuna` |
| **Subtitle** (30 char max) | `Train. Track. Thrive.` |
| **Primary Language** | English (Australia) |
| **Bundle ID** | `com.crossfitkaruna.app` *(pre-filled)* |
| **SKU** | `crossfit-karuna-v1` *(set during app creation)* |
| **Primary Category** *(required)* | Health & Fitness |
| **Secondary Category** | Sports |
| **Content Rights** | Does NOT contain, show, or access third-party content |

## Age Rating *(required)*

All categories: **None / No**. Produces rating **4+**.

## Pricing and Availability *(required)*

- **Price**: Free (Tier 0)
- **Availability**: All countries or Australia-only (your call)

---

## App Store Listing (for public release — NOT needed for TestFlight)

### Promotional Text (170 char max)
> Join your CrossFit Karuna community. Track WODs, log PRs, keep your streak, and see where you stand on the leaderboard.

### Description
> CrossFit Karuna is the gym companion app for members of CrossFit Karuna. Check in to classes, track your training, and stay connected with your community — all in one place.
>
> **Train**
> • Quick class check-in at the gym
> • Log your WOD results, weights, and reps
> • Track progress across CrossFit, Weightlifting, and conditioning
>
> **Track**
> • Build streaks for daily training
> • Earn XP and badges for attendance and milestones
> • See your personal records and training history
>
> **Thrive**
> • Community channels for each class type
> • Leaderboards — weekly, monthly, all-time
> • Journal your sessions and share with your coach
> • Refer friends and earn rewards
>
> Built for members of CrossFit Karuna. Sign in with your gym account to get started.

### Keywords (100 char max, comma-separated)
> `crossfit,wod,fitness,gym,workout,training,karuna,strength,weightlifting,community,tracker,habit`

### Support URL *(required)*
> https://crossfitkaruna.com.au/support
>
> *(Placeholder — replace with actual support URL. Apple requires a working URL.)*

### Marketing URL (optional)
> https://crossfitkaruna.com.au

### Copyright
> © 2026 CrossFit Karuna

### Privacy Policy URL *(required)*
> https://crossfitkaruna.com.au/privacy
>
> *(Placeholder — Apple requires a reachable privacy policy before App Store release. Not required for TestFlight Internal Testing.)*

---

## Screenshots *(required for App Store release, NOT for TestFlight Internal)*

Apple requires **6.7" iPhone** and **6.5" iPhone** screenshot sets (3–10 each). Take them from the Karuna build on an iPhone 16 Pro Max simulator once the build is installed:

1. Dashboard / Home (streak, XP, today's WODs)
2. Class check-in flow
3. WOD logging / PR entry
4. Leaderboard
5. Community channel
6. Profile / badges

**Sizes Apple accepts for 6.7"**: 1290×2796 or 1284×2778 portrait PNG.

---

## TestFlight-only fields (fill in for internal testing)

### What to Test
> First TestFlight drop for CrossFit Karuna. Please test: sign-in, class check-in, WOD logging, leaderboard, community channels. Report anything that crashes or looks broken.

### Beta App Description
> CrossFit Karuna member app — internal beta for coaches and staff.

### Feedback Email
> chris@zorro-studios.com *(or whoever owns beta feedback)*

### Marketing URL
> (leave blank for beta)

### Privacy Policy URL
> (leave blank for beta — only required for public App Store release)

---

## Export Compliance

When uploading a build in TestFlight, Apple asks: *"Does your app use encryption?"*

- **Answer**: Yes
- **Follow-up**: Uses only standard encryption exempt under **ITSAppUsesNonExemptEncryption** = NO (HTTPS / TLS only, no custom crypto).

You can set this permanently by adding `<key>ITSAppUsesNonExemptEncryption</key><false/>` to `Info.plist` so TestFlight stops asking.

---

## Submission Checklist

- [ ] App Information filled in (name, bundle ID, category, age rating)
- [ ] Pricing set to Free
- [ ] Export compliance answered
- [ ] Build uploaded via Transporter (.ipa at `build/karuna/CrossFitKaruna.ipa`)
- [ ] Build finished processing in ASC (~10 min after upload)
- [ ] Internal testers added (ASC → TestFlight → Internal Testing → pick group)
- [ ] *(Optional for public launch)* Screenshots, description, keywords, privacy policy URL, support URL
