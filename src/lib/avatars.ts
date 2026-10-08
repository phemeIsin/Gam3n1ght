export type AvatarPersona = {
  id: string
  name: string
  emoji: string
  category: 'heroes' | 'creatures' | 'party'
  gradient: string
  border: string
  accent: string
}

export const AVATAR_PERSONAS: AvatarPersona[] = [
  // Arcade & Retro Heroes
  { id: 'arcade-knight', name: 'Pixel Knight', emoji: '⚔️', category: 'heroes', gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', border: '#60a5fa', accent: '#93c5fd' },
  { id: 'retro-bot', name: 'Cyber Bot', emoji: '🤖', category: 'heroes', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', border: '#22d3ee', accent: '#67e8f9' },
  { id: 'space-pilot', name: 'Star Pilot', emoji: '🚀', category: 'heroes', gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', border: '#a78bfa', accent: '#c4b5fd' },
  { id: 'neon-ninja', name: 'Shadow Ninja', emoji: '🥷', category: 'heroes', gradient: 'linear-gradient(135deg, #334155, #0f172a)', border: '#64748b', accent: '#cbd5e1' },
  { id: 'mage', name: 'Arcane Mage', emoji: '🔮', category: 'heroes', gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)', border: '#c084fc', accent: '#e9d5ff' },
  { id: 'ranger', name: 'Bullseye Ranger', emoji: '🎯', category: 'heroes', gradient: 'linear-gradient(135deg, #10b981, #047857)', border: '#34d399', accent: '#a7f3d0' },

  // Party Creatures (Clean vector-style animal personas)
  { id: 'swift-fox', name: 'Swift Fox', emoji: '🦊', category: 'creatures', gradient: 'linear-gradient(135deg, #f97316, #c2410c)', border: '#fb923c', accent: '#fdba74' },
  { id: 'disco-lion', name: 'Disco Lion', emoji: '🦁', category: 'creatures', gradient: 'linear-gradient(135deg, #f59e0b, #b45309)', border: '#fbbf24', accent: '#fde68a' },
  { id: 'zen-panda', name: 'Zen Panda', emoji: '🐼', category: 'creatures', gradient: 'linear-gradient(135deg, #475569, #1e293b)', border: '#94a3b8', accent: '#f1f5f9' },
  { id: 'tiger', name: 'Thunder Tiger', emoji: '🐯', category: 'creatures', gradient: 'linear-gradient(135deg, #ea580c, #9a3412)', border: '#f97316', accent: '#fed7aa' },
  { id: 'owl', name: 'Wise Owl', emoji: '🦉', category: 'creatures', gradient: 'linear-gradient(135deg, #78350f, #451a03)', border: '#b45309', accent: '#fde68a' },
  { id: 'shark', name: 'Speed Shark', emoji: '🦈', category: 'creatures', gradient: 'linear-gradient(135deg, #0284c7, #0369a1)', border: '#38bdf8', accent: '#bae6fd' },

  // Classic Party & Game Emblems
  { id: 'party-crown', name: 'Gam3n1ght King', emoji: '👑', category: 'party', gradient: 'linear-gradient(135deg, #eab308, #ca8a04)', border: '#facc15', accent: '#fef08a' },
  { id: 'fire-hype', name: 'Hype Flame', emoji: '🔥', category: 'party', gradient: 'linear-gradient(135deg, #ef4444, #b91c1c)', border: '#f87171', accent: '#fecaca' },
  { id: 'dice-roller', name: 'High Roller', emoji: '🎲', category: 'party', gradient: 'linear-gradient(135deg, #ec4899, #be185d)', border: '#f472b6', accent: '#fbcfe8' },
  { id: 'gamepad-master', name: 'Joypad Pro', emoji: '🎮', category: 'party', gradient: 'linear-gradient(135deg, #6366f1, #4338ca)', border: '#818cf8', accent: '#c7d2fe' },
  { id: 'artist', name: 'Sketch Master', emoji: '🎨', category: 'party', gradient: 'linear-gradient(135deg, #14b8a6, #0f766e)', border: '#2dd4bf', accent: '#99f6e4' },
  { id: 'pizza-champ', name: 'Party Slice', emoji: '🍕', category: 'party', gradient: 'linear-gradient(135deg, #d97706, #b45309)', border: '#f59e0b', accent: '#fed7aa' },
]

export const DEFAULT_AVATAR_ID = 'swift-fox'

export function getAvatarById(idOrEmoji?: string): AvatarPersona {
  if (!idOrEmoji) return AVATAR_PERSONAS[0]
  const found = AVATAR_PERSONAS.find(a => a.id === idOrEmoji || a.emoji === idOrEmoji)
  if (found) return found
  // If it's a raw emoji string, generate a graceful persona
  return {
    id: 'custom',
    name: 'Player',
    emoji: idOrEmoji,
    category: 'party',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
    border: '#a78bfa',
    accent: '#c4b5fd'
  }
}
