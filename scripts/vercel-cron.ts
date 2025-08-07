// Vercel 환경에서는 이 스크립트를 사용하지 않음
// 대신 vercel.json의 cron jobs를 사용

console.log('🚫 This script is not for Vercel deployment')
console.log('📝 Use vercel.json cron jobs instead:')
console.log('')
console.log('vercel.json:')
console.log('{')
console.log('  "crons": [')
console.log('    {')
console.log('      "path": "/api/cron/reset-todos",')
console.log('      "schedule": "0 6 * * *"')
console.log('    }')
console.log('  ]')
console.log('}')
console.log('')
console.log('✅ Vercel will automatically call the API at 6:00 AM daily')
