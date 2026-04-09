# MIL Range Finder

Mobile-first MIL distance calculator built with Next.js, TypeScript, App Router, and offline-friendly PWA support.

## Features

- Fast calculator for `Distance (m) = Size (cm) x 10 / mil`
- Preset groups for birds, head-size estimates, and practice targets
- Last 5 calculations saved locally on-device
- Guide page with reticle demo, examples, and quick reference
- Installable PWA with offline support after first load

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build for production

```bash
npm run build
npm run start
```

## Notes

- The default reticle assumption is `Standard MIL` where `1 major line = 1 mil`.
- The app is local-only and uses `localStorage` for history and guide preferences.
- Core offline assets, the home page, and the guide page are cached by the service worker after first load.
