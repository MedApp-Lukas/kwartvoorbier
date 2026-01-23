import { defineStore } from 'pinia'
import { ref, computed, onUnmounted } from 'vue'
import { supabase } from '../lib/supabase'
import type { Product, Location, Order, UserProfile, FeatureRequest } from '../types'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { useAuthStore } from './auth'

export const useDataStore = defineStore('data', () => {
  const products = ref<Product[]>([])
  const locations = ref<Location[]>([])
  const orders = ref<Order[]>([])
  const recentUserOrders = ref<Order[]>([]) // New state for user history
  const userProfile = ref<UserProfile | null>(null)
  const allUsers = ref<UserProfile[]>([])
  const featureRequests = ref<FeatureRequest[]>([])
  const appSettings = ref<{ [key: string]: number }>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const auth = useAuthStore()
  
  // Real-time subscription channels
  let ordersChannel: RealtimeChannel | null = null
  let productsChannel: RealtimeChannel | null = null
  let locationsChannel: RealtimeChannel | null = null
  let featureRequestsChannel: RealtimeChannel | null = null

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
      const [settingsRes, productsRes, locationsRes] = await Promise.all([
        supabase.from('app_settings').select('key, value'),
        supabase.from('products').select('*').order('position', { ascending: true }),
        supabase.from('locations').select('*').order('position', { ascending: true })
        // Removed global orders fetch
      ])

      if (settingsRes.error) throw settingsRes.error
      if (productsRes.error) throw productsRes.error
      if (locationsRes.error) throw locationsRes.error

      appSettings.value = (settingsRes.data || []).reduce((acc, setting) => {
        acc[setting.key] = parseInt(setting.value, 10)
        return acc
      }, {} as { [key: string]: number })

      products.value = productsRes.data || []
      locations.value = locationsRes.data || []
      products.value = productsRes.data || []
      locations.value = locationsRes.data || []
      // orders.value is now populated by specific page logic

      // Setup real-time subscriptions after initial data load
      setupRealtimeSubscriptions()

    } catch (e: any) {
      error.value = e.message || 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  function setupRealtimeSubscriptions() {
    // Cleanup existing subscriptions first
    cleanupRealtimeSubscriptions()

    // Subscribe to orders (kwartvoorbier) changes
    ordersChannel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'kwartvoorbier' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Check if order already exists (optimistic update might have added it)
            // We check both arrays to be safe
            const existingInOrders = orders.value.find(o => o.id === payload.new.id)
            const existingInRecent = recentUserOrders.value.find(o => o.id === payload.new.id)
            
            if (existingInOrders && existingInRecent) return

            // Fetch the full order with relations
            const { data } = await supabase
              .from('kwartvoorbier')
              .select('*, products(*), locations(*), user_id')
              .eq('id', payload.new.id)
              .single()
            
            if (data) {
              const newOrder = { ...data, created_at: new Date(data.created_at) } as unknown as Order
              
              // Update main orders list (if not duplicate)
              if (!existingInOrders) {
                 orders.value = [newOrder, ...orders.value]
              }

              // Update user recent orders (if belongs to user and not duplicate)
              if (!existingInRecent && auth.user && data.user_id === auth.user.id) {
                 recentUserOrders.value = [newOrder, ...recentUserOrders.value]
              }
            }
          } else if (payload.eventType === 'UPDATE') {
             // Update in global orders
            const index = orders.value.findIndex(o => o.id === payload.new.id)
            if (index !== -1) {
              orders.value[index] = { ...orders.value[index], ...payload.new }
            }
            
            // Update in recent user orders
            const recentIndex = recentUserOrders.value.findIndex(o => o.id === payload.new.id)
            if (recentIndex !== -1) {
              recentUserOrders.value[recentIndex] = { ...recentUserOrders.value[recentIndex], ...payload.new }
            }

          } else if (payload.eventType === 'DELETE') {
            orders.value = orders.value.filter(o => o.id !== payload.old.id)
            recentUserOrders.value = recentUserOrders.value.filter(o => o.id !== payload.old.id)
          }
        }
      )
      .subscribe()

    // Subscribe to products changes
    productsChannel = supabase
      .channel('products-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            products.value = [...products.value, payload.new as Product]
          } else if (payload.eventType === 'UPDATE') {
            const index = products.value.findIndex(p => p.id === payload.new.id)
            if (index !== -1) {
              products.value[index] = payload.new as Product
            }
          } else if (payload.eventType === 'DELETE') {
            products.value = products.value.filter(p => p.id !== payload.old.id)
          }
        }
      )
      .subscribe()

    // Subscribe to locations changes
    locationsChannel = supabase
      .channel('locations-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            locations.value = [...locations.value, payload.new as Location]
          } else if (payload.eventType === 'UPDATE') {
            const index = locations.value.findIndex(l => l.id === payload.new.id)
            if (index !== -1) {
              locations.value[index] = payload.new as Location
            }
          } else if (payload.eventType === 'DELETE') {
            locations.value = locations.value.filter(l => l.id !== payload.old.id)
          }
        }
      )
      .subscribe()

    // Subscribe to feature_requests changes
    featureRequestsChannel = supabase
      .channel('feature-requests-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'feature_requests' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch with profile relation if needed
            const newRequest = { ...payload.new, created_at: new Date(payload.new.created_at) } as FeatureRequest
            featureRequests.value = [newRequest, ...featureRequests.value]
          } else if (payload.eventType === 'UPDATE') {
            const index = featureRequests.value.findIndex(r => r.id === payload.new.id)
            if (index !== -1) {
              featureRequests.value[index] = { 
                ...featureRequests.value[index], 
                ...payload.new,
                created_at: new Date(payload.new.created_at)
              } as FeatureRequest
            }
          } else if (payload.eventType === 'DELETE') {
            featureRequests.value = featureRequests.value.filter(r => r.id !== payload.old.id)
          }
        }
      )
      .subscribe()
  }

  function cleanupRealtimeSubscriptions() {
    if (ordersChannel) {
      supabase.removeChannel(ordersChannel)
      ordersChannel = null
    }
    if (productsChannel) {
      supabase.removeChannel(productsChannel)
      productsChannel = null
    }
    if (locationsChannel) {
      supabase.removeChannel(locationsChannel)
      locationsChannel = null
    }
    if (featureRequestsChannel) {
      supabase.removeChannel(featureRequestsChannel)
      featureRequestsChannel = null
    }
  }

  // Cleanup on store unmount
  onUnmounted(() => {
    cleanupRealtimeSubscriptions()
  })

  async function addOrder(locationId: number, productId: number) {
    if (!auth.user || !userProfile.value) return
    const customerName = userProfile.value.full_name || userProfile.value.email || 'Onbekende Gebruiker'

    const { data: newOrder, error: err } = await supabase.from('kwartvoorbier').insert({
      customerName,
      location: locationId,
      productOrdered: productId,
      user_id: auth.user.id
    }).select('*, products(*), locations(*), user_id').single()
    
    if (err) throw err
    
    // Optimistic update: Add immediately to local state
    if (newOrder) {
      const formattedOrder = { ...newOrder, created_at: new Date(newOrder.created_at) } as unknown as Order
      orders.value = [formattedOrder, ...orders.value]
      recentUserOrders.value = [formattedOrder, ...recentUserOrders.value]
    }
  }

  async function deleteOrder(orderId: number) {
    const { error: err } = await supabase.from('kwartvoorbier').delete().eq('id', orderId)
    if (err) throw err
    orders.value = orders.value.filter(o => o.id !== orderId)
    recentUserOrders.value = recentUserOrders.value.filter(o => o.id !== orderId)
  }

  async function updateOrderStatus(orderId: number, newStatus: { collected?: boolean; delivered?: boolean }) {
    const { error: err } = await supabase.from('kwartvoorbier').update(newStatus).eq('id', orderId)
    if (err) throw err
    orders.value = orders.value.map(o => o.id === orderId ? { ...o, ...newStatus } : o)
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
      const newRequest = { ...data, created_at: new Date(data.created_at) } as FeatureRequest
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
      featureRequests.value = (data || []).map(r => ({ ...r, created_at: new Date(r.created_at) })) as FeatureRequest[]
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
      const updatedRequest = { ...data, created_at: new Date(data.created_at) } as FeatureRequest
      featureRequests.value = featureRequests.value.map(request => request.id === id ? updatedRequest : request)
    }
  }

  async function deleteFeatureRequest(id: number) {
    const { error: err } = await supabase.from('feature_requests').delete().eq('id', id)
    if (err) throw err
    featureRequests.value = featureRequests.value.filter(request => request.id !== id)
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

  async function fetchUserHistory() {
    if (!auth.user) return
    const { data, error: err } = await supabase
      .from('kwartvoorbier')
      .select('*, products(*), locations(*), user_id')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .limit(15) 

    if (err) console.error(err)
    else {
      recentUserOrders.value = (data || []).map(o => ({ ...o, created_at: new Date(o.created_at) })) as unknown as Order[]
    }
  }

  async function fetchTodaysOrders() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // We strictly want orders from "today"
    // Note: depending on timezone requirements, this might need adjustment, but JS Date works for local perception usually.
    // Using ISOString sends UTC, which is correct for Supabase comparisons usually.
    
    const { data, error: err } = await supabase
      .from('kwartvoorbier')
      .select('*, products(*), locations(*), user_id')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })

    if (err) console.error(err)
    else {
      orders.value = (data || []).map(o => ({ ...o, created_at: new Date(o.created_at) })) as unknown as Order[]
    }
  }

  async function updateProductPositions(productIds: number[]) {
    // Update positions in database based on array order
    const updates = productIds.map((id, index) =>
      supabase.from('products').update({ position: index }).eq('id', id)
    )
    await Promise.all(updates)

    // Update local state to reflect new order
    const orderedProducts = productIds.map(id => products.value.find(p => p.id === id)).filter(Boolean) as Product[]
    products.value = orderedProducts
  }

  async function updateLocationPositions(locationIds: number[]) {
    // Update positions in database based on array order
    const updates = locationIds.map((id, index) =>
      supabase.from('locations').update({ position: index }).eq('id', id)
    )
    await Promise.all(updates)

    // Update local state to reflect new order
    const orderedLocations = locationIds.map(id => locations.value.find(l => l.id === id)).filter(Boolean) as Location[]
    locations.value = orderedLocations
  }

  // Computed properties for user order history
  // Using recentUserOrders instead of filtering global orders
  
  const getUserLastLocation = computed(() => {
    if (recentUserOrders.value.length === 0) return null
    // Get the most recent order (index 0 because we sorted desc in fetch)
    return recentUserOrders.value[0].locations.id
  })

  const getUserOrderHistory = computed(() => {
    if (recentUserOrders.value.length === 0) return []
    
    // Group orders by unique product+location combination
    const uniqueOrders = new Map<string, Order>()
    
    // recentUserOrders is already sorted desc
    
    for (const order of recentUserOrders.value) {
      const key = `${order.products.id}-${order.locations.id}`
      if (!uniqueOrders.has(key)) {
        uniqueOrders.set(key, order)
      }
    }
    
    // Return up to 5 most recent unique orders
    return Array.from(uniqueOrders.values()).slice(0, 5)
  })


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
    setupRealtimeSubscriptions,
    cleanupRealtimeSubscriptions,
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
    deleteFeatureRequest,
    fetchAllUsers,
    fetchAllFeatureRequests,
    fetchUserHistory,
    fetchTodaysOrders,
    updateProductPositions,
    updateLocationPositions,
    // Order history
    getUserLastLocation,
    getUserOrderHistory
  }


})
