# CrossFit Karuna — Coach Portal (web)

A Karuna-branded web dashboard where coaches log in and run the gym: set
**Tasks & Goals**, manage members, classes, badges, channels, and read the
journal feed. It talks to the same live backend as the phone app, so anything
you create shows up in members' apps automatically.

## Where it lives

**https://cchiofalo35.github.io/training-grounds-app/**

(The URL path is the GitHub repo name; the app itself is fully CrossFit Karuna —
green branding, "CROSSFIT KARUNA" wordmark, "Fitter. Stronger. Happier.")

## Login

- **Email:** `coach@traininggrounds.app`
- **Password:** `Coach1234!`

This account has the **coach** role (required for the dashboard). The portal is
locked to the **Karuna** gym, so even though the email is a generic coach login,
everything you see and create is Karuna's. If you'd prefer a branded
`coach@crossfitkaruna.app` login, say the word — it's a 2-minute add.

## What you can do

- **Tasks & Goals** (the main ask): create challenges members earn XP for. They
  appear in everyone's app automatically — no per-person assignment needed.
  - **Weekly Task** — short-term (e.g. "3x This Week", +100 XP)
  - **Monthly Goal** — longer-term (e.g. "12 in a Month", +300 XP)
  - **Special Challenge** — one-offs (e.g. "Double Bodyweight Deadlift", +500 XP)
  - Each has a target ("criteria": check-ins, classes, streak days, PRs, etc.),
    an XP reward, and optional start/end dates. Edit, activate/deactivate, or
    delete any time. Karuna already has 18 live ones you can edit as examples.
- **Members** — view roster, search, change roles/belts/stripes.
- **Classes** — create/edit the class schedule.
- **Badges** — create achievement badges.
- **Journal Feed** — read members' shared session reflections and comment.
- **Channels** — manage the community channels.

## How it's wired (for future me)

- One codebase, tenant-differentiated — same approach as the mobile app.
  `packages/admin/src/brand.ts` holds the brand (name, green accent, tagline,
  **gym id**), chosen by `VITE_BRAND` (defaults to `karuna`). A Training Grounds
  build is just `VITE_BRAND=training-grounds`.
- Every API request sends `X-Gym-Id: <Karuna gym>` (the backend's
  TenantMiddleware requires it). Karuna gym id: `b2673cbe-8c0f-4a55-8945-4935a6b45d5b`.
- Backend: `https://backend-production-3469.up.railway.app/api/v1` (live Railway).
- Deploy: push to `main` touching `packages/admin/**` → GitHub Action
  `deploy-admin.yml` builds and publishes to GitHub Pages.

## Note on "goals"

"Tasks & Goals" here are **gym-wide challenges** (the quest system). Assigning a
**goal to one specific member** isn't supported yet — the backend has no
per-member goal-assignment feature. If you want that (e.g. "Sarah's goal: blue
belt by December" set by the coach), it's a backend addition we can scope next.
Members can already set their *own* personal goals in the app today.
