<template>
  <div class="min-h-screen bg-blue-500 flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg">
      <h1 class="text-4xl font-bold text-red-500 mb-4">
        Tailwind CSS 테스트
      </h1>
      <p class="text-gray-700 mb-6">
        이 텍스트가 회색이고 제목이 빨간색이면 Tailwind CSS가 작동하는 것입니다.
      </p>
      <button class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
        초록색 버튼
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})
</script> 