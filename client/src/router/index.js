import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'spare-parts',
        name: 'SpareParts',
        component: () => import('@/views/SpareParts/index.vue'),
        meta: { title: '备件管理', icon: 'Box' }
      },
      {
        path: 'inventory',
        name: 'Inventory',
        component: () => import('@/views/Inventory/index.vue'),
        meta: { title: '库存管理', icon: 'Goods' }
      },
      {
        path: 'purchase-orders',
        name: 'PurchaseOrders',
        component: () => import('@/views/PurchaseOrders/index.vue'),
        meta: { title: '采购管理', icon: 'ShoppingCart' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('@/views/Categories/index.vue'),
        meta: { title: '分类管理', icon: 'FolderOpened' }
      },
      {
        path: 'suppliers',
        name: 'Suppliers',
        component: () => import('@/views/Suppliers/index.vue'),
        meta: { title: '供应商管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'transactions',
        name: 'Transactions',
        component: () => import('@/views/Transactions/index.vue'),
        meta: { title: '出入库管理', icon: 'Switch' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/Reports/index.vue'),
        meta: { title: '报表统计', icon: 'DataAnalysis' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users/index.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('@/views/Roles/index.vue'),
        meta: { title: '角色管理', icon: 'UserFilled' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})

export default router

