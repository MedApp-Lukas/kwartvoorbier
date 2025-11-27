<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '../../stores/data'

const data = useDataStore()
const searchTerm = ref('')
const selectedUserIds = ref<string[]>([])

const filteredUsers = computed(() => {
  return data.allUsers.filter(user => 
    (user.full_name || '').toLowerCase().includes(searchTerm.value.toLowerCase()) || 
    (user.email || '').toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const isAllUsersSelected = computed(() => {
  return filteredUsers.value.length > 0 && selectedUserIds.value.length === filteredUsers.value.length
})

function handleSelectAllUsersChange(e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) selectedUserIds.value = filteredUsers.value.map(u => u.id)
  else selectedUserIds.value = []
}

function handleUserSelectionChange(userId: string) {
  if (selectedUserIds.value.includes(userId)) {
    selectedUserIds.value = selectedUserIds.value.filter(id => id !== userId)
  } else {
    selectedUserIds.value.push(userId)
  }
}

async function handleDeleteSelectedUsersClick() {
  if (selectedUserIds.value.length > 0 && confirm(`Weet je zeker dat je ${selectedUserIds.value.length} geselecteerde gebruiker(s) permanent wilt verwijderen?`)) {
    try {
      await data.deleteUsers(selectedUserIds.value)
      selectedUserIds.value = []
    } catch (e) {
      alert('Fout bij verwijderen gebruikers.')
    }
  }
}

async function handleDeleteUserClick(userId: string, userName: string) {
  if (confirm(`Weet je zeker dat je ${userName} permanent wilt verwijderen?`)) {
    try {
      await data.deleteUsers([userId])
    } catch (e) {
      alert('Fout bij verwijderen gebruiker.')
    }
  }
}
</script>

<template>
  <div>
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
      <h2 class="text-2xl font-bold text-amber-900">Gebruikersbeheer</h2>
      <input type="text" placeholder="Zoek op naam of email..." v-model="searchTerm" class="px-3 py-2 w-full sm:w-64 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"/>
    </div>
    <div class="flex justify-end mb-4">
      <button v-if="selectedUserIds.length > 0" @click="handleDeleteSelectedUsersClick" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-300">Verwijder {{ selectedUserIds.length }} Gebruiker(s)</button>
    </div>
    
    <div v-if="filteredUsers.length > 0">
      <ul class="space-y-3">
        <li class="p-3 rounded-lg flex items-center bg-gray-100 border-b">
          <label class="flex items-center space-x-3 w-full">
            <input type="checkbox" :checked="isAllUsersSelected" @change="handleSelectAllUsersChange" class="h-5 w-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300" />
            <span class="font-semibold text-gray-600">Selecteer Alles (in resultaat)</span>
          </label>
        </li>
        <li v-for="user in filteredUsers" :key="user.id" class="p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between bg-purple-50 hover:bg-purple-100 transition-colors gap-4">
           <div class="flex items-center flex-grow w-full">
             <input type="checkbox" :checked="selectedUserIds.includes(user.id)" @change="handleUserSelectionChange(user.id)" class="h-5 w-5 rounded text-purple-600 focus:ring-purple-500 border-gray-300 mr-4" />
             <div class="flex-grow">
               <p class="font-semibold text-gray-800">{{ user.full_name || 'Naamloos' }}</p>
               <p class="text-sm text-gray-500 truncate" :title="user.email || user.id">{{ user.email || 'Geen email' }}</p>
             </div>
           </div>
           <div class="flex-shrink-0 w-full sm:w-auto flex items-center space-x-4">
              <select :value="user.role" @change="data.updateUserRole(user.id, ($event.target as HTMLSelectElement).value)" class="w-full px-3 py-1 bg-white border border-gray-300 rounded-md shadow-sm">
                <option value="gebruiker">Gebruiker</option>
                <option value="beheerder">Beheerder</option>
              </select>
              <button @click="handleDeleteUserClick(user.id, user.full_name || user.email || 'deze gebruiker')" class="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors" title="Verwijder deze gebruiker">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
           </div>
        </li>
      </ul>
    </div>
    <div v-else class="text-center p-4">
      <p>{{ data.allUsers.length > 0 ? 'Geen gebruikers gevonden die voldoen aan de zoekopdracht.' : 'Geen gebruikers gevonden.' }}</p>
    </div>
  </div>
</template>
