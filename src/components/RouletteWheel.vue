<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{
  participants: string[]
}>()

const mustSpin = ref(false)
const prizeNumber = ref(0)
const winner = ref<string | null>(null)
const rotation = ref(0)

const colors = ['#6B21A8', '#9333EA', '#A855F7']

// Deterministic random logic
function createDailySeed(participants: string[]): number {
  const today = new Date()
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const namesString = [...participants].sort().join(',')
  const seedString = dateString + namesString
  
  let hash = 0
  for (let i = 0; i < seedString.length; i++) {
    const char = seedString.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return hash
}

function mulberry32(seed: number) {
  return function() {
    let t = seed += 0x6D2B79F5
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function spin() {
    if (mustSpin.value || winner.value) return

    const seed = createDailySeed(props.participants)
    const deterministicRandom = mulberry32(seed)
    const winnerIndex = Math.floor(deterministicRandom() * props.participants.length)
    prizeNumber.value = winnerIndex
    
    mustSpin.value = true
    
    // Calculate rotation
    const segmentAngle = 360 / props.participants.length
    const targetAngle = 360 * 5 + (360 - (winnerIndex * segmentAngle) - (segmentAngle / 2)) // Center of segment
    
    rotation.value = targetAngle
    
    setTimeout(() => {
        mustSpin.value = false
        winner.value = props.participants[winnerIndex]
    }, 5000) // 5 seconds spin
}

onMounted(() => {
    setTimeout(spin, 1500)
})
</script>

<template>
  <div class="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl text-center flex flex-col items-center">
    <h2 class="text-3xl font-bold text-amber-900 mb-4">Wie gaat er halen?</h2>
    
    <p v-if="!winner" class="text-gray-600 mb-6">De besteltijd is voorbij... het wiel beslist!</p>
    
    <div class="mb-6 relative w-64 h-64">
        <!-- Pointer -->
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-amber-600"></div>
        
        <!-- Wheel -->
        <div 
            class="w-full h-full rounded-full overflow-hidden border-4 border-amber-200 relative transition-transform duration-[5000ms] ease-out"
            :style="{ transform: `rotate(${rotation}deg)` }"
        >
             <!-- Using Conic Gradient for background -->
             <div class="w-full h-full rounded-full" :style="{
                 background: `conic-gradient(${
                     participants.map((_, i) => `${colors[i % colors.length]} ${i * (360/participants.length)}deg ${(i+1) * (360/participants.length)}deg`).join(', ')
                 })`
             }"></div>
             
             <!-- Labels -->
             <div 
                v-for="(participant, index) in participants" 
                :key="'label-'+participant"
                class="absolute top-0 left-1/2 w-1 h-1/2 origin-bottom flex justify-center pt-4"
                :style="{ transform: `translateX(-50%) rotate(${index * (360 / participants.length) + (360 / participants.length / 2)}deg)` }"
             >
                <span class="text-white font-bold text-sm whitespace-nowrap transform -rotate-90 origin-center">{{ participant }}</span>
             </div>
        </div>
    </div>

    <p v-if="!winner && !mustSpin" class="text-lg font-semibold text-amber-800 animate-pulse">De spanning stijgt, de winnaar wordt bepaald...</p>
    <p v-if="mustSpin" class="text-lg font-semibold text-amber-800 animate-pulse">Draaien maar! 🎡</p>

    <div v-if="winner" class="mt-8 p-4 bg-green-100 border-2 border-green-200 rounded-lg">
      <h3 class="text-2xl font-bold text-green-700">
        Het lot heeft gesproken...
      </h3>
      <p class="text-4xl font-bold text-green-800 mt-2 animate-bounce">
        {{ winner }}!
      </p>
      <p class="text-xl text-green-700 mt-2">Jij mag de drankjes halen! 🍻</p>
    </div>
  </div>
</template>
