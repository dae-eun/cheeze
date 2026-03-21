<template>
  <div class="space-y-8">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">실시간 배팅</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          조직원과 함께 승/패/무승부 배팅을 즐겨보세요.
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
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">배팅 방이 없습니다</h3>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">방을 만들어 조직원을 초대해보세요.</p>
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
        :to="`/betting/${room.id}`"
        class="block bg-white dark:bg-gray-800 shadow rounded-lg p-6 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-medium text-gray-900 dark:text-white">
              {{ room.title || '배팅 방' }}
              <span v-if="room.ended_at" class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">(종료됨)</span>
            </h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              초기 자금: {{ room.initial_funds?.toLocaleString() }}칩
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {{ formatDate(room.created_at) }}
            </p>
          </div>
          <span
            :class="[
              'px-3 py-1 rounded-full text-sm font-medium',
              room.ended_at
                ? 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
            ]"
          >
            {{ room.ended_at ? '종료됨' : '입장하기' }}
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
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">배팅 방 만들기</h2>
        <form @submit.prevent="createRoom">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">방 제목 (선택)</label>
              <input
                v-model="newRoom.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="예: 오늘 던전 결과"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">초기 자금 (참가 시 지급)</label>
              <input
                v-model.number="newRoom.initial_funds"
                type="number"
                min="1"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="10000"
              />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">참가자에게 지급할 가상 칩 수 · 기본 배팅금: {{ Math.floor((newRoom.initial_funds || 10000) / 10).toLocaleString() }}칩</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">배분 방식</label>
              <select
                v-model="newRoom.distribution_method"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="carry_over">전액 이월 (승자 없을 시 다음 판으로 누적, 잭팟)</option>
                <option value="disappear">상금 소멸 (승자 없을 시 풀 소멸)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">당첨 지급 방식</label>
              <select
                v-model="newRoom.payout_mode"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="pool">풀 분배 (상금 풀 비율 분배)</option>
                <option value="double">2배 모드 (당첨 시 배팅금 2배 수령)</option>
              </select>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">2배 모드: 맞추면 배팅금의 2배를 받습니다</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">수수료 (%)</label>
              <select
                v-model.number="newRoom.fee_percent"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option :value="0">0%</option>
                <option :value="5">5%</option>
                <option :value="10">10%</option>
                <option :value="15">15%</option>
                <option :value="20">20%</option>
              </select>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">상금 분배 전 풀에서 차감</p>
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
const newRoom = ref({ title: '', initial_funds: 10000, distribution_method: 'carry_over', payout_mode: 'pool', fee_percent: 0 })

function formatDate(d: string) {
  return new Date(d).toLocaleString('ko-KR')
}

async function fetchRooms() {
  loading.value = true
  try {
    const res = await $fetch<{ success: boolean; rooms: any[] }>('/api/betting/rooms')
    rooms.value = res.rooms || []
  } catch (e) {
    console.error(e)
    rooms.value = []
  } finally {
    loading.value = false
  }
}

async function createRoom() {
  if (newRoom.value.initial_funds < 1) {
    alert('초기 자금은 1 이상이어야 합니다.')
    return
  }
  creating.value = true
  try {
    const res = await $fetch<{ success: boolean; room: any }>('/api/betting/rooms', {
      method: 'POST',
      body: {
        title: newRoom.value.title || undefined,
        initial_funds: newRoom.value.initial_funds,
        distribution_method: newRoom.value.distribution_method,
        payout_mode: newRoom.value.payout_mode,
        fee_percent: newRoom.value.fee_percent
      }
    })
    showCreateModal.value = false
    newRoom.value = { title: '', initial_funds: 10000, distribution_method: 'carry_over', payout_mode: 'pool', fee_percent: 0 }
    await navigateTo(`/betting/${res.room.id}`)
  } catch (e: any) {
    alert(e.data?.message || '방 생성에 실패했습니다.')
  } finally {
    creating.value = false
  }
}

onMounted(fetchRooms)
</script>
