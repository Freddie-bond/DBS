<template>
  <div class="transactions">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>出入库管理</span>
          <div>
            <el-button type="success" @click="handleStockIn">
              <el-icon><Plus /></el-icon>
              入库
            </el-button>
            <el-button type="warning" @click="handleStockOut">
              <el-icon><Minus /></el-icon>
              出库
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="类型">
          <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 120px">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
          </el-select>
        </el-form-item>
        <el-form-item label="业务类型">
          <el-select v-model="searchForm.transaction_type" placeholder="请选择" clearable style="width: 150px">
            <el-option label="采购入库" value="purchase" />
            <el-option label="调拨入库" value="transfer_in" />
            <el-option label="调拨出库" value="transfer_out" />
            <el-option label="领用出库" value="usage" />
            <el-option label="库存调整" value="adjustment" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
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
        <el-table-column prop="batch_no" label="批次号" width="150" />
        <el-table-column prop="operator_name" label="操作人" width="100" />
        <el-table-column prop="receiver_name" label="领用人" width="100" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="transaction_time" label="交易时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="inDialogVisible"
      title="入库操作"
      width="600px"
      @close="resetInForm"
    >
      <el-form ref="inFormRef" :model="inForm" :rules="inRules" label-width="100px">
        <el-form-item label="备件" prop="part_id">
          <el-select
            v-model="inForm.part_id"
            placeholder="请选择备件"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in partOptions"
              :key="item.id"
              :label="`${item.code} - ${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="inForm.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="业务类型" prop="transaction_type">
          <el-select v-model="inForm.transaction_type" style="width: 100%">
            <el-option label="采购入库" value="purchase" />
            <el-option label="调拨入库" value="transfer_in" />
          </el-select>
        </el-form-item>
        <el-form-item label="关联订单">
          <el-select
            v-model="inForm.related_order_id"
            placeholder="请选择采购订单（可选）"
            filterable
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="item in orderOptions"
              :key="item.id"
              :label="`${item.order_no} - ${item.part_name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="inForm.location" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="inForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleInSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="outDialogVisible"
      title="出库操作"
      width="600px"
      @close="resetOutForm"
    >
      <el-form ref="outFormRef" :model="outForm" :rules="outRules" label-width="100px">
        <el-form-item label="备件" prop="part_id">
          <el-select
            v-model="outForm.part_id"
            placeholder="请选择备件"
            filterable
            style="width: 100%"
            @change="handleOutPartChange"
          >
            <el-option
              v-for="item in partOptions"
              :key="item.id"
              :label="`${item.code} - ${item.name} (库存: ${item.quantity})`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="outForm.quantity" :min="1" :max="outForm.maxQuantity" style="width: 100%" />
        </el-form-item>
        <el-form-item label="业务类型" prop="transaction_type">
          <el-select v-model="outForm.transaction_type" style="width: 100%">
            <el-option label="领用出库" value="usage" />
            <el-option label="调拨出库" value="transfer_out" />
          </el-select>
        </el-form-item>
        <el-form-item label="领用人">
          <el-input v-model="outForm.receiver_name" placeholder="请输入领用人姓名" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="outForm.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="outDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleOutSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Minus } from '@element-plus/icons-vue'
import { transactionApi, sparePartApi, purchaseOrderApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const partOptions = ref([])
const orderOptions = ref([])
const inDialogVisible = ref(false)
const outDialogVisible = ref(false)
const dateRange = ref([])
const inFormRef = ref(null)
const outFormRef = ref(null)

const searchForm = reactive({
  type: '',
  transaction_type: '',
  start_date: '',
  end_date: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const inForm = reactive({
  part_id: null,
  quantity: 1,
  transaction_type: 'purchase',
  related_order_id: null,
  location: '',
  remark: ''
})

const outForm = reactive({
  part_id: null,
  quantity: 1,
  transaction_type: 'usage',
  receiver_name: '',
  remark: '',
  maxQuantity: 0
})

const inRules = {
  part_id: [{ required: true, message: '请选择备件', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  transaction_type: [{ required: true, message: '请选择业务类型', trigger: 'change' }]
}

const outRules = {
  part_id: [{ required: true, message: '请选择备件', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  transaction_type: [{ required: true, message: '请选择业务类型', trigger: 'change' }]
}

const getTransactionTypeText = (type) => {
  const map = {
    purchase: '采购入库',
    transfer_in: '调拨入库',
    transfer_out: '调拨出库',
    usage: '领用出库',
    adjustment: '库存调整'
  }
  return map[type] || type
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await transactionApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      ...searchForm
    })
    tableData.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const loadParts = async () => {
  try {
    const res = await sparePartApi.getList({ page: 1, pageSize: 1000 })
    partOptions.value = res.data.list
  } catch (error) {
    console.error('加载备件失败:', error)
  }
}

const loadOrders = async () => {
  try {
    const res = await purchaseOrderApi.getList({ status: 'approved', page: 1, pageSize: 1000 })
    orderOptions.value = res.data.list
  } catch (error) {
    console.error('加载订单失败:', error)
  }
}

const handleDateChange = (dates) => {
  if (dates && dates.length === 2) {
    searchForm.start_date = dates[0].toISOString().split('T')[0]
    searchForm.end_date = dates[1].toISOString().split('T')[0]
  } else {
    searchForm.start_date = ''
    searchForm.end_date = ''
  }
}

const resetSearch = () => {
  searchForm.type = ''
  searchForm.transaction_type = ''
  searchForm.start_date = ''
  searchForm.end_date = ''
  dateRange.value = []
  loadData()
}

const handleStockIn = () => {
  inDialogVisible.value = true
  loadParts()
  loadOrders()
}

const handleStockOut = () => {
  outDialogVisible.value = true
  loadParts()
}

const handleOutPartChange = (partId) => {
  const part = partOptions.value.find((p) => p.id === partId)
  if (part) {
    outForm.maxQuantity = part.quantity || 0
  }
}

const handleView = async (row) => {
  // 可以打开详情对话框
  ElMessage.info('详情功能开发中')
}

const resetInForm = () => {
  Object.assign(inForm, {
    part_id: null,
    quantity: 1,
    transaction_type: 'purchase',
    related_order_id: null,
    location: '',
    remark: ''
  })
  inFormRef.value?.resetFields()
}

const resetOutForm = () => {
  Object.assign(outForm, {
    part_id: null,
    quantity: 1,
    transaction_type: 'usage',
    receiver_name: '',
    remark: '',
    maxQuantity: 0
  })
  outFormRef.value?.resetFields()
}

const handleInSubmit = async () => {
  if (!inFormRef.value) return
  
  await inFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await transactionApi.in(inForm)
        ElMessage.success('入库成功')
        inDialogVisible.value = false
        resetInForm()
        loadData()
      } catch (error) {
        ElMessage.error(error.message || '入库失败')
      }
    }
  })
}

const handleOutSubmit = async () => {
  if (!outFormRef.value) return
  
  await outFormRef.value.validate(async (valid) => {
    if (valid) {
      if (outForm.quantity > outForm.maxQuantity) {
        ElMessage.warning('出库数量不能超过当前库存')
        return
      }
      try {
        await transactionApi.out({
          ...outForm,
          receiver_id: null // 可以根据receiver_name查找用户ID
        })
        ElMessage.success('出库成功')
        outDialogVisible.value = false
        resetOutForm()
        loadData()
      } catch (error) {
        ElMessage.error(error.message || '出库失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.transactions {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 20px;
}
</style>

