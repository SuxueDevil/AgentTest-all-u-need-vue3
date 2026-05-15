<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {
  Bot,
  ClipboardCheck,
  TrendingUp,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-vue-next'
import StatCard from '@components/common/StatCard.vue'
import TrendChart from './components/TrendChart.vue'
import RankingList from './components/RankingList.vue'
import ActivityFeed from './components/ActivityFeed.vue'
import type { DashboardStats } from '@types'

const now = ref(new Date())

let timer: ReturnType<typeof setInterval>
onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})
onUnmounted(() => clearInterval(timer))

const formatTime = (d: Date) => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `Data\nYear:${y} Month:${m} Day:${day}\n${h}:${min}:${s}`
}

const stats = ref<DashboardStats>({
  totalAgents: 0,
  activeEvals: 0,
  completedEvals: 0,
  avgScore: 0,
  trendData: [],
  agentRankings: [],
  evalActivity: [],
})

onMounted(async () => {
  // TODO: replace with real API call
  stats.value = {
    totalAgents: 24,
    activeEvals: 8,
    completedEvals: 156,
    avgScore: 0.874,
    trendData: generateTrendData(),
    agentRankings: generateRankings(),
    evalActivity: generateActivity(),
  }
})

// Mock data
function generateTrendData() {
  const data = []
  const now = new Date()
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    data.push({
      date: d.toISOString().slice(0, 10),
      avgScore: 0.82 + Math.random() * 0.12,
      evalCount: Math.floor(Math.random() * 20) + 5,
    })
  }
  return data
}

function generateRankings() {
  const names = ['GPT-4o', 'Claude Opus 4', 'Gemini Ultra', 'DeepSeek-V3', 'Qwen-Max', 'Claude Sonnet']
  return names.map((name, i) => ({
    rank: i + 1,
    agentId: String(i + 1),
    agentName: name,
    score: 0.95 - i * 0.04,
    trend: (['up', 'down', 'stable'] as const)[Math.floor(Math.random() * 3)],
  }))
}

function generateActivity() {
  return [
    { id: '1', agentName: 'Claude Opus 4', taskName: '推理能力评测', status: 'completed', timestamp: '2分钟前' },
    { id: '2', agentName: 'GPT-4o', taskName: '代码生成评测', status: 'running', timestamp: '5分钟前' },
    { id: '3', agentName: 'DeepSeek-V3', taskName: '工具调用评测', status: 'completed', timestamp: '12分钟前' },
    { id: '4', agentName: 'Gemini Ultra', taskName: '多语言翻译评测', status: 'failed', timestamp: '25分钟前' },
    { id: '5', agentName: 'Qwen-Max', taskName: '问答能力评测', status: 'completed', timestamp: '1小时前' },
  ]
}

const trendIcon = (t: string) => {
  if (t === 'up') return ArrowUp
  if (t === 'down') return ArrowDown
  return Minus
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page Title -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold font-heading">仪表盘</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Agent评测概览与实时数据</p>
      </div>
      <p
        class="text-xl text-gray-700 dark:text-gray-200 leading-snug whitespace-pre-line text-center"
        style="font-family: 'Great Vibes', cursive; text-shadow: 1px 1px 3px rgba(0,0,0,0.12), 1px 2px 6px rgba(0,0,0,0.06);"
      >
        {{ formatTime(now) }}
      </p>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Agent总数"
        :value="stats.totalAgents"
        trend="较上月 +3"
        trend-type="up"
        :icon="Bot"
      />
      <StatCard
        label="进行中评测"
        :value="stats.activeEvals"
        trend="实时运行中"
        trend-type="neutral"
        :icon="Zap"
      />
      <StatCard
        label="已完成评测"
        :value="stats.completedEvals"
        trend="较上周 +12%"
        trend-type="up"
        :icon="ClipboardCheck"
      />
      <StatCard
        label="平均得分"
        :value="(stats.avgScore * 100).toFixed(1) + '%'"
        trend="整体稳定"
        trend-type="up"
        :icon="TrendingUp"
      />
    </div>

    <!-- Bento Grid Main Content -->
    <div class="grid grid-cols-4 gap-4 auto-rows-[280px]">
      <!-- Trend Chart (2 cols x 1 row) -->
      <BentoCard title="评测趋势 (近30天)" :cols="2" :rows="1" no-overflow>
        <TrendChart :data="stats.trendData" />
      </BentoCard>

      <!-- Ranking (1 col x 1 row) -->
      <BentoCard title="Agent排行榜" :cols="1" :rows="1">
        <RankingList :rankings="stats.agentRankings" />
      </BentoCard>

      <!-- Activity Feed (1 col x 1 row) -->
      <BentoCard title="最近活动" :cols="1" :rows="1">
        <ActivityFeed :activities="stats.evalActivity" />
      </BentoCard>

      <!-- Quick Actions (2 cols x 1 row) -->
      <BentoCard title="快捷操作" :cols="2" :rows="1">
        <div class="grid grid-cols-3 gap-4">
          <button
            v-for="action in ['新建Agent', '开始评测', '查看报告', '对比分析', '管理数据集', '系统设置']"
            :key="action"
            class="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-ai-border bg-gray-100/80 dark:bg-ai-surface/50 p-4 text-sm text-gray-600 dark:text-gray-300 transition-all hover:border-ai-purple/50 dark:hover:border-ai-purple/30 hover:text-gray-900 dark:hover:text-white hover:bg-ai-purple/5"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-ai-purple/15">
              <Zap :size="18" class="text-ai-purple-light" />
            </div>
            {{ action }}
          </button>
        </div>
      </BentoCard>
    </div>
  </div>
</template>
