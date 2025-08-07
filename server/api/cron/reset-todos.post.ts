import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 간단한 인증 (실제 운영환경에서는 더 강력한 인증 필요)
    const body = await readBody(event)
    const { secret } = body

    if (secret !== config.cronSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증 실패'
      })
    }

    // 자동 갱신 함수 실행
    const { data, error } = await supabaseAdmin.rpc('reset_todos_by_cycle')

    if (error) {
      console.error('Reset todos error:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '숙제 갱신에 실패했습니다.'
      })
    }

    return {
      success: true,
      message: '숙제이 성공적으로 갱신되었습니다.',
      timestamp: new Date().toISOString()
    }

  } catch (error) {
    console.error('Cron reset todos error:', error)
    throw error
  }
}) 