import { useMemo } from 'react'
import type { Game } from '../types'
import { GameIllustration } from './GameIllustration'

interface HeroBackgroundProps {
  games: Game[]
  reducedEffects?: boolean
}

export function HeroBackground({ games, reducedEffects = false }: HeroBackgroundProps) {
  // Slices of games duplicated for smooth endless slow drift
  const rowOneGames = useMemo(() => {
    const list = games.length ? games : []
    if (!list.length) return []
    return [...list, ...list, ...list]
  }, [games])

  const rowTwoGames = useMemo(() => {
    const list = games.length ? [...games].reverse() : []
    if (!list.length) return []
    return [...list, ...list, ...list]
  }, [games])

  return (
    <div
      className={`hero-backdrop-container ${reducedEffects ? 'reduced-effects' : ''}`}
      aria-hidden="true"
    >
      {/* Gentle, calm ambient glowing orbs */}
      <div className="hero-ambient-orbs">
        <div className="hero-orb hero-orb-a" />
        <div className="hero-orb hero-orb-b" />
        <div className="hero-orb hero-orb-c" />
      </div>

      {/* Tilted Marquee Collage */}
      <div className="hero-collage-perspective">
        <div className="hero-collage-angled">
          {/* Row 1: Forward Marquee (slow, calm drift) */}
          <div className="marquee-wrapper">
            <div className="marquee-content animate-marquee-x">
              {rowOneGames.map((game, idx) => (
                <div key={`r1-${game.id}-${idx}`} className="hero-mini-card">
                  <div className="mini-card-art">
                    <GameIllustration game={game} />
                  </div>
                  <div className="mini-card-footer">
                    <span className="mini-card-title">{game.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Reverse Marquee (slow, calm drift) */}
          <div className="marquee-wrapper">
            <div className="marquee-content animate-marquee-x-reverse">
              {rowTwoGames.map((game, idx) => (
                <div key={`r2-${game.id}-${idx}`} className="hero-mini-card">
                  <div className="mini-card-art">
                    <GameIllustration game={game} />
                  </div>
                  <div className="mini-card-footer">
                    <span className="mini-card-title">{game.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Center spotlight gradient to keep typography crisp and readable */}
      <div className="hero-center-mask" />
    </div>
  )
}
