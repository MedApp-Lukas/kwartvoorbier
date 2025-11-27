<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  targetDate: Date
}>()

const emit = defineEmits<{
  (e: 'complete'): void
}>()

const timeLeft = ref({ hours: 0, minutes: 0, seconds: 0 })
const fillPercentage = ref(0)
const initialTime = ref(new Date().setHours(9, 0, 0, 0)) // Assuming 9 AM start for filling logic

let timer: ReturnType<typeof setInterval>

function updateTimer() {
  const now = new Date().getTime()
  const difference = props.targetDate.getTime() - now
  const totalDuration = props.targetDate.getTime() - initialTime.value

  if (difference > 0) {
    const hours = Math.floor(difference / (1000 * 60 * 60))
    const minutes = Math.floor((difference / 1000 / 60) % 60)
    const seconds = Math.floor((difference / 1000) % 60)
    timeLeft.value = { hours, minutes, seconds }

    const timeElapsed = now - initialTime.value
    let percentage = Math.min(100, (timeElapsed / totalDuration) * 100)
    if (percentage < 0) percentage = 0
    fillPercentage.value = percentage
  } else {
    clearInterval(timer)
    fillPercentage.value = 100
    timeLeft.value = { hours: 0, minutes: 0, seconds: 0 }
    emit('complete')
  }
}

onMounted(() => {
  updateTimer()
  timer = setInterval(updateTimer, 1000)
})

onUnmounted(() => {
  clearInterval(timer)
})

watch(() => props.targetDate, () => {
  clearInterval(timer)
  updateTimer()
  timer = setInterval(updateTimer, 1000)
})

// BeerGlassIcon logic inline
const fillableHeight = 95
const topY = 5
</script>

<template>
  <div class="text-center p-8 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-semibold text-amber-800 mb-2">Nog heel even geduld...</h2>
    
    <!-- BeerGlassIcon -->
    <div class="relative w-48 h-64 mx-auto my-4">
        <svg viewBox="0 0 100 125" class="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <clipPath id="glass-interior">
                    <path d="M18,8 H82 V100 C82,108 73,117 50,117 C27,117 18,108 18,100 Z" />
                </clipPath>
            </defs>

            <rect 
                x="18" 
                :y="topY + fillableHeight - (fillableHeight * (fillPercentage / 100))"
                width="64"
                :height="fillableHeight * (fillPercentage / 100)"
                class="fill-amber-400"
                style="transition: y 1s linear, height 1s linear"
                clip-path="url(#glass-interior)"
            />
            
            <path 
                d="M15,5 H85 V100 C85,110 75,120 50,120 C25,120 15,110 15,100 Z" 
                class="stroke-gray-400/50 fill-gray-300/20"
                stroke-width="3" 
            />

            <path 
                d="M85,30 C105,40 105,70 85,80" 
                class="stroke-gray-400/50 fill-transparent"
                stroke-width="3" 
            />

            <g v-if="fillPercentage > 98" class="fill-white opacity-90 transition-opacity">
                <path d="M15,5 C25,0 40,-5 50,5 C60,-5 75,0 85,5" />
            </g>
        </svg>
    </div>

    <div class="mt-4 text-5xl font-mono tracking-tighter text-amber-900">
      <span>{{ String(timeLeft.hours).padStart(2, '0') }}</span>:
      <span>{{ String(timeLeft.minutes).padStart(2, '0') }}</span>:
      <span>{{ String(timeLeft.seconds).padStart(2, '0') }}</span>
    </div>
    <p class="text-amber-600 mt-2">Het bier vult zich!</p>
  </div>
</template>
