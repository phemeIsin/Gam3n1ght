import type { ActiveRoomSummary, ChatMessage, Game, Player, Room, RoomSnapshot, RoomState } from '../types'
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
    createdAt: row.created_at,
    roomType: row.room_type ?? 'physical',
    roomName: row.room_name ?? undefined,
    externalRoomUrl: row.external_room_url ?? undefined
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
    createdAt: new Date().toISOString(),
    roomType: game.playMode ?? 'physical',
    roomName: `${game.name} Room`,
    externalRoomUrl: undefined
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
      throw new Error(error.message)
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row?.code) {
      throw new Error('The room was created but no room code was returned.')
    }

    return await getRoom(String(row.code))
  } catch (err) {
    throw err instanceof Error ? err : new Error('Could not create the live room.')
  }
}

export async function getRoom(code: string): Promise<RoomSnapshot> {
  const normalizedCode = code.trim().toUpperCase()
  const local = getDemoSnapshot(normalizedCode)

  if (!supabase) {
    if (!local) throw new Error(`Room "${normalizedCode}" not found.`)
    if (local.room.status === 'finished') throw new Error(`Room "${normalizedCode}" has ended.`)
    const age = Date.now() - new Date(local.room.createdAt).getTime()
    if (age > 12 * 60 * 60 * 1000) throw new Error(`Room "${normalizedCode}" has expired.`)
    return local
  }

  try {
    const { data: r, error } = await supabase
      .from('rooms')
      .select('*')
      .eq('code', normalizedCode)
      .maybeSingle()

    if (error || !r) {
      throw new Error(`Room "${normalizedCode}" not found or expired.`)
    }
    if (r.status === 'finished' || new Date(r.expires_at).getTime() <= Date.now()) {
      throw new Error(`Room "${normalizedCode}" has ended or expired.`)
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
    throw err instanceof Error ? err : new Error('Could not load the live room.')
  }
}

export async function joinRoom(code: string, player: Player): Promise<RoomSnapshot> {
  const normalizedCode = code.trim().toUpperCase()
  const snapshot = await getRoom(normalizedCode)

  if (!supabase) {
    if (snapshot.room.status === 'finished') throw new Error(`Room "${normalizedCode}" has ended.`)
    const age = Date.now() - new Date(snapshot.room.createdAt).getTime()
    if (age > 12 * 60 * 60 * 1000) throw new Error(`Room "${normalizedCode}" has expired.`)
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
      throw new Error(error.message)
    }

    return await getRoom(normalizedCode)
  } catch (err) {
    throw err instanceof Error ? err : new Error('Could not join the live room.')
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
      throw new Error(error.message)
    }

    if (nextRoom.status === 'finished') return next
    return await getRoom(nextRoom.code)
  } catch (err) {
    throw err instanceof Error ? err : new Error('Could not update the live room.')
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
      throw new Error(error.message)
    }

    return await getRoom(room.code)
  } catch (err) {
    throw err instanceof Error ? err : new Error('Could not update the live room score.')
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


export async function listActiveRooms(): Promise<ActiveRoomSummary[]> {
  if (!supabase) {
    const rooms: ActiveRoomSummary[] = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (!key?.startsWith('game-night-room-')) continue
      try {
        const snap = JSON.parse(localStorage.getItem(key) ?? 'null') as RoomSnapshot | null
        if (!snap || snap.room.status === 'finished') continue
        const createdAt = new Date(snap.room.createdAt)
        if (Date.now() - createdAt.getTime() > 12 * 60 * 60 * 1000) continue
        const gameName = snap.room.roomName?.replace(/ Room$/, '') || snap.room.gameId
        rooms.push({
          id: snap.room.id,
          code: snap.room.code,
          gameId: snap.room.gameId,
          gameName,
          gameSlug: snap.room.gameId,
          roomType: snap.room.roomType ?? 'physical',
          roomName: snap.room.roomName ?? `${gameName} Room`,
          status: snap.room.status,
          playerCount: snap.players.length,
          createdAt: snap.room.createdAt,
          expiresAt: new Date(createdAt.getTime() + 12 * 60 * 60 * 1000).toISOString(),
          externalRoomUrl: snap.room.externalRoomUrl
        })
      } catch {
        // Ignore malformed local demo room entries.
      }
    }
    return rooms.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  const { data, error } = await supabase
    .from('rooms')
    .select('id,code,game_id,status,created_at,expires_at,room_type,room_name,external_room_url,games(name,slug),room_players(player_id)')
    .gt('expires_at', new Date().toISOString())
    .in('status', ['lobby', 'playing'])
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(error.message)

  return (data ?? []).map((row: any) => ({
    id: row.id,
    code: row.code,
    gameId: row.game_id,
    gameName: row.games?.name ?? row.game_id,
    gameSlug: row.games?.slug ?? row.game_id,
    roomType: (row.room_type ?? 'physical') as 'physical' | 'online',
    roomName: row.room_name ?? `${row.games?.name ?? row.game_id} Room`,
    status: row.status as 'lobby' | 'playing',
    playerCount: Array.isArray(row.room_players) ? row.room_players.length : 0,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    externalRoomUrl: row.external_room_url ?? undefined
  }))
}

export function subscribeToActiveRooms(onChange: () => void) {
  if (!supabase) return () => undefined
  const client = supabase
  const channel = client
    .channel(`active-rooms:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players' }, onChange)
  void channel.subscribe()
  return () => { void client.removeChannel(channel) }
}

export async function endRoom(snapshot: RoomSnapshot): Promise<RoomSnapshot> {
  return updateRoomState(snapshot, {}, 'finished')
}

export async function setExternalRoomUrl(room: Room, url: string): Promise<RoomSnapshot> {
  const normalized = url.trim()
  if (!normalized) throw new Error('Enter a valid external game link.')
  if (!/^https?:\/\//i.test(normalized)) throw new Error('The game link should start with http:// or https://')

  if (!supabase) {
    const snap = getDemoSnapshot(room.code)
    if (!snap) throw new Error('Room not found.')
    snap.room.externalRoomUrl = normalized
    saveDemoSnapshot(snap)
    return snap
  }

  const { error } = await supabase.rpc('update_room_external_url', {
    p_room_id: room.id,
    p_external_room_url: normalized
  })
  if (error) throw new Error(error.message)
  return getRoom(room.code)
}

export async function listRoomChat(room: Room): Promise<ChatMessage[]> {
  const key = `game-night-chat-${room.code}`
  if (!supabase) {
    try { return JSON.parse(localStorage.getItem(key) ?? '[]') as ChatMessage[] } catch { return [] }
  }
  const { data, error } = await supabase
    .from('room_chat')
    .select('*')
    .eq('room_id', room.id)
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw new Error(error.message)
  return (data ?? []).map((r: any) => ({
    id: r.id,
    roomId: r.room_id,
    senderId: r.sender_id,
    senderName: r.sender_name,
    message: r.message,
    createdAt: r.created_at
  }))
}

export async function sendRoomChat(room: Room, player: Player, message: string): Promise<ChatMessage> {
  const clean = message.trim()
  if (!clean) throw new Error('Type a message first.')
  if (clean.length > 500) throw new Error('Keep chat messages under 500 characters.')

  if (!supabase) {
    const key = `game-night-chat-${room.code}`
    const current = await listRoomChat(room)
    const next: ChatMessage = {
      id: crypto.randomUUID(),
      roomId: room.id,
      senderId: player.id,
      senderName: player.name,
      message: clean,
      createdAt: new Date().toISOString()
    }
    localStorage.setItem(key, JSON.stringify([...current, next].slice(-100)))
    return next
  }

  const user = await ensureGuestSession()
  const { data, error } = await supabase
    .from('room_chat')
    .insert({ room_id: room.id, sender_id: user.id, sender_name: player.name, message: clean })
    .select('*')
    .single()
  if (error) throw new Error(error.message)
  return {
    id: data.id,
    roomId: data.room_id,
    senderId: data.sender_id,
    senderName: data.sender_name,
    message: data.message,
    createdAt: data.created_at
  }
}

export function subscribeToRoomChat(room: Room, onChange: () => void) {
  if (!supabase) return () => undefined
  const client = supabase
  const channel = client
    .channel(`room-chat:${room.id}:${crypto.randomUUID()}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'room_chat', filter: `room_id=eq.${room.id}` }, onChange)
  void channel.subscribe()
  return () => { void client.removeChannel(channel) }
}
