<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <div class="flex items-center gap-4">
      <NuxtLink :to="`/quiz/${id}`" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">랭킹</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <div v-else-if="!rankingVisible" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
      <p class="text-gray-600 dark:text-gray-400">랭킹이 비공개입니다.</p>
    </div>

    <div v-else-if="ranking.length === 0" class="bg-white dark:bg-gray-800 shadow rounded-lg p-8 text-center">
      <p class="text-gray-600 dark:text-gray-400">아직 기록이 없습니다.</p>
    </div>

    <div v-else class="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <table class="w-full">
        <thead class="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">순위</th>
            <th class="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">이름</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">점수</th>
            <th class="px-4 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">소요 시간</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          <tr
            v-for="r in ranking"
            :key="r.userId"
            :class="r.isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/30' : ''"
            class="hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <td class="px-4 py-3 text-gray-900 dark:text-white font-medium">{{ r.rank }}</td>
            <td class="px-4 py-3 text-gray-900 dark:text-white">{{ r.name }}</td>
            <td class="px-4 py-3 text-right text-gray-900 dark:text-white">{{ r.totalScore }}</td>
            <td class="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{{ formatElapsed(r.totalElapsedMs) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const ranking = ref<any[]>([])
const rankingVisible = ref(true)
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
    const res = await $fetch<{ ranking: any[]; rankingVisible: boolean }>(`/api/quiz/rooms/${id.value}/ranking`)
    ranking.value = res.ranking || []
    rankingVisible.value = res.rankingVisible ?? true
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>
