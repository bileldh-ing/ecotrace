# EcoTrace

EcoTrace is a React Native (Expo) app focused on recycling, eco-marketplace flows, volunteering events, campaigns, and impact tracking.

## Prerequisites

- Node.js (recommended: LTS)
- npm
- Expo CLI (optional)
- Expo Go app (for running on a physical device)

## Clone

```bash
git clone https://github.com/bileldh-ing/ecotrace.git
cd ecotrace
```

## Install

```bash
npm install
```

## Run (Expo)

```bash
npm run start
```

Then:

- Press `a` to run on Android (emulator/device)
- Press `i` to run on iOS (macOS required)
- Press `w` to run on web

You can also use:

```bash
npm run android
npm run ios
npm run web
```

## Project Structure

- `App.js`: main navigation + app entry
- `Screens/`: app screens (auth, home, marketplace, recycle flow, campaigns, volunteering, etc.)
- `services/`: Firebase + business logic (marketplace, wallet, ML classifier, etc.)
- `components/`: reusable UI components
- `utils/`: helper utilities (uploads, initialization, etc.)

## Configuration (Firebase / Supabase)

This project uses:

- Firebase (Auth + Realtime Database)
- Supabase Storage (image uploads)

Configuration files:

- `config/index.js` (Firebase config)
- `config/supabaseClient.js` (Supabase client)

### Important

If you fork/clone this repo for your own deployment, you should:

- Use **your own Firebase project** credentials.
- Use **your own Supabase project** credentials/bucket.
- Avoid committing private keys/secrets. Prefer environment variables for production.

## Notes

- `node_modules/`, `.expo/`, and build outputs are ignored via `.gitignore`.
- After cloning, always run `npm install` before starting.
