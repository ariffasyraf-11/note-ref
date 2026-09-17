# note-ref Setup Guide

This guide is written for a first-time setup on a Windows development PC.

## 1. Repository

Checkout the synchronization-fix branch:

```bash
git clone https://github.com/ariffasyraf-11/note-ref.git
cd note-ref
git checkout sync-fixes
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

The browser app should open through `ionic serve`, normally at `http://localhost:8100`.

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
php artisan optimize:clear
php artisan serve --host=0.0.0.0 --port=8000
```

The API routes supplied by this prototype are:

- `GET /api/notes` — pull notes, optionally using `updated_since`
- `POST /api/notes/sync` — push pending mobile changes

## 4. CORS — important for Ionic sync

`ionic serve` runs on a different origin from Laravel. A JSON `POST` triggers a browser CORS preflight request using `OPTIONS` before Laravel receives the actual `POST`.

This branch includes:

```text
laravel/config/cors.php
```

Copy that file into the Laravel application's `config/cors.php`.

The development policy allows:

```text
http://localhost:8100
http://127.0.0.1:8100
```

and allows the `OPTIONS` preflight and `POST` request through `allowed_methods => ['*']`.

After copying the configuration, run:

```bash
php artisan optimize:clear
```

Then restart `php artisan serve`.

If the browser is opened on another port, use that exact origin in `allowed_origins`.

Do not solve CORS by connecting the browser directly to MySQL. MySQL must remain behind Laravel.

## 5. Browser mobile + Laravel sync

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

Create a note and press **Sync with Laravel**.

Expected flow:

```text
Ionic :8100
   |
   | OPTIONS /api/notes/sync  <- CORS preflight
   | POST /api/notes/sync     <- JSON note data
   v
Laravel :8000
   |
   v
MySQL :3306
```

After the push succeeds, the mobile app performs `GET /api/notes` to pull server changes.

## 6. Troubleshooting the POST / OPTIONS error

Open the browser DevTools → **Network** and press **Sync with Laravel**.

### OPTIONS returns 404/405

Check that `laravel/config/cors.php` exists in the actual Laravel project, not only in this repository. Then run:

```bash
php artisan optimize:clear
```

Restart the Laravel server.

### OPTIONS succeeds but POST fails

Check the POST response status:

- `422` — Laravel validation rejected the JSON payload.
- `500` — check `storage/logs/laravel.log` and the MySQL configuration.
- `404` — verify the API route with `php artisan route:list --path=api`.
- `419` — an unexpected CSRF setup is being applied; the API route should not require the web CSRF flow.

### Browser says CORS policy blocked the request

Make sure the origin shown by the browser exactly matches one of the configured origins. `localhost` and `127.0.0.1` are different browser origins.

## 7. Physical phone testing

For a phone connected to the same LAN as the PC, replace `localhost` in `api.config.ts` with the PC's LAN IP:

```text
http://192.168.1.10:8000/api
```

Add the Ionic origin used by the device/browser to the Laravel CORS configuration if required. Ensure Windows Firewall allows the Laravel development server port and both devices are on the same network.

## 8. SQLite/native stage

`@capacitor-community/sqlite` is included as the intended native database technology. The browser version currently uses `localStorage` so `ionic serve` testing persists notes across page reloads.

When native testing begins:

```bash
npm install @capacitor/android
npx cap add android
npx cap sync
```

Then replace the browser database adapter implementation with the SQLite-backed implementation while keeping the same `NoteDatabaseService` interface.

## 9. Important architecture rule

```text
Mobile SQLite / browser storage
             |
             | HTTP / JSON
             v
        Laravel API
             |
             | Eloquent
             v
           MySQL
```

The mobile application does **not** connect directly to MySQL. SQLite is the local/offline database; Laravel is the server/API boundary; MySQL is the central server database.

## 10. Current limitations

This is a prototype. Authentication, per-user note ownership, secure production CORS configuration, background synchronization, retry queues, and advanced conflict resolution should be added before production use.
