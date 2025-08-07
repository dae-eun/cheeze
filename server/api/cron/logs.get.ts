import { createClient } from '@supabase/supabase-js'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

export default defineEventHandler(async (event) => {
  try {
    // 간단한 인증
    const query = getQuery(event)
    const { secret } = query

    if (secret !== config.cronSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증 실패'
      })
    }

    // 최근 7일간의 cron 실행 로그 조회
    const { data: logs, error } = await supabaseAdmin
      .from('cron_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch cron logs:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '로그 조회에 실패했습니다.'
      })
    }

    return {
      success: true,
      logs: logs || [],
      count: logs?.length || 0
    }

  } catch (error) {
    console.error('Cron logs error:', error)
    throw error
  }
})
