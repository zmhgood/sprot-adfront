<template>
  <el-card shadow="hover" class="metric-card">
    <template #header><div class="metric-title">首次完成率</div></template>
    <div class="metric-value">{{ metric.rate === null ? '无样本' : `${(metric.rate * 100).toFixed(1)}%` }}</div>
    <div class="metric-detail">{{ metric.completedUsers }} / {{ metric.eligibleUsers }} 人完成</div>
    <p class="metric-note">注册日期：{{ metric.startDate }} 至 {{ metric.endDate }}；注册当天起7个自然日，已结束观察期内至少完成一次完整动作。</p>
  </el-card>
</template>

<script setup>
defineProps({ metric: { type: Object, required: true } })
</script>

<style scoped>
.metric-card { height: 100%; }
.metric-title { font-weight: 600; }
.metric-value { font-size: 28px; font-weight: 700; color: #176B73; }
.metric-detail, .metric-note { color: #64748b; font-size: 13px; line-height: 1.6; }
.metric-note { margin: 12px 0 0; }
</style>
