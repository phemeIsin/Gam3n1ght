import type { ReactNode } from 'react'
import {
  Award,
  Crown,
  Eye,
  Flag,
  Flame,
  Gauge,
  Hash,
  HelpCircle,
  Hourglass,
  Layers,
  Palette,
  Radio,
  Search,
  Shuffle,
  Sparkles,
  Target,
  Timer,
  Trophy,
  UsersRound,
  Zap
} from 'lucide-react'
import type { Game } from '../types'

interface VisualTheme {
  icon: ReactNode
  badgeText: string
  gradient: string
  accentColor: string
  pattern: 'cards' | 'target' | 'dots' | 'pulse' | 'sparks' | 'grid'
}

export function GameIllustration({ game }: { game: Game }) {
  const visualThemes: Record<string, VisualTheme> = {
    cards: {
      icon: <Layers size={28} />,
      badgeText: 'UNO TABLE',
      gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
      accentColor: '#fbbf24',
      pattern: 'cards'
    },
    counting: {
      icon: <Hash size={28} />,
      badgeText: 'TRAP COUNT',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
      accentColor: '#38bdf8',
      pattern: 'grid'
    },
    mirror: {
      icon: <Shuffle size={28} />,
      badgeText: 'BE OPPOSITE',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #5b21b6 100%)',
      accentColor: '#c4b5fd',
      pattern: 'pulse'
    },
    race3: {
      icon: <Trophy size={28} />,
      badgeText: 'RACE TO 3',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
      accentColor: '#fde68a',
      pattern: 'sparks'
    },
    sketch: {
      icon: <Palette size={28} />,
      badgeText: 'DRAW & GUESS',
      gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 50%, #9d174d 100%)',
      accentColor: '#fbcfe8',
      pattern: 'dots'
    },
    memory: {
      icon: <Eye size={28} />,
      badgeText: 'MEMORY STUDY',
      gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #3730a3 100%)',
      accentColor: '#a5b4fc',
      pattern: 'dots'
    },
    search: {
      icon: <Search size={28} />,
      badgeText: 'SPOT NUMBER',
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 50%, #064e3b 100%)',
      accentColor: '#6ee7b7',
      pattern: 'target'
    },
    leader: {
      icon: <Crown size={28} />,
      badgeText: 'SPOT THE LEADER',
      gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #78350f 100%)',
      accentColor: '#fde68a',
      pattern: 'sparks'
    },
    target: {
      icon: <Target size={28} />,
      badgeText: 'TARGET GUESS',
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #1e3a8a 100%)',
      accentColor: '#7dd3fc',
      pattern: 'target'
    },
    timer: {
      icon: <Timer size={28} />,
      badgeText: 'EXACT 10 SEC',
      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #7c2d12 100%)',
      accentColor: '#fdba74',
      pattern: 'pulse'
    },
    race5: {
      icon: <Flag size={28} />,
      badgeText: 'FIRST TO 5',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #7f1d1d 100%)',
      accentColor: '#fca5a5',
      pattern: 'sparks'
    },
    wrong: {
      icon: <Sparkles size={28} />,
      badgeText: 'WRONG ONLY',
      gradient: 'linear-gradient(135deg, #9333ea 0%, #7e22ce 50%, #581c87 100%)',
      accentColor: '#e9d5ff',
      pattern: 'sparks'
    },
    contact: {
      icon: <Radio size={28} />,
      badgeText: 'WORD CONTACT',
      gradient: 'linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #115e59 100%)',
      accentColor: '#5eead4',
      pattern: 'pulse'
    },
    cup: {
      icon: <Award size={28} />,
      badgeText: 'CUP REFLEX',
      gradient: 'linear-gradient(135deg, #ca8a04 0%, #a16207 50%, #713f12 100%)',
      accentColor: '#fef08a',
      pattern: 'sparks'
    },
    garbage: {
      icon: <Layers size={28} />,
      badgeText: 'GARBAGE DECK',
      gradient: 'linear-gradient(135deg, #475569 0%, #334155 50%, #1e293b 100%)',
      accentColor: '#94a3b8',
      pattern: 'cards'
    },
    pressure: {
      icon: <Gauge size={28} />,
      badgeText: 'PRESSURE TRACK',
      gradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 50%, #881337 100%)',
      accentColor: '#fda4af',
      pattern: 'pulse'
    },
    default: {
      icon: <UsersRound size={28} />,
      badgeText: 'PARTY TABLE',
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)',
      accentColor: '#c4b5fd',
      pattern: 'pulse'
    }
  }

  const theme = visualThemes[game.animationKey] ?? visualThemes.default

  return (
    <div
      className={`game-illustration-container ${game.animationKey}`}
      role="img"
      aria-label={`${game.name} illustration`}
      style={{ background: theme.gradient }}
    >
      {/* Subtle geometric background motif */}
      <div className={`illustration-pattern pattern-${theme.pattern}`} aria-hidden="true">
        {theme.pattern === 'target' && (
          <div className="pattern-rings">
            <span className="ring ring-1" />
            <span className="ring ring-2" />
            <span className="ring ring-3" />
          </div>
        )}
        {theme.pattern === 'cards' && (
          <div className="pattern-cards-duo">
            <div className="mini-card card-under" />
            <div className="mini-card card-over" />
          </div>
        )}
      </div>

      {/* Radiant ambient glow */}
      <div
        className="illustration-glow"
        style={{
          background: `radial-gradient(circle, ${theme.accentColor}33 0%, transparent 70%)`
        }}
        aria-hidden="true"
      />

      {/* Main modern icon badge */}
      <div className="illustration-center-badge">
        <div
          className="illustration-icon-wrapper"
          style={{
            borderColor: `${theme.accentColor}66`,
            color: '#ffffff'
          }}
        >
          {theme.icon}
        </div>
        <span
          className="illustration-badge-tag"
          style={{
            color: theme.accentColor,
            borderColor: `${theme.accentColor}44`
          }}
        >
          {theme.badgeText}
        </span>
      </div>
    </div>
  )
}
