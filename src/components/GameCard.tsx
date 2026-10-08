import { ArrowRight, ExternalLink, Play, Sparkles, Users } from 'lucide-react'
import type { Game } from '../types'
import { GameIllustration } from './GameIllustration'
import { sound } from '../lib/sound'

interface GameCardProps {
  game: Game
  onOpen: () => void
  onQuickPlay?: (game: Game) => void
}

export function GameCard({ game, onOpen, onQuickPlay }: GameCardProps) {
  return (
    <article className="game-card theme-dark-surface group" onClick={() => { sound.playTap(); onOpen() }}>
      <div className="illustration-box">
        <GameIllustration game={game} />
        {game.isSoloFriendly ? (
          <span className="badge-solo">
            <Sparkles size={11} /> Solo Ready
          </span>
        ) : null}
      </div>

      <div className="game-card-body">
        <div className="game-card-meta">
          <span>
            <Users size={13} /> {game.minPlayers ?? 2}+ players
          </span>
          {game.scoreMode ? (
            <span className="badge-mode">{game.scoreMode}</span>
          ) : null}
        </div>

        <h3>{game.name}</h3>
        <p>{game.shortDescription}</p>

        <div className="tags">
          {game.tags.slice(0, 3).map(t => (
            <span key={t}>#{t}</span>
          ))}
        </div>

        <div className="card-actions" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            className="button primary gnc-game-press"
            onClick={() => {
              sound.playTap()
              if (onQuickPlay) {
                onQuickPlay(game)
              } else {
                onOpen()
              }
            }}
          >
            <Play size={14} fill="currentColor" /> Play Now
          </button>

          <button
            type="button"
            className="button ghost compact"
            onClick={() => {
              sound.playTap()
              onOpen()
            }}
            title="Rules and info"
          >
            Rules
          </button>

          {game.exampleUrl ? (
            <a
              className="button ghost compact icon-only"
              href={game.exampleUrl}
              target="_blank"
              rel="noreferrer"
              title="Watch video reel"
            >
              <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
