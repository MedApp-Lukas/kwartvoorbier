<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useDataStore } from '../stores/data'
import { useAppStateStore } from '../stores/appState'
import { AppState } from '../types'
import OrderForm from '../components/orders/OrderForm.vue'
import Countdown from '../components/Countdown.vue'
import ClosedMessage from '../components/ClosedMessage.vue'
import RouletteWheel from '../components/RouletteWheel.vue'

const data = useDataStore()
const appState = useAppStateStore()

const availableProducts = computed(() => {
  const currentDay = new Date().getDay()
  return data.products.filter(p => p.available_on_days && p.available_on_days.includes(currentDay))
})

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

async function handleOrderSubmit(payload: { locationId: number; productId: number }) {
  try {
    await data.addOrder(payload.locationId, payload.productId)
  } catch (e) {
    alert('Fout bij bestellen: ' + e)
  }
}
</script>

<template>
  <div>
    <!-- Status Display (like old home page) -->
    <Countdown 
        v-if="appState.state === AppState.COUNTDOWN" 
        :targetDate="appState.targetDate" 
        @complete="appState.checkTime" 
    />
    
    <div v-else-if="appState.state === AppState.ORDERING" class="mb-6">
        <div class="text-center p-8 bg-white rounded-lg shadow-lg mb-6">
            <h2 class="text-2xl font-semibold text-amber-800 mb-2">Het is tijd! 🍻</h2>
            <p class="text-gray-600">Bestel snel je favoriete drankje.</p>
            <div class="text-6xl mt-6">🏃💨</div>
        </div>
        
        <!-- Order Form when it's ordering time -->
        <div v-if="availableProducts.length === 0 || data.locations.length === 0" class="text-center p-8 bg-white rounded-lg shadow-lg">
            <h2 class="text-2xl font-semibold">Bestellen niet mogelijk</h2>
            <p>Geen producten beschikbaar voor vandaag.</p>
        </div>
        <OrderForm 
          v-else 
          :products="availableProducts" 
          :locations="data.locations" 
          @order-submit="handleOrderSubmit" 
        />
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
