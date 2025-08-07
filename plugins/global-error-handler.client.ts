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
    } catch (error) {
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
