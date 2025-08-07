import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)
    
    const userId = getRouterParam(event, 'id')
    const body = await readBody(event)
    
    if (!userId) {
      throw createError({
        statusCode: 400,
        statusMessage: '사용자 ID가 필요합니다.'
      })
    }

    if (!body.name) {
      throw createError({
        statusCode: 400,
        statusMessage: '이름이 필요합니다.'
      })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ name: body.name })
      .eq('id', userId)
      .select('id, name, email')
      .maybeSingle()

    if (error) {
      console.error('Error updating user:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '사용자 정보를 업데이트하는 중 오류가 발생했습니다.'
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
    console.error('User update API error:', error)
    throw error
  }
}) 