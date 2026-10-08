# Gam3n1ght v3 Audit Report

## Catalog
- 36 bundled games total.
- 16 physical games.
- 20 online multiplayer games.
- Exactly 1 bundled `Solo Ready` game: `10 Seconds` (`g09`).
- All online games have an external provider and launch URL.
- Duplicate game IDs: none.

## Room / Supabase fixes
- `join_room(text,text)` and the related room RPCs are dropped before recreation, preventing PostgreSQL `42P13` return-type errors.
- Finished and expired rooms cannot be opened or joined.
- Live Rooms only queries rooms in `lobby` or `playing` state and ignores expired rooms.
- The End Room action marks the room as `finished` and navigates back to Live Rooms.
- Supabase-mode room operations no longer silently fall back to localStorage after RPC/network failures; this avoids split-brain rooms across devices.
- Online rooms start without a fake provider homepage being stored as their actual room URL. Hosts must save the real external game-room link.
- Added `is_solo_friendly` to the games table and preserve it when loading/saving through Supabase.
- Creator Studio can edit the Solo Ready flag.
- Existing-database migration included as `SUPABASE_EXISTING_DB_FIX.sql`.

## Live Rooms / online play
- Live Rooms page separates active rooms into Online and Physical categories.
- Room rows show room name, game, player count, state, and code.
- Online rooms expose Game Night chat and host-managed external game links.
- Bundled online options include Skribbl.io, Gartic Phone, Codenames Online, Jigsaw Explorer, PlayingCards.io, Sketchful.io, Gartic.io, BombParty, Bonk.io, HaxBall, TETR.IO, Lichess, Pokémon Showdown, papergames.io Connect 4/Gomoku/Tic-Tac-Toe, Doodle Dash, Mini Golf Online, Battle of Pirates, and Board Game Arena.

## Static verification completed
- Parsed all 20 TypeScript/TSX files with the TypeScript parser: **0 syntax errors**.
- Checked all relative TypeScript/TSX imports: **0 missing relative imports**.
- Verified catalog/SQL counts and IDs: **36 catalog entries, 20 online entries, 20 online SQL seeds, 1 Solo Ready entry**.
- Verified the four legacy room RPC signatures are dropped before recreation.
- Verified SQL dollar-quoted blocks are balanced.

## Build note
A fresh `npm run build` could not be completed in this execution environment because the dependency install from the npm registry timed out. A subsequent build error was only the expected missing-dependency cascade (`react`, `react-router-dom`, `lucide-react`, Vite, etc.) caused by that incomplete install. The source itself was parser-checked independently.

Run after extracting the ZIP:

```bash
npm ci
npm run build
```

For an existing Supabase database, run `SUPABASE_EXISTING_DB_FIX.sql`. For a fresh/complete database setup, use `supabase.sql`.
