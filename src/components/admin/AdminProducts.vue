<script setup lang="ts">
import { ref } from 'vue'
import { useDataStore } from '../../stores/data'
import type { Product } from '../../types'

const data = useDataStore()
const DAYS_OF_WEEK = [
    { label: 'Ma', value: 1 }, { label: 'Di', value: 2 }, { label: 'Wo', value: 3 },
    { label: 'Do', value: 4 }, { label: 'Vr', value: 5 }, { label: 'Za', value: 6 }, { label: 'Zo', value: 0 },
]

const newProduct = ref({ name: '', available_on_days: [] as number[] })
const editingProduct = ref<Product | null>(null)

async function handleAddProductSubmit() {
  if (!newProduct.value.name.trim()) return
  try {
    await data.addProduct(newProduct.value)
    newProduct.value = { name: '', available_on_days: [] }
  } catch (e) {
    alert('Fout bij toevoegen product.')
  }
}

function handleNewProductDayChange(dayValue: number) {
    const days = newProduct.value.available_on_days
    if (days.includes(dayValue)) {
        newProduct.value.available_on_days = days.filter(d => d !== dayValue)
    } else {
        newProduct.value.available_on_days = [...days, dayValue].sort((a, b) => a - b)
    }
}

async function handleDeleteProductClick(id: number) {
    if (confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
        await data.deleteProduct(id)
    }
}

// Edit Modal Logic
function openEditModal(product: Product) {
    editingProduct.value = { ...product, available_on_days: [...(product.available_on_days || [])] }
}

async function handleUpdateProduct() {
    if (!editingProduct.value) return
    try {
        await data.updateProduct(editingProduct.value.id, { 
            name: editingProduct.value.name, 
            available_on_days: editingProduct.value.available_on_days || [] 
        })
        editingProduct.value = null
    } catch (e) {
        alert('Fout bij bijwerken product.')
    }
}

function handleEditProductDayChange(dayValue: number) {
    if (!editingProduct.value) return
    const days = editingProduct.value.available_on_days || []
    if (days.includes(dayValue)) {
        editingProduct.value.available_on_days = days.filter(d => d !== dayValue)
    } else {
        editingProduct.value.available_on_days = [...days, dayValue].sort((a, b) => a - b)
    }
}
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-amber-900 mb-4">Productbeheer</h2>
    
    <!-- Add Product Form -->
    <form @submit.prevent="handleAddProductSubmit" class="mb-6 p-4 border rounded-lg bg-gray-50 space-y-4">
        <div>
            <label htmlFor="new-product-name" class="block text-sm font-medium text-gray-700">Nieuw Product</label>
            <input id="new-product-name" type="text" v-model="newProduct.name" placeholder="Naam van drankje" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
            <label class="block text-sm font-medium text-gray-700">Beschikbaar op</label>
            <div class="mt-2 flex flex-wrap gap-2">
                <label v-for="day in DAYS_OF_WEEK" :key="day.value" class="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-300 has-[:checked]:bg-purple-100 has-[:checked]:border-purple-400 transition-colors">
                    <input type="checkbox" :value="day.value" :checked="newProduct.available_on_days.includes(day.value)" @change="handleNewProductDayChange(day.value)" class="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300" />
                    <span>{{ day.label }}</span>
                </label>
            </div>
        </div>
        <button type="submit" class="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700">Toevoegen</button>
    </form>

    <h3 class="text-lg font-semibold text-amber-800 mb-2">Bestaande Producten</h3>
    <div v-if="data.products.length > 0">
        <ul class="space-y-2">
            <li v-for="p in data.products" :key="p.id" class="flex items-center justify-between w-full p-3 bg-purple-50 rounded-lg">
                <div class="flex-grow">
                    <span class="text-gray-800 font-semibold">{{ p.name }}</span>
                    <div class="text-xs text-gray-500 mt-1">
                        {{ p.available_on_days && p.available_on_days.length > 0 ? p.available_on_days.map(dayNum => DAYS_OF_WEEK.find(d => d.value === dayNum)?.label).filter(Boolean).join(', ') : 'Niet ingepland' }}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button @click="openEditModal(p)" class="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100 transition-colors" title="Bewerk product">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                        </svg>
                    </button>
                    <button @click="handleDeleteProductClick(p.id)" class="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-100 transition-colors" title="Verwijder product">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </li>
        </ul>
    </div>
    <div v-else class="text-center p-4 bg-purple-50 rounded-lg">
        <p class="text-gray-600">Geen producten gevonden.</p>
    </div>

    <!-- Edit Modal -->
    <div v-if="editingProduct" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 class="text-xl font-bold text-amber-900 mb-4">Product Bewerken</h3>
            <form @submit.prevent="handleUpdateProduct" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Naam</label>
                    <input type="text" v-model="editingProduct.name" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Beschikbaar op</label>
                    <div class="mt-2 flex flex-wrap gap-2">
                        <label v-for="day in DAYS_OF_WEEK" :key="day.value" class="flex items-center space-x-2 cursor-pointer p-2 rounded-md border border-gray-300 has-[:checked]:bg-purple-100 has-[:checked]:border-purple-400 transition-colors">
                            <input type="checkbox" :value="day.value" :checked="editingProduct.available_on_days?.includes(day.value)" @change="handleEditProductDayChange(day.value)" class="h-4 w-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300" />
                            <span>{{ day.label }}</span>
                        </label>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 pt-2">
                    <button type="button" @click="editingProduct = null" class="px-4 py-2 bg-gray-200 rounded-md">Annuleren</button>
                    <button type="submit" class="px-4 py-2 bg-amber-600 text-white rounded-md">Opslaan</button>
                </div>
            </form>
        </div>
    </div>
  </div>
</template>
