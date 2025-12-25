import request from '@/utils/request'

// 认证相关
export const authApi = {
  login: (data) => request.post('/auth/login', data),
  getMe: () => request.get('/auth/me')
}

// 用户管理
export const userApi = {
  getList: (params) => request.get('/users', { params }),
  create: (data) => request.post('/users', data),
  update: (id, data) => request.put(`/users/${id}`, data),
  delete: (id) => request.delete(`/users/${id}`)
}

// 角色管理
export const roleApi = {
  getList: () => request.get('/roles'),
  create: (data) => request.post('/roles', data),
  update: (id, data) => request.put(`/roles/${id}`, data),
  delete: (id) => request.delete(`/roles/${id}`)
}

// 分类管理
export const categoryApi = {
  getTree: () => request.get('/categories/tree'),
  getList: () => request.get('/categories'),
  create: (data) => request.post('/categories', data),
  update: (id, data) => request.put(`/categories/${id}`, data),
  delete: (id) => request.delete(`/categories/${id}`)
}

// 备件管理
export const sparePartApi = {
  getList: (params) => request.get('/spare-parts', { params }),
  getDetail: (id) => request.get(`/spare-parts/${id}`),
  create: (data) => request.post('/spare-parts', data),
  update: (id, data) => request.put(`/spare-parts/${id}`, data),
  delete: (id) => request.delete(`/spare-parts/${id}`)
}

// 库存管理
export const inventoryApi = {
  getList: (params) => request.get('/inventory', { params }),
  update: (id, data) => request.put(`/inventory/${id}`, data),
  check: (data) => request.post('/inventory/check', data),
  getLowStock: () => request.get('/inventory/low-stock')
}

// 供应商管理
export const supplierApi = {
  getList: (params) => request.get('/suppliers', { params }),
  getDetail: (id) => request.get(`/suppliers/${id}`),
  create: (data) => request.post('/suppliers', data),
  update: (id, data) => request.put(`/suppliers/${id}`, data),
  delete: (id) => request.delete(`/suppliers/${id}`)
}

// 采购订单
export const purchaseOrderApi = {
  getList: (params) => request.get('/purchase-orders', { params }),
  getDetail: (id) => request.get(`/purchase-orders/${id}`),
  create: (data) => request.post('/purchase-orders', data),
  update: (id, data) => request.put(`/purchase-orders/${id}`, data),
  delete: (id) => request.delete(`/purchase-orders/${id}`)
}

// 出入库记录
export const transactionApi = {
  getList: (params) => request.get('/transactions', { params }),
  getDetail: (id) => request.get(`/transactions/${id}`),
  in: (data) => request.post('/transactions/in', data),
  out: (data) => request.post('/transactions/out', data),
  delete: (id) => request.delete(`/transactions/${id}`)
}

// 报表
export const reportApi = {
  getInventory: (params) => request.get('/reports/inventory', { params }),
  getPurchase: (params) => request.get('/reports/purchase', { params }),
  getTransaction: (params) => request.get('/reports/transaction', { params }),
  getUsageFrequency: (params) => request.get('/reports/usage-frequency', { params }),
  getSupplierComparison: (params) => request.get('/reports/supplier-comparison', { params })
}

