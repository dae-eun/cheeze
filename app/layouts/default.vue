<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 모바일 오버레이 -->
    <div 
      v-if="sidebarOpen && isMobile"
      class="fixed inset-0 bg-black bg-opacity-50 z-40"
      @click="closeSidebar"
    ></div>
    
    <!-- 사이드바 -->
    <div 
      class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out"
      :class="{
        '-translate-x-full': !sidebarOpen && !sidebarPinned,
        'translate-x-0': sidebarOpen || sidebarPinned,
        'md:w-64 w-80': true
      }"
    >
      <!-- 사이드바 헤더 -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">숙</span>
          </div>
          <span v-if="sidebarOpen || sidebarPinned" class="text-lg font-semibold text-gray-900 dark:text-white">
            숙제도우미
          </span>
        </div>
        <button
          v-if="(sidebarOpen || sidebarPinned) && !isMobile"
          @click="togglePin"
          class="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          :class="sidebarPinned ? 'text-blue-600' : 'text-gray-400'"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- 사이드바 메뉴 -->
      <nav class="mt-4 px-4">
        <div class="space-y-2">
          <NuxtLink
            to="/dashboard"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': $route.path === '/dashboard' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            <span v-if="sidebarOpen || sidebarPinned">대시보드</span>
          </NuxtLink>

          <NuxtLink
            to="/characters/todos"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': $route.path === '/characters/todos' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span v-if="sidebarOpen || sidebarPinned">캐릭터별 숙제</span>
          </NuxtLink>

          <NuxtLink
            to="/todos"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': $route.path === '/todos' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span v-if="sidebarOpen || sidebarPinned">숙제목록</span>
          </NuxtLink>

          <NuxtLink
            to="/profile"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': $route.path === '/profile' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span v-if="sidebarOpen || sidebarPinned">내 정보</span>
          </NuxtLink>

          <NuxtLink
            to="/settings"
            class="flex items-center space-x-3 px-3 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            :class="{ 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400': $route.path === '/settings' }"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span v-if="sidebarOpen || sidebarPinned">설정</span>
          </NuxtLink>
        </div>
      </nav>
    </div>

    <!-- 메인 컨텐츠 -->
    <div 
      class="transition-all duration-300 ease-in-out"
      :class="{
        'md:ml-64 ml-0': sidebarPinned && !isMobile,
        'ml-0': !sidebarPinned || isMobile
      }"
    >
      <!-- 헤더 -->
      <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-4 py-3">
          <!-- 좌측: 사이드바 토글 버튼과 브레드크럼 -->
          <div class="flex items-center space-x-4">
            <button
              @click="toggleSidebar"
              class="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div class="flex items-center space-x-2">
              <h1 class="text-xl font-semibold text-gray-900 dark:text-white">숙제도우미</h1>
              <span v-if="getBreadcrumbText()" class="text-gray-400 dark:text-gray-500">-</span>
              <span v-if="getBreadcrumbText()" class="text-lg text-gray-700 dark:text-gray-300">{{ getBreadcrumbText() }}</span>
            </div>
          </div>

          <!-- 우측: 사용자 메뉴 -->
          <div class="flex items-center space-x-4">
            <!-- 다크모드 토글 -->
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <svg v-if="isDarkMode" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
              </svg>
            </button>

                         <!-- 사용자 드롭다운 -->
             <div ref="userMenuRef" class="relative">
               <button
                 @click="toggleUserMenu"
                 class="flex items-center space-x-2 p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
               >
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-medium">{{ mainCharacter?.name?.charAt(0) || userStore.user?.name?.charAt(0) || 'U' }}</span>
                </div>
                <span class="hidden md:block text-sm font-medium">{{ mainCharacter?.name || userStore.user?.name || '사용자' }}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- 드롭다운 메뉴 -->
              <div
                v-if="userMenuOpen"
                class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-200 dark:border-gray-700"
              >
                <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ mainCharacter?.name || userStore.user?.name }}</p>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ userStore.user?.email }}</p>
                </div>
                <NuxtLink
                  to="/profile"
                  @click="userMenuOpen = false"
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  내 정보
                </NuxtLink>
                <button
                  @click="handleLogout"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- 페이지 컨텐츠 -->
      <main class="p-6">
        <slot />
      </main>
    </div>

    <!-- 사이드바 오버레이 - dim 제거됨 -->
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useUserStore } from '~/stores/user'
import { useCharactersStore } from '~/stores/characters'
import { onClickOutside } from '@vueuse/core'

const { logout } = useAuth()
const userStore = useUserStore()
const charactersStore = useCharactersStore()

// 사이드바 상태
const sidebarOpen = ref(false)
const sidebarPinned = ref(false)
const isMobile = ref(false)

// 모바일 여부 확인
const checkMobile = () => {
  if (process.client) {
    isMobile.value = window.innerWidth < 768
  }
}

// 사이드바 상태 초기화
const initializeSidebarState = () => {
  if (process.client) {
    const savedSidebarPinned = localStorage.getItem('sidebarPinned')
    const savedSidebarOpen = localStorage.getItem('sidebarOpen')
    
    // 모바일에서는 기본적으로 사이드바를 고정하지 않음
    if (isMobile.value) {
      sidebarPinned.value = false
      sidebarOpen.value = savedSidebarOpen === 'true'
    } else {
      sidebarPinned.value = savedSidebarPinned !== null ? savedSidebarPinned === 'true' : false
      sidebarOpen.value = savedSidebarOpen !== null ? savedSidebarOpen === 'true' : false
    }
  }
}

// 사이드바 상태 저장
const saveSidebarState = () => {
  if (process.client) {
    localStorage.setItem('sidebarPinned', sidebarPinned.value.toString())
    localStorage.setItem('sidebarOpen', sidebarOpen.value.toString())
  }
}

// 사이드바 토글
const toggleSidebar = () => {
  if (isMobile.value) {
    // 모바일에서는 오버레이 모드로만 동작
    sidebarOpen.value = !sidebarOpen.value
    sidebarPinned.value = false
    
    // 모바일에서 사이드바가 열릴 때 스크롤 방지
    if (process.client) {
      if (sidebarOpen.value) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  } else {
    // 데스크톱에서는 기존 로직 유지
    if (sidebarOpen.value || sidebarPinned.value) {
      sidebarOpen.value = false
      sidebarPinned.value = false
    } else {
      sidebarOpen.value = false
      sidebarPinned.value = true
    }
  }
  saveSidebarState()
}

// 사이드바 닫기
const closeSidebar = () => {
  sidebarOpen.value = false
  
  // 모바일에서 사이드바가 닫힐 때 스크롤 복원
  if (process.client && isMobile.value) {
    document.body.style.overflow = ''
  }
  
  saveSidebarState()
}

// 사이드바 핀 고정/해제 (데스크톱에서만)
const togglePin = () => {
  if (!isMobile.value) {
    sidebarPinned.value = !sidebarPinned.value
    if (sidebarPinned.value) {
      sidebarOpen.value = false
    }
    saveSidebarState()
  }
}

// 대표캐릭터 정보
const mainCharacter = ref<{ name: string } | null>(null)

// 사용자 메뉴 상태
const userMenuOpen = ref(false)

// 다크모드 상태
const isDarkMode = ref(false)



// 다크모드 초기화
const initializeDarkMode = () => {
  if (process.client) {
    const savedDarkMode = localStorage.getItem('darkMode')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    // 저장된 설정이 있으면 사용, 없으면 시스템 설정 사용
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



// 사용자 메뉴 토글
const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

// 사용자 메뉴 외부 클릭 시 닫기
const userMenuRef = ref<HTMLElement>()

onClickOutside(userMenuRef, () => {
  userMenuOpen.value = false
})

// 로그아웃 처리
const handleLogout = () => {
  userMenuOpen.value = false
  logout()
}

// 대표캐릭터 정보 가져오기
const loadMainCharacter = async () => {
  const currentUser = userStore.getCurrentUser()
  if (!currentUser) {
    console.log('User not available, skipping main character load')
    return
  }
  
  try {
    console.log('Loading main character for user:', currentUser.id)
    const characters = await charactersStore.fetchCharacters()
    
    const mainChar = characters.find((char: any) => char.is_main)
    if (mainChar) {
      mainCharacter.value = { name: mainChar.name }
      console.log('Set main character:', mainChar.name)
    } else {
      console.log('No main character found')
      mainCharacter.value = null
    }
  } catch (error) {
    console.error('Error loading main character:', error)
    mainCharacter.value = null
  }
}

// 브레드크럼 텍스트 가져오기
const getBreadcrumbText = () => {
  const route = useRoute()
  const path = route.path
  
  switch (path) {
    case '/dashboard':
      return '대시보드'
    case '/characters/todos':
      return '캐릭터별 숙제 관리'
    case '/todos':
      return '숙제목록'
    case '/profile':
      return '내 정보'
    case '/settings':
      return '설정'
    default:
      return ''
  }
}

// 컴포넌트 마운트 시 다크모드 초기화 및 대표캐릭터 로드
onMounted(async () => {
  initializeDarkMode()
  checkMobile()
  initializeSidebarState()
  
  // 윈도우 리사이즈 이벤트 리스너 추가
  if (process.client) {
    window.addEventListener('resize', () => {
      checkMobile()
      initializeSidebarState()
    })
  }
  
  // 스토어에서 사용자 정보 가져오기
  try {
    console.log('Loading user data from store in default.vue...')
    const user = await userStore.fetchUser()
    
    if (user) {
      console.log('User authenticated in default.vue:', user)
      await loadMainCharacter()
    } else {
      console.log('User not authenticated in default.vue')
    }
  } catch (error) {
    console.error('Auth check failed in default.vue:', error)
  }
})

// 사용자 상태 변화 감지하여 대표캐릭터 로드
watch(() => userStore.user, async (newUser) => {
  console.log('User state changed in default.vue:', newUser)
  if (newUser) {
    await loadMainCharacter()
  } else {
    mainCharacter.value = null
  }
}, { immediate: false })


</script> 