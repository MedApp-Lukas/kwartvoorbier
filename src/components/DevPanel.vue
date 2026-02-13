<script setup lang="ts">
import { ref } from 'vue'
import { useAppStateStore } from '../stores/appState'
import { AppState } from '../types'

const appState = useAppStateStore()
const isOpen = ref(false)

const states = [
  { label: 'Closed', value: AppState.CLOSED },
  { label: 'Countdown', value: AppState.COUNTDOWN },
  { label: 'Ordering', value: AppState.ORDERING },
  { label: 'Roulette', value: AppState.ROULETTE },
]

function togglePanel() {
  isOpen.value = !isOpen.value
}

function setManualState(state: AppState | null) {
  appState.setManualState(state)
}

function triggerSpin() {
    appState.triggerRouletteSpin()
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col items-end">
    <!-- Toggle Button -->
    <button 
      @click="togglePanel"
      class="bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors"
      title="Open Dev Panel"
    >
      <span v-if="isOpen">✖</span>
      <span v-else>🛠️</span>
    </button>

    <!-- Panel Content -->
    <div v-if="isOpen" class="mt-4 bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-64">
      <h3 class="font-bold text-gray-800 mb-2 border-b pb-2">Dev Panel</h3>
      
      <div class="space-y-2">
        <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Force State</div>
        
        <button 
          @click="setManualState(null)"
          class="w-full text-left px-2 py-1 rounded text-sm mb-2"
          :class="appState.manualOverride === null ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-50'"
        >
          Auto (Default)
        </button>

        <button 
          v-for="state in states" 
          :key="state.value"
          @click="setManualState(state.value)"
          class="w-full text-left px-2 py-1 rounded text-sm"
          :class="appState.manualOverride === state.value ? 'bg-amber-100 text-amber-700 font-medium' : 'hover:bg-gray-50'"
        >
          {{ state.label }}
        </button>

        <div class="h-px bg-gray-100 my-2"></div>
        
        <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">Actions</div>
        <button 
            @click="triggerSpin"
            class="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-2 rounded font-medium transition-colors"
        >
            🎲 Spin Wheel
        </button>
      </div>
    </div>
  </div>
</template>
