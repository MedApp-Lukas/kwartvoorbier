<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const props = defineProps<{
  participants: { name: string; avatarUrl?: string }[]
  safePerson?: string | null
}>()

const mustSpin = ref(false)
const winner = ref<string | null>(null)
const countdown = ref(3)
const showCountdown = ref(false)
const hasStarted = ref(false)
const translateX = ref(0)
const displayParticipants = ref<{ name: string; avatarUrl?: string }[]>([])

const CARD_WIDTH = 160 // Width of a single card in pixels
const CARD_GAP = 16 // Gap between cards in pixels
const TOTAL_CARDS = 80 // Restored to 80 for long spin
const WINNER_INDEX = 65 // Restored to land deep in the strip

// Local cache for avatar Blobs to guarantee 1 request per participant
const localAvatarCache = ref<Map<string, string>>(new Map())

async function cacheAvatars() {
    for (const p of props.participants) {
        if (p.avatarUrl && !localAvatarCache.value.has(p.avatarUrl)) {
            try {
                // Fetch the image once
                const response = await fetch(p.avatarUrl)
                const blob = await response.blob()
                const objectUrl = URL.createObjectURL(blob)
                localAvatarCache.value.set(p.avatarUrl, objectUrl)
            } catch (e) {
                console.error('Failed to cache avatar:', p.avatarUrl, e)
            }
        }
    }
}

// Deterministic random logic
function createDailySeed(participants: { name: string }[]): number {
  const today = new Date()
  const dateString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`
  const namesString = [...participants].map(p => p.name).sort().join(',')
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

const isSpinning = ref(false)

function generateStrip(winnerObj: { name: string; avatarUrl?: string }) {
    if (displayParticipants.value.length > 0) return // Already generated

    const spinCandidates = props.participants.filter(p => p.name !== props.safePerson)
    if (spinCandidates.length === 0) return

    const strip: { name: string; avatarUrl?: string }[] = []
    
    // Fill the strip using local cache URLs if available
    for (let i = 0; i < TOTAL_CARDS; i++) {
        let card: { name: string; avatarUrl?: string }
        if (i === WINNER_INDEX) {
            card = { ...winnerObj }
        } else {
            const randomIndex = Math.floor(Math.random() * spinCandidates.length)
            card = { ...spinCandidates[randomIndex] }
        }
        
        // Use cached blob URL if it exists
        if (card.avatarUrl && localAvatarCache.value.has(card.avatarUrl)) {
            card.avatarUrl = localAvatarCache.value.get(card.avatarUrl)
        }
        
        strip.push(card)
    }
    displayParticipants.value = strip
}

async function spin() {
    if (hasStarted.value || mustSpin.value || winner.value || isSpinning.value) return
    
    // First ensure avatars are cached properly
    await cacheAvatars()
    
    isSpinning.value = true
    hasStarted.value = true

    const spinCandidates = props.participants.filter(p => p.name !== props.safePerson)
    if (spinCandidates.length === 0) return 

    const seed = createDailySeed(spinCandidates)
    const deterministicRandom = mulberry32(seed)
    const winnerIndex = Math.floor(deterministicRandom() * spinCandidates.length)
    const winnerObj = spinCandidates[winnerIndex]

    // Generate the display strip with the winner at the correct position
    generateStrip(winnerObj)
    
    // Start countdown
    showCountdown.value = true
    countdown.value = 3
    
    const countdownInterval = setInterval(() => {
        countdown.value--
        if (countdown.value === 0) {
            clearInterval(countdownInterval)
            showCountdown.value = false
            mustSpin.value = true
            
            // Calculate scroll position landing on WINNER_INDEX
            const centerOffset = (672 / 2) - (CARD_WIDTH / 2)
            const randomOffset = (Math.random() * (CARD_WIDTH - 20)) - ((CARD_WIDTH - 20) / 2)
            const targetX = -((WINNER_INDEX * (CARD_WIDTH + CARD_GAP)) - centerOffset + randomOffset)
            
            translateX.value = targetX
            
            setTimeout(() => {
                mustSpin.value = false
                winner.value = winnerObj.name
            }, 6000) 
        }
    }, 1000)
}

onMounted(async () => {
    if (props.participants.length > 0) {
        await cacheAvatars()
        setTimeout(spin, 500)
    }
})

// Watch for participants to be loaded
watch(() => props.participants, async (newParticipants) => {
    if (newParticipants.length > 0 && !hasStarted.value) {
        await cacheAvatars()
        setTimeout(spin, 500)
    }
}, { immediate: true })

</script>

<template>
  <div class="p-8 bg-white rounded-lg shadow-lg w-full max-w-2xl text-center flex flex-col items-center overflow-hidden">
    <h2 class="text-3xl font-bold text-amber-900 mb-4">Wie gaat er halen?</h2>
    
    <p v-if="!winner && !mustSpin && !showCountdown" class="text-gray-600 mb-6">Even geduld...</p>
    <p v-if="showCountdown" class="text-6xl font-bold text-amber-600 mb-6 animate-pulse">{{ countdown }}</p>

    <div class="relative w-full h-64 bg-gray-100 rounded-lg border-4 border-amber-200 overflow-hidden mb-6 flex items-center">
        <!-- Center Marker -->
        <div class="absolute top-0 bottom-0 left-1/2 w-1 bg-red-500 z-20 transform -translate-x-1/2"></div>
        <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 text-red-500 text-3xl">▼</div>
        
        <!-- Scrolling Track -->
        <div 
            class="flex items-center h-full px-[50%] transition-transform ease-[cubic-bezier(0.1,0,0.1,1)]"
            :style="{ 
                transform: `translateX(${translateX}px)`, 
                transitionDuration: mustSpin ? '6000ms' : '0ms',
                gap: `${CARD_GAP}px`
            }"
        >
            <div 
                v-for="(card, index) in displayParticipants" 
                :key="'card-' + index"
                class="flex-shrink-0 bg-white border-2 border-amber-100 rounded-lg shadow-sm flex flex-col items-center justify-center p-2"
                :style="{ width: `${CARD_WIDTH}px`, height: '200px' }"
                :class="{ 'border-amber-500 ring-2 ring-amber-300': index === WINNER_INDEX && winner }"
            >
                <img 
                    v-if="card.avatarUrl" 
                    :src="card.avatarUrl" 
                    :key="'img-' + index"
                    class="w-24 h-24 rounded-full object-cover mb-3"
                />
                <div v-else class="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-3 text-3xl">
                    👤
                </div>
                <span class="font-bold text-gray-800 text-lg truncate w-full px-2">{{ card.name }}</span>
            </div>
        </div>
    </div>

    <p v-if="mustSpin" class="text-lg font-semibold text-amber-800 animate-pulse">Rollen maar! 🎲</p>

    <div v-if="winner" class="mt-4 p-4 bg-green-100 border-2 border-green-200 rounded-lg animate-bounce">
      <h3 class="text-2xl font-bold text-green-700">
        {{ winner }}!
      </h3>
      <p class="text-lg text-green-700 mt-1">Jij mag halen! 🍻</p>
    </div>
  </div>
</template>
