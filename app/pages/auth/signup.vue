<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          회원가입
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          초대코드를 입력하여 조직에 가입하세요
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleSignup">
        <div class="space-y-4">
          <div>
            <label for="inviteCode" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              초대코드 *
            </label>
            <input
              id="inviteCode"
              v-model="form.inviteCode"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="초대코드를 입력하세요"
            />
          </div>
          
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              이름 *
            </label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="이름을 입력하세요"
            />
          </div>
          
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              이메일 *
            </label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="이메일을 입력하세요"
            />
          </div>
          
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              비밀번호 *
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
              비밀번호 확인 *
            </label>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              type="password"
              required
              class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
              placeholder="비밀번호를 다시 입력하세요"
            />
          </div>

          <!-- 캐릭터 섹션 -->
          <div class="border-t pt-6">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">캐릭터 정보</h3>
            
            <!-- 메인 캐릭터 -->
            <div class="space-y-4">
              <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">메인 캐릭터 *</h4>
                <div class="space-y-3">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      서버 *
                    </label>
                    <select
                      v-model="form.mainCharacter.serverId"
                      required
                      class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                    >
                      <option value="">서버를 선택하세요</option>
                      <option v-for="server in servers" :key="server.id" :value="server.id">
                        {{ server.name }}
                      </option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      캐릭터명 *
                    </label>
                    <input
                      v-model="form.mainCharacter.name"
                      type="text"
                      required
                      class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                      placeholder="캐릭터명을 입력하세요"
                    />
                  </div>
                  
                </div>
              </div>

              <!-- 서브 캐릭터들 -->
              <div v-if="form.subCharacters.length > 0" class="space-y-4">
                <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">서브 캐릭터</h4>
                <div v-for="(character, index) in form.subCharacters" :key="index" class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div class="flex justify-between items-center mb-3">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">서브 캐릭터 {{ index + 1 }}</span>
                    <button
                      type="button"
                      @click="removeSubCharacter(index)"
                      class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        서버 *
                      </label>
                      <select
                        v-model="character.serverId"
                        required
                        class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                      >
                        <option value="">서버를 선택하세요</option>
                        <option v-for="server in servers" :key="server.id" :value="server.id">
                          {{ server.name }}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        캐릭터명 *
                      </label>
                      <input
                        v-model="character.name"
                        type="text"
                        required
                        class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm dark:bg-gray-700"
                        placeholder="캐릭터명을 입력하세요"
                      />
                    </div>
                    
                  </div>
                </div>
              </div>

              <!-- 서브 캐릭터 추가 버튼 -->
              <button
                type="button"
                @click="addSubCharacter"
                class="w-full py-2 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                + 서브 캐릭터 추가
              </button>
            </div>
          </div>
        </div>

        <div v-if="error" class="text-red-600 dark:text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="loading">가입 중...</span>
            <span v-else>회원가입</span>
          </button>
        </div>

        <div class="text-center">
          <NuxtLink to="/auth/login" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
            이미 계정이 있으신가요? 로그인하기
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// 클라이언트에서 쿠키를 읽을 수 없으므로 서버 API 사용

definePageMeta({
  layout: 'auth'
})

const supabase = useSupabase()

// 서버 목록 로드
onMounted(async () => {
  await loadServers()
})

const form = ref({
  inviteCode: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  mainCharacter: {
    name: '',
    serverId: ''
  },
  subCharacters: [] as Array<{
    name: string
    serverId: string
  }>
})

interface Server {
  id: string
  name: string
}

const loading = ref(false)
const error = ref('')
const servers = ref<Server[]>([])

// 서버 목록 로드
const loadServers = async () => {
  try {
    const { data, error: serverError } = await supabase
      .from('servers')
      .select('id, name')
      .order('name')
    
    if (serverError) throw serverError
    servers.value = data || []
  } catch (err) {
    console.error('Error loading servers:', err)
  }
}

const addSubCharacter = () => {
  form.value.subCharacters.push({
    name: '',
    serverId: ''
  })
}

const removeSubCharacter = (index: number) => {
  form.value.subCharacters.splice(index, 1)
}

const handleSignup = async () => {
  // 입력 검증
  if (form.value.password !== form.value.confirmPassword) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  if (form.value.password.length < 6) {
    error.value = '비밀번호는 최소 6자 이상이어야 합니다.'
    return
  }

  // 메인 캐릭터 검증
  if (!form.value.mainCharacter.name || !form.value.mainCharacter.serverId) {
    error.value = '메인 캐릭터 정보를 모두 입력해주세요.'
    return
  }

  // 서브 캐릭터 검증
  for (const character of form.value.subCharacters) {
    if (!character.name || !character.serverId) {
      error.value = '서브 캐릭터 정보를 모두 입력해주세요.'
      return
    }
  }

  loading.value = true
  error.value = ''

  try {
    // 서버 API를 통해 회원가입 처리
    const response = await $fetch('/api/auth/signup', {
      method: 'POST',
      body: {
        email: form.value.email,
        password: form.value.password,
        name: form.value.name,
        inviteCode: form.value.inviteCode,
        mainCharacter: form.value.mainCharacter,
        subCharacters: form.value.subCharacters
      }
    })

    console.log('Signup response:', response)

    if (response.success) {
      // 성공 시 로그인 페이지로 이동
      await navigateTo('/auth/login?message=회원가입이 완료되었습니다. 로그인해주세요.')
    } else {
      error.value = response.message || '회원가입에 실패했습니다.'
    }

  } catch (err: any) {
    console.error('Signup error:', err)
    error.value = err.data?.statusMessage || err.message || '회원가입 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
}


</script> 