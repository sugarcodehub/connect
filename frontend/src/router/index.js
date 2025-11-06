import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import Room from '../views/Room.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  {
    path: '/room/:roomName',
    name: 'Room',
    component: Room,
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth) {
    // Check if we have a token
    if (!authStore.token) {
      next('/login')
      return
    }

    // If we have token but no user data, fetch it
    if (!authStore.currentUser) {
      try {
        await authStore.checkAuth()
        if (!authStore.currentUser) {
          next('/login')
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        next('/login')
        return
      }
    }
  }
  
  next()
})

export default router