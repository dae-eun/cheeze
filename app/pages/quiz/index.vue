<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">이미지 퀴즈</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          이미지를 클릭해 정답 영역을 찾는 퀴즈에 참여해보세요.
        </p>
      </div>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        방 만들기
      </button>
    </div>

    <div v-if="loading" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8">
      <div class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>

    <div v-else-if="rooms.length === 0" class="bg-white dark:bg-gray-800 shadow rounded-lg p-12 text-center">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">퀴즈 방이 없습니다</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">방을 만들어 퀴즈를 출제해보세요.</p>
      <button
        @click="showCreateModal = true"
        class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
      >
        방 만들기
      </button>
    </div>

    <div v-else class="grid gap-4">
      <NuxtLink
        v-for="room in rooms"
        :key="room.id"
        :to="`/quiz/${room.id}`"
        class="block bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ room.title || '퀴즈 방' }}
              <span v-if="room.status === 'ended'" class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(종료됨)</span>
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ room.description || '설명 없음' }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {{ formatDate(room.created_at) }}
            </p>
          </div>
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              room.status === 'ended'
                ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                : room.status === 'playing'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            ]"
          >
            {{ statusText(room.status) }}
          </span>
        </div>
      </NuxtLink>
    </div>

    <!-- 방 만들기 모달 -->
    <div
      v-if="showCreateModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      @click.self="showCreateModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">퀴즈 방 만들기</h2>
        <form @submit.prevent="createRoom">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">방 제목 *</label>
              <input
                v-model="newRoom.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="예: 지도에서 찾기"
                required
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">설명</label>
              <textarea
                v-model="newRoom.description"
                rows="2"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="방에 대한 설명"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">기본 클릭 횟수</label>
              <input
                v-model.number="newRoom.default_click_limit"
                type="number"
                min="1"
                max="99"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">기본 제한 시간 (초)</label>
              <input
                v-model.number="newRoom.default_time_limit_sec"
                type="number"
                min="5"
                max="600"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">오답 시 감점</label>
              <input
                v-model.number="newRoom.wrong_penalty"
                type="number"
                min="0"
                max="999"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="0이면 감점 없음"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">오답 클릭 시 차감할 점수 (0 = 감점 없음)</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button
              type="button"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              @click="showCreateModal = false"
            >
              취소
            </button>
            <button
              type="submit"
              :disabled="creating"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {{ creating ? '생성 중...' : '생성' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const rooms = ref<any[]>([])
const loading = ref(true)
const showCreateModal = ref(false)
const creating = ref(false)
const newRoom = ref({
  title: '',
  description: '',
  default_click_limit: 5,
  default_time_limit_sec: 30,
  wrong_penalty: 0
})

function statusText(s: string) {
  return { preparing: '준비중', playing: '진행중', ended: '종료됨' }[s] || s
}

function formatDate(d: string) {
  return new Date(d).toLocaleString('ko-KR')
}

async function fetchRooms() {
  loading.value = true
  try {
    const res = await $fetch<{ rooms: any[] }>('/api/quiz/rooms')
    rooms.value = res.rooms || []
  } catch (e) {
    console.error(e)
    rooms.value = []
  } finally {
    loading.value = false
  }
}

async function createRoom() {
  if (!newRoom.value.title?.trim()) {
    alert('방 제목을 입력해주세요.')
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ success: boolean; room: any }>('/api/quiz/rooms', {
      method: 'POST',
      body: {
        title: newRoom.value.title.trim(),
        description: newRoom.value.description?.trim() || undefined,
        default_click_limit: newRoom.value.default_click_limit,
        default_time_limit_sec: newRoom.value.default_time_limit_sec,
        wrong_penalty: newRoom.value.wrong_penalty
      }
    })
    showCreateModal.value = false
    newRoom.value = { title: '', description: '', default_click_limit: 5, default_time_limit_sec: 30, wrong_penalty: 0 }
    await navigateTo(`/quiz/${res.room.id}`)
  } catch (e: any) {
    alert(e.data?.statusMessage || e.data?.message || '방 생성에 실패했습니다.')
  } finally {
    creating.value = false
  }
}

onMounted(fetchRooms)
</script>
