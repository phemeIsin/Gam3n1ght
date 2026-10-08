import type { Game, Player, RoomSnapshot } from '../types'

const PLAYER_KEY = 'game-night-player-v2'
const CUSTOM_GAMES_KEY = 'game-night-custom-games-v2'

export function getPlayer(): Player | null {
  try { const raw = localStorage.getItem(PLAYER_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}

export function savePlayer(player: Player) { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)) }

export const DEFAULT_AVATARS = ['🦊', '🦁', '🐼', '🐯', '🚀', '⚡', '🎮', '👾', '🎨', '🎲', '🍕', '👑']

export function makePlayer(name: string, avatar?: string): Player {
  const chosenAvatar = avatar || DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)]
  return { id: crypto.randomUUID(), name: name.trim(), joinedAt: new Date().toISOString(), score: 0, avatar: chosenAvatar }
}

export function loadCustomGames(): Game[] {
  try { const raw = localStorage.getItem(CUSTOM_GAMES_KEY); return raw ? JSON.parse(raw) : [] } catch { return [] }
}

export function saveCustomGames(games: Game[]) { localStorage.setItem(CUSTOM_GAMES_KEY, JSON.stringify(games)) }

export function mergeGames(defaults: Game[], customs: Game[]) {
  const map = new Map(defaults.map(g => [g.id, g])); customs.forEach(g => map.set(g.id, g)); return [...map.values()]
}

export function saveDemoSnapshot(snapshot: RoomSnapshot) {
  localStorage.setItem(`game-night-room-${snapshot.room.code}`, JSON.stringify(snapshot))
}

export function getDemoSnapshot(code: string): RoomSnapshot | null {
  try { const raw = localStorage.getItem(`game-night-room-${code.toUpperCase()}`); return raw ? JSON.parse(raw) : null } catch { return null }
}
