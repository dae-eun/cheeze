export default defineNuxtRouteMiddleware((to) => {
  // 로그인 페이지, 회원가입 페이지, 관리자 페이지는 인증 불필요
  if (to.path === '/auth/login' || to.path === '/auth/signup' || to.path === '/admin') {
    return
  }

  // 루트 페이지는 로그인 페이지로 리다이렉트
  if (to.path === '/') {
    return navigateTo('/auth/login')
  }

  // 클라이언트 사이드에서만 실행
  if (process.client) {
    // 서버에서 인증 상태를 확인할 수 없으므로, 
    // 각 페이지에서 자체적으로 인증 확인을 수행하도록 함
    // 여기서는 기본적인 경로 보호만 수행
  }
}) 