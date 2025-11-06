import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = '/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user
  },

  actions: {
    async register(username, email, password) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, {
          username,
          email,
          password
        })
        
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('token', this.token)
        
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          error: error.response?.data?.error || 'Registration failed' 
        }
      }
    },

    async login(username, password) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          username,
          password
        })
        
        this.token = response.data.token
        this.user = response.data.user
        localStorage.setItem('token', this.token)
        
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          error: error.response?.data?.error || 'Login failed' 
        }
      }
    },

    async checkAuth() {
      if (!this.token) return false

      try {
        const response = await axios.get(`${API_URL}/auth/verify`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        
        this.user = response.data.user
        return true
      } catch (error) {
        this.logout()
        return false
      }
    },

    logout() {
      this.user = null
      this.token = null
      localStorage.removeItem('token')
    },

    getAuthHeader() {
      return { Authorization: `Bearer ${this.token}` }
    }
  }
})