import { supabase } from './supabase'
import { useAuthStore } from '@/store/authStore'

export interface DeployResult {
  success: boolean
  url?: string
  error?: string
}

export async function deployToSupabase(
  htmlContent: string,
  projectId: string
): Promise<DeployResult> {
  if (!supabase) {
    return {
      success: false,
      error: 'Supabase is not configured. Add env variables first.',
    }
  }

  try {
    const user = useAuthStore.getState().user
    if (!user) {
      return { success: false, error: 'You must be logged in to deploy.' }
    }

    // Convert HTML string to a Blob
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const path = `${user.id}/${projectId}/index.html`

    // Upload to Supabase Storage (upsert true to overwrite)
    const { error: uploadError } = await supabase.storage
      .from('sites')
      .upload(path, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'text/html;charset=utf-8'
      })

    if (uploadError) throw uploadError

    // Get the public URL
    const { data } = supabase.storage.from('sites').getPublicUrl(path)
    if (!data?.publicUrl) {
      throw new Error('Failed to generate public URL')
    }

    return {
      success: true,
      url: data.publicUrl
    }
  } catch (err: any) {
    console.error('Supabase deploy error:', err)
    return {
      success: false,
      error: err.message || 'An error occurred during deployment'
    }
  }
}
