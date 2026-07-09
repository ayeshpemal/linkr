# Linkr

Linkr is a full-stack URL shortener with authentication and click analytics.
Users can sign up, log in, create short links, view their links in a dashboard, and inspect per-link click trends over time.

## Stack

- Backend: Go, `net/http`, PostgreSQL, JWT auth
- Frontend: Next.js App Router, React, Tailwind CSS, Recharts

## Run Locally

### 1. Requirements

- Node.js 20+
- Go 1.26+
- PostgreSQL 14+

### 2. Create the database

Create a local PostgreSQL database named `linkr` and enable `pgcrypto` because the schema uses `gen_random_uuid()`.

```sql
CREATE DATABASE linkr;
\c linkr
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

Then apply the schema:

```bash
psql -U postgres -d linkr -f backend/schema.sql
```

### 3. Configure the backend

Create `backend/.env`:

```env
DATABASE_URL=postgres://postgres:secret@localhost:5432/linkr
JWT_SECRET=dev-secret
```

Adjust the connection string if your local Postgres username, password, host, or port are different.

### 4. Start the backend

From the `backend` folder:

```bash
go run ./cmd/api
```

The API will start on `http://localhost:8080`.

### 5. Install frontend dependencies

From the `frontend` folder:

```bash
npm install
```

### 6. Create .env file

Create `frontend/.env`:

```env
NEXT_PUBLIC_SHORT_URL_BASE=http://localhost:8080
```

Adjust the `NEXT_PUBLIC_SHORT_URL_BASE` if your backend is running on a different host or port.

### 7. Start the frontend

Still in the `frontend` folder:

```bash
npm run dev
```

The app will start on `http://localhost:3000`.

## Local App Flow

1. Open `http://localhost:3000`
2. Create an account at `/signup`
3. Log in at `/login`
4. Create short links from `/dashboard`
5. Click a short URL to test the redirect
6. Click a dashboard row to open `/dashboard/[code]/stats`

## Notes

- The backend defaults to `http://localhost:8080` and the frontend expects that same API URL locally.
- The short-link redirect target in the dashboard also uses `http://localhost:8080` by default.
