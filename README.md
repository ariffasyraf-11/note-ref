# Note Ref — Authenticated Sync Prototype

This branch extends `mobile-prototype` with Laravel Sanctum authentication, per-user sync, note versions, conflict detection, and a server-side numeric sync cursor.

Backend branch:
`feature/note-sync-auth-conflict-cursor` in `ariffasyraf-11/laravel-mysql`.

Current local persistence remains browser `localStorage`. Capacitor SQLite is still a future native phase.

Run:
`npm install`
`ionic serve`

Set the Laravel API URL in `src/environments/environment.ts`.

Authentication endpoints:
- POST /api/auth/login
- POST /api/auth/register
- POST /api/auth/logout

Sync endpoints:
- GET /api/notes?cursor=<number>
- POST /api/notes/sync

Pending notes carry `baseVersion`; the server returns conflicts when the server version has changed since that base version.
