export type GameKind =
  | 'uno'
  | 'forbidden-number'
  | 'opposite-action'
  | 'race-3'
  | 'sketch'
  | 'find-number'
  | 'guess-leader'
  | 'guess-number'
  | 'ten-seconds'
  | 'memory-drawing'
  | 'race-5'
  | 'wrong-answers'
  | 'contact'
  | 'hsk-cup'
  | 'garbage'
  | 'pressure'
  | 'online'

export type ScoreMode = 'points' | 'race' | 'manual' | 'uno'

export type Prompt = {
  id: string
  gameId: string
  prompt: string
  category?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export type Game = {
  id: string
  slug: string
  behavior?: GameKind
  name: string
  shortDescription: string
  description: string
  instructions: string[]
  exampleUrl?: string
  scoreMode: ScoreMode
  targetScore?: number
  minPlayers?: number
  supportsTeams?: boolean
  animationKey: string
  tags: string[]
  isSoloFriendly?: boolean
  playMode?: 'physical' | 'online'
  externalProvider?: string
  externalLaunchUrl?: string
  externalGameUrl?: string
}

export type Player = {
  id: string
  name: string
  joinedAt: string
  score: number
  avatar?: string
}

export type RoomStatus = 'lobby' | 'playing' | 'finished'

export type RoomReaction = {
  id: string
  emoji: string
  sender: string
  timestamp: number
}

export type RoomState = {
  round: number
  turnIndex: number
  activePrompt?: Prompt | null
  winnerId?: string | null
  forbiddenNumber?: number
  targetScore?: number
  gameMode?: string
  hostNote?: string
  activeGameId?: string
  soloMode?: boolean
  reactions?: RoomReaction[]
}

export type Room = {
  id: string
  code: string
  gameId: string
  hostId: string
  status: RoomStatus
  state: RoomState
  createdAt: string
  roomType?: 'physical' | 'online'
  roomName?: string
  externalRoomUrl?: string
}

export type ActiveRoomSummary = {
  id: string
  code: string
  gameId: string
  gameName: string
  gameSlug: string
  roomType: 'physical' | 'online'
  roomName: string
  status: RoomStatus
  playerCount: number
  createdAt: string
  expiresAt: string
  externalRoomUrl?: string
}

export type ChatMessage = {
  id: string
  roomId: string
  senderId: string
  senderName: string
  message: string
  createdAt: string
}

export type RoomSnapshot = { room: Room; players: Player[] }
