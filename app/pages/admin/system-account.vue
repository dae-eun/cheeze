<template>
  <div class="space-y-8">
    <!-- 헤더 섹션 -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">시스템 계정 생성</h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">관리자 권한을 가진 시스템 계정을 생성합니다</p>
      </div>
    </div>

    <!-- 시스템 계정 생성 폼 -->
    <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <form @submit.prevent="createSystemAccount" class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
          <input
            v-model="form.name"
            type="text"
            required
            class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
            placeholder="관리자 이름을 입력하세요"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
          <input
            v-model="form.email"
            type="email"
            required
            class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
            placeholder="관리자 이메일을 입력하세요"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호</label>
          <input
            v-model="form.password"
            type="password"
            required
            minlength="6"
            class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
            placeholder="비밀번호를 입력하세요 (최소 6자)"
          />
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">최소 6자 이상 입력해주세요.</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">비밀번호 확인</label>
          <input
            v-model="form.confirmPassword"
            type="password"
            required
            class="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white"
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
            @click="resetForm"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors"
          >
            초기화
          </button>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <span v-if="loading">생성 중...</span>
            <span v-else>시스템 계정 생성</span>
          </button>
        </div>
      </form>
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
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

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
    resetForm()

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
</script>
