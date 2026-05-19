<!-- LLM 模型列表页 — 搜索 / 分页 / 新建 / 编辑 / 删除 -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Search, Pencil, Trash2, X } from 'lucide-vue-next'
import { useLLMStore } from '@stores'
import { formatDate } from '@utils/format'
import type { LLM } from '@types'
import ConfirmDialog from '@components/common/ConfirmDialog.vue'

const llmStore = useLLMStore()

// ==================== 弹窗 ====================
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const deleteTarget = ref<LLM | null>(null)
const editTarget = ref<LLM | null>(null)

// ==================== 表单 ====================
const form = ref({ name: '', model: '', endpointUrl: '', apiKey: '' })
const submitting = ref(false)

const searchKeyword = ref('')

// ==================== 表格列 ====================
const columns = [
  { key: 'name', label: 'LLM 名称', width: '2fr' },
  { key: 'model', label: '模型标识', width: '2fr' },
  { key: 'endpointUrl', label: 'API Endpoint', width: '3fr' },
  { key: 'updatedAt', label: '更新时间', width: '1.5fr' },
  { key: 'actions', label: '操作', width: '1fr' },
]

onMounted(() => { llmStore.fetchLLMs() })

function openCreate() {
  editTarget.value = null
  form.value = { name: '', model: '', endpointUrl: '', apiKey: '' }
  showCreateDialog.value = true
}

function openEdit(llm: LLM) {
  editTarget.value = llm
  form.value = { name: llm.name, model: llm.model, endpointUrl: llm.endpointUrl || '', apiKey: '' }
  showCreateDialog.value = true
}

function confirmDelete(llm: LLM) {
  deleteTarget.value = llm
  showDeleteDialog.value = true
}

async function handleSubmit() {
  submitting.value = true
  try {
    if (editTarget.value) {
      await llmStore.updateLLM(editTarget.value.id, form.value)
    } else {
      await llmStore.createLLM(form.value)
    }
    showCreateDialog.value = false
  } finally { submitting.value = false }
}

async function handleDelete() {
  submitting.value = true
  try {
    if (deleteTarget.value) await llmStore.deleteLLM(deleteTarget.value.id)
    showDeleteDialog.value = false
    deleteTarget.value = null
  } finally { submitting.value = false }
}

function onSearch() {
  llmStore.fetchLLMs({ keyword: searchKeyword.value || undefined, page: 1 })
}

function onPageChange(page: number) {
  llmStore.fetchLLMs({ page })
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold font-heading">LLM 模型</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">管理待评测的底层大语言模型</p>
      </div>
      <button class="btn-secondary" @click="openCreate"><Plus :size="16" /> 新建LLM</button>
    </div>

    <!-- 错误提示 -->
    <div v-if="llmStore.error" class="flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
      <span>{{ llmStore.error }}</span>
      <button class="p-0.5 hover:text-red-800 dark:hover:text-red-200" @click="llmStore.error = null"><X :size="14" /></button>
    </div>

    <!-- 搜索栏 -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="searchKeyword" type="text" placeholder="搜索LLM名称..." class="input-field w-full pl-9 text-sm" @keyup.enter="onSearch" />
      </div>
      <button class="btn-secondary text-sm" @click="onSearch">搜索</button>
    </div>

    <!-- 表格 -->
    <DataTable :columns="columns" :data="llmStore.llms" :loading="llmStore.loading">
      <template #cell-name="{ row }: { row: LLM }">
        <span class="font-medium text-gray-700 dark:text-gray-200">{{ row.name }}</span>
      </template>
      <template #cell-model="{ value }">
        <code class="text-xs bg-gray-100 dark:bg-ai-surface px-2 py-0.5 rounded text-ai-purple">{{ value }}</code>
      </template>
      <template #cell-endpointUrl="{ value }">
        <span class="text-gray-400">{{ value }}</span>
      </template>
      <template #cell-updatedAt="{ value }">
        <span class="text-gray-400 dark:text-gray-500">{{ formatDate(value) }}</span>
      </template>
      <template #cell-actions="{ row }: { row: LLM }">
        <div class="flex items-center gap-1">
          <button class="p-1 text-gray-400 hover:text-ai-purple rounded" title="编辑" @click="openEdit(row)"><Pencil :size="14" /></button>
          <button class="p-1 text-gray-400 hover:text-red-500 rounded" title="删除" @click="confirmDelete(row)"><Trash2 :size="14" /></button>
        </div>
      </template>
    </DataTable>

    <!-- 分页 -->
    <div v-if="llmStore.total > llmStore.queryParams.pageSize" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">共 {{ llmStore.total }} 条，第 {{ llmStore.queryParams.page }} / {{ Math.ceil(llmStore.total / llmStore.queryParams.pageSize) }} 页</span>
      <div class="flex gap-2">
        <button class="btn-secondary text-sm px-3 py-1" :disabled="llmStore.queryParams.page <= 1" @click="onPageChange(llmStore.queryParams.page - 1)">上一页</button>
        <button class="btn-secondary text-sm px-3 py-1" :disabled="llmStore.queryParams.page >= Math.ceil(llmStore.total / llmStore.queryParams.pageSize)" @click="onPageChange(llmStore.queryParams.page + 1)">下一页</button>
      </div>
    </div>

    <!-- 新建/编辑弹窗 -->
    <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showCreateDialog = false">
      <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 class="text-lg font-bold">{{ editTarget ? '编辑 LLM' : '新建 LLM' }}</h2>
        <div class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称 *</label>
            <input v-model="form.name" class="input-field" placeholder="如 DeepSeek V4" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型标识 *</label>
            <input v-model="form.model" class="input-field" placeholder="如 deepseek-chat" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Endpoint</label>
            <input v-model="form.endpointUrl" class="input-field" placeholder="https://api.deepseek.com/v1/chat/completions" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
            <input v-model="form.apiKey" class="input-field" placeholder="sk-..." />
          </div>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-secondary" :disabled="submitting || !form.name || !form.model" @click="handleSubmit">{{ submitting ? '保存中...' : '保存' }}</button>
        </div>
      </div>
    </div>

    <!-- 删除确认 -->
    <ConfirmDialog :show="showDeleteDialog" title="确认删除" variant="danger" :loading="submitting" :message="`确定要删除 LLM「${deleteTarget?.name}」吗？此操作不可撤销。`" @confirm="handleDelete" @cancel="showDeleteDialog = false" />
  </div>
</template>
