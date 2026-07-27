# Wii Home Menu

A polished fan recreation of the classic **Wii System Menu** in the browser — soft ambient chrome, channel grid, pointer cursor, UI sounds, and a full **Wii Shop Channel** browse flow.

> Not affiliated with Nintendo. Demo catalog and original channel art only.

## Features

- Living-room Home Menu with multi-page channel grid
- Soft hover focus rings, custom pointer (desktop), and light Web Audio beeps
- Keyboard navigation (arrows, Enter, Esc, `[` `]`)
- Channel experiences: Disc, Mii Plaza, Photo, News, Forecast, Internet, Votes, Message Board, and more
- **Shop Channel**: Start Shopping → Virtual Console / WiiWare / Channels → title lists → download with demo Wii Points

## Stack

- React 19 + TypeScript
- Vite + TanStack Start / Router
- Tailwind CSS v4

## Run locally

```bash
npm install
npm run dev
```

App serves on `http://localhost:8080`.

```bash
npm run build
npm run typecheck
```

## Controls

| Input | Action |
| --- | --- |
| Arrow keys | Move channel focus |
| Enter / Space | Open channel |
| Esc | Back / close |
| `[` `]` | Previous / next page |

## License

Demo / fan project for personal use. Nintendo trademarks belong to their owners.
