<script setup lang="ts">
import { useDataStore } from '../stores/data'
import OrderList from '../components/orders/OrderList.vue'

const data = useDataStore()

async function handleDeleteOrder(orderId: number) {
  try {
    await data.deleteOrder(orderId)
  } catch (e) {
    alert('Kon bestelling niet verwijderen.')
  }
}

async function handleUpdateStatus(orderId: number, status: { collected?: boolean; delivered?: boolean }) {
  try {
    await data.updateOrderStatus(orderId, status)
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div>
    <OrderList 
      :orders="data.orders" 
      :locations="data.locations" 
      :currentUserProfile="data.userProfile"
      @delete-order="handleDeleteOrder"
      @update-status="handleUpdateStatus"
    />
  </div>
</template>
