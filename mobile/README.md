# note-ref mobile

Ionic/Angular browser prototype for an offline-first notes app.

## Run with Ionic Serve

From the repository root:

```bash
cd mobile
npm install
npm start
```

`npm start` runs `ionic serve` and opens the browser development version. This browser target intentionally uses the in-memory database adapter so it can be tested without a native Android/iOS runtime.

## Laravel API configuration

The mobile API base URL is in:

```text
src/app/core/config/api.config.ts
```

Default browser configuration:

```text
http://localhost:8000/api
```

This expects Laravel to be running on the same development PC at port 8000.

For a physical phone, `localhost` points to the phone itself. Change the URL to the development PC's LAN address, for example:

```text
http://192.168.1.10:8000/api
```

The PC and phone must be on the same network, and the Laravel development server must listen on an address reachable from the phone.

## Sync flow

1. The user creates a note.
2. The local database marks it as `pending`.
3. `SyncService` sends pending notes to `POST /api/notes/sync`.
4. Laravel validates and stores the note in MySQL.
5. The mobile app marks accepted notes as `synced`.
6. The app calls `GET /api/notes` and downloads server changes.

The mobile app never connects directly to MySQL. Laravel is the API boundary between the mobile client and the server database.

## SQLite

`NoteDatabaseService` is deliberately separated from the UI and sync layer. The current browser implementation uses an in-memory adapter because Capacitor SQLite is a native-oriented dependency. The service can later be replaced with `@capacitor-community/sqlite` when Android/iOS testing is introduced.
