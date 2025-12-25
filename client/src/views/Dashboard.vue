<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #409EFF;">
              <el-icon size="30"><Box /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalParts }}</div>
              <div class="stat-label">备件总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #67C23A;">
              <el-icon size="30"><Goods /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.lowStockCount }}</div>
              <div class="stat-label">低库存预警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #E6A23C;">
              <el-icon size="30"><ShoppingCart /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.pendingOrders }}</div>
              <div class="stat-label">待处理订单</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-item">
            <div class="stat-icon" style="background: #F56C6C;">
              <el-icon size="30"><Shop /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalSuppliers }}</div>
              <div class="stat-label">供应商数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>低库存预警</span>
          </template>
          <el-table :data="lowStockList" style="width: 100%" v-loading="loading">
            <el-table-column prop="code" label="备件编码" width="120" />
            <el-table-column prop="name" label="备件名称" />
            <el-table-column prop="quantity" label="当前库存" width="100" />
            <el-table-column prop="safe_quantity" label="安全库存" width="100" />
            <el-table-column prop="shortage" label="缺口" width="100" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="24" :md="12">
        <el-card>
          <template #header>
            <span>最近出入库记录</span>
          </template>
          <el-table :data="recentTransactions" style="width: 100%" v-loading="loading">
            <el-table-column prop="part_name" label="备件名称" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'in' ? 'success' : 'warning'">
                  {{ row.type === 'in' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="transaction_time" label="时间" width="160" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Box, Goods, ShoppingCart, Shop } from '@element-plus/icons-vue'
import { inventoryApi, transactionApi, sparePartApi, purchaseOrderApi, supplierApi } from '@/api'

const loading = ref(false)
const stats = ref({
  totalParts: 0,
  lowStockCount: 0,
  pendingOrders: 0,
  totalSuppliers: 0
})
const lowStockList = ref([])
const recentTransactions = ref([])

const loadData = async () => {
  loading.value = true
  try {
    // 加载统计数据
    const [partsRes, lowStockRes, ordersRes, suppliersRes, transactionsRes] = await Promise.all([
      sparePartApi.getList({ page: 1, pageSize: 1 }),
      inventoryApi.getLowStock(),
      purchaseOrderApi.getList({ status: 'pending', page: 1, pageSize: 1 }),
      supplierApi.getList({ page: 1, pageSize: 1 }),
      transactionApi.getList({ page: 1, pageSize: 10 })
    ])

    stats.value.totalParts = partsRes.data.total
    stats.value.lowStockCount = lowStockRes.data.length
    stats.value.pendingOrders = ordersRes.data.total
    stats.value.totalSuppliers = suppliersRes.data.total
    lowStockList.value = lowStockRes.data.slice(0, 10)
    recentTransactions.value = transactionsRes.data.list
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  margin-bottom: 0;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 15px;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

@media (max-width: 768px) {
  .stat-icon {
    width: 50px;
    height: 50px;
    margin-right: 10px;
  }
  
  .stat-value {
    font-size: 24px;
  }
  
  .stat-label {
    font-size: 12px;
  }
}
</style>
