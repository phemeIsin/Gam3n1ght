import { CircleHelp, Clock3, Contact2, CreditCard, Crown, Hash, Hand, Palette, Search, Shapes, Shuffle, Sparkles, Timer, Trophy, UsersRound } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Game } from '../types'

export function GameIllustration({ game }: { game: Game }) {
  const iconByKey: Record<string, ReactNode> = {
    cards: <CreditCard aria-hidden="true" />,
    counting: <Hash aria-hidden="true" />,
    mirror: <Shuffle aria-hidden="true" />,
    race3: <Trophy aria-hidden="true" />,
    sketch: <Palette aria-hidden="true" />,
    memory: <Palette aria-hidden="true" />,
    search: <Search aria-hidden="true" />,
    leader: <Crown aria-hidden="true" />,
    target: <CircleHelp aria-hidden="true" />,
    timer: <Timer aria-hidden="true" />,
    race5: <Trophy aria-hidden="true" />,
    wrong: <Sparkles aria-hidden="true" />,
    contact: <Contact2 aria-hidden="true" />,
    cup: <Hand aria-hidden="true" />,
    garbage: <CreditCard aria-hidden="true" />,
    pressure: <Shapes aria-hidden="true" />,
    default: <UsersRound aria-hidden="true" />,
  }

  const icon = iconByKey[game.animationKey] ?? iconByKey.default
  return (
    <div className={`game-illustration ${game.animationKey}`} role="img" aria-label={`${game.name} illustration`}>
      <span className="orb orb-a" />
      <span className="orb orb-b" />
      <div className="icon-tile">
        {icon}
        <span className="icon-fallback" aria-hidden="true">✦</span>
      </div>
      <div className="float-card card-a" />
      <div className="float-card card-b" />
    </div>
  )
}
