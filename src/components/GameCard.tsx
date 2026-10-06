import { ArrowRight, ExternalLink, Users } from 'lucide-react'
import type { Game } from '../types'
import { GameIllustration } from './GameIllustration'

export function GameCard({game,onOpen}:{game:Game;onOpen:()=>void}){
  return <article className="game-card">
    <div className="illustration-box"><GameIllustration game={game}/></div>
    <div className="game-card-body"><div className="game-card-meta"><span><Users size={14}/> {game.minPlayers ?? 2}+ players</span>{game.exampleUrl?<span className="example-dot">Example reel</span>:null}</div><h3>{game.name}</h3><p>{game.shortDescription}</p><div className="tags">{game.tags.slice(0,3).map(t=><span key={t}>{t}</span>)}</div><div className="card-actions"><button className="button primary" onClick={onOpen}>Open game <ArrowRight size={16}/></button>{game.exampleUrl?<a className="button ghost" href={game.exampleUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Reel</a>:null}</div></div>
  </article>
}
