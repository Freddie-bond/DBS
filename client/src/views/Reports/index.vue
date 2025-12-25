<template>
  <div class="reports">
    <el-card>
      <template #header>
        <span>报表统计</span>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="库存报表" name="inventory">
          <div class="report-toolbar">
            <el-button type="primary" @click="exportInventory">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
          <el-table :data="inventoryData" v-loading="loading" border>
            <el-table-column prop="code" label="备件编码" width="150" />
            <el-table-column prop="name" label="备件名称" />
            <el-table-column prop="model" label="型号" width="150" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="category_name" label="分类" width="120" />
            <el-table-column prop="quantity" label="当前库存" width="100" />
            <el-table-column prop="safe_quantity" label="安全库存" width="100" />
            <el-table-column prop="location" label="存放位置" width="150" />
            <el-table-column prop="is_low_stock" label="是否低库存" width="120">
              <template #default="{ row }">
                <el-tag :type="row.is_low_stock ? 'danger' : 'success'">
                  {{ row.is_low_stock ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="采购报表" name="purchase">
          <div class="report-toolbar">
            <el-date-picker
              v-model="purchaseDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px"
            />
            <el-button type="primary" @click="loadPurchaseReport">查询</el-button>
            <el-button type="primary" @click="exportPurchase">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
          <el-table :data="purchaseData" v-loading="loading" border>
            <el-table-column prop="order_no" label="订单号" width="150" />
            <el-table-column prop="part_name" label="备件名称" />
            <el-table-column prop="supplier_name" label="供应商" width="150" />
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="unit_price" label="单价" width="100" />
            <el-table-column prop="total_amount" label="总金额" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag>{{ getStatusText(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180" />
          </el-table>
          <div v-if="purchaseStatistics" class="statistics">
            <el-descriptions :column="4" border>
              <el-descriptions-item label="订单总数">{{ purchaseStatistics.total_orders }}</el-descriptions-item>
              <el-descriptions-item label="总金额">{{ purchaseStatistics.total_amount }}</el-descriptions-item>
              <el-descriptions-item label="总数量">{{ purchaseStatistics.total_quantity }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <el-tab-pane label="出入库流水" name="transaction">
          <div class="report-toolbar">
            <el-date-picker
              v-model="transactionDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="margin-right: 10px"
            />
            <el-button type="primary" @click="loadTransactionReport">查询</el-button>
            <el-button type="primary" @click="exportTransaction">
              <el-icon><Download /></el-icon>
              导出Excel
            </el-button>
          </div>
          <el-table :data="transactionData" v-loading="loading" border>
            <el-table-column prop="part_code" label="备件编码" width="150" />
            <el-table-column prop="part_name" label="备件名称" />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.type === 'in' ? 'success' : 'warning'">
                  {{ row.type === 'in' ? '入库' : '出库' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="transaction_type" label="业务类型" width="120">
              <template #default="{ row }">
                {{ getTransactionTypeText(row.transaction_type) }}
              </template>
            </el-table-column>
            <el-table-column prop="quantity" label="数量" width="80" />
            <el-table-column prop="operator_name" label="操作人" width="100" />
            <el-table-column prop="transaction_time" label="交易时间" width="180" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="使用频率分析" name="usage">
          <el-table :data="usageData" v-loading="loading" border>
            <el-table-column prop="code" label="备件编码" width="150" />
            <el-table-column prop="name" label="备件名称" />
            <el-table-column prop="model" label="型号" width="150" />
            <el-table-column prop="usage_count" label="使用次数" width="100" />
            <el-table-column prop="total_out_quantity" label="总出库数量" width="120" />
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="供应商对比" name="supplier">
          <el-table :data="supplierData" v-loading="loading" border>
            <el-table-column prop="name" label="供应商名称" />
            <el-table-column prop="contact_person" label="联系人" width="120" />
            <el-table-column prop="phone" label="电话" width="150" />
            <el-table-column prop="order_count" label="订单数" width="100" />
            <el-table-column prop="total_amount" label="总金额" width="120" />
            <el-table-column prop="avg_price" label="平均单价" width="100" />
            <el-table-column prop="score" label="评分" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.score" disabled show-score />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { reportApi } from '@/api'

const loading = ref(false)
const activeTab = ref('inventory')
const inventoryData = ref([])
const purchaseData = ref([])
const purchaseStatistics = ref(null)
const transactionData = ref([])
const usageData = ref([])
const supplierData = ref([])
const purchaseDateRange = ref([])
const transactionDateRange = ref([])

const getStatusText = (status: string) => {
  const map: any = {
    draft: '草稿',
    pending: '待审核',
    approved: '已审批',
    ordered: '已下单',
    shipped: '已发货',
    received: '已入库',
    cancelled: '已取消'
  }
  return map[status] || status
}

const getTransactionTypeText = (type: string) => {
  const map: any = {
    purchase: '采购入库',
    transfer_in: '调拨入库',
    transfer_out: '调拨出库',
    usage: '领用出库',
    adjustment: '库存调整'
  }
  return map[type] || type
}

const loadInventoryReport = async () => {
  loading.value = true
  try {
    const res = await reportApi.getInventory({})
    inventoryData.value = res.data
  } catch (error) {
    console.error('加载库存报表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadPurchaseReport = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (purchaseDateRange.value && purchaseDateRange.value.length === 2) {
      params.start_date = purchaseDateRange.value[0].toISOString().split('T')[0]
      params.end_date = purchaseDateRange.value[1].toISOString().split('T')[0]
    }
    const res = await reportApi.getPurchase(params)
    purchaseData.value = res.data.list
    purchaseStatistics.value = res.data.statistics
  } catch (error) {
    console.error('加载采购报表失败:', error)
  } finally {
    loading.value = false
  }
}

const loadTransactionReport = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (transactionDateRange.value && transactionDateRange.value.length === 2) {
      params.start_date = transactionDateRange.value[0].toISOString().split('T')[0]
      params.end_date = transactionDateRange.value[1].toISOString().split('T')[0]
    }
    const res = await reportApi.getTransaction(params)
    transactionData.value = res.data
  } catch (error) {
    console.error('加载出入库流水失败:', error)
  } finally {
    loading.value = false
  }
}

const loadUsageReport = async () => {
  loading.value = true
  try {
    const res = await reportApi.getUsageFrequency({ limit: 20 })
    usageData.value = res.data
  } catch (error) {
    console.error('加载使用频率分析失败:', error)
  } finally {
    loading.value = false
  }
}

const loadSupplierReport = async () => {
  loading.value = true
  try {
    const res = await reportApi.getSupplierComparison({})
    supplierData.value = res.data
  } catch (error) {
    console.error('加载供应商对比失败:', error)
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'inventory') {
    loadInventoryReport()
  } else if (tab === 'purchase') {
    loadPurchaseReport()
  } else if (tab === 'transaction') {
    loadTransactionReport()
  } else if (tab === 'usage') {
    loadUsageReport()
  } else if (tab === 'supplier') {
    loadSupplierReport()
  }
}

const exportInventory = async () => {
  try {
    const link = document.createElement('a')
    link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports/inventory?export=excel`
    link.download = '库存报表.xlsx'
    link.click()
  } catch (error: any) {
    ElMessage.error('导出失败')
  }
}

const exportPurchase = async () => {
  try {
    const params: any = { export: 'excel' }
    if (purchaseDateRange.value && purchaseDateRange.value.length === 2) {
      params.start_date = purchaseDateRange.value[0].toISOString().split('T')[0]
      params.end_date = purchaseDateRange.value[1].toISOString().split('T')[0]
    }
    const queryString = new URLSearchParams(params).toString()
    const link = document.createElement('a')
    link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports/purchase?${queryString}`
    link.download = '采购报表.xlsx'
    link.click()
  } catch (error: any) {
    ElMessage.error('导出失败')
  }
}

const exportTransaction = async () => {
  try {
    const params: any = { export: 'excel' }
    if (transactionDateRange.value && transactionDateRange.value.length === 2) {
      params.start_date = transactionDateRange.value[0].toISOString().split('T')[0]
      params.end_date = transactionDateRange.value[1].toISOString().split('T')[0]
    }
    const queryString = new URLSearchParams(params).toString()
    const link = document.createElement('a')
    link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/reports/transaction?${queryString}`
    link.download = '出入库流水.xlsx'
    link.click()
  } catch (error: any) {
    ElMessage.error('导出失败')
  }
}

onMounted(() => {
  loadInventoryReport()
})
</script>

<style scoped>
.reports {
  padding: 0;
}

.report-toolbar {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.statistics {
  margin-top: 20px;
}
</style>

