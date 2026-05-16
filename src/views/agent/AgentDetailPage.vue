<!-- Agent 详情页 — 展示配置信息 + 测试连接功能 -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Globe, Shield, Wifi } from 'lucide-vue-next'
import { useAgentStore } from '@stores'
import StatusBadge from '@components/common/StatusBadge.vue'
import LoadingSpinner from '@components/common/LoadingSpinner.vue'

const route = useRoute()
const router = useRouter()
const agentStore = useAgentStore()

/** 连接测试进行中 */
const testing = ref(false)
/** 测试结果 null=未测试 / true=成功 / false=失败 */
const testResult = ref<boolean | null>(null)

/** Agent 类型中文映射 */
const typeLabels: Record<string, string> = {
  llm: '大语言模型', 'multi-modal': '多模态', 'tool-use': '工具调用',
  'code-gen': '代码生成', rag: 'RAG',
}

/** 鉴权方式中文映射 */
const authTypeLabels: Record<string, string> = {
  none: '无鉴权', bearer: 'Bearer Token', api_key: 'API Key', basic: 'Basic Auth',
}

/** 详情加载失败标识（true=接口报错，false=正常） */
const loadError = ref(false)

/** 页面加载时根据路由参数 id 获取 Agent 详情 */
onMounted(async () => {
  try {
    await agentStore.fetchAgentDetail(Number(route.params.id))
  } catch {
    loadError.value = true
  }
})

/** 测试当前 Agent 的 API 连通性 */
async function handleTestConnection() {
  if (!agentStore.currentAgent) return
  testing.value = true
  testResult.value = null
  try {
    testResult.value = await agentStore.testConnection(agentStore.currentAgent.id)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <!-- 加载中 -->
  <div v-if="agentStore.loading" class="flex items-center justify-center py-20">
    <LoadingSpinner />
  </div>

  <!-- 详情内容 -->
  <div v-else-if="agentStore.currentAgent" class="space-y-6">
    <!-- 返回按钮 -->
    <button class="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors" @click="router.push('/agents')">
      <ArrowLeft :size="16" />
      返回列表
    </button>

    <!-- Header: 名称 + 状态 + 测试连接按钮 -->
    <div class="flex items-start justify-between">
      <div class="flex items-start gap-4">
        <!-- 首字母头像 -->
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-ai-purple to-ai-cyan">
          <span class="text-2xl font-bold text-white">{{ agentStore.currentAgent.name.charAt(0) }}</span>
        </div>
        <div>
          <h1 class="text-2xl font-bold font-heading">{{ agentStore.currentAgent.name }}</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-lg">{{ agentStore.currentAgent.description }}</p>
          <div class="flex items-center gap-2 mt-2">
            <StatusBadge :status="agentStore.currentAgent.status" type="agent" />
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ agentStore.currentAgent.model }}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">|</span>
            <span class="text-xs text-gray-400 dark:text-gray-500">{{ typeLabels[agentStore.currentAgent.type] || agentStore.currentAgent.type }}</span>
          </div>
        </div>
      </div>
      <!-- 测试连接按钮 -->
      <button class="btn-secondary" :disabled="testing" @click="handleTestConnection">
        <Wifi :size="16" />
        {{ testing ? '测试中...' : '测试连接' }}
      </button>
    </div>

    <!-- 测试结果提示 -->
    <div v-if="testResult !== null"
      class="rounded-lg p-4 text-sm"
      :class="testResult
        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50'
        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50'">
      {{ testResult ? '连接成功' : '连接失败，请检查 Endpoint 和鉴权配置' }}
    </div>

    <!-- 信息卡片 -->
    <div class="grid grid-cols-2 gap-4">
      <!-- API 配置卡片 -->
      <div class="bento-card-hover p-5 space-y-3">
        <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Globe :size="16" class="text-ai-purple" />
          API 配置
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400 dark:text-gray-500">Endpoint</span>
            <span class="text-gray-700 dark:text-gray-300 font-mono text-xs max-w-[250px] truncate"
              :title="agentStore.currentAgent.endpointUrl">
              {{ agentStore.currentAgent.endpointUrl || '未配置' }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400 dark:text-gray-500">鉴权方式</span>
            <span class="text-gray-700 dark:text-gray-300">{{ authTypeLabels[agentStore.currentAgent.authType] || agentStore.currentAgent.authType }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400 dark:text-gray-500">凭证</span>
            <!-- 凭证不显示原文，仅显示是否已配置 -->
            <span class="text-gray-700 dark:text-gray-300">{{ agentStore.currentAgent.authCredential ? '****' : '未配置' }}</span>
          </div>
        </div>
      </div>

      <!-- 基本信息卡片 -->
      <div class="bento-card-hover p-5 space-y-3">
        <div class="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          <Shield :size="16" class="text-ai-cyan" />
          基本信息
        </div>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-400 dark:text-gray-500">创建时间</span>
            <span class="text-gray-700 dark:text-gray-300">{{ agentStore.currentAgent.createdAt }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400 dark:text-gray-500">更新时间</span>
            <span class="text-gray-700 dark:text-gray-300">{{ agentStore.currentAgent.updatedAt }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 加载出错 -->
  <div v-else-if="loadError" class="flex flex-col items-center justify-center py-20 text-gray-400">
    <p class="text-red-400">加载失败，请确认后端服务已启动</p>
    <button class="btn-secondary mt-4" @click="router.push('/agents')">返回列表</button>
  </div>
  <!-- Agent 不存在 -->
  <div v-else class="flex flex-col items-center justify-center py-20 text-gray-400">
    <p>Agent 不存在</p>
    <button class="btn-secondary mt-4" @click="router.push('/agents')">返回列表</button>
  </div>
</template>
