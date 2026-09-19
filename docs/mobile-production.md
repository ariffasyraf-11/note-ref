# Mobile Production Guide

## 1. Production goals

A production build should use:

- HTTPS API endpoints
- production Laravel configuration
- appropriate CORS rules
- native SQLite instead of browser localStorage when offline storage is required
- API authentication when user-specific data is introduced
- Android/iOS release signing
- environment-specific configuration
- tested release builds

## 2. API configuration

Production mobile builds must point to the real HTTPS API.

The prototype now provides environment configuration in:

- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

Example production value:

```
https://api.example.com/api
```

Replace the example domain with the actual deployed Laravel API before release.

Do not use:

```
http://localhost:8000/api
http://192.168.x.x:8000/api
```

for production.

The production API should be served through HTTPS with a valid certificate.

## 3. Laravel production configuration

On the Laravel server:

- Set `APP_ENV=production`.
- Set `APP_DEBUG=false`.
- Use a secure `APP_KEY`.
- Configure production MySQL credentials outside source control.
- Configure CORS only for the required application origins.
- Run migrations through the deployment process.
- Configure queue/cache/storage according to the application.
- Put Laravel behind a production web server/reverse proxy.
- Enable HTTPS.

Example production checks:

```bash
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

Do not run destructive database commands against production without a reviewed deployment procedure.

## 4. Mobile build

Build the web assets in production mode:

```bash
ionic build --configuration production
```

Then synchronize Capacitor:

```bash
npx cap sync
```

For Android:

```bash
npx cap open android
```

Build the signed release application from Android Studio/Gradle using the project's release signing configuration.

For iOS:

```bash
npx cap open ios
```

Configure signing, provisioning and distribution through Xcode.

The Android Capacitor package is already installed in this prototype, but the generated `android/` project is intentionally not committed. Run `npx cap add android` when beginning native Android development.

## 5. Environment separation

Maintain separate values for at least:

| Environment | API |
|---|---|
| Development browser | local Laravel API |
| Development device | development PC/server LAN API |
| Staging | staging HTTPS API |
| Production | production HTTPS API |

Do not solve environment changes by manually editing source files before every build.

Use Angular build configurations/environment files or another controlled configuration mechanism appropriate to the project.

For a physical device, remember that `localhost` means the device itself. Use the development machine's LAN address when the API is running on the development PC.

## 6. CORS

CORS belongs on the Laravel/API side.

Development may allow the Ionic development server.

Production should allow only the origins that actually need browser access.

Native mobile requests do not use browser CORS in exactly the same way as a browser, but keeping the API policy explicit is still important because the same API may also be consumed by a web client.

## 7. HTTP and cleartext traffic

Avoid HTTP in production.

If Android development temporarily requires an HTTP local API, keep that configuration limited to development. Do not enable broad cleartext traffic for the release application.

## 8. Offline database

The current browser prototype uses localStorage.

For a real native offline-first release, migrate persistence to Capacitor SQLite.

Recommended production flow:

```
User
 |
Ionic UI
 |
SQLite
 |
Sync Queue
 |
HTTPS Laravel API
 |
MySQL
```

The server remains the source of shared backend data. The mobile database is the local offline store.

## 9. Authentication

When the application becomes multi-user:

- authenticate API requests
- use HTTPS
- store tokens using an appropriate secure mobile storage mechanism
- never store passwords locally
- authorize records on the Laravel server
- do not rely on the mobile UI to enforce permissions

## 10. Release checklist

Before release:

- [ ] Production API URL configured.
- [ ] HTTPS verified.
- [ ] Laravel debug disabled.
- [ ] CORS reviewed.
- [ ] Database backups configured.
- [ ] API authentication tested.
- [ ] Offline/online synchronization tested.
- [ ] Conflict handling tested.
- [ ] Delete/restore behavior tested.
- [ ] Android/iOS release signing configured.
- [ ] Production `appId` configured.
- [ ] App version updated.
- [ ] Production build tested on a physical device.
- [ ] No secrets committed to Git.
- [ ] No development LAN URLs remain.
