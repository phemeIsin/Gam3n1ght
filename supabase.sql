-- Game Night PWA — Supabase bootstrap
-- Run this entire file in Supabase SQL Editor.
-- It upgrades the earlier MVP schema and is safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.games (
  id text primary key,
  slug text unique not null,
  game_kind text not null default 'manual',
  name text not null,
  short_description text not null,
  description text not null,
  instructions jsonb not null default '[]'::jsonb,
  example_url text,
  animation_url text,
  animation_key text not null default 'default',
  score_mode text not null default 'points',
  target_score integer,
  min_players integer not null default 2,
  supports_teams boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  sort_order integer not null default 999,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_prompts (
  id text primary key,
  game_id text not null references public.games(id) on delete cascade,
  prompt text not null,
  category text,
  difficulty text check (difficulty in ('easy','medium','hard')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  game_id text not null references public.games(id),
  host_id text not null,
  created_by uuid references auth.users(id) on delete set null,
  status text not null default 'lobby' check (status in ('lobby','playing','finished')),
  state jsonb not null default '{"round":0,"turnIndex":0}'::jsonb,
  expires_at timestamptz not null default (now() + interval '12 hours'),
  created_at timestamptz not null default now()
);

create table if not exists public.room_players (
  room_id uuid not null references public.rooms(id) on delete cascade,
  player_id text not null,
  display_name text not null,
  score integer not null default 0,
  created_at timestamptz not null default now(),
  primary key(room_id,player_id)
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.game_suggestions (
  id uuid primary key default gen_random_uuid(),
  submitter_id uuid references auth.users(id) on delete set null,
  submitter_name text not null,
  submitter_email text,
  name text not null,
  short_description text not null,
  description text not null,
  instructions jsonb not null default '[]'::jsonb,
  example_url text,
  score_mode text not null default 'points',
  target_score integer,
  min_players integer not null default 2,
  supports_teams boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  game_kind text not null default 'race-5',
  notes text,
  status text not null default 'pending' check (status in ('pending','approved','declined')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists game_suggestions_game_kind_idx on public.game_suggestions(game_kind);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  category text not null default 'other' check (category in ('bug','complaint','suggestion','partnership','other')),
  message text not null,
  status text not null default 'open' check (status in ('open','resolved')),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.games add column if not exists game_kind text not null default 'manual';
alter table public.game_suggestions add column if not exists game_kind text not null default 'race-5';
alter table public.rooms add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.rooms add column if not exists expires_at timestamptz not null default (now() + interval '12 hours');

create index if not exists game_prompts_game_id_idx on public.game_prompts(game_id);
create index if not exists rooms_code_idx on public.rooms(code);
create index if not exists rooms_expires_at_idx on public.rooms(expires_at);
create index if not exists rooms_created_by_idx on public.rooms(created_by);
create index if not exists room_players_room_id_idx on public.room_players(room_id);
create index if not exists game_suggestions_status_idx on public.game_suggestions(status, created_at desc);
create index if not exists game_suggestions_submitter_idx on public.game_suggestions(submitter_id);
create index if not exists contact_messages_status_idx on public.contact_messages(status, created_at desc);

alter table public.games enable row level security;
alter table public.game_prompts enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.admin_users enable row level security;
alter table public.game_suggestions enable row level security;
alter table public.contact_messages enable row level security;

-- Remove older open-MVP policies before recreating the secure policies.
drop policy if exists "games readable" on public.games;
drop policy if exists "games insertable" on public.games;
drop policy if exists "games updatable" on public.games;
drop policy if exists "games deletable" on public.games;
drop policy if exists "prompts readable" on public.game_prompts;
drop policy if exists "prompts insertable" on public.game_prompts;
drop policy if exists "prompts updatable" on public.game_prompts;
drop policy if exists "rooms readable" on public.rooms;
drop policy if exists "rooms insertable" on public.rooms;
drop policy if exists "rooms updatable" on public.rooms;
drop policy if exists "players readable" on public.room_players;
drop policy if exists "players insertable" on public.room_players;
drop policy if exists "players updatable" on public.room_players;
drop policy if exists "games public read" on public.games;
drop policy if exists "games admin insert" on public.games;
drop policy if exists "games admin update" on public.games;
drop policy if exists "games admin delete" on public.games;
drop policy if exists "prompts public read" on public.game_prompts;
drop policy if exists "prompts admin insert" on public.game_prompts;
drop policy if exists "prompts admin update" on public.game_prompts;
drop policy if exists "prompts admin delete" on public.game_prompts;
drop policy if exists "rooms public read active" on public.rooms;
drop policy if exists "players public read active" on public.room_players;
drop policy if exists "game assets public read" on storage.objects;
drop policy if exists "game assets public upload mvp" on storage.objects;
drop policy if exists "game assets public update mvp" on storage.objects;
drop policy if exists "game assets admin upload" on storage.objects;
drop policy if exists "game assets admin update" on storage.objects;
drop policy if exists "game assets admin delete" on storage.objects;

drop policy if exists "suggestions public insert" on public.game_suggestions;
drop policy if exists "suggestions admin read" on public.game_suggestions;
drop policy if exists "suggestions admin update" on public.game_suggestions;
drop policy if exists "contacts public insert" on public.contact_messages;
drop policy if exists "contacts admin read" on public.contact_messages;
drop policy if exists "contacts admin update" on public.contact_messages;
drop policy if exists "rooms admin read all" on public.rooms;
drop policy if exists "players admin read all" on public.room_players;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;

create policy "games public read" on public.games
  for select using (true);
create policy "games admin insert" on public.games
  for insert with check (public.is_admin());
create policy "games admin update" on public.games
  for update using (public.is_admin()) with check (public.is_admin());
create policy "games admin delete" on public.games
  for delete using (public.is_admin());

create policy "prompts public read" on public.game_prompts
  for select using (true);
create policy "prompts admin insert" on public.game_prompts
  for insert with check (public.is_admin());
create policy "prompts admin update" on public.game_prompts
  for update using (public.is_admin()) with check (public.is_admin());
create policy "prompts admin delete" on public.game_prompts
  for delete using (public.is_admin());

create policy "rooms public read active" on public.rooms
  for select using (expires_at > now());
create policy "rooms admin read all" on public.rooms
  for select using (public.is_admin());
create policy "players public read active" on public.room_players
  for select using (exists(select 1 from public.rooms r where r.id = room_id and r.expires_at > now()));
create policy "players admin read all" on public.room_players
  for select using (public.is_admin());

create policy "suggestions public insert" on public.game_suggestions
  for insert with check (auth.role() = 'authenticated' and (submitter_id is null or submitter_id = auth.uid()));
create policy "suggestions admin read" on public.game_suggestions
  for select using (public.is_admin());
create policy "suggestions admin update" on public.game_suggestions
  for update using (public.is_admin()) with check (public.is_admin());

create policy "contacts public insert" on public.contact_messages
  for insert with check (auth.role() = 'authenticated' and (sender_id is null or sender_id = auth.uid()));
create policy "contacts admin read" on public.contact_messages
  for select using (public.is_admin());
create policy "contacts admin update" on public.contact_messages
  for update using (public.is_admin()) with check (public.is_admin());

-- The client cannot directly INSERT/UPDATE rooms or room_players.
-- Those operations go through validated SECURITY DEFINER RPCs below.

create or replace function public.cleanup_expired_rooms()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from public.rooms where expires_at <= now();
  get diagnostics removed = row_count;
  return removed;
end;
$$;

create or replace function public.create_room(p_game_id text, p_display_name text)
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
begin
  if uid is null then raise exception 'Authentication is required to create a room.' using errcode = '42501'; end if;
  if length(trim(p_display_name)) < 1 or length(trim(p_display_name)) > 30 then
    raise exception 'Name must be between 1 and 30 characters.' using errcode = '22023';
  end if;
  if not exists(select 1 from public.games where id = p_game_id) then
    raise exception 'The selected game does not exist.' using errcode = '22023';
  end if;

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

  insert into public.rooms(code, game_id, host_id, created_by, status, state, expires_at)
  values(new_code, p_game_id, uid::text, uid, 'lobby',
         jsonb_build_object('round',0,'turnIndex',0,'targetScore',(select target_score from public.games where id=p_game_id)),
         now() + interval '12 hours')
  returning id into new_room_id;

  insert into public.room_players(room_id, player_id, display_name, score)
  values(new_room_id, uid::text, trim(p_display_name), 0);

  return query select new_room_id, new_code;
end;
$$;

create or replace function public.join_room(p_code text, p_display_name text)
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

  select * into room_row from public.rooms where code = upper(trim(p_code)) and expires_at > now() for update;
  if not found then raise exception 'Room not found or expired.' using errcode = 'P0002'; end if;

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

create or replace function public.update_room_state(p_room_id uuid, p_state jsonb, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if p_status not in ('lobby','playing','finished') then raise exception 'Invalid room status.' using errcode = '22023'; end if;
  if not exists(select 1 from public.rooms where id=p_room_id and host_id=uid::text and expires_at > now()) then
    raise exception 'Only the room host can change room state.' using errcode = '42501';
  end if;
  update public.rooms set state = coalesce(state,'{}'::jsonb) || coalesce(p_state,'{}'::jsonb), status=p_status where id=p_room_id;
end;
$$;

create or replace function public.change_room_score(p_room_id uuid, p_player_id text, p_delta integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Authentication is required.' using errcode = '42501'; end if;
  if abs(coalesce(p_delta,0)) > 1000 then raise exception 'Score change is too large.' using errcode = '22023'; end if;
  if not exists(select 1 from public.rooms where id=p_room_id and host_id=uid::text and expires_at > now()) then
    raise exception 'Only the room host can change scores.' using errcode = '42501';
  end if;
  update public.room_players
  set score = greatest(0, score + coalesce(p_delta,0))
  where room_id=p_room_id and player_id=p_player_id;
  if not found then raise exception 'Player is not in this room.' using errcode = 'P0002'; end if;
end;
$$;

-- RPCs used by the anon client.
grant execute on function public.create_room(text,text) to anon, authenticated;
grant execute on function public.join_room(text,text) to anon, authenticated;
grant execute on function public.update_room_state(uuid,jsonb,text) to authenticated;
grant execute on function public.change_room_score(uuid,text,integer) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.cleanup_expired_rooms() to authenticated;
grant insert on public.game_suggestions, public.contact_messages to authenticated;
grant select on public.game_suggestions, public.contact_messages to authenticated;
grant update on public.game_suggestions, public.contact_messages to authenticated;

-- Storage: public read, admin-only writes. This keeps face-free example animations safe.
insert into storage.buckets (id,name,public)
values ('game-assets','game-assets',true)
on conflict (id) do nothing;
create policy "game assets public read" on storage.objects
  for select using (bucket_id='game-assets');
create policy "game assets admin upload" on storage.objects
  for insert with check (bucket_id='game-assets' and public.is_admin());
create policy "game assets admin update" on storage.objects
  for update using (bucket_id='game-assets' and public.is_admin())
  with check (bucket_id='game-assets' and public.is_admin());
create policy "game assets admin delete" on storage.objects
  for delete using (bucket_id='game-assets' and public.is_admin());

-- Realtime: tolerate the table already being present in the publication.
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.rooms'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.room_players'; exception when duplicate_object then null; end;
end $$;

insert into public.games (id,slug,game_kind,name,short_description,description,instructions,example_url,animation_key,score_mode,target_score,min_players,supports_teams,tags,sort_order)
values
('g01','uno','uno','UNO Game','Play physical UNO. Let the room handle the scores.','A scorekeeper for a real UNO table. Keep your physical deck; the app handles the running totals.','["Create a room and add everyone at the table.","Play UNO normally with the physical deck.","After each hand, enter the points for the winner or losing players.","Keep playing until the table reaches the agreed score."]','https://www.instagram.com/reel/DcaSdFHyL9E/','cards','uno',null,2,false,'["card game","scoreboard","classic"]',1),
('g02','forbidden-number','forbidden-number','Don’t Say X','Pick a number. Say it and you lose.','A counting trap. Choose a forbidden number before the round and count around the group without saying it.','["Choose the forbidden number, such as 21.","Players count upward in order.","Agree how many numbers a player may say on a turn.","Whoever says the forbidden number loses the round."]','https://www.instagram.com/reel/Dbbb1owSJlG/','counting','points',null,2,false,'["counting","elimination","reaction"]',2),
('g03','opposite-action','opposite-action','Stay Different','Do the opposite. Be the last player still wrong on purpose.','The host sets an action such as sit/stand. Players try to stay opposite to the majority.','["Choose two opposite actions: sit / stand is the easiest.","Host gives rapid commands or changes the majority action.","Your goal is to be the last person not matching the group.","Award the round point to the last player who stays different."]',null,'mirror','points',null,3,false,'["reaction","group","movement"]',3),
('g04','race-3','race-3','Get to 3','Win three rounds before everyone else.','A clean first-to-three race. The app is the round counter and scoreboard.','["Create a room and get everyone ready.","Run the physical challenge for the round.","Host awards one point to the round winner.","First player to 3 points wins the game."]','https://www.instagram.com/reel/DcpFNjsvfuh/','race3','race',3,2,false,'["race","score","quick"]',4),
('g05','sketch','sketch','Sketch Game','Draw the prompt. Let everyone else guess.','A drawing round with a built-in canvas and prompt deck.','["Choose a drawer and give them a secret prompt.","The drawer sketches without writing words or letters.","Everyone else guesses aloud.","Give the point to the first correct guess and move to the next drawer."]','https://www.instagram.com/reel/DdHvFejv65y/','sketch','points',null,3,false,'["drawing","guessing","creative"]',5),
('g06','find-number','find-number','Find the Number','Race to spot the number first.','A visual reaction game where the host reveals a target and the fastest correct player takes the point.','["Host chooses or reveals a number.","Everyone searches the visual challenge at the same time.","First player to call the correct number wins the round.","Record the winner and start again."]','https://www.instagram.com/reel/DcAko4WN2m0/','search','points',null,2,false,'["visual","numbers","reaction"]',6),
('g07','guess-leader','guess-leader','Guess the Leader','Figure out who is secretly leading the group.','One player is the leader and the rest follow. A guesser watches closely and tries to identify the leader.','["Send one guesser away or have them close their eyes.","Pick a secret leader.","The leader changes actions while everyone mirrors them.","Bring the guesser back; they get a limited number of guesses."]',null,'leader','points',null,4,false,'["social","bluff","guessing"]',7),
('g08','guess-number','guess-number','Guess the Number','Closest guess wins the round.','Choose a hidden number inside an agreed range and let players chase it.','["Choose a range, such as 1–100.","Host secretly picks a target number.","Players take turns guessing.","Award the point to the closest or first exact guess."]',null,'target','points',null,2,false,'["numbers","guessing","party"]',8),
('g09','ten-seconds','ten-seconds','10 Seconds','Trust your internal clock.','Try to hit exactly ten seconds without a visible timer.','["Start the round and have players close their eyes or turn away.","Each player says stop when they think 10 seconds have passed.","Host checks the real elapsed time.","Closest to 10.00 seconds wins the round."]',null,'timer','points',null,2,false,'["timing","reaction","challenge"]',9),
('g10','memory-drawing','memory-drawing','Memory Drawing','Look. Hide. Draw from memory.','Study a simple object or scene for a few seconds, hide it, then recreate it from memory.','["Choose a prompt and show the reference briefly.","Hide the reference.","Players draw what they remember.","Host judges the closest drawing or lets the group vote."]',null,'memory','points',null,2,false,'["drawing","memory","creative"]',10),
('g11','race-5','race-5','First to 5','Win five rounds before anyone else.','A fast score race for games where each completed challenge is worth one point.','["Start a room with all players.","Play one physical round.","Host awards one point to the winner.","First player to 5 points wins."]',null,'race5','race',5,2,false,'["race","score","classic"]',11),
('g12','wrong-answers','wrong-answers','Wrong Answers Only','Answer incorrectly — but answer fast.','Questions are easy; the trick is never giving the correct answer.','["Host reads a simple question.","Every response must be deliberately wrong.","No repeating an earlier answer.","Award the point to the best response of the round."]',null,'wrong','points',null,3,false,'["questions","funny","speed"]',12),
('g13','contact','contact','Contact','Use the word deck and make a connection.','A word-based party game with a rotating prompt deck.','["Pick a target word from the deck.","Host gives the agreed starting clue or letter.","Players offer clues without saying the target word.","When two players think they have the same answer, call contact and compare."]',null,'contact','points',null,3,false,'["words","communication","party"]',13),
('g14','hsk-cup','hsk-cup','Head, Shoulders, Knees & Cup','Follow the body calls — grab the cup first.','A reflex game with four positions and a cup.','["Put one cup between the players.","Call head, shoulders, knees in random order.","On cup, grab the cup immediately.","False starts lose the point; first clean grab wins."]',null,'cup','points',null,2,false,'["reaction","movement","duel"]',14),
('g15','garbage','garbage','Garbage','Physical card game + digital score tracker.','Use the app for rounds, winners and house scoring while the real deck stays on the table.','["Set up the Garbage card game with the physical deck.","Create a room and add players.","After a round, record the result in the scoreboard.","Repeat until your table decides the winner."]',null,'garbage','manual',null,2,false,'["card game","scorekeeper","strategy"]',15),
('g16','pressure','pressure','Pressure','Physical card game with a shared score table.','Run the card game in real life and use the app to track rounds, pressure points and the final winner.','["Deal and set up the physical game according to your house rules.","Play the round completely offline from the app.","Host records who won the round and the points.","Use the running table to keep everyone honest."]',null,'pressure','manual',null,2,false,'["card game","scorekeeper","strategy"]',16)
on conflict (slug) do update set game_kind=excluded.game_kind,name=excluded.name,short_description=excluded.short_description,description=excluded.description,instructions=excluded.instructions,example_url=excluded.example_url,animation_key=excluded.animation_key,score_mode=excluded.score_mode,target_score=excluded.target_score,min_players=excluded.min_players,supports_teams=excluded.supports_teams,tags=excluded.tags,sort_order=excluded.sort_order,updated_at=now();

insert into public.game_prompts (id,game_id,prompt,difficulty) values
('sketch-e-01','g05','cat','easy'),('sketch-e-02','g05','guitar','easy'),('sketch-e-03','g05','pizza','easy'),('sketch-e-04','g05','airplane','easy'),('sketch-e-05','g05','toothbrush','easy'),('sketch-e-06','g05','elephant','easy'),('sketch-e-07','g05','football','easy'),('sketch-e-08','g05','umbrella','easy'),('sketch-e-09','g05','bicycle','easy'),('sketch-e-10','g05','rocket','easy'),
('sketch-m-01','g05','lighthouse','medium'),('sketch-m-02','g05','photographer','medium'),('sketch-m-03','g05','washing machine','medium'),('sketch-m-04','g05','treasure chest','medium'),('sketch-m-05','g05','campfire','medium'),('sketch-m-06','g05','roller coaster','medium'),('sketch-m-07','g05','birthday surprise','medium'),('sketch-m-08','g05','traffic jam','medium'),
('sketch-h-01','g05','time machine','hard'),('sketch-h-02','g05','underwater restaurant','hard'),('sketch-h-03','g05','alien trying to cook','hard'),('sketch-h-04','g05','dragon at the airport','hard'),('sketch-h-05','g05','robot getting a haircut','hard'),('sketch-h-06','g05','haunted supermarket','hard'),
('mem-e-01','g10','balloon','easy'),('mem-e-02','g10','tree','easy'),('mem-e-03','g10','chair','easy'),('mem-e-04','g10','fish','easy'),('mem-e-05','g10','sun','easy'),('mem-e-06','g10','house','easy'),('mem-e-07','g10','coffee mug','easy'),('mem-e-08','g10','shoe','easy'),('mem-e-09','g10','key','easy'),('mem-e-10','g10','book','easy'),
('mem-m-01','g10','bicycle with basket','medium'),('mem-m-02','g10','person at a bus stop','medium'),('mem-m-03','g10','table with three objects','medium'),('mem-m-04','g10','park bench','medium'),('mem-m-05','g10','kitchen counter','medium'),('mem-m-06','g10','bedroom desk','medium'),('mem-m-07','g10','market stall','medium'),('mem-m-08','g10','simple robot','medium'),
('mem-h-01','g10','busy street scene','hard'),('mem-h-02','g10','game-night table from above','hard'),('mem-h-03','g10','space station control room','hard'),('mem-h-04','g10','crowded restaurant','hard'),('mem-h-05','g10','playground with five objects','hard'),('mem-h-06','g10','imaginary machine with many parts','hard'),
('wrong-01','g12','What color is the sky?',null),('wrong-02','g12','How many days are in a week?',null),('wrong-03','g12','What do you drink when thirsty?',null),('wrong-04','g12','What animal says meow?',null),('wrong-05','g12','What do you use to cut paper?',null),('wrong-06','g12','What planet do we live on?',null),('wrong-07','g12','What is 2 + 2?',null),('wrong-08','g12','What do you wear on your feet?',null),('wrong-09','g12','What do you open a door with?',null),('wrong-10','g12','What do bees make?',null),
('contact-01','g13','apple',null),('contact-02','g13','school',null),('contact-03','g13','phone',null),('contact-04','g13','river',null),('contact-05','g13','window',null),('contact-06','g13','doctor',null),('contact-07','g13','train',null),('contact-08','g13','banana',null),('contact-09','g13','hospital',null),('contact-10','g13','holiday',null),('contact-11','g13','garden',null),('contact-12','g13','music',null)
on conflict (id) do nothing;
