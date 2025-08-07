<template>
  <div class="space-y-8">
    <!-- 페이지 고유 헤더 -->
    <div class="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">시스템 계정 관리</h1>
          <p class="mt-1 opacity-90">관리자 권한을 가진 시스템 계정을 관리합니다</p>
        </div>
        <div class="flex items-center space-x-2">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span class="text-lg font-semibold">System Account</span>
        </div>
      </div>
    </div>

    <!-- 헤더 섹션 -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">시스템 계정 관리</h2>
        <p class="text-gray-600 dark:text-gray-400 mt-1">관리자 권한을 가진 시스템 계정을 관리합니다</p>
      </div>
      <button
        @click="showModal = true"
        class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
      >
        시스템 계정 생성
      </button>
    </div>

    <!-- 시스템 계정 정보 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">시스템 계정 정보</h2>
      <div class="space-y-3 text-sm text-gray-600 dark:text-gray-400">
        <p>• 시스템 계정은 모든 조직의 데이터에 접근할 수 있습니다.</p>
        <p>• 조직 생성, 초대코드 갱신, 시스템 숙제 관리가 가능합니다.</p>
        <p>• 일반 사용자와 달리 조직에 속하지 않습니다.</p>
        <p>• 로그인 시 자동으로 관리자 패널로 이동합니다.</p>
      </div>
    </div>

    <!-- 시스템 계정 생성 모달 -->
    <div v-if="showModal" class="fixed inset-0 overflow-y-auto h-full w-full z-50" style="background-color: rgba(0, 0, 0, 0.6);">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div class="mt-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">시스템 계정 생성</h3>
            <button
              @click="closeModal"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form @submit.prevent="createSystemAccount" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-1">이름</label>
              <input
                v-model="form.name"
                type="text"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="관리자 이름을 입력하세요"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-1">이메일</label>
              <input
                v-model="form.email"
                type="email"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="관리자 이메일을 입력하세요"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-1">비밀번호</label>
              <input
                v-model="form.password"
                type="password"
                required
                minlength="6"
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
              />
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">최소 6자 이상 입력해주세요.</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-1">비밀번호 확인</label>
              <input
                v-model="form.confirmPassword"
                type="password"
                required
                class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="비밀번호를 다시 입력하세요"
              />
            </div>

            <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
              {{ error }}
            </div>

            <div v-if="success" class="text-green-600 dark:text-green-400 text-sm">
              {{ success }}
            </div>

            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeModal"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                :disabled="loading || !isFormValid"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <span v-if="loading">생성 중...</span>
                <span v-else>생성</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: 'admin',
  title: '시스템 계정 관리',
  description: '관리자 권한을 가진 시스템 계정을 관리합니다'
})

// 페이지 고유 메타데이터 설정
useHead({
  title: '시스템 계정 관리 - 관리자 패널',
  meta: [
    { name: 'description', content: '관리자 권한을 가진 시스템 계정을 관리합니다' },
    { property: 'og:title', content: '시스템 계정 관리' },
    { property: 'og:description', content: '관리자 권한을 가진 시스템 계정을 관리합니다' }
  ]
})

const { checkAuth, startAutoRefresh } = useAuth()

const showModal = ref(false)
const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const closeModal = () => {
  showModal.value = false
  resetForm()
}

const createSystemAccount = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // 비밀번호 확인
    if (form.value.password !== form.value.confirmPassword) {
      error.value = '비밀번호가 일치하지 않습니다.'
      return
    }

    // API 호출
    const response = await $fetch('/api/admin/system-account', {
      method: 'POST',
      body: {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password
      }
    })

    success.value = '시스템 계정이 성공적으로 생성되었습니다!'
    setTimeout(() => {
      closeModal()
    }, 1500)

  } catch (err: any) {
    if (err.statusCode === 400) {
      error.value = err.statusMessage || '입력 정보를 확인해주세요.'
    } else if (err.statusCode === 500) {
      error.value = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
    } else {
      error.value = '시스템 계정 생성 중 오류가 발생했습니다.'
    }
    console.error('System account creation error:', err)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  }
  error.value = ''
  success.value = ''
}

// 폼 유효성 검사
const isFormValid = computed(() => {
  return form.value.name.trim() !== '' &&
         form.value.email.trim() !== '' &&
         form.value.password.length >= 6 &&
         form.value.password === form.value.confirmPassword
})

// 페이지 로드 시 인증 확인
onMounted(async () => {
  // 인증 확인
  const isAuthenticated = await checkAuth()
  if (!isAuthenticated) {
    return
  }
  
  // 자동 토큰 리프레시 시작
  startAutoRefresh()
})
</script>
