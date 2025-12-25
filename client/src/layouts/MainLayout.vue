<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '200px'" class="sidebar">
      <div class="logo">
        <h2>船舶SMIS</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        class="sidebar-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/spare-parts">
          <el-icon><Box /></el-icon>
          <span>备件管理</span>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><FolderOpened /></el-icon>
          <span>分类管理</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><Goods /></el-icon>
          <span>库存管理</span>
        </el-menu-item>
        <el-menu-item index="/suppliers">
          <el-icon><Shop /></el-icon>
          <span>供应商管理</span>
        </el-menu-item>
        <el-menu-item index="/purchase-orders">
          <el-icon><ShoppingCart /></el-icon>
          <span>采购管理</span>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><Operation /></el-icon>
          <span>出入库管理</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><DataAnalysis /></el-icon>
          <span>报表统计</span>
        </el-menu-item>
        <el-menu-item index="/users" v-if="userStore.user?.role_name === '系统管理员'">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/roles" v-if="userStore.user?.role_name === '系统管理员'">
          <el-icon><UserFilled /></el-icon>
          <span>角色管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><Avatar /></el-icon>
              {{ userStore.user?.real_name || userStore.user?.username }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  House,
  Box,
  FolderOpened,
  Goods,
  Shop,
  ShoppingCart,
  Operation,
  DataAnalysis,
  User,
  UserFilled,
  Avatar,
  ArrowDown
} from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '船舶SMIS备件管理系统')
const isCollapse = ref(false)

const handleCommand = (command) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      router.push('/login')
    })
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow: hidden;
  transition: width 0.3s;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    z-index: 1000;
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: #2b3a4a;
}

.logo h2 {
  margin: 0;
  font-size: 18px;
}

.sidebar-menu {
  border: none;
  height: calc(100vh - 60px);
  overflow-y: auto;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  flex: 1;
}

.title {
  font-size: 18px;
  font-weight: 500;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}

.user-info .el-icon {
  margin: 0 5px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .main-content {
    padding: 10px;
  }
  
  .header {
    padding: 0 10px;
  }
  
  .title {
    font-size: 16px;
  }
}
</style>
