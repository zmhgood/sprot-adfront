<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo">
        <img :src="logoUrl" alt="logo" class="logo-img" @error="handleLogoError" />
        <span v-show="!isCollapse" class="logo-text">{{ siteName }}</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/exercises">
          <el-icon><Collection /></el-icon>
          <span>锻炼管理</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/comments">
          <el-icon><ChatDotRound /></el-icon>
          <span>评论管理</span>
        </el-menu-item>
        <el-menu-item index="/families">
          <el-icon><House /></el-icon>
          <span>家庭管理</span>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <span>系统设置</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 右侧内容 -->
    <el-container>
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="toggleCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ currentRoute?.meta?.title }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown>
            <span class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar_url">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <span class="username">{{ userStore.userInfo?.nick_name || '管理员' }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getConfigs } from '@/api'
import defaultLogo from '@/assets/logo.png'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const activeMenu = computed(() => route.path)
const currentRoute = computed(() => route)

// 动态配置
const logoUrl = ref(defaultLogo)
const siteName = ref('银龄健身')

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}

const handleLogoError = () => {
  logoUrl.value = defaultLogo
}

// 加载系统配置
const loadConfigs = async () => {
  try {
    const res = await getConfigs()
    if (res.data) {
      if (res.data.logo_url) {
        logoUrl.value = res.data.logo_url
      }
      if (res.data.site_name) {
        siteName.value = res.data.site_name
      }
    }
  } catch (error) {
    console.error('加载配置失败:', error)
  }
}

// 监听配置更新事件
const handleConfigUpdate = (e) => {
  if (e.detail) {
    if (e.detail.logo_url) {
      logoUrl.value = e.detail.logo_url
    }
    if (e.detail.site_name) {
      siteName.value = e.detail.site_name
    }
  }
}

onMounted(() => {
  // 确保加载用户信息
  if (!userStore.userInfo && userStore.token) {
    userStore.getUserInfo().catch(err => {
      console.error('获取用户信息失败:', err)
    })
  }
  loadConfigs()
  window.addEventListener('config-updated', handleConfigUpdate)
})
</script>

<style lang="scss" scoped>
.main-layout {
  height: 100vh;
}

.aside {
  background-color: #304156;
  transition: width 0.3s;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 15px;
    background-color: #263445;
    
    .logo-img {
      width: 32px;
      height: 32px;
    }
    
    .logo-text {
      color: #fff;
      font-size: 18px;
      font-weight: bold;
      margin-left: 10px;
    }
  }
  
  .el-menu {
    border-right: none;
  }
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  padding: 0 20px;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      margin-right: 15px;
      
      &:hover {
        color: #409EFF;
      }
    }
  }
  
  .header-right {
    .user-info {
      display: flex;
      align-items: center;
      cursor: pointer;
      
      .username {
        margin-left: 8px;
        font-size: 14px;
      }
    }
  }
}

.main {
  background-color: #f5f7fa;
  padding: 20px;
}
</style>
