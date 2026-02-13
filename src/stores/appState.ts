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
    
    // Dev / Manual Override State
    const manualOverride = ref<AppState | null>(null)
    const rouletteKey = ref(0) // Used to force re-mount/re-spin of roulette

    const dataStore = useDataStore()
    
    function triggerRouletteSpin() {
        if (state.value !== AppState.ROULETTE) {
            manualOverride.value = AppState.ROULETTE
        }
        // Increment key to force re-render/re-spin
        rouletteKey.value++
    }
    
    function setManualState(newState: AppState | null) {
        manualOverride.value = newState
        checkTime() // Re-evaluate state
    }

    function checkTime() {
        // 0. Manual Override takes precedence over everything
        if (manualOverride.value !== null) {
            state.value = manualOverride.value
             // Set default messages for manual states if needed
            if (state.value === AppState.CLOSED) {
                message.value = 'Handmatig gesloten'
                 subMessage.value = 'Dev Override'
            }
            return
        }

        // IN LOCAL DEVELOPMENT: Use VITE_DEV_APP_STATE env var if set, otherwise default to ORDERING
        if (import.meta.env.DEV) {
            const devState = import.meta.env.VITE_DEV_APP_STATE
            if (devState) {
                // Map string to AppState enum
                switch (devState.toUpperCase()) {
                    case 'CLOSED':
                        state.value = AppState.CLOSED
                        message.value = 'Dev mode: CLOSED state'
                        subMessage.value = 'Set VITE_DEV_APP_STATE to change'
                        break
                    case 'COUNTDOWN':
                        state.value = AppState.COUNTDOWN
                        // Set target date to 5 minutes from now for testing
                        targetDate.value = new Date(Date.now() + 5 * 60000)
                        break
                    case 'ORDERING':
                        state.value = AppState.ORDERING
                        break
                    case 'ROULETTE':
                        state.value = AppState.ROULETTE
                        break
                    default:
                        console.warn(`Unknown VITE_DEV_APP_STATE: ${devState}, defaulting to ORDERING`)
                        state.value = AppState.ORDERING
                }
            } else {
                // Default to ORDERING if no env var is set
                state.value = AppState.ORDERING
            }
            return
        }

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
        manualOverride,
        rouletteKey,
        checkTime,
        triggerRouletteSpin,
        setManualState
    }
})
