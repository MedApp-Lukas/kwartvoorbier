<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAppStateStore } from '../stores/appState'
import Countdown from '../components/Countdown.vue'
import ClosedMessage from '../components/ClosedMessage.vue'
import { AppState } from '../types'

const appState = useAppStateStore()

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

    <div v-else-if="appState.state === AppState.ROULETTE" class="text-center p-8 bg-white rounded-lg shadow-lg">
        <h2 class="text-2xl font-semibold text-amber-800 mb-2">De besteltijd is voorbij!</h2>
        <p class="text-gray-600">Ga naar de bestelpagina om te zien wie er moet halen.</p>
        <div class="text-6xl mt-6">🎡</div>
    </div>

    <ClosedMessage 
        v-else-if="appState.state === AppState.CLOSED" 
        :message="appState.message" 
        :subMessage="appState.subMessage" 
    />
  </div>
</template>
