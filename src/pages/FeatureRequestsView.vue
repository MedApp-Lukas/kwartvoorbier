<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore } from '../stores/data'
import FeatureRequestList from '../components/features/FeatureRequestList.vue'
import FeatureRequestForm from '../components/features/FeatureRequestForm.vue'

const data = useDataStore()
const isNewRequestMode = ref(false)

onMounted(() => {
  data.fetchFeatureRequests()
})

async function handleFormSubmit(payload: { title: string; description: string }) {
  try {
    await data.addFeatureRequest(payload.title, payload.description)
    isNewRequestMode.value = false
  } catch (e) {
    alert('Fout bij indienen: ' + e)
  }
}
</script>

<template>
  <div>
    <FeatureRequestForm 
      v-if="isNewRequestMode" 
      @form-submit="handleFormSubmit" 
      @cancel="isNewRequestMode = false" 
    />
    <FeatureRequestList 
      v-else 
      :requests="data.featureRequests" 
      @new-request-click="isNewRequestMode = true" 
    />
  </div>
</template>
