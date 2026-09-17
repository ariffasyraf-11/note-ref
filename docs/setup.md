# note-ref Setup Guide

This guide is written for a first-time setup on a Windows development PC.

## 1. Repository

Checkout the feature branch:

```bash
git clone https://github.com/ariffasyraf-11/note-ref.git
cd note-ref
git checkout feature/ionic-sqlite-laravel-sync
```

## 2. Mobile prerequisites

Install:

- Node.js LTS
- Ionic CLI

Then:

```bash
cd mobile
npm install
npm start
```

The browser app should open through `ionic serve`. The browser version is intentionally independent of native SQLite for easy development and UI testing.

## 3. Laravel backend

The `laravel/` folder contains the note-specific files. It is not a complete Laravel installation.

Create a Laravel application separately, then copy the contents of `note-ref/laravel/` into the Laravel application's corresponding directories.

Configure the Laravel `.env` file for MySQL:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=note_ref
DB_USERNAME=root
DB_PASSWORD=
```

Create the database in MySQL, then run:

```bash
php artisan migrate
php artisan serve --host=0.0.0.0 --port=8000
```

The API routes supplied by this prototype are:

- `GET /api/notes` — pull notes, optionally using `updated_since`
- `POST /api/notes/sync` — push pending mobile changes

## 4. Browser mobile + Laravel sync

With Laravel running on the development PC, the browser mobile app uses:

```text
http://localhost:8000/api
```

This value is configured in:

```text
mobile/src/app/core/config/api.config.ts
```

Start the mobile app in another terminal:

```bash
cd mobile
npm start
```

Create a note and press **Sync with Laravel**. The request travels from Ionic to Laravel; Laravel writes to MySQL and returns the accepted UUIDs. The mobile app then pulls server changes.

## 5. CORS

If the browser reports a CORS error, configure the Laravel application's CORS policy to allow the Ionic development origin, normally:

```text
http://localhost:8100
```

Do not solve CORS by connecting the browser directly to MySQL. MySQL must remain behind Laravel.

## 6. Physical phone testing

For a phone connected to the same LAN as the PC, replace `localhost` in `api.config.ts` with the PC's LAN IP:

```text
http://192.168.1.10:8000/api
```

Use the actual LAN IP of the development PC. Ensure Windows Firewall allows the Laravel development server port and both devices are on the same network.

## 7. SQLite/native stage

`@capacitor-community/sqlite` is included as the intended native database technology, but the browser prototype currently uses an in-memory adapter. This keeps `ionic serve` simple and avoids requiring Android Studio just to test the application UI and API flow.

When native testing begins:

```bash
npm install @capacitor/android
npx cap add android
npx cap sync
```

Then replace the browser database adapter implementation with the SQLite-backed implementation while keeping the same `NoteDatabaseService` interface.

## 8. Important architecture rule

```text
Mobile SQLite
     |
     | HTTP / JSON
     v
Laravel API
     |
     | Eloquent
     v
MySQL
```

The mobile application does **not** connect directly to MySQL. SQLite is the local/offline database; Laravel is the secure server/API boundary; MySQL is the central server database.

## 9. Current limitations

This is a prototype. Authentication, per-user note ownership, secure production CORS configuration, background synchronization, retry queues, and advanced conflict resolution should be added before production use.
