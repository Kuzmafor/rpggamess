# Blade of Fate

Idle / incremental RPG built with React and Vite, packaged for Android via Capacitor.
Collect heroes, forge weapons, clear dungeons and raids, climb the endless tower, and
grow your party through an idle-style progression loop with offline rewards.

## Features

- **Party-based idle combat** — auto-battling arena with active ultimates and synergies
- **Deep progression systems** — heroes, weapons, gear, talents, prestige, and artifacts
- **Endgame content** — raids, dungeons, an endless tower, boss rush, and challenges
- **Meta systems** — city building, pets, battle pass, calendar events, codex, and mail
- **Offline rewards** — earn while away with offline progress claims
- **Localization** — English and Russian (`src/i18n`)
- **Mobile-ready** — haptics and local notifications via Capacitor

## Tech Stack

- [React 18](https://react.dev/) + [Vite 5](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand) for state management
- [Capacitor 8](https://capacitorjs.com/) for the Android build
- [Sharp](https://sharp.pixelplumbing.com/) for icon generation

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ and npm

### Install

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Open the URL printed in the terminal (defaults to `http://localhost:5173`).

### Build for production

```bash
npm run build
```

The static build is emitted to `dist/`. Preview it locally with:

```bash
npm run preview
```

## Android Build (Capacitor)

Requires Android Studio and the Android SDK.

```bash
# First time only: add the Android platform
npm run cap:add:android

# Build the web app and sync into the Android project
npm run android:build

# Open the project in Android Studio
npm run android:open
```

Regenerate launcher icons from `branding/icon.svg`:

```bash
npm run android:icons
```

## Project Structure

```
src/
  App.jsx            App shell, tabs, and game loop
  main.jsx           Entry point
  components/        UI panels and HUD (heroes, raids, tower, shop, ...)
  data/              Game content and balance (heroes, weapons, enemies, ...)
  store/             Zustand game store
  i18n/              Localization (en, ru)
  audio/             Sound engine
  mobile/            Capacitor integrations (haptics, notifications)
  assets/            In-game art components
  styles/            Global CSS
android/             Capacitor Android project
scripts/             Build helpers (icon generation)
branding/            Source icon asset
```

## License

Released under the [MIT License](LICENSE).
