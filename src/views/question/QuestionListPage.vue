<!-- 题库列表页 — 搜索 / 筛选 / 分页 / 新建 / 编辑 / 删除 / 批量删除 / 导入导出 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Pencil, Trash2, Upload, Download, X, Sparkles } from 'lucide-vue-next'
import { useQuestionStore } from '@stores'
import { questionApi } from '@api'
import type { Question, QuestionCategory, DifficultyLevel, QuestionType, Turn } from '@types'
import ConfirmDialog from '@components/common/ConfirmDialog.vue'

/** Agent 类型中文映射 */
/** 问题分类中文映射 */
const categoryLabels: Record<QuestionCategory, string> = {
  reasoning: '推理', coding: '编程', qa: '问答', translation: '翻译', summarization: '摘要',
}
/** 难度中文映射 */
const difficultyLabels: Record<DifficultyLevel, string> = {
  easy: '简单', medium: '中等', hard: '困难',
}
/** 问题类型中文映射 */
const questionTypeLabels: Record<QuestionType, string> = {
  single: '单轮', multi: '多轮',
}

const questionStore = useQuestionStore()

// ==================== 弹窗状态 ====================

const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showImportDialog = ref(false)
const deleteTarget = ref<Question | null>(null)
/** 批量模式删除多选 */
const deleteTargets = ref<number[]>([])
const editTarget = ref<Question | null>(null)

/** AI 生成弹窗 */
const showGenerateDialog = ref(false)
const generating = ref(false)
const genForm = ref({ category: 'reasoning', difficulty: 'medium', questionType: 'single', count: 5, topic: '' })

// ==================== 表单状态 ====================

const form = ref({
  title: '', category: 'reasoning' as QuestionCategory, difficulty: 'medium' as DifficultyLevel,
  questionType: 'single' as QuestionType, expectedAnswer: '', tags: '',
  turns: [] as Turn[],
})
const submitting = ref(false)
/** 导入文件引用 */
const importFileInput = ref<HTMLInputElement | null>(null)
const importResult = ref<{ successCount: number; failCount: number; errors: { row: number; message: string }[] } | null>(null)

// ==================== 筛选 ====================

const searchKeyword = ref('')
const filterCategory = ref('')
const filterDifficulty = ref('')
const filterType = ref('')

// ==================== 批量选择 ====================

const selectedIds = ref(new Set<number>())

function toggleSelect(id: number) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) { next.delete(id) } else { next.add(id) }
  selectedIds.value = next
}

function toggleAll() {
  if (selectedIds.value.size === questionStore.questions.length) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(questionStore.questions.map(q => q.id))
  }
}

// ==================== 表格列定义 ====================

const columns = [
  { key: 'checkbox', label: '', width: '40px' },
  { key: 'title', label: '问题标题', width: '3fr' },
  { key: 'category', label: '分类', width: '1fr' },
  { key: 'difficulty', label: '难度', width: '0.8fr' },
  { key: 'questionType', label: '类型', width: '0.8fr' },
  { key: 'updatedAt', label: '更新时间', width: '1.5fr' },
  { key: 'actions', label: '操作', width: '1.2fr' },
]

// ==================== 生命周期 ====================

onMounted(() => {
  questionStore.fetchQuestions()
})

// ==================== CRUD ====================

function openCreate() {
  editTarget.value = null
  form.value = { title: '', category: 'reasoning', difficulty: 'medium',
    questionType: 'single', expectedAnswer: '', tags: '', turns: [] }
  showCreateDialog.value = true
}

function openEdit(question: Question) {
  editTarget.value = question
  form.value = {
    title: question.title,
    category: question.category,
    difficulty: question.difficulty,
    questionType: question.questionType,
    expectedAnswer: question.expectedAnswer || '',
    tags: question.tags?.join(', ') || '',
    turns: question.turns ? [...question.turns] : [],
  }
  showCreateDialog.value = true
}

function confirmDelete(question: Question) {
  deleteTarget.value = question
  deleteTargets.value = []
  showDeleteDialog.value = true
}

function confirmBatchDelete() {
  if (selectedIds.value.size === 0) return
  deleteTarget.value = null
  deleteTargets.value = [...selectedIds.value]
  showDeleteDialog.value = true
}

/** 提交表单 */
async function handleSubmit() {
  submitting.value = true
  try {
    const payload: Partial<Question> = {
      title: form.value.title,
      category: form.value.category,
      difficulty: form.value.difficulty,
      questionType: form.value.questionType,
      expectedAnswer: form.value.expectedAnswer,
      tags: form.value.tags
        ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
      turns: form.value.questionType === 'multi' ? form.value.turns : [],
    }
    if (editTarget.value) {
      await questionStore.updateQuestion(editTarget.value.id, payload)
    } else {
      await questionStore.createQuestion(payload)
    }
    showCreateDialog.value = false
  } finally {
    submitting.value = false
  }
}

/** 确认删除 */
async function handleDelete() {
  submitting.value = true
  try {
    if (deleteTargets.value.length > 0) {
      await questionStore.batchDeleteQuestions(deleteTargets.value)
    } else if (deleteTarget.value) {
      await questionStore.deleteQuestion(deleteTarget.value.id)
    }
    selectedIds.value = new Set()
    showDeleteDialog.value = false
    deleteTarget.value = null
    deleteTargets.value = []
  } finally {
    submitting.value = false
  }
}

// ==================== 多轮 turns 编辑 ====================

/** 新增一轮对话 */
function addTurn() {
  form.value.turns.push({
    turnOrder: form.value.turns.length + 1,
    role: 'user',
    content: '',
  })
}

/** 移除一轮对话 */
function removeTurn(index: number) {
  form.value.turns.splice(index, 1)
  // 重新编号
  form.value.turns.forEach((t, i) => (t.turnOrder = i + 1))
}

// ==================== 导入导出 ====================

/** 触发文件选择 */
async function handleGenerate() {
  generating.value = true
  try {
    await questionStore.generateQuestions(genForm.value)
    showGenerateDialog.value = false
  } finally { generating.value = false }
}

function openImport() {
  importResult.value = null
  showImportDialog.value = true
}

/** 提交导入 */
async function handleImport() {
  const file = importFileInput.value?.files?.[0]
  if (!file) return
  submitting.value = true
  try {
    importResult.value = await questionApi.importFile(file)
    await questionStore.fetchQuestions()
  } finally {
    submitting.value = false
  }
}

/** 导出 */
function handleExport(format: 'csv' | 'json') {
  window.open(questionApi.exportFile(format), '_blank')
}

// ==================== 分页 / 搜索 ====================

function onSearch() {
  questionStore.fetchQuestions({
    keyword: searchKeyword.value || undefined,
    category: filterCategory.value as QuestionCategory || undefined,
    difficulty: filterDifficulty.value as DifficultyLevel || undefined,
    questionType: filterType.value as QuestionType || undefined,
    page: 1,
  })
}

function onPageChange(page: number) {
  questionStore.fetchQuestions({ page })
}

/** 问题类型切换时，如果切换到多轮且 turns 为空，自动加一条 */
function onTypeChange() {
  if (form.value.questionType === 'multi' && form.value.turns.length === 0) {
    addTurn()
  }
}

/** 删除确认消息 */
const deleteMessage = computed(() => {
  if (deleteTargets.value.length > 0) {
    return `确定要删除选中的 ${deleteTargets.value.length} 个问题吗？此操作不可撤销。`
  }
  return `确定要删除问题「${deleteTarget.value?.title}」吗？此操作不可撤销。`
})
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold font-heading">题库管理</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">管理评测用的问题库，支持单轮/多轮问题</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary text-sm" @click="openImport">
          <Upload :size="14" />
          导入
        </button>
        <button class="btn-secondary text-sm" @click="handleExport('csv')">
          <Download :size="14" />
          导出
        </button>
        <button class="btn-secondary text-sm" @click="showGenerateDialog = true">
          <Sparkles :size="14" />
          AI 生成
        </button>
        <button class="btn-secondary" @click="openCreate">
          <Plus :size="16" />
          新建问题
        </button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 max-w-sm">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchKeyword" type="text" placeholder="搜索问题标题..."
          class="w-full rounded-lg border border-gray-200 dark:border-ai-border bg-white dark:bg-ai-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-purple/30"
          @keyup.enter="onSearch"
        />
      </div>
      <select v-model="filterCategory" class="input-field w-28 text-sm" @change="onSearch">
        <option value="">全部分类</option>
        <option v-for="(label, key) in categoryLabels" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="filterDifficulty" class="input-field w-28 text-sm" @change="onSearch">
        <option value="">全部难度</option>
        <option v-for="(label, key) in difficultyLabels" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="filterType" class="input-field w-24 text-sm" @change="onSearch">
        <option value="">全部类型</option>
        <option value="single">单轮</option>
        <option value="multi">多轮</option>
      </select>
      <button class="btn-secondary text-sm" @click="onSearch">搜索</button>

      <!-- 批量删除 -->
      <button
        v-if="selectedIds.size > 0"
        class="btn-secondary text-sm text-red-500 hover:text-red-600"
        @click="confirmBatchDelete"
      >
        <Trash2 :size="14" />
        删除选中 ({{ selectedIds.size }})
      </button>
    </div>

    <!-- 表格 -->
    <DataTable
      :columns="columns" :data="questionStore.questions" :loading="questionStore.loading"
    >
      <!-- 复选框列 -->
      <template #cell-checkbox="{ row }: { row: Question }">
        <input
          type="checkbox" :checked="selectedIds.has(row.id)"
          class="rounded border-gray-300 text-ai-purple focus:ring-ai-purple/30"
          @click.stop @change="toggleSelect(row.id)"
        />
      </template>
      <!-- 表头复选框 -->
      <template #head-checkbox>
        <input
          type="checkbox"
          :checked="selectedIds.size === questionStore.questions.length && questionStore.questions.length > 0"
          class="rounded border-gray-300 text-ai-purple focus:ring-ai-purple/30"
          @change="toggleAll"
        />
      </template>
      <!-- 标题列 -->
      <template #cell-title="{ row }: { row: Question }">
        <span class="font-medium text-gray-700 dark:text-gray-200 line-clamp-1" :title="row.title">{{ row.title }}</span>
      </template>
      <!-- 分类列 -->
      <template #cell-category="{ value }">
        <span class="text-xs bg-gray-100 dark:bg-ai-surface text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">
          {{ categoryLabels[value as QuestionCategory] || value }}
        </span>
      </template>
      <!-- 难度列 -->
      <template #cell-difficulty="{ value }">
        <span
          class="text-xs px-2 py-0.5 rounded-full"
          :class="{
            'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400': value === 'easy',
            'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400': value === 'medium',
            'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400': value === 'hard',
          }"
        >{{ difficultyLabels[value as DifficultyLevel] || value }}</span>
      </template>
      <!-- 类型列 -->
      <template #cell-questionType="{ value }">
        <span class="text-xs text-gray-400">{{ questionTypeLabels[value as QuestionType] || value }}</span>
      </template>
      <!-- 更新时间列 -->
      <template #cell-updatedAt="{ value }">
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ value }}</span>
      </template>
      <!-- 操作列 -->
      <template #cell-actions="{ row }: { row: Question }">
        <div class="flex items-center gap-1" @click.stop>
          <button class="p-1 text-gray-400 hover:text-ai-purple rounded" title="编辑" @click="openEdit(row)">
            <Pencil :size="14" />
          </button>
          <button class="p-1 text-gray-400 hover:text-red-500 rounded" title="删除" @click="confirmDelete(row)">
            <Trash2 :size="14" />
          </button>
        </div>
      </template>
    </DataTable>

    <!-- 分页 -->
    <div v-if="questionStore.total > questionStore.queryParams.pageSize" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">
        共 {{ questionStore.total }} 条，第 {{ questionStore.queryParams.page }} / {{ Math.ceil(questionStore.total / questionStore.queryParams.pageSize) }} 页
      </span>
      <div class="flex gap-2">
        <button class="btn-secondary text-sm px-3 py-1" :disabled="questionStore.queryParams.page <= 1"
          @click="onPageChange(questionStore.queryParams.page - 1)">上一页</button>
        <button class="btn-secondary text-sm px-3 py-1"
          :disabled="questionStore.queryParams.page >= Math.ceil(questionStore.total / questionStore.queryParams.pageSize)"
          @click="onPageChange(questionStore.queryParams.page + 1)">下一页</button>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showCreateDialog = false">
      <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold">{{ editTarget ? '编辑问题' : '新建问题' }}</h2>
        <div class="space-y-3">
          <!-- 标题 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 *</label>
            <input v-model="form.title" class="input-field" placeholder="问题标题" />
          </div>
          <!-- 分类 + 难度 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分类</label>
              <select v-model="form.category" class="input-field">
                <option v-for="(label, key) in categoryLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">难度</label>
              <select v-model="form.difficulty" class="input-field">
                <option v-for="(label, key) in difficultyLabels" :key="key" :value="key">{{ label }}</option>
              </select>
            </div>
          </div>
          <!-- 问题类型 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
            <select v-model="form.questionType" class="input-field" @change="onTypeChange">
              <option value="single">单轮</option>
              <option value="multi">多轮</option>
            </select>
          </div>
          <!-- 期望答案 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">期望答案（评分参考）</label>
            <textarea v-model="form.expectedAnswer" class="input-field" rows="3" placeholder="输入期望答案..." />
          </div>
          <!-- 标签 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签（逗号分隔）</label>
            <input v-model="form.tags" class="input-field" placeholder="如 逻辑, 推理, 数学" />
          </div>
          <!-- 多轮对话编辑器 -->
          <div v-if="form.questionType === 'multi'" class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300">多轮对话</label>
              <button type="button" class="text-xs text-ai-purple hover:underline" @click="addTurn">+ 新增一轮</button>
            </div>
            <div v-for="(turn, index) in form.turns" :key="index" class="border border-gray-200 dark:border-ai-border rounded-lg p-3 space-y-2 relative">
              <button
                v-if="form.turns.length > 1"
                class="absolute top-2 right-2 p-0.5 text-gray-400 hover:text-red-500 rounded"
                @click="removeTurn(index)"
              >
                <X :size="14" />
              </button>
              <div class="text-xs text-gray-400">第 {{ turn.turnOrder }} 轮</div>
              <select v-model="turn.role" class="input-field text-sm">
                <option value="user">User（用户）</option>
                <option value="assistant">Assistant（助手）</option>
              </select>
              <textarea v-model="turn.content" class="input-field" rows="2" :placeholder="turn.role === 'user' ? '用户消息...' : '助手回复...'" />
            </div>
          </div>
        </div>
        <!-- 按钮 -->
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" :disabled="submitting || !form.title" @click="handleSubmit">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showImportDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showImportDialog = false">
      <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 class="text-lg font-bold">导入问题</h2>
        <p class="text-sm text-gray-500">支持 CSV 或 JSON 文件格式</p>
        <input ref="importFileInput" type="file" accept=".csv,.json" class="input-field" />
        <!-- 导入结果 -->
        <div v-if="importResult" class="text-sm space-y-1">
          <p class="text-green-600">成功 {{ importResult.successCount }} 条</p>
          <p v-if="importResult.failCount > 0" class="text-red-500">失败 {{ importResult.failCount }} 条</p>
          <p v-for="err in importResult.errors" :key="err.row" class="text-red-400 text-xs">
            第 {{ err.row }} 行: {{ err.message }}
          </p>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showImportDialog = false">关闭</button>
          <button class="btn-primary" :disabled="submitting" @click="handleImport">
            {{ submitting ? '导入中...' : '上传并导入' }}
          </button>
        </div>
      </div>
    </div>

    <!-- AI 生成弹窗 -->
    <div v-if="showGenerateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showGenerateDialog = false">
      <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 class="text-lg font-bold flex items-center gap-2"><Sparkles :size="20" class="text-ai-purple" /> AI 生成题目</h2>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">分类</label>
            <select v-model="genForm.category" class="input-field text-sm">
              <option v-for="(label, key) in categoryLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">难度</label>
            <select v-model="genForm.difficulty" class="input-field text-sm">
              <option v-for="(label, key) in difficultyLabels" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
            <select v-model="genForm.questionType" class="input-field text-sm">
              <option value="single">单轮</option>
              <option value="multi">多轮</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">数量</label>
            <select v-model.number="genForm.count" class="input-field text-sm">
              <option v-for="n in [1,3,5,10,20]" :key="n" :value="n">{{ n }} 道</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">主题（可选）</label>
          <input v-model="genForm.topic" class="input-field text-sm" placeholder="如 医疗问诊、金融分析、法律咨询" />
          <div class="flex flex-wrap gap-1 mt-1.5">
            <button v-for="t in ['医疗问诊','金融分析','法律咨询','编程面试','客户服务','教育培训']" :key="t"
              class="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-ai-purple hover:text-ai-purple transition-colors"
              @click="genForm.topic = t"
            >{{ t }}</button>
          </div>
        </div>
        <!-- 生成进度 -->
        <div v-if="generating" class="flex items-center gap-3 py-3 px-4 rounded-lg bg-ai-purple/5 border border-ai-purple/20">
          <div class="w-5 h-5 border-2 border-ai-purple border-t-transparent rounded-full animate-spin" />
          <span class="text-sm text-ai-purple">AI 正在生成题目，请稍候...</span>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showGenerateDialog = false" :disabled="generating">取消</button>
          <button class="btn-secondary" :disabled="generating" @click="handleGenerate">
            {{ generating ? '生成中...' : '生成' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :show="showDeleteDialog"
      title="确认删除"
      variant="danger"
      :message="deleteMessage"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
