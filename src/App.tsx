import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  CircleX,
  Clipboard,
  Clock3,
  Copy,
  Crown,
  Download,
  DoorOpen,
  ExternalLink,
  Flame,
  Gamepad2,
  Handshake,
  Hash,
  Inbox,
  Info,
  Lightbulb,
  LogIn,
  Menu,
  MessageCircle,
  MessageSquareText,
  Moon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Share2,
  Sparkles,
  Sun,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  X
} from 'lucide-react'
import type { ActiveRoomSummary, ChatMessage, Game, GameKind, Player, Prompt, RoomSnapshot } from './types'
import { defaultGames, defaultPrompts } from './games/catalog'
import { loadGames, loadPrompts, saveGame, savePrompt, uploadAnimation } from './lib/content'
import {
  getAdminUsage,
  listContactMessages,
  listGameSuggestions,
  resolveContactMessage,
  reviewGameSuggestion,
  submitContactMessage,
  submitGameSuggestion,
  type AdminUsage,
  type ContactMessage,
  type GameSuggestion
} from './lib/community'
import { changeScore, createRoom, endRoom, getRoom, joinRoom, listActiveRooms, listRoomChat, sendRoomChat, setExternalRoomUrl, subscribeToActiveRooms, subscribeToRoom, subscribeToRoomChat, updateRoomState } from './lib/rooms'
import { DEFAULT_AVATARS, getPlayer, makePlayer, savePlayer } from './lib/storage'
import { getAuthSession, isCurrentUserAdmin, isSupabaseConfigured, signInWithPassword, signOut } from './lib/supabase'
import { sound } from './lib/sound'
import { DrawingBoard } from './components/DrawingBoard'
import { GameCard } from './components/GameCard'
import { GameIllustration } from './components/GameIllustration'
import { Scoreboard } from './components/Scoreboard'
import { HeroBackground } from './components/HeroBackground'
import { ReactionOverlay } from './components/ReactionOverlay'
import { HowItWorksPage } from './pages/HowItWorksPage'
import './styles.css'

function AppShell({ children }: { children: ReactNode }) {
  const [installAvailable, setInstallAvailable] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('game-night-theme')
    return saved === null ? true : saved === 'dark' // default to dark GNC style
  })
  const [soundOn, setSoundOn] = useState(() => sound.isEnabled())
  const [navJoinCode, setNavJoinCode] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      ;(window as any).__pwaPrompt = e
      setInstallAvailable(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    document.documentElement.classList.toggle('light', !darkMode)
    localStorage.setItem('game-night-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const install = async () => {
    sound.playTap()
    const p = (window as any).__pwaPrompt
    if (!p) return
    await p.prompt()
    setInstallAvailable(false)
  }

  const toggleSound = () => {
    const next = sound.toggle()
    setSoundOn(next)
  }

  const handleHeaderJoin = (e: FormEvent) => {
    e.preventDefault()
    if (navJoinCode.trim().length >= 4) {
      sound.playTap()
      navigate(`/room/${navJoinCode.trim().toUpperCase()}`)
      setNavJoinCode('')
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/" onClick={() => sound.playTap()}>
          <span className="brand-mark">
            <Gamepad2 size={20} />
          </span>
          <span>Gam3n1ght</span>
        </Link>

        <nav className="topbar-nav">
          <Link to="/games" onClick={() => sound.playTap()}>Games</Link>
          <Link to="/how-it-works" onClick={() => sound.playTap()}>How it works</Link>
          <Link to="/rooms" onClick={() => sound.playTap()}>Live Rooms</Link>
          <Link to="/suggest" onClick={() => sound.playTap()}>Suggest a game</Link>
          <Link to="/contact" onClick={() => sound.playTap()}>Contact</Link>
          <Link to="/admin" onClick={() => sound.playTap()}>Creator Studio</Link>
        </nav>

        <div className="topbar-actions">
          {/* Quick Header Join */}
          <form className="header-quick-join" onSubmit={handleHeaderJoin}>
            <input
              maxLength={6}
              value={navJoinCode}
              onChange={e => setNavJoinCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              aria-label="Room code"
            />
            <button type="submit" title="Join room">
              Join
            </button>
          </form>

          {/* Sound Toggle */}
          <button
            type="button"
            className={`action-icon-btn ${soundOn ? 'active' : ''}`}
            onClick={toggleSound}
            aria-label={soundOn ? 'Sound effects on' : 'Sound effects muted'}
            title={soundOn ? 'Sound on' : 'Sound muted'}
          >
            {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            className="action-icon-btn"
            onClick={() => {
              sound.playTap()
              setDarkMode(v => !v)
            }}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            className="action-icon-btn mobile-menu-toggle"
            onClick={() => { sound.playTap(); setMobileMenuOpen(v => !v) }}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            title={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          {/* PWA Install */}
          {installAvailable ? (
            <button
              className="button ghost compact install-link"
              onClick={install}
              title="Install Gam3n1ght as an app"
            >
              <Download size={14} />
              Install
            </button>
          ) : null}

          {/* Connection Status */}
          <div className="status-pill" title={isSupabaseConfigured ? 'Realtime multiplayer connected' : 'Local demo mode active'}>
            <span className={isSupabaseConfigured ? 'live' : 'demo'} />
            {isSupabaseConfigured ? 'Live' : 'Demo'}
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="mobile-menu-panel">
          <Link to="/games" onClick={() => { sound.playTap(); setMobileMenuOpen(false) }}>Games</Link>
          <Link to="/rooms" onClick={() => { sound.playTap(); setMobileMenuOpen(false) }}>Live Rooms</Link>
          <Link to="/how-it-works" onClick={() => { sound.playTap(); setMobileMenuOpen(false) }}>How it works</Link>
          <Link to="/suggest" onClick={() => { sound.playTap(); setMobileMenuOpen(false) }}>Suggest a game</Link>
          <Link to="/contact" onClick={() => { sound.playTap(); setMobileMenuOpen(false) }}>Contact</Link>
          <Link to="/admin" onClick={() => { sound.playTap(); setMobileMenuOpen(false) }}>Creator Studio</Link>
        </div>
      ) : null}

      {children}

      {/* PWA Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <Link to="/" className="mobile-nav-item active" onClick={() => sound.playTap()}>
          <Gamepad2 size={19} /><span>Games</span>
        </Link>
        <Link to="/rooms" className="mobile-nav-item" onClick={() => sound.playTap()}>
          <Wifi size={19} /><span>Live</span>
        </Link>
        <button type="button" className="mobile-nav-item" onClick={() => {
          sound.playTap(); navigate('/?join=1')
          window.setTimeout(() => {
            document.querySelector<HTMLInputElement>('.join-room-expand input')?.focus()
            document.querySelector<HTMLElement>('.join-room-expand')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 80)
        }}>
          <DoorOpen size={19} /><span>Join</span>
        </button>
        <button type="button" className="mobile-nav-item" onClick={toggleSound}>
          {soundOn ? <Volume2 size={19} /> : <VolumeX size={19} />}<span>Audio</span>
        </button>
        <button type="button" className="mobile-nav-item" onClick={() => { sound.playTap(); setDarkMode(v => !v) }}>
          {darkMode ? <Sun size={19} /> : <Moon size={19} />}<span>Theme</span>
        </button>
      </nav>
    </div>
  )
}

function useGameCatalog() {
  const [games, setGames] = useState<Game[]>(defaultGames)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const g = await loadGames()
        if (alive) setGames(g)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  return { games, setGames, loading }
}

function Home() {
  const nav = useNavigate()
  const [searchParams] = useSearchParams()
  const { games } = useGameCatalog()
  const storedPlayer = getPlayer()
  const [name, setName] = useState(storedPlayer?.name ?? '')
  const [avatar, setAvatar] = useState(storedPlayer?.avatar ?? DEFAULT_AVATARS[0])
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [joinCode, setJoinCode] = useState(searchParams.get('join') ?? searchParams.get('room') ?? '')
  const [joinOpen, setJoinOpen] = useState(Boolean(searchParams.get('join') || searchParams.get('room')))
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  function ensurePlayer(): Player | null {
    let finalName = name.trim()
    if (!finalName) {
      // Pick a fun default party nickname if left blank so there's zero friction
      const randomAnimals = ['Koala', 'Fox', 'Tiger', 'Otter', 'Panda', 'Falcon', 'Cheetah']
      finalName = `Player-${randomAnimals[Math.floor(Math.random() * randomAnimals.length)]}`
      setName(finalName)
    }
    const p = getPlayer()
    const next: Player = p
      ? { ...p, name: finalName, avatar }
      : { ...makePlayer(finalName, avatar) }
    savePlayer(next)
    return next
  }

  async function create(game: Game, solo = false) {
    setError('')
    const p = ensurePlayer()
    if (!p) return
    setCreating(true)
    sound.playTap()
    try {
      const { room } = await createRoom(game, p)
      if (solo) {
        // Tag room state as solo mode
        await updateRoomState({ room, players: [p] }, { soloMode: true }, 'playing')
      }
      sound.playJoin()
      nav(`/room/${room.code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create room')
    } finally {
      setCreating(false)
    }
  }

  async function join() {
    setError('')
    const p = ensurePlayer()
    if (!p) return
    const code = joinCode.trim().toUpperCase()
    if (code.length < 4) {
      setError('Enter a valid 4-6 letter room code.')
      return
    }
    sound.playTap()
    try {
      await joinRoom(code, p)
      sound.playJoin()
      nav(`/room/${code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Room not found or expired.')
    }
  }

  // Quick 1-click room creation from hero
  const handleQuickPlay = () => {
    const quickPick = games.find(g => g.slug === 'race-3') ?? games[0]
    if (quickPick) {
      void create(quickPick)
    }
  }

  return (
    <div>
      {/* =========================================================
          HERO SECTION (WITH GNC MOVING MARQUEES & ORBS)
          ========================================================= */}
      <section className="hero-container" id="top">
        {/* Moving Background Marquee & Glowing Orbs */}
        <HeroBackground games={games} />

        <div className="hero-content">
          <div className="hero-pill-badge">
            <Sparkles size={14} /> Party Games · Built for the Room
          </div>

          <h1 className="hero-title">
            Make the Meet fun. Scroll Less,
          <span className="hero-badge-rotated">PLAY MORE</span>
          </h1>

          <div className="hero-features-bar">
            <span>Free to Play</span>
            <span className="dot" />
            <span>No Downloads</span>
            <span className="dot" />
            <span>No Signup Required</span>
            <span className="dot" />
            <span>make the meet fun</span>
          </div>

          {/* Interactive Player Setup & Action Box */}
          <div className="hero-play-box theme-dark-surface">
            <div className="player-name-row">
              <button
                type="button"
                className="avatar-select-btn"
                onClick={() => { sound.playTap(); setAvatarModalOpen(true) }}
                title="Choose your avatar emoji"
                aria-label="Choose avatar"
              >
                {avatar}
              </button>

              <input
                className="name-input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your nickname (e.g. DisCoVar)"
                maxLength={20}
              />
            </div>

            <div className="hero-actions-row">
              <button
                type="button"
                className="button primary big gnc-game-press"
                onClick={handleQuickPlay}
                disabled={creating}
              >
                <Users size={18} />
                <span>Play with Friends</span>
              </button>

              <button
                type="button"
                className="button secondary big gnc-game-press"
                onClick={() => {
                  sound.playTap()
                  setError('')
                  setJoinOpen(v => !v)
                }}
              >
                <DoorOpen size={18} />
                <span>Join a Room</span>
              </button>
              <Link className="button ghost big gnc-game-press" to="/rooms" onClick={() => sound.playTap()}>
                <Wifi size={18} /> <span>Live Rooms</span>
              </Link>
            </div>

            {joinOpen ? (
              <div className="join-room-expand">
                <input
                  autoFocus
                  maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ROOM CODE"
                  onKeyDown={e => { if (e.key === 'Enter') void join() }}
                />
                <button
                  type="button"
                  className="button secondary gnc-game-press"
                  onClick={join}
                >
                  <LogIn size={16} /> Join
                </button>
              </div>
            ) : null}

            {error ? (
              <div className="error">
                <CircleHelp size={15} />
                {error}
              </div>
            ) : null}
          </div>

          <div className="hero-games-cta">
            <div>
              <div className="hero-quick-label">Ready to pick a game?</div>
              <p>Browse the full library, filter by play style, and launch a room from the dedicated Games page.</p>
            </div>
            <Link className="button secondary big gnc-game-press" to="/games" onClick={() => sound.playTap()}>
              <Gamepad2 size={18} /> Browse All Games <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
          COMMUNITY PROMO
          ========================================================= */}
      <section className="community-promo">
        <div className="community-promo-art">
          <MessageCircle size={44} />
        </div>
        <div>
          <div className="eyebrow">GAM3N1GHT X DiSCoVaR</div>
          <h2>Don’t just hear about the next gamenight/event. Be in the room!!!.</h2>
          <p>
Join our WhatsApp community for Game Night updates, new games, event announcements and deals from DisCoVar - a community built around discovering what’s happening and where the good deals are.
          </p>
          <div className="community-promo-actions">
            <a
              className="button primary gnc-game-press"
              href="https://chat.whatsapp.com/Hat53llBovo4gzimIvJPwN"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} /> Join the WA-Community
            </a>
            <Link className="button ghost" to="/suggest" onClick={() => sound.playTap()}>
              <Lightbulb size={16} /> Suggest a Game
            </Link>
            <Link className="button ghost" to="/contact" onClick={() => sound.playTap()}>
              <MessageSquareText size={16} /> Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Avatar Picker Modal */}
      {avatarModalOpen ? (
        <AvatarModal
          currentAvatar={avatar}
          onSelect={av => {
            sound.playTap()
            setAvatar(av)
            const p = getPlayer()
            if (p) savePlayer({ ...p, avatar: av })
            setAvatarModalOpen(false)
          }}
          onClose={() => setAvatarModalOpen(false)}
        />
      ) : null}
    </div>
  )
}

function GamesPage() {
  const nav = useNavigate()
  const { games, loading } = useGameCatalog()
  const storedPlayer = getPlayer()
  const [name, setName] = useState(storedPlayer?.name ?? '')
  const [avatar, setAvatar] = useState(storedPlayer?.avatar ?? DEFAULT_AVATARS[0])
  const [avatarModalOpen, setAvatarModalOpen] = useState(false)
  const [selected, setSelected] = useState<Game | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  const filters = ['All', 'Solo Ready', 'Online', 'Physical', 'Reaction', 'Drawing', 'Cards & Numbers', 'Social']

  const visible = useMemo(() => games.filter(g => {
    const matchesCategory =
      filter === 'All' ||
      (filter === 'Solo Ready' && g.isSoloFriendly === true) ||
      (filter === 'Online' && g.playMode === 'online') ||
      (filter === 'Physical' && g.playMode !== 'online') ||
      (filter === 'Reaction' && g.tags.some(t => t.toLowerCase().includes('reaction') || t.toLowerCase().includes('timing'))) ||
      (filter === 'Drawing' && g.tags.some(t => t.toLowerCase().includes('drawing') || t.toLowerCase().includes('creative'))) ||
      (filter === 'Cards & Numbers' && g.tags.some(t => t.toLowerCase().includes('card') || t.toLowerCase().includes('number') || t.toLowerCase().includes('counting'))) ||
      (filter === 'Social' && g.tags.some(t => t.toLowerCase().includes('social') || t.toLowerCase().includes('party') || t.toLowerCase().includes('group')))
    const matchesQuery = !query || `${g.name} ${g.shortDescription} ${g.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())
    return matchesCategory && matchesQuery
  }), [games, filter, query])

  function ensurePlayer(): Player {
    const finalName = name.trim() || `Player-${['Koala', 'Fox', 'Tiger', 'Otter', 'Panda', 'Falcon', 'Cheetah'][Math.floor(Math.random() * 7)]}`
    setName(finalName)
    const current = getPlayer()
    const player = current ? { ...current, name: finalName, avatar } : makePlayer(finalName, avatar)
    savePlayer(player)
    return player
  }

  async function create(game: Game, solo = false) {
    setError('')
    const player = ensurePlayer()
    setCreating(true)
    sound.playTap()
    try {
      const { room } = await createRoom(game, player)
      if (solo) await updateRoomState({ room, players: [player] }, { soloMode: true }, 'playing')
      sound.playJoin()
      setSelected(null)
      nav(`/room/${room.code}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create room')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="plain-page games-page">
      <header className="page-header">
        <div>
          <div className="hero-pill-badge" style={{ marginBottom: '14px' }}><Gamepad2 size={14} /> THE GAME LIBRARY</div>
          <h1>Pick your game.</h1>
          <p>Browse the full Gam3n1ght library, filter by play style, then create a room when your crew is ready.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link className="button ghost" to="/" onClick={() => sound.playTap()}><ArrowLeft size={16} /> Home</Link>
          <Link className="button secondary" to="/how-it-works" onClick={() => sound.playTap()}><CircleHelp size={16} /> How it works</Link>
        </div>
      </header>

      <section className="games-page-controls theme-dark-surface">
        <div className="player-name-row">
          <button type="button" className="avatar-select-btn" onClick={() => { sound.playTap(); setAvatarModalOpen(true) }} title="Choose your avatar emoji" aria-label="Choose avatar">{avatar}</button>
          <input className="name-input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your nickname" maxLength={20} />
        </div>
        <div className="games-page-stat"><strong>{games.length}</strong><span>games available</span></div>
        <div className="games-page-stat"><strong>{games.filter(g => g.playMode === 'online').length}</strong><span>online options</span></div>
      </section>

      <div className="library-toolbar">
        <div className="search-box">
          <Search size={17} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search games, tags, rules…" />
          {query ? <button type="button" onClick={() => setQuery('')} style={{ border: 'none', background: 'transparent', color: 'inherit', cursor: 'pointer' }}><X size={15} /></button> : null}
        </div>
        <div className="chips">
          {filters.map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => { sound.playTap(); setFilter(f) }}>{f}</button>)}
        </div>
      </div>

      {error ? <div className="error"><CircleHelp size={15} />{error}</div> : null}

      {loading ? (
        <div className="loading-grid">{Array.from({ length: 8 }).map((_, i) => <div className="skeleton" key={i} />)}</div>
      ) : visible.length ? (
        <div className="game-grid">
          {visible.map(game => <GameCard key={game.id} game={game} onOpen={() => setSelected(game)} onQuickPlay={() => void create(game)} />)}
        </div>
      ) : (
        <div className="empty-state"><Search size={24} /><strong>No games match your search.</strong><p>Try a different keyword or reset the filters.</p></div>
      )}

      {selected ? (
        <GameModal game={selected} onClose={() => setSelected(null)} onCreate={() => void create(selected)} onSolo={() => void create(selected, true)} creating={creating} error={error} />
      ) : null}

      {avatarModalOpen ? (
        <AvatarModal currentAvatar={avatar} onSelect={av => { sound.playTap(); setAvatar(av); const p = getPlayer(); if (p) savePlayer({ ...p, avatar: av }); setAvatarModalOpen(false) }} onClose={() => setAvatarModalOpen(false)} />
      ) : null}
    </div>
  )
}

function AvatarModal({
  currentAvatar,
  onSelect,
  onClose
}: {
  currentAvatar: string
  onSelect: (av: string) => void
  onClose: () => void
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: '400px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="eyebrow">CHOOSE AVATAR</div>
        <h2>Pick your character</h2>
        <div className="avatar-grid">
          {DEFAULT_AVATARS.map(av => (
            <button
              key={av}
              type="button"
              className={`avatar-grid-item ${av === currentAvatar ? 'selected' : ''}`}
              onClick={() => onSelect(av)}
            >
              {av}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function GameModal({
  game,
  onClose,
  onCreate,
  onSolo,
  creating,
  error
}: {
  game: Game
  onClose: () => void
  onCreate: () => void
  onSolo: () => void
  creating: boolean
  error: string
}) {
  return (
    <div className="modal-backdrop" onClick={creating ? undefined : onClose}>
      <div className="modal modal-game" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} disabled={creating} aria-label="Close">
          <X size={18} />
        </button>
        <div className="modal-visual">
          <GameIllustration game={game} />
          <div>
            <div className="eyebrow">{game.name}</div>
            <h2>{game.shortDescription}</h2>
            <p>{game.description}</p>
          </div>
        </div>
        {game.playMode === 'online' ? (
          <div className="online-game-note"><Wifi size={16} /><span>This game runs on <strong>{game.externalProvider ?? 'an external game site'}</strong>. Game Night adds the lobby, active-room directory and chat.</span></div>
        ) : null}
        <div className="rule-grid">
          <div>
            <strong>How to play</strong>
            {game.instructions.map((x, i) => (
              <div className="rule" key={x}>
                <span>{i + 1}</span>
                <p>{x}</p>
              </div>
            ))}
          </div>
          <div className="example-panel">
            <div className="eyebrow">VISUAL GUIDE</div>
            <div className="animation-preview">
              <GameIllustration game={game} />
              <span>Face-free visual guide</span>
            </div>
            {game.exampleUrl ? (
              <a className="button ghost full" target="_blank" rel="noreferrer" href={game.exampleUrl}>
                <ExternalLink size={15} /> Watch video example
              </a>
            ) : (
              <div className="example-note">
                <Info size={14} /> Video guide can be attached in Creator Studio.
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="error modal-error">
            <CircleHelp size={15} />
            {error}
          </div>
        ) : null}

        <div className="modal-actions">
          {game.isSoloFriendly ? (
            <button
              type="button"
              className="button secondary gnc-game-press"
              disabled={creating}
              onClick={onSolo}
            >
              <Sparkles size={16} /> Play Solo
            </button>
          ) : null}

          <button
            type="button"
            className="button primary big gnc-game-press"
            disabled={creating}
            onClick={onCreate}
          >
            {creating ? (
              <>
                <RotateCcw className="spin" size={16} /> Creating room…
              </>
            ) : (
              <>
                <Users size={16} /> {game.playMode === 'online' ? 'Create Online Lobby' : `Create Room (${game.minPlayers ?? 2}+ Players)`}
              </>
            )}
          </button>
          <button type="button" className="button ghost" disabled={creating} onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    </div>
  )
}

function RoomPage() {
  const { code = '' } = useParams()
  const nav = useNavigate()
  const { games } = useGameCatalog()
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [timer, setTimer] = useState<number | null>(null)
  const [changeGameOpen, setChangeGameOpen] = useState(false)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [externalInput, setExternalInput] = useState('')
  const [chatError, setChatError] = useState('')
  const [endRoomBusy, setEndRoomBusy] = useState(false)
  const player = getPlayer()

  useEffect(() => {
    let off = () => {}
    let offChat = () => {}

    ;(async () => {
      try {
        const s = await getRoom(code)
        setSnapshot(s)
        setExternalInput(s.room.externalRoomUrl ?? '')
        setLoading(false)
        if (s.room.roomType === 'online') { try { setChat(await listRoomChat(s.room)) } catch (chatLoadError) { console.warn('ROOM CHAT LOAD ERROR:', chatLoadError) } }

        try {
          off = subscribeToRoom(s.room, async () => {
            try {
              const refreshed = await getRoom(code)
              // If new player joined, play sound
              if (refreshed.players.length > (snapshot?.players.length ?? 0)) {
                sound.playJoin()
              }
              setSnapshot(refreshed)
              if (refreshed.room.roomType === 'online') {
                setExternalInput(refreshed.room.externalRoomUrl ?? '')
                try { setChat(await listRoomChat(refreshed.room)) } catch { /* keep chat */ }
              }
            } catch (e) {
              console.error('REALTIME GET ROOM ERROR:', e)
            }
          })
        } catch (e) {
          console.error('REALTIME SUBSCRIBE ERROR:', e)
        }
        if (s.room.roomType === 'online') {
          offChat = subscribeToRoomChat(s.room, async () => {
            try { setChat(await listRoomChat(s.room)) } catch { /* keep chat */ }
          })
        }
      } catch (e) {
        console.error('INITIAL GET ROOM ERROR:', e)
        setError(e instanceof Error ? e.message : 'Room not found')
        setLoading(false)
      }
    })()

    return () => { off(); offChat() }
  }, [code])

  // Support game switching: use snapshot.room.state.activeGameId if present
  const game = useMemo(() => {
    if (!snapshot) return null
    const targetId = snapshot.room.state.activeGameId ?? snapshot.room.gameId
    return games.find(g => g.id === targetId) ?? games[0]
  }, [games, snapshot])

  useEffect(() => {
    if (!game) return

    loadPrompts(game.id)
      .then(setPrompts)
      .catch(e => {
        console.error('LOAD PROMPTS ERROR:', e)
        setError(e instanceof Error ? e.message : 'Could not load prompts')
      })
  }, [game])

  // Countdown timer with sound tick & buzzer
  useEffect(() => {
    if (timer === null) return

    const id = window.setInterval(() => {
      setTimer(v => {
        if (v === null) return null
        if (v <= 1) {
          sound.playBuzzer()
          return 0
        }
        sound.playTick()
        return v - 1
      })
    }, 1000)

    return () => window.clearInterval(id)
  }, [timer])

  if (loading) {
    return <PageState title="Connecting to table…" subtle="Preparing your game room." />
  }

  if (error || !snapshot || !game) {
    return <PageState title="Room not found" subtle={error} back />
  }

  const isHost = player?.id === snapshot.room.hostId
  const me = snapshot.players.find(p => p.id === player?.id)
  const target = game.targetScore
  const winner = snapshot.players.find(p => target && p.score >= target)

  // Trigger celebration fanfare when winner is found
 

  async function score(id: string, delta: number) {
    try {
      if (delta > 0) sound.playScore()
      else sound.playTap()
      setSnapshot(await changeScore(snapshot!.room, id, delta))
    } catch (e) {
      console.error('CHANGE SCORE ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not update score')
    }
  }

  async function nextPrompt(difficulty?: Prompt['difficulty']) {
    try {
      sound.playTap()
      const pool = prompts.filter(p => !difficulty || p.difficulty === difficulty)
      const list = pool.length ? pool : prompts

      if (!list.length) {
        setError('No prompts available for this game.')
        return
      }

      const pick = list[Math.floor(Math.random() * list.length)]

      setSnapshot(
        await updateRoomState(
          snapshot!,
          {
            activePrompt: pick,
            round: snapshot!.room.state.round + 1,
            winnerId: null
          },
          'playing'
        )
      )
    } catch (e) {
      console.error('NEXT PROMPT ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not load the next prompt')
    }
  }

  async function setStatus(status: 'lobby' | 'playing' | 'finished') {
    try {
      sound.playTap()
      setSnapshot(await updateRoomState(snapshot!, {}, status))
    } catch (e) {
      console.error('UPDATE ROOM STATUS ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not update room status')
    }
  }

  async function handleEndRoom() {
    if (!snapshot || !isHost || endRoomBusy) return
    if (!window.confirm(`End “${snapshot.room.roomName ?? game?.name ?? 'this room'}”? Everyone will leave the live room.`)) return
    setEndRoomBusy(true)
    try { sound.playTap(); await endRoom(snapshot); nav('/rooms') }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not end the room') }
    finally { setEndRoomBusy(false) }
  }

  async function saveExternalLink() {
    try { sound.playTap(); setSnapshot(await setExternalRoomUrl(snapshot!.room, externalInput)) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not save the external game link') }
  }

  async function submitChat() {
    if (!snapshot || !player || !chatInput.trim()) return
    setChatError('')
    try {
      const msg = await sendRoomChat(snapshot.room, player, chatInput)
      setChat(current => [...current, msg].slice(-100))
      setChatInput('')
    } catch (e) { setChatError(e instanceof Error ? e.message : 'Could not send chat message') }
  }

  async function switchGame(newGame: Game) {
    try {
      sound.playTap()
      setChangeGameOpen(false)
      setSnapshot(
        await updateRoomState(
          snapshot!,
          {
            activeGameId: newGame.id,
            activePrompt: null,
            round: 1,
            targetScore: newGame.targetScore ?? undefined
          },
          snapshot!.room.status === 'lobby' ? 'lobby' : 'playing'
        )
      )
    } catch (e) {
      console.error('SWITCH GAME ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not switch game')
    }
  }

  async function resetScores() {
    try {
      sound.playTap()
      let next = snapshot!
      for (const p of next.players) {
        const current = p.score
        if (current) {
          next = await changeScore(next.room, p.id, -current)
        }
      }
      setSnapshot(next)
    } catch (e) {
      console.error('RESET SCORES ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not reset scores')
    }
  }

  const share = () => {
    sound.playTap()
    const url = `${window.location.origin}/room/${code.toUpperCase()}`
    if (navigator.share) {
      void navigator.share({
        title: `${game.name} · Gam3n1ght`,
        text: `Join my Gam3n1ght room: ${code.toUpperCase()}`,
        url
      })
    } else {
      void navigator.clipboard?.writeText(url)
    }
  }

  return (
    <div className="room-page">
      <header className="room-header">
        <button className="icon-link" onClick={() => { sound.playTap(); nav('/') }}>
          <ArrowLeft size={17} />
          Back to Games
        </button>

        <div className="room-code-big">
          <span>ROOM</span>
          <b>{code.toUpperCase()}</b>
          <button
            onClick={() => {
              sound.playTap()
              navigator.clipboard?.writeText(code.toUpperCase())
            }}
            aria-label="Copy room code"
            title="Copy room code"
          >
            <Copy size={15} />
          </button>
        </div>

        <button className="button ghost compact" onClick={share} title="Share room invite">
          <Share2 size={15} />
          Share
        </button>
      </header>

      <div className="room-layout">
        <main className="play-main">
          <div className="play-title">
            <div>
              <div className="eyebrow">
                {snapshot.room.status === 'lobby' ? 'LOBBY WAITING' : 'NOW PLAYING'}
              </div>
              <h1>{game.name}</h1>
              <p>{game.shortDescription}</p>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {isHost ? (
                <button
                  type="button"
                  className="button ghost compact"
                  onClick={() => { sound.playTap(); setChangeGameOpen(true) }}
                  title="Switch to another game without leaving the room"
                >
                  <Gamepad2 size={14} /> Change Game
                </button>
              ) : null}

              {game.exampleUrl ? (
                <a
                  href={game.exampleUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="button ghost compact"
                >
                  Example <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          </div>

          {snapshot.room.status === 'lobby' ? (
            <Lobby
              snapshot={snapshot}
              game={game}
              isHost={isHost}
              onStart={() => void setStatus('playing')}
              onCopy={share}
            />
          ) : (
            <div className="play-stack">
              <GamePanel
                game={game}
                snapshot={snapshot}
                player={player}
                isHost={isHost}
                prompts={prompts}
                timer={timer}
                setTimer={setTimer}
                onScore={score}
                onNextPrompt={nextPrompt}
                onFinish={() => void setStatus('finished')}
              />

              {winner ? (
                <WinnerCard
                  winner={winner}
                  game={game}
                  onReset={() => { void resetScores() }}
                />
              ) : null}
            </div>
          )}

          {game.playMode === 'online' ? (
            <OnlineLobbyPanel game={game} room={snapshot.room} isHost={isHost} externalInput={externalInput} setExternalInput={setExternalInput} onSaveExternalLink={() => void saveExternalLink()} chat={chat} chatInput={chatInput} setChatInput={setChatInput} onSubmitChat={() => void submitChat()} chatError={chatError} />
          ) : null}

          {/* Floating Emoji Reactions Bar */}
          <ReactionOverlay />
        </main>

        <aside className="room-sidebar">
          <div className="side-card">
            <div className="side-head">
              <div>
                <span className="eyebrow">PLAYERS</span>
                <h2>{snapshot.players.length}</h2>
              </div>
              <Users size={18} />
            </div>

            <div className="player-list">
              {snapshot.players.map((p, i) => (
                <div key={p.id} className="player-chip">
                  <span className="player-avatar-mini">{p.avatar || DEFAULT_AVATARS[i % DEFAULT_AVATARS.length]}</span>
                  <strong>{p.name}</strong>
                  {p.id === snapshot.room.hostId ? (
                    <span className="host-mini">HOST</span>
                  ) : null}
                </div>
              ))}
            </div>

            {isHost ? (
              <button className="button danger full end-room-button" disabled={endRoomBusy} onClick={() => void handleEndRoom()}>
                <CircleX size={15} /> {endRoomBusy ? 'Ending room…' : 'End Room'}
              </button>
            ) : null}
          </div>

          <div className="side-card">
            <Scoreboard
              players={snapshot.players}
              hostId={snapshot.room.hostId}
              targetScore={target}
              onChange={isHost ? score : undefined}
            />

            <div className="you-line">
              <span>You</span>
              <strong>{me?.name ?? 'Spectator'}</strong>
              <b>{me?.score ?? 0}</b>
            </div>
          </div>

          <div className="tip-card" style={{ padding: '16px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '18px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <Flame size={18} className="text-amber-400" />
            <span style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Real-world party rules stay at the table. Gam3n1ght acts as your prompt deck, timer, referee and running scoreboard!
            </span>
          </div>
        </aside>
      </div>

      {/* Host Game Switcher Modal */}
      {changeGameOpen ? (
        <div className="modal-backdrop" onClick={() => setChangeGameOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setChangeGameOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
            <div className="eyebrow">HOST CONTROLS</div>
            <h2>Switch Game</h2>
            <p style={{ color: 'var(--muted)', marginBottom: '18px' }}>
              Pick a new game to switch the room without losing connected players.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', maxHeight: '60vh', overflowY: 'auto' }}>
              {games.map(g => (
                <div
                  key={g.id}
                  className={`admin-game-row ${g.id === game.id ? 'active' : ''}`}
                  style={{ cursor: 'pointer', padding: '12px', borderRadius: '14px' }}
                  onClick={() => void switchGame(g)}
                >
                  <span className="mini-art"><GameIllustration game={g} /></span>
                  <div>
                    <strong>{g.name}</strong>
                    <small>{g.shortDescription}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {error ? <div className="toast">{error}</div> : null}
    </div>
  )
}

function Lobby({
  snapshot,
  game,
  isHost,
  onStart,
  onCopy
}: {
  snapshot: RoomSnapshot
  game: Game
  isHost: boolean
  onStart: () => void
  onCopy: () => void
}) {
  return (
    <div className="lobby-card">
      <div className="lobby-code">
        <div className="eyebrow">SHARE THIS CODE</div>
        <strong>{snapshot.room.code}</strong>
        <button className="button secondary gnc-game-press" onClick={onCopy}>
          <Copy size={16} /> Copy Invite
        </button>
      </div>

      <div className="lobby-info">
        <div className="waiting-avatar">
          <Users size={38} />
        </div>
        <h2>Waiting for players…</h2>
        <p>
          {snapshot.players.length} player{snapshot.players.length === 1 ? '' : 's'} joined.
          Everyone will automatically see the game start when the host hits play!
        </p>

        <div className="lobby-names">
          {snapshot.players.map((p, i) => (
            <span key={p.id}>
              {p.avatar || DEFAULT_AVATARS[i % DEFAULT_AVATARS.length]} {p.name}
            </span>
          ))}
        </div>

        {isHost ? (
          <button className="button primary big gnc-game-press" onClick={onStart}>
            <Play size={18} fill="currentColor" /> Start {game.name}
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--muted)', fontSize: '13px' }}>
            <Clock3 size={16} /> Waiting for host to start the round…
          </div>
        )}
      </div>
    </div>
  )
}

function GamePanel({
  game,
  snapshot,
  player,
  isHost,
  prompts,
  timer,
  setTimer,
  onScore,
  onNextPrompt,
  onFinish
}: {
  game: Game
  snapshot: RoomSnapshot
  player: Player | null
  isHost: boolean
  prompts: Prompt[]
  timer: number | null
  setTimer: (v: number | null) => void
  onScore: (id: string, d: number) => void
  onNextPrompt: (difficulty?: Prompt['difficulty']) => void
  onFinish: () => void
}) {
  const behavior = (game.behavior ?? game.slug) as GameKind
  const [selected, setSelected] = useState(snapshot.players[0]?.id ?? '')
  const [forbidden, setForbidden] = useState<number>(Number(snapshot.room.state.forbiddenNumber ?? 21))
  const [unoPoints, setUnoPoints] = useState('10')
  const [selectedDiff, setSelectedDiff] = useState<Prompt['difficulty']>('easy')

  const chooseWinner = () => {
    if (selected) {
      onScore(selected, 1)
    }
  }

  const hasPrompt = Boolean(snapshot.room.state.activePrompt)
  const target = game.targetScore

  return (
    <div className={`live-game ${game.slug}`}>
      <div className="game-panel-header">
        <div>
          <span className="eyebrow">ROUND {Math.max(1, snapshot.room.state.round)}</span>
          <h2>{game.name}</h2>
        </div>
        <span className="mode-pill">{game.scoreMode}</span>
      </div>

      {game.playMode === 'online' ? (
        <div className="online-game-placeholder"><Wifi size={34} /><div><span className="eyebrow">ONLINE SESSION</span><h3>Open the live game below</h3><p>{game.shortDescription}</p></div></div>
      ) : behavior === 'sketch' ? (
        <>
          <div className="prompt-tools">
            <div>
              <span className="eyebrow">DRAWING PROMPT</span>
              <h3>{snapshot.room.state.activePrompt?.prompt ?? 'Pick a prompt to begin.'}</h3>
            </div>
            <div className="prompt-controls">
              {prompts.length ? (
                <>
                  <button className="button secondary" onClick={() => onNextPrompt('easy')}>Easy</button>
                  <button className="button secondary" onClick={() => onNextPrompt('medium')}>Medium</button>
                  <button className="button secondary" onClick={() => onNextPrompt('hard')}>Hard</button>
                </>
              ) : null}
            </div>
          </div>
          <DrawingBoard />
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      ) : behavior === 'memory-drawing' ? (
        <>
          <div className="memory-card">
            <span className="eyebrow">MEMORY PROMPT</span>
            <div className="memory-illustration">
              <GameIllustration game={game} />
            </div>
            <h3>{snapshot.room.state.activePrompt?.prompt ?? 'Choose a reference.'}</h3>
            <p>Show the prompt for 6 seconds, hide it, then draw from memory.</p>
            <div className="prompt-controls">
              <select value={selectedDiff} onChange={e => setSelectedDiff(e.target.value as any)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
              <button className="button primary" onClick={() => onNextPrompt(selectedDiff)}>New reference</button>
            </div>
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      ) : behavior === 'forbidden-number' ? (
        <>
          <div className="number-trap">
            <span className="eyebrow">FORBIDDEN NUMBER</span>
            <input
              className="big-input"
              type="number"
              min="1"
              value={forbidden}
              onChange={e => setForbidden(Number(e.target.value) || 1)}
            />
            <p>Set the losing number before the count starts. Everyone else keeps the sequence going.</p>
            {isHost && (
              <button className="button secondary" onClick={() => void updateRoomState(snapshot, { forbiddenNumber: Number(forbidden) })}>
                <Check size={15} /> Lock number
              </button>
            )}
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} loserLabel="Loser (give them 0)" />
        </>
      ) : behavior === 'ten-seconds' ? (
        <>
          <div className="timer-card">
            <span className="eyebrow">10.00 SECOND TARGET</span>
            <div className="timer-display">{timer === null ? '10.00' : `${timer}.00`}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <button className="button primary" onClick={() => setTimer(10)}>
                <Timer size={16} /> Start 10s
              </button>
              <button className="button ghost" onClick={() => setTimer(null)}>
                <RotateCcw size={16} /> Reset
              </button>
            </div>
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      ) : behavior === 'wrong-answers' || behavior === 'contact' ? (
        <>
          <div className="prompt-card">
            <div>
              <span className="eyebrow">PROMPT DECK</span>
              <h3>{snapshot.room.state.activePrompt?.prompt ?? (behavior === 'wrong-answers' ? 'What do cows drink?' : 'apple')}</h3>
            </div>
            <button className="button secondary" onClick={() => onNextPrompt()}>
              <RotateCcw size={15} /> New prompt
            </button>
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      ) : behavior === 'race-3' || behavior === 'race-5' ? (
        <>
          <div className="race-card">
            <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: 'var(--lime)', color: '#020617', display: 'grid', placeItems: 'center', fontSize: '42px', fontWeight: '950' }}>
              {target}
            </div>
            <div>
              <span className="eyebrow">FIRST TO</span>
              <h3>{target} points</h3>
              <p>Award one point per winning round. The first player to the target wins automatically.</p>
            </div>
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      ) : behavior === 'uno' ? (
        <>
          <div className="score-entry">
            <div>
              <span className="eyebrow">UNO HAND</span>
              <h3>Add hand points</h3>
            </div>
            <select value={selected} onChange={e => setSelected(e.target.value)}>
              {snapshot.players.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <input type="number" min="0" value={unoPoints} onChange={e => setUnoPoints(e.target.value)} />
            <button className="button primary" disabled={!isHost} onClick={() => onScore(selected, Number(unoPoints) || 0)}>
              <Plus size={15} /> Add
            </button>
            <p>Physical UNO stays on the table. This is the digital scorekeeper.</p>
          </div>
        </>
      ) : behavior === 'hsk-cup' ? (
        <>
          <div className="cup-card" style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <span style={{ padding: '6px 10px', borderRadius: '99px', background: 'var(--surface-3)', fontSize: '11px', fontWeight: '900' }}>HEAD</span>
              <span style={{ padding: '6px 10px', borderRadius: '99px', background: 'var(--surface-3)', fontSize: '11px', fontWeight: '900' }}>SHOULDERS</span>
              <span style={{ padding: '6px 10px', borderRadius: '99px', background: 'var(--surface-3)', fontSize: '11px', fontWeight: '900' }}>KNEES</span>
              <b style={{ padding: '6px 12px', borderRadius: '99px', background: 'var(--red)', color: 'white', fontSize: '11px', fontWeight: '900' }}>CUP</b>
            </div>
            <div style={{ fontSize: '64px', margin: '14px 0' }}>🥤</div>
            <p>Call the body positions quickly. On “CUP”, grab first without a false start.</p>
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      ) : (
        <>
          <div className="generic-challenge">
            <GameIllustration game={game} />
            <div>
              <span className="eyebrow">HOST CONTROL</span>
              <h3>{game.shortDescription}</h3>
              <p>{game.instructions[0]}</p>
            </div>
          </div>
          <WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} />
        </>
      )}

      {hasPrompt && game.slug !== 'sketch' && game.slug !== 'memory-drawing' ? (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', background: 'rgba(139, 92, 246, 0.15)', borderRadius: '12px', color: 'var(--lav)', fontSize: '13px', marginTop: '16px' }}>
          <Info size={15} />
          <span>Current prompt: <strong>{snapshot.room.state.activePrompt?.prompt}</strong></span>
        </div>
      ) : null}

      {isHost ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginTop: '18px', paddingTop: '15px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--muted)' }}>
          <button className="button danger compact" onClick={onFinish}>End Room</button>
          <span>Host controls are only visible to the room creator.</span>
        </div>
      ) : null}
    </div>
  )
}


function LiveRoomsPage() {
  const nav = useNavigate()
  const [rooms, setRooms] = useState<ActiveRoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [player, setCurrentPlayer] = useState<Player | null>(getPlayer())

  useEffect(() => {
    let active = true
    let off = () => {}
    const refresh = async () => {
      try {
        const next = await listActiveRooms()
        if (active) { setRooms(next); setError('') }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Could not load live rooms')
      } finally { if (active) setLoading(false) }
    }
    void refresh()
    off = subscribeToActiveRooms(() => void refresh())
    const poll = window.setInterval(() => void refresh(), 15000)
    return () => { active = false; off(); window.clearInterval(poll) }
  }, [])

  async function joinLiveRoom(room: ActiveRoomSummary) {
    const current = player ?? makePlayer(`Player-${Math.floor(Math.random() * 900 + 100)}`)
    savePlayer(current); setCurrentPlayer(current)
    try { await joinRoom(room.code, current); sound.playJoin(); nav(`/room/${room.code}`) }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not join this room') }
  }

  const online = rooms.filter(r => r.roomType === 'online')
  const physical = rooms.filter(r => r.roomType === 'physical')
  return (
    <div className="plain-page live-rooms-page">
      <header className="page-header live-rooms-header">
        <div><div className="eyebrow"><Wifi size={14} /> ACTIVE NOW</div><h1>Live Rooms</h1><p>Only active rooms appear here, split between online and physical play.</p></div>
        <div className="live-room-header-actions"><Link className="button primary" to="/?join=1"><DoorOpen size={15} /> Join by code</Link><Link className="button ghost" to="/"><ArrowLeft size={15} /> Games</Link></div>
      </header>
      {error ? <div className="error"><CircleHelp size={15} /> {error}</div> : null}
      {loading ? <PageState title="Finding active rooms…" subtle="Checking the live room directory." /> : null}
      {!loading ? <div className="live-room-categories"><LiveRoomCategory title="Online" icon={<Wifi size={18} />} rooms={online} onJoin={joinLiveRoom} empty="No active online rooms right now." /><LiveRoomCategory title="Physical" icon={<Users size={18} />} rooms={physical} onJoin={joinLiveRoom} empty="No active physical rooms right now." /></div> : null}
    </div>
  )
}

function LiveRoomCategory({ title, icon, rooms, onJoin, empty }: { title: string; icon: ReactNode; rooms: ActiveRoomSummary[]; onJoin: (room: ActiveRoomSummary) => void; empty: string }) {
  return (
    <section className="live-room-category">
      <div className="live-room-category-head"><div><span className="eyebrow">ACTIVE ROOMS</span><h2>{icon} {title}</h2></div><span className="count">{rooms.length}</span></div>
      {rooms.length ? <div className="live-room-list">{rooms.map(room => <button key={room.id} type="button" className="live-room-row" onClick={() => onJoin(room)}><div className="live-room-icon">{room.roomType === 'online' ? '🌐' : '🎲'}</div><div className="live-room-main"><strong>{room.roomName}</strong><span>{room.gameName} · {room.playerCount} player{room.playerCount === 1 ? '' : 's'}</span></div><div className="live-room-meta"><span className={`status-dot ${room.status === 'playing' ? 'playing' : 'waiting'}`} /><small>{room.status === 'playing' ? 'Playing' : 'Waiting'}</small><b>{room.code}</b></div><ArrowRight size={18} /></button>)}</div> : <div className="live-room-empty"><Wifi size={25} /><p>{empty}</p></div>}
    </section>
  )
}

function OnlineLobbyPanel({ game, room, isHost, externalInput, setExternalInput, onSaveExternalLink, chat, chatInput, setChatInput, onSubmitChat, chatError }: { game: Game; room: RoomSnapshot['room']; isHost: boolean; externalInput: string; setExternalInput: (value: string) => void; onSaveExternalLink: () => void; chat: ChatMessage[]; chatInput: string; setChatInput: (value: string) => void; onSubmitChat: () => void; chatError: string }) {
  const launch = room.externalRoomUrl || game.externalLaunchUrl
  return (
    <section className="online-lobby-grid">
      <div className="online-launch-card">
        <div className="eyebrow"><Wifi size={14} /> ONLINE GAME</div><h2>{game.name}</h2><p>Game Night is your meetup lobby. The actual game runs on {game.externalProvider ?? 'the game provider'}.</p>
        <div className="online-steps"><div><b>01</b><span>Host creates the external game room.</span></div><div><b>02</b><span>Paste the invite link here.</span></div><div><b>03</b><span>Everyone launches the same live game.</span></div></div>
        {isHost ? <div className="external-link-editor"><label>External room link<input value={externalInput} onChange={e => setExternalInput(e.target.value)} placeholder={game.externalLaunchUrl ?? 'https://…'} /></label><button type="button" className="button secondary" onClick={onSaveExternalLink}><Check size={15} /> Save link</button></div> : null}
        <div className="online-launch-actions">{launch ? <a className="button primary big" href={launch} target="_blank" rel="noreferrer"><ExternalLink size={16} /> {room.externalRoomUrl ? `Enter ${game.name}` : `Open ${game.externalProvider ?? 'game site'}`}</a> : null}{game.externalLaunchUrl ? <a className="button ghost" href={game.externalLaunchUrl} target="_blank" rel="noreferrer">Create your own room</a> : null}{room.externalRoomUrl && room.externalRoomUrl !== game.externalLaunchUrl ? <button type="button" className="button ghost" onClick={() => void navigator.clipboard?.writeText(room.externalRoomUrl ?? '')}><Copy size={15} /> Copy game link</button> : null}</div>
      </div>
      <RoomChat messages={chat} value={chatInput} setValue={setChatInput} onSubmit={onSubmitChat} error={chatError} />
    </section>
  )
}

function RoomChat({ messages, value, setValue, onSubmit, error }: { messages: ChatMessage[]; value: string; setValue: (value: string) => void; onSubmit: () => void; error: string }) {
  return <section className="room-chat-card"><div className="side-head"><div><span className="eyebrow">ROOM CHAT</span><h2><MessageSquareText size={17} /> Coordinate</h2></div><MessageCircle size={18} /></div><div className="room-chat-messages" aria-live="polite">{messages.length ? messages.map(m => <div key={m.id} className="room-chat-message"><b>{m.senderName}</b><span>{m.message}</span></div>) : <div className="room-chat-empty">No messages yet. Say hi 👋</div>}</div><form className="room-chat-form" onSubmit={e => { e.preventDefault(); onSubmit() }}><input maxLength={500} value={value} onChange={e => setValue(e.target.value)} placeholder="Type a message…" aria-label="Room chat message" /><button type="submit" className="button primary compact" aria-label="Send chat message"><Send size={15} /></button></form>{error ? <small className="room-chat-error">{error}</small> : null}</section>
}

function WinnerPicker({
  players,
  selected,
  setSelected,
  host,
  onWinner,
  loserLabel = 'Award point'
}: {
  players: Player[]
  selected: string
  setSelected: (x: string) => void
  host: boolean
  onWinner: () => void
  loserLabel?: string
}) {
  return (
    <div className="winner-picker">
      <div>
        <span className="eyebrow">{loserLabel}</span>
        <select value={selected} onChange={e => setSelected(e.target.value)} disabled={!players.length}>
          {players.map(p => (
            <option key={p.id} value={p.id}>
              {p.avatar ?? '🎮'} {p.name}
            </option>
          ))}
        </select>
      </div>
      <button className="button primary gnc-game-press" disabled={!host || !selected} onClick={onWinner}>
        <Plus size={15} /> Award point
      </button>
    </div>
  )
}

function WinnerCard({
  winner,
  game,
  onReset
}: {
  winner: Player
  game: Game
  onReset: () => void
}) {
  return (
    <div className="winner-card">
      <div className="winner-icon">
        <Trophy size={26} />
      </div>
      <div>
        <span className="eyebrow">GAME OVER</span>
        <h3>{winner.name} wins {game.name}!</h3>
        <p>Celebrate the victory, then reset scores for the next match.</p>
      </div>
      <button className="button secondary gnc-game-press" onClick={onReset}>
        <RotateCcw size={15} /> Rematch
      </button>
    </div>
  )
}

function PageState({ title, subtle, back = false }: { title: string; subtle?: string; back?: boolean }) {
  return (
    <div className="center-state">
      <div className="brand-mark big">
        <Gamepad2 size={28} />
      </div>
      <h2>{title}</h2>
      {subtle ? <p>{subtle}</p> : null}
      {back ? (
        <Link className="button primary gnc-game-press" to="/" onClick={() => sound.playTap()}>
          Back to games
        </Link>
      ) : null}
    </div>
  )
}

function FormSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="form-section">
      <div className="eyebrow">{label}</div>
      {children}
    </div>
  )
}

function SuggestGamePage() {
  const player = getPlayer()
  const [form, setForm] = useState({
    submitterName: player?.name ?? '',
    submitterEmail: '',
    name: '',
    shortDescription: '',
    description: '',
    instructions: '',
    exampleUrl: '',
    scoreMode: 'points' as Game['scoreMode'],
    targetScore: '',
    minPlayers: '2',
    supportsTeams: false,
    behavior: 'race-5' as GameKind,
    tags: '',
    notes: ''
  })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  const update = (key: keyof typeof form, value: unknown) => setForm(v => ({ ...v, [key]: value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (form.name.trim().length < 2 || form.description.trim().length < 10 || !form.submitterName.trim()) {
      setError('Add your name, a game name and a useful description.')
      return
    }
    setState('sending')
    sound.playTap()
    try {
      await submitGameSuggestion({
        submitterName: form.submitterName,
        submitterEmail: form.submitterEmail,
        name: form.name,
        shortDescription: form.shortDescription || form.description.slice(0, 120),
        description: form.description,
        instructions: form.instructions.split('\n').map(x => x.trim()).filter(Boolean),
        exampleUrl: form.exampleUrl,
        scoreMode: form.scoreMode,
        behavior: form.behavior,
        targetScore: form.targetScore ? Number(form.targetScore) : undefined,
        minPlayers: Math.max(1, Number(form.minPlayers) || 2),
        supportsTeams: form.supportsTeams,
        tags: form.tags.split(',').map(x => x.trim()).filter(Boolean),
        notes: form.notes
      })
      sound.playScore()
      setState('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit the suggestion')
      setState('idle')
    }
  }

  if (state === 'sent') {
    return (
      <div className="plain-page">
        <div className="success-card">
          <CheckCircle2 size={46} color="var(--lime)" />
          <div className="eyebrow">THANK YOU</div>
          <h1>Game suggestion received.</h1>
          <p>The admin team can now review the rules and setup details. Approved games are added to the library.</p>
          <div className="success-actions">
            <Link className="button primary gnc-game-press" to="/">Back to games</Link>
            <button className="button ghost" onClick={() => setState('idle')}>Suggest another game</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="plain-page">
      <header className="page-header">
        <div>
          <div className="eyebrow"><Lightbulb size={14} /> COMMUNITY SUBMISSIONS</div>
          <h1>Suggest a game.</h1>
          <p>Have an awesome party game idea? Submit it to the public library for moderation.</p>
        </div>
        <Link className="button ghost" to="/"><ArrowLeft size={15} /> Back to app</Link>
      </header>

      <form className="community-form" onSubmit={e => void submit(e)}>
        <FormSection label="Your details">
          <div className="form-grid">
            <label>Name<input value={form.submitterName} onChange={e => update('submitterName', e.target.value)} placeholder="e.g. DisCoVar" /></label>
            <label>Email (optional)<input type="email" value={form.submitterEmail} onChange={e => update('submitterEmail', e.target.value)} placeholder="you@example.com" /></label>
          </div>
        </FormSection>

        <FormSection label="Game details">
          <div className="form-grid">
            <label>Game name<input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Rapid Categories" /></label>
            <label>Short description<input value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} placeholder="One sentence explaining the fun" /></label>
            <label className="full-field">How it works<textarea rows={4} value={form.description} onChange={e => update('description', e.target.value)} placeholder="Explain the objective and gameplay." /></label>
            <label className="full-field">Instructions<textarea rows={6} value={form.instructions} onChange={e => update('instructions', e.target.value)} placeholder="One step per line…" /></label>
            <label>Behavior<select value={form.behavior} onChange={e => update('behavior', e.target.value as GameKind)}>{['uno', 'forbidden-number', 'opposite-action', 'race-3', 'sketch', 'find-number', 'guess-leader', 'guess-number', 'ten-seconds', 'memory-drawing', 'race-5', 'wrong-answers', 'contact', 'hsk-cup', 'garbage', 'pressure'].map(x => <option key={x}>{x}</option>)}</select></label>
            <label>Score mode<select value={form.scoreMode} onChange={e => update('scoreMode', e.target.value)}><option value="points">Points</option><option value="race">Race to target</option><option value="manual">Manual</option><option value="uno">UNO-style</option></select></label>
            <label>Target score<input type="number" min="1" value={form.targetScore} onChange={e => update('targetScore', e.target.value)} placeholder="e.g. 5" /></label>
            <label>Min players<input type="number" min="1" value={form.minPlayers} onChange={e => update('minPlayers', e.target.value)} /></label>
            <label className="check-field"><input type="checkbox" checked={form.supportsTeams} onChange={e => update('supportsTeams', e.target.checked)} /> Works well with teams</label>
            <label className="full-field">Tags<input value={form.tags} onChange={e => update('tags', e.target.value)} placeholder="reaction, cards, funny" /></label>
            <label className="full-field">Example video link<input value={form.exampleUrl} onChange={e => update('exampleUrl', e.target.value)} placeholder="Instagram, YouTube or TikTok link" /></label>
            <label className="full-field">Extra notes<textarea rows={3} value={form.notes} onChange={e => update('notes', e.target.value)} placeholder="Scoring quirks, equipment, etc." /></label>
          </div>
        </FormSection>

        {error ? <div className="error"><CircleHelp size={15} />{error}</div> : null}

        <div className="form-actions">
          <button className="button primary big gnc-game-press" disabled={state === 'sending'} type="submit">
            <Send size={16} /> {state === 'sending' ? 'Submitting…' : 'Submit Game'}
          </button>
          <Link className="button ghost" to="/">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

function ContactPage() {
  const [form, setForm] = useState({
    name: getPlayer()?.name ?? '',
    email: '',
    category: 'suggestion' as ContactMessage['category'],
    message: ''
  })
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState('')

  if (state === 'sent') {
    return (
      <div className="plain-page">
        <div className="success-card">
          <CheckCircle2 size={46} color="var(--lime)" />
          <div className="eyebrow">MESSAGE SENT</div>
          <h1>Thanks for reaching out!</h1>
          <p>We’ve received your message and will review it shortly.</p>
          <Link className="button primary gnc-game-press" to="/">Back to games</Link>
        </div>
      </div>
    )
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || form.message.trim().length < 6) {
      setError('Please provide your name and a brief message.')
      return
    }
    setState('sending')
    sound.playTap()
    try {
      await submitContactMessage({
        name: form.name,
        email: form.email,
        category: form.category,
        message: form.message
      })
      sound.playScore()
      setState('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send message')
      setState('idle')
    }
  }

  return (
    <div className="plain-page">
      <header className="page-header">
        <div>
          <div className="eyebrow"><MessageSquareText size={14} /> SUPPORT & FEEDBACK</div>
          <h1>Contact us.</h1>
          <p>Report a bug, request a feature or partner with us.</p>
        </div>
        <Link className="button ghost" to="/"><ArrowLeft size={15} /> Back to app</Link>
      </header>

      <form className="community-form narrow" onSubmit={e => void submit(e)}>
        <FormSection label="Your details">
          <div className="form-grid">
            <label>Name<input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} placeholder="e.g. DisCoVar" /></label>
            <label>Email (optional)<input type="email" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} placeholder="you@example.com" /></label>
            <label>Reason<select value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value as any }))}><option value="bug">Report a bug</option><option value="complaint">Complaint</option><option value="suggestion">General suggestion</option><option value="partnership">Partnership</option><option value="other">Something else</option></select></label>
            <label className="full-field">Message<textarea rows={7} value={form.message} onChange={e => setForm(v => ({ ...v, message: e.target.value }))} placeholder="Tell us what happened or what you'd like to see…" /></label>
          </div>
        </FormSection>

        {error ? <div className="error"><CircleHelp size={15} />{error}</div> : null}

        <div className="form-actions">
          <button className="button primary big gnc-game-press" disabled={state === 'sending'} type="submit">
            <Send size={16} /> {state === 'sending' ? 'Sending…' : 'Send message'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdminPage() {
  const nav = useNavigate()
  const { games, setGames } = useGameCatalog()
  const [editing, setEditing] = useState<Game | null>(null)
  const [message, setMessage] = useState('')
  const [promptGame, setPromptGame] = useState('g05')
  const [prompt, setPrompt] = useState('')
  const [uploading, setUploading] = useState(false)
  const [checking, setChecking] = useState(isSupabaseConfigured)
  const [sessionEmail, setSessionEmail] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [tab, setTab] = useState<'overview' | 'games' | 'suggestions' | 'messages'>('overview')
  const [suggestions, setSuggestions] = useState<GameSuggestion[]>([])
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [usage, setUsage] = useState<AdminUsage | null>(null)
  const [usageLoading, setUsageLoading] = useState(false)
  const [reviewing, setReviewing] = useState<string | null>(null)

  const blank: Game = {
    id: `custom-${crypto.randomUUID()}`,
    slug: 'race-5',
    name: 'New Game',
    shortDescription: 'Short description',
    description: 'What happens in this game.',
    instructions: ['Explain step one.', 'Explain step two.', 'Explain how someone wins.'],
    scoreMode: 'points',
    animationKey: 'default',
    tags: ['party'],
    playMode: 'physical'

  }

  useEffect(() => {
    if (!isSupabaseConfigured) return
    void refreshAuth()
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    void refreshAdminData()
  }, [isAdmin])

  async function refreshAuth() {
    setChecking(true)
    setAuthError('')
    try {
      const session = await getAuthSession()
      setSessionEmail(session ? (session.user.email ?? '') : '')
      if (session) setIsAdmin(await isCurrentUserAdmin())
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Could not check admin access')
    } finally {
      setChecking(false)
    }
  }

  async function refreshAdminData() {
    setUsageLoading(true)
    try {
      const [u, s, m] = await Promise.all([getAdminUsage(), listGameSuggestions(), listContactMessages()])
      setUsage(u)
      setSuggestions(s)
      setMessages(m)
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not load admin data')
    } finally {
      setUsageLoading(false)
    }
  }

  async function login() {
    setAuthError('')
    sound.playTap()
    try {
      const session = await signInWithPassword(email.trim(), password)
      setSessionEmail(session.user.email ?? '')
      setIsAdmin(await isCurrentUserAdmin())
      sound.playScore()
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Could not sign in')
    }
  }

  async function logout() {
    try {
      await signOut()
      setSessionEmail('')
      setIsAdmin(false)
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : 'Could not sign out')
    }
  }

  async function save() {
    if (!editing) return
    sound.playTap()
    try {
      await saveGame(editing)
      const next = await loadGames()
      setGames(next)
      setMessage('Game saved successfully.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save game')
    }
  }

  async function addPrompt() {
    if (!prompt.trim()) return
    const p: Prompt = { id: `prompt-${crypto.randomUUID()}`, gameId: promptGame, prompt: prompt.trim() }
    try {
      await savePrompt(p)
      setPrompt('')
      setMessage('Prompt added.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not add prompt')
    }
  }

  async function upload(file: File) {
    if (!editing) return
    setUploading(true)
    try {
      const url = await uploadAnimation(editing.id, file)
      const next = { ...editing, exampleUrl: editing.exampleUrl ?? url }
      setEditing(next)
      await saveGame(next)
      setMessage('Asset uploaded.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSuggestion(s: GameSuggestion, status: 'approved' | 'declined') {
    setReviewing(s.id)
    try {
      if (status === 'approved') {
        const kind = s.behavior
        const slug = `custom-${s.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${Date.now().toString(36)}`
        const newGame: Game = {
          id: `custom-${crypto.randomUUID()}`,
          slug,
          behavior: kind,
          name: s.name,
          shortDescription: s.shortDescription,
          description: s.description,
          instructions: s.instructions,
          exampleUrl: s.exampleUrl,
          scoreMode: s.scoreMode,
          targetScore: s.targetScore,
          minPlayers: s.minPlayers,
          supportsTeams: s.supportsTeams,
          animationKey: 'default',
          tags: s.tags
        }
        await saveGame(newGame)
      }
      await reviewGameSuggestion(s.id, status, status === 'declined' ? 'Declined by admin.' : 'Approved and added to library.')
      await refreshAdminData()
      setMessage(status === 'approved' ? 'Suggestion approved!' : 'Suggestion declined.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not review suggestion')
    } finally {
      setReviewing(null)
    }
  }

  async function resolveMessage(id: string) {
    try {
      await resolveContactMessage(id)
      await refreshAdminData()
      setMessage('Message marked resolved.')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not resolve message')
    }
  }

  if (checking) return <PageState title="Checking Creator Studio…" subtle="Verifying permissions." />

  if (!isSupabaseConfigured) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <div className="eyebrow">CREATOR STUDIO</div>
            <h1>Admin access is unavailable.</h1>
            <p>Creator Studio is locked until Supabase authentication is configured. No admin access is granted in demo mode.</p>
          </div>
          <button className="button ghost" onClick={() => nav('/')}><ArrowLeft size={15} /> Back to app</button>
        </header>
        <section className="admin-card auth-card" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="admin-card-head">
            <div><span className="eyebrow">SECURE ACCESS</span><h2>Configuration required</h2></div>
            <Settings2 size={20} />
          </div>
          <p className="muted">Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>, then reload the app. Admin status is checked through the Supabase <code>is_admin()</code> RPC.</p>
        </section>
      </div>
    )
  }

  if (!sessionEmail) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <div className="eyebrow">CREATOR STUDIO</div>
            <h1>Admin sign in.</h1>
            <p>Access requires an authenticated admin account.</p>
          </div>
          <button className="button ghost" onClick={() => nav('/')}><ArrowLeft size={15} /> Back to app</button>
        </header>
        <section className="admin-card auth-card" style={{ maxWidth: '440px', margin: '0 auto' }}>
          <div className="admin-card-head">
            <div><span className="eyebrow">SECURE ACCESS</span><h2>Sign In</h2></div>
            <Settings2 size={20} />
          </div>
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="email" /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" /></label>
          {authError ? <div className="error"><CircleHelp size={15} />{authError}</div> : null}
          <button className="button primary full gnc-game-press" onClick={() => void login()}><LogIn size={16} /> Sign In</button>
        </section>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <div>
            <div className="eyebrow">CREATOR STUDIO</div>
            <h1>Admin access required.</h1>
            <p>The signed-in account does not have the admin role.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="button ghost" onClick={() => void logout()}><LogIn size={15} /> Sign out</button>
            <button className="button ghost" onClick={() => nav('/')}><ArrowLeft size={15} /> Back to app</button>
          </div>
        </header>
        <section className="admin-card auth-card" style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div className="admin-card-head">
            <div><span className="eyebrow">ACCESS DENIED</span><h2>Not an admin account</h2></div>
            <AlertTriangle size={20} />
          </div>
          <p className="muted">Your session is valid, but Supabase did not grant this user admin access. Nothing in Creator Studio is rendered until <code>is_admin()</code> returns true.</p>
          {authError ? <div className="error"><CircleHelp size={15} />{authError}</div> : null}
        </section>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div>
          <div className="eyebrow"><BarChart3 size={14} /> ADMIN CONSOLE</div>
          <h1>Creator Studio.</h1>
          <p>Manage games, review submissions and monitor room telemetry.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {isSupabaseConfigured ? (
            <button className="button ghost" onClick={() => void logout()}><LogIn size={15} /> Sign out</button>
          ) : null}
          <button className="button ghost" onClick={() => nav('/')}><ArrowLeft size={15} /> Back to app</button>
        </div>
      </header>

      <div className="admin-tabs">
        {([
          ['overview', 'Overview', BarChart3],
          ['games', 'Games', Gamepad2],
          ['suggestions', 'Suggestions', Lightbulb],
          ['messages', 'Messages', Inbox]
        ] as const).map(([id, label, Icon]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            <Icon size={15} />
            {label}
            {id === 'suggestions' && usage?.pendingSuggestions ? (
              <span className="tab-count">{usage.pendingSuggestions}</span>
            ) : null}
            {id === 'messages' && usage?.openMessages ? (
              <span className="tab-count">{usage.openMessages}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div>
          <div className="metrics-grid">
            <Metric label="Games" value={usage?.totalGames ?? games.length} icon={<Gamepad2 size={18} />} />
            <Metric label="Rooms / 24h" value={usage?.roomsLast24h ?? 0} icon={<DoorOpen size={18} />} />
            <Metric label="Players / 24h" value={usage?.playersLast24h ?? 0} icon={<Users size={18} />} />
            <Metric label="Pending suggestions" value={usage?.pendingSuggestions ?? 0} icon={<Lightbulb size={18} />} />
            <Metric label="Open support" value={usage?.openMessages ?? 0} icon={<Inbox size={18} />} />
            <Metric label="All rooms" value={usage?.totalRooms ?? 0} icon={<Wifi size={18} />} />
          </div>

          <div className="admin-grid">
            <section className="admin-card">
              <div className="admin-card-head">
                <div><span className="eyebrow">RECENT ROOMS</span><h2>Live usage</h2></div>
                <button className="button ghost compact" onClick={() => void refreshAdminData()} disabled={usageLoading}>
                  {usageLoading ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>
              {usage?.recentRooms.length ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {usage.recentRooms.map(r => (
                    <div key={`${r.code}-${r.createdAt}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                      <strong>{r.code}</strong>
                      <span style={{ color: 'var(--muted)' }}>{r.playerCount} players</span>
                      <span className="status-pill">{r.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-editor" style={{ minHeight: '140px' }}>
                  <p>No rooms created yet.</p>
                </div>
              )}
            </section>

            <section className="admin-card">
              <div className="admin-card-head">
                <div><span className="eyebrow">COMMUNITY</span><h2>Attention queue</h2></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <b style={{ fontSize: '28px' }}>{usage?.pendingSuggestions ?? 0}</b>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>suggestions waiting</p>
                </div>
                <button className="button secondary" onClick={() => setTab('suggestions')}>Review</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0' }}>
                <div>
                  <b style={{ fontSize: '28px' }}>{usage?.openMessages ?? 0}</b>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: '13px' }}>open support tickets</p>
                </div>
                <button className="button secondary" onClick={() => setTab('messages')}>Open inbox</button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {tab === 'games' ? (
        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card-head">
              <div><span className="eyebrow">GAMES</span><h2>{games.length} loaded</h2></div>
              <button className="button primary gnc-game-press" onClick={() => setEditing(blank)}><Plus size={16} /> Add game</button>
            </div>
            <div className="admin-list">
              {games.map(g => (
                <button key={g.id} className={`admin-game-row ${editing?.id === g.id ? 'active' : ''}`} onClick={() => setEditing(g)}>
                  <span className="mini-art"><GameIllustration game={g} /></span>
                  <div>
                    <strong>{g.name}</strong>
                    <small>{g.slug}</small>
                  </div>
                  <ChevronDown size={15} />
                </button>
              ))}
            </div>
          </section>

          <section className="admin-card">
            {editing ? (
              <div>
                <div className="admin-card-head">
                  <div><span className="eyebrow">GAME EDITOR</span><h2>{editing.name}</h2></div>
                  <button className="icon-button" onClick={() => setEditing(null)} aria-label="Close editor"><X size={16} /></button>
                </div>
                <div className="form-grid">
                  <label>Game name<input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label>
                  <label>Behavior<select value={editing.behavior ?? (editing.slug as GameKind)} onChange={e => setEditing({ ...editing, behavior: e.target.value as GameKind })}>{['uno', 'forbidden-number', 'opposite-action', 'race-3', 'sketch', 'find-number', 'guess-leader', 'guess-number', 'ten-seconds', 'memory-drawing', 'race-5', 'wrong-answers', 'contact', 'hsk-cup', 'garbage', 'pressure'].map(x => <option key={x}>{x}</option>)}</select></label>
                  <label>Play mode<select value={editing.playMode ?? 'physical'} onChange={e => setEditing({ ...editing, playMode: e.target.value as 'physical' | 'online' })}><option value="physical">Physical</option><option value="online">Online</option></select></label>
                  <label className="checkbox-field"><input type="checkbox" checked={editing.isSoloFriendly === true} onChange={e => setEditing({ ...editing, isSoloFriendly: e.target.checked })} /> Solo Ready</label>
                  <label>External provider<input value={editing.externalProvider ?? ''} onChange={e => setEditing({ ...editing, externalProvider: e.target.value })} placeholder="e.g. Skribbl.io" /></label>
                  <label>URL slug<input value={editing.slug} readOnly /></label>
                  <label className="full-field">Short description<input value={editing.shortDescription} onChange={e => setEditing({ ...editing, shortDescription: e.target.value })} /></label>
                  <label className="full-field">Description<textarea rows={3} value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} /></label>
                  <label>Score mode<select value={editing.scoreMode} onChange={e => setEditing({ ...editing, scoreMode: e.target.value as any })}><option>points</option><option>race</option><option>manual</option><option>uno</option></select></label>
                  <label>Target score<input type="number" value={editing.targetScore ?? ''} onChange={e => setEditing({ ...editing, targetScore: e.target.value ? Number(e.target.value) : undefined })} /></label>
                  <label className="full-field">Example video URL<input value={editing.exampleUrl ?? ''} onChange={e => setEditing({ ...editing, exampleUrl: e.target.value })} /></label>
                  <label className="full-field">External launch URL<input value={editing.externalLaunchUrl ?? ''} onChange={e => setEditing({ ...editing, externalLaunchUrl: e.target.value })} placeholder="https://…" /></label>
                  <label className="full-field">Instructions<textarea rows={5} value={editing.instructions.join('\n')} onChange={e => setEditing({ ...editing, instructions: e.target.value.split('\n').filter(Boolean) })} /></label>
                  <label className="full-field">Tags<input value={editing.tags.join(', ')} onChange={e => setEditing({ ...editing, tags: e.target.value.split(',').map(x => x.trim()).filter(Boolean) })} /></label>
                </div>
                <button className="button primary full gnc-game-press" style={{ marginTop: '16px' }} onClick={() => void save()}><Check size={16} /> Save Game</button>
              </div>
            ) : (
              <div className="empty-editor">
                <Settings2 size={32} />
                <h2>Select a Game</h2>
                <p>Pick a game from the list to edit rules or add new games.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'suggestions' ? (
        <section className="admin-card">
          <div className="admin-card-head">
            <div><span className="eyebrow">COMMUNITY QUEUE</span><h2>{suggestions.length} suggestions</h2></div>
            <button className="button ghost compact" onClick={() => void refreshAdminData()}>Refresh</button>
          </div>
          {suggestions.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {suggestions.map(s => (
                <SuggestionCard key={s.id} suggestion={s} reviewing={reviewing === s.id} onReview={handleSuggestion} />
              ))}
            </div>
          ) : (
            <div className="empty-editor" style={{ minHeight: '160px' }}>
              <Lightbulb size={28} />
              <p>No game suggestions waiting.</p>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'messages' ? (
        <section className="admin-card">
          <div className="admin-card-head">
            <div><span className="eyebrow">SUPPORT INBOX</span><h2>{messages.length} messages</h2></div>
            <button className="button ghost compact" onClick={() => void refreshAdminData()}>Refresh</button>
          </div>
          {messages.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {messages.map(m => (
                <div key={m.id} style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="status-pill">{m.status}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{m.category} · {new Date(m.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 style={{ margin: '0 0 6px', fontSize: '18px' }}>{m.name} <small style={{ color: 'var(--muted)', fontSize: '13px' }}>{m.email}</small></h3>
                  <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5' }}>{m.message}</p>
                  {m.status === 'open' ? (
                    <button className="button secondary compact" onClick={() => void resolveMessage(m.id)}>
                      <CheckCircle2 size={14} /> Mark resolved
                    </button>
                  ) : (
                    <span style={{ color: 'var(--lime)', fontSize: '12px', fontWeight: '800' }}>✓ Resolved</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-editor" style={{ minHeight: '160px' }}>
              <Inbox size={28} />
              <p>Inbox is empty.</p>
            </div>
          )}
        </section>
      ) : null}

      {message ? <div className="toast">{message}</div> : null}
    </div>
  )
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="metric-card">
      <div className="metric-icon">{icon}</div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function SuggestionCard({
  suggestion,
  reviewing,
  onReview
}: {
  suggestion: GameSuggestion
  reviewing: boolean
  onReview: (s: GameSuggestion, status: 'approved' | 'declined') => void
}) {
  return (
    <article style={{ background: 'var(--surface-2)', padding: '18px', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: '260px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
          <span className="status-pill">{suggestion.status}</span>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>by {suggestion.submitterName} · {new Date(suggestion.createdAt).toLocaleDateString()}</span>
        </div>
        <h3 style={{ margin: '4px 0', fontSize: '20px' }}>{suggestion.name}</h3>
        <p style={{ margin: '0 0 10px', color: 'var(--ink)', fontWeight: '700', fontSize: '13px' }}>{suggestion.shortDescription}</p>
        <p style={{ margin: '0 0 12px', color: 'var(--muted)', fontSize: '13px', lineHeight: '1.5' }}>{suggestion.description}</p>
        <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
          <strong>Setup:</strong> {suggestion.minPlayers ?? 2}+ players · {suggestion.behavior} · {suggestion.scoreMode}
        </div>
      </div>

      {suggestion.status === 'pending' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="button secondary compact gnc-game-press" disabled={reviewing} onClick={() => onReview(suggestion, 'approved')}>
            <ThumbsUp size={14} /> Approve
          </button>
          <button className="button ghost compact" disabled={reviewing} onClick={() => onReview(suggestion, 'declined')}>
            <ThumbsDown size={14} /> Decline
          </button>
        </div>
      ) : (
        <div style={{ alignSelf: 'center', fontWeight: '800', color: suggestion.status === 'approved' ? 'var(--lime)' : 'var(--red)', fontSize: '12px' }}>
          {suggestion.status === 'approved' ? '✓ Approved' : '✗ Declined'}
        </div>
      )}
    </article>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<GamesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/room/:code" element={<RoomPage />} />
          <Route path="/rooms" element={<LiveRoomsPage />} />
          <Route path="/suggest" element={<SuggestGamePage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<PageState title="Page not found" subtle="That route does not exist." back />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  )
}
