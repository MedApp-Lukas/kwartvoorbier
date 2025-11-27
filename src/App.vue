<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useDataStore } from './stores/data'
import Header from './components/Header.vue'
import Auth from './components/Auth.vue'
import SnowflakeOverlay from './components/SnowflakeOverlay.vue'
import { THEME_ENABLED } from './constants'

const auth = useAuthStore()
const data = useDataStore()

onMounted(async () => {
  await auth.initialize()
  if (auth.user) {
    await data.fetchUserProfile()
    await data.fetchInitialData()
  }
})
</script>

<template>
  <div :class="['min-h-screen flex flex-col items-center p-4', auth.user ? 'justify-start pt-8' : 'justify-center', THEME_ENABLED ? 'bg-blue-50 snow-footer' : 'bg-amber-50']">
    <SnowflakeOverlay v-if="THEME_ENABLED" />
    <div class="w-full max-w-2xl mx-auto">
      <Header :isChristmasThemeEnabled="THEME_ENABLED" />
      <div class="flex justify-center my-4">
        <Auth />
      </div>

      <div v-if="auth.user" class="flex justify-center rounded-lg bg-purple-900 p-1 my-6" role="tablist">
        <router-link to="/" class="w-1/4 py-2 px-4 rounded-md font-medium transition-colors text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white">Bestellen</router-link>
        <router-link to="/afhalen" class="w-1/4 py-2 px-4 rounded-md font-medium transition-colors text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white">Afhalen</router-link>
        <router-link to="/status" class="w-1/4 py-2 px-4 rounded-md font-medium transition-colors text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white">Status</router-link>
        <router-link to="/feature-requests" class="w-1/4 py-2 px-4 rounded-md font-medium transition-colors text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white">💡 Feature</router-link>
        <router-link v-if="data.userProfile?.role === 'beheerder'" to="/beheer" class="w-1/4 py-2 px-4 rounded-md font-medium transition-colors text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white">Beheer</router-link>
      </div>

      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>
