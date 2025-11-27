<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore } from '../stores/data'
import AdminUsers from '../components/admin/AdminUsers.vue'
import AdminProducts from '../components/admin/AdminProducts.vue'
import AdminLocations from '../components/admin/AdminLocations.vue'
import AdminTime from '../components/admin/AdminTime.vue'
import AdminTickets from '../components/admin/AdminTickets.vue'

const data = useDataStore()
const activeTab = ref('users')

onMounted(() => {
  data.fetchAllUsers()
})

function getTabClassName(tabName: string) {
    return `py-2 px-4 font-medium text-sm rounded-t-lg transition-colors duration-200 focus:outline-none ${activeTab.value === tabName ? 'bg-white border-l border-t border-r border-gray-200 text-amber-700' : 'text-gray-500 hover:text-amber-600 hover:bg-gray-50'}`
}
</script>

<template>
  <div v-if="data.userProfile?.role === 'beheerder'">
    <div class="bg-gray-50 p-4 sm:p-6 rounded-lg shadow-inner w-full">
        <div class="border-b border-gray-200 overflow-x-auto">
            <nav class="-mb-px flex space-x-4 whitespace-nowrap min-w-max px-2">
                <button @click="activeTab = 'users'" :class="getTabClassName('users')">Gebruikers</button>
                <button @click="activeTab = 'products'" :class="getTabClassName('products')">Producten</button>
                <button @click="activeTab = 'locations'" :class="getTabClassName('locations')">Locaties</button>
                <button @click="activeTab = 'tijd'" :class="getTabClassName('tijd')">Tijd</button>
                <button @click="activeTab = 'tickets'" :class="getTabClassName('tickets')">Tickets</button>
            </nav>
        </div>
        
        <div class="bg-white p-6 rounded-b-lg border-l border-r border-b border-gray-200">
            <AdminUsers v-if="activeTab === 'users'" />
            <AdminProducts v-if="activeTab === 'products'" />
            <AdminLocations v-if="activeTab === 'locations'" />
            <AdminTime v-if="activeTab === 'tijd'" />
            <AdminTickets v-if="activeTab === 'tickets'" />
        </div>
    </div>
  </div>
  <div v-else class="text-center p-8 bg-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-semibold">Toegang geweigerd</h2>
      <p>Je moet een beheerder zijn.</p>
      <div class="text-6xl mt-6">🔒</div>
  </div>
</template>
