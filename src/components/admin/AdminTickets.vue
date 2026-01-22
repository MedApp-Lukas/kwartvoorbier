<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDataStore } from '../../stores/data'
import type { FeatureRequestStatus } from '../../types'

const data = useDataStore()
const TICKET_STATUSES: FeatureRequestStatus[] = ['Backlog', 'Word opgepakt', 'Voltooid']
const openRequests = ref<Record<number, boolean>>({})

const sortField = ref<'created_at' | 'status'>('created_at')
const sortDirection = ref<'asc' | 'desc'>('desc')
const showDeleteModal = ref(false)
const ticketToDelete = ref<number | null>(null)

onMounted(() => {
    data.fetchAllFeatureRequests()
})

const sortedFeatureRequests = computed(() => {
    return [...data.featureRequests].sort((a, b) => {
        let result = 0
        if (sortField.value === 'created_at') {
            result = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        } else if (sortField.value === 'status') {
            const statusOrder: Record<string, number> = { 'Backlog': 1, 'Word opgepakt': 2, 'Voltooid': 3 }
            result = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0)
        }
        return sortDirection.value === 'asc' ? result : -result
    })
})

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
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function toggleRequest(id: number) {
    openRequests.value[id] = !openRequests.value[id]
}

async function handleStatusChange(id: number, e: Event) {
    const newStatus = (e.target as HTMLSelectElement).value
    try {
        await data.updateFeatureRequestStatus(id, newStatus)
    } catch (e) {
        alert('Fout bij updaten status.')
    }
}

function openDeleteModal(id: number) {
    ticketToDelete.value = id
    showDeleteModal.value = true
}

function closeDeleteModal() {
    showDeleteModal.value = false
    ticketToDelete.value = null
}

async function confirmDelete() {
    if (ticketToDelete.value === null) return
    
    try {
        await data.deleteFeatureRequest(ticketToDelete.value)
        closeDeleteModal()
    } catch (e) {
        alert('Fout bij verwijderen ticket.')
    }
}
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold text-amber-900">Alle Feature Requests ({{ data.featureRequests.length }})</h2>
        <div class="flex items-center space-x-2 text-sm">
            <label class="font-medium text-gray-700">Sorteer op:</label>
            <select v-model="sortField" class="border rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-500">
                <option value="created_at">Datum</option>
                <option value="status">Status</option>
            </select>
            <button @click="sortDirection = sortDirection === 'asc' ? 'desc' : 'asc'" class="p-1 border rounded hover:bg-gray-50 focus:outline-none" title="Wissel sorteervolgorde">
                <span v-if="sortDirection === 'asc'">⬆️</span>
                <span v-else>⬇️</span>
            </button>
        </div>
    </div>

    <div v-if="data.featureRequests.length === 0" class="text-center p-6 bg-gray-50 rounded-lg">
        <p class="text-gray-600">Er zijn nog geen feature requests ingediend.</p>
        <div class="text-5xl mt-4">😴</div>
    </div>
    <ul v-else class="space-y-3">
        <li v-for="request in sortedFeatureRequests" :key="request.id">
            <div :class="['border rounded-lg overflow-hidden shadow-sm transition-all duration-300', openRequests[request.id] ? 'border-purple-400 shadow-lg bg-purple-50' : 'border-gray-200 bg-white hover:shadow-md']">
                <div class="flex justify-between items-center w-full p-4 text-left">
                    <button class="flex-grow focus:outline-none text-left" @click="toggleRequest(request.id)">
                        <p :class="['font-semibold text-lg transition-colors', openRequests[request.id] ? 'text-purple-800' : 'text-gray-800']">{{ request.title }}</p>
                        <p class="text-xs text-gray-500 mt-1">
                            Inzender: <span class="font-medium text-gray-700">{{ request.customerName }}</span> (op {{ formatDate(request.created_at) }})
                        </p>
                    </button>
                    
                    <div class="flex items-center space-x-3">
                        <select :value="request.status" @change="handleStatusChange(request.id, $event)" class="text-xs font-medium px-2 py-1 rounded-md border appearance-none focus:outline-none focus:ring-1 cursor-pointer" :class="getStatusClasses(request.status)">
                            <option v-for="s in TICKET_STATUSES" :key="s" :value="s">{{ s }}</option>
                        </select>
                        
                        <button @click.stop="openDeleteModal(request.id)" class="text-gray-400 hover:text-red-500 transition-colors p-1" title="Verwijder ticket">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>

                        <button @click="toggleRequest(request.id)" class="focus:outline-none p-1">
                             <svg :class="['w-5 h-5 transition-transform duration-300', openRequests[request.id] ? 'text-purple-600 rotate-180' : 'text-gray-400 rotate-0']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div v-if="openRequests[request.id]" class="py-3 px-4 border-t border-purple-200">
                    <h4 class="text-sm font-medium text-purple-700 mb-2 pt-2">Volledige Beschrijving:</h4>
                    <p class="text-sm text-gray-700 p-3 rounded-md whitespace-pre-wrap bg-white border border-purple-100"> 
                        {{ request.description }}
                    </p>
                </div>
            </div>
        </li>
    </ul>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" @click="closeDeleteModal">
          <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6" @click.stop>
            <div class="flex items-center mb-4">
              <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Ticket verwijderen</h3>
                <p class="text-sm text-gray-600 mt-1">Weet je zeker dat je dit ticket wilt verwijderen?</p>
              </div>
            </div>
            
            <p class="text-sm text-gray-500 mb-6">Deze actie kan niet ongedaan worden gemaakt.</p>
            
            <div class="flex justify-end space-x-3">
              <button @click="closeDeleteModal" class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors">
                Annuleren
              </button>
              <button @click="confirmDelete" class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors">
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .bg-white,
.modal-leave-active .bg-white {
  transition: transform 0.2s ease;
}

.modal-enter-from .bg-white,
.modal-leave-to .bg-white {
  transform: scale(0.95);
}
</style>
