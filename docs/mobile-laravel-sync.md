# Mobile ↔ Laravel/MySQL Configuration

## Components

| Component | Role | Development URL / storage |
|---|---|---|
| Ionic | Mobile UI | `http://localhost:8100` |
| SQLite adapter | Local/offline storage | Browser fallback during `ionic serve` |
| Laravel | REST API | `http://localhost:8000` |
| MySQL | Central database | `127.0.0.1:3306` |

## API contract

### Pull

```http
GET /api/notes
```

Optional incremental pull:

```http
GET /api/notes?updated_since=2026-09-17T12:00:00.000Z
```

Response shape:

```json
{
  "notes": [],
  "cursor": "2026-09-17T12:01:00.000Z"
}
```

### Push

```http
POST /api/notes/sync
Content-Type: application/json
```

Example body:

```json
{
  "notes": [
    {
      "uuid": "2f4e7d3b-3f4c-4e8a-a7cc-1b9b7f8c1234",
      "title": "Example",
      "content": "Offline note",
      "updatedAt": "2026-09-17T12:00:00.000Z",
      "deletedAt": null,
      "syncStatus": "pending"
    }
  ]
}
```

Laravel returns accepted UUIDs:

```json
{
  "accepted": [
    "2f4e7d3b-3f4c-4e8a-a7cc-1b9b7f8c1234"
  ]
}
```

## Sync sequence

```text
User action
   |
   v
Local SQLite / browser adapter
   |
   | pending changes
   v
POST /api/notes/sync
   |
   v
Laravel validation + Eloquent
   |
   v
MySQL

Then:

GET /api/notes?updated_since=...
   |
   v
Laravel
   |
   v
Mobile local database
```

## Configuration location

Do not hard-code the API URL inside the sync service. The mobile configuration is centralized at:

```text
mobile/src/app/core/config/api.config.ts
```

For browser development on the same PC:

```ts
baseUrl: 'http://localhost:8000/api'
```

For a physical device on a LAN:

```ts
baseUrl: 'http://<PC-LAN-IP>:8000/api'
```

The physical-device address must be reachable from the phone. `localhost` on the phone refers to the phone itself.

## MySQL configuration

The mobile project must never contain MySQL credentials. Database credentials belong only in the Laravel server's `.env` file.

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=note_ref
DB_USERNAME=root
DB_PASSWORD=
```

## Security direction for later

Before production, add authentication and associate every note with a user. The current UUID/timestamp synchronization is a prototype and should not be treated as a complete multi-user synchronization protocol.
