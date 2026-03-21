<template>
  <div class="space-y-6">
    <div class="flex items-center gap-4">
      <NuxtLink :to="`/quiz/${roomId}/manage`" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </NuxtLink>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">정답 영역 설정</h1>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
    </div>

    <template v-else-if="problem">
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ problem.title || '문제' }}</p>
        <div class="flex gap-4 flex-wrap">
          <div class="flex-1 min-w-[300px]">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">영역 형태</label>
            <select v-model="shapeType" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="RECT">사각형</option>
              <option value="POLYGON">다각형</option>
            </select>
          </div>
        </div>
        <div class="mt-4 relative inline-block max-w-full" ref="containerRef">
          <img
            ref="imgRef"
            :src="problem.image_url"
            alt="문제 이미지"
            class="max-w-full h-auto block"
            @load="onImageLoad"
          />
          <canvas
            ref="canvasRef"
            class="absolute top-0 left-0 w-full h-full cursor-crosshair"
            :style="{ maxWidth: imgWidth + 'px', maxHeight: imgHeight + 'px' }"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @mouseleave="onMouseUp"
          />
        </div>
        <div class="mt-4 flex gap-2">
          <button
            @click="saveArea"
            :disabled="saving || !hasArea"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50"
          >
            {{ saving ? '저장 중...' : '저장' }}
          </button>
          <button
            v-if="hasArea"
            @click="clearArea"
            class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md"
          >
            초기화
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const roomId = computed(() => route.params.id as string)
const problemId = computed(() => route.params.problemId as string)

const problem = ref<any>(null)
const loading = ref(true)
const saving = ref(false)
const imgRef = ref<HTMLImageElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const shapeType = ref<'RECT' | 'POLYGON'>('RECT')
const imgWidth = ref(0)
const imgHeight = ref(0)

const rect = ref<{ x: number; y: number; w: number; h: number } | null>(null)
const polygon = ref<{ x: number; y: number }[]>([])
const isDrawing = ref(false)
const startPos = ref({ x: 0, y: 0 })

const hasArea = computed(() => {
  if (shapeType.value === 'RECT') return rect.value !== null
  return polygon.value.length >= 3
})

function toNormalized(x: number, y: number) {
  const w = imgWidth.value || 1
  const h = imgHeight.value || 1
  return {
    x: Math.max(0, Math.min(1, x / w)),
    y: Math.max(0, Math.min(1, y / h))
  }
}

function onImageLoad() {
  if (!imgRef.value) return
  imgWidth.value = imgRef.value.naturalWidth
  imgHeight.value = imgRef.value.naturalHeight
  initCanvas()
}

function initCanvas() {
  if (!canvasRef.value || !imgRef.value) return
  const rect = imgRef.value.getBoundingClientRect()
  canvasRef.value.width = rect.width
  canvasRef.value.height = rect.height
  draw()
}

function getCanvasCoords(e: MouseEvent) {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const r = canvasRef.value.getBoundingClientRect()
  const scaleX = imgWidth.value / r.width
  const scaleY = imgHeight.value / r.height
  return {
    x: (e.clientX - r.left) * scaleX,
    y: (e.clientY - r.top) * scaleY
  }
}

function onMouseDown(e: MouseEvent) {
  const { x, y } = getCanvasCoords(e)
  const n = toNormalized(x, y)
  if (shapeType.value === 'RECT') {
    isDrawing.value = true
    startPos.value = { x, y }
    rect.value = { x: n.x, y: n.y, w: 0, h: 0 }
  } else {
    polygon.value = [...polygon.value, n]
  }
}

function onMouseMove(e: MouseEvent) {
  if (shapeType.value !== 'RECT' || !isDrawing.value || !rect.value) return
  const { x, y } = getCanvasCoords(e)
  const n = toNormalized(x, y)
  const sx = toNormalized(startPos.value.x, startPos.value.y)
  rect.value = {
    x: Math.min(sx.x, n.x),
    y: Math.min(sx.y, n.y),
    w: Math.abs(n.x - sx.x),
    h: Math.abs(n.y - sx.y)
  }
  draw()
}

function onMouseUp(e: MouseEvent) {
  if (shapeType.value === 'RECT' && isDrawing.value) {
    isDrawing.value = false
    draw()
  }
}

function draw() {
  const c = canvasRef.value
  if (!c) return
  const ctx = c.getContext('2d')
  if (!ctx) return
  const scaleX = c.width / imgWidth.value
  const scaleY = c.height / imgHeight.value

  ctx.clearRect(0, 0, c.width, c.height)

  ctx.strokeStyle = 'rgba(34, 197, 94, 0.8)'
  ctx.lineWidth = 3
  ctx.fillStyle = 'rgba(34, 197, 94, 0.2)'

  if (shapeType.value === 'RECT' && rect.value) {
    const r = rect.value
    ctx.strokeRect(r.x * imgWidth.value * scaleX, r.y * imgHeight.value * scaleY, r.w * imgWidth.value * scaleX, r.h * imgHeight.value * scaleY)
    ctx.fillRect(r.x * imgWidth.value * scaleX, r.y * imgHeight.value * scaleY, r.w * imgWidth.value * scaleX, r.h * imgHeight.value * scaleY)
  } else if (shapeType.value === 'POLYGON' && polygon.value.length >= 2) {
    ctx.beginPath()
    polygon.value.forEach((p, i) => {
      const px = p.x * imgWidth.value * scaleX
      const py = p.y * imgHeight.value * scaleY
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    })
    if (polygon.value.length >= 3) ctx.closePath()
    ctx.stroke()
    if (polygon.value.length >= 3) ctx.fill()
  }
}

function clearArea() {
  rect.value = null
  polygon.value = []
  draw()
}

async function saveArea() {
  let pointsJson: any
  if (shapeType.value === 'RECT' && rect.value) {
    pointsJson = { x: rect.value.x, y: rect.value.y, width: rect.value.w, height: rect.value.h }
  } else if (shapeType.value === 'POLYGON' && polygon.value.length >= 3) {
    pointsJson = polygon.value
  } else {
    alert('영역을 지정해주세요.')
    return
  }

  saving.value = true
  try {
    await $fetch(`/api/quiz/problems/${problemId.value}/answer-area`, {
      method: 'PUT',
      body: { shape_type: shapeType.value, points_json: pointsJson, normalized_yn: true }
    })
    alert('저장되었습니다.')
  } catch (e: any) {
    alert(e.data?.statusMessage || '저장 실패')
  } finally {
    saving.value = false
  }
}

async function fetchData() {
  loading.value = true
  try {
    const roomRes = await $fetch<{ room: any; problems: any[] }>(`/api/quiz/rooms/${roomId.value}`)
    problem.value = roomRes.problems?.find((p: any) => p.id === problemId.value)
    if (!problem.value) return

    const areaRes = await $fetch<{ answerArea: any }>(`/api/quiz/problems/${problemId.value}/answer-area`).catch(() => ({ answerArea: null }))
    if (areaRes.answerArea) {
      shapeType.value = areaRes.answerArea.shape_type || 'RECT'
      const p = areaRes.answerArea.points_json
      if (shapeType.value === 'RECT' && p && typeof p.x === 'number') {
        rect.value = { x: p.x, y: p.y, w: p.width ?? p.w ?? 0, h: p.height ?? p.h ?? 0 }
      } else if (shapeType.value === 'POLYGON' && Array.isArray(p)) {
        polygon.value = p
      }
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

watch([rect, polygon, shapeType], () => draw(), { deep: true })
</script>
