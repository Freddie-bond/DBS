<template>
  <div class="users">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>

      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="用户名/姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="real_name" label="真实姓名" width="120" />
        <el-table-column prop="role_name" label="角色" width="120" />
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'danger'">
              {{ row.is_active ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
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
      width="500px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!form.id">
          <el-input v-model="form.password" type="password" />
        </el-form-item>
        <el-form-item label="新密码" v-else>
          <el-input v-model="form.password" type="password" placeholder="留空则不修改" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="form.real_name" />
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="form.role_id" placeholder="请选择" style="width: 100%">
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.is_active">
            <el-radio :label="true">启用</el-radio>
            <el-radio :label="false">禁用</el-radio>
          </el-radio-group>
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
import { userApi, roleApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const roleOptions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增用户')
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
  username: '',
  password: '',
  real_name: '',
  role_id: null,
  is_active: true
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur', validator: (rule, value, callback) => {
      if (!form.id && !value) {
        callback(new Error('请输入密码'))
      } else {
        callback()
      }
    }}
  ],
  role_id: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await userApi.getList({
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

const loadRoles = async () => {
  try {
    const res = await roleApi.getList()
    roleOptions.value = res.data
  } catch (error) {
    console.error('加载角色失败:', error)
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增用户'
  resetForm()
  loadRoles()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  dialogTitle.value = '编辑用户'
  Object.assign(form, {
    id: row.id,
    username: row.username,
    password: '',
    real_name: row.real_name,
    role_id: row.role_id,
    is_active: row.is_active
  })
  loadRoles()
  dialogVisible.value = true
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      type: 'warning'
    })
    await userApi.delete(row.id)
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
    username: '',
    password: '',
    real_name: '',
    role_id: null,
    is_active: true
  })
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const submitData = { ...form }
        if (form.id && !submitData.password) {
          delete submitData.password
        }
        if (form.id) {
          await userApi.update(form.id, submitData)
          ElMessage.success('更新成功')
        } else {
          await userApi.create(submitData)
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
.users {
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

