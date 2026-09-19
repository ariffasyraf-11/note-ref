# Note Ref — Mobile Prototype

This branch contains the Ionic/Angular standalone mobile prototype for Note Ref.

## Current scope

- Ionic Angular standalone UI
- Create, edit and delete notes
- Offline browser persistence with `localStorage`
- Mobile-oriented responsive UI
- Prepared for later Laravel API and native SQLite integration

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

For a production browser build:

```bash
npm run build
```

or:

```bash
ionic build --configuration production
```

See:

- `docs/mobile-development.md`
- `docs/mobile-production.md`

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
