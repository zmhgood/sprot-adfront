<template>
  <div class="families-page">
    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="家庭名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入家庭名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 家庭列表 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <span>家庭列表</span>
      </template>

      <el-table :data="families" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="家庭名称" min-width="150" />
        <el-table-column prop="invite_code" label="邀请码" width="120" />
        <el-table-column label="成员数" width="100">
          <template #default="{ row }">
            {{ row.members ? row.members.length : 0 }}人
          </template>
        </el-table-column>
        <el-table-column label="创建者" width="120">
          <template #default="{ row }">
            {{ getCreatorName(row) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleViewDetail(row)">查看详情</el-button>
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
        @size-change="loadFamilies"
        @current-change="loadFamilies"
      />
    </el-card>

    <!-- 家庭详情弹窗 -->
    <el-dialog v-model="detailVisible" title="家庭详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="家庭ID">{{ currentFamily.id }}</el-descriptions-item>
        <el-descriptions-item label="家庭名称">{{ currentFamily.name }}</el-descriptions-item>
        <el-descriptions-item label="邀请码">{{ currentFamily.invite_code }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTime(currentFamily.created_at) }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>家庭成员</el-divider>
      
      <el-table :data="currentFamily.members || []" max-height="300">
        <el-table-column label="头像" width="70">
          <template #default="{ row }">
            <el-avatar :size="40" :src="row.user?.avatar_url">
              <el-icon><User /></el-icon>
            </el-avatar>
          </template>
        </el-table-column>
        <el-table-column label="昵称">
          <template #default="{ row }">
            {{ row.user?.nick_name || '未设置' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
              {{ row.role === 'admin' ? '管理员' : '成员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="加入时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.joined_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import { getFamilies, getFamilyDetail } from '@/api'

const loading = ref(false)
const detailVisible = ref(false)
const families = ref([])
const currentFamily = ref({})

const searchForm = reactive({
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

const getCreatorName = (family) => {
  if (!family.members) return '-'
  const creator = family.members.find(m => m.role === 'admin')
  return creator?.user?.nick_name || '-'
}

const loadFamilies = async () => {
  loading.value = true
  try {
    const res = await getFamilies({
      page: pagination.page,
      page_size: pagination.pageSize
    })
    families.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    console.error('加载家庭列表失败:', error)
    families.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadFamilies()
}

const handleReset = () => {
  searchForm.keyword = ''
  handleSearch()
}

const handleViewDetail = async (row) => {
  try {
    const res = await getFamilyDetail(row.id)
    currentFamily.value = res.data || row
    detailVisible.value = true
  } catch (error) {
    console.error('获取家庭详情失败:', error)
    currentFamily.value = row
    detailVisible.value = true
  }
}

onMounted(() => {
  loadFamilies()
})
</script>

<style lang="scss" scoped>
.families-page {
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>
