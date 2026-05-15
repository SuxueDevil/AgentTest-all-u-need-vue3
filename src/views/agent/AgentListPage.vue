<!-- Agent 列表页 — 搜索 / 分页 / 新建 / 编辑 / 删除 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Pencil, Trash2 } from 'lucide-vue-next'
import { useAgentStore } from '@stores'
import type { Agent } from '@types'
import StatusBadge from '@components/common/StatusBadge.vue'
import ConfirmDialog from '@components/common/ConfirmDialog.vue'

const router = useRouter()
const agentStore = useAgentStore()

// ==================== 弹窗状态 ====================

/** 新建/编辑弹窗是否可见 */
const showCreateDialog = ref(false)
/** 删除确认弹窗是否可见 */
const showDeleteDialog = ref(false)
/** 待删除的 Agent */
const deleteTarget = ref<Agent | null>(null)
/** 编辑时不为 null，新建时为 null */
const editTarget = ref<Agent | null>(null)

// ==================== 表单状态 ====================

/** 表单绑定数据，tags 用逗号分隔的字符串方便输入，提交时再转为数组 */
const form = ref({
  name: '', description: '', model: '', type: 'llm',
  endpointUrl: '', authType: 'none', authCredential: '', tags: '',
})
/** 提交进行中标识，防止重复提交 */
const submitting = ref(false)
/** 搜索关键词 */
const searchKeyword = ref('')

// ==================== 表格列定义 ====================

const columns = [
  { key: 'name', label: 'Agent名称', width: '2fr' },
  { key: 'model', label: '模型', width: '1.5fr' },
  { key: 'type', label: '类型', width: '1fr' },
  { key: 'status', label: '状态', width: '1fr' },
  { key: 'updatedAt', label: '更新时间', width: '1.5fr' },
  { key: 'actions', label: '操作', width: '1fr' },
]

/** Agent 类型中文映射 */
const typeLabels: Record<string, string> = {
  llm: '大语言模型', 'multi-modal': '多模态', 'tool-use': '工具调用',
  'code-gen': '代码生成', rag: 'RAG',
}

// ==================== 生命周期 ====================

onMounted(() => {
  agentStore.fetchAgents()   // 页面加载时获取第一页数据
})

// ==================== CRUD 操作 ====================

/** 打开新建弹窗 — 清空表单和编辑目标 */
function openCreate() {
  editTarget.value = null
  form.value = { name: '', description: '', model: '', type: 'llm',
    endpointUrl: '', authType: 'none', authCredential: '', tags: '' }
  showCreateDialog.value = true
}

/** 打开编辑弹窗 — 用 Agent 数据填充表单，tags 数组转逗号分隔字符串 */
function openEdit(agent: Agent) {
  editTarget.value = agent
  form.value = {
    name: agent.name,
    description: agent.description || '',
    model: agent.model || '',
    type: agent.type,
    endpointUrl: agent.endpointUrl || '',
    authType: agent.authType || 'none',
    authCredential: '',                                         // 编辑时不回填凭证
    tags: agent.tags?.join(', ') || '',
  }
  showCreateDialog.value = true
}

/** 打开删除确认弹窗 */
function confirmDelete(agent: Agent) {
  deleteTarget.value = agent
  showDeleteDialog.value = true
}

/**
 * 提交表单 — 新建和编辑共用。
 * tags 字符串按逗号分割为数组，空字符串过滤掉。
 */
async function handleSubmit() {
  submitting.value = true
  try {
    const payload: Partial<Agent> = {
      name: form.value.name,
      description: form.value.description,
      model: form.value.model,
      type: form.value.type as Agent['type'],
      endpointUrl: form.value.endpointUrl,
      authType: form.value.authType,
      authCredential: form.value.authCredential,
      tags: form.value.tags
        ? form.value.tags.split(',').map(t => t.trim()).filter(Boolean)
        : [],
    }
    if (editTarget.value) {
      await agentStore.updateAgent(editTarget.value.id, payload)
    } else {
      await agentStore.createAgent(payload)
    }
    showCreateDialog.value = false
  } finally {
    submitting.value = false
  }
}

/** 确认删除 */
async function handleDelete() {
  if (!deleteTarget.value) return
  submitting.value = true
  try {
    await agentStore.deleteAgent(deleteTarget.value.id)
    showDeleteDialog.value = false
    deleteTarget.value = null
  } finally {
    submitting.value = false
  }
}

// ==================== 分页 / 搜索 ====================

/** 搜索时重置到第一页 */
function onSearch() {
  agentStore.fetchAgents({ keyword: searchKeyword.value || undefined, page: 1 })
}

/** 翻页 */
function onPageChange(page: number) {
  agentStore.fetchAgents({ page })
}
</script>

<template>
  <div class="space-y-6">
    <!-- 页头 -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold font-heading">Agent管理</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">管理待评测的AI Agent</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <Plus :size="16" />
        新建Agent
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="flex items-center gap-3">
      <div class="relative flex-1 max-w-sm">
        <Search :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchKeyword"
          type="text"
          placeholder="搜索Agent名称..."
          class="w-full rounded-lg border border-gray-200 dark:border-ai-border bg-white dark:bg-ai-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ai-purple/30"
          @keyup.enter="onSearch"
        />
      </div>
      <button class="btn-secondary text-sm" @click="onSearch">搜索</button>
    </div>

    <!-- 表格 -->
    <DataTable
      :columns="columns"
      :data="agentStore.agents"
      :loading="agentStore.loading"
      @row-click="(row: Agent) => router.push(`/agents/${row.id}`)"
    >
      <!-- 名称列: 首字母头像 + 名称 -->
      <template #cell-name="{ row }: { row: Agent }">
        <div class="flex items-center gap-2">
          <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-ai-purple to-ai-cyan">
            <span class="text-xs font-bold text-white">{{ row.name.charAt(0) }}</span>
          </div>
          <span class="font-medium text-gray-700 dark:text-gray-200">{{ row.name }}</span>
        </div>
      </template>
      <!-- 类型列: 显示中文 -->
      <template #cell-type="{ value }">
        <span class="text-gray-500 dark:text-gray-400 text-xs">{{ typeLabels[value as string] || value }}</span>
      </template>
      <!-- 状态列: 彩色标签 -->
      <template #cell-status="{ value }">
        <StatusBadge :status="value as string" type="agent" />
      </template>
      <!-- 更新时间列 -->
      <template #cell-updatedAt="{ value }">
        <span class="text-xs text-gray-400 dark:text-gray-500">{{ value }}</span>
      </template>
      <!-- 操作列: 编辑 + 删除按钮，阻止事件冒泡避免触发行点击 -->
      <template #cell-actions="{ row }: { row: Agent }">
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

    <!-- 分页: 仅总条数超过每页条数时显示 -->
    <div v-if="agentStore.total > agentStore.queryParams.pageSize" class="flex items-center justify-between">
      <span class="text-sm text-gray-500">
        共 {{ agentStore.total }} 条，第 {{ agentStore.queryParams.page }} / {{ Math.ceil(agentStore.total / agentStore.queryParams.pageSize) }} 页
      </span>
      <div class="flex gap-2">
        <button
          class="btn-secondary text-sm px-3 py-1"
          :disabled="agentStore.queryParams.page <= 1"
          @click="onPageChange(agentStore.queryParams.page - 1)"
        >上一页</button>
        <button
          class="btn-secondary text-sm px-3 py-1"
          :disabled="agentStore.queryParams.page >= Math.ceil(agentStore.total / agentStore.queryParams.pageSize)"
          @click="onPageChange(agentStore.queryParams.page + 1)"
        >下一页</button>
      </div>
    </div>

    <!-- 新建/编辑弹窗 — 点击遮罩关闭 -->
    <div v-if="showCreateDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="showCreateDialog = false">
      <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-lg font-bold">{{ editTarget ? '编辑Agent' : '新建Agent' }}</h2>
        <div class="space-y-3">
          <!-- 名称 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称 *</label>
            <input v-model="form.name" class="input-field" placeholder="Agent名称" />
          </div>
          <!-- 描述 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
            <textarea v-model="form.description" class="input-field" rows="2" placeholder="Agent描述" />
          </div>
          <!-- 模型 + 类型 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">模型</label>
              <input v-model="form.model" class="input-field" placeholder="如 gpt-4o" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
              <select v-model="form.type" class="input-field">
                <option value="llm">大语言模型</option>
                <option value="multi-modal">多模态</option>
                <option value="tool-use">工具调用</option>
                <option value="code-gen">代码生成</option>
                <option value="rag">RAG</option>
              </select>
            </div>
          </div>
          <!-- Endpoint -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Endpoint</label>
            <input v-model="form.endpointUrl" class="input-field" placeholder="https://api.example.com/v1/chat" />
          </div>
          <!-- 鉴权方式 + 凭证 -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">鉴权方式</label>
              <select v-model="form.authType" class="input-field">
                <option value="none">无</option>
                <option value="bearer">Bearer Token</option>
                <option value="api_key">API Key</option>
                <option value="basic">Basic Auth</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">鉴权凭证</label>
              <input v-model="form.authCredential" class="input-field" :placeholder="editTarget ? '留空则不修改' : '凭证'" />
            </div>
          </div>
          <!-- 标签 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签（逗号分隔）</label>
            <input v-model="form.tags" class="input-field" placeholder="LLM, 推理, 企业级" />
          </div>
        </div>
        <!-- 按钮 -->
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-primary" :disabled="submitting || !form.name" @click="handleSubmit">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <ConfirmDialog
      :show="showDeleteDialog"
      title="确认删除"
      :message="`确定要删除 Agent「${deleteTarget?.name}」吗？此操作不可撤销。`"
      @confirm="handleDelete"
      @cancel="showDeleteDialog = false"
    />
  </div>
</template>
