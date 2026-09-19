# Mobile Sync Guide

## Current prototype

The mobile prototype now includes a minimal sync interface.

The flow is:

```
Ionic UI
   |
localStorage
   |
Sync
   |
Laravel API
   |
MySQL
```

The mobile app does **not** connect directly to MySQL.

## Sync behavior

When a note is created or edited:

- it is stored locally
- `syncStatus` becomes `pending`

When deleted:

- the note is retained locally as a tombstone
- `deletedAt` and `updatedAt` are set
- `syncStatus` remains `pending`

When Sync is pressed:

1. Pending notes are sent to `POST /api/notes/sync`.
2. Accepted notes are marked `synced`.
3. The app pulls changes from `GET /api/notes`.
4. The returned cursor is stored locally.
5. Deleted remote notes remain hidden from the note list.

## Development configuration

The current development API is configured in:

```
src/environments/environment.ts
```

Default:

```
http://localhost:8000/api
```

When using a physical phone, replace `localhost` with the development computer's LAN address.

Example:

```
http://192.168.1.10:8000/api
```

The Laravel server must be reachable from the phone and configured for the required CORS policy when testing through a browser.

## Production

The production API is configured in:

```
src/environments/environment.prod.ts
```

Use an HTTPS Laravel API URL.

The current prototype uses localStorage for browser compatibility. Before production offline support, move the persistence layer to Capacitor SQLite while keeping the sync contract.

## Known limitation

The current Laravel sync endpoint uses `updatedAt` as the basic conflict rule. A later production sync implementation should add authentication, per-user ownership, stronger conflict handling, and a reliable server-side sync cursor.
