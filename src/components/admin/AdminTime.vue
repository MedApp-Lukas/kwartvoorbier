<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore } from '../../stores/data'

const data = useDataStore()
const startTime = ref('15:45')
const endTime = ref('16:00')
const isSaving = ref(false)
const saveStatus = ref<'idle' | 'success' | 'error'>('idle')

function formatTime(h: number | undefined, m: number | undefined) {
    if (h === undefined || m === undefined) return ''
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

onMounted(() => {
    if (data.appSettings.ORDER_START_HOUR !== undefined) {
        startTime.value = formatTime(data.appSettings.ORDER_START_HOUR, data.appSettings.ORDER_START_MINUTE)
    }
    if (data.appSettings.ORDER_END_HOUR !== undefined) {
        endTime.value = formatTime(data.appSettings.ORDER_END_HOUR, data.appSettings.ORDER_END_MINUTE)
    }
})

async function handleSubmit() {
    isSaving.value = true
    saveStatus.value = 'idle'
    
    const [startHour, startMinute] = startTime.value.split(':').map(Number)
    const [endHour, endMinute] = endTime.value.split(':').map(Number)
    
    try {
        await data.updateSettings({ startHour, startMinute, endHour, endMinute })
        saveStatus.value = 'success'
    } catch (e) {
        saveStatus.value = 'error'
    } finally {
        isSaving.value = false
        if (saveStatus.value === 'success') {
            setTimeout(() => saveStatus.value = 'idle', 3000)
        }
    }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-amber-900 mb-6">Tijdinstellingen</h2>
    <form @submit.prevent="handleSubmit" class="p-6 border rounded-lg bg-gray-50 space-y-6 max-w-lg">
        <div>
            <label htmlFor="start-time" class="block text-sm font-medium text-gray-700">Starttijd Bestellen</label>
            <p class="text-xs text-gray-500 mb-1">Vanaf dit tijdstip kan er besteld worden.</p>
            <input id="start-time" type="time" v-model="startTime" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required />
        </div>
        <div>
            <label htmlFor="end-time" class="block text-sm font-medium text-gray-700">Eindtijd Bestellen</label>
            <p class="text-xs text-gray-500 mb-1">Tot dit tijdstip kan er besteld worden. Hierna start de roulette.</p>
            <input id="end-time" type="time" v-model="endTime" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" required />
        </div>
        <div class="flex items-center space-x-4">
            <button type="submit" :disabled="isSaving" class="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 transition-colors">
                {{ isSaving ? 'Opslaan...' : 'Instellingen Opslaan' }}
            </button>
            <span v-if="saveStatus === 'success'" class="text-green-600 font-medium">Opgeslagen!</span>
            <span v-if="saveStatus === 'error'" class="text-red-600 font-medium">Fout bij opslaan.</span>
        </div>
    </form>
  </div>
</template>
