<template>
  <div class="purchase-orders">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>采购管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增采购订单
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="订单号/备件/供应商" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择" clearable style="width: 150px">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已审批" value="approved" />
            <el-option label="已下单" value="ordered" />
            <el-option label="已发货" value="shipped" />
            <el-option label="已入库" value="received" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="order_no" label="订单号" width="150" />
        <el-table-column prop="part_name" label="备件名称" />
        <el-table-column prop="supplier_name" label="供应商" width="150" />
        <el-table-column prop="quantity" label="数量" width="80" />
        <el-table-column prop="unit_price" label="单价" width="100" />
        <el-table-column prop="total_amount" label="总金额" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button
              v-if="row.status === 'draft' || row.status === 'pending'"
              link
              type="primary"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="row.status === 'pending'"
              link
              type="success"
              @click="handleApprove(row)"
            >
              审批
            </el-button>
            <el-button
              v-if="row.status === 'draft'"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
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
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="备件" prop="part_id">
          <el-select
            v-model="form.part_id"
            placeholder="请选择备件"
            filterable
            style="width: 100%"
            @change="handlePartChange"
          >
            <el-option
              v-for="item in partOptions"
              :key="item.id"
              :label="`${item.code} - ${item.name}`"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="供应商" prop="supplier_id">
          <el-select v-model="form.supplier_id" placeholder="请选择供应商" filterable style="width: 100%">
            <el-option
              v-for="item in supplierOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="form.quantity" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单价">
          <el-input-number v-model="form.unit_price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="总金额">
          <el-input-number
            :model-value="form.quantity * (form.unit_price || 0)"
            disabled
            :precision="2"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="订单详情" width="700px">
      <el-descriptions :column="2" border v-if="orderDetail">
        <el-descriptions-item label="订单号">{{ orderDetail.order_no }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(orderDetail.status)">
            {{ getStatusText(orderDetail.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备件编码">{{ orderDetail.part_code }}</el-descriptions-item>
        <el-descriptions-item label="备件名称">{{ orderDetail.part_name }}</el-descriptions-item>
        <el-descriptions-item label="型号">{{ orderDetail.model }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ orderDetail.unit }}</el-descriptions-item>
        <el-descriptions-item label="供应商">{{ orderDetail.supplier_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ orderDetail.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ orderDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ orderDetail.email }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ orderDetail.quantity }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ orderDetail.unit_price }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ orderDetail.total_amount }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ orderDetail.creator_name }}</el-descriptions-item>
        <el-descriptions-item label="审批人">{{ orderDetail.approver_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ orderDetail.created_at }}</el-descriptions-item>
        <el-descriptions-item label="审批时间">{{ orderDetail.approved_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ orderDetail.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { purchaseOrderApi, sparePartApi, supplierApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const partOptions = ref([])
const supplierOptions = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('新增采购订单')
const orderDetail = ref(null)
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  part_id: null,
  supplier_id: null,
  quantity: 1,
  unit_price: 0,
  remark: ''
})

const rules: FormRules = {
  part_id: [{ required: true, message: '请选择备件', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }]
}

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

const getStatusType = (status: string) => {
  const map: any = {
    draft: 'info',
    pending: 'warning',
    approved: 'success',
    ordered: '',
    shipped: '',
    received: 'success',
    cancelled: 'danger'
  }
  return map[status] || ''
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await purchaseOrderApi.getList({
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

const loadSuppliers = async () => {
  try {
    const res = await supplierApi.getList({ page: 1, pageSize: 1000 })
    supplierOptions.value = res.data.list
  } catch (error) {
    console.error('加载供应商失败:', error)
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增采购订单'
  resetForm()
  loadParts()
  loadSuppliers()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑采购订单'
  Object.assign(form, {
    id: row.id,
    part_id: row.part_id,
    supplier_id: row.supplier_id,
    quantity: row.quantity,
    unit_price: row.unit_price,
    remark: row.remark || ''
  })
  loadParts()
  loadSuppliers()
  dialogVisible.value = true
}

const handleView = async (row: any) => {
  try {
    const res = await purchaseOrderApi.getDetail(row.id)
    orderDetail.value = res.data
    detailDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

const handleApprove = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要审批通过该订单吗？', '提示', {
      type: 'warning'
    })
    await purchaseOrderApi.update(row.id, { status: 'approved' })
    ElMessage.success('审批成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '审批失败')
    }
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该订单吗？', '提示', {
      type: 'warning'
    })
    await purchaseOrderApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const handlePartChange = () => {
  // 可以在这里加载备件的默认供应商等信息
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    part_id: null,
    supplier_id: null,
    quantity: 1,
    unit_price: 0,
    remark: ''
  })
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          await purchaseOrderApi.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await purchaseOrderApi.create(form)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
      } catch (error: any) {
        ElMessage.error(error.message || '操作失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.purchase-orders {
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

