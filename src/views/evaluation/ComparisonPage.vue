<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { useAppStore } from '@stores'

const chartRef = ref<HTMLDivElement>()
const appStore = useAppStore()
let chart: echarts.ECharts | null = null

/** 雷达图维度定义 */
const indicators = [
  { name: '准确率', max: 1 },
  { name: '响应速度', max: 1 },
  { name: '推理能力', max: 1 },
  { name: '创造性', max: 1 },
  { name: '鲁棒性', max: 1 },
]

const radarData = [
  { name: 'Claude Opus 4', value: [0.96, 0.88, 0.97, 0.94, 0.93], color: '#7C3AED' },
  { name: 'GPT-4o', value: [0.94, 0.91, 0.93, 0.95, 0.91], color: '#06B6D4' },
  { name: 'DeepSeek-V3', value: [0.91, 0.95, 0.92, 0.89, 0.90], color: '#22C55E' },
]

/** hex → rgba 转换，用于半透明填充 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getOptions(): echarts.EChartsOption {
  const isDark = appStore.theme === 'dark'
  return {
    radar: {
      indicator: indicators,
      center: ['50%', '50%'],
      radius: '65%',
      axisName: { color: isDark ? '#94A3B8' : '#6B7280', fontSize: 12 },
      splitArea: {
        areaStyle: { color: [isDark ? '#1A1A2E' : '#F9FAFB'] },
      },
    },
    tooltip: {
      backgroundColor: isDark ? '#1A1A2E' : '#FFFFFF',
      borderColor: isDark ? '#2D2D4A' : '#E5E7EB',
      textStyle: { color: isDark ? '#E2E8F0' : '#1F2937', fontSize: 13 },
    },
    series: radarData.map((agent) => ({
      name: agent.name,
      type: 'radar',
      data: [{ value: agent.value, name: agent.name }],
      lineStyle: { color: agent.color, width: 2 },
      areaStyle: { color: hexToRgba(agent.color, 0.15) },
      itemStyle: { color: agent.color },
      symbol: 'circle',
      symbolSize: 5,
    })),
  }
}

onMounted(() => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value, appStore.theme === 'dark' ? 'dark' : undefined)
  chart.setOption(getOptions())
  window.addEventListener('resize', () => chart?.resize())
})

watch(() => appStore.theme, () => {
  if (!chart) return
  chart.dispose()
  chart = echarts.init(chartRef.value!, appStore.theme === 'dark' ? 'dark' : undefined)
  chart.setOption(getOptions())
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold font-heading">对比分析</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">多Agent能力雷达图对比</p>
    </div>
    <div class="bento-card">
      <div ref="chartRef" class="h-[500px] w-full"></div>
    </div>
  </div>
</template>
