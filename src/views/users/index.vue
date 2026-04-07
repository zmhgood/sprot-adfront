<template>
  <div class="users-page">
    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="昵称/手机号" clearable />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="searchForm.gender" placeholder="全部" clearable style="width: 120px">
            <el-option label="全部" value="" />
            <el-option label="男" :value="1" />
            <el-option label="女" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 用户列表 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <span>用户列表</span>
      </template>

      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="用户信息" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar_url">
                <el-icon><User /></el-icon>
              </el-avatar>
              <div class="user-detail">
                <div class="name">{{ row.nick_name || '未设置昵称' }}</div>
                <div class="phone">{{ row.phone || '未绑定手机' }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="gender" label="性别" width="80">
          <template #default="{ row }">
            {{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="health_status" label="健康状况" show-overflow-tooltip />
        <el-table-column prop="created_at" label="注册时间" width="180">
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
        @size-change="loadUsers"
        @current-change="loadUsers"
      />
    </el-card>

    <!-- 用户详情弹窗 -->
    <el-dialog v-model="detailVisible" title="用户详情" width="600px">
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户ID">{{ currentUser.id }}</el-descriptions-item>
        <el-descriptions-item label="昵称">{{ currentUser.nick_name || '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ currentUser.phone || '未绑定' }}</el-descriptions-item>
        <el-descriptions-item label="性别">{{ currentUser.gender === 1 ? '男' : currentUser.gender === 2 ? '女' : '未知' }}</el-descriptions-item>
        <el-descriptions-item label="年龄">{{ currentUser.age ? currentUser.age + ' 岁' : '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="身高">{{ currentUser.height ? currentUser.height + ' cm' : '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="体重">{{ currentUser.weight ? currentUser.weight + ' kg' : '未设置' }}</el-descriptions-item>
        <el-descriptions-item label="BMI">{{ calculateBMI(currentUser.height, currentUser.weight) }}</el-descriptions-item>
        <el-descriptions-item label="健康状况" :span="2">{{ currentUser.health_status || '未填写' }}</el-descriptions-item>
        <el-descriptions-item label="注册时间" :span="2">{{ formatTime(currentUser.created_at) }}</el-descriptions-item>
      </el-descriptions>
      
      <el-divider>运动统计</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="8">
          <el-statistic title="累计锻炼次数" :value="userStats.totalCount" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="累计锻炼时长" :value="userStats.totalDuration" suffix="分钟" />
        </el-col>
        <el-col :span="8">
          <el-statistic title="消耗热量" :value="userStats.totalCalories" suffix="千卡" />
        </el-col>
      </el-row>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import dayjs from 'dayjs'
import request from '@/utils/request'

const loading = ref(false)
const detailVisible = ref(false)
const users = ref([])
const currentUser = ref({})
const userStats = ref({ totalCount: 0, totalDuration: 0, totalCalories: 0 })

const searchForm = reactive({
  keyword: '',
  gender: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const calculateBMI = (height, weight) => {
  if (!height || !weight) return '未计算'
  const heightInMeter = height / 100
  const bmi = (weight / (heightInMeter * heightInMeter)).toFixed(1)
  let status = ''
  if (bmi < 18.5) status = '偏瘦'
  else if (bmi < 24) status = '正常'
  else if (bmi < 28) status = '偏胖'
  else status = '肥胖'
  return `${bmi} (${status})`
}

const loadUsers = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/users', {
      params: {
        page: pagination.page,
        page_size: pagination.pageSize,
        keyword: searchForm.keyword,
        gender: searchForm.gender
      }
    })
    users.value = res.data?.list || []
    pagination.total = res.data?.total || 0
  } catch (error) {
    // 如果后端API还没实现，使用模拟数据
    users.value = [
      { id: 1, nick_name: '张大爷', phone: '13800138001', gender: 1, age: 68, avatar_url: '', health_status: '腰椎间盘突出', created_at: new Date() },
      { id: 2, nick_name: '李阿姨', phone: '13800138002', gender: 2, age: 65, avatar_url: '', health_status: '颈椎病', created_at: new Date() }
    ]
    pagination.total = 2
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadUsers()
}

const handleReset = () => {
  Object.assign(searchForm, { keyword: '', gender: '' })
  handleSearch()
}

const handleViewDetail = async (row) => {
  currentUser.value = row
  detailVisible.value = true
  
  // 获取用户统计数据
  try {
    const res = await request.get(`/admin/users/${row.id}/stats`)
    userStats.value = res.data || { totalCount: 0, totalDuration: 0, totalCalories: 0 }
  } catch (error) {
    userStats.value = { totalCount: 0, totalDuration: 0, totalCalories: 0 }
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style lang="scss" scoped>
.users-page {
  .search-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .user-info {
      display: flex;
      align-items: center;
      
      .user-detail {
        margin-left: 12px;
        
        .name {
          font-weight: 500;
        }
        
        .phone {
          font-size: 12px;
          color: #999;
        }
      }
    }
    
    .pagination {
      margin-top: 20px;
      justify-content: flex-end;
    }
  }
}
</style>
