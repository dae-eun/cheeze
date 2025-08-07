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
  
  try {
    // Vercel Cron Jobs는 자동으로 인증됨
    // 수동 호출 시에만 secret 체크
    const body = await readBody(event)
    const { secret } = body || {}

    // Vercel Cron Jobs에서 호출된 경우 secret 체크 생략
    const isVercelCron = event.headers.get('x-vercel-cron') === '1'
    
    if (!isVercelCron && secret !== config.cronSecret) {
      throw createError({
        statusCode: 401,
        statusMessage: '인증 실패'
      })
    }

    console.log('🕕 Starting todo reset cron job...')

    // 재시도 로직을 포함한 자동 갱신 함수 실행
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
      message: result.success ? 'Todo reset completed successfully' : `Todo reset failed: ${result.error?.message}`,
      attempts: result.attempts,
      total_time_ms: result.totalTimeMs,
      error_details: result.error?.message || null
    })

    if (!result.success) {
      console.error('❌ Todo reset failed after all retries:', result.error)
      throw createError({
        statusCode: 500,
        statusMessage: `숙제 갱신에 실패했습니다. (${result.attempts} attempts)`
      })
    }

    const totalTime = Date.now() - startTime
    console.log(`✅ Todo reset successful after ${result.attempts} attempts (${totalTime}ms)`)

    return {
      success: true,
      message: `숙제가 성공적으로 갱신되었습니다. (${result.attempts} attempts)`,
      timestamp: new Date().toISOString(),
      attempts: result.attempts,
      totalTimeMs: totalTime
    }

  } catch (error) {
    const totalTime = Date.now() - startTime
    console.error('❌ Cron reset todos error:', error)
    
    return {
      success: false,
      message: '숙제 갱신에 실패했습니다.',
      timestamp: new Date().toISOString(),
      totalTimeMs: totalTime,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}) 