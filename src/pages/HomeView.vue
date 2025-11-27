<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'
import { useDataStore } from '../stores/data'
import { useAppStateStore } from '../stores/appState'
import Countdown from '../components/Countdown.vue'
import ClosedMessage from '../components/ClosedMessage.vue'
import RouletteWheel from '../components/RouletteWheel.vue'
import { AppState } from '../types'

const data = useDataStore()
const appState = useAppStateStore()

const participants = computed(() => {
    // Unique users who ordered
    const userIds = new Set(data.orders.map(o => o.customerName))
    return Array.from(userIds)
})

// Store interval reference for cleanup
let timeCheckInterval: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  appState.checkTime()
  timeCheckInterval = setInterval(appState.checkTime, 30000)
})

onUnmounted(() => {
  if (timeCheckInterval) {
    clearInterval(timeCheckInterval)
  }
})
</script>

<template>
  <div>
    <Countdown 
        v-if="appState.state === AppState.COUNTDOWN" 
        :targetDate="appState.targetDate" 
        @complete="appState.checkTime" 
    />
    
    <div v-else-if="appState.state === AppState.ORDERING" class="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold text-amber-800 mb-2">Het is tijd! 🍻</h2>
        <p class="text-gray-600">Bestel snel je favoriete drankje.</p>
        <div class="text-6xl mt-6">🏃💨</div>
    </div>

    <RouletteWheel 
        v-else-if="appState.state === AppState.ROULETTE" 
        :participants="participants" 
    />

    <ClosedMessage 
        v-else-if="appState.state === AppState.CLOSED" 
        :message="appState.message" 
        :subMessage="appState.subMessage" 
    />
  </div>
</template>
