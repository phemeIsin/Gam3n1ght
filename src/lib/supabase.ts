import { createClient, type Session, type User } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase = url && key ? createClient(url, key) : null
export const isSupabaseConfigured = Boolean(supabase)

export async function getAuthSession(): Promise<Session | null> {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error
  return data.session
}

export async function ensureGuestSession(): Promise<User> {
  if (!supabase) throw new Error('Supabase is not configured.')

  const existing = await getAuthSession()
  if (existing?.user) return existing.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    const message = error?.message ?? 'Anonymous sign-in is not available.'
    throw new Error(`Guest rooms need Supabase Anonymous Sign-Ins enabled. ${message}`)
  }
  return data.user
}

export async function signInWithPassword(email: string, password: string): Promise<Session> {
  if (!supabase) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session) throw new Error(error?.message ?? 'Could not sign in.')
  return data.session
}

export async function signOut(): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase.rpc('is_admin')
  if (error) throw error
  return data === true
}
;(window as any).supabase = supabase