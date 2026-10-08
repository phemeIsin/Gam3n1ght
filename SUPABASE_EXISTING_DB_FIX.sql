-- Gam3n1ght existing-database upgrade
-- For an existing v2/v3 Supabase database. Run this instead of the full bootstrap when you only need the live-room/catalog fixes.
-- The join_room/create_room signature issue is resolved by dropping the old function signatures before recreation.

begin;

alter table public.games add column if not exists is_solo_friendly boolean not null default false;

alter table public.games add column if not exists play_mode text not null default 'physical' check (play_mode in ('physical','online'));
alter table public.games add column if not exists external_provider text;
alter table public.games add column if not exists external_launch_url text;
alter table public.games add column if not exists external_game_url text;

alter table public.rooms add column if not exists room_type text not null default 'physical' check (room_type in ('physical','online'));
alter table public.rooms add column if not exists room_name text;
alter table public.rooms add column if not exists external_room_url text;

update public.games
set play_mode = 'online'
where slug in ('skribbl','gartic-phone','codenames-online','jigsaw-explorer','playingcards-io','board-game-arena');

update public.rooms r
set room_type = coalesce(g.play_mode, 'physical'),
    room_name = coalesce(r.room_name, g.name || ' Room')
from public.games g
where g.id = r.game_id;

create index if not exists rooms_active_directory_idx on public.rooms(status, room_type, expires_at, created_at desc);

create table if not exists public.room_chat (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  sender_id text not null,
  sender_name text not null,
  message text not null check (char_length(message) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists room_chat_room_created_idx on public.room_chat(room_id, created_at);

alter table public.room_chat enable row level security;

drop policy if exists "room chat active read" on public.room_chat;
drop policy if exists "room chat member insert" on public.room_chat;

create policy "room chat active read" on public.room_chat
  for select using (
    exists(
      select 1 from public.rooms r
      where r.id = room_id
        and r.expires_at > now()
        and r.status in ('lobby','playing')
    )
  );

create policy "room chat member insert" on public.room_chat
  for insert with check (
    auth.uid() is not null
    and sender_id = auth.uid()::text
    and exists(
      select 1 from public.room_players rp
      join public.rooms r on r.id = rp.room_id
      where rp.room_id = room_chat.room_id
        and rp.player_id = auth.uid()::text
        and r.expires_at > now()
        and r.status in ('lobby','playing')
    )
  );

drop policy if exists "rooms public read active" on public.rooms;
create policy "rooms public read active" on public.rooms
  for select using (expires_at > now() and status in ('lobby','playing'));

drop policy if exists "players public read active" on public.room_players;
create policy "players public read active" on public.room_players
  for select using (
    exists(
      select 1 from public.rooms r
      where r.id = room_id
        and r.expires_at > now()
        and r.status in ('lobby','playing')
    )
  );

-- Drop legacy RPCs first because PostgreSQL does not permit changing OUT/return-table shapes with CREATE OR REPLACE.
drop function if exists public.create_room(text,text) cascade;
drop function if exists public.join_room(text,text) cascade;
drop function if exists public.update_room_state(uuid,jsonb,text) cascade;
drop function if exists public.change_room_score(uuid,text,integer) cascade;

create function public.create_room(p_game_id text, p_display_name text)
returns table(room_id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_code text;
  new_room_id uuid;
  active_recent integer;
  selected_game public.games%rowtype;
begin
  if uid is null then raise exception 'Authentication is required to create a room.' using errcode = '42501'; end if;
  if length(trim(p_display_name)) < 1 or length(trim(p_display_name)) > 30 then
    raise exception 'Name must be between 1 and 30 characters.' using errcode = '22023';
  end if;

  select * into selected_game from public.games where id = p_game_id;
  if not found then raise exception 'The selected game does not exist.' using errcode = '22023'; end if;

  perform public.cleanup_expired_rooms();

  select count(*) into active_recent
  from public.rooms
  where created_by = uid and created_at > now() - interval '10 minutes';
  if active_recent >= 5 then
    raise exception 'Room creation rate limit reached. Try again in a few minutes.' using errcode = '42900';
  end if;

  loop
    new_code := upper(substr(md5(random()::text || clock_timestamp()::text || uid::text), 1, 6));
    exit when not exists(select 1 from public.rooms where rooms.code = new_code);
  end loop;

  insert into public.rooms(code, game_id, host_id, created_by, status, state, expires_at, room_type, room_name, external_room_url)
  values(
    new_code, p_game_id, uid::text, uid, 'lobby',
    jsonb_build_object('round',0,'turnIndex',0,'targetScore',selected_game.target_score),
    now() + interval '12 hours', coalesce(selected_game.play_mode, 'physical'),
    selected_game.name || ' Room', null
  )
  returning id into new_room_id;

  insert into public.room_players(room_id, player_id, display_name, score)
  values(new_room_id, uid::text, trim(p_display_name), 0);

  return query select new_room_id, new_code;
end;
$$;

create function public.join_room(p_code text, p_display_name text)
returns table(room_id uuid, code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  room_row public.rooms%rowtype;
  player_count integer;
begin
  if uid is null then raise exception 'Authentication is required to join a room.' using errcode = '42501'; end if;
  if length(trim(p_display_name)) < 1 or length(trim(p_display_name)) > 30 then
    raise exception 'Name must be between 1 and 30 characters.' using errcode = '22023';
  end if;

  select * into room_row
  from public.rooms
  where code = upper(trim(p_code))
    and expires_at > now()
    and status in ('lobby','playing')
  for update;
  if not found then raise exception 'Room not found, finished, or expired.' using errcode = 'P0002'; end if;

  select count(*) into player_count from public.room_players where room_id = room_row.id;
  if player_count >= 30 and not exists(select 1 from public.room_players where room_id = room_row.id and player_id = uid::text) then
    raise exception 'This room is full.' using errcode = 'P0001';
  end if;

  insert into public.room_players(room_id, player_id, display_name, score)
  values(room_row.id, uid::text, trim(p_display_name), 0)
  on conflict (room_id, player_id) do update set display_name = excluded.display_name;

  return query select room_row.id, room_row.code;
end;
$$;

create function public.update_room_state(p_room_id uuid, p_state jsonb, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if p_status not in ('lobby','playing','finished') then raise exception 'Invalid room status.' using errcode = '22023'; end if;
  if not exists(select 1 from public.rooms where id=p_room_id and host_id=uid::text and expires_at > now()) then
    raise exception 'Only the room host can change room state.' using errcode = '42501';
  end if;
  update public.rooms
    set state = coalesce(state,'{}'::jsonb) || coalesce(p_state,'{}'::jsonb),
        status = p_status
  where id=p_room_id;
end;
$$;

create function public.change_room_score(p_room_id uuid, p_player_id text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if abs(coalesce(p_delta,0)) > 1000 then raise exception 'Score change is too large.' using errcode = '22023'; end if;
  if not exists(select 1 from public.rooms where id=p_room_id and host_id=uid::text and expires_at > now() and status in ('lobby','playing')) then
    raise exception 'Only the active room host can change scores.' using errcode = '42501';
  end if;
  update public.room_players
  set score = greatest(0, score + coalesce(p_delta,0))
  where room_id=p_room_id and player_id=p_player_id;
  if not found then raise exception 'Player is not in this room.' using errcode = 'P0002'; end if;
end;
$$;

grant execute on function public.create_room(text,text) to anon, authenticated;
grant execute on function public.join_room(text,text) to anon, authenticated;
grant execute on function public.update_room_state(uuid,jsonb,text) to authenticated;
grant execute on function public.change_room_score(uuid,text,integer) to authenticated;
grant execute on function public.cleanup_expired_rooms() to authenticated;

create or replace function public.update_room_external_url(p_room_id uuid, p_external_room_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  clean_url text := trim(coalesce(p_external_room_url, ''));
begin
  if uid is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if clean_url = '' or clean_url !~* '^https?://' then
    raise exception 'A valid external game link is required.' using errcode = '22023';
  end if;
  if not exists(select 1 from public.rooms where id = p_room_id and host_id = uid::text and expires_at > now() and status in ('lobby','playing')) then
    raise exception 'Only the active room host can change the external game link.' using errcode = '42501';
  end if;
  update public.rooms set external_room_url = clean_url where id = p_room_id;
end;
$$;

grant execute on function public.update_room_external_url(uuid,text) to authenticated;
grant select, insert on public.room_chat to authenticated;

-- Make room/game/chat changes available through Supabase Realtime where supported.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table public.rooms;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_players'
  ) then
    alter publication supabase_realtime add table public.room_players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'room_chat'
  ) then
    alter publication supabase_realtime add table public.room_chat;
  end if;
exception when undefined_object then
  -- Some local/test Postgres environments do not create supabase_realtime.
  null;
end $$;

-- Seed the bundled free online games so existing Supabase databases receive them too.
insert into public.games
  (id, slug, game_kind, name, short_description, description, instructions, score_mode, min_players, supports_teams, animation_key, tags, sort_order, play_mode, external_provider, external_launch_url)
values
  ('online-skribbl','skribbl','online','Skribbl.io','Draw, guess and laugh together online.','Open a live Skribbl.io room from Game Night and bring everyone into the same drawing-and-guessing match.','["Create a Game Night room.","Open Skribbl.io and choose Create Private Room.","Copy the generated invite link into the Game Night room so everyone can launch the same match.","Use the Game Night chat while you wait and play."]','manual',2,false,'sketch','["online","drawing","multiplayer","pictionary"]',200,'online','Skribbl.io','https://skribbl.io/'),
  ('online-gartic-phone','gartic-phone','online','Gartic Phone','Write, draw and reveal the funniest chain online.','Use Gartic Phone for a telephone-style drawing game where each player writes and draws, then watches the chain unfold.','["Create a Game Night room.","Open Gartic Phone and create or join a lobby.","Copy the room URL into Game Night so the whole group can launch it.","Keep Game Night chat open for coordination."]','manual',2,false,'sketch','["online","drawing","telephone","multiplayer"]',201,'online','Gartic Phone','https://garticphone.com/en/lobby'),
  ('online-codenames','codenames-online','online','Codenames Online','Play the classic clue-and-guess word game online.','Codenames Online lets the group create a room and share a room URL for a live browser match.','["Create a Game Night room.","Open Codenames Online and create a room.","Copy the room URL into Game Night.","Share the Game Night room with your players and launch the same Codenames room."]','manual',4,true,'contact','["online","words","teams","multiplayer"]',202,'online','Codenames Online','https://codenames.game/'),
  ('online-jigsaw','jigsaw-explorer','online','Jigsaw Explorer','Solve one jigsaw together in real time.','Jigsaw Explorer supports multiplayer puzzles through a shareable game link.','["Create a Game Night room.","Choose a puzzle on Jigsaw Explorer and switch it to multiplayer mode.","Copy the generated multiplayer link into Game Night.","Everyone opens the same link and works on the puzzle together."]','manual',2,false,'memory','["online","puzzle","jigsaw","co-op"]',203,'online','Jigsaw Explorer','https://www.jigsawexplorer.com/'),
  ('online-playingcards','playingcards-io','online','PlayingCards.io','Free synchronized virtual tables for cards and board games.','PlayingCards.io offers free multiplayer rooms for many classic card and tabletop games with synchronized moves.','["Create a Game Night room.","Open PlayingCards.io and select a game.","Create a room and copy its room code or link into Game Night.","Players launch the same table and play together."]','manual',2,false,'cards','["online","cards","board game","multiplayer"]',204,'online','PlayingCards.io','https://playingcards.io/games/'),
  ('online-bga','board-game-arena','online','Board Game Arena','Play hundreds of browser board games with friends.','Board Game Arena offers free browser play across a large collection of board games. Some games or features may have availability restrictions.','["Create a Game Night room.","Open Board Game Arena and choose a game available to your group.","Create a private table or invite your friends there.","Paste the table invite link into Game Night so everyone can launch it."]','manual',2,false,'race5','["online","board game","strategy","multiplayer"]',205,'online','Board Game Arena','https://en.boardgamearena.com/'),
  ('online-sketchful','sketchful','online','Sketchful.io','Free online Pictionary with private rooms.','Sketchful.io is a browser drawing-and-guessing game with private lobby links and configurable rounds.','["Create a Game Night room.","Open Sketchful.io and create a lobby.","Copy the room link into Game Night.","Everyone opens the same Sketchful lobby to play together."]','manual',2,false,'sketch','["online","drawing","pictionary","multiplayer"]',206,'online','Sketchful.io','https://sketchful.io/'),
  ('online-gartic','gartic-io','online','Gartic.io','Draw and guess in a shared online room.','Gartic.io provides live drawing-and-guessing rooms that friends can join from a shared room link.','["Create a Game Night room.","Open Gartic.io and create or choose a room.","Share the Gartic room link with your Game Night players.","Keep Game Night chat available for coordination."]','manual',2,false,'sketch','["online","drawing","guessing","multiplayer"]',207,'online','Gartic.io','https://gartic.io/'),
  ('online-bombparty','bombparty','online','BombParty','Fast word battles with a room code.','BombParty on JKLM.FUN is a fast-paced word game with private rooms and a shared code.','["Create a Game Night room.","Open JKLM.FUN and start a private room.","Give the private room code to your Game Night group.","Everyone joins the same BombParty room and plays."]','manual',2,false,'wrong','["online","words","party","multiplayer"]',208,'online','JKLM.FUN','https://jklm.fun/'),
  ('online-bonk','bonk-io','online','Bonk.io','Physics battles with custom rooms.','Bonk.io is a browser physics multiplayer game supporting custom games and private play with friends.','["Create a Game Night room.","Open Bonk.io and create a custom game.","Share the room/game invite with your Game Night players.","Join the same Bonk.io match and battle."]','manual',2,false,'race5','["online","action","physics","multiplayer"]',209,'online','Bonk.io','https://bonk.io/'),
  ('online-haxball','haxball','online','HaxBall','Fast browser football in private rooms.','HaxBall is a real-time physics football game with room hosting and built-in chat.','["Create a Game Night room.","Open HaxBall and create or join a room.","Share the HaxBall room link/code with your group.","Play together while using Game Night chat for coordination."]','manual',2,false,'race3','["online","sports","football","multiplayer"]',210,'online','HaxBall','https://www.haxball.com/'),
  ('online-tetrio','tetrio','online','TETR.IO','Create private multiplayer rooms for modern Tetris.','TETR.IO offers free multiplayer play and custom private rooms that can be joined by room ID or URL.','["Create a Game Night room.","Open TETR.IO and choose Custom Game.","Create a private room and copy the room ID or URL.","Share it in your Game Night room so everyone joins the same match."]','manual',2,false,'race3','["online","puzzle","arcade","multiplayer"]',211,'online','TETR.IO','https://tetr.io/'),
  ('online-lichess','lichess','online','Lichess','Free online chess with direct friend challenges.','Lichess is a free, open-source chess server with direct challenges and live games.','["Create a Game Night room.","Open Lichess and use Challenge a friend.","Copy or share the resulting game/invite with your opponent.","Keep the Game Night room open for coordination."]','manual',2,false,'contact','["online","chess","strategy","multiplayer"]',212,'online','Lichess','https://lichess.org/'),
  ('online-pokemon-showdown','pokemon-showdown','online','Pokémon Showdown','Challenge a friend to a browser Pokémon battle.','Pokémon Showdown supports direct challenges between named players in its browser client.','["Create a Game Night room.","Open Pokémon Showdown and set your username.","Use Challenge on your friend or create the agreed battle format.","Share your usernames with the Game Night group and battle together."]','manual',2,false,'race5','["online","strategy","battle","multiplayer"]',213,'online','Pokémon Showdown','https://pokemonshowdown.com/'),
  ('online-papergames-connect4','papergames-connect4','online','Connect 4 — papergames.io','Free two-player Connect 4 with a shareable link.','papergames.io offers free real-time paper-and-pencil classics including Connect 4, Gomoku and Tic-Tac-Toe.','["Create a Game Night room.","Open papergames.io and choose Connect 4.","Create a match and share the unique link.","Both players open the same link and play."]','manual',2,false,'race3','["online","board game","connect 4","multiplayer"]',214,'online','papergames.io','https://papergames.io/en/'),
  ('online-doodle-dash','doodle-dash','online','Doodle Dash','Free drawing, guessing and co-op modes for groups.','Doodle Dash on PlaywithBuddies has several browser drawing modes, including cooperative canvas play.','["Create a Game Night room.","Open Doodle Dash and make a room.","Share the provider room code/link with your group.","Use Game Night chat while everyone joins the same match."]','manual',2,false,'sketch','["online","drawing","party","co-op"]',215,'online','PlaywithBuddies','https://playwithbuddies.com/games/doodle-dash'),
  ('online-mini-golf','mini-golf-online','online','Mini Golf Online','Quick browser mini golf with friends.','PlaywithBuddies offers a free browser mini-golf room for up to four players with shared room codes.','["Create a Game Night room.","Open Mini Golf on PlaywithBuddies and create a room.","Share the provider room code/link.","Everyone joins the same golf room and plays."]','manual',2,false,'race5','["online","sports","mini golf","multiplayer"]',216,'online','PlaywithBuddies','https://playwithbuddies.com/games/mini-golf'),
  ('online-battle-pirates','battle-of-pirates','online','Battle of Pirates','Turn-based naval battles with friends and bots.','Battle of Pirates on PlaywithBuddies is a free browser naval battle with online team modes and optional bots.','["Create a Game Night room.","Open Battle of Pirates and create a room.","Share the provider room code/link.","Play the naval battle together while coordinating in Game Night."]','manual',2,true,'race3','["online","strategy","naval","multiplayer"]',217,'online','PlaywithBuddies','https://playwithbuddies.com/games/battle-of-pirates'),
  ('online-gomoku','gomoku','online','Gomoku','Five-in-a-row online with a friend.','papergames.io offers free Gomoku matches with private friend links in the browser.','["Create a Game Night room.","Open papergames.io and choose Gomoku.","Create a private game and copy the friend link.","Share or paste the provider link into Game Night so the opponent can launch the same game."]','manual',2,false,'race3','["online","board game","strategy","multiplayer"]',218,'online','papergames.io','https://papergames.io/en/gomoku'),
  ('online-tic-tac-toe','tic-tac-toe','online','Tic-Tac-Toe','Quick two-player noughts and crosses online.','papergames.io offers free Tic-Tac-Toe with a private shareable game link and browser play.','["Create a Game Night room.","Open papergames.io and choose Tic-Tac-Toe.","Create a private game and copy the friend link.","Share or paste the provider link into Game Night so both players launch the same game."]','manual',2,false,'race3','["online","board game","quick","multiplayer"]',219,'online','papergames.io','https://papergames.io/en/tic-tac-toe')
on conflict (id) do update set
  slug=excluded.slug,
  game_kind=excluded.game_kind,
  name=excluded.name,
  short_description=excluded.short_description,
  description=excluded.description,
  instructions=excluded.instructions,
  score_mode=excluded.score_mode,
  min_players=excluded.min_players,
  supports_teams=excluded.supports_teams,
  animation_key=excluded.animation_key,
  tags=excluded.tags,
  play_mode=excluded.play_mode,
  external_provider=excluded.external_provider,
  external_launch_url=excluded.external_launch_url,
  sort_order=excluded.sort_order;

update public.games set is_solo_friendly = true where id = 'g09';

commit;
