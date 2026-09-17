# note-ref mobile

Ionic/Angular prototype for an offline-first notes app.

## Storage

The application keeps storage access behind `NoteDatabaseService`. The prototype currently uses an in-memory adapter so the project can be inspected without a native runtime. The next mobile implementation step is replacing that adapter with `@capacitor-community/sqlite` tables.

## API

Set `apiUrl` in `src/app/core/sync/sync.service.ts` to the reachable Laravel API URL when testing on a physical device. `localhost` from an Android device means the device itself, not the development PC.
