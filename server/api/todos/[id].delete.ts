import { createClient } from '@supabase/supabase-js'
import { getTokenFromCookie, verifyAccessToken } from '../../utils/auth'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 인증 확인
    const token = getTokenFromCookie(event, 'access_token')
    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증이 필요합니다.'
      })
    }

    const user = await verifyAccessToken(token)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: '유효하지 않은 토큰입니다.'
      })
    }

    const todoId = getRouterParam(event, 'id')

    // 숙제목록 존재 확인 및 권한 확인
    const { data: existingTodo, error: fetchError } = await supabaseAdmin
      .from('todos')
      .select('*')
      .eq('id', todoId)
      .single()

    if (fetchError || !existingTodo) {
      throw createError({
        statusCode: 404,
        statusMessage: '숙제목록을 찾을 수 없습니다.'
      })
    }

    // 권한 확인 (본인이 만든 숙제만 삭제 가능)
    if (existingTodo.created_by !== user.user_id) {
      throw createError({
        statusCode: 403,
        statusMessage: '숙제목록을 삭제할 권한이 없습니다.'
      })
    }

    // 숙제목록 삭제
    const { error: deleteError } = await supabaseAdmin
      .from('todos')
      .delete()
      .eq('id', todoId)

    if (deleteError) {
      console.error('Todo delete error:', deleteError)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제목록 삭제에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '숙제목록이 삭제되었습니다.'
    }

  } catch (error) {
    console.error('Delete todo error:', error)
    throw error
  }
}) 