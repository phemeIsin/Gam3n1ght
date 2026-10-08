import { useState, useEffect } from 'react'
import { sound } from '../lib/sound'

export type FloatingEmoji = {
  id: string
  emoji: string
  x: number // percentage 10% to 90%
}

interface ReactionOverlayProps {
  onReact?: (emoji: string) => void
  incomingReaction?: { emoji: string; id: string } | null
}

const EMOJIS = ['🔥', '👏', '😂', '👑', '⚡', '🎯']

export function ReactionOverlay({ onReact, incomingReaction }: ReactionOverlayProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([])

  const spawnEmoji = (emoji: string) => {
    sound.playReaction()
    const id = `${Date.now()}-${Math.random()}`
    const x = Math.floor(Math.random() * 60) + 20 // 20% to 80%
    setFloating(prev => [...prev.slice(-15), { id, emoji, x }])
    if (onReact) {
      onReact(emoji)
    }
  }

  useEffect(() => {
    if (incomingReaction) {
      sound.playReaction()
      const x = Math.floor(Math.random() * 60) + 20
      setFloating(prev => [...prev.slice(-15), { id: incomingReaction.id, emoji: incomingReaction.emoji, x }])
    }
  }, [incomingReaction])

  const handleAnimationEnd = (id: string) => {
    setFloating(prev => prev.filter(item => item.id !== id))
  }

  return (
    <>
      {/* Floating particles stage */}
      <div className="reaction-stage" aria-hidden="true">
        {floating.map(item => (
          <span
            key={item.id}
            className="floating-emoji"
            style={{ left: `${item.x}%` }}
            onAnimationEnd={() => handleAnimationEnd(item.id)}
          >
            {item.emoji}
          </span>
        ))}
      </div>

      {/* Floating reaction dock */}
      <div className="reaction-dock">
        <span className="reaction-dock-label">Cheer</span>
        <div className="reaction-buttons">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              className="reaction-btn"
              onClick={() => spawnEmoji(emoji)}
              aria-label={`Send reaction ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
