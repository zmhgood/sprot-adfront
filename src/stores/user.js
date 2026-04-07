import { defineStore } from 'pinia'
import { login, getUserInfo } from '@/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    userInfo: null
  }),

  actions: {
    // 登录
    async login(credentials) {
      const res = await login(credentials)
      this.token = res.data.token
      localStorage.setItem('admin_token', res.data.token)
      // 同时存储用户信息
      if (res.data.admin) {
        this.userInfo = {
          nick_name: res.data.admin.nickname,
          avatar_url: res.data.admin.avatar,
          role: res.data.admin.role
        }
      }
      return res
    },

    // 获取用户信息
    async getUserInfo() {
      const res = await getUserInfo()
      this.userInfo = {
        nick_name: res.data.nickname,
        avatar_url: res.data.avatar,
        role: res.data.role
      }
      return res
    },

    // 登出
    logout() {
      this.token = ''
      this.userInfo = null
      localStorage.removeItem('admin_token')
    }
  }
})
