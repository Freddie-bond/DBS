import { defineStore } from 'pinia'
import { authApi } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user') || 'null')
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    userRole: (state) => state.user?.role_name || '',
    permissions: (state) => state.user?.permissions || {}
  },

  actions: {
    async login(credentials) {
      try {
        const res = await authApi.login(credentials)
        this.token = res.data.token
        this.user = res.data.user
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        return res
      } catch (error) {
        throw error
      }
    },

    async fetchUserInfo() {
      try {
        const res = await authApi.getMe()
        this.user = res.data
        localStorage.setItem('user', JSON.stringify(this.user))
        return res
      } catch (error) {
        throw error
      }
    },

    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },

    hasPermission(module, action) {
      if (!this.permissions) return false
      if (this.permissions.all) return true
      if (this.permissions[module]) {
        if (Array.isArray(this.permissions[module])) {
          return this.permissions[module].includes(action) || this.permissions[module].includes('all')
        }
        return this.permissions[module] === true
      }
      return false
    },

    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
    },

    setUser(user) {
      this.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },

    async initUser() {
      if (this.token) {
        try {
          await this.fetchUserInfo()
        } catch (error) {
          this.logout()
        }
      }
    }
  }
})

