<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'form-submit', payload: { title: string; description: string }): void
  (e: 'cancel'): void
}>()

const title = ref('')
const description = ref('')
const isSubmitted = ref(false)
const isSubmitting = ref(false)

async function handleSubmit() {
  if (title.value.trim() && description.value.trim()) {
    isSubmitting.value = true
    try {
      emit('form-submit', { title: title.value.trim(), description: description.value.trim() })
      isSubmitted.value = true
    } catch (error) {
      // Error handled by parent
    } finally {
      isSubmitting.value = false
    }
  }
}
</script>

<template>
  <div v-if="isSubmitted" class="text-center p-8 bg-white rounded-lg shadow-lg">
    <h2 class="text-3xl font-bold text-green-600 mb-4">Bedankt!</h2>
    <p class="text-gray-700 text-lg">Je feature request is ontvangen.</p>
    <p class="text-5xl mt-6">💡</p>
    <button
      @click="emit('cancel')"
      class="mt-6 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
    >
      Ga naar Bestellen 
    </button>
  </div>

  <div v-else class="p-8 bg-white rounded-lg shadow-lg w-full max-w-md mx-auto">
    <h2 class="text-2xl font-bold text-amber-900 mb-6 text-center">Feature Request Indienen</h2>
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <div>
        <label htmlFor="feature-title" class="block text-sm font-medium text-gray-700">Titel</label>
        <input
          id="feature-title"
          type="text"
          v-model="title"
          placeholder="Korte samenvatting van het idee"
          required
          maxlength="100"
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div>
        <label htmlFor="feature-description" class="block text-sm font-medium text-gray-700">Beschrijving</label>
        <textarea
          id="feature-description"
          rows="5"
          v-model="description"
          placeholder="Beschrijf je feature-idee in detail"
          required
          class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 resize-none"
        />
      </div>
      <div class="flex justify-between space-x-3">
        <button
          type="button"
          @click="emit('cancel')"
          class="w-1/3 flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          :disabled="isSubmitting"
        >
          Annuleren
        </button>
        <button
          type="submit"
          class="w-2/3 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 transition-colors"
          :disabled="!title.trim() || !description.trim() || isSubmitting"
        >
          {{ isSubmitting ? 'Versturen...' : 'Versturen' }}
        </button>
      </div>
    </form>
  </div>
</template>
