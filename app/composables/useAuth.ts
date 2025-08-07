// 클라이언트에서 쿠키를 읽을 수 없으므로 서버 API만 사용

interface User {
  id: string
  email: string
  name: string
  organization_id?: string
}

export const useAuth = () => {
  const user = ref<User | null>(null)
  const isAuthenticated = ref(false)
  const isLoading = ref(true)

  // 토큰 리프레시 함수
  const refreshToken = async (): Promise<User> => {
    try {
      const response = await $fetch('/api/auth/refresh', {
        method: 'POST'
      })

      return response.user
    } catch (error) {
      console.error('Token refresh failed:', error)
      throw error
    }
  }

  // 인증 실패 처리 함수
  const handleAuthFailure = (message: string = '인증이 필요합니다.') => {
    if (process.client) {
      alert(message)
      navigateTo('/auth/login')
    }
  }

  // 인증 상태 확인
  const checkAuth = async (): Promise<boolean> => {
    isLoading.value = true
    
    try {
      // 서버에서 인증 상태 확인 (서버에서 자동으로 리프레시 토큰 처리)
      const response = await $fetch('/api/auth/me', {
        method: 'GET'
      })

      if (response.success) {
        user.value = response.user
        isAuthenticated.value = true
        return true
      } else {
        // 서버에서 이미 리프레시 토큰 처리를 했으므로, 실패 시 로그인 페이지로 이동
        console.error('Authentication failed:', response.message)
        user.value = null
        isAuthenticated.value = false
        handleAuthFailure(response.message || '인증이 필요합니다.')
        return false
      }
    } catch (error: any) {
      console.error('Auth check failed:', error)
      user.value = null
      isAuthenticated.value = false
      
      // 에러 메시지 추출
      let errorMessage = '인증 확인 중 오류가 발생했습니다.'
      if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      handleAuthFailure(errorMessage)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // 로그아웃
  const logout = async (): Promise<void> => {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST'
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
    
    user.value = null
    isAuthenticated.value = false
    navigateTo('/auth/login')
  }

  // 자동 토큰 리프레시 (15분마다)
  const startAutoRefresh = (): void => {
    const interval = setInterval(async () => {
      try {
        await refreshToken()
      } catch (error) {
        console.error('Auto refresh failed:', error)
        handleAuthFailure('세션이 만료되었습니다. 다시 로그인해주세요.')
      }
    }, 14 * 60 * 1000) // 14분마다 체크 (액세스 토큰 만료 1분 전)

    // 컴포넌트 언마운트 시 인터벌 정리
    // onUnmounted는 컴포넌트 내에서만 사용해야 하므로 제거
    // 대신 수동으로 정리하거나 다른 방법 사용
  }

  return {
    user: readonly(user),
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    checkAuth,
    refreshToken,
    logout,
    startAutoRefresh,
    handleAuthFailure
  }
} 