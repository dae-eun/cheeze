<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
          로그인
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          숙제도우미에 로그인하세요
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
          <div>
                         <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
               이메일
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
               비밀번호
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
        </div>

                 <div v-if="error" class="text-red-600 dark:text-red-400 text-sm text-center">
           {{ error }}
         </div>

         <div v-if="message" class="text-green-600 dark:text-green-400 text-sm text-center">
           {{ message }}
         </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <span v-if="loading">로그인 중...</span>
            <span v-else>로그인</span>
          </button>
        </div>

                 <div class="text-center">
           <NuxtLink to="/auth/signup" class="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
             계정이 없으신가요? 회원가입하기
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

const route = useRoute()

const form = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const message = ref('')

// URL 파라미터에서 메시지 확인
onMounted(() => {
  if (route.query.message) {
    message.value = String(route.query.message);
  }
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    // 로그인 API 호출
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        email: form.value.email,
        password: form.value.password
      }
    })

    // 시스템 계정인지 확인하여 적절한 페이지로 이동
    if (response.user?.is_system) {
      await navigateTo('/admin')
    } else {
      await navigateTo('/dashboard')
    }

  } catch (err: any) {
    if (err.statusCode === 401) {
      error.value = '이메일 또는 비밀번호가 올바르지 않습니다.'
    } else {
      error.value = '로그인 중 오류가 발생했습니다.'
    }
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script> 