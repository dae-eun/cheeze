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

    const { data: characters, error } = await supabaseAdmin
      .from('characters')
      .select(`
        id,
        name,
        server_id,
        is_main,
        created_at,
        updated_at,
        servers(name)
      `)
      .eq('user_id', user.user_id)
      .order('is_main', { ascending: false })

    if (error) {
      console.error('Character fetch error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '캐릭터 조회 중 오류가 발생했습니다.'
      })
    }

    return {
      success: true,
      characters: characters || []
    }

  } catch (error) {
    console.error('Character fetch error:', error)
    throw error
  }
}) 