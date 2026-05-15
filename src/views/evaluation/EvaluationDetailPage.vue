<!-- 评测任务详情页 — 进度轮询 / 结果列表 / 维度得分 -->
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Play, Square, X } from 'lucide-vue-next'
import { useEvaluationStore } from '@stores'
import type { AgentResult } from '@types'
import StatusBadge from '@components/common/StatusBadge.vue'

const route = useRoute()
const router = useRouter()
const evalStore = useEvaluationStore()

/** 轮询定时器 */
let pollTimer: ReturnType<typeof setInterval> | null = null

const taskId = Number(route.params.id)

onMounted(async () => {
  await evalStore.fetchTaskDetail(taskId)
  const task = evalStore.currentTask
  // 已完成/已取消的任务自动加载结果，无需手动点"查看结果"
  if (task && (task.status === 'completed' || task.status === 'cancelled')) {
    evalStore.fetchResults(taskId)
  }
  startPollingIfRunning()
})

onUnmounted(() => {
  stopPolling()
})

/** 如果任务正在运行，启动 3s 轮询 */
function startPollingIfRunning() {
  const task = evalStore.currentTask
  if (task && task.status === 'running') {
    startPolling()
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    await evalStore.fetchProgress(taskId)
    if (evalStore.progress && evalStore.progress.status !== 'running') {
      stopPolling()
      // 完成后加载结果
      await evalStore.fetchResults(taskId)
      await evalStore.fetchTaskDetail(taskId)
    }
  }, 3000)
}

function stopPolling() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
}

async function loadResults() {
  await evalStore.fetchResults(taskId)
}

async function handleStart() {
  await evalStore.startTask(taskId)
  await evalStore.fetchTaskDetail(taskId)
  startPolling()
}

async function handleCancel() {
  await evalStore.cancelTask(taskId)
  await evalStore.fetchTaskDetail(taskId)
}

/** 进度百分比 */
const progressPercent = computed(() => {
  const t = evalStore.currentTask
  if (!t || t.questionCount === 0) return 0
  return Math.round((t.completedCount / t.questionCount) * 100)
})

// ==================== 进度动画 ====================

/** 动画显示的平滑进度值 */
const smoothProgress = ref(0)
let animFrameId = 0
let lastTarget = 0

/** easeOutCubic 曲线平滑过渡 */
function animateProgress(from: number, to: number) {
  if (animFrameId) cancelAnimationFrame(animFrameId)
  const duration = 900
  const startTime = performance.now()

  function step(now: number) {
    const t = Math.min((now - startTime) / duration, 1)
    smoothProgress.value = from + (to - from) * (1 - Math.pow(1 - t, 3))
    if (t < 1) {
      animFrameId = requestAnimationFrame(step)
    } else {
      smoothProgress.value = to
      animFrameId = 0
    }
  }
  animFrameId = requestAnimationFrame(step)
}

watch(progressPercent, (pct) => {
  if (smoothProgress.value === 0) {
    smoothProgress.value = pct
    lastTarget = pct
    return
  }
  lastTarget = pct
  animateProgress(smoothProgress.value, pct)
})

/** 结果按 overallScore 降序排列 */
const sortedResults = computed(() =>
  [...evalStore.results].sort((a, b) => b.overallScore - a.overallScore)
)
</script>

<template>
  <div class="space-y-6">
    <button class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white" @click="router.push('/evaluation')">
      <ArrowLeft :size="16" /> 返回列表
    </button>

    <div v-if="evalStore.currentTask" class="space-y-6">
      <!-- 基本信息 -->
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-2xl font-bold font-heading">{{ evalStore.currentTask.name }}</h1>
          <p class="text-sm text-gray-500 mt-1">{{ evalStore.currentTask.description }}</p>
          <div class="flex items-center gap-3 mt-2 text-sm text-gray-400">
            <span>{{ evalStore.currentTask.questionCount }} 题 / {{ evalStore.currentTask.agentIds.length }} Agent</span>
            <StatusBadge :status="evalStore.currentTask.status" type="task" />
          </div>
        </div>
        <div class="flex gap-2">
          <button v-if="evalStore.currentTask.status === 'pending'"
            class="btn-secondary text-sm" @click="handleStart">
            <Play :size="14" /> 启动评测
          </button>
          <button v-if="evalStore.currentTask.status === 'running'"
            class="btn-secondary text-sm text-yellow-600" @click="handleCancel">
            <Square :size="14" /> 取消
          </button>
          <button v-if="evalStore.currentTask.status === 'completed' || evalStore.currentTask.status === 'running'"
            class="btn-secondary text-sm" @click="loadResults">
            {{ evalStore.currentTask.status === 'running' ? '刷新结果' : '查看结果' }}
          </button>
        </div>
      </div>

      <!-- 进度条 -->
      <div v-if="evalStore.currentTask.status === 'running'" class="bento-card p-4 space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">评测进度</span>
          <span class="font-mono">{{ evalStore.currentTask.completedCount }} / {{ evalStore.currentTask.questionCount }}</span>
        </div>
        <div class="h-2 rounded-full bg-gray-200 dark:bg-ai-surface overflow-hidden">
          <div class="h-full rounded-full bg-ai-purple"
            :style="{ width: `${smoothProgress}%` }" />
        </div>
        <p class="text-xs text-right text-gray-400">{{ smoothProgress.toFixed(0) }}%</p>
      </div>

      <!-- 维度配置 -->
      <div class="bento-card p-4">
        <h3 class="text-sm font-semibold mb-2">评测维度</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="d in evalStore.currentTask.dimensions" :key="d.name"
            class="text-xs bg-gray-100 dark:bg-ai-surface px-3 py-1 rounded-full">
            {{ d.displayName }}（权重 {{ (d.weight * 100).toFixed(0) }}% / 阈值 {{ (d.threshold * 100).toFixed(0) }}%）
          </span>
        </div>
      </div>

      <!-- 结果列表 -->
      <div v-if="evalStore.results.length > 0" class="space-y-3">
        <h2 class="text-lg font-semibold font-heading">评测结果</h2>
        <div v-for="(r, i) in sortedResults" :key="r.agentId"
          class="bento-card-hover p-4 space-y-3"
        >
          <!-- Agent 摘要 -->
          <div class="flex items-center gap-4">
            <span class="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
              :class="i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 dark:bg-ai-surface text-gray-500'">
              #{{ i + 1 }}
            </span>
            <span class="flex-1 font-semibold text-base">{{ r.agentName }}</span>
            <div class="flex items-center gap-4">
              <span class="font-mono font-bold text-2xl" :class="r.passed ? 'text-green-500' : 'text-red-500'">
                {{ (r.overallScore * 100).toFixed(1) }}%
              </span>
              <span class="text-sm text-gray-400">{{ r.avgLatencyMs }}ms | {{ (r.totalTokens / 1000).toFixed(0) }}k tokens</span>
            </div>
            <span :class="r.passed ? 'badge-success' : 'badge-error'">
              {{ r.passed ? '通过' : '未通过' }}
            </span>
          </div>
          <!-- 维度得分 -->
          <div class="flex flex-wrap gap-2 pl-12">
            <span v-for="ds in r.dimensionScores" :key="ds.dimensionName"
              class="text-sm px-3 py-1 rounded-full font-medium"
              :class="ds.score >= 0.6 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'"
            >
              {{ ds.dimensionName }}: {{ (ds.score * 100).toFixed(0) }}%
            </span>
          </div>
          <!-- 逐题明细 -->
          <div v-if="r.items?.length" class="pl-8 space-y-3 border-l-2 border-gray-100 dark:border-gray-800">
            <h4 class="text-sm font-bold text-gray-500 uppercase tracking-wide">逐题明细</h4>
            <div v-for="item in r.items" :key="item.questionId"
              class="rounded-lg border border-gray-100 dark:border-gray-800 p-3 space-y-2 text-sm"
            >
              <!-- 题目 + 得分 -->
              <div class="flex items-center justify-between gap-4">
                <span class="font-semibold flex-1">{{ item.questionTitle }}</span>
                <span class="text-sm text-gray-400">{{ item.latencyMs }}ms | {{ item.tokensUsed }} tokens</span>
                <span class="font-mono font-bold text-xl" :class="item.passed ? 'text-green-500' : 'text-red-500'">
                  {{ (item.score * 100).toFixed(0) }}% {{ item.passed ? '✓' : '✗' }}
                </span>
              </div>
              <!-- 维度得分 + Judge 理由 -->
              <div v-if="item.dimensionScores?.length" class="space-y-3">
                <div v-for="ds in item.dimensionScores" :key="ds.dimensionName">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="w-2 h-2 rounded-full flex-shrink-0"
                      :class="ds.score >= 0.8 ? 'bg-green-500' : ds.score >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'" />
                    <span class="font-bold text-gray-800 dark:text-gray-100">{{ ds.dimensionName }}</span>
                    <span class="font-mono font-bold text-base" :class="ds.score >= 0.8 ? 'text-green-600' : ds.score >= 0.6 ? 'text-yellow-600' : 'text-red-500'">
                      {{ (ds.score * 100).toFixed(0) }}%
                    </span>
                    <span class="text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                      :class="ds.score >= 0.8 ? 'bg-green-100 text-green-700' : ds.score >= 0.6 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'">
                      {{ ds.score >= 0.8 ? '优' : ds.score >= 0.6 ? '良' : '差' }}
                    </span>
                  </div>
                  <p class="text-gray-600 dark:text-gray-300 text-[15px] leading-relaxed pl-4">{{ ds.feedback }}</p>
                </div>
              </div>
              <!-- Agent 原文 -->
              <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <p class="text-sm font-semibold text-gray-500 mb-1">Agent 回答原文</p>
                <pre v-if="item.rawResponse" class="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-ai-surface rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">{{ item.rawResponse }}</pre>
                <p v-else class="text-sm text-gray-400 italic">暂无回答内容</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载/错误/空 -->
    <div v-else class="text-center py-20 text-gray-400">
      <LoadingSpinner v-if="evalStore.loading" />
      <div v-else-if="evalStore.error" class="space-y-3">
        <p class="text-red-500">{{ evalStore.error }}</p>
        <button class="btn-secondary text-sm" @click="evalStore.fetchTaskDetail(taskId)">重试</button>
      </div>
      <p v-else>任务不存在</p>
    </div>
  </div>
</template>
