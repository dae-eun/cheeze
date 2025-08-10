<template>
  <div class="p-8 text-gray-500 dark:text-gray-400">리다이렉트 중...</div>
  <!-- 루트 분기는 글로벌 미들웨어에서 처리됩니다. -->
</template>

<script setup lang="ts">
// 클라이언트 안전장치: 글로벌 미들웨어가 동작하지 않는 경우에도 보장
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/auth/me', { method: 'GET' })
    if (res?.success) {
      await navigateTo('/dashboard')
    } else {
      await navigateTo('/auth/login')
    }
  } catch {
    await navigateTo('/auth/login')
  }
})
</script>