import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    const token = userStore.token || localStorage.getItem('admin_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.code !== 0) {
      // 避免显示过多的错误消息
      if (!res.message?.includes('未登录')) {
        ElMessage.error(res.message || '请求失败')
      }
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        // 使用 replace 避免历史记录问题
        router.replace('/login')
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  error => {
    const message = error.response?.data?.message || error.message || '网络错误'
    ElMessage.error(message)
    // 处理 401 未授权
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      router.replace('/login')
    }
    return Promise.reject(error)
  }
)

export default request
