# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FeeFolio Finance is a FinTech/Education Finance Management System for managing students, parents, receipts, giro (bank transfers), and role-based access. It is a full-stack monorepo with a separated `client/` (React + Vite) and `server/` (Express + Node.js).

## Commands

### Client (`/client`)
```bash
npm run dev       # Start Vite dev server (default port 5173 or VITE_APP_PORT)
npm run build     # Production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

### Server (`/server`)
```bash
npm run dev       # nodemon index.js (auto-reload)
npm start         # node index.js (production)
```

### Environment Setup
- Copy `client/.env.example` → `client/.env`
- Copy `server/.env.example` → `server/.env`
- Required server vars: `PORT`, `NODE_ENV`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `FRONTEND_URL`
- Required client vars: `VITE_API_URL`, `VITE_APP_NAME`

## Architecture

### Data Flow
```
Client Component → AuthProvider (Context) → Axios Interceptors → Express API → MySQL (raw SQL)
```

### Backend (`server/`)
- **Entry:** `index.js` — connects to DB (5 retries, 5s delay), then starts Express
- **App setup:** `src/app.js` — CORS → parsers → cookie-parser → helmet → morgan → responseHandler → routes
- **All responses** are normalized by `src/middlewares/responseHandler.js` as `{success, statusCode, data/error, message}`
- **Routes:** `/api/auth` (login, register, forgot/reset password), `/api/profile`
- **Validation:** Zod schemas in `src/schemas/` wrapped by `validateSchema` middleware
- **Database:** Raw SQL via `mysql2/promise` pool (no ORM) — pool size 20, unlimited queue

### Frontend (`client/`)
- **Entry:** `src/main.jsx` — wraps app in `AuthProvider`, React Router, Toaster
- **Auth state** lives in `src/providers/AuthProvider.jsx` — stores user, permissions, JWT expiry timer; auto-logouts on token expiry
- **HTTP client:** `src/utils/api.js` — Axios instance; interceptors auto-attach JWT from cookie; handles 401/403 by clearing session
- **Routing:** `src/router/routes.jsx` — uses `ProtectedRoute` and `PublicRoute` wrapper components
- **Sidebar navigation** is permission-driven — groups: People Management, Financial, User Management

### Authentication
- JWT (HS512) stored as HttpOnly cookie (SameSite=Strict, Secure, 1-day expiry)
- Token payload: `{userId, userName, email, jti, aud, iss}`
- Bcrypt with 10 rounds for password hashing
- Rate limiting on all auth endpoints (see `src/middlewares/rateLimiter.js`)

### Permission System
- Resources: `CONTACTS`, `STUDENTS`, `RECEIPTS`, `GIRO`, `PARENTS`, `USERS`, `ROLES`, `RESOURCES`
- Actions: `read`, `create`, `update`, `delete`
- Check with `hasPermission(resource, action)` from `useAuth()` hook

## Coding Conventions

- All variables must be named in **camelCase** (e.g., `userName`, `accessToken`, `isLoading`)

### UI Components
- shadcn/ui (new-york style) in `client/src/components/ui/` — extend via `npx shadcn add <component>`
- `cn()` utility from `src/lib/utils.js` for class merging (clsx + tailwind-merge)
- Toast notifications via `react-hot-toast`

## Key Files

| File | Purpose |
|------|---------|
| `server/src/config/db.js` | MySQL pool config |
| `server/src/middlewares/responseHandler.js` | Standardized API responses + error handling |
| `server/src/middlewares/rateLimiter.js` | Per-endpoint rate limit rules |
| `client/src/providers/AuthProvider.jsx` | Global auth state, permission checks |
| `client/src/utils/api.js` | Axios instance with interceptors |
| `client/src/router/routes.jsx` | All route definitions |

## MCP Tools Available

- **MySQL** (`mcp__mysql__mysql_query`) — direct DB queries against the connected database
- **shadcn** (`mcp__shadcn__*`) — browse and add shadcn UI components
- **Playwright** (`mcp__plugin_playwright_playwright__*`) — browser automation for testing
