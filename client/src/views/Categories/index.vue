<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增分类
          </el-button>
        </div>
      </template>

      <el-tree
        :data="treeData"
        :props="{ children: 'children', label: 'name' }"
        default-expand-all
        :expand-on-click-node="false"
      >
        <template #default="{ node, data }">
          <div class="tree-node">
            <span>{{ node.label }}</span>
            <span class="node-actions">
              <el-button link type="primary" size="small" @click="handleAddChild(data)">添加子分类</el-button>
              <el-button link type="primary" size="small" @click="handleEdit(data)">编辑</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(data)">删除</el-button>
            </span>
          </div>
        </template>
      </el-tree>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="父分类">
          <el-select v-model="form.parent_id" placeholder="顶级分类" clearable style="width: 100%">
            <el-option
              v-for="item in parentOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="分类编码">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" />
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
import { categoryApi } from '@/api'

const treeData = ref([])
const parentOptions = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增分类')
const formRef = ref<FormInstance>()

const form = reactive({
  id: null,
  name: '',
  parent_id: 0,
  code: '',
  sort_order: 0
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

const loadData = async () => {
  try {
    const res = await categoryApi.getTree()
    treeData.value = res.data
    
    // 构建父分类选项（扁平化）
    const flattenCategories = (categories: any[], parentId = 0, level = 0) => {
      const result: any[] = []
      categories.forEach(cat => {
        if (cat.id !== form.id) {
          result.push({
            ...cat,
            name: '  '.repeat(level) + cat.name,
            level
          })
          if (cat.children && cat.children.length > 0) {
            result.push(...flattenCategories(cat.children, cat.id, level + 1))
          }
        }
      })
      return result
    }
    parentOptions.value = flattenCategories(res.data)
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const handleAdd = () => {
  dialogTitle.value = '新增分类'
  resetForm()
  dialogVisible.value = true
}

const handleAddChild = (data: any) => {
  dialogTitle.value = '新增子分类'
  resetForm()
  form.parent_id = data.id
  dialogVisible.value = true
}

const handleEdit = (data: any) => {
  dialogTitle.value = '编辑分类'
  Object.assign(form, data)
  dialogVisible.value = true
}

const handleDelete = async (data: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '提示', {
      type: 'warning'
    })
    await categoryApi.delete(data.id)
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
    parent_id: 0,
    code: '',
    sort_order: 0
  })
  formRef.value?.resetFields()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (form.id) {
          await categoryApi.update(form.id, form)
          ElMessage.success('更新成功')
        } else {
          await categoryApi.create(form)
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
.categories {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-actions {
  display: none;
}

.tree-node:hover .node-actions {
  display: block;
}
</style>

