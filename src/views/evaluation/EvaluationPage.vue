<!-- 评测任务列表页 — 搜索 / 状态筛选 / 分页 / 新建任务 / 启动 / 取消 / 删除 -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Trash2, Play, Square, RotateCcw, X, Loader2 } from 'lucide-vue-next'
import { useEvaluationStore, useQuestionStore, useAgentStore, useLLMStore } from '@stores'
import type { EvaluationTask, TaskStatus, DimensionConfig } from '@types'
import StatusBadge from '@components/common/StatusBadge.vue'
import ConfirmDialog from '@components/common/ConfirmDialog.vue'

const router = useRouter()
const evalStore = useEvaluationStore()
const questionStore = useQuestionStore()
const agentStore = useAgentStore()
const llmStore = useLLMStore()

// ==================== 弹窗 ====================

const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref<EvaluationTask | null>(null)
const deleting = ref(false)
/** 当前正在执行操作的任务ID（启动/重启/取消），用于按钮 loading 动画 */
const actingId = ref<number | null>(null)

// ==================== 筛选 ====================

const filterStatus = ref('')

// ==================== 新建表单 ====================

const canProceed = computed(() => {
  if (submitting.value) return false
  if (!form.value.name) return false
  if (form.value.questionIds.length === 0) return false
  if (form.value.agentIds.length === 0 && form.value.llmIds.length === 0) return false
  return true
})

const form = ref({
  name: '', description: '',
  questionIds: [] as number[],
  agentIds: [] as number[],
  llmIds: [] as number[],
  dimensions: [
    { name: 'accuracy', displayName: '准确性', weight: 0.30, threshold: 0.6 },
    { name: 'efficiency', displayName: '效率', weight: 0.20, threshold: 0.5 },
    { name: 'safety', displayName: '安全性', weight: 0.25, threshold: 0.7 },
    { name: 'satisfaction', displayName: '用户满意度', weight: 0.25, threshold: 0.6 },
  ] as DimensionConfig[],
})
const submitting = ref(false)

// ==================== 表格列 ====================

const columns = [
  { key: 'name', label: '任务名称', width: '2fr' },
  { key: 'info', label: '题目/Agent', width: '2fr' },
  { key: 'progress', label: '进度', width: '1.5fr' },
  { key: 'status', label: '状态', width: '1fr' },
  { key: 'createdAt', label: '创建时间', width: '1.5fr' },
  { key: 'actions', label: '操作', width: '1.5fr' },
]

const statusLabels: Record<TaskStatus, string> = {
  pending: '等待中', running: '进行中', completed: '已完成', cancelled: '已取消', failed: '失败',
}

// ==================== 生命周期 ====================

/**
 * 自动刷新定时器 — 有 running 任务时每 3s 调 progress 轻量接口更新进度条。
 * 不触发全量分页查询，进度 100% 后自动停止。
 */
let refreshTimer: ReturnType<typeof setInterval> | null = null

function startAutoRefresh() {
  if (refreshTimer) return
  refreshTimer = setInterval(async () => {
    await evalStore.refreshRunningProgress()
    if (!evalStore.tasks.some(t => t.status === 'running')) stopAutoRefresh()
  }, 3000)
}

function stopAutoRefresh() {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null }
}

onMounted(() => {
  evalStore.fetchTasks()
  questionStore.fetchQuestions({ pageSize: 200 })
  agentStore.fetchAgents({ pageSize: 100 })
  llmStore.fetchLLMs({ pageSize: 100 })
})

onUnmounted(() => {
  stopAutoRefresh()
})

// ==================== 创建任务 ====================

function openCreate() {
  form.value = {
    name: '', description: '',
    questionIds: [],
    agentIds: [],
    llmIds: [],
    dimensions: [
      { name: 'accuracy', displayName: '准确性', weight: 0.30, threshold: 0.6 },
      { name: 'efficiency', displayName: '效率', weight: 0.20, threshold: 0.5 },
      { name: 'safety', displayName: '安全性', weight: 0.25, threshold: 0.7 },
      { name: 'satisfaction', displayName: '用户满意度', weight: 0.25, threshold: 0.6 },
    ],
  }
  showCreateDialog.value = true
}

function toggleQuestion(id: number) {
  const idx = form.value.questionIds.indexOf(id)
  if (idx === -1) { form.value.questionIds.push(id) }
  else { form.value.questionIds.splice(idx, 1) }
}

function toggleAgent(id: number) {
  const idx = form.value.agentIds.indexOf(id)
  if (idx === -1) { form.value.agentIds.push(id) }
  else { form.value.agentIds.splice(idx, 1) }
}

function toggleLLM(id: number) {
  const idx = form.value.llmIds.indexOf(id)
  if (idx === -1) { form.value.llmIds.push(id) }
  else { form.value.llmIds.splice(idx, 1) }
}

function addDimension() {
  form.value.dimensions.push({ name: '', displayName: '', weight: 0, threshold: 0.5 })
}

function removeDimension(index: number) {
  form.value.dimensions.splice(index, 1)
}

async function handleSubmit() {
  submitting.value = true
  try {
    await evalStore.createTask({
      name: form.value.name,
      description: form.value.description,
      questionIds: form.value.questionIds,
      agentIds: form.value.agentIds,
      llmIds: form.value.llmIds,
      dimensions: form.value.dimensions.filter(d => d.name && d.displayName),
    })
    showCreateDialog.value = false
  } finally {
    submitting.value = false
  }
}

// ==================== 操作 ====================

function confirmDelete(task: EvaluationTask) {
  deleteTarget.value = task
  showDeleteDialog.value = true
}

async function handleDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await evalStore.deleteTask(deleteTarget.value.id)
    showDeleteDialog.value = false
    deleteTarget.value = null
  } finally { deleting.value = false }
}

async function handleStart(task: EvaluationTask) {
  actingId.value = task.id
  // 乐观更新：立刻把状态改成 running，不等后端返回
  task.status = 'running'
  task.completedCount = 0
  startAutoRefresh()
  try {
    await evalStore.startTask(task.id)
  } finally { actingId.value = null }
}

async function handleRestart(task: EvaluationTask) {
  actingId.value = task.id
  try {
    await evalStore.restartTask(task.id)
  } finally { actingId.value = null }
}

async function handleCancel(task: EvaluationTask) {
  actingId.value = task.id
  try {
    await evalStore.cancelTask(task.id)
  } finally { actingId.value = null }
}

// ==================== 分页 / 搜索 ====================

function onSearch() {
  evalStore.fetchTasks({ status: filterStatus.value as TaskStatus || undefined, page: 1 })
}

function onPageChange(page: number) {
  evalStore.fetchTasks({ page })
}

/** 进度百分比（实时值） */
function realProgress(task: EvaluationTask) {
  if (task.questionCount === 0) return 0
  return Math.round((task.completedCount / task.questionCount) * 100)
}

/** 进度百分比 */
function progressPercent(task: EvaluationTask) {
  if (task.questionCount === 0) return 0
  return Math.round((task.completedCount / task.questionCount) * 100)
}

/** 维度权重合计 */
const totalWeight = computed(() =>
  form.value.dimensions.reduce((sum, d) => sum + d.weight, 0)
)
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold font-heading">评测任务</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">创建和管理 Agent 评测任务</p>
      </div>
      <button class="btn-secondary" @click="openCreate">
        <Plus :size="16" />
        新建任务
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="evalStore.error" class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      <span>{{ evalStore.error }}</span>
      <button class="p-0.5 hover:text-red-800 dark:hover:text-red-200" @click="evalStore.error = null"><X :size="14" /></button>
    </div>

    <!-- 筛选栏 -->
    <div class="flex items-center gap-3">
      <select v-model="filterStatus" class="input-field w-32 text-sm" @change="onSearch">
        <option value="">全部状态</option>
        <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
      </select>
      <button class="btn-secondary text-sm" @click="onSearch">筛选</button>
    </div>

    <!-- 表格 -->
    <DataTable
      :columns="columns" :data="evalStore.tasks" :loading="evalStore.loading"
      @row-click="(row: EvaluationTask) => router.push(`/evaluation/${row.id}`)"
    >
      <template #cell-name="{ value }">
        <span class="font-medium text-gray-700 dark:text-gray-200">{{ value }}</span>
      </template>
      <template #cell-info="{ row }: { row: EvaluationTask }">
        <span class="text-xs text-gray-400">
          {{ row.questionIds.length }}题 / {{ row.agentIds.length + (row.llmIds?.length ?? 0) }}目标
        </span>
      </template>
      <template #cell-progress="{ row }: { row: EvaluationTask }">
        <div class="flex items-center gap-2">
          <div class="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-700"
              :class="{
                'bg-green-500': row.status === 'completed',
                'bg-red-500': row.status === 'failed',
                'bg-ai-purple animate-progress': row.status === 'running',
                'bg-gray-400': row.status === 'pending' || row.status === 'cancelled',
              }"
              :style="{ width: `${progressPercent(row)}%` }"
            />
          </div>
          <span class="text-xs font-mono w-12 text-right"
            :class="{
              'text-green-500': row.status === 'completed',
              'text-red-400': row.status === 'failed',
              'text-ai-purple-light': row.status === 'running',
              'text-gray-400': row.status === 'pending' || row.status === 'cancelled',
            }"
          >{{ progressPercent(row) }}%</span>
        </div>
      </template>
      <template #cell-status="{ value }">
        <StatusBadge :status="value as string" type="task" />
      </template>
      <template #cell-createdAt="{ value }">
        <span class="text-xs text-gray-400">{{ value }}</span>
      </template>
      <template #cell-actions="{ row }: { row: EvaluationTask }">
        <div class="flex items-center gap-1.5" @click.stop>
          <button
            v-if="row.status === 'pending'"
            class="p-1.5 text-green-500 hover:text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50" title="启动"
            :disabled="actingId !== null"
            @click="handleStart(row)"
          ><Loader2 v-if="actingId === row.id" :size="16" class="animate-spin" /><Play v-else :size="16" /></button>
          <button
            v-if="row.status === 'running'"
            class="p-1.5 text-yellow-500 hover:text-yellow-600 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors disabled:opacity-50" title="取消"
            :disabled="actingId !== null"
            @click="handleCancel(row)"
          ><Loader2 v-if="actingId === row.id" :size="16" class="animate-spin" /><Square v-else :size="16" /></button>
          <button
            v-if="row.status === 'completed' || row.status === 'cancelled' || row.status === 'failed'"
            class="p-1.5 text-gray-400 hover:text-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors disabled:opacity-50" title="重新开始"
            :disabled="actingId !== null"
            @click="handleRestart(row)"
          ><Loader2 v-if="actingId === row.id" :size="16" class="animate-spin" /><RotateCcw v-else :size="16" /></button>
          <button
            v-if="row.status !== 'running'"
            class="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50" title="删除"
            :disabled="actingId !== null"
            @click="confirmDelete(row)"
          ><Trash2 :size="16" /></button>
        </div>
      </template>
    </DataTable>

    <!-- 分页 -->
    <div v-if="evalStore.total > evalStore.queryParams.pageSize" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">
        共 {{ evalStore.total }} 条，第 {{ evalStore.queryParams.page }} / {{ Math.ceil(evalStore.total / evalStore.queryParams.pageSize) }} 页
      </span>
      <div class="flex gap-2">
        <button class="btn-secondary text-sm px-3 py-1" :disabled="evalStore.queryParams.page <= 1"
          @click="onPageChange(evalStore.queryParams.page - 1)">上一页</button>
        <button class="btn-secondary text-sm px-3 py-1"
          :disabled="evalStore.queryParams.page >= Math.ceil(evalStore.total / evalStore.queryParams.pageSize)"
          @click="onPageChange(evalStore.queryParams.page + 1)">下一页</button>
      </div>
    </div>

    <!-- 新建任务弹窗 -->
    <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showCreateDialog = false">
      <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold">新建评测任务</h2>

        <!-- 基本信息 -->
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">任务名称 *</label>
            <input v-model="form.name" class="input-field" placeholder="如 推理能力综合评测" />
            <div class="flex flex-wrap gap-1 mt-1.5">
              <button v-for="p in ['推理能力评测','编程能力评测','综合能力评测','翻译质量评测','摘要能力评测','角色认知评测']" :key="p"
                class="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-ai-purple hover:text-ai-purple transition-colors"
                @click="form.name = p"
              >{{ p }}</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
            <textarea v-model="form.description" class="input-field" rows="2" placeholder="任务描述（可选）" />
          </div>
        </div>

        <!-- 选题 + 选Agent + 选LLM 并排 -->
        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">选择题目 <span class="text-xs text-gray-400">({{ form.questionIds.length }})</span></label>
            <div class="max-h-48 overflow-y-auto space-y-0.5 border rounded-lg p-1.5">
              <div v-for="q in questionStore.questions" :key="q.id"
                class="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded hover:bg-gray-50 dark:hover:bg-ai-surface cursor-pointer"
                @click="toggleQuestion(q.id)"
              >
                <input type="checkbox" :checked="form.questionIds.includes(q.id)" class="rounded scale-90" />
                <span class="flex-1 truncate">{{ q.title }}</span>
                <span class="text-xs px-1 rounded" :class="q.questionType === 'multi' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'">{{ q.questionType === 'multi' ? '多轮' : '单轮' }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">选择 Agent <span class="text-xs text-gray-400">({{ form.agentIds.length }})</span></label>
            <div class="max-h-48 overflow-y-auto space-y-0.5 border rounded-lg p-1.5">
              <div v-for="a in agentStore.agents" :key="a.id"
                class="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded hover:bg-gray-50 dark:hover:bg-ai-surface cursor-pointer"
                @click="toggleAgent(a.id)"
              >
                <input type="checkbox" :checked="form.agentIds.includes(a.id)" class="rounded scale-90" />
                <span class="flex-1">{{ a.name }}</span>
                <span class="text-xs text-gray-400">{{ a.model }}</span>
              </div>
            </div>
          </div>
          <div class="space-y-1">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">选择 LLM <span class="text-xs text-gray-400">({{ form.llmIds.length }})</span></label>
            <div class="max-h-48 overflow-y-auto space-y-0.5 border rounded-lg p-1.5">
              <div v-for="l in llmStore.llms" :key="l.id"
                class="flex items-center gap-1.5 text-xs py-1 px-1.5 rounded hover:bg-gray-50 dark:hover:bg-ai-surface cursor-pointer"
                @click="toggleLLM(l.id)"
              >
                <input type="checkbox" :checked="form.llmIds.includes(l.id)" class="rounded scale-90" />
                <span class="flex-1">{{ l.name }}</span>
                <span class="text-xs text-gray-400">{{ l.model }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 维度配置 -->
        <div class="space-y-1">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">评测维度</label>
            <span class="text-xs text-gray-400">权重合计: {{ totalWeight.toFixed(2) }}</span>
          </div>
          <div class="border rounded-lg p-2 space-y-1.5">
            <div v-for="(dim, index) in form.dimensions" :key="index"
              class="grid grid-cols-5 gap-1.5 items-center text-xs"
            >
              <input v-model="dim.name" class="input-field text-xs py-1" placeholder="标识" />
              <input v-model="dim.displayName" class="input-field text-xs py-1" placeholder="名称" />
              <input v-model.number="dim.weight" type="number" min="0" max="1" step="0.05" class="input-field text-xs py-1" placeholder="权重" />
              <input v-model.number="dim.threshold" type="number" min="0" max="1" step="0.05" class="input-field text-xs py-1" placeholder="阈值" />
              <button v-if="form.dimensions.length > 1" class="text-gray-400 hover:text-red-500 text-xs" @click="removeDimension(index)">×</button>
            </div>
            <button class="text-xs text-ai-purple hover:underline" @click="addDimension">+ 添加维度</button>
          </div>
        </div>

        <!-- 底部按钮 -->
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-secondary" :disabled="!canProceed" @click="handleSubmit">
            {{ submitting ? '创建中...' : '创建任务' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <ConfirmDialog
      :show="showDeleteDialog"
      title="确认删除"
      variant="danger"
      :message="`确定要删除任务「${deleteTarget?.name}」吗？此操作不可撤销。`"
      :loading="deleting"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>

<style scoped>
@keyframes progress-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.animate-progress {
  background: linear-gradient(90deg, #7C3AED 0%, #A78BFA 40%, #7C3AED 70%) !important;
  background-size: 200% 100% !important;
  animation: progress-shimmer 2s linear infinite;
}
</style>
