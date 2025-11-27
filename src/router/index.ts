import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../pages/OrderView.vue')
    },
    {
      path: '/status',
      name: 'status',
      component: () => import('../pages/HomeView.vue')
    },
    {
      path: '/afhalen',
      name: 'pickup',
      component: () => import('../pages/PickupView.vue')
    },
    {
      path: '/beheer',
      name: 'admin',
      component: () => import('../pages/AdminView.vue')
    },
    {
      path: '/feature-requests',
      name: 'feature-requests',
      component: () => import('../pages/FeatureRequestsView.vue')
    }
  ]
})

export default router
