<template>
  <div class="inventory">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存管理</span>
          <div>
            <el-button type="warning" @click="handleCheck">
              <el-icon><Edit /></el-icon>
              库存盘点
            </el-button>
            <el-button type="danger" @click="loadLowStock">
              <el-icon><Warning /></el-icon>
              低库存预警
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="编码/名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="searchForm.low_stock">仅显示低库存</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="code" label="备件编码" width="150" />
        <el-table-column prop="name" label="备件名称" />
        <el-table-column prop="category_name" label="分类" width="120" />
        <el-table-column prop="quantity" label="当前库存" width="100">
          <template #default="{ row }">
            <span :style="{ color: row.is_low_stock ? '#F56C6C' : '' }">
              {{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="safe_quantity" label="安全库存" width="100" />
        <el-table-column prop="location" label="存放位置" width="150" />
        <el-table-column prop="last_check_time" label="最近盘点时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">设置</el-button>
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

    <el-dialog v-model="dialogVisible" title="库存设置" width="500px" @close="resetForm">
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="备件名称">
          <el-input v-model="form.part_name" disabled />
        </el-form-item>
        <el-form-item label="安全库存">
          <el-input-number v-model="form.safe_quantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="form.location" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="checkDialogVisible" title="库存盘点" width="500px" @close="resetCheckForm">
      <el-form ref="checkFormRef" :model="checkForm" label-width="100px">
        <el-form-item label="备件">
          <el-select
            v-model="checkForm.part_id"
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
        <el-form-item label="当前库存">
          <el-input-number v-model="checkForm.current_quantity" disabled style="width: 100%" />
        </el-form-item>
        <el-form-item label="实际数量" prop="actual_quantity">
          <el-input-number v-model="checkForm.actual_quantity" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="存放位置">
          <el-input v-model="checkForm.location" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="checkDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCheckSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import { Edit, Warning } from '@element-plus/icons-vue'
import { inventoryApi, sparePartApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const partOptions = ref([])
const dialogVisible = ref(false)
const checkDialogVisible = ref(false)
const formRef = ref<FormInstance>()
const checkFormRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  low_stock: false
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  part_name: '',
  safe_quantity: 0,
  location: ''
})

const checkForm = reactive({
  part_id: null,
  current_quantity: 0,
  actual_quantity: 0,
  location: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await inventoryApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      low_stock: searchForm.low_stock ? 'true' : ''
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

const loadLowStock = () => {
  searchForm.low_stock = true
  loadData()
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.low_stock = false
  loadData()
}

const handleEdit = (row: any) => {
  form.id = row.id
  form.part_name = row.name
  form.safe_quantity = row.safe_quantity
  form.location = row.location || ''
  dialogVisible.value = true
}

const handleCheck = () => {
  checkDialogVisible.value = true
  loadParts()
}

const handlePartChange = async (partId: number) => {
  const part = partOptions.value.find((p: any) => p.id === partId)
  if (part) {
    checkForm.current_quantity = part.quantity || 0
    checkForm.location = part.location || ''
  }
}

const handleSubmit = async () => {
  try {
    await inventoryApi.update(form.id, {
      safe_quantity: form.safe_quantity,
      location: form.location
    })
    ElMessage.success('更新成功')
    dialogVisible.value = false
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '更新失败')
  }
}

const handleCheckSubmit = async () => {
  if (!checkForm.part_id || checkForm.actual_quantity === null) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    await inventoryApi.check({
      part_id: checkForm.part_id,
      actual_quantity: checkForm.actual_quantity,
      location: checkForm.location
    })
    ElMessage.success('盘点成功')
    checkDialogVisible.value = false
    resetCheckForm()
    loadData()
  } catch (error: any) {
    ElMessage.error(error.message || '盘点失败')
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    part_name: '',
    safe_quantity: 0,
    location: ''
  })
}

const resetCheckForm = () => {
  Object.assign(checkForm, {
    part_id: null,
    current_quantity: 0,
    actual_quantity: 0,
    location: ''
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.inventory {
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

