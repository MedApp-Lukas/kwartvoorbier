<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore } from '../../stores/data'
import type { FeatureRequestStatus } from '../../types'

const data = useDataStore()
const TICKET_STATUSES: FeatureRequestStatus[] = ['Backlog', 'Word opgepakt', 'Voltooid']
const openRequests = ref<Record<number, boolean>>({})

onMounted(() => {
    data.fetchAllFeatureRequests()
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
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-amber-900 mb-4">Alle Feature Requests ({{ data.featureRequests.length }})</h2>
    <div v-if="data.featureRequests.length === 0" class="text-center p-6 bg-gray-50 rounded-lg">
        <p class="text-gray-600">Er zijn nog geen feature requests ingediend.</p>
        <div class="text-5xl mt-4">😴</div>
    </div>
    <ul v-else class="space-y-3">
        <li v-for="request in data.featureRequests" :key="request.id">
            <div :class="['border rounded-lg overflow-hidden shadow-sm transition-all duration-300', openRequests[request.id] ? 'border-purple-400 shadow-lg bg-purple-50' : 'border-gray-200 bg-white hover:shadow-md']">
                <button class="flex justify-between items-center w-full p-4 text-left focus:outline-none" @click="toggleRequest(request.id)">
                    <div class="flex-grow">
                        <p :class="['font-semibold text-lg transition-colors', openRequests[request.id] ? 'text-purple-800' : 'text-gray-800']">{{ request.title }}</p>
                        <p class="text-xs text-gray-500 mt-1">
                            Inzender: <span class="font-medium text-gray-700">{{ request.customerName }}</span> (op {{ formatDate(request.created_at) }})
                        </p>
                    </div>
                    
                    <div class="flex items-center space-x-4">
                        <select :value="request.status" @change="handleStatusChange(request.id, $event)" @click.stop class="text-xs font-medium px-2 py-1 rounded-md border appearance-none focus:outline-none focus:ring-1" :class="getStatusClasses(request.status)">
                            <option v-for="s in TICKET_STATUSES" :key="s" :value="s">{{ s }}</option>
                        </select>
                        <svg :class="['w-5 h-5 transition-transform duration-300', openRequests[request.id] ? 'text-purple-600 rotate-180' : 'text-gray-400 rotate-0']" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </button>
                
                <div v-if="openRequests[request.id]" class="py-3 px-4 border-t border-purple-200">
                    <h4 class="text-sm font-medium text-purple-700 mb-2 pt-2">Volledige Beschrijving:</h4>
                    <p class="text-sm text-gray-700 p-3 rounded-md whitespace-pre-wrap bg-white border border-purple-100"> 
                        {{ request.description }}
                    </p>
                </div>
            </div>
        </li>
    </ul>
  </div>
</template>
