# Mobile Development Guide

## 1. Purpose

This guide covers development configuration for the Note Ref Ionic/Angular standalone mobile prototype.

The current prototype uses `localStorage` so it can run immediately in a browser with `ionic serve`. This is intentional. Native SQLite and Laravel API synchronization are later integration stages.

## 2. Development prerequisites

Install:

- Node.js LTS
- npm
- Ionic CLI

Check:

```bash
node --version
npm --version
ionic --version
```

Install project dependencies:

```bash
npm install
```

Start the development server:

```bash
ionic serve
```

The default development server is normally available on localhost. Use the URL printed by Ionic.

## 3. Development workflow

Recommended workflow:

1. Create or switch to a feature branch.
2. Install dependencies with `npm install`.
3. Run `ionic serve`.
4. Test create, edit and delete locally.
5. Run the production build before committing.
6. For API work, test the Laravel API separately.
7. Commit one logical/major update rather than committing every small change.

Useful commands:

```bash
ionic serve
ionic build
npm run lint
npm test
```

If a command is not defined in `package.json`, use the corresponding Ionic/Angular CLI command available in the project.

## 4. Local data

The prototype stores notes under:

```
localStorage key:
note-ref.prototype.notes
```

This storage is suitable for browser prototyping only.

Do not treat browser localStorage as the final production database.

The planned native implementation is:

```
Ionic UI
   |
Capacitor service
   |
SQLite
   |
Sync service
   |
Laravel API
```

## 5. API development configuration

When Laravel integration is added, do not hard-code production URLs into application code.

Use an environment-specific configuration such as:

```text
development API:
http://localhost:8000/api

physical-device development:
http://<DEVELOPMENT-PC-LAN-IP>:8000/api

production:
https://api.example.com/api
```

For a physical Android device, `localhost` means the phone itself, not the development PC.

The development PC and phone must be reachable on the same network when using a LAN API address.

Laravel development server example:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

For browser development, configure Laravel CORS to allow the Ionic development origin and handle OPTIONS preflight requests.

## 6. Native development

When moving from browser prototype to Capacitor:

```bash
npm install
ionic build
npx cap add android
npx cap sync
npx cap open android
```

Install the Android platform only when native Android work is actually required.

For iOS, use a macOS/Xcode environment and add the iOS Capacitor platform separately.

## 7. Development security

Development may use HTTP on a private local network when necessary.

Do not copy development HTTP settings into production.

Never put:

- MySQL credentials
- Laravel secrets
- private API keys
- production signing credentials

inside the mobile source code.

The mobile application is a client and anything shipped inside it should be considered potentially inspectable.

## 8. Before merging a mobile feature

Check:

- UI works on a narrow phone viewport.
- Create/edit/delete work.
- Refresh does not unexpectedly lose intended prototype data.
- No console errors.
- Production build succeeds.
- API configuration is environment-appropriate if API integration is present.
- No secrets are committed.
