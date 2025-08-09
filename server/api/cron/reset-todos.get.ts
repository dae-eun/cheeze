import { createClient } from '@supabase/supabase-js'
import { retrySupabaseRPC } from '../../utils/retry'

const config = useRuntimeConfig()
const supabaseAdmin = createClient(config.public.supabaseUrl, config.supabaseServiceKey)

interface CronResponse {
  success: boolean
  message: string
  timestamp: string
  attempts?: number
  totalTimeMs?: number
  error?: string
}

export default defineEventHandler(async (event): Promise<CronResponse> => {
  const startTime = Date.now()
  const requestId = `${startTime}-${Math.random().toString(36).slice(2, 8)}`

  try {
    const headers = event.headers
    const userAgent = (headers.get('user-agent') || '').toLowerCase()

    const query = getQuery(event)
    const secret = (query.secret as string | undefined) || undefined

    const isVercelCron = userAgent.startsWith('vercel-cron/')
    const isSecretParamValid = !!secret && secret === config.cronSecret
    const isAuthorized = isVercelCron || isSecretParamValid

    if (!isAuthorized) {
      throw createError({ statusCode: 401, message: '인증 실패' })
    }

    console.log('🕕 Starting todo reset cron job (GET)...', {
      requestId,
      source: isVercelCron ? 'vercel' : (isSecretParamValid ? 'manual' : 'unknown')
    })


    const result = await retrySupabaseRPC(
      async () => {
        const { data, error } = await supabaseAdmin.rpc('reset_todos_by_cycle')
        return { data, error }
      },
      {
        maxAttempts: 3,
        delayMs: 2000,
        backoffMultiplier: 2,
        maxDelayMs: 10000
      }
    )

    // 로그 저장
    await supabaseAdmin.from('cron_logs').insert({
      job_name: 'reset_todos_by_cycle',
      status: result.success ? 'success' : 'failed',
      message: result.success
        ? `Todo reset completed successfully [${requestId}]`
        : `Todo reset failed: ${result.error?.message} [${requestId}]`,
      attempts: result.attempts,
      total_time_ms: result.totalTimeMs,
      error_details: result.error?.message || null
    })

    if (!result.success) {
      console.error('❌ Todo reset failed after all retries:', result.error)
      throw createError({
        statusCode: 500,
        message: `숙제 갱신에 실패했습니다. (${result.attempts} attempts)`
      })
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ Todo reset successful after ${result.attempts} attempts (${totalTime}ms) [GET]`)

    return {
      success: true,
      message: `숙제가 성공적으로 갱신되었습니다. (${result.attempts} attempts)` ,
      timestamp: new Date().toISOString(),
      attempts: result.attempts,
      totalTimeMs: totalTime
    }

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('❌ Cron reset todos error (GET):', error)
    return {
      success: false,
      message: '숙제 갱신에 실패했습니다.',
      timestamp: new Date().toISOString(),
      totalTimeMs: totalTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})


