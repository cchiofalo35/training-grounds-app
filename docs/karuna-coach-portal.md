# CrossFit Karuna — Coach Portal (web)

A Karuna-branded web dashboard where coaches log in and run the gym: set
**Tasks & Goals**, manage members, classes, badges, channels, and read the
journal feed. It talks to the same live backend as the phone app, so anything
you create shows up in members' apps automatically.

## Where it lives

**https://cchiofalo35.github.io/crossfit-karuna/**

Standalone — its own GitHub repo (`cchiofalo35/crossfit-karuna`), its own URL,
nothing shared with Training Grounds. Fully CrossFit Karuna branded (green,
"CROSSFIT KARUNA", "Fitter. Stronger. Happier."). For a fully Karuna-owned
address like `admin.crossfitkaruna.com.au`, add a CNAME DNS record pointing at
`cchiofalo35.github.io` and a `CNAME` file in the repo — then it's that domain.

## Login

- **Email:** `coach@crossfitkaruna.app`
- **Password:** `KarunaCoach2026!`

This is a dedicated **admin** account for CrossFit Karuna (created fresh, a member
of the Karuna gym). Change the password any time. The portal is locked to the
Karuna gym, so everything you see and create is Karuna's.

*(There's also a generic `coach@traininggrounds.app` / `Coach1234!` coach login
that works too, but the one above is yours.)*

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

- **Source** lives in the `training-grounds-app` monorepo at `packages/admin`
  (one codebase, tenant-differentiated). `src/brand.ts` holds the brand (name,
  green accent, tagline, **gym id**), chosen by `VITE_BRAND` (`karuna` /
  `training-grounds`) and `VITE_BASE` (the URL base path).
- **Deployed artifact** lives in its OWN repo `cchiofalo35/crossfit-karuna`
  (Pages, branch `main`). The two companies share no repo/URL.
- Every API request sends `X-Gym-Id: <Karuna gym>` (backend TenantMiddleware
  requires it). Karuna gym id: `b2673cbe-8c0f-4a55-8945-4935a6b45d5b`.
- Backend: `https://backend-production-3469.up.railway.app/api/v1` (live Railway,
  multi-tenant — Karuna's data is isolated by gym id).
- **Single-file build:** GitHub Pages on this account doesn't serve newly-deployed
  `/assets/*` (only the root `index.html`), so `scripts/inline.mjs` folds the JS+CSS
  into one self-contained `index.html` (escaping `</script>`). That's the whole app.
- **To redeploy Karuna:**
  ```sh
  cd packages/admin
  VITE_BRAND=karuna VITE_BASE=/crossfit-karuna/ npm run build && node scripts/inline.mjs
  cp dist/index.html /tmp/k/index.html && cp /tmp/k/index.html /tmp/k/404.html  # + .nojekyll
  # commit those to the crossfit-karuna repo's main branch
  ```
- Training Grounds ships separately from this monorepo's `deploy-admin.yml`
  (TG-only) to `cchiofalo35.github.io/training-grounds-app/`.

## Note on "goals"

"Tasks & Goals" here are **gym-wide challenges** (the quest system). Assigning a
**goal to one specific member** isn't supported yet — the backend has no
per-member goal-assignment feature. If you want that (e.g. "Sarah's goal: blue
belt by December" set by the coach), it's a backend addition we can scope next.
Members can already set their *own* personal goals in the app today.
