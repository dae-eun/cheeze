<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <div class="flex items-center gap-4">
      <NuxtLink :to="`/quiz/${id}`" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">내 결과</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <div v-else-if="!session" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
      <p class="text-gray-600 dark:text-gray-400">아직 참여 기록이 없습니다.</p>
      <NuxtLink :to="`/quiz/${id}/play`" class="mt-4 inline-block px-6 py-3 bg-blue-600 text-white rounded-md">플레이하기</NuxtLink>
    </div>

    <template v-else>
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">{{ room?.title }}</h2>
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">총점</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ session.total_score }}</p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">정답</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ session.total_solved_count }} / {{ session.total_problems }}</p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">소요 시간</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ formatElapsed(session.total_elapsed_ms) }}</p>
          </div>
        </div>
        <div class="flex gap-3">
          <NuxtLink :to="`/quiz/${id}/ranking`" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md">랭킹 보기</NuxtLink>
          <NuxtLink :to="`/quiz/${id}`" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">방으로</NuxtLink>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const session = ref<any>(null)
const room = ref<any>(null)
const loading = ref(true)

function formatElapsed(ms: number) {
  const sec = Math.floor(ms / 1000)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}분 ${s}초`
}

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch<{ session: any; room: any }>(`/api/quiz/rooms/${id.value}/my-result`)
    session.value = res.session
    room.value = res.room
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>
