<script setup lang="ts">
import Kerstmuts from '../assets/kerstmuts.png'

defineProps<{
  isChristmasThemeEnabled: boolean
}>()
</script>

<template>
  <header class="text-center py-8">
    <h1 class="text-5xl md:text-6xl font-bold text-purple-900 tracking-tighter">
      kwartvoorbi.e
      <span v-if="isChristmasThemeEnabled" class="relative inline-block">
        r
        <span 
          class="absolute"
          style="top: -35px; right: -35px; width: 60px; height: 60px; transform: rotate(15deg); z-index: 20;"
        >
          <img :src="Kerstmuts" alt="Kerstmuts" class="w-full h-full object-contain" />
        </span>
      </span>
      <span v-else class="inline-block">r</span>
    </h1>
    <p class="text-purple-700 mt-2 text-lg">Het is bijna tijd voor de borrel!</p>
  </header>
</template>
