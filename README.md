# Note Ref — Capacitor SQLite Test

This branch is a **test version** based on `mobile-prototype`. It replaces browser `localStorage` note persistence with Capacitor SQLite for native mobile testing.

## Test branch

`feature/capacitor-sqlite-test`

The original `mobile-prototype` branch is not modified by this test.

## Current scope

- Ionic Angular standalone UI
- Create, edit and delete notes
- Native local persistence using Capacitor SQLite
- Local sync cursor stored in SQLite
- Existing Laravel API sync flow retained
- Native Capacitor build required for SQLite testing

## Architecture

```text
Ionic Angular
      |
      v
Capacitor SQLite
      |
      v
Sync Engine
      |
      v
Laravel API
      |
      v
MySQL
```

The mobile app never connects directly to MySQL.

## Setup

Requirements:

- Node.js LTS
- npm
- Ionic CLI
- Android Studio for Android testing
- Android SDK / emulator or physical Android device

Install dependencies:

```bash
npm install
```

Add/sync Android if needed:

```bash
npx cap add android
npx cap sync android
```

Build and sync:

```bash
npm run build
npx cap sync android
```

Open Android Studio:

```bash
npx cap open android
```

Run on an Android emulator or physical device.

## SQLite test database

Database: `note_ref_test`

Tables:

- `notes`: uuid, title, content, updated_at, deleted_at, sync_status
- `sync_state`: key, value

The server sync cursor is stored in `sync_state.server_cursor`.

## Test checklist

1. Launch the native Android app.
2. Create a note.
3. Close and reopen the app.
4. Confirm the note remains.
5. Edit the note and restart the app.
6. Delete a note and restart the app.
7. Create a note while offline.
8. Reconnect to Laravel.
9. Press **Sync**.
10. Confirm the note reaches the server.

## Browser limitation

This branch intentionally targets the native Capacitor test environment. It does not fall back to `localStorage` when opened in a normal browser.

For browser-only development, continue using `mobile-prototype`.

## Important

This is a prototype/test implementation, not the final production storage layer. Future work can add authentication, per-user sync, conflict resolution, retry/backoff, encrypted SQLite, migrations and automated SQLite tests.
