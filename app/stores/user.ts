import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'

interface User {
  id: string
  email: string
  name: string
  organization_id?: string
}

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const lastFetched = ref<number | null>(null)
  const CACHE_DURATION = 5 * 60 * 1000 // 5분

  // 캐시가 유효한지 확인
  const isCacheValid = () => {
    if (!lastFetched.value) return false
    return Date.now() - lastFetched.value < CACHE_DURATION
  }

  // 인증 실패 처리 함수
  const handleAuthFailure = (message: string = '인증이 필요합니다.') => {
    if (process.client) {
      const path = window.location?.pathname || ''
      const shouldSilent = path === '/' || path.startsWith('/auth')
      if (!shouldSilent) {
        try { alert(message) } catch {}
      }
      navigateTo('/auth/login')
    }
  }

  // 사용자 정보 가져오기
  const fetchUser = async (force = false): Promise<User | null> => {
    // 캐시가 유효하고 강제 새로고침이 아니면 캐시된 데이터 반환
    if (!force && isCacheValid() && user.value) {
      console.log('Using cached user data')
      return user.value
    }

    // 이미 로딩 중이면 기다림
    if (isLoading.value) {
      console.log('User fetch already in progress, waiting...')
      while (isLoading.value) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      return user.value
    }

    try {
      isLoading.value = true
      console.log('Fetching user data from API...')
      
      const response = await $fetch('/api/auth/me', {
        method: 'GET'
      })

      if (response.success && 'user' in response && response.user) {
        user.value = response.user
        lastFetched.value = Date.now()
        console.log('User data cached:', response.user)
        return response.user
      } else {
        user.value = null
        lastFetched.value = null
        handleAuthFailure(response.message || '인증이 필요합니다.')
        return null
      }
    } catch (error: any) {
      console.error('Failed to fetch user:', error)
      user.value = null
      lastFetched.value = null
      
      // 에러 메시지 추출
      let errorMessage = '인증 확인 중 오류가 발생했습니다.'
      if (error.data?.message) {
        errorMessage = error.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      handleAuthFailure(errorMessage)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // 사용자 정보 초기화
  const clearUser = () => {
    user.value = null
    lastFetched.value = null
  }

  // 현재 사용자 정보 반환 (캐시 확인 없이)
  const getCurrentUser = () => user.value

  return {
    user: readonly(user),
    isLoading: readonly(isLoading),
    fetchUser,
    clearUser,
    getCurrentUser,
    isCacheValid,
    handleAuthFailure
  }
})
