<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="28"><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.userCount || 0 }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="28"><Collection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.exerciseCount || 0 }}</div>
              <div class="stat-label">锻炼动作</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="28"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.commentCount || 0 }}</div>
              <div class="stat-label">评论数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="28"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.todayRecordCount || 0 }}</div>
              <div class="stat-label">今日锻炼次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span>用户活跃趋势</span>
          </template>
          <div ref="chartRef" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>热门锻炼动作</span>
          </template>
          <div class="hot-exercises">
            <div v-for="(item, index) in hotExercises" :key="index" class="hot-item">
              <span class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
              <span class="name">{{ item.name }}</span>
              <span class="count">{{ item.count }}次</span>
            </div>
            <el-empty v-if="hotExercises.length === 0" description="暂无数据" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近评论 -->
    <el-card shadow="hover" class="recent-comments">
      <template #header>
        <span>最近评论</span>
      </template>
      <el-table :data="recentComments" stripe>
        <el-table-column prop="user.nick_name" label="用户" width="120" />
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop="exercise_name" label="所属动作" width="150" />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import request from '@/utils/request'

const chartRef = ref()
const stats = ref({
  userCount: 0,
  exerciseCount: 0,
  commentCount: 0,
  todayRecordCount: 0
})
const hotExercises = ref([])
const recentComments = ref([])

const formatTime = (time) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

const loadStats = async () => {
  try {
    // 获取统计数据
    const statsRes = await request.get('/admin/stats/dashboard')
    
    if (statsRes.data) {
      stats.value = {
        userCount: statsRes.data.userCount || 0,
        exerciseCount: statsRes.data.exerciseCount || 0,
        commentCount: statsRes.data.commentCount || 0,
        todayRecordCount: statsRes.data.todayRecordCount || 0
      }
      
      hotExercises.value = statsRes.data.hotExercises || []
      recentComments.value = statsRes.data.recentComments || []
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const initChart = () => {
  const chart = echarts.init(chartRef.value)
  
  const dates = []
  const values = []
  for (let i = 6; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
    values.push(Math.floor(Math.random() * 50) + 20)
  }
  
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates
    },
    yAxis: { type: 'value' },
    series: [{
      name: '活跃用户',
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.3 },
      data: values
    }]
  })
  
  window.addEventListener('resize', () => chart.resize())
}

onMounted(() => {
  loadStats()
  initChart()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-cards {
    margin-bottom: 20px;
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    
    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    .stat-content {
      margin-left: 16px;
      
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #333;
      }
      
      .stat-label {
        font-size: 14px;
        color: #999;
        margin-top: 4px;
      }
    }
  }
  
  .charts-row {
    margin-bottom: 20px;
    
    .chart-container {
      height: 300px;
    }
    
    .hot-exercises {
      .hot-item {
        display: flex;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .rank {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          background: #f0f0f0;
          color: #999;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          
          &.rank-1 { background: #FFD700; color: #fff; }
          &.rank-2 { background: #C0C0C0; color: #fff; }
          &.rank-3 { background: #CD7F32; color: #fff; }
        }
        
        .name {
          flex: 1;
          margin-left: 12px;
          color: #333;
        }
        
        .count {
          color: #999;
          font-size: 14px;
        }
      }
    }
  }
}
</style>
