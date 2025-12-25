<template>
  <div class="roles">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增角色
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="name" label="角色名称" width="150" />
        <el-table-column prop="description" label="角色描述" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      @close="resetForm"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="角色描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="权限配置">
          <el-tree
            ref="treeRef"
            :data="permissionTree"
            show-checkbox
            node-key="key"
            :default-checked-keys="form.permissions"
            :props="{ children: 'children', label: 'label' }"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { roleApi } from '@/api'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增角色')
const formRef = ref(null)
const treeRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  description: '',
  permissions: {}
})

const rules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }]
}

const permissionTree = [
  {
    label: '备件管理',
    key: 'sparePart',
    children: [
      { label: '查看', key: 'sparePart:view' },
      { label: '创建', key: 'sparePart:create' },
      { label: '编辑', key: 'sparePart:update' },
      { label: '删除', key: 'sparePart:delete' }
    ]
  },
  {
    label: '库存管理',
    key: 'inventory',
    children: [
      { label: '查看', key: 'inventory:view' },
      { label: '盘点', key: 'inventory:check' },
      { label: '导出', key: 'inventory:export' }
    ]
  },
  {
    label: '采购管理',
    key: 'purchase',
    children: [
      { label: '查看', key: 'purchase:view' },
      { label: '创建', key: 'purchase:create' },
      { label: '审批', key: 'purchase:approve' }
    ]
  },
  {
    label: '供应商管理',
    key: 'supplier',
    children: [
      { label: '查看', key: 'supplier:view' },
      { label: '创建', key: 'supplier:create' },
      { label: '编辑', key: 'supplier:update' },
      { label: '删除', key: 'supplier:delete' }
    ]
  },
  {
    label: '出入库管理',
    key: 'transaction',
    children: [
      { label: '查看', key: 'transaction:view' },
      { label: '入库', key: 'transaction:in' },
      { label: '出库', key: 'transaction:out' }
    ]
  },
  {
    label: '报表统计',
    key: 'report',
    children: [
      { label: '查看', key: 'report:view' },
      { label: '导出', key: 'report:export' }
    ]
  }
]

const loadData = async () => {
  loading.value = true
  try {
    const res = await roleApi.getList()
    tableData.value = res.data
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增角色'
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑角色'
  Object.assign(form, {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions: row.permissions ? JSON.parse(row.permissions) : {}
  })
  
  // 设置权限树选中状态
  if (treeRef.value) {
    const checkedKeys = []
    const flattenPermissions = (perms, prefix = '') => {
      Object.keys(perms).forEach(key => {
        const fullKey = prefix ? `${prefix}:${key}` : key
        if (typeof perms[key] === 'object') {
          flattenPermissions(perms[key], fullKey)
        } else if (perms[key] === true || (Array.isArray(perms[key]) && perms[key].includes('all'))) {
          checkedKeys.push(fullKey)
        }
      })
    }
    flattenPermissions(form.permissions)
    treeRef.value.setCheckedKeys(checkedKeys)
  }
  
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该角色吗？', '提示', {
      type: 'warning'
    })
    await roleApi.delete(row.id)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    description: '',
    permissions: {}
  })
  if (treeRef.value) {
    treeRef.value.setCheckedKeys([])
  }
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        // 获取选中的权限
        const checkedKeys = treeRef.value.getCheckedKeys()
        const permissions = {}
        
        // 构建权限对象
        checkedKeys.forEach(key => {
          const parts = key.split(':')
          if (parts.length === 1) {
            permissions[parts[0]] = true
          } else {
            const module = parts[0]
            const action = parts[1]
            if (!permissions[module]) {
              permissions[module] = []
            }
            if (Array.isArray(permissions[module])) {
              permissions[module].push(action)
            }
          }
        })
        
        const submitData = {
          name: form.name,
          description: form.description,
          permissions: permissions
        }
        
        if (form.id) {
          await roleApi.update(form.id, submitData)
          ElMessage.success('更新成功')
        } else {
          await roleApi.create(submitData)
          ElMessage.success('创建成功')
        }
        dialogVisible.value = false
        loadData()
      } catch (error) {
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
.roles {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>

