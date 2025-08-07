<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white p-8">
    <div class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">다크모드 테스트</h1>
      
      <div class="space-y-4">
        <div class="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h2 class="text-xl font-semibold mb-2">현재 상태</h2>
          <p>다크모드 활성화: {{ isDarkMode ? '예' : '아니오' }}</p>
          <p>HTML 클래스: {{ document?.documentElement?.classList?.contains('dark') ? 'dark 포함' : 'dark 없음' }}</p>
        </div>
        
        <div class="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <h2 class="text-xl font-semibold mb-2">색상 테스트</h2>
          <p class="text-gray-700 dark:text-gray-300">이 텍스트는 다크모드에서 회색으로 변해야 합니다.</p>
          <button class="mt-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-2 rounded">
            파란색 버튼
          </button>
        </div>
        
        <div class="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <h2 class="text-xl font-semibold mb-2">다크모드 토글</h2>
          <button @click="toggleDarkMode" class="bg-yellow-500 hover:bg-yellow-600 text-black px-4 py-2 rounded">
            다크모드 {{ isDarkMode ? '끄기' : '켜기' }}
          </button>
        </div>
        
        <div class="p-4 bg-red-100 dark:bg-red-900 rounded-lg">
          <h2 class="text-xl font-semibold mb-2">강제 다크모드 적용</h2>
          <button @click="forceDarkMode" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded mr-2">
            강제 다크모드
          </button>
          <button @click="forceLightMode" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
            강제 라이트모드
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 다크모드 상태
const isDarkMode = ref(false)

// 다크모드 초기화
const initializeDarkMode = () => {
  if (process.client) {
    const savedDarkMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    isDarkMode.value = savedDarkMode !== null ? savedDarkMode === 'true' : prefersDark
    applyDarkMode()
  }
}

// 다크모드 적용
const applyDarkMode = () => {
  if (process.client) {
    if (isDarkMode.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

// 다크모드 토글
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  if (process.client) {
    localStorage.setItem('darkMode', isDarkMode.value.toString())
  }
  applyDarkMode()
}

// 강제 다크모드
const forceDarkMode = () => {
  if (process.client) {
    document.documentElement.classList.add('dark')
    isDarkMode.value = true
    localStorage.setItem('darkMode', 'true')
  }
}

// 강제 라이트모드
const forceLightMode = () => {
  if (process.client) {
    document.documentElement.classList.remove('dark')
    isDarkMode.value = false
    localStorage.setItem('darkMode', 'false')
  }
}

// 컴포넌트 마운트 시 초기화
onMounted(() => {
  initializeDarkMode()
})
</script> 