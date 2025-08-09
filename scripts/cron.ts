// @ts-ignore
import { cron } from 'bun'

// 자기 자신에게 요청 (배포 환경에서는 환경변수 사용)
const CRON_ENDPOINT = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/cron/reset-todos`
  : 'http://localhost:3000/api/cron/reset-todos'

// 매일 새벽 6시에 실행
cron('*/5 * * * *', async () => {
  console.log('🕕 Running daily todo reset...')
  
  try {
    const response = await fetch(CRON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: process.env.CRON_SECRET || 'your-secret-key'
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Todo reset successful:', result.message)
    } else {
      console.error('❌ Todo reset failed:', response.statusText)
    }
  } catch (error) {
    console.error('❌ Cron job error:', error)
  }
})

console.log('🚀 Cron scheduler started!')
console.log('📅 Daily todo reset scheduled for 6:00 AM')
console.log(`🌐 API Endpoint: ${CRON_ENDPOINT}`)
