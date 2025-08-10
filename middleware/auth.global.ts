export default defineNuxtRouteMiddleware(async (to) => {
  // 로그인 페이지, 회원가입 페이지, 관리자 페이지는 인증 불필요
  if (to.path === '/auth/login' || to.path === '/auth/signup' || to.path === '/admin') {
    return
  }

  // 루트 접근 시: 인증 여부에 따라 대시보드/로그인으로 분기
  if (to.path === '/') {
    try {
      const response: any = await $fetch('/api/auth/me', { method: 'GET' })
      if (response?.success) {
        return navigateTo('/dashboard')
      }
    } catch (_) {
      // 무시하고 로그인으로 이동
    }
    return navigateTo('/auth/login')
  }

  // 그 외 경로는 기존 정책 유지 (필요 시 각 페이지에서 별도 보호)
})