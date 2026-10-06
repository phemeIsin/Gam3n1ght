import { Crown, Minus, Plus, Trophy } from 'lucide-react'
import type { Player } from '../types'

export function Scoreboard({players,hostId,onChange,readOnly=false,targetScore}:{players:Player[];hostId?:string;onChange?: (playerId:string,delta:number)=>void;readOnly?:boolean;targetScore?:number}) {
  const sorted = [...players].sort((a,b)=>b.score-a.score)
  return <div className="scoreboard">
    {targetScore ? <div className="target-strip"><Trophy size={15}/> First to <strong>{targetScore}</strong></div> : null}
    {sorted.map((p,i)=><div className="score-row" key={p.id}>
      <div className="rank">{i===0 && p.score>0 ? <Crown size={16}/> : i+1}</div>
      <div className="player-name"><strong>{p.name}</strong>{p.id===hostId ? <span className="host-tag">HOST</span>:null}<span className="score-track"><i style={{width:targetScore?`${Math.min(100,p.score/targetScore*100)}%`:undefined}}/></span></div>
      {!readOnly && onChange ? <div className="score-controls"><button className="icon-button" onClick={()=>onChange(p.id,-1)} disabled={p.score<=0}><Minus size={14}/></button><b>{p.score}</b><button className="icon-button" onClick={()=>onChange(p.id,1)}><Plus size={14}/></button></div> : <b className="score-value">{p.score}</b>}
    </div>)}
    {!players.length && <div className="empty">No players yet.</div>}
  </div>
}
