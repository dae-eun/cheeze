<template>
     <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
     <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

                             <!-- 계정 정보 -->
         <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
           <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">계정 정보</h2>
          
                    <div v-if="loadingUserInfo" class="space-y-4">
             <div class="animate-pulse">
               <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
               <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
             </div>
             <div class="animate-pulse">
               <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
               <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
             </div>
           </div>
           
                       <div v-else class="space-y-4">
                          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이름</label>
                <input
                  v-model="userInfo.name"
                  type="text"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="!isEditingUser"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">이메일</label>
                <input
                  v-model="userInfo.email"
                  type="email"
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled
                />
              </div>
            </div>
            
            </div>
        </div>

                <!-- 캐릭터 정보 -->
         <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
           <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
             <h2 class="text-xl font-semibold text-gray-900 dark:text-white">캐릭터 정보</h2>
             <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
               <svg class="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
               <span>서브 캐릭터 순서는 드래그앤드랍으로 변경할 수 있어요</span>
             </div>
           </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                           <!-- 메인 캐릭터 -->
              <div v-if="mainCharacter" class="p-4 rounded-lg border-2 border-blue-200 dark:border-blue-500 main-character-card">
                                 <div class="flex justify-between items-center mb-3">
                   <h3 class="text-sm font-medium text-blue-800 dark:text-yellow-300">메인 캐릭터</h3>
                   <button
                     @click="editCharacter(mainCharacter)"
                     class="text-blue-600 hover:text-blue-800 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm"
                   >
                     수정
                   </button>
                 </div>
                <div class="space-y-2">
                  <div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">서버:</span>
                    <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ getServerName(mainCharacter.server_id) }}</span>
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터명:</span>
                    <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ mainCharacter.name }}</span>
                  </div>
                </div>
              </div>

              <!-- 서브 캐릭터들 (드래그앤드랍/터치 정렬) -->
              <div
                v-for="(character, index) in subReorderList"
                :key="character.id"
                class="relative bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                draggable="true"
                :data-sub-index="index"
                @dragstart="onDragStart(index)"
                @dragover.prevent="onDragOver(index)"
                @dragend="onDragEnd"
                @drop="onDrop"
                @touchstart="onTouchStart($event, index)"
                @touchmove.prevent="onTouchMove($event)"
                @touchend="onTouchEnd($event)"
              >
               <div
                 v-if="isDraggingAny && dropTargetIndex === index"
                 class="absolute inset-0 border-2 border-dashed border-blue-400/80 bg-blue-50/60 dark:bg-blue-900/80 rounded-lg flex items-center justify-center pointer-events-none z-10"
               >
                 <span class="text-xs font-medium text-blue-700 dark:text-white">원하는 위치에 놓아주세요</span>
          </div>

          <!-- 터치 드래그 미리보기 -->
          <div
            v-if="isTouchDragging"
            class="fixed z-50 pointer-events-none"
            :style="{ left: touchPos.x + 'px', top: touchPos.y + 'px', transform: 'translate(-50%, -50%)' }"
          >
            <div class="px-3 py-1 rounded-md bg-blue-600 text-white text-xs shadow-lg">
              이동 중: {{ touchDragName }}
            </div>
          </div>
               <div class="flex justify-between items-center mb-3">
                 <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">서브 캐릭터</h3>
                 <div class="flex space-x-2">
                                       <button
                      @click="editCharacter(character)"
                      class="text-blue-600 hover:text-blue-800 dark:text-yellow-400 dark:hover:text-yellow-300 text-sm"
                    >
                      수정
                    </button>
                   <button
                     @click="deleteCharacter(character.id)"
                     class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                   >
                     삭제
                   </button>
                 </div>
               </div>
                <div class="space-y-2">
                 <div>
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">서버:</span>
                   <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ getServerName(character.server_id) }}</span>
                 </div>
                 <div>
                   <span class="text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터명:</span>
                   <span class="ml-2 text-sm text-gray-900 dark:text-white">{{ character.name }}</span>
                 </div>
               </div>
             </div>

             <!-- 캐릭터 추가 카드 -->
             <div 
               @click="addNewCharacter"
               class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors min-h-[120px]"
             >
               <div class="text-gray-400 dark:text-gray-500 mb-2">
                 <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                 </svg>
               </div>
               <p class="text-sm text-gray-500 dark:text-gray-400 text-center">캐릭터 추가</p>
             </div>
           </div>
         </div>
    </div>

                   <!-- 캐릭터 편집 모달 -->
      <div v-if="showCharacterModal" class="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center p-4 z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-4">
            {{ editingCharacter ? '캐릭터 수정' : '캐릭터 추가' }}
          </h3>
          
                   <form @submit.prevent="saveCharacter" class="space-y-4">
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">서버 *</label>
                               <div class="relative">
                  <select
                    v-model="characterForm.serverId"
                    required
                    class="custom-select mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white appearance-none cursor-pointer"
                  >
                    <option value="">서버를 선택하세요</option>
                    <option v-for="server in servers" :key="server.id" :value="server.id">
                      {{ server.name }}
                    </option>
                  </select>
                  <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
             </div>
             
             <div>
               <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">캐릭터명 *</label>
               <input
                 v-model="characterForm.name"
                 type="text"
                 required
                 class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                 placeholder="캐릭터명을 입력하세요"
               />
             </div>
            
            

                       <div>
               <label class="flex items-center">
                 <input
                   v-model="characterForm.isMain"
                   type="checkbox"
                   class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                 />
                 <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">메인 캐릭터로 설정</span>
               </label>
             </div>

            <div class="flex space-x-3">
              <button
                type="submit"
                :disabled="savingCharacter"
                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
              >
                {{ savingCharacter ? '저장 중...' : '저장' }}
              </button>
              <button
                type="button"
                @click="closeCharacterModal"
                class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
  </div>
  
  <!-- 토스트 팝업 -->
  <transition name="fade">
    <div
      v-if="toast.visible"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-md bg-gray-900/90 text-white text-sm shadow-lg"
    >
      {{ toast.text }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

// 타입 정의
interface User {
  id: string
  email: string
  name: string
  organization_id?: string
}

interface UserInfo {
  name: string
  email: string
}

interface Character {
  id: string
  name: string
  server_id: string
  is_main: boolean
  order?: number
  created_at: string
  updated_at: string
  servers: {
    name: string
  }
}

interface Server {
  id: string
  name: string
}

interface CharacterForm {
  name: string
  serverId: string
  isMain: boolean
}

definePageMeta({
  layout: 'default'
})

const supabase = useSupabase()
const { startAutoRefresh } = useAuth()
const userStore = useUserStore()
const charactersStore = useCharactersStore()

// 사용자 정보
const userInfo = ref<UserInfo>({
  name: '',
  email: ''
})

const isEditingUser = ref(false)
const savingUser = ref(false)
const originalUserInfo = ref<UserInfo>({
  name: '',
  email: ''
})
const loadingUserInfo = ref(false)

// 캐릭터 정보
const characters = ref<Character[]>([])
const mainCharacter = computed(() => characters.value.find(c => c.is_main))
const subCharacters = computed(() => characters.value.filter(c => !c.is_main).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

// DnD/터치 정렬용 로컬 상태
const subReorderList = ref<Character[]>([])
const dropTargetIndex = ref<number | null>(null)
const isDraggingAny = computed(() => draggingIndex.value !== null || touchStartIndex.value !== null)
watch(subCharacters, (list) => {
  subReorderList.value = list.slice()
}, { immediate: true })

const draggingIndex = ref<number | null>(null)
const touchStartIndex = ref<number | null>(null)
const touchCurrentIndex = ref<number | null>(null)
const isTouchDragging = computed(() => touchStartIndex.value !== null)
const touchPos = ref<{ x: number; y: number }>({ x: 0, y: 0 })
const touchDragName = computed(() => {
  const idx = touchStartIndex.value
  if (idx === null) return ''
  const item = subReorderList.value[idx]
  return item ? item.name : ''
})

const swapItems = (arr: Character[], from: number, to: number) => {
  if (from === to) return
  if (from < 0 || to < 0 || from >= arr.length || to >= arr.length) return
  const removed = arr.splice(from, 1)
  if (removed.length === 0) return
  const item = removed[0] as Character
  arr.splice(to, 0, item)
}

const onDragStart = (index: number) => {
  draggingIndex.value = index
  dropTargetIndex.value = index
}

const onDragOver = (overIndex: number) => {
  if (draggingIndex.value === null) return
  dropTargetIndex.value = overIndex
}

const onDragEnd = () => {
  // 드랍 타겟 위에서 drop 이벤트가 발생하지 않으면 취소 처리
  if (draggingIndex.value !== null) {
    draggingIndex.value = null
    dropTargetIndex.value = null
  }
}

const onDrop = async () => {
  if (draggingIndex.value === null || dropTargetIndex.value === null) return
  // 위치가 동일하면 아무 것도 하지 않음 (API 호출 스킵)
  if (draggingIndex.value === dropTargetIndex.value) {
    draggingIndex.value = null
    dropTargetIndex.value = null
    return
  }
  // 실제 위치 변경 후 저장
  swapItems(subReorderList.value, draggingIndex.value, dropTargetIndex.value)
  draggingIndex.value = null
  dropTargetIndex.value = null
  await persistSubOrder()
}

const getTouchedIndex = (event: TouchEvent): number | null => {
  const touch = (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0])
  if (!touch) return null
  const target = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement | null
  if (!target) return null
  const card = target.closest('[data-sub-index]') as HTMLElement | null
  if (!card) return null
  const idxStr = card.getAttribute('data-sub-index')
  return idxStr ? Number(idxStr) : null
}

const onTouchStart = (e: TouchEvent, index: number) => {
  touchStartIndex.value = index
  touchCurrentIndex.value = index
  dropTargetIndex.value = index
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
  if (t) touchPos.value = { x: t.clientX, y: t.clientY }
}

const onTouchMove = (e: TouchEvent) => {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0])
  if (t) touchPos.value = { x: t.clientX, y: t.clientY }
  const idx = getTouchedIndex(e)
  if (touchStartIndex.value === null) return
  // 카드 밖으로 벗어나면 하이라이트 제거
  if (idx === null) {
    dropTargetIndex.value = null
    return
  }
  // 자기 자신 위에서는 하이라이트 숨김
  if (idx === touchStartIndex.value) {
    dropTargetIndex.value = null
    return
  }
  // 하이라이트 이동 (실제 스왑은 touchEnd에서 1회 수행)
  if (touchCurrentIndex.value !== idx) {
    dropTargetIndex.value = idx
  }
}

const onTouchEnd = async (e: TouchEvent) => {
  if (touchStartIndex.value === null) return
  const from = touchStartIndex.value
  // 드랍 시점의 실제 위치만으로 결정 (이전에 하이라이트된 타겟은 무시)
  const endIdx = getTouchedIndex(e)
  // 카드 위가 아니거나 자기 자신이면 취소 처리
  if (endIdx === null || endIdx === from) {
    touchStartIndex.value = null
    touchCurrentIndex.value = null
    dropTargetIndex.value = null
    return
  }
  // 실제 위치 변경 후 저장
  swapItems(subReorderList.value, from, endIdx)
  touchStartIndex.value = null
  touchCurrentIndex.value = null
  dropTargetIndex.value = null
  await persistSubOrder()
}

const persistSubOrder = async () => {
  const orderedIds = subReorderList.value.map(c => c.id)
  const ok = await charactersStore.saveSubCharacterOrder(orderedIds)
  if (!ok) {
    // 실패 시 서버에서 다시 로드
    await charactersStore.fetchCharacters(true)
    await loadCharacters()
  } else {
    // 성공 시 로컬 characters 업데이트
    // 최신 순서대로 order 값을 재부여하여 정렬 기준과 일치시킴
    const updatedSubs = subReorderList.value.map((c, idx) => ({ ...c, order: idx + 1 }))
    subReorderList.value = updatedSubs
    const main = mainCharacter.value ? [mainCharacter.value] : []
    characters.value = [...main, ...updatedSubs]
    showToast('순서가 변경되었습니다.')
  }
}

// 토스트
const toast = ref<{ visible: boolean; text: string }>({ visible: false, text: '' })
let toastTimer: ReturnType<typeof setTimeout> | null = null
const showToast = (text: string, durationMs = 2000) => {
  toast.value = { visible: true, text }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.visible = false }, durationMs)
}

// 서버 목록
const servers = ref<Server[]>([])

// 캐릭터 모달
const showCharacterModal = ref(false)
const editingCharacter = ref<Character | null>(null)
const savingCharacter = ref(false)
const characterForm = ref<CharacterForm>({
  name: '',
  serverId: '',
  isMain: false
})

// 데이터 로드
const loadUserInfo = async () => {
  const currentUser = userStore.getCurrentUser()
  if (!currentUser) {
    console.log('No user found, skipping loadUserInfo')
    return
  }

  console.log('Loading user info for user ID:', currentUser.id)
  loadingUserInfo.value = true
  try {
    const response = await $fetch(`/api/users/${currentUser.id}`, {
      method: 'GET'
    })

    console.log('User info API response:', response)

    if (response.success) {
      console.log('Setting user info:', response.user)
      const userData = response.user as { name: string; email: string }
      userInfo.value = { 
        name: userData.name, 
        email: userData.email 
      }
      originalUserInfo.value = { 
        name: userData.name, 
        email: userData.email 
      }
    } else {
      console.error('User API returned error:', response)
    }
  } catch (error) {
    console.error('Error loading user info:', error)
  } finally {
    loadingUserInfo.value = false
  }
}

const loadCharacters = async () => {
  try {
    console.log('Loading characters from store...')
    const charactersData = await charactersStore.fetchCharacters()
    characters.value = charactersData
    console.log('Characters loaded from store:', characters.value)
  } catch (error) {
    console.error('Error loading characters:', error)
  }
}

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

// 서버 ID로 서버명 가져오기
const getServerName = (serverId: string): string => {
  const server = servers.value.find(s => s.id === serverId)
  return server ? server.name : '알 수 없음'
}

// 사용자 정보 편집
const startEditUser = () => {
  isEditingUser.value = true
}

const cancelEditUser = () => {
  userInfo.value = { ...originalUserInfo.value }
  isEditingUser.value = false
}

const saveUserInfo = async () => {
  const currentUser = userStore.getCurrentUser()
  if (!currentUser) {
    console.error('No authenticated user found')
    return
  }

  // 낙관적 업데이트 - 원래 데이터 백업
  const originalName = originalUserInfo.value.name
  const newName = userInfo.value.name

  // 낙관적 업데이트 적용
  originalUserInfo.value.name = newName

  savingUser.value = true
  try {
    const response = await $fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      body: {
        name: userInfo.value.name
      }
    })

    console.log('User update API response:', response)

    if (response.success) {
      isEditingUser.value = false
      // 스토어의 사용자 정보도 업데이트
      const user = userStore.getCurrentUser()
      if (user) {
        user.name = newName
      }
    } else {
      // 실패 시 원래 데이터로 롤백
      originalUserInfo.value.name = originalName
      userInfo.value.name = originalName
      console.error('User update API returned error:', response)
    }
  } catch (error) {
    // 에러 발생 시 원래 데이터로 롤백
    originalUserInfo.value.name = originalName
    userInfo.value.name = originalName
    console.error('Error updating user info:', error)
  } finally {
    savingUser.value = false
  }
}

// 캐릭터 관리
const addNewCharacter = () => {
  editingCharacter.value = null
  characterForm.value = {
    name: '',
    serverId: '',
    isMain: false
  }
  showCharacterModal.value = true
}

const editCharacter = (character: Character) => {
  editingCharacter.value = character
  characterForm.value = {
    name: character.name,
    serverId: character.server_id,
    isMain: character.is_main
  }
  showCharacterModal.value = true
}

const closeCharacterModal = () => {
  showCharacterModal.value = false
  editingCharacter.value = null
  characterForm.value = {
    name: '',
    serverId: '',
    isMain: false
  }
}

const saveCharacter = async () => {
  const currentUser = userStore.getCurrentUser()
  if (!currentUser) {
    console.error('No authenticated user found')
    return
  }

  savingCharacter.value = true
  try {
    if (editingCharacter.value) {
      // 캐릭터 수정 - 낙관적 업데이트
      const updatedCharacter = {
        ...editingCharacter.value,
        name: characterForm.value.name,
        server_id: characterForm.value.serverId,
        is_main: characterForm.value.isMain
      }
      
      // 낙관적 업데이트 적용
      const characterIndex = characters.value.findIndex(c => c.id === editingCharacter.value!.id)
      if (characterIndex !== -1) {
        characters.value[characterIndex] = updatedCharacter
      }

      const response: any = await $fetch(`/api/characters/${editingCharacter.value.id}`, {
        method: 'PUT',
        body: {
          name: characterForm.value.name,
          server_id: characterForm.value.serverId,
          is_main: characterForm.value.isMain
        }
      })

      if (!response.success) {
        // 실패 시 원래 데이터로 롤백
        if (characterIndex !== -1) {
          characters.value[characterIndex] = editingCharacter.value
        }
        throw new Error('캐릭터 수정에 실패했습니다.')
      }
    } else {
      // 새 캐릭터 추가 - 낙관적 업데이트
      const newCharacter = {
        id: `temp-${Date.now()}`, // 임시 ID
        name: characterForm.value.name,
        server_id: characterForm.value.serverId,
        is_main: characterForm.value.isMain,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        servers: {
          name: getServerName(characterForm.value.serverId)
        }
      }

      // 낙관적 업데이트 적용
      characters.value.push(newCharacter)

      const response: any = await $fetch('/api/characters', {
        method: 'POST',
        body: {
          user_id: currentUser.id,
          name: characterForm.value.name,
          server_id: characterForm.value.serverId,
          is_main: characterForm.value.isMain
        }
      })

      if (!response.success) {
        // 실패 시 추가된 캐릭터 제거
        const tempIndex = characters.value.findIndex(c => c.id === newCharacter.id)
        if (tempIndex !== -1) {
          characters.value.splice(tempIndex, 1)
        }
        throw new Error('캐릭터 추가에 실패했습니다.')
      }

      // 성공 시 실제 데이터로 교체
      const responseData = response as { success: boolean; character: any }
      if (responseData.character) {
        const tempIndex = characters.value.findIndex(c => c.id === newCharacter.id)
        if (tempIndex !== -1) {
          characters.value[tempIndex] = {
            ...responseData.character,
            servers: {
              name: getServerName(responseData.character.server_id)
            }
          }
        }
      }
    }

    // 스토어 캐시 무효화 및 새로고침
    await charactersStore.fetchCharacters(true)
    await loadCharacters()
    closeCharacterModal()
  } catch (error) {
    console.error('Error saving character:', error)
    // 에러 발생 시 전체 데이터 새로고침
    await charactersStore.fetchCharacters(true)
    await loadCharacters()
  } finally {
    savingCharacter.value = false
  }
}

const deleteCharacter = async (characterId: string) => {
  if (!confirm('정말로 이 캐릭터를 삭제하시겠습니까?')) return

  // 낙관적 업데이트 - 삭제할 캐릭터 백업
  const characterToDelete = characters.value.find(c => c.id === characterId)
  if (!characterToDelete) return

  // 낙관적 업데이트 적용
  const characterIndex = characters.value.findIndex(c => c.id === characterId)
  if (characterIndex !== -1) {
    characters.value.splice(characterIndex, 1)
  }

  try {
    const response: any = await $fetch(`/api/characters/${characterId}`, {
      method: 'DELETE'
    })

    if (response.success) {
      // 성공 시 스토어 캐시 무효화 및 새로고침
      await charactersStore.fetchCharacters(true)
      await loadCharacters()
    } else {
      // 실패 시 원래 데이터로 롤백
      if (characterIndex !== -1) {
        characters.value.splice(characterIndex, 0, characterToDelete)
      }
      console.error('Error deleting character:', response)
    }
  } catch (error) {
    // 에러 발생 시 원래 데이터로 롤백
    if (characterIndex !== -1) {
      characters.value.splice(characterIndex, 0, characterToDelete)
    }
    console.error('Error deleting character:', error)
  }
}

// 페이지 로드 시 데이터 가져오기
onMounted(async () => {
  try {
    console.log('Profile page mounted, loading data...')
    
    // 스토어에서 사용자 정보 가져오기
    const user = await userStore.fetchUser()
    console.log('User loaded from store:', user)
    
    if (user) {
      console.log('User authenticated, loading data...')
      // 순차적으로 로드하여 각각의 성공/실패를 확인
      await loadUserInfo()
      await loadCharacters()
      await loadServers()
      
      // 자동 토큰 리프레시 시작
      startAutoRefresh()
    } else {
      console.log('No authenticated user found')
    }
  } catch (error) {
    console.error('Error in onMounted:', error)
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.main-character-card {
  background-color: #f0f9ff; /* bg-blue-50 */
}

.dark .main-character-card {
  background-color: #374151 !important; /* bg-gray-700 */
}

/* 다크모드에서 노란색 글씨 강제 적용 */
.dark .main-character-card h3 {
  color: #fde047 !important; /* text-yellow-300 */
}

.dark .main-character-card button {
  color: #facc15 !important; /* text-yellow-400 */
}

.dark .main-character-card button:hover {
  color: #fde047 !important; /* text-yellow-300 */
}

/* 서브 캐릭터 수정 버튼도 노란색으로 */
.dark .bg-gray-700 button:first-child {
  color: #facc15 !important; /* text-yellow-400 */
}

.dark .bg-gray-700 button:first-child:hover {
  color: #fde047 !important; /* text-yellow-300 */
}

/* 커스텀 드롭다운 스타일 */
.custom-select {
  background-image: none !important;
}

.custom-select option {
  background-color: #ffffff;
  color: #374151;
  padding: 8px 12px;
}

.dark .custom-select option {
  background-color: #374151;
  color: #f9fafb;
}

.custom-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.dark .custom-select:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

/* 드롭다운 화살표 아이콘 애니메이션 */
.custom-select:focus + div svg {
  transform: rotate(180deg);
  transition: transform 0.2s ease-in-out;
}

.custom-select + div svg {
  transition: transform 0.2s ease-in-out;
}
</style> 