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
  document.body.className = THEME_ENABLED ? 'bg-blue-50' : 'bg-amber-50'
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
        <router-link to="/" class="menu-btn w-1/4 py-2 px-4 rounded-md font-medium text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white"><span class="menu-text">Bestellen</span></router-link>
        <router-link to="/afhalen" class="menu-btn w-1/4 py-2 px-4 rounded-md font-medium text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white"><span class="menu-text">Afhalen</span></router-link>
        <!-- <router-link to="/status" class="menu-btn w-1/4 py-2 px-4 rounded-md font-medium text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white"><span class="menu-text">Status</span></router-link> -->
        <router-link to="/feature-requests" class="menu-btn w-1/4 py-2 px-4 rounded-md font-medium text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white"><span class="menu-text">💡 Feature</span></router-link>
        <router-link v-if="data.userProfile?.role === 'beheerder'" to="/beheer" class="menu-btn w-1/4 py-2 px-4 rounded-md font-medium text-center text-white hover:bg-purple-700 border-2 border-transparent" active-class="border-white"><span class="menu-text">Beheer</span></router-link>
      </div>

      <main>
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.menu-btn {
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: visible;
}

.menu-text {
  display: inline-block;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-btn:hover .menu-text {
  transform: scale(1.1);
}

.menu-btn:active .menu-text {
  transform: scale(1.05);
}

/* Smooth transition for active state */
.menu-btn.router-link-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
