# Coptic Orthodox Church Moscow — Notification App

A trilingual (Arabic/Russian/English) mobile notification app for the Coptic Orthodox parish in Moscow. Clergy send announcements and schedule service reminders via an admin web panel; parishioners receive push notifications on their phones with no account required. Built with React Native (Expo), Node.js/Express, MySQL, and Firebase Cloud Messaging.

## Architecture

```
  Mobile App (Expo)  ──→  Node.js API  ←──  Admin Panel (React/Vite)
        ↕                    ↕                       ↕
   FCM Push + Local     MySQL 8 DB            Served at /admin
   Notifications        (Hostinger)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full diagram.

## Development

### Server (API + Admin Panel)

```bash
cd server
cp .env.example .env   # fill in your DB + JWT + Firebase config
npm install
npm run dev             # starts Express on http://localhost:3000
```

### Admin Panel (standalone dev mode)

```bash
cd server/admin-web
npm install
npm run dev             # starts Vite on http://localhost:5173, proxies /api to :3000
```

### Mobile App

```bash
cd mobile
npm install
npm run dev             # starts Expo dev client
```

## Build

### Server (production)

```bash
cd server
npm run build           # compiles TS + builds admin panel
npm start               # runs dist/index.js
```

### Mobile (EAS Build)

```bash
cd mobile
eas build --platform android
eas build --platform ios
```

## Documentation

- [Deployment Guide](docs/DEPLOYMENT.md) — step-by-step Hostinger setup
- [FCM Setup](docs/FCM_SETUP.md) — Firebase project + service account
- [Apple Critical Alerts](docs/APPLE_CRITICAL_ALERTS.md) — entitlement request
- [Admin Guide (Arabic)](docs/ADMIN_GUIDE_AR.md) — for Abouna Dawood
- [Admin Guide (Russian)](docs/ADMIN_GUIDE_RU.md)
- [Admin Guide (English)](docs/ADMIN_GUIDE_EN.md)
- [Architecture](docs/ARCHITECTURE.md)
