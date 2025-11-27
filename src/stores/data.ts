import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { Product, Location, Order, UserProfile, FeatureRequest } from '../types'
import { useAuthStore } from './auth'

export const useDataStore = defineStore('data', () => {
  const products = ref<Product[]>([])
  const locations = ref<Location[]>([])
  const orders = ref<Order[]>([])
  const userProfile = ref<UserProfile | null>(null)
  const allUsers = ref<UserProfile[]>([])
  const featureRequests = ref<FeatureRequest[]>([])
  const appSettings = ref<{ [key: string]: number }>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const auth = useAuthStore()

  async function fetchUserProfile() {
    if (!auth.user) return
    const { data, error: err } = await supabase.from('profiles').select('*').eq('id', auth.user.id)
    if (err) {
      console.error('Error fetching profile:', err)
      error.value = err.message
    } else if (data && data.length > 0) {
      userProfile.value = data[0]
    }
  }

  async function fetchInitialData() {
    loading.value = true
    error.value = null
    try {
      const [settingsRes, productsRes, locationsRes, ordersRes] = await Promise.all([
        supabase.from('app_settings').select('key, value'),
        supabase.from('products').select('*').order('position', { ascending: true }),
        supabase.from('locations').select('*').order('position', { ascending: true }),
        supabase.from('kwartvoorbier').select('*, products(*), locations(*), user_id').order('created_at', { ascending: false })
      ])

      if (settingsRes.error) throw settingsRes.error
      if (productsRes.error) throw productsRes.error
      if (locationsRes.error) throw locationsRes.error
      if (ordersRes.error) throw ordersRes.error

      appSettings.value = (settingsRes.data || []).reduce((acc, setting) => {
        acc[setting.key] = parseInt(setting.value, 10)
        return acc
      }, {} as { [key: string]: number })

      products.value = productsRes.data || []
      locations.value = locationsRes.data || []
      orders.value = (ordersRes.data || []).map(o => ({...o, created_at: new Date(o.created_at)})) as unknown as Order[]

    } catch (e: any) {
      error.value = e.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  async function addOrder(locationId: number, productId: number) {
    if (!auth.user || !userProfile.value) return
    const customerName = userProfile.value.full_name || userProfile.value.email || 'Onbekende Gebruiker'
    
    const { error: err } = await supabase.from('kwartvoorbier').insert({
        customerName,
        location: locationId,
        productOrdered: productId,
        user_id: auth.user.id
    })
    if (err) throw err
    // Realtime subscription will update the list, but we could optimistically update here if needed
  }

  async function deleteOrder(orderId: number) {
    const { error: err } = await supabase.from('kwartvoorbier').delete().eq('id', orderId)
    if (err) throw err
  }

  async function updateOrderStatus(orderId: number, newStatus: { collected?: boolean; delivered?: boolean }) {
    const { error: err } = await supabase.from('kwartvoorbier').update(newStatus).eq('id', orderId)
    if (err) throw err
  }

  async function addFeatureRequest(title: string, description: string) {
    if (!auth.user) return
    const { data, error: err } = await supabase.from('feature_requests').insert({
        title,
        description,
        user_id: auth.user.id
    }).select().single()
    
    if (err) throw err
    if (data) {
        const newRequest = {...data, created_at: new Date(data.created_at)} as FeatureRequest
        featureRequests.value = [newRequest, ...featureRequests.value]
    }
  }

  async function fetchFeatureRequests() {
      if (!auth.user) return
      const { data, error: err } = await supabase
          .from('feature_requests')
          .select('*')
          .eq('user_id', auth.user.id)
          .order('created_at', { ascending: false })
      
      if (err) console.error(err)
      else {
          featureRequests.value = (data || []).map(r => ({...r, created_at: new Date(r.created_at)})) as FeatureRequest[]
      }
  }

  // Admin Actions
  async function updateUserRole(userId: string, newRole: string) {
    const { error: err } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (err) throw err
    // Optimistic update
    allUsers.value = allUsers.value.map(u => u.id === userId ? { ...u, role: newRole as any } : u)
  }

  async function deleteUsers(userIds: string[]) {
    if (userIds.length === 0) return
    const { error: err } = await supabase.functions.invoke('delete-user', { body: { userIds } })
    if (err) throw err
    allUsers.value = allUsers.value.filter(u => !userIds.includes(u.id))
  }

  async function addProduct(productData: { name: string; available_on_days: number[] }) {
    const newPosition = products.value.length > 0 ? Math.max(...products.value.map(p => p.position ?? 0)) + 1 : 0
    const { data, error: err } = await supabase.from('products').insert({ ...productData, position: newPosition }).select().single()
    if (err) throw err
    if (data) products.value.push(data)
  }

  async function updateProduct(id: number, productData: { name: string; available_on_days: number[] }) {
    const { data, error: err } = await supabase.from('products').update(productData).eq('id', id).select().single()
    if (err) throw err
    if (data) products.value = products.value.map(p => p.id === id ? data : p)
  }

  async function deleteProduct(id: number) {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) throw err
    products.value = products.value.filter(p => p.id !== id)
  }

  async function addLocation(loc: Omit<Location, 'id'>) {
    const newPosition = locations.value.length > 0 ? Math.max(...locations.value.map(l => l.position ?? 0)) + 1 : 0
    const { data, error: err } = await supabase.from('locations').insert({ ...loc, position: newPosition }).select().single()
    if (err) throw err
    if (data) locations.value.push(data)
  }

  async function updateLocation(id: number, loc: Omit<Location, 'id'>) {
    const { data, error: err } = await supabase.from('locations').update(loc).eq('id', id).select().single()
    if (err) throw err
    if (data) locations.value = locations.value.map(l => l.id === id ? data : l)
  }

  async function deleteLocation(id: number) {
    const { error: err } = await supabase.from('locations').delete().eq('id', id)
    if (err) throw err
    locations.value = locations.value.filter(l => l.id !== id)
  }

  async function updateSettings(newSettings: { startHour: number; startMinute: number; endHour: number; endMinute: number }) {
      const updates = [
          supabase.from('app_settings').update({ value: String(newSettings.startHour) }).eq('key', 'ORDER_START_HOUR'),
          supabase.from('app_settings').update({ value: String(newSettings.startMinute) }).eq('key', 'ORDER_START_MINUTE'),
          supabase.from('app_settings').update({ value: String(newSettings.endHour) }).eq('key', 'ORDER_END_HOUR'),
          supabase.from('app_settings').update({ value: String(newSettings.endMinute) }).eq('key', 'ORDER_END_MINUTE'),
      ]
      await Promise.all(updates)
      // Update local state
      appSettings.value = {
          ORDER_START_HOUR: newSettings.startHour,
          ORDER_START_MINUTE: newSettings.startMinute,
          ORDER_END_HOUR: newSettings.endHour,
          ORDER_END_MINUTE: newSettings.endMinute,
      }
  }
  
  async function updateFeatureRequestStatus(id: number, newStatus: string) {
      const { data, error: err } = await supabase.from('feature_requests').update({ status: newStatus }).eq('id', id).select().single()
      if (err) throw err
      if (data) {
          const updatedRequest = {...data, created_at: new Date(data.created_at)} as FeatureRequest
          featureRequests.value = featureRequests.value.map(r => r.id === id ? updatedRequest : r)
      }
  }

  async function fetchAllUsers() {
      const { data, error: err } = await supabase.from('profiles').select('*')
      if (err) console.error(err)
      else allUsers.value = data || []
  }
  
  async function fetchAllFeatureRequests() {
        const { data, error: err } = await supabase
            .from('feature_requests')
            .select('*, profiles(full_name, email)')
            .order('created_at', { ascending: false })

        if (err) console.error(err)
        else {
            featureRequests.value = (data || []).map(r => ({
                ...r, 
                created_at: new Date(r.created_at),
                customerName: (r.profiles as any)?.full_name || (r.profiles as any)?.email || 'Onbekend'
            })) as FeatureRequest[]
        }
  }

  return {
    products,
    locations,
    orders,
    userProfile,
    allUsers,
    featureRequests,
    appSettings,
    loading,
    error,
    fetchUserProfile,
    fetchInitialData,
    addOrder,
    deleteOrder,
    updateOrderStatus,
    addFeatureRequest,
    fetchFeatureRequests,
    updateUserRole,
    deleteUsers,
    addProduct,
    updateProduct,
    deleteProduct,
    addLocation,
    updateLocation,
    deleteLocation,
    updateSettings,
    updateFeatureRequestStatus,
    fetchAllUsers,
    fetchAllFeatureRequests
  }

})
