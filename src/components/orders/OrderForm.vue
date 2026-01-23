<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useDataStore } from '../../stores/data'
import type { Product, Location, Order } from '../../types'

const props = defineProps<{
  products: Product[]
  locations: Location[]
}>()

const emit = defineEmits<{
  (e: 'order-submit', payload: { locationId: number; productId: number }): void
}>()

const data = useDataStore()

const locationId = ref<string>('')
const productId = ref<string>('')
const isSubmitted = ref(false)

// Initialize location with user's last location or first available
onMounted(() => {
  initializeLocation()
})

watch(() => props.locations, (newLocs) => {
  if (newLocs.length > 0 && !locationId.value) {
    initializeLocation()
  }
})

watch(() => props.products, (newProds) => {
  if (newProds.length > 0 && !productId.value) {
    productId.value = String(newProds[0].id)
  }
}, { immediate: true })

function initializeLocation() {
  // Check if user has a last location from order history
  const lastLocationId = data.getUserLastLocation
  if (lastLocationId && props.locations.some(l => l.id === lastLocationId)) {
    locationId.value = String(lastLocationId)
  } else if (props.locations.length > 0) {
    // Fallback to first location
    locationId.value = String(props.locations[0].id)
  }
}

const orderedProduct = computed(() => props.products.find(p => p.id === Number(productId.value)))
const orderLocation = computed(() => props.locations.find(l => l.id === Number(locationId.value)))

const orderHistory = computed(() => data.getUserOrderHistory)

function handleSubmit() {
  if (locationId.value && productId.value) {
    emit('order-submit', { locationId: Number(locationId.value), productId: Number(productId.value) })
    isSubmitted.value = true
  }
}

function handleNewOrderClick() {
  initializeLocation()
  if (props.products.length > 0) productId.value = String(props.products[0].id)
  isSubmitted.value = false
}

function handleReorder(order: Order) {
  locationId.value = String(order.locations.id)
  productId.value = String(order.products.id)
  handleSubmit()
}
</script>

<template>
  <div v-if="isSubmitted" class="text-center p-8 bg-white rounded-lg shadow-lg">
    <h2 class="text-3xl font-bold text-green-600 mb-4">Bestelling geplaatst!</h2>
    <p class="text-gray-700 text-lg">
      Je <span class="font-semibold">{{ orderedProduct?.name }}</span> is onderweg naar <span class="font-semibold">{{ orderLocation?.name }}</span>.
    </p>
    <p class="text-5xl mt-6">🍻</p>
    <button
      @click="handleNewOrderClick"
      class="mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
    >
      Nog een bestelling plaatsen
    </button>
  </div>

  <div v-else class="w-full max-w-4xl mx-auto space-y-6">
    <!-- Order History Section - Swipeable Carousel -->
    <div v-if="orderHistory.length > 0" class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg shadow-md p-6">
      <h3 class="text-xl font-bold text-amber-900 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Je laatste bestellingen
        <span class="ml-2 text-sm font-normal text-amber-700">(swipe →)</span>
      </h3>
      
      <!-- Carousel Container -->
      <div class="relative">
        <div 
          class="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 hide-scrollbar"
          style="scrollbar-width: none; -ms-overflow-style: none;"
        >
          <button
            v-for="order in orderHistory.slice(0, 5)"
            :key="order.id"
            @click="handleReorder(order)"
            class="flex-shrink-0 w-72 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 border-2 border-amber-200 hover:border-amber-400 text-left snap-start group"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="text-2xl">🍺</span>
                <p class="font-bold text-amber-900">{{ order.products.name }}</p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-600 group-hover:text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div class="space-y-1 text-sm text-gray-600">
              <p class="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ order.locations.name }}
              </p>
              <p class="flex items-center text-xs text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ order.created_at.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
              </p>
            </div>
            <div class="mt-3 pt-2 border-t border-amber-200">
              <span class="text-xs font-semibold text-amber-700 group-hover:text-amber-800">
                ↻ Bestel nog een keer
              </span>
            </div>
          </button>
        </div>
        
        <!-- Scroll indicator dots -->
        <div v-if="orderHistory.length > 1" class="flex justify-center gap-1 mt-2">
          <div 
            v-for="i in Math.min(orderHistory.length, 5)" 
            :key="i"
            class="w-2 h-2 rounded-full bg-amber-300"
          ></div>
        </div>
      </div>
    </div>

    <!-- Order Form -->
    <div class="p-8 bg-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-amber-900 mb-6 text-center">Plaats je bestelling</h2>
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div>
          <label htmlFor="location" class="block text-sm font-medium text-gray-700">Welk kantoor zit je?</label>
          <select
            id="location"
            v-model="locationId"
            required
            class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-gray-900 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
          >
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">
              {{ loc.name }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Wat wil je drinken?</label>
          <fieldset class="mt-2">
            <legend class="sr-only">Producten</legend>
            <div class="space-y-2">
              <div v-for="p in products" :key="p.id" class="flex items-center">
                <input
                  :id="`product-${p.id}`"
                  name="product-option"
                  type="radio"
                  :value="String(p.id)"
                  v-model="productId"
                  class="h-4 w-4 text-amber-600 border-gray-300 focus:ring-amber-500"
                />
                <label :for="`product-${p.id}`" class="ml-3 block text-sm font-medium text-gray-700">{{ p.name }}</label>
              </div>
            </div>
          </fieldset>
        </div>
        <button
          type="submit"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:bg-gray-400 transition-colors"
          :disabled="!locationId || !productId"
        >
          Bestellen
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for webkit browsers (Chrome, Safari) */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
