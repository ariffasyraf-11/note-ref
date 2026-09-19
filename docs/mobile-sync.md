# Mobile Sync Guide

## Current browser prototype

The current browser prototype keeps **localStorage as the local database**.

Ionic UI -> localStorage -> Sync -> Laravel API -> MySQL

The mobile app does not connect directly to MySQL.

## Sync indicator

The interface now has four states:

- **Syncing**: spinner appears only while a sync request is active.
- **✓ All changes synced**: shown after a successful push/pull cycle.
- **Sync failed**: shown when the API request fails. Local changes are kept.
- **N pending**: shown when local notes still need synchronization.

Creating, editing, or deleting a note resets the indicator to neutral and marks the changed note as pending.

## Browser testing

Keep localStorage for the current browser test. No SQLite migration is required for this branch.

Development commands:

    npm install
    ionic serve

The development API is configured in:

    src/environments/environment.ts

The current default is:

    http://localhost:8000/api

## Sync contract

The current browser implementation uses:

- GET /api/notes
- POST /api/notes/sync
- uuid
- title
- content
- updatedAt
- deletedAt
- syncStatus (local status)

## Next native-mobile phase

The future native mobile version can replace only the persistence layer:

Current browser version:

    Ionic UI
       |
    localStorage
       |
    Sync Service
       |
    Laravel API

Future native version:

    Ionic UI
       |
    Capacitor SQLite
       |
    Sync Service
       |
    Laravel API

This should **not require changing the current sync contract**. The UI and sync service should continue working with the same note model and API endpoints.

The native phase can use @capacitor-community/sqlite as the SQLite adapter. That work is intentionally deferred so the current browser test remains unchanged.

## Known limitations

The Laravel sync endpoint currently uses updatedAt as the basic conflict rule. Production synchronization should later add authentication, per-user ownership, stronger conflict handling, and a reliable server-side cursor.
