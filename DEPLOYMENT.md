# Deployment checklist

## One-time (security follow-up)

- [ ] **Rotate the MongoDB Atlas password.** A connection string with the old
      password was committed to this repository. Update `MONGODB_URI` on Render
      afterwards.
- [ ] **Decide on git history.** The old password stays in history until the
      file is purged (`git filter-repo --path note --invert-paths`, then force
      push). Rotation is what actually protects the database.
- [ ] **Clear published default passwords:**
      `node scripts/clear_default_passwords.js` (dry run), then `--apply`.
- [ ] Make sure the super-admin can sign in through Clerk with the super-admin
      email before relying on it (its leaked password is cleared on startup).

## Backend (Render)

- [ ] `NODE_ENV=production`
- [ ] `MONGODB_URI`, `JWT_SECRET` (32+ random characters)
- [ ] `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` — without the secret key,
      Clerk sign-ins are rejected
- [ ] `FRONTEND_URL` / `CLIENT_ORIGIN`
- [ ] Email: `EMAIL_USER` + `EMAIL_PASS`, or `RESEND_API_KEY` + `RESEND_FROM`
- [ ] Optional: `TWILIO_*` (SMS), `GEMINI_API_KEY` (AI chat),
      `GOOGLE_CLIENT_ID` (legacy Google sign-up; Google tokens are rejected without it),
      `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PHONE` (plan-upgrade alerts)
- [ ] `node scripts/preflight_check.js` passes
- [ ] `GET /healthz` reports `database: connected`

## Frontend (Vercel)

- [ ] `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`
- [ ] Clerk dashboard: production instance, allowed origins include the live domains

## Smoke test after each deploy

- [ ] Sign in with Clerk as a restaurant owner → dashboard loads, menu edit saves
- [ ] Sign in as a team member → lands on their restaurant, cannot open another restaurant's admin
- [ ] Sign in as super-admin → `/super-admin` loads, approve a pending plan upgrade
- [ ] Submit a reservation on a public restaurant page → owner receives it
- [ ] New restaurant sign-up → starts on Basic, requested plan shows as pending

CI (`.github/workflows/ci.yml`) must be green before merging to `main`.
