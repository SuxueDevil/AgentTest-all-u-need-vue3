/**
 * Agent Store — Pinia 状态管理。
 * 管理 Agent 列表、详情、分页参数和 CRUD 操作。
 * 组件通过此 Store 与后端 API 交互，无需直接调用 agentApi。
 *
 * 使用方式:
 *   const agentStore = useAgentStore()
 *   agentStore.fetchAgents()              // 获取列表
 *   agentStore.fetchAgentDetail(id)       // 获取详情
 *   agentStore.createAgent(data)          // 创建（自动刷新列表）
 *   agentStore.updateAgent(id, data)      // 更新（同步更新 currentAgent + 列表）
 *   agentStore.deleteAgent(id)            // 删除（清除 currentAgent + 刷新列表）
 *   agentStore.testConnection(id)         // 测试连接（不影响列表状态）
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Agent, AgentQueryParams } from '@types'
import { agentApi } from '@api'

export const useAgentStore = defineStore('agent', () => {
  // ==================== 状态 ====================

  /** Agent 列表（当前页数据） */
  const agents = ref<Agent[]>([])
  /** 符合条件的总记录数 */
  const total = ref(0)
  /** 请求进行中的标识，组件据此显示 Loading */
  const loading = ref(false)
  /** 最近一次请求的错误信息，成功时为 null */
  const error = ref<string | null>(null)
  /** 当前选中的 Agent 详情 */
  const currentAgent = ref<Agent | null>(null)
  /** 列表查询参数，组件修改后调用 fetchAgents 生效 */
  const queryParams = ref<AgentQueryParams>({ page: 1, pageSize: 20 })

  // ==================== 计算属性 ====================

  /** 所有状态为 active 的 Agent */
  const activeAgents = computed(() => agents.value.filter((a) => a.status === 'active'))

  // ==================== 操作方法 ====================

  /**
   * 获取 Agent 列表。
   * 传入 params 时合并到当前 queryParams（如翻页、搜索），然后重新请求。
   * loading 在请求前后自动切换，组件通过 agentStore.loading 感知。
   */
  async function fetchAgents(params?: Partial<AgentQueryParams>) {
    loading.value = true
    error.value = null
    try {
      if (params) queryParams.value = { ...queryParams.value, ...params }
      const res = await agentApi.list(queryParams.value)
      agents.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.message || '获取Agent列表失败'
    } finally {
      loading.value = false
    }
  }

  /** 获取单个 Agent 详情，结果写入 currentAgent */
  async function fetchAgentDetail(id: number) {
    loading.value = true
    error.value = null
    try {
      currentAgent.value = await agentApi.detail(id)
    } catch (e: any) {
      error.value = e?.message || '获取Agent详情失败'
    } finally {
      loading.value = false
    }
  }

  /** 创建 Agent，成功后自动刷新列表以保持分页数据一致 */
  async function createAgent(data: Partial<Agent>) {
    error.value = null
    try {
      const created = await agentApi.create(data)
      await fetchAgents()
      return created
    } catch (e: any) {
      error.value = e?.message || '创建Agent失败'
      throw e
    }
  }

  /**
   * 更新 Agent。
   * 若当前详情页恰好是更新的 Agent，同步刷新 currentAgent 避免展示过期数据。
   */
  async function updateAgent(id: number, data: Partial<Agent>) {
    error.value = null
    try {
      const updated = await agentApi.update(id, data)
      if (currentAgent.value?.id === id) currentAgent.value = updated
      await fetchAgents()
      return updated
    } catch (e: any) {
      error.value = e?.message || '更新Agent失败'
      throw e
    }
  }

  /** 删除 Agent，若详情页正在查看该 Agent 则清空 currentAgent */
  async function deleteAgent(id: number) {
    error.value = null
    try {
      await agentApi.remove(id)
      if (currentAgent.value?.id === id) currentAgent.value = null
      await fetchAgents()
    } catch (e: any) {
      error.value = e?.message || '删除Agent失败'
      throw e
    }
  }

  /** 测试 Agent API 连通性，不修改任何列表/详情状态 */
  async function testConnection(id: number) {
    error.value = null
    try {
      return await agentApi.testConnection(id)
    } catch (e: any) {
      error.value = e?.message || '连接测试失败'
      throw e
    }
  }

  return { agents, total, loading, error, currentAgent, queryParams, activeAgents,
    fetchAgents, fetchAgentDetail, createAgent, updateAgent, deleteAgent, testConnection }
})
