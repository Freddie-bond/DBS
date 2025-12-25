import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
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
          name: 'dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { title: '首页' }
        },
        {
          path: 'spare-parts',
          name: 'spare-parts',
          component: () => import('@/views/SpareParts/index.vue'),
          meta: { title: '备件管理' }
        },
        {
          path: 'categories',
          name: 'categories',
          component: () => import('@/views/Categories/index.vue'),
          meta: { title: '分类管理' }
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('@/views/Inventory/index.vue'),
          meta: { title: '库存管理' }
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('@/views/Suppliers/index.vue'),
          meta: { title: '供应商管理' }
        },
        {
          path: 'purchase-orders',
          name: 'purchase-orders',
          component: () => import('@/views/PurchaseOrders/index.vue'),
          meta: { title: '采购管理' }
        },
        {
          path: 'transactions',
          name: 'transactions',
          component: () => import('@/views/Transactions/index.vue'),
          meta: { title: '出入库管理' }
        },
        {
          path: 'reports',
          name: 'reports',
          component: () => import('@/views/Reports/index.vue'),
          meta: { title: '报表统计' }
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/Users/index.vue'),
          meta: { title: '用户管理' }
        },
        {
          path: 'roles',
          name: 'roles',
          component: () => import('@/views/Roles/index.vue'),
          meta: { title: '角色管理' }
        }
      ]
    }
  ]
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.token) {
    next('/login')
  } else if (to.path === '/login' && userStore.token) {
    next('/')
  } else {
    next()
  }
})

export default router
