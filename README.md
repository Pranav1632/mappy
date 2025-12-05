
---

```bash
# Create README.md and .gitignore
cat > README.md << 'EOF'
# 🌍 Mappy — MERN Map with Phone OTP Authentication

> A mobile-friendly MERN app where users log in using phone OTP (Twilio Verify / Test Mode) and view a protected map showing their location and nearby dynamic markers.

---

## 🚀 Local Development Status

| Component       | Status |
|-----------------|--------|
| Backend (Node/Express) | ✔ Running with test OTP mode |
| Frontend (React + Vite) | ✔ Running (map UI active) |
| Auth System | ✔ Phone OTP + JWT rotation |

---

## 🗂 Project Structure

```

/server
│ package.json
│ .env.example
│ src/
│   ├ controllers/
│   ├ models/
│   ├ routes/
│   ├ services/
│   ├ config/
│   └ server.js
|
/client (or mappy-frontend)
│ package.json
│ src/
│   ├ api/
│   ├ context/
│   ├ pages/
│   └ components/
|
README.md
.gitignore
.env.example

````

---

## ⚙️ Setup Instructions

### 🔧 Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
````

📌 Backend URL → `http://localhost:4000`

---

### 🎨 Frontend

```bash
cd mappy-frontend
cp .env.example .env.local
npm install
npm run dev
```

📌 Frontend URL → `http://localhost:5173`

---

## 📡 Important API Endpoints

### Authentication

| Method | Route               | Description               |
| ------ | ------------------- | ------------------------- |
| POST   | `/auth/request-otp` | Request OTP               |
| POST   | `/auth/verify-otp`  | Verify OTP + issue tokens |
| POST   | `/auth/refresh`     | Rotate refresh token      |
| POST   | `/auth/logout`      | Logout user               |
| GET    | `/user/me`          | Get logged-in user        |

### Map APIs

| Method | Route                            |               |
| ------ | -------------------------------- | ------------- |
| GET    | `/map/markers?lat=&lng=&radius=` | Fetch markers |

---

## 🔑 Environment Variables

Backend `.env`

```
MONGODB_URI=
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
ACCESS_TOKEN_TTL=5m
REFRESH_TOKEN_TTL=30d
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
TWILIO_TEST_MODE=true
CLIENT_URL=http://localhost:5173
```

Frontend `.env.local`

```
VITE_API_URL=http://localhost:4000
```

---

## 🧩 TODO — Remaining Work

### Priority

* [ ] Redis rate-limiter for OTP
* [ ] Secure cookie settings for production
* [ ] Atomic refresh token reuse detection
* [ ] CSRF protection

### Next-level features

* [ ] Session manager UI
* [ ] Jest tests
* [ ] Monitoring & logging
* [ ] Map marker clustering

---

## ⚠ Limitations

* Page refresh drops access token (silent refresh needed)
* Rate limit is in-memory
* Test OTP only works when `TWILIO_TEST_MODE=true`

---

## 🔒 Security Checklist

✔ HTTPS in production
✔ Never commit `.env`
✔ Rotate refresh tokens frequently
✔ Validate input fields

---

## 🤝 Contribution Guide

```bash
git checkout -b feat/feature-name
git commit -m "feat: your update"
git push
```

Open a PR 🚀

---

**Maintainer:** Pranav
EOF

cat > .gitignore << 'EOF'

# Node

node_modules/
npm-debug.log*
yarn-error.log*
pnpm-lock.yaml
package-lock.json

# env files

.env
.env.local
.env.production
.env.development

# logs

logs/
*.log

# build output

dist/
build/
.vite/

# cache

.cache/
public/*_cache

# OS files

.DS_Store
Thumbs.db

# IDE folders

.vscode/
.idea/

# DB Dump

dump/
dump-*
EOF

````

---

🔥 Done!  
Now run:

```bash
git add .
git commit -m "docs: add README and gitignore"
git push origin main
````

