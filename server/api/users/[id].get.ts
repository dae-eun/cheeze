import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)
    
    const userId = getRouterParam(event, 'id')
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: '사용자 ID가 필요합니다.'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 정보를 가져오는 중 오류가 발생했습니다.'
      })
    }

    if (!data) {
      throw createError({
        statusCode: 404,
        statusMessage: '사용자를 찾을 수 없습니다.'
      })
    }

    return {
      success: true,
      user: data
    }
  } catch (error) {
    console.error('User API error:', error)
    throw error
  }
}) 