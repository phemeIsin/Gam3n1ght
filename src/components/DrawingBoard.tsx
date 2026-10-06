import { Eraser, RotateCcw } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export function DrawingBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing,setDrawing] = useState(false)
  const [eraser,setEraser] = useState(false)
  useEffect(()=>{ const c=canvasRef.current; if(!c) return; const r=c.getBoundingClientRect(); const dpr=window.devicePixelRatio||1; c.width=r.width*dpr;c.height=r.height*dpr;const ctx=c.getContext('2d');if(!ctx)return;ctx.scale(dpr,dpr);ctx.lineWidth=4;ctx.lineCap='round'; },[])
  const pos=(e:React.PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  function down(e:React.PointerEvent<HTMLCanvasElement>){const c=e.currentTarget;c.setPointerCapture(e.pointerId);const p=pos(e),ctx=c.getContext('2d');if(!ctx)return;ctx.beginPath();ctx.moveTo(p.x,p.y);setDrawing(true)}
  function move(e:React.PointerEvent<HTMLCanvasElement>){if(!drawing)return;const c=e.currentTarget,ctx=c.getContext('2d');if(!ctx)return;const p=pos(e);ctx.globalCompositeOperation=eraser?'destination-out':'source-over';ctx.strokeStyle='#171717';ctx.lineTo(p.x,p.y);ctx.stroke()}
  function clear(){const c=canvasRef.current;if(!c)return; c.getContext('2d')?.clearRect(0,0,c.width,c.height)}
  return <div className="drawing-wrap"><canvas ref={canvasRef} className="drawing-canvas" onPointerDown={down} onPointerMove={move} onPointerUp={()=>setDrawing(false)} onPointerCancel={()=>setDrawing(false)}/><div className="drawing-tools"><button className={`button ghost ${eraser?'selected':''}`} onClick={()=>setEraser(v=>!v)}><Eraser size={16}/> {eraser?'Drawing':'Eraser'}</button><button className="button ghost" onClick={clear}><RotateCcw size={16}/> Clear</button></div></div>
}
