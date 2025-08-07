import { hash } from 'bcrypt'

async function generateHash() {
  const password = 'Eodms601330@'
  const saltRounds = 10
  
  try {
    const hashedPassword = await hash(password, saltRounds)
    console.log('🔐 Password Hash Generated:')
    console.log('Password:', password)
    console.log('Hash:', hashedPassword)
    console.log('')
    console.log('📝 Use this hash in your SQL:')
    console.log(`'${hashedPassword}'`)
  } catch (error) {
    console.error('❌ Error generating hash:', error)
  }
}

generateHash()
