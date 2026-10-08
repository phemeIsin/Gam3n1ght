import { Crown, Minus, Plus, Trophy } from 'lucide-react'
import type { Player } from '../types'
import { sound } from '../lib/sound'
import { AvatarBadge } from './AvatarBadge'

export function Scoreboard({
  players,
  hostId,
  onChange,
  readOnly = false,
  targetScore
}: {
  players: Player[]
  hostId?: string
  onChange?: (playerId: string, delta: number) => void
  readOnly?: boolean
  targetScore?: number
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score)

  const handleScoreChange = (playerId: string, delta: number) => {
    if (delta > 0) {
      sound.playScore()
    } else {
      sound.playTap()
    }
    onChange?.(playerId, delta)
  }

  return (
    <div className="scoreboard">
      {targetScore ? (
        <div className="target-strip">
          <Trophy size={14} /> First to <strong>{targetScore}</strong> points
        </div>
      ) : null}

      {sorted.map((p, i) => (
        <div className="score-row" key={p.id}>
          <div className="rank">
            {i === 0 && p.score > 0 ? (
              <Crown size={15} color="#facc15" />
            ) : (
              <span>{i + 1}</span>
            )}
          </div>

          <AvatarBadge avatar={p.avatar} size="sm" />

          <div className="player-name">
            <div className="player-name-line">
              <strong>{p.name}</strong>
              {p.id === hostId ? <span className="host-tag">HOST</span> : null}
            </div>
            <span className="score-track">
              <i
                style={{
                  width: targetScore
                    ? `${Math.min(100, (p.score / targetScore) * 100)}%`
                    : undefined
                }}
              />
            </span>
          </div>

          {!readOnly && onChange ? (
            <div className="score-controls">
              <button
                type="button"
                className="icon-button"
                onClick={() => handleScoreChange(p.id, -1)}
                disabled={p.score <= 0}
                aria-label="Decrease score"
              >
                <Minus size={13} />
              </button>
              <b>{p.score}</b>
              <button
                type="button"
                className="icon-button"
                onClick={() => handleScoreChange(p.id, 1)}
                aria-label="Increase score"
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <b className="score-value">{p.score}</b>
          )}
        </div>
      ))}

      {!players.length && <div className="empty">No players yet.</div>}
    </div>
  )
}
