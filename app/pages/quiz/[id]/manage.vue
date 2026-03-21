<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <NuxtLink :to="`/quiz/${id}`" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">문제 관리 - {{ room?.title }}</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else>
      <!-- 방 설정 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-4">방 설정</h2>
        <div class="flex flex-wrap gap-4 items-center">
          <button
            @click="showRoomEdit = true"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            방 정보 수정
          </button>
          <select
            v-model="pendingStatus"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="preparing">준비중</option>
            <option value="playing">진행중</option>
            <option value="ended">종료</option>
          </select>
          <button
            @click="saveRoomStatus"
            :disabled="savingStatus || pendingStatus === room?.status"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ savingStatus ? '저장 중...' : '상태 저장' }}
          </button>
          <button
            @click="resetGame"
            :disabled="resetting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:opacity-50"
          >
            {{ resetting ? '초기화 중...' : '게임 초기화' }}
          </button>
        </div>
      </div>

      <!-- 문제 목록 -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-medium text-gray-900 dark:text-white">문제 목록</h2>
          <label class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md cursor-pointer" :class="{ 'opacity-50 pointer-events-none': uploadingCount > 0 }">
            <input type="file" accept="image/*" multiple class="hidden" @change="addProblem" />
            <svg v-if="uploadingCount === 0" class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <div v-else class="w-5 h-5 mr-2 animate-spin border-2 border-white border-t-transparent rounded-full" />
            {{ uploadingCount > 0 ? `${uploadingCount}개 업로드 중...` : '이미지 추가' }}
          </label>
        </div>

        <div v-if="problems.length === 0" class="py-12 text-center text-gray-500 dark:text-gray-400">
          문제가 없습니다. 이미지를 추가해주세요.
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="(p, idx) in problems"
            :key="p.id"
            class="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
          >
            <img
              :src="p.image_url"
              :alt="p.title"
              class="w-20 h-20 object-cover rounded"
            />
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 dark:text-white">문제 {{ idx + 1 }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">{{ p.title || '제목 없음' }}</p>
            </div>
            <div class="flex gap-2">
              <button
                @click="openAnswerAreaEditor(p)"
                class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded"
              >
                정답 영역
              </button>
              <button
                @click="editProblem(p)"
                class="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded"
              >
                수정
              </button>
              <button
                @click="deleteProblem(p)"
                class="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- 방 수정 모달 -->
    <div v-if="showRoomEdit" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="showRoomEdit = false">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">방 정보 수정</h2>
        <form @submit.prevent="saveRoomEdit">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">방 제목</label>
              <input v-model="editForm.title" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" required />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">설명</label>
              <textarea v-model="editForm.description" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">기본 클릭 횟수</label>
              <input v-model.number="editForm.default_click_limit" type="number" min="1" max="99" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">기본 제한 시간 (초)</label>
              <input v-model.number="editForm.default_time_limit_sec" type="number" min="5" max="600" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">오답 시 감점</label>
              <input v-model.number="editForm.wrong_penalty" type="number" min="0" max="999" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">오답 클릭 시 차감할 점수 (0 = 감점 없음)</p>
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" @click="showRoomEdit = false">취소</button>
            <button type="submit" :disabled="saving" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">{{ saving ? '저장 중...' : '저장' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 정답 영역 편집 모달 -->
    <div v-if="editingAnswerArea" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto" @click.self="closeAnswerAreaEditor">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" @click.stop>
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">정답 영역 설정 - {{ editingAnswerArea?.title || '문제' }}</h2>
            <button @click="closeAnswerAreaEditor" class="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-400">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">영역 형태</label>
            <select v-model="answerAreaForm.shapeType" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="RECT">사각형 (드래그)</option>
              <option value="POLYGON">다각형 (클릭으로 꼭짓점)</option>
            </select>
          </div>
          <div class="relative inline-block max-w-full">
            <img
              ref="areaEditorImgRef"
              :src="editingAnswerArea?.image_url"
              alt="문제"
              class="max-w-full h-auto block"
              @load="onAreaEditorImageLoad"
            />
            <canvas
              ref="areaEditorCanvasRef"
              class="absolute top-0 left-0 w-full h-full cursor-crosshair"
              @mousedown="onAreaEditorMouseDown"
              @mousemove="onAreaEditorMouseMove"
              @mouseup="onAreaEditorMouseUp"
              @mouseleave="onAreaEditorMouseUp"
            />
          </div>
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {{ answerAreaForm.shapeType === 'RECT' ? '이미지 위에서 드래그하여 사각형 영역을 지정하세요.' : '이미지 위를 클릭하여 다각형 꼭짓점을 찍으세요. (3점 이상)' }}
          </p>
          <div class="mt-4 flex gap-2">
            <button
              @click="saveAnswerArea"
              :disabled="answerAreaSaving || !answerAreaHasArea"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
            >
              {{ answerAreaSaving ? '저장 중...' : '저장' }}
            </button>
            <button v-if="answerAreaHasArea" @click="clearAnswerArea" class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md">
              초기화
            </button>
            <button @click="closeAnswerAreaEditor" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300">
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 문제 수정 모달 -->
    <div v-if="editingProblem" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" @click.self="editingProblem = null">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">문제 수정</h2>
        <form @submit.prevent="saveProblemEdit">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">제목</label>
              <input v-model="editProblemForm.title" type="text" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">제한 시간 (초)</label>
              <input v-model.number="editProblemForm.time_limit_sec" type="number" min="5" max="600" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">클릭 횟수</label>
              <input v-model.number="editProblemForm.click_limit" type="number" min="1" max="99" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">배점</label>
              <input v-model.number="editProblemForm.base_score" type="number" min="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
          </div>
          <div class="mt-6 flex justify-end gap-2">
            <button type="button" class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md" @click="editingProblem = null">취소</button>
            <button type="submit" :disabled="savingProblem" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">{{ savingProblem ? '저장 중...' : '저장' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const id = computed(() => route.params.id as string)

const room = ref<any>(null)
const problems = ref<any[]>([])
const loading = ref(true)
const showRoomEdit = ref(false)
const editingProblem = ref<any>(null)
const editingAnswerArea = ref<any>(null)
const saving = ref(false)
const savingProblem = ref(false)
const answerAreaSaving = ref(false)
const savingStatus = ref(false)
const resetting = ref(false)
const uploadingCount = ref(0)
const pendingStatus = ref<'preparing' | 'playing' | 'ended'>('preparing')

const areaEditorImgRef = ref<HTMLImageElement | null>(null)
const areaEditorCanvasRef = ref<HTMLCanvasElement | null>(null)

const editForm = ref({ title: '', description: '', default_click_limit: 5, default_time_limit_sec: 30, wrong_penalty: 0 })
const editProblemForm = ref({ title: '', time_limit_sec: 30, click_limit: 5, base_score: 100 })
const answerAreaForm = ref({
  shapeType: 'RECT' as 'RECT' | 'POLYGON',
  rect: null as { x: number; y: number; w: number; h: number } | null,
  polygon: [] as { x: number; y: number }[],
  isDrawing: false,
  startPos: { x: 0, y: 0 },
  imgWidth: 0,
  imgHeight: 0
})
const answerAreaHasArea = computed(() => {
  const f = answerAreaForm.value
  return f.shapeType === 'RECT' ? f.rect !== null : f.polygon.length >= 3
})

async function fetchData() {
  loading.value = true
  try {
    const res = await $fetch<{ room: any; problems: any[] }>(`/api/quiz/rooms/${id.value}`)
    room.value = res.room
    problems.value = res.problems || []
    pendingStatus.value = (room.value?.status || 'preparing') as 'preparing' | 'playing' | 'ended'
    const rules = room.value?.rules || {}
    editForm.value = {
      title: room.value?.title || '',
      description: room.value?.description || '',
      default_click_limit: rules.default_click_limit ?? 5,
      default_time_limit_sec: rules.default_time_limit_sec ?? 30,
      wrong_penalty: rules.wrong_penalty ?? 0
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function saveRoomStatus() {
  if (pendingStatus.value === 'playing') {
    const withoutAnswer = problems.value
      .map((p: any, idx: number) => ({ p, idx }))
      .filter(({ p }: { p: any }) => !p.has_answer_area)
    if (withoutAnswer.length > 0) {
      const names = withoutAnswer.map(({ idx }: { idx: number }) => `문제 ${idx + 1}`).join(', ')
      alert(`정답 설정이 안 된 문제가 있습니다. (${names})`)
      return
    }
  }
  savingStatus.value = true
  try {
    await $fetch(`/api/quiz/rooms/${id.value}`, {
      method: 'PUT',
      body: { status: pendingStatus.value }
    })
    if (room.value) room.value.status = pendingStatus.value
  } catch (e: any) {
    alert(e.data?.statusMessage || '저장 실패')
  } finally {
    savingStatus.value = false
  }
}

async function resetGame() {
  if (!confirm('랭킹이 삭제되고 모든 참가자가 다시 참여할 수 있습니다. 진행할까요?')) return
  resetting.value = true
  try {
    await $fetch(`/api/quiz/rooms/${id.value}/reset`, { method: 'POST' })
    await fetchData()
  } catch (e: any) {
    alert(e.data?.statusMessage || '초기화 실패')
  } finally {
    resetting.value = false
  }
}

async function addProblem(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length === 0) return
  uploadingCount.value = files.length
  try {
    for (const file of files) {
      const formData = new FormData()
      formData.append('image', file)
      await $fetch(`/api/quiz/rooms/${id.value}/problems`, {
        method: 'POST',
        body: formData
      })
      uploadingCount.value--
    }
    await fetchData()
  } catch (err: any) {
    alert(err.data?.statusMessage || '업로드 실패')
  } finally {
    uploadingCount.value = 0
    input.value = ''
  }
}

function editProblem(p: any) {
  editingProblem.value = p
  editProblemForm.value = {
    title: p.title || '',
    time_limit_sec: p.time_limit_sec ?? 30,
    click_limit: p.click_limit ?? 5,
    base_score: p.base_score ?? 100
  }
}

async function saveProblemEdit() {
  if (!editingProblem.value) return
  savingProblem.value = true
  try {
    await $fetch(`/api/quiz/problems/${editingProblem.value.id}`, {
      method: 'PUT',
      body: editProblemForm.value
    })
    editingProblem.value = null
    await fetchData()
  } catch (e: any) {
    alert(e.data?.statusMessage || '저장 실패')
  } finally {
    savingProblem.value = false
  }
}

async function deleteProblem(p: any) {
  if (!confirm('이 문제를 삭제하시겠습니까?')) return
  try {
    await $fetch(`/api/quiz/problems/${p.id}`, { method: 'DELETE' })
    await fetchData()
  } catch (e: any) {
    alert(e.data?.statusMessage || '삭제 실패')
  }
}

async function saveRoomEdit() {
  saving.value = true
  try {
    await $fetch(`/api/quiz/rooms/${id.value}`, {
      method: 'PUT',
      body: {
        title: editForm.value.title,
        description: editForm.value.description,
        default_click_limit: editForm.value.default_click_limit,
        default_time_limit_sec: editForm.value.default_time_limit_sec,
        wrong_penalty: editForm.value.wrong_penalty
      }
    })
    showRoomEdit.value = false
    await fetchData()
  } catch (e: any) {
    alert(e.data?.statusMessage || '저장 실패')
  } finally {
    saving.value = false
  }
}

function openAnswerAreaEditor(p: any) {
  editingAnswerArea.value = p
  answerAreaForm.value = {
    shapeType: 'RECT',
    rect: null,
    polygon: [],
    isDrawing: false,
    startPos: { x: 0, y: 0 },
    imgWidth: 0,
    imgHeight: 0
  }
}

async function loadExistingAnswerArea() {
  if (!editingAnswerArea.value) return
  try {
    const areaRes = await $fetch<{ answerArea: any }>(`/api/quiz/problems/${editingAnswerArea.value.id}/answer-area`).catch(() => ({ answerArea: null }))
    if (areaRes?.answerArea) {
      answerAreaForm.value.shapeType = areaRes.answerArea.shape_type || 'RECT'
      const pt = areaRes.answerArea.points_json
      if (answerAreaForm.value.shapeType === 'RECT' && pt && typeof pt.x === 'number') {
        answerAreaForm.value.rect = { x: pt.x, y: pt.y, w: pt.width ?? pt.w ?? 0, h: pt.height ?? pt.h ?? 0 }
      } else if (answerAreaForm.value.shapeType === 'POLYGON' && Array.isArray(pt)) {
        answerAreaForm.value.polygon = pt
      }
    }
  } catch (_) {}
}

function closeAnswerAreaEditor() {
  editingAnswerArea.value = null
}

function onAreaEditorImageLoad() {
  if (!areaEditorImgRef.value) return
  answerAreaForm.value.imgWidth = areaEditorImgRef.value.naturalWidth
  answerAreaForm.value.imgHeight = areaEditorImgRef.value.naturalHeight
  nextTick(() => {
    initAreaEditorCanvas()
    loadExistingAnswerArea().then(() => drawAreaEditor())
  })
}

function initAreaEditorCanvas() {
  if (!areaEditorCanvasRef.value || !areaEditorImgRef.value) return
  const r = areaEditorImgRef.value.getBoundingClientRect()
  areaEditorCanvasRef.value.width = r.width
  areaEditorCanvasRef.value.height = r.height
}

function getAreaEditorCoords(e: MouseEvent) {
  if (!areaEditorCanvasRef.value) return { x: 0, y: 0 }
  const r = areaEditorCanvasRef.value.getBoundingClientRect()
  const scaleX = answerAreaForm.value.imgWidth / r.width
  const scaleY = answerAreaForm.value.imgHeight / r.height
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY
  }
}

function toNormalizedArea(x: number, y: number) {
  const w = answerAreaForm.value.imgWidth || 1
  const h = answerAreaForm.value.imgHeight || 1
  return {
    x: Math.max(0, Math.min(1, x / w)),
    y: Math.max(0, Math.min(1, y / h))
  }
}

function onAreaEditorMouseDown(e: MouseEvent) {
  const { x, y } = getAreaEditorCoords(e)
  const n = toNormalizedArea(x, y)
  if (answerAreaForm.value.shapeType === 'RECT') {
    answerAreaForm.value.isDrawing = true
    answerAreaForm.value.startPos = { x, y }
    answerAreaForm.value.rect = { x: n.x, y: n.y, w: 0, h: 0 }
  } else {
    answerAreaForm.value.polygon = [...answerAreaForm.value.polygon, n]
  }
  drawAreaEditor()
}

function onAreaEditorMouseMove(e: MouseEvent) {
  if (answerAreaForm.value.shapeType !== 'RECT' || !answerAreaForm.value.isDrawing || !answerAreaForm.value.rect) return
  const { x, y } = getAreaEditorCoords(e)
  const n = toNormalizedArea(x, y)
  const sx = toNormalizedArea(answerAreaForm.value.startPos.x, answerAreaForm.value.startPos.y)
  answerAreaForm.value.rect = {
    x: Math.min(sx.x, n.x),
    y: Math.min(sx.y, n.y),
    w: Math.abs(n.x - sx.x),
    h: Math.abs(n.y - sx.y)
  }
  drawAreaEditor()
}

function onAreaEditorMouseUp() {
  if (answerAreaForm.value.shapeType === 'RECT' && answerAreaForm.value.isDrawing) {
    answerAreaForm.value.isDrawing = false
  }
  drawAreaEditor()
}

function drawAreaEditor() {
  const c = areaEditorCanvasRef.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const f = answerAreaForm.value
  const scaleX = c.width / (f.imgWidth || 1)
  const scaleY = c.height / (f.imgHeight || 1)

  ctx.clearRect(0, 0, c.width, c.height)
  ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'
  ctx.lineWidth = 3
  ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'

  if (f.shapeType === 'RECT' && f.rect) {
    const r = f.rect
    ctx.strokeRect(r.x * f.imgWidth * scaleX, r.y * f.imgHeight * scaleY, r.w * f.imgWidth * scaleX, r.h * f.imgHeight * scaleY)
    ctx.fillRect(r.x * f.imgWidth * scaleX, r.y * f.imgHeight * scaleY, r.w * f.imgWidth * scaleX, r.h * f.imgHeight * scaleY)
  } else if (f.shapeType === 'POLYGON' && f.polygon.length >= 2) {
    ctx.beginPath()
    f.polygon.forEach((p, i) => {
      const px = p.x * f.imgWidth * scaleX
      const py = p.y * f.imgHeight * scaleY
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    if (f.polygon.length >= 3) ctx.closePath()
    ctx.stroke()
    if (f.polygon.length >= 3) ctx.fill()
  }
}

function clearAnswerArea() {
  answerAreaForm.value.rect = null
  answerAreaForm.value.polygon = []
  drawAreaEditor()
}

async function saveAnswerArea() {
  if (!editingAnswerArea.value) return
  const f = answerAreaForm.value
  let pointsJson: any
  if (f.shapeType === 'RECT' && f.rect) {
    pointsJson = { x: f.rect.x, y: f.rect.y, width: f.rect.w, height: f.rect.h }
  } else if (f.shapeType === 'POLYGON' && f.polygon.length >= 3) {
    pointsJson = f.polygon
  } else {
    alert('영역을 지정해주세요.')
    return
  }
  answerAreaSaving.value = true
  try {
    await $fetch(`/api/quiz/problems/${editingAnswerArea.value.id}/answer-area`, {
      method: 'PUT',
      body: { shape_type: f.shapeType, points_json: pointsJson, normalized_yn: true }
    })
    const p = problems.value.find((pr: any) => pr.id === editingAnswerArea.value.id)
    if (p) p.has_answer_area = true
    alert('저장되었습니다.')
    closeAnswerAreaEditor()
  } catch (e: any) {
    alert(e.data?.statusMessage || '저장 실패')
  } finally {
    answerAreaSaving.value = false
  }
}

watch(() => answerAreaForm.value.shapeType, () => {
  answerAreaForm.value.rect = null
  answerAreaForm.value.polygon = []
  nextTick(() => drawAreaEditor())
})

onMounted(fetchData)
</script>
