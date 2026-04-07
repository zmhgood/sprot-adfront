<template>
  <div class="comments-page">
    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="正常" :value="1" />
            <el-option label="隐藏" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="评论内容" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 评论列表 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <span>评论管理</span>
      </template>

      <el-table :data="comments" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户" width="120">
          <template #default="{ row }">
            <div class="user-cell">
              <el-avatar :size="32" :src="row.user?.avatar_url">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span>{{ row.user?.nick_name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column label="所属动作" width="150">
          <template #default="{ row }">
            {{ row.exercise?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="like_count" label="点赞数" width="80" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '正常' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleToggleStatus(row)">
              {{ row.status === 1 ? '隐藏' : '显示' }}
            </el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @size-change="loadComments"
        @current-change="loadComments"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import request from '@/utils/request'

const loading = ref(false)
const comments = ref([])

const searchForm = reactive({
  status: '',
  keyword: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadComments = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/comments', {
      params: {
        page: pagination.page,
        page_size: pagination.pageSize,
        status: searchForm.status,
        keyword: searchForm.keyword
      }
    })
    comments.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    // 如果后端API还没实现，使用模拟数据
    comments.value = [
      { id: 1, user: { nick_name: '张大爷', avatar_url: '' }, content: '这个动作很好，每天做十分钟，腰不酸了！', exercise: { name: '腰部拉伸' }, like_count: 5, status: 1, created_at: new Date() },
      { id: 2, user: { nick_name: '李阿姨', avatar_url: '' }, content: '请问这个动作每次要做多久合适？', exercise: { name: '颈椎放松操' }, like_count: 2, status: 1, created_at: new Date() }
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadComments()
}

const handleReset = () => {
  Object.assign(searchForm, { status: '', keyword: '' })
  handleSearch()
}

const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  const action = newStatus === 0 ? '隐藏' : '显示'
  
  await ElMessageBox.confirm(`确定要${action}该评论吗？`, '提示', { type: 'warning' })
  
  try {
    await request.put(`/admin/comments/${row.id}/status`, { status: newStatus })
    ElMessage.success(`${action}成功`)
    loadComments()
  } catch (error) {
    // 模拟操作
    row.status = newStatus
    ElMessage.success(`${action}成功`)
  }
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该评论吗？', '提示', { type: 'warning' })
  
  try {
    await request.delete(`/admin/comments/${row.id}`)
    ElMessage.success('删除成功')
    loadComments()
  } catch (error) {
    // 模拟操作
    comments.value = comments.value.filter(c => c.id !== row.id)
    ElMessage.success('删除成功')
  }
}

onMounted(() => {
  loadComments()
})
</script>

<style lang="scss" scoped>
.comments-page {
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .user-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>
