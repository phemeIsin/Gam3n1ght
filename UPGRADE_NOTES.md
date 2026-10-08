# Gam3n1ght upgrade notes

## What changed

### Live Rooms
- `/rooms` is now a live room directory.
- It only shows rooms whose status is `lobby` or `playing` and whose expiry has not passed.
- Rooms are grouped into **Online** and **Physical**.
- Room names use the game name, e.g. `Skribbl.io Room`, `UNO Game Room`.
- Clicking a room joins the Game Night room.
- The directory refreshes through Supabase Realtime plus a 15-second safety poll.

### Room ending
- Hosts now have a dedicated **End Room** action.
- Ending a room changes its status to `finished` and immediately returns the host to Live Rooms.
- Finished rooms are excluded from the public active-room directory.

### Online games
Bundled:
- Skribbl.io
- Gartic Phone
- Codenames Online
- Jigsaw Explorer
- PlayingCards.io
- Board Game Arena (free service with availability restrictions on some games/features)

Game Night acts as the meetup layer. A host creates the external game room, pastes the invite URL into the Game Night online lobby, and everyone can launch the same external match from there.

### Online room chat
- Online rooms get a realtime text chat backed by Supabase.
- Demo/local mode stores chat in localStorage.
- Messages are limited to 500 characters.
- Chat is available only while a room is active.

### Mobile UX
- Mobile navigation now exposes Games, Live Rooms, Join, Audio and Theme.
- The Join button opens the join input instead of only scrolling.
- Responsive game cards and room layouts.
- Mobile-friendly modal bottom sheets.
- Safe-area spacing for mobile browsers.
- Horizontal scrolling for dense filter/tab rows.
- Larger touch targets and mobile form font sizing.
- Reduced-motion support.

## Required Supabase step
Run the updated `supabase.sql` in the Supabase SQL Editor. It is written to be rerunnable and adds the required columns, chat table/policies, realtime publication entries, RPCs and bundled online games.

## Build

```bash
npm install
npm run build
npm run dev -- --host
```

The build currently passes. Vite still reports the existing large single JS chunk warning (about 613 KB minified), so route-level code splitting remains a worthwhile future performance improvement.

### SQL compatibility fix
- The `join_room(text,text)` RPC now drops the legacy function before recreation so PostgreSQL can accept the updated return shape.
- `create_room(text,text)` is handled the same way for upgrades from older schemas.

## Audit fixes in v3

- The `create_room`, `join_room`, `update_room_state`, and `change_room_score` functions are now explicitly dropped before recreation so PostgreSQL can safely accept changed return signatures.
- Finished or expired rooms cannot be opened or joined, and Live Rooms only queries `lobby` / `playing` rooms.
- Supabase errors no longer silently fall back to a local copy when live mode is configured; this prevents split-brain rooms across devices.
- Online rooms start without a fake external room URL. The host adds the actual provider room link when ready.
- The catalog is now 36 games (16 physical + 20 online).
- `Solo Ready` is now restricted to `10 Seconds` in the bundled catalog.
- `is_solo_friendly` is stored in Supabase and preserved when the database catalog is loaded.
- Creator Studio can edit the Solo Ready flag.
- Supabase bootstrap updates existing databases with the new online catalog and solo metadata.

