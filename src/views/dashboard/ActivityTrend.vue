<template>
  <div>
    <div ref="container" class="activity-chart" role="img" :aria-label="chartLabel"></div>
    <p v-if="!data.some(day => day.userCount > 0)" class="zero-tip">该时段暂无锻炼记录，每日人数均为0。</p>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { init, use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, TooltipComponent, SVGRenderer])
const props = defineProps({ data: { type: Array, required: true } })
const container = ref(null)
const chartLabel = computed(() => '每日锻炼人数：' + props.data.map(day => `${day.date} ${day.userCount}人`).join('，'))
let chart, observer
function render() {
  chart?.setOption({
    animation: false,
    grid: { left: 12, right: 20, top: 28, bottom: 14, containLabel: true },
    tooltip: { trigger: 'axis', confine: true, valueFormatter: value => `${value}人` },
    xAxis: { type: 'category', boundaryGap: false, data: props.data.map(day => day.date), axisLabel: { formatter: value => value.slice(5), hideOverlap: true } },
    yAxis: { type: 'value', min: 0, minInterval: 1, name: '人数', nameGap: 12 },
    series: [{ name: '锻炼人数', type: 'line', data: props.data.map(day => day.userCount), symbolSize: 6, lineStyle: { color: '#176B73' }, itemStyle: { color: '#176B73' }, areaStyle: { color: '#EAF6F4' } }]
  }, true)
}
onMounted(() => {
  chart = init(container.value, null, { renderer: 'svg' })
  render()
  observer = new ResizeObserver(() => chart?.resize())
  observer.observe(container.value)
})
watch(() => props.data, render, { flush: 'post' })
onBeforeUnmount(() => { observer?.disconnect(); chart?.dispose(); chart = undefined })
</script>

<style scoped>
.activity-chart { width: 100%; height: 300px; min-width: 0; }
.zero-tip { color: #64748b; text-align: center; font-size: 13px; margin: 8px 0 0; }
</style>
