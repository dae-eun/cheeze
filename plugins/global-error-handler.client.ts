export default defineNuxtPlugin(() => {
  // 전역 에러 핸들러
  const handleAuthError = (error: any) => {
    // 인증 관련 에러인지 확인
    const isAuthError = error.statusCode === 401 || 
                       (error.data?.message && error.data.message.includes('인증')) ||
                       (error.message && error.message.includes('인증'))

    if (isAuthError && window.location.pathname !== '/auth/login') {
      const message = error.data?.message || error.message || '인증이 필요합니다.'
      alert(message)
      navigateTo('/auth/login')
    }
  }

  // $fetch 에러 인터셉터
  const originalFetch = globalThis.$fetch
  globalThis.$fetch = async (request, options) => {
    try {
      return await originalFetch(request, options)
    } catch (error: any) {
      const requestUrl = typeof request === 'string' ? request : (request as any)?.url
      const isAuthRefreshCall = requestUrl && requestUrl.includes('/api/auth/refresh')

      // 401이면 토큰 리프레시 시도 후 원 요청을 한 번 재시도
      if (error?.statusCode === 401 && !isAuthRefreshCall) {
        try {
          await originalFetch('/api/auth/refresh', { method: 'POST' })
          return await originalFetch(request as any, options as any)
        } catch (refreshError) {
          handleAuthError(error)
          throw error
        }
      }

      handleAuthError(error)
      throw error
    }
  }

  // 전역 에러 이벤트 리스너
  if (process.client) {
    window.addEventListener('unhandledrejection', (event) => {
      handleAuthError(event.reason)
    })
  }
})
