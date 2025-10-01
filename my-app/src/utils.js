import { useEffect, useRef } from 'react'

export function useCanvas(draw, deps=[]){
  const ref = useRef(null)
  useEffect(()=>{
    const canvas = ref.current
    const ctx = canvas.getContext('2d')
    let rafId
    let running = true
    const loop = (t)=>{
      if(!running) return
      draw(ctx, canvas, t)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return ()=>{ running=false; cancelAnimationFrame(rafId) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return ref
}
