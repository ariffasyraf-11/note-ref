# Synchronization Design

```text
[User edits note]
       |
       v
   SQLite
       |
 pending changes
       |
       v
  POST /api/notes/sync
       |
       v
 Laravel + MySQL
       |
       v
 GET /api/notes?updated_since=...
       |
       v
     SQLite
```

## Note identity

`uuid` is generated on the device and is the same identifier used by MySQL. This avoids relying on auto-increment IDs across offline devices.

## Initial sync rules

1. Local create/update/delete is saved immediately to SQLite.
2. The change is marked `pending`.
3. When online, pending changes are sent to Laravel.
4. Laravel upserts the UUID and returns accepted records.
5. The client marks accepted changes as `synced`.
6. The client requests server changes after its last sync cursor.
7. Server tombstones are applied locally so deleted records do not reappear.

## Future conflict handling

The prototype uses a simple last-write timestamp model. A production implementation should add server-authoritative timestamps, device IDs, conflict detection, and a user-visible conflict policy where required.
