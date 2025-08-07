export default defineEventHandler(async (event) => {
  try {
    // 쿠키 제거
    deleteCookie(event, 'access_token')
    deleteCookie(event, 'refresh_token')

    return {
      success: true,
      message: '로그아웃되었습니다.'
    }
  } catch (error) {
    console.error('Logout error:', error)
    throw error
  }
}) 