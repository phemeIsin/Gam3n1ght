# Game Night PWA — production-ready MVP

A mobile-first, shareable party-game platform. The physical game stays physical; Game Night handles rooms, rules, prompts, timers and scores.

## Games

The library is seeded in the requested order:

1. UNO Game
2. Don't Say X
3. Stay Different
4. Get to 3
5. Sketch Game
6. Find the Number
7. Guess the Leader
8. Guess the Number
9. 10 Seconds
10. Memory Drawing
11. First to 5
12. Wrong Answers Only
13. Contact
14. Head, Shoulders, Knees & Cup
15. Garbage
16. Pressure

Original people-containing reels remain external references. The app uses face-free animated/CSS illustrations inside the UI and can accept neutral uploaded assets later.

## Stack

React + Vite + TypeScript + Supabase + PWA + lucide-react.

## Local setup

```bash
npm install
cp .env.example .env
npm run dev
```

Without Supabase variables the app runs in **Demo mode** using browser storage.

## Supabase setup

### 1. Create a Supabase project

Create a project, then enable **Authentication → Providers → Anonymous Sign-Ins**. Anonymous sign-in is used for normal players so friends can join a room without creating accounts.

### 2. Run the database bootstrap

`supabase.sql` is **SQL, not a shell command**. Do not type `supabase.sql` into zsh.

Open:

**Supabase Dashboard → SQL Editor → New query**

Paste the entire `supabase.sql` file and run it.

The script:

- creates/seeds the game catalog and prompt decks;
- creates rooms and room players;
- uses expiring 12-hour rooms;
- removes old MVP-open policies;
- adds validated server-side room creation/join/score RPCs;
- rate-limits room creation to 5 rooms per user per 10 minutes;
- caps rooms at 30 players;
- protects game/prompt writes behind an admin table;
- protects animation storage writes behind admin RLS;
- exposes active rooms for sharing while excluding expired rooms;
- provides `cleanup_expired_rooms()` for scheduled cleanup;
- enables Supabase Realtime for rooms and room players.

### 3. Add environment variables

Create `.env`:

```env
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Restart Vite after changing `.env`.

### 4. Create the first admin

Create a normal email/password user in:

**Supabase Dashboard → Authentication → Users**

Copy that user's UUID and run this in SQL Editor:

```sql
insert into public.admin_users(user_id)
values ('YOUR-AUTH-USER-UUID')
on conflict do nothing;
```

Now `/admin` requires that account. Game editing, prompt editing and storage uploads are rejected by RLS for non-admin users.

### 5. Schedule cleanup

The database contains `public.cleanup_expired_rooms()` and expired rooms are automatically excluded from normal reads. For automatic physical deletion, configure a Supabase scheduled job/pg_cron entry that calls:

```sql
select public.cleanup_expired_rooms();
```

A 15–60 minute interval is sufficient for this MVP.

## Run

```bash
npm run build
```

The production output is `dist/`.

## Room flow

1. Enter your name.
2. Open a game.
3. Click **Create room**.
4. The app authenticates the player anonymously, creates a server-validated room and returns a 6-character code.
5. Share the code/link.
6. Friends join with their names.
7. Host starts the game.
8. Host controls scores/state; all devices receive Realtime updates.

## Security model

This is still an MVP, but the previous intentionally-open Creator Studio policies have been replaced with a real boundary:

- **Players:** Supabase anonymous authentication.
- **Rooms:** server-side RPCs for create/join/state/score.
- **Game catalog:** public read, admin-only writes.
- **Prompt catalog:** public read, admin-only writes.
- **Storage:** public read for face-free assets, admin-only writes/deletes.
- **Rate limiting:** database-enforced room creation limit.
- **Validation:** database functions validate names, games, room state and score changes.
- **Expiry:** rooms expire after 12 hours.

For a larger public launch, add application monitoring, abuse reporting, stronger per-device limits and a dedicated Edge Function/API layer for more aggressive rate limiting.


## Community & Admin workflows

Normal users now have:
- `/suggest` — structured game suggestion form matching the Creator Studio fields, including game behavior, scoring, player count, tags, instructions and an example link.
- `/contact` — complaints, bug reports, partnership requests and general suggestions that are not game submissions.
- A Game Night × DisCoVar WhatsApp promotion linking to the supplied community invite.

Creator Studio now has tabs for Overview, Games, Suggestions and Messages. The Overview shows game count, room activity, player activity, pending suggestions and open support messages. Suggestions can be approved or declined; approved games receive a unique slug and keep the selected game behavior so they do not overwrite an existing built-in game.

### Supabase
Run the full `supabase.sql` in **Supabase Dashboard → SQL Editor → New query**. Do not run `supabase.sql` as a shell command.

The SQL adds `game_suggestions`, `contact_messages` and `games.game_kind`, with RLS policies for authenticated submissions and admin-only reads/updates.
