import type { Game, Player, Room, RoomSnapshot, RoomState } from '../types'
import { getDemoSnapshot, saveDemoSnapshot, savePlayer } from './storage'
import { ensureGuestSession, supabase } from './supabase'

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function mapRoom(row: any): Room {
  return {
    id: row.id,
    code: row.code,
    gameId: row.game_id,
    hostId: row.host_id,
    status: row.status,
    state: row.state ?? {},
    createdAt: row.created_at
  }
}

function mapPlayer(row: any): Player {
  return {
    id: row.player_id,
    name: row.display_name,
    joinedAt: row.created_at,
    score: row.score ?? 0,
    avatar: row.avatar ?? undefined
  }
}

function createLocalRoom(game: Game, host: Player): RoomSnapshot {
  const room: Room = {
    id: crypto.randomUUID(),
    code: roomCode(),
    gameId: game.id,
    hostId: host.id,
    status: 'lobby',
    state: { round: 0, turnIndex: 0, targetScore: game.targetScore ?? undefined },
    createdAt: new Date().toISOString()
  }
  const snapshot: RoomSnapshot = { room, players: [host] }
  saveDemoSnapshot(snapshot)
  return snapshot
}

export async function createRoom(game: Game, host: Player): Promise<RoomSnapshot> {
  if (!supabase) {
    return createLocalRoom(game, host)
  }

  try {
    const user = await ensureGuestSession()
    const normalizedHost = { ...host, id: user.id }
    savePlayer(normalizedHost)

    const { data, error } = await supabase.rpc('create_room', {
      p_game_id: game.id,
      p_display_name: normalizedHost.name
    })

    if (error) {
      console.warn('Supabase create_room RPC error, fallback to local room:', error.message)
      return createLocalRoom(game, host)
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row?.code) {
      return createLocalRoom(game, host)
    }

    return await getRoom(String(row.code))
  } catch (err) {
    console.warn('createRoom network/auth fallback to local room:', err)
    return createLocalRoom(game, host)
  }
}

export async function getRoom(code: string): Promise<RoomSnapshot> {
  const normalizedCode = code.trim().toUpperCase()
  const local = getDemoSnapshot(normalizedCode)

  if (!supabase) {
    if (!local) throw new Error(`Room "${normalizedCode}" not found.`)
    return local
  }

  try {
    const { data: r, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (error || !r) {
      if (local) return local
      throw new Error(`Room "${normalizedCode}" not found.`)
    }

    const { data: p, error: pe } = await supabase
      .from('room_players')
      .select('*')
      .eq('room_id', r.id)
      .order('created_at')

    if (pe) throw pe

    return {
      room: mapRoom(r),
      players: (p ?? []).map(mapPlayer)
    }
  } catch (err) {
    if (local) return local
    throw err
  }
}

export async function joinRoom(code: string, player: Player): Promise<RoomSnapshot> {
  const normalizedCode = code.trim().toUpperCase()
  const snapshot = await getRoom(normalizedCode)

  if (!supabase) {
    if (!snapshot.players.some(p => p.id === player.id)) {
      snapshot.players.push(player)
    }
    saveDemoSnapshot(snapshot)
    return snapshot
  }

  try {
    const user = await ensureGuestSession()
    const normalizedPlayer = { ...player, id: user.id }
    savePlayer(normalizedPlayer)

    const { error } = await supabase.rpc('join_room', {
      p_code: normalizedCode,
      p_display_name: normalizedPlayer.name
    })

    if (error) {
      console.warn('join_room RPC error, fallback to local snapshot update:', error.message)
      if (!snapshot.players.some(p => p.id === normalizedPlayer.id)) {
        snapshot.players.push(normalizedPlayer)
      }
      saveDemoSnapshot(snapshot)
      return snapshot
    }

    return await getRoom(normalizedCode)
  } catch (err) {
    console.warn('joinRoom error, updating local snapshot:', err)
    if (!snapshot.players.some(p => p.id === player.id)) {
      snapshot.players.push(player)
    }
    saveDemoSnapshot(snapshot)
    return snapshot
  }
}

export async function updateRoomState(
  snapshot: RoomSnapshot,
  state: Partial<RoomState>,
  status?: Room['status']
): Promise<RoomSnapshot> {
  const nextRoom = {
    ...snapshot.room,
    state: { ...snapshot.room.state, ...state },
    status: status ?? snapshot.room.status
  }
  const next = { room: nextRoom, players: snapshot.players }

  // Always keep local copy synchronized
  saveDemoSnapshot(next)

  if (!supabase) {
    return next
  }

  try {
    const { error } = await supabase.rpc('update_room_state', {
      p_room_id: nextRoom.id,
      p_state: state,
      p_status: nextRoom.status
    })

    if (error) {
      console.warn('update_room_state RPC error:', error.message)
      return next
    }

    return await getRoom(nextRoom.code)
  } catch (err) {
    console.warn('updateRoomState error, using local state:', err)
    return next
  }
}

export async function changeScore(
  room: Room,
  playerId: string,
  delta: number
): Promise<RoomSnapshot> {
  const snap = getDemoSnapshot(room.code)
  if (snap) {
    snap.players = snap.players.map(p =>
      p.id === playerId ? { ...p, score: Math.max(0, p.score + delta) } : p
    )
    saveDemoSnapshot(snap)
  }

  if (!supabase) {
    if (!snap) throw new Error('Room not found')
    return snap
  }

  try {
    const { error } = await supabase.rpc('change_room_score', {
      p_room_id: room.id,
      p_player_id: playerId,
      p_delta: delta
    })

    if (error) {
      console.warn('change_room_score RPC error, fallback to local snapshot:', error.message)
      if (snap) return snap
      throw new Error(error.message)
    }

    return await getRoom(room.code)
  } catch (err) {
    if (snap) return snap
    throw err
  }
}

export function subscribeToRoom(room: Room, onChange: () => void) {
  const client = supabase
  if (!client) return () => undefined

  const channelName = `room:${room.id}:${crypto.randomUUID()}`

  try {
    const channel = client
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`
        },
        onChange
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_players',
          filter: `room_id=eq.${room.id}`
        },
        onChange
      )

    void channel.subscribe(status => {
      if (status === 'CHANNEL_ERROR') {
        console.warn('Realtime channel error for room:', room.code)
      }
    })

    return () => {
      void client.removeChannel(channel)
    }
  } catch (err) {
    console.warn('subscribeToRoom failed:', err)
    return () => undefined
  }
}
