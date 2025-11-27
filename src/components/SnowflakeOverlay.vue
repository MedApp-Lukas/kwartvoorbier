<script setup lang="ts">
import { ref, onMounted } from 'vue'

const snowflakes = ref<Array<{ left: string; animationDuration: string; fontSize: string; opacity: number }>>([])

onMounted(() => {
  const flakes: Array<{ left: string; animationDuration: string; fontSize: string; opacity: number }> = []
  for (let i = 0; i < 50; i++) {
    flakes.push({
      left: `${Math.random() * 100}%`,
      animationDuration: `${Math.random() * 10 + 10}s`,
      fontSize: `${Math.random() * 1.5 + 0.5}em`,
      opacity: Math.random() * 0.7 + 0.3
    })
  }
  snowflakes.value = flakes
})
</script>

<template>
  <div class="snow-container">
    <div 
      v-for="(flake, index) in snowflakes" 
      :key="index"
      class="snowflake"
      :style="{
        left: flake.left,
        animationDuration: flake.animationDuration,
        fontSize: flake.fontSize,
        opacity: flake.opacity
      }"
    >
      ❄
    </div>
  </div>
</template>
