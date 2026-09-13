# Green Valley High School — Management System

Full-stack school management system built to match the provided wireframe.
Stack: React + Vite + Tailwind (frontend), Node.js + Express (backend), PostgreSQL, JWT auth.

## What's built (MVP, Round 1)
- Auth (login, JWT, role-based access: admin / principal / teacher / student / parent)
- Module 1: Dashboard (stat cards + enrollment trend chart)
- Module 2: Student Management (search, paginate, add student)
- Module 3: Teacher Management (search, add teacher)
- Module 4 (partial): Classes API (used for dropdowns)
- Database schema for ALL 10 modules already migrated (Timetable, Exams, Fees,
  Library, Hostel, Transport, Communication, Attendance) — so later rounds
  just add controllers/routes/pages, no re-migration needed.

## Not yet wired up (placeholder "Coming Soon" pages)
Subjects, Examinations, Attendance, Fees & Payments, Timetable, Assignments,
Library, Transportation, Hostel, Communication, Reports & Analytics.
We'll build these next, same pattern as Students/Teachers.

---

## 1. Backend Setup

```
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `DATABASE_URL` — your PostgreSQL connection string (local, or Render's when you deploy)
- `JWT_SECRET` — generate a real secret: `openssl rand -base64 48`
  **Paste only the generated string here — never paste the whole .env.example file
  as the value. This exact mistake broke your Susu system's login last time.**
- `CLIENT_URL` — must exactly match your frontend's URL (no trailing slash), or
  you'll get a CORS error on login, same as the Susu deployment issue.

Create the database, then run:
```
npm run migrate   # creates all tables
npm run seed       # creates first admin user + sample classes
npm run dev         # starts on http://localhost:5000
```

Seeded admin login:
- Email: `admin@greenvalley.edu.gh`
- Password: `Admin@12345`
**Change this password immediately after your first login in production.**

## 2. Frontend Setup

```
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:
- `VITE_API_URL` — your backend URL + `/api` (e.g. `http://localhost:5000/api`
  locally, or your Render URL + `/api` in production)

```
npm run dev   # starts on http://localhost:5173
```

## 3. Deployment (same pattern as your Susu system)
- **Backend → Render**: set `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL` (your
  Vercel URL, no trailing slash) in Render's Environment tab. Run `npm run
  migrate` and `npm run seed` once via Render's shell after first deploy.
- **Frontend → Vercel**: set `VITE_API_URL` to your Render backend + `/api`.

## Project structure
```
backend/
  src/
    config/db.js          — PostgreSQL pool
    db/schema.sql          — full schema, all 10 modules
    db/migrate.js          — run migration
    db/seed.js             — create admin + sample classes
    middleware/auth.js      — JWT verify + role guard
    controllers/            — one per module
    routes/                 — one per module
    server.js               — Express app entry
frontend/
  src/
    api/client.js          — Axios instance with JWT interceptor
    context/AuthContext.jsx — login state
    layouts/               — Sidebar + AppLayout (matches wireframe nav)
    components/            — StatCard, ProtectedRoute
    pages/                 — Login, Dashboard, Students, Teachers, ComingSoon
    App.jsx                — routes
```
