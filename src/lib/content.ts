import type { Game, Prompt } from '../types'
import { defaultGames, defaultPrompts } from '../games/catalog'
import { supabase } from './supabase'
import { loadCustomGames, mergeGames, saveCustomGames } from './storage'

export async function loadGames(): Promise<Game[]> {
  if (!supabase) return mergeGames(defaultGames, loadCustomGames())
  const { data, error } = await supabase.from('games').select('*').order('sort_order')
  if (error || !data?.length) return mergeGames(defaultGames, loadCustomGames())
  return data.map((r:any)=>({
    id:r.id, slug:r.slug, behavior:r.game_kind ?? r.slug, name:r.name, shortDescription:r.short_description, description:r.description,
    instructions:r.instructions ?? [], exampleUrl:r.example_url ?? undefined, scoreMode:r.score_mode ?? 'points',
    targetScore:r.target_score ?? undefined, minPlayers:r.min_players ?? 2, supportsTeams:r.supports_teams ?? false,
    animationKey:r.animation_key ?? 'default', tags:r.tags ?? []
  }))
}

export async function loadPrompts(gameId:string): Promise<Prompt[]> {
  if (!supabase) return defaultPrompts.filter(p=>p.gameId===gameId)
  const { data, error } = await supabase.from('game_prompts').select('*').eq('game_id',gameId).eq('is_active',true).order('created_at')
  if (error || !data?.length) return defaultPrompts.filter(p=>p.gameId===gameId)
  return data.map((r:any)=>({id:r.id,gameId:r.game_id,prompt:r.prompt,category:r.category ?? undefined,difficulty:r.difficulty ?? undefined}))
}

export async function saveGame(game:Game) {
  if (!supabase) { const customs=loadCustomGames(); saveCustomGames([...customs.filter(g=>g.id!==game.id),game]); return game }
  const row={id:game.id,slug:game.slug,game_kind:game.behavior ?? game.slug,name:game.name,short_description:game.shortDescription,description:game.description,instructions:game.instructions,example_url:game.exampleUrl ?? null,score_mode:game.scoreMode,target_score:game.targetScore ?? null,min_players:game.minPlayers ?? 2,supports_teams:game.supportsTeams ?? false,animation_key:game.animationKey,tags:game.tags,sort_order:999}
  const { data, error } = await supabase.from('games').upsert(row).select().single(); if(error) throw error; return data
}

export async function savePrompt(prompt:Prompt) {
  if (!supabase) return prompt
  const { error } = await supabase.from('game_prompts').upsert({id:prompt.id,game_id:prompt.gameId,prompt:prompt.prompt,category:prompt.category ?? null,difficulty:prompt.difficulty ?? null,is_active:true}); if(error) throw error; return prompt
}

export async function uploadAnimation(gameId:string,file:File) {
  if (!supabase) throw new Error('Connect Supabase before uploading assets.')
  const safe=file.name.replace(/[^a-z0-9._-]/gi,'-').toLowerCase()
  const path=`games/${gameId}/${Date.now()}-${safe}`
  const { error } = await supabase.storage.from('game-assets').upload(path,file,{upsert:true,contentType:file.type})
  if(error) throw error
  const { data } = supabase.storage.from('game-assets').getPublicUrl(path)
  return data.publicUrl
}
