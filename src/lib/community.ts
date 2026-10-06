import type { Game, GameKind } from '../types'
import { ensureGuestSession, supabase } from './supabase'

type SuggestionInput = {
  name: string
  shortDescription: string
  description: string
  instructions: string[]
  exampleUrl?: string
  scoreMode: Game['scoreMode']
  behavior: GameKind
  targetScore?: number
  minPlayers?: number
  supportsTeams?: boolean
  tags: string[]
  notes?: string
  submitterName: string
  submitterEmail?: string
}

export type GameSuggestion = SuggestionInput & {
  id: string
  status: 'pending' | 'approved' | 'declined'
  adminNote?: string
  createdAt: string
  reviewedAt?: string
}

export type ContactMessage = {
  id: string
  name: string
  email?: string
  category: 'bug' | 'complaint' | 'suggestion' | 'partnership' | 'other'
  message: string
  status: 'open' | 'resolved'
  createdAt: string
  resolvedAt?: string
}

export type AdminUsage = {
  totalGames: number
  pendingSuggestions: number
  totalSuggestions: number
  openMessages: number
  totalRooms: number
  roomsLast24h: number
  playersLast24h: number
  recentRooms: Array<{ code: string; gameId: string; status: string; createdAt: string; playerCount: number }>
  topGames: Array<{ gameId: string; rooms: number }>
}

const suggestionKey = 'game-night:suggestions'
const contactKey = 'game-night:contact'

function localRead<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[] } catch { return [] }
}
function localWrite<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)) }

export async function submitGameSuggestion(input: SuggestionInput) {
  if (!supabase) {
    const item: GameSuggestion = { ...input, id: crypto.randomUUID(), status: 'pending', createdAt: new Date().toISOString() }
    localWrite(suggestionKey, [item, ...localRead<GameSuggestion>(suggestionKey)])
    return item
  }
  const user = await ensureGuestSession()
  const { error } = await supabase.from('game_suggestions').insert({
    submitter_id: user.id,
    submitter_name: input.submitterName.trim(),
    submitter_email: input.submitterEmail?.trim() || null,
    name: input.name.trim(),
    short_description: input.shortDescription.trim(),
    description: input.description.trim(),
    instructions: input.instructions,
    example_url: input.exampleUrl?.trim() || null,
    score_mode: input.scoreMode,
    game_kind: input.behavior,
    target_score: input.targetScore ?? null,
    min_players: input.minPlayers ?? 2,
    supports_teams: input.supportsTeams ?? false,
    tags: input.tags,
    notes: input.notes?.trim() || null,
  })
  if (error) throw new Error(error.message)
  return { ...input, id: crypto.randomUUID(), status: 'pending' as const, createdAt: new Date().toISOString() }
}

export async function submitContactMessage(input: Omit<ContactMessage,'id'|'status'|'createdAt'|'resolvedAt'>) {
  if (!supabase) {
    const item: ContactMessage = { ...input, id: crypto.randomUUID(), status: 'open', createdAt: new Date().toISOString() }
    localWrite(contactKey, [item, ...localRead<ContactMessage>(contactKey)])
    return item
  }
  const user = await ensureGuestSession()
  const { error } = await supabase.from('contact_messages').insert({
    sender_id: user.id,
    name: input.name.trim(),
    email: input.email?.trim() || null,
    category: input.category,
    message: input.message.trim(),
  })
  if (error) throw new Error(error.message)
  return { ...input, id: crypto.randomUUID(), status: 'open' as const, createdAt: new Date().toISOString() }
}

export async function listGameSuggestions(): Promise<GameSuggestion[]> {
  if (!supabase) return localRead<GameSuggestion>(suggestionKey)
  const { data, error } = await supabase.from('game_suggestions').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapSuggestion)
}

export async function listContactMessages(): Promise<ContactMessage[]> {
  if (!supabase) return localRead<ContactMessage>(contactKey)
  const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapContact)
}

export async function reviewGameSuggestion(id: string, status: 'approved' | 'declined', adminNote?: string) {
  if (!supabase) {
    const next = localRead<GameSuggestion>(suggestionKey).map(item => item.id === id ? { ...item, status, adminNote, reviewedAt: new Date().toISOString() } : item)
    localWrite(suggestionKey, next)
    return
  }
  const { error } = await supabase.from('game_suggestions').update({ status, admin_note: adminNote?.trim() || null, reviewed_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function resolveContactMessage(id: string) {
  if (!supabase) {
    localWrite(contactKey, localRead<ContactMessage>(contactKey).map(item => item.id === id ? { ...item, status: 'resolved', resolvedAt: new Date().toISOString() } : item))
    return
  }
  const { error } = await supabase.from('contact_messages').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getAdminUsage(): Promise<AdminUsage> {
  if (!supabase) {
    const suggestions = localRead<GameSuggestion>(suggestionKey)
    const contacts = localRead<ContactMessage>(contactKey)
    return {
      totalGames: 16,
      pendingSuggestions: suggestions.filter(s => s.status === 'pending').length,
      totalSuggestions: suggestions.length,
      openMessages: contacts.filter(c => c.status === 'open').length,
      totalRooms: 0,
      roomsLast24h: 0,
      playersLast24h: 0,
      recentRooms: [],
      topGames: [],
    }
  }
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const [games, suggestions, contacts, rooms, recentCount, recentRooms, playerRows] = await Promise.all([
    supabase.from('games').select('id', { count: 'exact', head: true }),
    supabase.from('game_suggestions').select('id,status', { count: 'exact' }),
    supabase.from('contact_messages').select('id,status', { count: 'exact' }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).gte('created_at', since),
    supabase.from('rooms').select('code,game_id,status,created_at,room_players(count)').order('created_at', { ascending: false }).limit(12),
    supabase.from('room_players').select('created_at').gte('created_at', since),
  ])
  for (const r of [games, suggestions, contacts, rooms, recentCount, recentRooms, playerRows]) if (r.error) throw new Error(r.error.message)
  const suggestionRows = suggestions.data ?? []
  const contactRows = contacts.data ?? []
  const recent = (recentRooms.data ?? []).map((row: any) => ({ code: row.code, gameId: row.game_id, status: row.status, createdAt: row.created_at, playerCount: Array.isArray(row.room_players) ? Number(row.room_players[0]?.count ?? 0) : 0 }))
  const sinceRooms = recentCount.count ?? 0
  const gameCounts = recent.reduce<Record<string, number>>((acc: Record<string, number>, row: { gameId: string }) => { acc[row.gameId] = (acc[row.gameId] ?? 0) + 1; return acc }, {})
  return {
    totalGames: games.count ?? 0,
    pendingSuggestions: suggestionRows.filter((s: any) => s.status === 'pending').length,
    totalSuggestions: suggestions.count ?? suggestionRows.length,
    openMessages: contactRows.filter((m: any) => m.status === 'open').length,
    totalRooms: rooms.count ?? 0,
    roomsLast24h: sinceRooms,
    playersLast24h: playerRows.data?.length ?? 0,
    recentRooms: recent,
    topGames: Object.entries(gameCounts).map(([gameId, roomCount]) => ({ gameId, rooms: Number(roomCount) })).sort((a,b) => b.rooms-a.rooms),
  }
}

function mapSuggestion(r: any): GameSuggestion {
  return {
    id: r.id,
    name: r.name,
    shortDescription: r.short_description,
    description: r.description,
    instructions: r.instructions ?? [],
    exampleUrl: r.example_url ?? undefined,
    scoreMode: r.score_mode ?? 'points',
    behavior: (r.game_kind ?? 'race-5') as GameKind,
    targetScore: r.target_score ?? undefined,
    minPlayers: r.min_players ?? 2,
    supportsTeams: r.supports_teams ?? false,
    tags: r.tags ?? [],
    notes: r.notes ?? undefined,
    submitterName: r.submitter_name,
    submitterEmail: r.submitter_email ?? undefined,
    status: r.status,
    adminNote: r.admin_note ?? undefined,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at ?? undefined,
  }
}
function mapContact(r: any): ContactMessage {
  return { id: r.id, name: r.name, email: r.email ?? undefined, category: r.category, message: r.message, status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at ?? undefined }
}
