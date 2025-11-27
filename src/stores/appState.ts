import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDataStore } from './data'
import { AppState } from '../types'

export const useAppStateStore = defineStore('appState', () => {
  const state = ref<AppState>(AppState.CLOSED)
  const message = ref('')
  const subMessage = ref('')
  const targetDate = ref(new Date())
  const showProost = ref(false)
  
  const dataStore = useDataStore()

  function checkTime() {
    if (Object.keys(dataStore.appSettings).length === 0) {
        if (state.value !== AppState.CLOSED) {
            state.value = AppState.CLOSED
            message.value = 'Instellingen laden...'
            subMessage.value = 'Een moment geduld.'
        }
        return
    }
    
    if (dataStore.products.length === 0 && !dataStore.loading) {
        state.value = AppState.CLOSED
        message.value = 'Helaas, geen borrel vandaag.'
        subMessage.value = 'Kom een andere keer terug!'
        return
    }

    const now = new Date()
    const currentDay = now.getDay()
    
    const isAnythingAvailableToday = dataStore.products.some(p => p.available_on_days?.includes(currentDay))

    if (!isAnythingAvailableToday) {
        state.value = AppState.CLOSED
        message.value = 'Helaas, geen borrel vandaag.'
        subMessage.value = 'Kom een andere keer terug!'
        return
    }

    const settings = dataStore.appSettings
    const orderingStartTime = new Date(now)
    orderingStartTime.setHours(settings.ORDER_START_HOUR, settings.ORDER_START_MINUTE, 0, 0)
    const orderingEndTime = new Date(now)
    orderingEndTime.setHours(settings.ORDER_END_HOUR, settings.ORDER_END_MINUTE, 0, 0)

    const rouletteEndTime = new Date(orderingEndTime.getTime() + 15 * 60000) 

    if (now.getTime() < orderingStartTime.getTime()) {
        state.value = AppState.COUNTDOWN
        targetDate.value = orderingStartTime
    } else if (now.getTime() < orderingEndTime.getTime()) {
        state.value = AppState.ORDERING
    } else if (now.getTime() < rouletteEndTime.getTime()) {
        state.value = AppState.ROULETTE
    }
    else {
        state.value = AppState.CLOSED
        message.value = 'De besteltijd is voorbij.'
        subMessage.value = 'Probeer het de volgende borrel opnieuw!'
    }
  }

  return {
    state,
    message,
    subMessage,
    targetDate,
    showProost,
    checkTime
  }
})
