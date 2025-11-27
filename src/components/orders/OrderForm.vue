<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Product, Location } from '../../types'

const props = defineProps<{
  products: Product[]
  locations: Location[]
}>()

const emit = defineEmits<{
  (e: 'order-submit', payload: { locationId: number; productId: number }): void
}>()

const locationId = ref<string>('')
const productId = ref<string>('')
const isSubmitted = ref(false)

watch(() => props.locations, (newLocs) => {
  if (newLocs.length > 0 && !locationId.value) {
    locationId.value = String(newLocs[0].id)
  }
}, { immediate: true })

watch(() => props.products, (newProds) => {
  if (newProds.length > 0 && !productId.value) {
    productId.value = String(newProds[0].id)
  }
}, { immediate: true })

const orderedProduct = computed(() => props.products.find(p => p.id === Number(productId.value)))
const orderLocation = computed(() => props.locations.find(l => l.id === Number(locationId.value)))

function handleSubmit() {
  if (locationId.value && productId.value) {
    emit('order-submit', { locationId: Number(locationId.value), productId: Number(productId.value) })
    isSubmitted.value = true
  }
}

function handleNewOrderClick() {
  if (props.locations.length > 0) locationId.value = String(props.locations[0].id)
  if (props.products.length > 0) productId.value = String(props.products[0].id)
  isSubmitted.value = false
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

  <div v-else class="p-8 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
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
</template>
