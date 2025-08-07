import { cron } from 'bun'

// 환경별 URL 설정
const CRON_ENDPOINT = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}/api/cron/reset-todos`
  : 'http://localhost:3000/api/cron/reset-todos'

// 매일 새벽 6시에 실행 (일간 숙제)
cron('0 6 * * *', async () => {
  console.log('🕕 Running daily todo reset...')
  await runTodoReset('daily')
})

// 매주 월요일 새벽 6시에 실행 (주간 숙제)
cron('0 6 * * 1', async () => {
  console.log('📅 Running weekly todo reset...')
  await runTodoReset('weekly')
})

// 매주 토요일 새벽 6시에 실행 (주말 숙제)
cron('0 6 * * 6', async () => {
  console.log('🌅 Running weekend todo reset...')
  await runTodoReset('weekend')
})

async function runTodoReset(cycle: string) {
  try {
    const response = await fetch(CRON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: process.env.CRON_SECRET || 'your-secret-key',
        cycle: cycle
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log(`✅ ${cycle} todo reset successful:`, result.message)
    } else {
      console.error(`❌ ${cycle} todo reset failed:`, response.statusText)
    }
  } catch (error) {
    console.error(`❌ ${cycle} cron job error:`, error)
  }
}

console.log('🚀 Advanced cron scheduler started!')
console.log('📅 Daily todo reset: 6:00 AM every day')
console.log('📅 Weekly todo reset: 6:00 AM every Monday')
console.log('📅 Weekend todo reset: 6:00 AM every Saturday')
console.log(`🌐 API Endpoint: ${CRON_ENDPOINT}`)
