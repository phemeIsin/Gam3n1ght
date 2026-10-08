import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  DoorOpen,
  Gamepad2,
  HelpCircle,
  Laptop,
  Play,
  QrCode,
  Share2,
  Smartphone,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  Wifi
} from 'lucide-react'
import { sound } from '../lib/sound'

export function HowItWorksPage() {
  const steps = [
    {
      num: '01',
      title: 'Choose Any Game from the Library',
      description:
        'Browse 16+ curated party games built for living rooms, college hangouts, and Gam3n1ghts. Whether your group wants rapid reflex challenges, prompt-based sketching, social bluffing, or card score tracking, pick a game and get started in one tap.',
      icon: <Gamepad2 size={26} />,
      badge: 'Step 1 · Pick',
      color: '#8b5cf6'
    },
    {
      num: '02',
      title: 'Create Your Room in 1 Second',
      description:
        'Enter your party nickname and hit "Create Room". You instantly get a unique, clean 6-character room code. No sign-up, no password, no email verification, and no wait time.',
      icon: <DoorOpen size={26} />,
      badge: 'Step 2 · Create',
      color: '#06b6d4'
    },
    {
      num: '03',
      title: 'Invite Friends — Zero App Downloads',
      description:
        'Friends join instantly on their own smartphones via mobile Safari, Chrome, or any browser by opening the link or typing your room code. Works on iOS, Android, laptops, and tablets alike.',
      icon: <Users size={26} />,
      badge: 'Step 3 · Join',
      color: '#10b981'
    },
    {
      num: '04',
      title: 'Real-World Fun, Digital Superpowers',
      description:
        'Keep the banter and physical game on the table! The app takes care of everything that usually slows down party games: rotating prompt decks, countdown buzzers, synchronized rounds, and live leaderboards.',
      icon: <Trophy size={26} />,
      badge: 'Step 4 · Play',
      color: '#f59e0b'
    }
  ]

  const comparisons = [
    {
      feature: 'Setup Time',
      traditional: '10–20 mins reading rulebooks & counting pieces',
      gameNight: '30 seconds: open room code, everyone joins'
    },
    {
      feature: 'Pencils & Scorepads',
      traditional: 'Lost pens, arguing over paper scores',
      gameNight: 'Live synchronized scoreboard on every phone'
    },
    {
      feature: 'Timers & Buzzers',
      traditional: 'Clunky stopwatch apps or guessing elapsed time',
      gameNight: 'Built-in audio countdown with synchronized buzzer'
    },
    {
      feature: 'Screen Staring',
      traditional: 'Video games force everyone to stare at a TV',
      gameNight: 'Phones are just guides; eye contact stays in the room'
    }
  ]

  const faqs = [
    {
      q: 'Do other players need to install an app or create an account?',
      a: 'No! Nobody needs to install anything or sign up. They simply open your room link or enter the 6-character room code in their phone browser.'
    },
    {
      q: 'How many players can join a room?',
      a: 'Most games work great with 2 to 12+ players. You can also play solo-friendly games alone or run a room with a large group of spectators.'
    },
    {
      q: 'Can the host switch games without making everyone reconnect?',
      a: 'Yes! The room host has a "Change Game" button in the top navigation of the room that instantly updates the game for all connected players while keeping current players connected.'
    },
    {
      q: 'Can I add our own party rules or submit a custom game?',
      a: 'Absolutely. Head over to Creator Studio to tweak rules, or use the "Suggest a Game" form to submit games and prompt cards to our library.'
    }
  ]

  return (
    <div className="how-page">
      {/* Header Banner */}
      <header className="page-header how-header">
        <div>
          <div className="hero-pill-badge" style={{ marginBottom: '14px' }}>
            <Sparkles size={14} /> THE SIMPLE GUIDE
          </div>
          <h1>How Gam3n1ght Works.</h1>
          <p>
            Keep the physical game physical. Use phones for what they do best:
            timers, prompts, synchronized rounds, and zero-math scoring.
          </p>
        </div>
        <Link className="button ghost" to="/games" onClick={() => sound.playTap()}>
          <ArrowLeft size={16} /> Back to Games
        </Link>
      </header>

      {/* Step by Step Progression */}
      <section className="how-steps-section">
        <div className="section-head" style={{ marginBottom: '24px' }}>
          <div>
            <div className="eyebrow">FOUR SIMPLE STEPS</div>
            <h2>From table setup to first round in 60 seconds.</h2>
          </div>
        </div>

        <div className="how-steps-grid">
          {steps.map(step => (
            <div className="how-step-card theme-dark-surface" key={step.num}>
              <div className="how-step-top">
                <span className="how-step-num">{step.num}</span>
                <span className="how-step-badge" style={{ borderColor: `${step.color}55`, color: step.color }}>
                  {step.badge}
                </span>
              </div>
              <div className="how-step-icon" style={{ color: step.color }}>
                {step.icon}
              </div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Hybrid Gaming Beats Both */}
      <section className="how-compare-section">
        <div className="section-head" style={{ marginBottom: '20px' }}>
          <div>
            <div className="eyebrow">THE PHILOSOPHY</div>
            <h2>Why Hybrid Party Games are Better.</h2>
          </div>
        </div>

        <div className="compare-table-wrapper theme-dark-surface">
          <div className="compare-row compare-header-row">
            <span>Scenario</span>
            <span>Old School / Paper Games</span>
            <span style={{ color: 'var(--lime-bright)' }}>Gam3n1ght Experience</span>
          </div>
          {comparisons.map(item => (
            <div className="compare-row" key={item.feature}>
              <strong>{item.feature}</strong>
              <span className="text-muted">{item.traditional}</span>
              <span className="text-highlight">
                <CheckCircle2 size={16} color="var(--lime)" /> {item.gameNight}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="how-faq-section">
        <div className="section-head" style={{ marginBottom: '20px' }}>
          <div>
            <div className="eyebrow">FREQUENTLY ASKED</div>
            <h2>Got Questions? We’ve got answers.</h2>
          </div>
        </div>

        <div className="faq-grid">
          {faqs.map(faq => (
            <div className="faq-card theme-dark-surface" key={faq.q}>
              <div className="faq-question">
                <HelpCircle size={18} color="var(--accent)" />
                <h4>{faq.q}</h4>
              </div>
              <p>{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom Call to Action */}
      <section className="how-cta-banner">
        <h2>Ready to host tonight's game?</h2>
        <p>Pick a game, create your table, and share your room code with your crew.</p>
        <div className="how-cta-actions">
          <Link
            to="/games"
            className="button primary big gnc-game-press"
            onClick={() => sound.playTap()}
          >
            <Play size={16} fill="currentColor" /> Browse Games & Start
          </Link>
          <Link
            to="/suggest"
            className="button secondary big gnc-game-press"
            onClick={() => sound.playTap()}
          >
            Suggest a New Game
          </Link>
        </div>
      </section>
    </div>
  )
}
