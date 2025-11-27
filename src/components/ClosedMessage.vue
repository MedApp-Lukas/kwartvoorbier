<script setup lang="ts">
defineProps<{
  message: string
  subMessage: string
}>()
</script>

<template>
  <div class="text-center p-8 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-semibold text-amber-800 mb-2">{{ message }}</h2>
    <p class="text-gray-600">{{ subMessage }}</p>
    <div class="text-6xl mt-6">😴</div>
  </div>
</template>
