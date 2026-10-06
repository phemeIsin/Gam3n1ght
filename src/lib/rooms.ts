import type { Game, Player, Room, RoomSnapshot, RoomState } from '../types'
import { getDemoSnapshot, saveDemoSnapshot, savePlayer } from './storage'
import { ensureGuestSession, supabase } from './supabase'

function roomCode() { return Math.random().toString(36).slice(2, 8).toUpperCase() }

function mapRoom(row: any): Room {
  return { id: row.id, code: row.code, gameId: row.game_id, hostId: row.host_id, status: row.status, state: row.state ?? {}, createdAt: row.created_at }
}
function mapPlayer(row: any): Player { return { id: row.player_id, name: row.display_name, joinedAt: row.created_at, score: row.score ?? 0 } }

export async function createRoom(game: Game, host: Player): Promise<RoomSnapshot> {
  if (!supabase) {
    const room: Room = { id: crypto.randomUUID(), code: roomCode(), gameId: game.id, hostId: host.id, status: 'lobby', state: { round: 0, turnIndex: 0, targetScore: game.targetScore ?? undefined }, createdAt: new Date().toISOString() }
    const snapshot = { room, players: [host] }
    saveDemoSnapshot(snapshot)
    return snapshot
  }

  const user = await ensureGuestSession()
  const normalizedHost = { ...host, id: user.id }
  savePlayer(normalizedHost)

  const { data, error } = await supabase.rpc('create_room', {
    p_game_id: game.id,
    p_display_name: normalizedHost.name,
  })
  if (error) throw new Error(error.message)

  const row = Array.isArray(data) ? data[0] : data
  if (!row?.code) throw new Error('Room was created but no room code was returned.')
  return getRoom(String(row.code))
}

export async function getRoom(code: string): Promise<RoomSnapshot> {
  if (!supabase) { const local = getDemoSnapshot(code); if (!local) throw new Error('Room not found'); return local }
  const { data: r, error } = await supabase.from('rooms').select('*').eq('code',code.toUpperCase()).maybeSingle()
  if (error || !r) throw new Error('Room not found')
  const { data: p, error: pe } = await supabase.from('room_players').select('*').eq('room_id',r.id).order('created_at')
  if (pe) throw pe
  return {room:mapRoom(r), players:(p ?? []).map(mapPlayer)}
}

export async function joinRoom(code: string, player: Player) {
  const normalizedCode = code.trim().toUpperCase()
  const snapshot = await getRoom(normalizedCode)
  if (!supabase) {
    if (!snapshot.players.some(p => p.id === player.id)) snapshot.players.push(player)
    saveDemoSnapshot(snapshot)
    return snapshot
  }

  const user = await ensureGuestSession()
  const normalizedPlayer = { ...player, id: user.id }
  savePlayer(normalizedPlayer)

  const { error } = await supabase.rpc('join_room', {
    p_code: normalizedCode,
    p_display_name: normalizedPlayer.name,
  })
  if (error) throw new Error(error.message)
  return getRoom(normalizedCode)
}

export async function updateRoomState(snapshot: RoomSnapshot, state: Partial<RoomState>, status?: Room['status']) {
  const nextRoom = { ...snapshot.room, state: { ...snapshot.room.state, ...state }, status: status ?? snapshot.room.status }
  const next = { room: nextRoom, players: snapshot.players }
  if (!supabase) {
    saveDemoSnapshot(next)
    return next
  }

  const { error } = await supabase.rpc('update_room_state', {
    p_room_id: nextRoom.id,
    p_state: state,
    p_status: nextRoom.status,
  })
  if (error) throw new Error(error.message)
  return getRoom(nextRoom.code)
}

export async function changeScore(room: Room, playerId: string, delta: number) {
  if (!supabase) {
    const snap = getDemoSnapshot(room.code)
    if (!snap) throw new Error('Room not found')
    snap.players = snap.players.map(p => p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p)
    saveDemoSnapshot(snap)
    return snap
  }

  const { error } = await supabase.rpc('change_room_score', {
    p_room_id: room.id,
    p_player_id: playerId,
    p_delta: delta,
  })
  if (error) throw new Error(error.message)
  return getRoom(room.code)
}

export function subscribeToRoom(room: Room, onChange: () => void) {
  const client = supabase
  if (!client) return () => undefined

  // Use a unique channel instance so React/dev-mode remounts
  // cannot accidentally reuse an already-subscribed channel.
  const channelName = `room:${room.id}:${crypto.randomUUID()}`

  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${room.id}`,
      },
      onChange,
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_players',
        filter: `room_id=eq.${room.id}`,
      },
      onChange,
    )

  void channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('ROOM REALTIME CHANNEL ERROR:', room.code)
    }

    if (status === 'TIMED_OUT') {
      console.error('ROOM REALTIME CHANNEL TIMED OUT:', room.code)
    }
  })

  return () => {
    void client.removeChannel(channel)
  }
}
