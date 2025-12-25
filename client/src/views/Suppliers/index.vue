<template>
  <div class="suppliers">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>供应商管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增供应商
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="名称/联系人/电话" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="name" label="供应商名称" />
        <el-table-column prop="contact_person" label="联系人" width="120" />
        <el-table-column prop="phone" label="电话" width="150" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="score" label="评分" width="100">
          <template #default="{ row }">
            <el-rate v-model="row.score" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '启用' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" @click="handleView(row)">详情</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="评分">
          <el-rate v-model="form.score" :max="5" />
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="detailDialogVisible" title="供应商详情" width="600px">
      <el-descriptions :column="2" border v-if="supplierDetail">
        <el-descriptions-item label="供应商名称">{{ supplierDetail.name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ supplierDetail.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="电话">{{ supplierDetail.phone }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ supplierDetail.email }}</el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ supplierDetail.address }}</el-descriptions-item>
        <el-descriptions-item label="评分">
          <el-rate v-model="supplierDetail.score" disabled show-score />
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="supplierDetail.status === 'active' ? 'success' : 'info'">
            {{ supplierDetail.status === 'active' ? '启用' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="订单数量">{{ supplierDetail.statistics?.order_count || 0 }}</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ supplierDetail.statistics?.total_amount || 0 }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { supplierApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const detailDialogVisible = ref(false)
const dialogTitle = ref('新增供应商')
const supplierDetail = ref(null)
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  name: '',
  contact_person: '',
  phone: '',
  email: '',
  address: '',
  score: 5,
  status: 'active'
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入供应商名称', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await supplierApi.getList({
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

const resetSearch = () => {
  searchForm.keyword = ''
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增供应商'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑供应商'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleView = async (row: any) => {
  try {
    const res = await supplierApi.getDetail(row.id)
    supplierDetail.value = res.data
    detailDialogVisible.value = true
  } catch (error: any) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该供应商吗？', '提示', {
      type: 'warning'
    })
    await supplierApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    score: 5,
    status: 'active'
  })
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          await supplierApi.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await supplierApi.create(form)
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
.suppliers {
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

