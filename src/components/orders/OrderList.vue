<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Order, Location, UserProfile } from '../../types'
// Icons need to be migrated or imported. Assuming they are simple SVGs, I'll inline them or create components later.
// For now, I'll use inline SVGs to save time.

const props = defineProps<{
  orders: Order[]
  locations: Location[]
  currentUserProfile: UserProfile | null
}>()

const emit = defineEmits<{
  (e: 'delete-order', orderId: number): void
  (e: 'update-status', orderId: number, status: { collected?: boolean; delivered?: boolean }): void
}>()

const selectedLocationId = ref<string>('')

const filteredOrders = computed(() => {
  return selectedLocationId.value
    ? props.orders.filter(order => String(order.locations.id) === selectedLocationId.value)
    : props.orders
})

const totalOrders = computed(() => filteredOrders.value.length)

const drinkCounts = computed(() => {
  return filteredOrders.value.reduce((acc, order) => {
    const drinkName = order.products.name
    acc[drinkName] = (acc[drinkName] || 0) + 1
    return acc
  }, {} as Record<string, number>)
})

const sortedOrders = computed(() => {
  return [...filteredOrders.value].sort((a, b) => {
    if (a.delivered !== b.delivered) return a.delivered ? 1 : -1
    if (a.collected !== b.collected) return a.collected ? 1 : -1
    return b.created_at.getTime() - a.created_at.getTime()
  })
})

function handleDeleteClick(order: Order) {
  const isOwner = props.currentUserProfile?.id === order.user_id
  const isAdmin = props.currentUserProfile?.role === 'beheerder'

  if (isAdmin) {
    emit('delete-order', order.id)
  } else if (isOwner) {
    if (window.confirm(`Weet je zeker dat je jouw bestelling wilt verwijderen?`)) {
      emit('delete-order', order.id)
    }
  } else {
    alert('Haha, grapjas! Leuk geprobeerd, maar je kunt alleen je eigen drankje verwijderen. 😉')
  }
}
</script>

<template>
  <div v-if="orders.length === 0" class="text-center p-8 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-semibold text-amber-800 mb-2">Geen bestellingen</h2>
    <p class="text-gray-600">Er zijn op dit moment geen bestellingen geplaatst.</p>
    <div class="text-6xl mt-6">📝</div>
  </div>

  <div v-else class="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl">
    <h2 class="text-2xl font-bold text-amber-900 mb-4 text-center">Bestellijst</h2>

    <div class="mb-6">
      <label htmlFor="location-filter" class="block text-sm font-medium text-gray-700">
        Filter op kantoor
      </label>
      <select
        id="location-filter"
        v-model="selectedLocationId"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-amber-500 focus:border-amber-500 sm:text-sm rounded-md"
      >
        <option value="">Alle locaties</option>
        <option v-for="loc in locations" :key="loc.id" :value="String(loc.id)">
          {{ loc.name }}
        </option>
      </select>
    </div>

    <div class="mb-6 p-4 bg-purple-100 rounded-lg border border-purple-200">
      <h3 class="text-lg font-semibold text-amber-800 mb-2">
        Overzicht {{ selectedLocationId ? `(${locations.find(l => String(l.id) === selectedLocationId)?.name})` : '' }}
      </h3>
      <p class="text-sm text-gray-700 mb-3">
        Totaal aantal bestellingen: <span class="font-bold">{{ totalOrders }}</span>
      </p>
      <ul class="space-y-1 text-sm">
        <li v-for="(count, drinkName) in drinkCounts" :key="drinkName" class="flex justify-between text-gray-800">
          <span>{{ drinkName }}:</span>
          <span class="font-semibold">{{ count }}</span>
        </li>
      </ul>
    </div>

    <ul class="space-y-3">
      <li 
        v-for="order in sortedOrders" 
        :key="order.id" 
        :class="['p-3 rounded-lg flex items-center shadow-sm transition-all duration-300', order.delivered ? 'bg-green-100 opacity-60' : order.collected ? 'bg-blue-100' : 'bg-amber-50']"
      >
        <div class="flex-grow">
          <p :class="['font-bold text-lg text-amber-900', order.delivered ? 'line-through' : '']">{{ order.customerName }}</p>
          <p class="text-sm text-gray-600">{{ order.locations.name }} - <span class="font-semibold">{{ order.products.name }}</span></p>
          <p class="text-xs text-gray-500 mt-1">
            {{ order.created_at.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) }}
          </p>
        </div>
        
        <div class="flex items-center space-x-2 ml-4">
           <button 
              @click="emit('update-status', order.id, { collected: !order.collected })"
              :class="['p-2 rounded-full transition-colors', order.collected ? 'bg-blue-500 text-white' : 'text-gray-400 hover:bg-blue-100 hover:text-blue-600']"
              :aria-label="order.collected ? 'Markeer als niet opgehaald' : 'Markeer als opgehaald'"
              :aria-pressed="order.collected"
          >
              <!-- PourIcon SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
          </button>
          <button 
              @click="emit('update-status', order.id, { delivered: !order.delivered })"
              :class="['p-2 rounded-full transition-colors', order.delivered ? 'bg-green-500 text-white' : 'text-gray-400 hover:bg-green-100 hover:text-green-600']"
              :aria-label="order.delivered ? 'Markeer als niet bezorgd' : 'Markeer als bezorgd'"
              :aria-pressed="order.delivered"
          >
              <!-- DeliverIcon SVG -->
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
          </button>

          <button 
              @click="handleDeleteClick(order)" 
              class="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors"
              :aria-label="`Verwijder bestelling van ${order.customerName}`"
          >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>
