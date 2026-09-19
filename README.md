# Note Ref — Mobile Prototype

This branch contains the Ionic/Angular standalone mobile prototype for Note Ref.

## Current scope

- Ionic Angular standalone UI
- Create, edit and delete notes
- Offline browser persistence with `localStorage`
- Mobile-oriented responsive UI
- Environment-specific API configuration prepared for later Laravel integration
- Capacitor Android dependency prepared for native development

## Branch relationship

- `mobile` — clean Ionic/Angular standalone template
- `mobile-prototype` — Note Ref mobile UI prototype
- `editable-notes` — earlier sync/edit prototype based on the Laravel sync branch
- `sync-fixes` — Laravel + browser sync prototype

## Quick start

Requirements:

- Node.js LTS
- npm
- Ionic CLI

From this branch:

```bash
npm install
ionic serve
```

Open the local URL shown by Ionic.

Run the normal checks before committing:

```bash
npm run lint
npm test
npm run build
```

For a production browser build:

```bash
npm run build -- --configuration production
```

See:

- `docs/mobile-development.md`
- `docs/mobile-production.md`

## Configuration

Development API configuration is prepared in:

```
src/environments/environment.ts
```

Production API configuration is prepared in:

```
src/environments/environment.prod.ts
```

The current UI does not call the API yet; notes are still stored in browser `localStorage`.

## Planned architecture

```
Ionic / Angular mobile
        |
        +-- Native: Capacitor SQLite
        |       |
        |       v
        +---- Laravel API
                |
                v
              MySQL
```

The mobile app should never connect directly to MySQL.
