<template>
  <el-card shadow="hover" class="metric-card">
    <template #header><div class="metric-title">周锻炼留存</div></template>
    <div v-for="week in data" :key="week.returnStartDate" class="retention-row">
      <div class="retention-value">{{ week.rate === null ? '无样本' : `${(week.rate * 100).toFixed(1)}%` }}</div>
      <div v-if="week.rate !== null" class="retention-bar" role="img" :aria-label="`周锻炼留存比例 ${(week.rate * 100).toFixed(1)}%`">
        <div :style="{ width: `${week.rate * 100}%` }" />
      </div>
      <div class="retention-detail">{{ week.returnedUsers }} / {{ week.cohortUsers }} 人再次锻炼</div>
      <div class="retention-dates">前一周 {{ week.startDate }} – {{ week.endDate }}</div>
      <div class="retention-dates">后一周 {{ week.returnStartDate }} – {{ week.returnEndDate }}</div>
    </div>
    <p class="metric-note">仅比较相邻的完整周。前一周锻炼过的人，在后一周至少再锻炼1天的比例。</p>
  </el-card>
</template>

<script setup>
defineProps({ data: { type: Array, required: true } })
</script>

<style scoped>
.metric-card { height: 100%; }
.metric-title { font-weight: 600; }
.retention-row { padding: 10px 0; border-bottom: 1px solid #eef2f6; }
.retention-row:last-of-type { border-bottom: 0; }
.retention-value { color: #176B73; font-size: 21px; font-weight: 700; }
.retention-bar { height: 8px; margin: 6px 0; overflow: hidden; border-radius: 5px; background: #e8f0f0; }
.retention-bar div { height: 100%; border-radius: inherit; background: #42B8A5; }
.retention-detail, .retention-dates, .metric-note { color: #64748b; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.metric-note { margin: 10px 0 0; font-size: 13px; }
</style>
