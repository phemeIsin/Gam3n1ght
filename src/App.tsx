import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Check, CheckCircle2, ChevronDown, CircleHelp, CircleX, Clipboard, Clock3, Copy, Crown, Download, DoorOpen, ExternalLink, Flame, Gamepad2, Handshake, Hash, Inbox, Info, Lightbulb, LogIn, Menu, MessageCircle, MessageSquareText, Pause, Play, Plus, RotateCcw, Search, Send, Settings2, Share2, Sparkles, ThumbsDown, ThumbsUp, Timer, Trophy, Users, Wifi, X } from 'lucide-react'
import type { Game, GameKind, Player, Prompt, RoomSnapshot } from './types'
import { defaultPrompts } from './games/catalog'
import { loadGames, loadPrompts, saveGame, savePrompt, uploadAnimation } from './lib/content'
import { getAdminUsage, listContactMessages, listGameSuggestions, resolveContactMessage, reviewGameSuggestion, submitContactMessage, submitGameSuggestion, type AdminUsage, type ContactMessage, type GameSuggestion } from './lib/community'
import { changeScore, createRoom, getRoom, joinRoom, subscribeToRoom, updateRoomState } from './lib/rooms'
import { getPlayer, makePlayer, savePlayer } from './lib/storage'
import { getAuthSession, isCurrentUserAdmin, isSupabaseConfigured, signInWithPassword, signOut } from './lib/supabase'
import { DrawingBoard } from './components/DrawingBoard'
import { GameCard } from './components/GameCard'
import { GameIllustration } from './components/GameIllustration'
import { Scoreboard } from './components/Scoreboard'
import './styles.css'

function AppShell({children,onInstall}:{children:ReactNode;onInstall?:()=>void}) {
  const [installAvailable,setInstallAvailable]=useState(false)
  useEffect(()=>{
    const handler=(e:Event)=>{e.preventDefault();(window as any).__pwaPrompt=e;setInstallAvailable(true)}
    window.addEventListener('beforeinstallprompt',handler);return()=>window.removeEventListener('beforeinstallprompt',handler)
  },[])
  const install=async()=>{const p=(window as any).__pwaPrompt;if(!p)return;await p.prompt();setInstallAvailable(false)}
  return <div className="app-shell"><header className="topbar"><Link className="brand" to="/"><span className="brand-mark"><Gamepad2 size={18}/></span><span>Game Night</span></Link><nav><a href="/#games">Games</a><a href="/#how">How it works</a><Link to="/suggest">Suggest a game</Link><Link to="/contact">Contact</Link><Link to="/admin">Creator Studio</Link>{installAvailable?<button className="install-link" onClick={install}><Download size={15}/> Install</button>:null}</nav><div className="status-pill"><span className={isSupabaseConfigured?'live':'demo'}/>{isSupabaseConfigured?'Live rooms':'Demo mode'}</div></header>{children}</div>
}

function useGameCatalog(){
 const [games,setGames]=useState<Game[]>([]);const [loading,setLoading]=useState(true)
 useEffect(()=>{let alive=true;(async()=>{const g=await loadGames();if(alive)setGames(g);setLoading(false)})().catch(()=>setLoading(false));return()=>{alive=false}},[])
 return {games,setGames,loading}
}

function Home(){
 const nav=useNavigate(); const {games,loading}=useGameCatalog(); const [name,setName]=useState(getPlayer()?.name??''); const [joinCode,setJoinCode]=useState(''); const [joinOpen,setJoinOpen]=useState(false); const [selected,setSelected]=useState<Game|null>(null); const [query,setQuery]=useState(''); const [filter,setFilter]=useState('All'); const [error,setError]=useState(''); const [creating,setCreating]=useState(false)
 const filters=['All','Reaction','Drawing','Cards','Numbers','Social']
 const visible=useMemo(()=>games.filter(g=>(filter==='All'||g.tags.some(t=>t.toLowerCase().includes(filter.toLowerCase().replace('drawing','drawing').replace('cards','card').replace('numbers','number').replace('reaction','reaction').replace('social','social'))))&&(!query||`${g.name} ${g.shortDescription} ${g.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase()))),[games,filter,query])
 function ensurePlayer(){if(!name.trim()){setError('Enter your name first.');return null}const p=getPlayer();const next=p?{...p,name:name.trim()}:{...makePlayer(name.trim())};savePlayer(next);return next}
 async function create(game:Game){setError('');const p=ensurePlayer();if(!p)return;setCreating(true);try{const {room}=await createRoom(game,p);setSelected(null);nav(`/room/${room.code}`)}catch(e){setError(e instanceof Error?e.message:'Could not create room')}finally{setCreating(false)}}
 async function join(){setError('');const p=ensurePlayer();if(!p)return;if(joinCode.trim().length<4){setError('Enter the room code.');return}try{await joinRoom(joinCode.trim(),p);nav(`/room/${joinCode.trim().toUpperCase()}`)}catch(e){setError(e instanceof Error?e.message:'Room not found')}}
 return <div><section className="hero"><div className="hero-copy"><div className="eyebrow"><Sparkles size={14}/> PARTY GAMES · BUILT FOR THE ROOM</div><h1>Less scrolling.<br/><span>More playing.</span></h1><p>Pick a game, make a room, send the code. Everyone joins from their own phone while the table plays the real-world game.</p><div className="hero-controls"><label className="field"><span>Your name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. DisCoVar"/></label><button className="button primary" onClick={()=>{setError('');setJoinOpen(true)}}><DoorOpen size={17}/> Join a room</button></div>{joinOpen?<div className="join-panel"><input autoFocus maxLength={6} value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="ROOM CODE"/><button className="button secondary" onClick={join}><LogIn size={16}/> Join</button></div>:null}{error?<div className="error"><CircleHelp size={15}/>{error}</div>:null}<div className="hero-trust"><span><span className="tiny-dot"/> Shareable room codes</span><span><span className="tiny-dot"/> Installable PWA</span><span><span className="tiny-dot"/> Live scoreboard</span></div></div><div className="hero-visual"><div className="room-preview"><div className="room-preview-top"><span>ROOM</span><b>8Q4M7C</b><span className="live-badge"><Wifi size={12}/> LIVE</span></div><div className="preview-title">Get to 3</div><div className="preview-players"><div><span>01</span><strong>DisCoVar</strong><b>3</b></div><div><span>02</span><strong>Takuya</strong><b>2</b></div><div><span>03</span><strong>Gwen</strong><b>1</b></div></div><div className="preview-bottom"><span><Users size={14}/> 3 players</span><span>First to 3</span></div></div><div className="floating-note">Choose a game → share the code → start.</div></div></section>
 <section className="section games-section" id="games"><div className="section-head"><div><div className="eyebrow">GAME LIBRARY</div><h2>Pick the game.</h2></div><span className="count">{games.length} games</span></div><div className="library-toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search games…"/></div><div className="chips">{filters.map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div></div>{loading?<div className="loading-grid">{Array.from({length:8}).map((_,i)=><div className="skeleton" key={i}/>)}</div>:visible.length?<div className="game-grid">{visible.map(g=><GameCard key={g.id} game={g} onOpen={()=>setSelected(g)}/>)}</div>:<div className="empty-state"><Search size={22}/><strong>No games match.</strong><p>Try a different search or category.</p></div>}</section>
 <section className="how" id="how"><div><div className="eyebrow">HOW IT WORKS</div><h2>A phone screen for the stuff your group used to track on paper.</h2><p>Keep the physical game physical. Use Game Night for the part phones are good at: rules, prompts, timers, rooms and scores.</p></div><div className="steps"><div><b>01</b><h3>Create</h3><p>Enter your name, pick a game and get a 6-character room code.</p></div><div><b>02</b><h3>Share</h3><p>Send the link or code to friends. They join from any modern phone.</p></div><div><b>03</b><h3>Play</h3><p>The host controls rounds while the app keeps everyone on the same page.</p></div></div></section>
 <section className="community-promo"><div className="community-promo-art"><MessageCircle size={42}/></div><div><div className="eyebrow">GAME NIGHT × DISCOVAR</div><h2>Don’t just hear about the next game night. Be in the room.</h2><p>Join our WhatsApp community for Game Night updates, new games, event announcements and deals from DisCoVar — a community built around discovering what’s happening and where the good deals are.</p><div className="community-promo-actions"><a className="button primary" href="https://chat.whatsapp.com/Hat53llBovo4gzimIvJPwN" target="_blank" rel="noreferrer"><MessageCircle size={16}/> Join the WhatsApp community</a><Link className="button ghost" to="/suggest"><Lightbulb size={16}/> Suggest a game</Link><Link className="button ghost" to="/contact"><MessageSquareText size={16}/> Contact us</Link></div></div></section>
 {selected?<GameModal game={selected} onClose={()=>setSelected(null)} onCreate={()=>void create(selected)} creating={creating} error={error}/>:null}
 </div>
}

function GameModal({game,onClose,onCreate,creating,error}:{game:Game;onClose:()=>void;onCreate:()=>void;creating:boolean;error:string}){
 return <div className="modal-backdrop" onClick={creating?undefined:onClose}><div className="modal modal-game" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={onClose} disabled={creating} aria-label="Close"><X size={18}/></button><div className="modal-visual"><GameIllustration game={game}/><div><div className="eyebrow">{game.name}</div><h2>{game.shortDescription}</h2><p>{game.description}</p></div></div><div className="rule-grid"><div><strong>How to play</strong>{game.instructions.map((x,i)=><div className="rule" key={x}><span>{i+1}</span><p>{x}</p></div>)}</div><div className="example-panel"><div className="eyebrow">EXAMPLE</div><div className="animation-preview"><GameIllustration game={game}/><span>Face-free visual guide</span></div>{game.exampleUrl?<a className="button ghost full" target="_blank" rel="noreferrer" href={game.exampleUrl}><ExternalLink size={15}/> Watch the original reel</a>:<div className="example-note"><Info size={14}/> No reel link is attached yet. Add one in Creator Studio.</div>}</div></div>{error?<div className="error modal-error"><CircleHelp size={15}/>{error}</div>:null}<div className="modal-actions"><button className="button primary" disabled={creating} onClick={onCreate}>{creating?<><RotateCcw className="spin" size={16}/> Creating room…</>:<><Users size={16}/> Create room</>}</button><button className="button ghost" disabled={creating} onClick={onClose}>Keep browsing</button></div></div></div>
}

function RoomPage(){
  const {code=''} = useParams()
  const nav = useNavigate()
  const {games} = useGameCatalog()
  const [snapshot,setSnapshot] = useState<RoomSnapshot|null>(null)
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const [prompts,setPrompts] = useState<Prompt[]>([])
  const [timer,setTimer] = useState<number|null>(null)
  const player = getPlayer()

useEffect(() => {
  let off = () => {}

  ;(async () => {
    try {
      const s = await getRoom(code)
      setSnapshot(s)
      setLoading(false)

      // Realtime is helpful, but a subscription failure should
      // not make an otherwise valid room look like it is missing.
      try {
        off = subscribeToRoom(s.room, async () => {
          try {
            const refreshed = await getRoom(code)
            setSnapshot(refreshed)
          } catch (e) {
            console.error('REALTIME GET ROOM ERROR:', e)
          }
        })
      } catch (e) {
        console.error('REALTIME SUBSCRIBE ERROR:', e)
      }
    } catch (e) {
      console.error('INITIAL GET ROOM ERROR:', e)
      setError(e instanceof Error ? e.message : 'Room not found')
      setLoading(false)
    }
  })()

  return () => off()
}, [code])

  const game = useMemo(
    () => snapshot ? games.find(g => g.id === snapshot.room.gameId) : null,
    [games,snapshot]
  )

  useEffect(() => {
    if (!game) return

    loadPrompts(game.id)
      .then(setPrompts)
      .catch((e) => {
        console.error('LOAD PROMPTS ERROR:', e)
        setError(e instanceof Error ? e.message : 'Could not load prompts')
      })
  }, [game])

  useEffect(() => {
    if (timer === null) return

    const id = window.setInterval(
      () => setTimer(v => v === null ? null : Math.max(0,v-1)),
      1000
    )

    return () => window.clearInterval(id)
  }, [timer])

  if (loading) {
    return <PageState title="Loading room…" subtle="Connecting to the table."/>
  }

  if (error || !snapshot || !game) {
    return <PageState title="Room not found" subtle={error} back/>
  }

  const isHost = player?.id === snapshot.room.hostId
  const me = snapshot.players.find(p => p.id === player?.id)
  const target = game.targetScore
  const winner = snapshot.players.find(
    p => target && p.score >= target
  )

  async function score(id:string,delta:number){
    try {
      setSnapshot(await changeScore(snapshot!.room,id,delta))
    } catch(e) {
      console.error('CHANGE SCORE ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not update score')
    }
  }

  async function nextPrompt(difficulty?:Prompt['difficulty']){
    try {
      const pool = prompts.filter(
        p => !difficulty || p.difficulty === difficulty
      )
      const list = pool.length ? pool : prompts

      if (!list.length) {
        setError('No prompts are available for this game.')
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
    } catch(e) {
      console.error('NEXT PROMPT ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not load the next prompt')
    }
  }

  async function setStatus(status:'lobby'|'playing'|'finished'){
    try {
      setSnapshot(
        await updateRoomState(
          snapshot!,
          {},
          status
        )
      )
    } catch(e) {
      console.error('UPDATE ROOM STATUS ERROR:', e)
      setError(
        e instanceof Error
          ? e.message
          : 'Could not update room status'
      )
    }
  }

  async function resetScores(){
    try {
      let next = snapshot!

      for(const p of next.players){
        const current = p.score
        if(current) {
          next = await changeScore(next.room,p.id,-current)
        }
      }

      setSnapshot(next)
    } catch(e) {
      console.error('RESET SCORES ERROR:', e)
      setError(e instanceof Error ? e.message : 'Could not reset scores')
    }
  }

  const share = () => {
    const url = window.location.href

    if(navigator.share){
      void navigator.share({
        title:`${game.name} · Game Night`,
        text:`Join my Game Night room ${code.toUpperCase()}`,
        url
      })
    } else {
      void navigator.clipboard?.writeText(url)
    }
  }

  return (
    <div className="room-page">
      <header className="room-header">
        <button className="icon-link" onClick={() => nav('/')}>
          <ArrowLeft size={17}/>
          Games
        </button>

        <div className="room-code-big">
          <span>ROOM</span>
          <b>{code.toUpperCase()}</b>
          <button
            onClick={() => navigator.clipboard?.writeText(code.toUpperCase())}
            aria-label="Copy room code"
          >
            <Copy size={15}/>
          </button>
        </div>

        <button className="button ghost compact" onClick={share}>
          <Share2 size={15}/>
          Share
        </button>
      </header>

      <div className="room-layout">
        <main className="play-main">
          <div className="play-title">
            <div>
              <div className="eyebrow">
                {snapshot.room.status === 'lobby' ? 'LOBBY' : 'NOW PLAYING'}
              </div>
              <h1>{game.name}</h1>
              <p>{game.shortDescription}</p>
            </div>

            <a
              href={game.exampleUrl}
              target="_blank"
              rel="noreferrer"
              className="button ghost compact"
            >
              Example
              <ExternalLink size={14}/>
            </a>
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
        </main>

        <aside className="room-sidebar">
          <div className="side-card">
            <div className="side-head">
              <div>
                <span className="eyebrow">PLAYERS</span>
                <h2>{snapshot.players.length}</h2>
              </div>
              <Users size={18}/>
            </div>

            <div className="player-list">
              {snapshot.players.map((p,i) => (
                <div key={p.id} className="player-chip">
                  <span className="player-index">{i+1}</span>
                  <strong>{p.name}</strong>
                  {p.id === snapshot.room.hostId ? (
                    <span className="host-mini">HOST</span>
                  ) : null}
                </div>
              ))}
            </div>

            {isHost && snapshot.room.status !== 'lobby' ? (
              <button
                className="button ghost full"
                onClick={() => { void setStatus('finished') }}
              >
                Finish game
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

          <div className="tip-card">
            <Flame size={16}/>
            <span>
              Keep the real-world action off the screen. This app is your
              referee, scoreboard and prompt deck.
            </span>
          </div>
        </aside>
      </div>

      {error ? <div className="toast">{error}</div> : null}
    </div>
  )
}
function Lobby({snapshot,game,isHost,onStart,onCopy}:{snapshot:RoomSnapshot;game:Game;isHost:boolean;onStart:()=>void;onCopy:()=>void}){return <div className="lobby-card"><div className="lobby-code"><div className="eyebrow">SEND THIS CODE</div><strong>{snapshot.room.code}</strong><button className="button secondary" onClick={onCopy}><Copy size={15}/> Copy</button></div><div className="lobby-info"><div className="waiting-avatar"><Users size={34}/></div><h2>Waiting for your crew.</h2><p>{snapshot.players.length} player{snapshot.players.length===1?'':'s'} joined. Everyone should see the same room before you start.</p><div className="lobby-names">{snapshot.players.map(p=><span key={p.id}>{p.name}</span>)}</div>{isHost?<button className="button primary big" onClick={onStart}><Play size={18}/> Start {game.name}</button>:<div className="waiting"><Clock3 size={16}/> Waiting for the host to start…</div>}</div></div>}

function GamePanel({game,snapshot,player,isHost,prompts,timer,setTimer,onScore,onNextPrompt,onFinish}:{game:Game;snapshot:RoomSnapshot;player:Player|null;isHost:boolean;prompts:Prompt[];timer:number|null;setTimer:(v:number|null)=>void;onScore:(id:string,d:number)=>void;onNextPrompt:(difficulty?:Prompt['difficulty'])=>void;onFinish:()=>void}){
 const behavior=(game.behavior ?? game.slug) as GameKind; const [selected,setSelected]=useState(snapshot.players[0]?.id??'');const [forbidden,setForbidden]=useState<number>(Number(snapshot.room.state.forbiddenNumber??21));const [guess,setGuess]=useState('');const [unoPoints,setUnoPoints]=useState('10');const [selectedDiff,setSelectedDiff]=useState<Prompt['difficulty']>('easy')
 const chooseWinner=()=>{if(selected){onScore(selected,1)}}
 const hasPrompt=Boolean(snapshot.room.state.activePrompt)
 const target=game.targetScore
 return <div className={`live-game ${game.slug}`}>
   <div className="game-panel-header"><div><span className="eyebrow">ROUND {Math.max(1,snapshot.room.state.round)}</span><h2>{game.name}</h2></div><span className="mode-pill">{game.scoreMode}</span></div>
   {behavior==='sketch'?<><div className="prompt-tools"><div><span className="eyebrow">DRAWING PROMPT</span><h3>{snapshot.room.state.activePrompt?.prompt??'Pick a prompt to begin.'}</h3></div><div className="prompt-controls">{prompts.length?<><button className="button secondary" onClick={()=>onNextPrompt('easy')}>Easy</button><button className="button secondary" onClick={()=>onNextPrompt('medium')}>Medium</button><button className="button secondary" onClick={()=>onNextPrompt('hard')}>Hard</button></>:null}</div></div><DrawingBoard/><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>:
   behavior==='memory-drawing'?<><div className="memory-card"><span className="eyebrow">MEMORY PROMPT</span><div className="memory-illustration"><GameIllustration game={game}/></div><h3>{snapshot.room.state.activePrompt?.prompt??'Choose a reference.'}</h3><p>Show the prompt for 6 seconds, hide it, then draw from memory.</p><div className="prompt-controls"><select value={selectedDiff} onChange={e=>setSelectedDiff(e.target.value as any)}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select><button className="button primary" onClick={()=>onNextPrompt(selectedDiff)}>New reference</button></div></div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>:
   behavior==='forbidden-number'?<><div className="number-trap"><span className="eyebrow">FORBIDDEN NUMBER</span><input className="big-input" type="number" min="1" value={forbidden} onChange={e=>setForbidden(Number(e.target.value)||1)}/><p>Set the losing number before the count starts. Everyone else keeps the sequence going.</p>{isHost&&<button className="button secondary" onClick={()=>void updateRoomState(snapshot,{forbiddenNumber:Number(forbidden)})}><Check size={15}/> Lock number</button>}</div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner} loserLabel="Loser (give them 0)"/></>:
   behavior==='ten-seconds'?<><div className="timer-card"><span className="eyebrow">10.00 SECOND TARGET</span><div className="timer-display">{timer===null?'10.00':`${timer}.00`}</div><div className="round-actions"><button className="button primary" onClick={()=>setTimer(10)}><Timer size={16}/> Start 10s</button><button className="button ghost" onClick={()=>setTimer(null)}><RotateCcw size={16}/> Reset</button></div></div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>:
   behavior==='wrong-answers'||behavior==='contact'?<><div className="prompt-card"><span className="eyebrow">PROMPT DECK</span><h3>{snapshot.room.state.activePrompt?.prompt??(behavior==='wrong-answers'?'What do cows drink?':'apple')}</h3><button className="button secondary" onClick={()=>onNextPrompt()}><ShuffleIcon/> New prompt</button></div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>:
   behavior==='race-3'||behavior==='race-5'?<><div className="race-card"><div className="race-target">{target}</div><div><span className="eyebrow">FIRST TO</span><h3>{target} points</h3><p>Award one point per winning round. The first player to the target wins automatically.</p></div></div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>:
   behavior==='uno'?<><div className="score-entry"><div><span className="eyebrow">UNO HAND</span><h3>Add hand points</h3></div><select value={selected} onChange={e=>setSelected(e.target.value)}>{snapshot.players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" min="0" value={unoPoints} onChange={e=>setUnoPoints(e.target.value)}/><button className="button primary" disabled={!isHost} onClick={()=>onScore(selected,Number(unoPoints)||0)}><Plus size={15}/> Add</button><p>Physical UNO stays on the table. This is the digital scorekeeper.</p></div></>:
   behavior==='hsk-cup'?<><div className="cup-card"><div className="body-calls"><span>HEAD</span><span>SHOULDERS</span><span>KNEES</span><b>CUP</b></div><div className="cup-icon">🥤</div><p>Call the body positions quickly. On “CUP”, grab first without a false start.</p></div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>:
   <><div className="generic-challenge"><GameIllustration game={game}/><div><span className="eyebrow">HOST CONTROL</span><h3>{game.shortDescription}</h3><p>{game.instructions[0]}</p></div></div><WinnerPicker players={snapshot.players} selected={selected} setSelected={setSelected} host={isHost} onWinner={chooseWinner}/></>}
   {hasPrompt&&game.slug!=='sketch'&&game.slug!=='memory-drawing'?<div className="active-prompt"><Info size={14}/><span>Current prompt: <strong>{snapshot.room.state.activePrompt?.prompt}</strong></span></div>:null}
   {isHost?<div className="host-bar"><button className="button ghost" onClick={onFinish}>Finish game</button><span>Host controls are only visible to the room creator.</span></div>:null}
 </div>
}

function ShuffleIcon(){return <RotateCcw size={15}/>}
function WinnerPicker({players,selected,setSelected,host,onWinner,loserLabel='Award point'}:{players:Player[];selected:string;setSelected:(x:string)=>void;host:boolean;onWinner:()=>void;loserLabel?:string}){return <div className="winner-picker"><div><span className="eyebrow">{loserLabel}</span><select value={selected} onChange={e=>setSelected(e.target.value)} disabled={!players.length}>{players.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div><button className="button primary" disabled={!host||!selected} onClick={onWinner}><Plus size={15}/> Award point</button></div>}
function WinnerCard({winner,game,onReset}:{winner:Player;game:Game;onReset:()=>void}){return <div className="winner-card"><div className="winner-icon"><Trophy size={24}/></div><div><span className="eyebrow">GAME OVER</span><h3>{winner.name} wins {game.name}</h3><p>Lock it in, celebrate, then reset for another round.</p></div><button className="button secondary" onClick={onReset}><RotateCcw size={15}/> Rematch</button></div>}
function PageState({title,subtle,back=false}:{title:string;subtle?:string;back?:boolean}){return <div className="center-state"><div className="brand-mark big"><Gamepad2 size={24}/></div><h2>{title}</h2>{subtle?<p>{subtle}</p>:null}{back?<Link className="button primary" to="/">Back to games</Link>:null}</div>}


function FormSection({label,children}:{label:string;children:ReactNode}){return <div className="form-section"><div className="eyebrow">{label}</div>{children}</div>}

function SuggestGamePage(){
 const player=getPlayer(); const [form,setForm]=useState({submitterName:player?.name??'',submitterEmail:'',name:'',shortDescription:'',description:'',instructions:'',exampleUrl:'',scoreMode:'points' as Game['scoreMode'],targetScore:'',minPlayers:'2',supportsTeams:false,behavior:'race-5' as GameKind,tags:'',notes:''}); const [state,setState]=useState<'idle'|'sending'|'sent'>('idle'); const [error,setError]=useState('')
 const update=(key:keyof typeof form,value:unknown)=>setForm(v=>({...v,[key]:value}))
 async function submit(e:FormEvent){e.preventDefault();setError('');if(form.name.trim().length<2||form.description.trim().length<10||!form.submitterName.trim()){setError('Add your name, a game name and a useful description.');return}setState('sending');try{await submitGameSuggestion({submitterName:form.submitterName,submitterEmail:form.submitterEmail, name:form.name, shortDescription:form.shortDescription || form.description.slice(0,120), description:form.description, instructions:form.instructions.split('\n').map(x=>x.trim()).filter(Boolean), exampleUrl:form.exampleUrl, scoreMode:form.scoreMode, behavior:form.behavior, targetScore:form.targetScore?Number(form.targetScore):undefined, minPlayers:Math.max(1,Number(form.minPlayers)||2), supportsTeams:form.supportsTeams, tags:form.tags.split(',').map(x=>x.trim()).filter(Boolean), notes:form.notes});setState('sent')}catch(e){setError(e instanceof Error?e.message:'Could not submit the suggestion');setState('idle')}}
 if(state==='sent')return <div className="plain-page"><div className="success-card"><CheckCircle2 size={42}/><div className="eyebrow">THANK YOU</div><h1>Game suggestion received.</h1><p>The admin team can now review the rules, example link and setup details. Approved games will be added to the public library.</p><div className="success-actions"><Link className="button primary" to="/">Back to games</Link><button className="button ghost" onClick={()=>setState('idle')}>Suggest another game</button></div></div></div>
 return <div className="plain-page"><header className="page-header"><div><div className="eyebrow"><Lightbulb size={14}/> USER CONTRIBUTIONS</div><h1>Suggest a game.</h1><p>Give the admin everything they need to decide whether the game belongs in Game Night. Your suggestion stays private until it is approved.</p></div><Link className="button ghost" to="/"><ArrowLeft size={15}/> Back to app</Link></header><form className="community-form" onSubmit={e=>void submit(e)}><FormSection label="Your details"><div className="form-grid"><label>Name<input value={form.submitterName} onChange={e=>update('submitterName',e.target.value)} placeholder="e.g. DisCoVar"/></label><label>Email (optional)<input type="email" value={form.submitterEmail} onChange={e=>update('submitterEmail',e.target.value)} placeholder="you@example.com"/></label></div></FormSection><FormSection label="Game details"><div className="form-grid"><label>Game name<input value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Rapid Categories"/></label><label>Short description<input value={form.shortDescription} onChange={e=>update('shortDescription',e.target.value)} placeholder="One sentence explaining the fun"/></label><label className="full-field">How the game works<textarea rows={5} value={form.description} onChange={e=>update('description',e.target.value)} placeholder="Explain the objective and what players actually do."/></label><label className="full-field">Instructions<textarea rows={7} value={form.instructions} onChange={e=>update('instructions',e.target.value)} placeholder="One step per line…"/></label><label>Game behavior<select value={form.behavior} onChange={e=>update('behavior',e.target.value as GameKind)}>{['uno','forbidden-number','opposite-action','race-3','sketch','find-number','guess-leader','guess-number','ten-seconds','memory-drawing','race-5','wrong-answers','contact','hsk-cup','garbage','pressure'].map(x=><option key={x}>{x}</option>)}</select></label><label>Score mode<select value={form.scoreMode} onChange={e=>update('scoreMode',e.target.value)}><option value="points">Points</option><option value="race">Race to target</option><option value="manual">Manual scorekeeper</option><option value="uno">UNO-style score</option></select></label><label>Target score (optional)<input type="number" min="1" value={form.targetScore} onChange={e=>update('targetScore',e.target.value)} placeholder="e.g. 5"/></label><label>Minimum players<input type="number" min="1" value={form.minPlayers} onChange={e=>update('minPlayers',e.target.value)}/></label><label className="check-field"><input type="checkbox" checked={form.supportsTeams} onChange={e=>update('supportsTeams',e.target.checked)}/> Works well with teams</label><label className="full-field">Tags<input value={form.tags} onChange={e=>update('tags',e.target.value)} placeholder="reaction, cards, funny"/></label><label className="full-field">Example link (optional)<input value={form.exampleUrl} onChange={e=>update('exampleUrl',e.target.value)} placeholder="Instagram, YouTube or another example link"/></label><label className="full-field">Extra notes for the admin<textarea rows={4} value={form.notes} onChange={e=>update('notes',e.target.value)} placeholder="Things you want the admin to know, scoring quirks, equipment, etc."/></label></div></FormSection>{error?<div className="error"><CircleHelp size={15}/>{error}</div>:null}<div className="form-actions"><button className="button primary big" disabled={state==='sending'} type="submit"><Send size={17}/>{state==='sending'?'Sending…':'Submit game suggestion'}</button><Link className="button ghost" to="/">Cancel</Link></div></form></div>
}

function ContactPage(){
 const [form,setForm]=useState({name:getPlayer()?.name??'',email:'',category:'suggestion' as ContactMessage['category'],message:''}); const [state,setState]=useState<'idle'|'sending'|'sent'>('idle'); const [error,setError]=useState('')
 if(state==='sent')return <div className="plain-page"><div className="success-card"><CheckCircle2 size={42}/><div className="eyebrow">MESSAGE SENT</div><h1>Thanks for reaching out.</h1><p>We’ve logged your message for the Game Night team. For game ideas, use the dedicated suggestion form so they reach the approval queue.</p><Link className="button primary" to="/">Back to games</Link></div></div>
 async function submit(e:FormEvent){e.preventDefault();setError('');if(!form.name.trim()||form.message.trim().length<6){setError('Add your name and a little more detail so we can actually help.');return}setState('sending');try{await submitContactMessage({name:form.name,email:form.email,category:form.category,message:form.message});setState('sent')}catch(e){setError(e instanceof Error?e.message:'Could not send your message');setState('idle')}}
 return <div className="plain-page"><header className="page-header"><div><div className="eyebrow"><MessageSquareText size={14}/> SUPPORT & FEEDBACK</div><h1>Contact us.</h1><p>Broken room? Something confusing? Partnership idea? Tell us. This form is for anything that is <em>not</em> a game submission.</p></div><Link className="button ghost" to="/"><ArrowLeft size={15}/> Back to app</Link></header><form className="community-form narrow" onSubmit={e=>void submit(e)}><FormSection label="Your details"><div className="form-grid"><label>Name<input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} placeholder="e.g. DisCoVar"/></label><label>Email (optional)<input type="email" value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} placeholder="you@example.com"/></label><label>Reason<select value={form.category} onChange={e=>setForm(v=>({...v,category:e.target.value as ContactMessage['category']}))}><option value="bug">Report a bug</option><option value="complaint">Complaint</option><option value="suggestion">General suggestion</option><option value="partnership">Partnership</option><option value="other">Something else</option></select></label><label className="full-field">Message<textarea rows={8} value={form.message} onChange={e=>setForm(v=>({...v,message:e.target.value}))} placeholder="Tell us what happened or what you would like to see…"/></label></div></FormSection>{error?<div className="error"><CircleHelp size={15}/>{error}</div>:null}<div className="form-actions"><button className="button primary big" disabled={state==='sending'} type="submit"><Send size={17}/>{state==='sending'?'Sending…':'Send message'}</button></div></form></div>
}

function AdminPage(){
 const nav=useNavigate(); const {games,setGames}=useGameCatalog();
 const [editing,setEditing]=useState<Game|null>(null); const [message,setMessage]=useState(''); const [promptGame,setPromptGame]=useState('g05'); const [prompt,setPrompt]=useState(''); const [uploading,setUploading]=useState(false);
 const [checking,setChecking]=useState(isSupabaseConfigured); const [sessionEmail,setSessionEmail]=useState(''); const [isAdmin,setIsAdmin]=useState(!isSupabaseConfigured); const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [authError,setAuthError]=useState('');
 const [tab,setTab]=useState<'overview'|'games'|'suggestions'|'messages'>('overview'); const [suggestions,setSuggestions]=useState<GameSuggestion[]>([]); const [messages,setMessages]=useState<ContactMessage[]>([]); const [usage,setUsage]=useState<AdminUsage|null>(null); const [usageLoading,setUsageLoading]=useState(false); const [reviewing,setReviewing]=useState<string|null>(null);
 const blank:Game={id:`custom-${crypto.randomUUID()}`,slug:'race-5',name:'New Game',shortDescription:'Short description',description:'What happens in this game.',instructions:['Explain step one.','Explain step two.','Explain how someone wins.'],scoreMode:'points',animationKey:'default',tags:['party']}
 useEffect(()=>{if(!isSupabaseConfigured)return;void refreshAuth()},[])
 useEffect(()=>{if(!isAdmin)return;void refreshAdminData()},[isAdmin])
 async function refreshAuth(){setChecking(true);setAuthError('');try{const session=await getAuthSession();setSessionEmail(session ? (session.user.email ?? '') : '');if(session){setIsAdmin(await isCurrentUserAdmin())}}catch(e){setAuthError(e instanceof Error?e.message:'Could not check admin access')}finally{setChecking(false)}}
 async function refreshAdminData(){setUsageLoading(true);try{const [u,s,m]=await Promise.all([getAdminUsage(),listGameSuggestions(),listContactMessages()]);setUsage(u);setSuggestions(s);setMessages(m)}catch(e){setMessage(e instanceof Error?e.message:'Could not load admin data')}finally{setUsageLoading(false)}}
 async function login(){setAuthError('');try{const session=await signInWithPassword(email.trim(),password);setSessionEmail(session.user.email??'');setIsAdmin(await isCurrentUserAdmin())}catch(e){setAuthError(e instanceof Error?e.message:'Could not sign in')}}
 async function logout(){try{await signOut();setSessionEmail('');setIsAdmin(false)}catch(e){setAuthError(e instanceof Error?e.message:'Could not sign out')}}
 async function save(){if(!editing)return;try{await saveGame(editing);const next=await loadGames();setGames(next);setMessage('Game saved.')}catch(e){setMessage(e instanceof Error?e.message:'Could not save game')}}
 async function addPrompt(){if(!prompt.trim())return;const p:Prompt={id:`prompt-${crypto.randomUUID()}`,gameId:promptGame,prompt:prompt.trim()};try{await savePrompt(p);setPrompt('');setMessage('Prompt added.')}catch(e){setMessage(e instanceof Error?e.message:'Could not add prompt')}}
 async function upload(file:File){if(!editing)return;setUploading(true);try{const url=await uploadAnimation(editing.id,file);const next={...editing,exampleUrl:editing.exampleUrl??url};setEditing(next);await saveGame(next);setMessage('Asset uploaded.')}catch(e){setMessage(e instanceof Error?e.message:'Upload failed')}finally{setUploading(false)}}
 async function handleSuggestion(s:GameSuggestion,status:'approved'|'declined'){setReviewing(s.id);try{if(status==='approved'){const kind=s.behavior;const slug=`custom-${s.name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)}-${Date.now().toString(36)}`;const newGame:Game={id:`custom-${crypto.randomUUID()}`,slug,behavior:kind,name:s.name,shortDescription:s.shortDescription,description:s.description,instructions:s.instructions,exampleUrl:s.exampleUrl,scoreMode:s.scoreMode,targetScore:s.targetScore,minPlayers:s.minPlayers,supportsTeams:s.supportsTeams,animationKey:'default',tags:s.tags};await saveGame(newGame)}await reviewGameSuggestion(s.id,status,status==='declined'?'Declined by admin.':'Approved and added to the game library.');await refreshAdminData();setMessage(status==='approved'?'Suggestion approved and added to the library.':'Suggestion declined.')}catch(e){setMessage(e instanceof Error?e.message:'Could not review suggestion')}finally{setReviewing(null)}}
 async function resolveMessage(id:string){try{await resolveContactMessage(id);await refreshAdminData();setMessage('Message marked resolved.')}catch(e){setMessage(e instanceof Error?e.message:'Could not resolve message')}}
 if(checking)return <PageState title="Checking Creator Studio…" subtle="Verifying your account permissions."/>
 if(isSupabaseConfigured&&!sessionEmail)return <div className="admin-page"><header className="admin-header"><div><div className="eyebrow">CREATOR STUDIO</div><h1>Admin sign in.</h1><p>Game editing, moderation and system usage are protected by Supabase Auth + admin RLS.</p></div><button className="button ghost" onClick={()=>nav('/')}><ArrowLeft size={15}/> Back to app</button></header><section className="admin-card auth-card"><div className="admin-card-head"><div><span className="eyebrow">SECURE ACCESS</span><h2>Sign in to continue</h2></div><Settings2 size={20}/></div><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password"/></label>{authError?<div className="error"><CircleHelp size={15}/>{authError}</div>:null}<button className="button primary full" onClick={()=>void login()}><LogIn size={16}/> Sign in</button></section></div>
 if(isSupabaseConfigured&&!isAdmin)return <div className="admin-page"><header className="admin-header"><div><div className="eyebrow">CREATOR STUDIO</div><h1>Access denied.</h1><p>{sessionEmail||'Signed-in user'} is authenticated, but is not an admin.</p></div><div className="admin-header-actions"><button className="button ghost" onClick={()=>void logout()}><LogIn size={15}/> Sign out</button><button className="button ghost" onClick={()=>nav('/')}><ArrowLeft size={15}/> Back to app</button></div></header><section className="admin-card auth-card"><CircleHelp size={28}/><h2>Admin membership required</h2><p>Add the authenticated user UUID to <code>public.admin_users</code> in the Supabase SQL editor, then return here.</p></section></div>
 return <div className="admin-page"><header className="admin-header"><div><div className="eyebrow"><BarChart3 size={14}/> ADMIN CONSOLE</div><h1>Run the platform.</h1><p>Manage games, review community submissions, handle support messages and watch usage without touching production data directly.</p></div><div className="admin-header-actions">{isSupabaseConfigured?<button className="button ghost" onClick={()=>void logout()}><LogIn size={15}/> Sign out</button>:null}<button className="button ghost" onClick={()=>nav('/')}><ArrowLeft size={15}/> Back to app</button></div></header><div className="admin-tabs">{([['overview','Overview',BarChart3],['games','Games',Gamepad2],['suggestions','Suggestions',Lightbulb],['messages','Messages',Inbox]] as const).map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={15}/>{label}{id==='suggestions'&&usage?.pendingSuggestions? <span className="tab-count">{usage.pendingSuggestions}</span>:null}{id==='messages'&&usage?.openMessages?<span className="tab-count">{usage.openMessages}</span>:null}</button>)}</div>
 {tab==='overview'?<div className="admin-overview"><div className="metrics-grid"><Metric label="Games" value={usage?.totalGames??games.length} icon={<Gamepad2 size={18}/>} /><Metric label="Rooms / 24h" value={usage?.roomsLast24h??0} icon={<DoorOpen size={18}/>} /><Metric label="Players / 24h" value={usage?.playersLast24h??0} icon={<Users size={18}/>} /><Metric label="Pending suggestions" value={usage?.pendingSuggestions??0} icon={<Lightbulb size={18}/>} /><Metric label="Open support" value={usage?.openMessages??0} icon={<Inbox size={18}/>} /><Metric label="All rooms" value={usage?.totalRooms??0} icon={<Wifi size={18}/>} /></div><div className="admin-grid overview-grid"><section className="admin-card"><div className="admin-card-head"><div><span className="eyebrow">RECENT ROOMS</span><h2>Live usage</h2></div><button className="button ghost compact" onClick={()=>void refreshAdminData()} disabled={usageLoading}>{usageLoading?'Refreshing…':'Refresh'}</button></div>{usage?.recentRooms.length?<div className="usage-table">{usage.recentRooms.map(r=><div className="usage-row" key={`${r.code}-${r.createdAt}`}><strong>{r.code}</strong><span>{games.find(g=>g.id===r.gameId)?.name??r.gameId}</span><span>{r.playerCount} players</span><span>{r.status}</span></div>)}</div>:<div className="empty-editor small"><BarChart3 size={25}/><p>No rooms have been created yet.</p></div>}</section><section className="admin-card"><div className="admin-card-head"><div><span className="eyebrow">COMMUNITY</span><h2>Attention queue</h2></div></div><div className="queue-card"><div><b>{usage?.pendingSuggestions??0}</b><span>game suggestions waiting for review</span></div><button className="button secondary" onClick={()=>setTab('suggestions')}>Review</button></div><div className="queue-card"><div><b>{usage?.openMessages??0}</b><span>support messages waiting for a response</span></div><button className="button secondary" onClick={()=>setTab('messages')}>Open inbox</button></div></section></div><div className="admin-card admin-note-card"><Info size={16}/><div><strong>Operational view</strong><p>This is the starting point for system usage. Before a large public launch, add stronger analytics/event logging, scheduled expiry cleanup and rate-limit telemetry around room creation and submissions.</p></div></div></div>:null}
 {tab==='games'?<div className="admin-grid"><section className="admin-card"><div className="admin-card-head"><div><span className="eyebrow">GAMES</span><h2>{games.length} loaded</h2></div><button className="button primary" onClick={()=>setEditing(blank)}><Plus size={16}/> Add game</button></div><div className="admin-list">{games.map(g=><button key={g.id} className={`admin-game-row ${editing?.id===g.id?'active':''}`} onClick={()=>setEditing(g)}><span className="mini-art"><GameIllustration game={g}/></span><span><strong>{g.name}</strong><small>{g.slug}</small></span><ChevronDown size={15}/></button>)}</div></section><section className="admin-card editor">{editing?<><div className="admin-card-head"><div><span className="eyebrow">EDITOR</span><h2>{editing.name}</h2></div><button className="icon-button" onClick={()=>setEditing(null)} aria-label="Close editor"><X size={16}/></button></div><div className="form-grid"><label>Game name<input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})}/></label><label>Game behavior<select value={editing.behavior ?? (editing.slug as GameKind)} onChange={e=>setEditing({...editing,behavior:e.target.value as GameKind})}>{['uno','forbidden-number','opposite-action','race-3','sketch','find-number','guess-leader','guess-number','ten-seconds','memory-drawing','race-5','wrong-answers','contact','hsk-cup','garbage','pressure'].map(x=><option key={x}>{x}</option>)}</select></label><label>URL slug<input value={editing.slug} readOnly/></label><label className="full-field">Short description<input value={editing.shortDescription} onChange={e=>setEditing({...editing,shortDescription:e.target.value})}/></label><label className="full-field">Description<textarea rows={3} value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})}/></label><label>Score mode<select value={editing.scoreMode} onChange={e=>setEditing({...editing,scoreMode:e.target.value as Game['scoreMode']})}><option>points</option><option>race</option><option>manual</option><option>uno</option></select></label><label>Target score<input type="number" value={editing.targetScore??''} onChange={e=>setEditing({...editing,targetScore:e.target.value?Number(e.target.value):undefined})}/></label><label className="full-field">Example link<input value={editing.exampleUrl??''} onChange={e=>setEditing({...editing,exampleUrl:e.target.value})} placeholder="https://instagram.com/reel/..."/></label><label className="full-field">Instructions<textarea rows={5} value={editing.instructions.join('\n')} onChange={e=>setEditing({...editing,instructions:e.target.value.split('\n').filter(Boolean)})}/></label><label className="full-field">Tags<input value={editing.tags.join(', ')} onChange={e=>setEditing({...editing,tags:e.target.value.split(',').map(x=>x.trim()).filter(Boolean)})}/></label></div><div className="asset-box"><div><span className="eyebrow">FACE-FREE EXAMPLE ASSET</span><p>Upload a neutral animation or illustration rather than the original people-on-camera clip.</p></div><label className="button secondary">{uploading?'Uploading…':'Upload animation'}<input type="file" accept="video/*,image/gif,image/png,image/jpeg" hidden disabled={uploading} onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f)}}/></label></div><button className="button primary full" onClick={()=>void save()}><Check size={16}/> Save game</button></>:<div className="empty-editor"><Settings2 size={28}/><h2>Select a game</h2><p>Choose a game from the list or add a new one.</p></div>}</section><section className="admin-card prompts"><div className="admin-card-head"><div><span className="eyebrow">PROMPT DECK</span><h2>Add prompts</h2></div></div><div className="prompt-form"><select value={promptGame} onChange={e=>setPromptGame(e.target.value)}>{games.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select><input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="e.g. giraffe at a bus stop"/><button className="button primary" onClick={()=>void addPrompt()}><Plus size={15}/> Add</button></div><div className="prompt-hints">{defaultPrompts.filter(p=>p.gameId===promptGame).slice(0,8).map(p=><span key={p.id}>{p.prompt}</span>)}</div></section></div>:null}
 {tab==='suggestions'?<section className="admin-card full-admin-card"><div className="admin-card-head"><div><span className="eyebrow">COMMUNITY QUEUE</span><h2>{suggestions.length} suggestions</h2></div><button className="button ghost compact" onClick={()=>void refreshAdminData()}>Refresh</button></div>{suggestions.length?<div className="suggestion-list">{suggestions.map(s=><SuggestionCard key={s.id} suggestion={s} reviewing={reviewing===s.id} onReview={handleSuggestion}/>)}</div>:<div className="empty-editor small"><Lightbulb size={25}/><p>No game suggestions yet.</p></div>}</section>:null}
 {tab==='messages'?<section className="admin-card full-admin-card"><div className="admin-card-head"><div><span className="eyebrow">SUPPORT INBOX</span><h2>{messages.length} messages</h2></div><button className="button ghost compact" onClick={()=>void refreshAdminData()}>Refresh</button></div>{messages.length?<div className="message-list">{messages.map(m=><div className={`admin-message ${m.status}`} key={m.id}><div className="message-meta"><span className="status-tag">{m.status}</span><span>{m.category}</span><span>{new Date(m.createdAt).toLocaleString()}</span></div><h3>{m.name}{m.email?<small>{m.email}</small>:null}</h3><p>{m.message}</p>{m.status==='open'?<button className="button secondary compact" onClick={()=>void resolveMessage(m.id)}><CheckCircle2 size={15}/> Mark resolved</button>:<span className="resolved-line"><CheckCircle2 size={14}/> Resolved</span>}</div>)}</div>:<div className="empty-editor small"><Inbox size={25}/><p>No support messages yet.</p></div>}</section>:null}
 {message?<div className="toast">{message}</div>:null}<div className="admin-note"><Info size={15}/><span>Creator Studio is restricted by Supabase Auth and admin RLS. User suggestions and support messages are submitted through guest-authenticated inserts and enter this moderation console.</span></div></div>
}

function Metric({label,value,icon}:{label:string;value:number;icon:ReactNode}){return <div className="metric-card"><div className="metric-icon">{icon}</div><strong>{value}</strong><span>{label}</span></div>}
function SuggestionCard({suggestion,reviewing,onReview}:{suggestion:GameSuggestion;reviewing:boolean;onReview:(s:GameSuggestion,status:'approved'|'declined')=>void}){return <article className={`suggestion-card ${suggestion.status}`}><div className="suggestion-main"><div className="message-meta"><span className={`status-tag ${suggestion.status}`}>{suggestion.status}</span><span>{new Date(suggestion.createdAt).toLocaleString()}</span><span>by {suggestion.submitterName}</span></div><h3>{suggestion.name}</h3><p className="suggestion-short">{suggestion.shortDescription}</p><p>{suggestion.description}</p><div className="suggestion-grid"><div><strong>Instructions</strong><ol>{suggestion.instructions.map(x=><li key={x}>{x}</li>)}</ol></div><div><strong>Setup</strong><p>{suggestion.minPlayers ?? 2}+ players · {suggestion.behavior} · {suggestion.scoreMode}{suggestion.targetScore?` · target ${suggestion.targetScore}`:''}{suggestion.supportsTeams?' · teams':''}</p><p>Tags: {suggestion.tags.join(', ')||'—'}</p>{suggestion.exampleUrl?<a className="inline-link" href={suggestion.exampleUrl} target="_blank" rel="noreferrer"><ExternalLink size={13}/> Example</a>:null}</div></div>{suggestion.notes?<div className="suggestion-note"><Info size={14}/>{suggestion.notes}</div>:null}</div>{suggestion.status==='pending'?<div className="suggestion-actions"><button className="button secondary" disabled={reviewing} onClick={()=>onReview(suggestion,'approved')}><ThumbsUp size={15}/>{reviewing?'Working…':'Approve'}</button><button className="button ghost" disabled={reviewing} onClick={()=>onReview(suggestion,'declined')}><ThumbsDown size={15}/> Decline</button></div>:<div className="reviewed-badge">{suggestion.status==='approved'?<CheckCircle2 size={16}/>:<CircleX size={16}/>} {suggestion.status}</div>}</article>}

export default function App(){return <BrowserRouter><AppShell><Routes><Route path="/" element={<Home/>}/><Route path="/room/:code" element={<RoomPage/>}/><Route path="/suggest" element={<SuggestGamePage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="*" element={<PageState title="Page not found" subtle="That route does not exist." back/>}/></Routes></AppShell></BrowserRouter>}
