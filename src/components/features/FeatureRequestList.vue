<script setup lang="ts">
import { ref } from 'vue'
import type { FeatureRequest, FeatureRequestStatus } from '../../types'

defineProps<{
  requests: FeatureRequest[]
}>()

const emit = defineEmits<{
  (e: 'new-request-click'): void
}>()

function getStatusClasses(status: FeatureRequestStatus): string {
  switch (status) {
    case 'Voltooid':
      return 'bg-green-100 text-green-800 border-green-200'
    case 'Word opgepakt':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Backlog':
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

function formatDate(date: Date) {
  return date.toLocaleDateString('nl-NL', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })
}

// RequestItem component (internal)
const openRequests = ref<Record<number, boolean>>({})
function toggleRequest(id: number) {
  openRequests.value[id] = !openRequests.value[id]
}
</script>

<template>
  <div class="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl">
    <div class="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
      <h2 class="text-2xl font-bold text-amber-900">Mijn Ingediende Features</h2>
      <button
        @click="emit('new-request-click')"
        class="py-2 px-4 rounded-md font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors shadow-md text-sm"
      >
        + Nieuw Ticket Indienen
      </button>
    </div>
    
    <div v-if="requests.length === 0" class="text-center p-6 bg-gray-50 rounded-lg">
      <p class="text-gray-600">Je hebt nog geen feature requests ingediend. Tijd om creatief te worden!</p>
      <div class="text-5xl mt-4">✨</div>
    </div>

    <div v-else class="space-y-3">
      <div 
        v-for="request in requests" 
        :key="request.id"
        :class="['border rounded-lg overflow-hidden shadow-sm transition-all duration-300', openRequests[request.id] ? 'border-purple-400 shadow-lg bg-purple-50' : 'border-gray-200 bg-white hover:shadow-md']"
      >
        <button
          class="flex justify-between items-center w-full p-4 text-left focus:outline-none"
          @click="toggleRequest(request.id)"
          :aria-expanded="openRequests[request.id]"
        >
          <div class="flex-grow">
            <p :class="['font-semibold text-lg transition-colors', openRequests[request.id] ? 'text-purple-800' : 'text-gray-800']">{{ request.title }}</p>
            <p class="text-xs text-gray-500 mt-1">
              Ingediend op: <span class="font-medium">{{ formatDate(request.created_at) }}</span>
            </p>
          </div>

          <span :class="['text-xs font-medium px-2.5 py-0.5 rounded-full border mr-4 flex-shrink-0', getStatusClasses(request.status)]">
            {{ request.status }}
          </span>
          
          <svg 
            :class="['w-5 h-5 transition-transform duration-300', openRequests[request.id] ? 'text-purple-600 rotate-180' : 'text-gray-400 rotate-0']"
            xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        <div v-if="openRequests[request.id]" class="py-3 px-4 border-t border-purple-200">
          <h4 class="text-sm font-medium text-purple-700 mb-2 pt-2">Volledige Beschrijving:</h4>
          <p class="text-sm text-gray-700 p-3 rounded-md whitespace-pre-wrap bg-white border border-purple-100"> 
            {{ request.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
