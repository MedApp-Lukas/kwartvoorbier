<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '../../stores/data'
import type { Location } from '../../types'

const data = useDataStore()
const newLocation = ref({ name: '', floor: 0, description: '' })
const editingLocation = ref<Location | null>(null)

async function handleAddLocationSubmit() {
  if (!newLocation.value.name.trim()) return
  try {
    await data.addLocation(newLocation.value)
    newLocation.value = { name: '', floor: 0, description: '' }
  } catch (e) {
    alert('Fout bij toevoegen locatie.')
  }
}

async function handleDeleteLocationClick(id: number) {
  if (confirm('Weet je zeker dat je deze locatie wilt verwijderen?')) {
    await data.deleteLocation(id)
  }
}

function openEditModal(location: Location) {
    editingLocation.value = { ...location }
}

async function handleUpdateLocation() {
    if (!editingLocation.value) return
    try {
        await data.updateLocation(editingLocation.value.id, {
            name: editingLocation.value.name,
            floor: editingLocation.value.floor,
            description: editingLocation.value.description
        })
        editingLocation.value = null
    } catch (e) {
        alert('Fout bij bijwerken locatie.')
    }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-amber-900 mb-4">Locatiebeheer</h2>
    
    <form @submit.prevent="handleAddLocationSubmit" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 items-end p-4 border rounded-lg bg-gray-50">
        <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Naam</label>
            <input type="text" v-model="newLocation.name" placeholder="Kantoornaam" class="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md"/>
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Verdieping</label>
            <input type="number" v-model.number="newLocation.floor" class="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
        </div>
        <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label>
            <input type="text" v-model="newLocation.description" placeholder="bv. 'Linker vleugel'" class="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md" />
        </div>
        <button type="submit" class="h-10 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 md:col-start-4">Toevoegen</button>
    </form>

    <h3 class="text-lg font-semibold text-amber-800 mb-2">Bestaande Locaties</h3>
    <div v-if="data.locations.length > 0">
        <ul class="space-y-2">
            <li v-for="l in data.locations" :key="l.id" class="flex items-center justify-between w-full p-3 bg-purple-50 rounded-lg">
                <div class="flex-grow">
                    <p class="font-semibold text-gray-800">{{ l.name }} <span class="font-normal text-gray-600">(V{{ l.floor }})</span></p>
                    <p class="text-sm text-gray-500">{{ l.description }}</p>
                </div>
                <div class="flex items-center space-x-2 flex-shrink-0 ml-4">
                    <button @click="openEditModal(l)" class="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors" title="Bewerk locatie">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                        </svg>
                    </button>
                    <button @click="handleDeleteLocationClick(l.id)" class="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors" title="Verwijder locatie">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </li>
        </ul>
    </div>
    <div v-else class="text-center p-4 bg-purple-50 rounded-lg">
        <p class="text-gray-600">Geen locaties gevonden.</p>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingLocation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold text-amber-900 mb-4">Locatie Bewerken</h3>
            <form @submit.prevent="handleUpdateLocation" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Naam</label>
                    <input type="text" v-model="editingLocation.name" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Verdieping</label>
                    <input type="number" v-model.number="editingLocation.floor" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" required />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Omschrijving (optioneel)</label>
                    <input type="text" v-model="editingLocation.description" class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm" />
                </div>
                <div class="flex justify-end space-x-3 pt-2">
                    <button type="button" @click="editingLocation = null" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">Annuleren</button>
                    <button type="submit" class="px-4 py-2 bg-amber-600 text-white rounded-md">Opslaan</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>
