# Setup Guide

## 1. Requirements

- Node.js LTS
- Ionic CLI
- Android Studio for Android builds
- PHP 8.2+
- Composer
- MySQL 8+
- A Laravel application

## 2. Mobile

The `mobile/` directory contains the Ionic application source. Install dependencies with:

```bash
cd mobile
npm install
```

For a native SQLite build, add the Capacitor SQLite plugin in a real Ionic project and sync Capacitor:

```bash
npm install @capacitor/core @capacitor/android
npm install @capacitor-community/sqlite
npx cap add android
npx cap sync
```

The browser development target should use a simple fallback/local mock until native SQLite is available.

## 3. Laravel API

Create a Laravel application separately, then copy the files under `laravel/` into the application. Configure `.env` for MySQL and run:

```bash
php artisan migrate
php artisan serve
```

The prototype API is:

- `GET /api/notes` — pull notes changed since an optional timestamp
- `POST /api/notes/sync` — push local note changes

## 4. Sync model

Each mobile note has a stable UUID. Local changes are marked with a sync state. A sync operation first uploads pending local changes and then downloads server changes. `updated_at` is used as the initial change cursor and `deleted_at` represents a tombstone.

This is a prototype synchronization model, not production conflict resolution. Later iterations can add authentication, per-user ownership, retries, idempotency keys, conflict records, and background synchronization.
