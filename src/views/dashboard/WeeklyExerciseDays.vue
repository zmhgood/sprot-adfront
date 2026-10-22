<template>
  <el-card shadow="hover" class="metric-card">
    <template #header><div class="metric-title">每周锻炼天数分布</div></template>
    <div v-for="week in data" :key="week.startDate" class="week-row">
      <div class="week-label">{{ week.startDate }} – {{ week.endDate }} <span>{{ week.activeUsers }} 位活跃用户</span></div>
      <div class="stack" role="img" :aria-label="barLabel(week)">
        <div v-for="bin in bins" :key="bin.key" :style="{ width: `${week.activeUsers ? week[bin.key] / week.activeUsers * 100 : 0}%`, background: bin.color }" :title="`${bin.label}：${week[bin.key]}人`" />
      </div>
      <div class="legend">
        <span v-for="bin in bins" :key="bin.key"><i :style="{ background: bin.color }" />{{ bin.label }}：{{ week[bin.key] }}</span>
      </div>
    </div>
    <p class="metric-note">仅统计已结束的周一至周日。当天至少完成一组算1个锻炼日；同一人跨计划和家庭去重，零锻炼日不计入。</p>
  </el-card>
</template>

<script setup>
defineProps({ data: { type: Array, required: true } })
const bins = [
  { key: 'oneToTwoDays', label: '1–2天', color: '#9BD5CB' },
  { key: 'threeToFourDays', label: '3–4天', color: '#42B8A5' },
  { key: 'fiveToSevenDays', label: '5–7天', color: '#176B73' }
]
const barLabel = week => `${week.startDate}至${week.endDate}，1至2天${week.oneToTwoDays}人，3至4天${week.threeToFourDays}人，5至7天${week.fiveToSevenDays}人`
</script>

<style scoped>
.metric-card { height: 100%; }
.metric-title { font-weight: 600; }
.week-row + .week-row { margin-top: 18px; }
.week-label { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: #334155; }
.week-label span { flex-shrink: 0; color: #64748b; }
.stack { display: flex; width: 100%; height: 14px; margin: 8px 0; overflow: hidden; border-radius: 8px; background: #f1f5f9; }
.legend { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px 12px; color: #64748b; font-size: 12px; }
.legend span { white-space: nowrap; }
.legend i { display: inline-block; width: 8px; height: 8px; margin-right: 5px; border-radius: 50%; }
.metric-note { color: #64748b; font-size: 13px; line-height: 1.6; margin: 12px 0 0; }
@media (max-width: 480px) { .week-label { display: block; } .week-label span { display: block; margin-top: 3px; } }
</style>
