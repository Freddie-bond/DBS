import request from '@/utils/request'

// 认证相关
export const authApi = {
  login: (data: { username: string; password: string }) => 
    request.post('/auth/login', data),
  getMe: () => request.get('/auth/me')
}

// 用户管理
export const userApi = {
  getList: (params: any) => request.get('/users', { params }),
  create: (data: any) => request.post('/users', data),
  update: (id: number, data: any) => request.put(`/users/${id}`, data),
  delete: (id: number) => request.delete(`/users/${id}`)
}

// 角色管理
export const roleApi = {
  getList: () => request.get('/roles'),
  create: (data: any) => request.post('/roles', data),
  update: (id: number, data: any) => request.put(`/roles/${id}`, data),
  delete: (id: number) => request.delete(`/roles/${id}`)
}

// 分类管理
export const categoryApi = {
  getTree: () => request.get('/categories/tree'),
  getList: () => request.get('/categories'),
  create: (data: any) => request.post('/categories', data),
  update: (id: number, data: any) => request.put(`/categories/${id}`, data),
  delete: (id: number) => request.delete(`/categories/${id}`)
}

// 备件管理
export const sparePartApi = {
  getList: (params: any) => request.get('/spare-parts', { params }),
  getDetail: (id: number) => request.get(`/spare-parts/${id}`),
  create: (data: any) => request.post('/spare-parts', data),
  update: (id: number, data: any) => request.put(`/spare-parts/${id}`, data),
  delete: (id: number) => request.delete(`/spare-parts/${id}`)
}

// 库存管理
export const inventoryApi = {
  getList: (params: any) => request.get('/inventory', { params }),
  update: (id: number, data: any) => request.put(`/inventory/${id}`, data),
  check: (data: any) => request.post('/inventory/check', data),
  getLowStock: () => request.get('/inventory/low-stock')
}

// 供应商管理
export const supplierApi = {
  getList: (params: any) => request.get('/suppliers', { params }),
  getDetail: (id: number) => request.get(`/suppliers/${id}`),
  create: (data: any) => request.post('/suppliers', data),
  update: (id: number, data: any) => request.put(`/suppliers/${id}`, data),
  delete: (id: number) => request.delete(`/suppliers/${id}`)
}

// 采购订单
export const purchaseOrderApi = {
  getList: (params: any) => request.get('/purchase-orders', { params }),
  getDetail: (id: number) => request.get(`/purchase-orders/${id}`),
  create: (data: any) => request.post('/purchase-orders', data),
  update: (id: number, data: any) => request.put(`/purchase-orders/${id}`, data),
  delete: (id: number) => request.delete(`/purchase-orders/${id}`)
}

// 出入库记录
export const transactionApi = {
  getList: (params: any) => request.get('/transactions', { params }),
  getDetail: (id: number) => request.get(`/transactions/${id}`),
  stockIn: (data: any) => request.post('/transactions/in', data),
  stockOut: (data: any) => request.post('/transactions/out', data),
  delete: (id: number) => request.delete(`/transactions/${id}`)
}

// 报表
export const reportApi = {
  getInventory: (params: any) => request.get('/reports/inventory', { params }),
  getPurchase: (params: any) => request.get('/reports/purchase', { params }),
  getTransaction: (params: any) => request.get('/reports/transaction', { params }),
  getUsageFrequency: (params: any) => request.get('/reports/usage-frequency', { params }),
  getSupplierComparison: (params: any) => request.get('/reports/supplier-comparison', { params })
}

