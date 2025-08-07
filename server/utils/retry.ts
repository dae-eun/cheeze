interface RetryOptions {
  maxAttempts?: number
  delayMs?: number
  backoffMultiplier?: number
  maxDelayMs?: number
}

interface RetryResult<T> {
  success: boolean
  data?: T
  error?: Error
  attempts: number
  totalTimeMs: number
}

/**
 * 재시도 로직을 포함한 함수 실행
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 10000
  } = options

  const startTime = Date.now()
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn()
      return {
        success: true,
        data,
        attempts: attempt,
        totalTimeMs: Date.now() - startTime
      }
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxAttempts) {
        break
      }

      // 지수 백오프로 대기 시간 계산
      const waitTime = Math.min(
        delayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      )

      console.log(`Attempt ${attempt} failed, retrying in ${waitTime}ms...`)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: maxAttempts,
    totalTimeMs: Date.now() - startTime
  }
}

/**
 * Supabase RPC 호출을 위한 재시도 래퍼
 */
export async function retrySupabaseRPC<T>(
  rpcCall: () => Promise<{ data: T | null; error: any }>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  return withRetry(async () => {
    const result = await rpcCall()
    if (result.error) {
      throw new Error(`Supabase RPC error: ${result.error.message}`)
    }
    if (!result.data) {
      throw new Error('Supabase RPC returned no data')
    }
    return result.data
  }, options)
}
