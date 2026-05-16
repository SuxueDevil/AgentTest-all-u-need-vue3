<!--
  Agent 列表页 — 搜索 / 分页 / 新建 / 编辑 / 删除。
  【Java 类比】≈ AgentController.list() 返回的 Thymeleaf 列表页面
    useAgentStore() ≈ @Autowired AgentService
    fetchAgents() ≈ service.page(queryDTO)
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, Pencil, Trash2 } from 'lucide-vue-next'
import { useAgentStore } from '@stores'
import type { Agent } from '@types'
import StatusBadge from '@components/common/StatusBadge.vue'
import ConfirmDialog from '@components/common/ConfirmDialog.vue'

const router = useRouter()
/** 【Java 类比】≈ @Autowired AgentService，所有数据操作通过 Store 代理 */
const agentStore = useAgentStore()

/** 根据 Agent 名称生成唯一色相（0~360），同一名称始终同一色调 */
function getAgentHue(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % 360
}

/** 根据色相生成淡彩渐变背景，半透明让底色透出 */
function getAvatarGradient(hue: number) {
  return `linear-gradient(135deg, hsla(${hue},65%,82%,0.55), hsla(${hue},55%,94%,0.45))`
}

/** 根据色相生成极淡边框 */
function getAvatarBorder(hue: number) {
  return `1px solid hsla(${hue},50%,70%,0.15)`
}

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

/** 表单绑定数据 */
const form = ref({
  name: '', description: '', model: '', type: 'llm',
  endpointUrl: '', requestBody: '', responseProtocol: 'sse', responseContentPath: 'choices[0].delta.content',
  authType: 'none', authCredential: '',
})
/** 鉴权凭证 placeholder，custom 模式显示 JSON 示例 */
const authPlaceholder = computed(() => {
  if (form.value.authType === 'custom') return `{"x-access-token":"tok","X-App-Code":"123"}`
  return editTarget.value ? '留空则不修改' : '凭证'
})
/** 提交进行中标识，防止重复提交 */
const submitting = ref(false)
/** 表单校验错误 */
const formError = ref('')

/** 协议切换自动填入答案位置 */
watch(() => form.value.responseProtocol, (val) => {
  if (val === 'sse') form.value.responseContentPath = 'choices[0].delta.content'
  else if (val === 'json') form.value.responseContentPath = 'choices[0].message.content'
  else form.value.responseContentPath = ''
})

/** 名称关键词匹配描述 — 新建时自动填入 */
watch(() => form.value.name, (name) => {
  if (editTarget.value || form.value.description) return
  const map: Record<string, string> = {
    '推理': '评测Agent的逻辑推理能力，包括三段论、归因分析、辩证思维等',
    '编程': '评测Agent的编程能力，包括算法实现、代码调试、系统设计等',
    '翻译': '评测Agent的翻译质量，评估中英互译的准确度和流畅度',
    '摘要': '评测Agent的信息摘要能力，评估关键信息提取和压缩质量',
    '综合': '多维度综合评测，覆盖推理、编程、翻译、问答等核心能力',
    '角色': '评测Agent的角色扮演和人格一致性，评估对话自然度和角色贴合度',
  }
  for (const [key, desc] of Object.entries(map)) {
    if (name.includes(key)) { form.value.description = desc; return }
  }
})

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

/**
 * 页面加载时获取第一页数据。
 * 【Java 类比】≈ @PostConstruct 初始化 → service.page(defaultParams)
 */
onMounted(() => {
  agentStore.fetchAgents()
})

// ==================== CRUD 操作 ====================

/**
 * 打开新建弹窗 — 清空表单和编辑目标。
 * 【Java 类比】≈ GET /agents/new → 返回空白表单
 */
function openCreate() {
  formError.value = ''
  editTarget.value = null
  form.value = { name: '', description: '', model: '', type: 'llm',
    endpointUrl: '', requestBody: '', responseProtocol: 'sse', responseContentPath: 'choices[0].delta.content', authType: 'none', authCredential: '' }
  showCreateDialog.value = true
}

/**
 * 打开编辑弹窗 — 用 Agent 数据填充表单。
 * 【Java 类比】≈ GET /agents/{id}/edit → 返回预填充的编辑表单
 */
function openEdit(agent: Agent) {
  editTarget.value = agent
  form.value = {
    name: agent.name,
    description: agent.description || '',
    model: agent.model || '',
    type: agent.type,
    endpointUrl: agent.endpointUrl || '',
    requestBody: agent.requestBody || '',
    responseProtocol: agent.responseProtocol || 'sse',
    responseContentPath: agent.responseContentPath || '',
    authType: agent.authType || 'none',
    authCredential: '',                                         // 编辑时不回填凭证
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
 * 【Java 类比】≈ POST/PUT /api/agents → AgentController.create() 或 update()
 */
async function handleSubmit() {
  // 前端必填校验
  if (!form.value.name.trim()) { formError.value = '请填写 Agent 名称'; return }
  if (!form.value.type) { formError.value = '请选择 Agent 类型'; return }
  formError.value = ''
  submitting.value = true
  try {
    const payload: Partial<Agent> = {
      name: form.value.name,
      description: form.value.description,
      model: form.value.model,
      type: form.value.type as Agent['type'],
      endpointUrl: form.value.endpointUrl,
      requestBody: form.value.requestBody,
      responseProtocol: form.value.responseProtocol,
      responseContentPath: form.value.responseContentPath,
      authType: form.value.authType,
      authCredential: form.value.authCredential,
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
      <button class="btn-secondary" @click="openCreate">
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
          <div
            class="agent-icon-badge"
            :style="{
              background: getAvatarGradient(getAgentHue(row.name)),
              border: getAvatarBorder(getAgentHue(row.name)),
            }"
          >
            <span class="agent-icon-text">{{ row.name.charAt(0) }}</span>
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
      <div class="bg-white dark:bg-ai-surface rounded-xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 v-if="editTarget" class="text-lg font-bold">编辑 Agent</h2>
        <div class="space-y-3">
          <!-- 基本信息 -->
          <h3 class="text-sm font-bold text-gray-900 dark:text-white">● 基本信息</h3>
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型 *</label>
              <select v-model="form.type" class="input-field">
                <option value="llm">大语言模型</option>
                <option value="multi-modal">多模态</option>
                <option value="tool-use">工具调用</option>
                <option value="code-gen">代码生成</option>
                <option value="rag">RAG</option>
              </select>
            </div>
          </div>
          <!-- 请求格式 -->
          <h3 class="text-sm font-bold text-gray-900 dark:text-white pt-2">● 请求格式</h3>
          <!-- Endpoint -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Endpoint</label>
            <input v-model="form.endpointUrl" class="input-field" placeholder="https://api.example.com/v1/chat" />
          </div>
          <!-- 请求模板 -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">请求模板 JSON <span class="text-xs text-gray-400">（&#123;&#123;messages&#125;&#125; 占位符）</span></label>
            <textarea v-model="form.requestBody" class="input-field" rows="3" placeholder='留空则使用默认 OpenAI 格式' />
          </div>
          <!-- 响应格式 -->
          <h3 class="text-sm font-bold text-gray-900 dark:text-white pt-2">● 响应格式</h3>
          <!-- 响应协议 + 提取路径 -->
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">响应协议</label>
              <select v-model="form.responseProtocol" class="input-field">
                <option value="auto">自动识别</option>
                <option value="sse">SSE 流式</option>
                <option value="json">JSON</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">答案位置</label>
              <input v-model="form.responseContentPath" class="input-field" placeholder="自动识别答案所在字段" />
              <div class="flex flex-wrap gap-1 mt-1.5">
                <button v-for="p in ['choices[0].message.content','choices[0].delta.content','data.text','data.reply','content']" :key="p"
                  class="text-xs px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600 text-gray-500 hover:border-ai-purple hover:text-ai-purple transition-colors font-mono"
                  @click="form.responseContentPath = p;"
                >{{ p }}</button>
              </div>
            </div>
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
                <option value="custom">自定义Header</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">鉴权凭证</label>
              <input v-model="form.authCredential" class="input-field" :placeholder="authPlaceholder" />
            </div>
          </div>
        </div>
        <!-- 按钮 -->
        <div class="flex justify-end gap-3 pt-2">
          <button class="btn-secondary" @click="showCreateDialog = false">取消</button>
          <button class="btn-secondary" :disabled="submitting" @click="handleSubmit">
            {{ submitting ? '保存中...' : '保存' }}
          </button>
        </div>
        <div v-if="formError" class="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{{ formError }}</div>
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

<style scoped>
/* Agent 首字母图标 — 每个Agent根据名称生成唯一色调的淡彩渐变 */
.agent-icon-badge {
  display: flex;
  flex-shrink: 0;
  height: 1.75rem;
  width: 1.75rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.agent-icon-text {
  font-size: 0.75rem;
  font-weight: 700;
  color: #1E3A5F;
}
</style>
