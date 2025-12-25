import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/api'

interface User {
  id: number
  username: string
  real_name: string
  role_id: number
  role_name: string
  permissions: any
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<User | null>(null)

  const setToken = (newToken: string) => {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  const setUser = (userData: User) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const initUser = async () => {
    if (token.value) {
      try {
        const res = await authApi.getMe()
        setUser(res.data)
      } catch (error) {
        logout()
      }
    }
  }

  // 初始化时从localStorage恢复用户信息
  const savedUser = localStorage.getItem('user')
  if (savedUser) {
    try {
      user.value = JSON.parse(savedUser)
    } catch (e) {
      // ignore
    }
  }

  return {
    token,
    user,
    setToken,
    setUser,
    logout,
    initUser
  }
})

