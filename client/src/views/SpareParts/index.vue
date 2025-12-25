<template>
  <div class="spare-parts">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>备件管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增备件
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="编码/名称/型号" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category_id" placeholder="请选择" clearable style="width: 200px">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
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
        <el-table-column prop="model" label="型号" width="150" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="equipment_name" label="所属设备" width="150" />
        <el-table-column prop="quantity" label="当前库存" width="100" />
        <el-table-column prop="safe_quantity" label="安全库存" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
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
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="备件编码" prop="code">
          <el-input v-model="form.code" :disabled="form.id" />
          <el-checkbox v-model="form.auto_code" style="margin-left: 10px">自动生成</el-checkbox>
        </el-form-item>
        <el-form-item label="备件名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="分类" prop="category_id">
          <el-select v-model="form.category_id" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="item in categoryOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="form.model" />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="form.specification" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="form.unit" />
        </el-form-item>
        <el-form-item label="所属设备">
          <el-input v-model="form.equipment_name" />
        </el-form-item>
        <el-form-item label="图片">
          <el-input v-model="form.image_url" placeholder="图片URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { sparePartApi, categoryApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const categoryOptions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增备件')
const formRef = ref<FormInstance>()

const searchForm = reactive({
  keyword: '',
  category_id: null
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  id: null,
  code: '',
  name: '',
  category_id: null,
  model: '',
  specification: '',
  unit: '',
  equipment_name: '',
  image_url: '',
  auto_code: false
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入备件名称', trigger: 'blur' }],
  category_id: [{ required: true, message: '请选择分类', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await sparePartApi.getList({
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

const loadCategories = async () => {
  try {
    const res = await categoryApi.getList()
    categoryOptions.value = res.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category_id = null
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增备件'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑备件'
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该备件吗？', '提示', {
      type: 'warning'
    })
    await sparePartApi.delete(row.id)
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
    code: '',
    name: '',
    category_id: null,
    model: '',
    specification: '',
    unit: '',
    equipment_name: '',
    image_url: '',
    auto_code: false
  })
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          await sparePartApi.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await sparePartApi.create(form)
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
  loadCategories()
})
</script>

<style scoped>
.spare-parts {
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

