
# Mappy — MERN Map with Phone OTP Authentication

**One-line:** A mobile-friendly MERN app where users sign in with phone OTP (Twilio Verify / test mode) and access a protected Leaflet + OpenStreetMap map showing user location and nearby markers.

---

## Live status (local dev)
- Backend: Express + Mongoose — working locally (OTP flow working in `TWILIO_TEST_MODE=true`).
- Frontend: React (Vite) + Tailwind + react-leaflet — working locally (map UI, layer selector, zoom UI).
- Authentication: Phone-based OTP (Twilio Verify or Test Mode), JWT short-lived access token (in memory) + HttpOnly refresh token cookie with rotation.

---

## Repo layout
```
/server
├─ src/
|   ├─ controllers/
|   ├─ models/
|   ├─ routes/
|   ├─ services/
|   ├─ config/
|   └─ server.js
├─ package.json
/client (or mappy-frontend)
├─ src/
|   ├─ api/
|   ├─ context/
|   ├─ pages/
|   └─ components/
├─ package.json
README.md
.gitignore
.env.example
```



## Setup (local)

### Prerequisites
- Node.js 18+
- npm
- MongoDB (local or Atlas)
- (Optional) Redis for production rate limiter
- Twilio account (for real OTP); for development use `TWILIO_TEST_MODE=true`

### Backend

cd server
cp .env.example .env
# edit .env and set values (MONGODB_URI, JWT secrets, TWILIO_*, CLIENT_URL)
npm install
npm run dev
# server runs at http://localhost:4000
```

### Frontend
```
cd mappy-frontend   # or client/
cp .env .env.local   # set VITE_API_URL=http://localhost:4000
npm install
npm run dev
# frontend runs at http://localhost:5173
```

---

## API Endpoints (summary)

* `POST /auth/request-otp` — body: `{ phone, channel?: 'sms'|'whatsapp' }`
* `POST /auth/verify-otp` — body: `{ phone, code, deviceInfo?, channel? }` → returns `{ accessToken, expiresIn }` and sets `refreshToken` cookie
* `POST /auth/refresh` — rotates refresh token; requires cookie
* `POST /auth/logout` — clears refresh cookie and revokes session
* `GET /user/me` — protected (Authorization: Bearer <accessToken>)
* `GET /map/markers?lat=&lng=&radius=` — protected — returns markers near coordinates

---

## Environment variables

Copy `.env.example` to `.env` (backend) and set values.

Important values:

* `MONGODB_URI`
* `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
* `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`
* `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`
* `TWILIO_TEST_MODE=true` (for local dev without Twilio)
* `CLIENT_URL` (frontend origin)

Frontend `.env`:
```
VITE_API_URL=http://localhost:4000
```

---

## Remaining / Incomplete tasks (TODO)

### Priority — must have
* [ ] Atomic refresh-token rotation (`findOneAndUpdate` pattern) to prevent reuse race conditions.
* [ ] Redis-backed rate limiter for OTP endpoints (production-safe).
* [ ] CSRF protection for cookie-based refresh endpoints (double-submit or anti-CSRF tokens).
* [ ] Harden cookie settings in production: `secure`, `sameSite`, proper domain.

### Medium priority
* [ ] Session manager: `GET /auth/sessions`, `POST /auth/revoke` to manage user sessions.
* [ ] Tests: Jest + supertest for auth flows and token rotation.
* [ ] Logging & monitoring: structured logs + alerts (Sentry or similar).

### Nice-to-have / UX
* [ ] Silent refresh on app load to rehydrate accessToken if refresh cookie exists.
* [ ] Resend OTP & cooldown timer UI.
* [ ] Marker clustering, server-side pagination for markers.
* [ ] Service Worker caching for map tiles (Workbox).
* [ ] Option to switch to vector tiles (MapLibre) for smoother map UX.

---

## Known issues / limitations
* Leaflet/React-Leaflet initialization race in React StrictMode — resolved with defensive cleanup; recommended to disable StrictMode in dev while working with map.
* Twilio Verify: WhatsApp requires sandbox join / template approvals. Use test mode for local testing.
* Access token stored in memory → page refresh loses access token (silent refresh required to retain session).
* Rate limiting currently in-memory (not shared across instances) — must migrate to Redis before production.

---

## Security checklist (important)
* Use HTTPS in production and set cookies `secure: true`.
* Keep JWT secrets safe — never commit `.env`.
* Rotate refresh tokens on refresh and revoke on suspicious reuse.
* Limit OTP attempts per phone/IP and add CAPTCHAs if abuse detected.
* Validate inputs with Joi to prevent NoSQL injection.

---

## How to contribute
1. Fork repo → create feature branch `feat/your-feature` → commit → push → open PR.
2. Use descriptive commit messages and include unit/integration tests where applicable.

---

## Contacts
* Maintainer: Pranav (owner of repo)
EOF

cat > .gitignore << 'EOF'
# Node
node_modules/
npm-debug.log*
yarn-error.log*
pnpm-lock.yaml
package-lock.json

# env
.env
.env.local
.env.development
.env.production

# logs
logs
*.log
pids
*.pid
*.seed

# build / dist
dist/
build/
.vite

# OS
.DS_Store
Thumbs.db

# IDEs
.vscode/
.idea/
*.sublime-workspace
*.sublime-project

# mac
.AppleDouble
.LSOverride


# mongo, redis local files (if any)
dump/
dump-*
redisdump.rdb

# Vite / React
/.cache
/public/*_cache
EOF
```
