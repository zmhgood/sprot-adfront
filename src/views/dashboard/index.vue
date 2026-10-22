<template>
  <div class="dashboard" v-loading="loading">
    <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" show-icon class="load-error">
      <el-button link type="primary" :disabled="loading" @click="loadStats">重试</el-button>
    </el-alert>
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="28"><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsLoaded ? stats.userCount : '—' }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="28"><Collection /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsLoaded ? stats.exerciseCount : '—' }}</div>
              <div class="stat-label">锻炼动作</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="28"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsLoaded ? stats.commentCount : '—' }}</div>
              <div class="stat-label">评论数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="28"><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ statsLoaded ? stats.todayRecordCount : '—' }}</div>
              <div class="stat-label">今日锻炼次数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="analysis-toolbar">
      <div><h3>锻炼统计</h3><p>{{ statsLoaded ? `${stats.startDate} 至 ${stats.endDate}（北京时间，含今天）` : '按北京时间统计，包含今天' }}</p></div>
      <el-radio-group v-model="selectedDays" :disabled="loading" aria-label="统计时间范围" @change="loadStats">
        <el-radio-button :value="7">最近7天</el-radio-button>
        <el-radio-button :value="30">最近30天</el-radio-button>
      </el-radio-group>
    </div>
    <el-row :gutter="20" class="charts-row">
      <el-col :xs="24" :md="16">
        <el-card shadow="hover">
          <template #header><span>每日锻炼人数</span><p class="metric-description">当天至少完成一组的用户数，同一人每天只计一次。</p></template>
          <ActivityTrend v-if="statsLoaded" :data="stats.dailyActivity" />
          <div v-else class="chart-placeholder">{{ loading ? '正在加载统计…' : '统计尚未加载' }}</div>
        </el-card>
      </el-col>
      <el-col :xs="24" :md="8">
        <el-card shadow="hover">
          <template #header><span>热门动作榜</span><p class="metric-description">按完整完成次数排序，展示前10名。</p></template>
          <div class="hot-exercises" v-if="statsLoaded">
            <div v-for="(item, index) in stats.hotExercises" :key="item.exerciseId" class="hot-item">
              <span class="rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</span>
              <span class="name">{{ item.name }}</span>
              <span class="count">{{ item.count }}次</span>
            </div>
            <el-empty v-if="stats.hotExercises.length === 0" description="该时段暂无完整完成的动作" />
            <p class="metric-description">同一人、同一天、同一计划的同一动作全部完成计1次，重复提交不增加次数。</p>
          </div>
          <div v-else class="chart-placeholder">{{ loading ? '正在加载统计…' : '统计尚未加载' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <template v-if="statsLoaded">
      <el-row :gutter="20" class="engagement-row">
        <el-col :xs="24" :md="12"><ActivationCard :metric="stats.engagement.activation" /></el-col>
        <el-col :xs="24" :md="12"><WeeklyExerciseDays :data="stats.engagement.weeklyExerciseDays" /></el-col>
      </el-row>
      <el-row :gutter="20" class="engagement-row">
        <el-col :xs="24" :md="12"><WeeklyRetention :data="stats.engagement.weeklyRetention" /></el-col>
        <el-col :xs="24" :md="12">
          <el-card shadow="hover" class="family-card">
            <template #header><div class="family-title"><span>活跃家庭趋势</span><strong>{{ stats.engagement.families.activeCount }} 个期间去重家庭</strong></div></template>
            <p class="metric-description">当天至少完成一组的家庭数；期间去重，不累加每日家庭数。</p>
            <ActivityTrend :data="stats.engagement.families.daily" value-key="familyCount" series-name="活跃家庭" unit="个" axis-name="家庭数" zero-message="该时段暂无活跃家庭，每日家庭数均为0。" />
          </el-card>
        </el-col>
      </el-row>
    </template>

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
import dayjs from 'dayjs'
import { getDashboardStats } from '@/api'
import { validateDashboard } from '@/utils/dashboard'
import ActivityTrend from './ActivityTrend.vue'
import ActivationCard from './ActivationCard.vue'
import WeeklyExerciseDays from './WeeklyExerciseDays.vue'
import WeeklyRetention from './WeeklyRetention.vue'

const stats = ref({ userCount: 0, exerciseCount: 0, commentCount: 0, todayRecordCount: 0, dailyActivity: [], hotExercises: [] })
const recentComments = ref([])
const selectedDays = ref(7), loading = ref(false), statsLoaded = ref(false), loadError = ref('')
const formatTime = time => dayjs(time).format('YYYY-MM-DD HH:mm')

async function loadStats() {
  if (loading.value) return
  loading.value = true; loadError.value = ''
  const requestedDays = selectedDays.value
  try {
    const response = await getDashboardStats({ days: requestedDays })
    const data = validateDashboard(response.data, requestedDays)
    stats.value = data
    recentComments.value = Array.isArray(data.recentComments) ? data.recentComments : []
    statsLoaded.value = true
  } catch (_) {
    loadError.value = statsLoaded.value ? '统计加载失败，已保留上次成功的数据，请重试。' : '统计加载失败，请重试。'
    if (statsLoaded.value) selectedDays.value = stats.value.days
  } finally { loading.value = false }
}
onMounted(loadStats)
</script>

<style lang="scss" scoped>
.dashboard {
  .load-error { margin-bottom: 20px; }
  .analysis-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
  .analysis-toolbar h3 { margin: 0 0 6px; font-size: 18px; }
  .analysis-toolbar p, .metric-description { margin: 6px 0 0; color: #64748b; font-size: 13px; line-height: 1.6; }
  .chart-placeholder { height: 300px; display: grid; place-items: center; color: #64748b; }
  .stat-cards {
    margin-bottom: 20px;
    .el-col { margin-bottom: 12px; }
  }
  
  .stat-card {
    display: flex;
    align-items: center;
    
    .stat-icon {
      flex-shrink: 0;
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }
    
    .stat-content {
      min-width: 0;
      margin-left: 12px;
      
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
    
    > .el-col { margin-bottom: 20px; min-width: 0; }
    
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
          flex-shrink: 0;
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
          min-width: 0;
          overflow-wrap: anywhere;
          margin: 0 12px;
          color: #333;
        }
        
        .count {
          flex-shrink: 0;
          white-space: nowrap;
          color: #999;
          font-size: 14px;
        }
      }
    }
  }
  .engagement-row { margin-bottom: 20px; }
  .engagement-row > .el-col { margin-bottom: 20px; min-width: 0; }
  .family-title { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; }
  .family-title strong { color: #176B73; font-size: 14px; }
}
@media (max-width: 600px) {
  .dashboard .analysis-toolbar .el-radio-group { width: 100%; flex-wrap: nowrap; }
  .dashboard .analysis-toolbar :deep(.el-radio-button) { min-width: 0; flex: 1; }
  .dashboard .analysis-toolbar :deep(.el-radio-button__inner) { width: 100%; box-sizing: border-box; padding: 8px 5px; font-size: 12px; }
  .dashboard .stat-card .stat-icon { display: none; }
  .dashboard .stat-card .stat-content { margin-left: 0; }
}
</style>
