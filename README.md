# note-ref

Offline-first note-taking prototype using Ionic, SQLite, and a Laravel/MySQL API.

## Architecture

```text
Ionic Mobile App
      |
      | REST API / JSON
      v
Laravel API ---- MySQL
      ^
      |
   Sync layer

SQLite remains the mobile source for offline work. The app synchronizes changes with Laravel when connectivity is available.
```

## Repository layout

- `mobile/` — Ionic + Angular + Capacitor application
- `laravel/` — Laravel API files to be copied into a Laravel installation
- `docs/` — setup and synchronization notes

## Quick start

See [`docs/setup.md`](docs/setup.md).

## Current prototype scope

- Create, read, update, and delete notes locally.
- Store notes in SQLite through a small database abstraction.
- Queue local changes for synchronization.
- Laravel API endpoints for pulling and pushing notes.
- MySQL persistence on the server.
- Soft-delete compatible synchronization using `deleted_at`.

Authentication, encryption, advanced conflict resolution, background sync, and production hardening are intentionally left for later iterations.
