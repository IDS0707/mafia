# MAFIA — Trust Nobody · v2

Production-grade rewrite using **Vite + Svelte 5 + TypeScript**.

## Quick start

```bash
cd v2
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Stack

| Layer        | Tech                           |
|--------------|--------------------------------|
| Build        | Vite 5 (esbuild + Rollup)      |
| UI Framework | Svelte 5 (runes)               |
| Language     | TypeScript 5 (strict)          |
| State        | Svelte stores (writable/derived)|
| Audio        | Web Audio API (custom engine)  |
| Styles       | CSS custom properties + tokens |
| i18n         | Custom type-safe (uz/ru/en)    |

## Architecture

```
src/
├── main.ts                  ← entry, mounts App.svelte
├── App.svelte               ← root view router
├── app.css                  ← imports design tokens/reset/global
│
├── lib/                     ← framework-agnostic logic
│   ├── audio/
│   │   ├── AudioEngine.ts   ← bus-routed mixer, music modes, riser
│   │   ├── SFX.ts           ← synthesized one-shots
│   │   ├── presets.ts       ← music mode definitions
│   │   ├── types.ts
│   │   └── index.ts         ← barrel
│   ├── i18n/
│   │   ├── index.ts         ← reactive translator
│   │   └── locales/{en,ru,uz}.ts
│   ├── state/
│   │   ├── user.ts          ← profile, wallet, level
│   │   ├── router.ts        ← view store
│   │   ├── toast.ts
│   │   └── index.ts         ← barrel
│   ├── game/                ← (next turn) game engine + bots
│   └── utils/{storage,random,format}.ts
│
├── components/
│   ├── ui/                  ← Button, LangSwitch, Toast, Modal…
│   ├── layout/              ← Sidebar, Topbar, AppShell
│   └── game/                ← PlayerCard, VoteCell, ChatPanel…
│
├── views/                   ← one file per screen
│   ├── Splash.svelte
│   ├── Auth.svelte
│   ├── Menu.svelte          ← (next turn)
│   ├── CreateRoom.svelte    ← (next turn)
│   ├── JoinRoom.svelte      ← (next turn)
│   ├── Lobby.svelte         ← (next turn)
│   ├── Game.svelte          ← (next turn)
│   ├── Profile.svelte       ← (next turn)
│   ├── Shop.svelte          ← (next turn)
│   └── Leaderboard.svelte   ← (next turn)
│
├── styles/
│   ├── tokens.css           ← all design variables
│   ├── reset.css
│   └── global.css
│
└── types/
    └── index.ts             ← domain types
```

## Audio Engine

Bus architecture:

```
destination
  ↑
master (gain → highshelf EQ)
  ↑
┌─┼────────┬────────┐
music   ambient   sfx
```

- **Crossfade** between music modes (`calm` / `mystery` / `tense` / `climax`)
- **Riser** overlay for last-N-seconds intensification
- **Persistent settings** (localStorage)
- **Lazy init** (browsers require user gesture)

## Scripts

```bash
npm run dev      # vite dev server with HMR
npm run check    # svelte-check (type errors)
npm run build    # type-check + production build
npm run preview  # preview built dist/
```

## Migration status

- [x] Project scaffolding (Vite + Svelte + TS)
- [x] Design token system
- [x] AudioEngine (TypeScript class, bus mixing, crossfade)
- [x] SFX library (synthesized)
- [x] i18n (type-safe, 3 langs)
- [x] State stores (user, router, toast)
- [x] Utilities (storage, random, format)
- [x] Splash view
- [x] Auth view
- [ ] Sidebar + Topbar layout components
- [ ] Main menu (hero + hex actions + stats + reward card)
- [ ] Create / Join room views
- [ ] Lobby
- [ ] Game engine (TS class) + bot AI
- [ ] Game phase views (night / day / vote / result)
- [ ] Profile / Shop / Leaderboard
- [ ] Settings modal
- [ ] Visual sync (particles, desaturate)
```
