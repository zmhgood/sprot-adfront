<template>
  <div class="exercises-page">
    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="肌肉群组">
          <el-select v-model="searchForm.muscle_group_id" placeholder="全部" clearable style="width: 140px">
            <el-option label="全部" value="" />
            <el-option
              v-for="group in muscleGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="searchForm.difficulty" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="简单" value="简单" />
            <el-option label="中等" value="中等" />
            <el-option label="困难" value="困难" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="动作名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作栏 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span>锻炼动作列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增动作
          </el-button>
        </div>
      </template>

      <!-- 表格 -->
      <el-table :data="exercises" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="动作名称" width="150" />
        <el-table-column prop="muscle_group.name" label="肌肉群组" width="120" />
        <el-table-column prop="target_muscle" label="目标肌肉" width="150" show-overflow-tooltip />
        <el-table-column prop="difficulty" label="难度" width="80">
          <template #default="{ row }">
            <el-tag :type="getDifficultyType(row.difficulty)">{{ row.difficulty }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="时长(分钟)" width="100" />
        <el-table-column prop="sets" label="组数" width="80" />
        <el-table-column prop="calories" label="消耗热量" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadExercises"
        @current-change="loadExercises"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑动作' : '新增动作'"
      width="700px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="动作名称" prop="name">
              <el-input v-model="form.name" placeholder="请输入动作名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="肌肉群组" prop="muscle_group_id">
              <el-select v-model="form.muscle_group_id" placeholder="请选择">
                <el-option
                  v-for="group in muscleGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="目标肌肉" prop="target_muscle">
              <el-input v-model="form.target_muscle" placeholder="请输入目标肌肉" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="难度" prop="difficulty">
              <el-select v-model="form.difficulty" placeholder="请选择">
                <el-option label="简单" value="简单" />
                <el-option label="中等" value="中等" />
                <el-option label="困难" value="困难" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="时长(分钟)" prop="duration">
              <el-input-number v-model="form.duration" :min="1" :max="60" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="组数" prop="sets">
              <el-input-number v-model="form.sets" :min="1" :max="10" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="消耗热量" prop="calories">
              <el-input-number v-model="form.calories" :min="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="次数说明" prop="reps">
          <el-input v-model="form.reps" placeholder="如: 每组15-20次" />
        </el-form-item>
        <el-form-item label="动作描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入动作描述" />
        </el-form-item>
        <el-form-item label="封面图片" prop="image_url">
          <ImageUpload v-model="form.image_url" />
        </el-form-item>
        <el-form-item label="视频链接" prop="video_url">
          <VideoUpload v-model="form.video_url" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExercises, getMuscleGroups, createExercise, updateExercise, deleteExercise } from '@/api'
import ImageUpload from '@/components/ImageUpload.vue'
import VideoUpload from '@/components/VideoUpload.vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const exercises = ref([])
const muscleGroups = ref([])
const formRef = ref()

const searchForm = reactive({
  muscle_group_id: '',
  difficulty: '',
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
  muscle_group_id: null,
  target_muscle: '',
  difficulty: '',
  duration: 10,
  sets: 3,
  reps: '',
  calories: 0,
  description: '',
  image_url: '',
  video_url: ''
})

const rules = {
  name: [{ required: true, message: '请输入动作名称', trigger: 'blur' }],
  muscle_group_id: [{ required: true, message: '请选择肌肉群组', trigger: 'change' }],
  difficulty: [{ required: true, message: '请选择难度', trigger: 'change' }]
}

const getDifficultyType = (difficulty) => {
  const types = { '简单': 'success', '中等': 'warning', '困难': 'danger' }
  return types[difficulty] || 'info'
}

const loadMuscleGroups = async () => {
  try {
    const res = await getMuscleGroups()
    muscleGroups.value = res.data || []
  } catch (error) {
    console.error(error)
  }
}

const loadExercises = async () => {
  loading.value = true
  try {
    const res = await getExercises({
      page: pagination.page,
      page_size: pagination.pageSize,
      muscle_group_id: searchForm.muscle_group_id,
      difficulty: searchForm.difficulty,
      keyword: searchForm.keyword
    })
    exercises.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadExercises()
}

const handleReset = () => {
  Object.assign(searchForm, { muscle_group_id: '', difficulty: '', keyword: '' })
  handleSearch()
}

const resetForm = () => {
  Object.assign(form, {
    id: null,
    name: '',
    muscle_group_id: null,
    target_muscle: '',
    difficulty: '',
    duration: 10,
    sets: 3,
    reps: '',
    calories: 0,
    description: '',
    image_url: '',
    video_url: ''
  })
}

const handleAdd = () => {
  resetForm()
  isEdit.value = false
  dialogVisible.value = true
}

const handleEdit = (row) => {
  resetForm()
  isEdit.value = true
  // 只复制需要的字段，避免关联对象干扰
  const fields = ['id', 'name', 'muscle_group_id', 'target_muscle', 'difficulty', 'duration', 'sets', 'reps', 'calories', 'description', 'image_url', 'video_url']
  fields.forEach(field => {
    if (row[field] !== undefined) {
      form[field] = row[field]
    }
  })
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateExercise(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await createExercise(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadExercises()
  } catch (error) {
    console.error(error)
  } finally {
    submitting.value = false
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该动作吗？', '提示', { type: 'warning' })
  try {
    await deleteExercise(row.id)
    ElMessage.success('删除成功')
    loadExercises()
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  loadMuscleGroups()
  loadExercises()
})
</script>

<style lang="scss" scoped>
.exercises-page {
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>
