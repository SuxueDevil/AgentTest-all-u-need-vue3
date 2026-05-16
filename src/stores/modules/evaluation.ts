/**
 * 评测 Store — 管理评测任务、进度轮询、结果查询。
 * 【Java 类比】≈ EvaluationServiceImpl + 前端状态缓存
 *   封装了任务 CRUD + 启动/取消 + 进度轮询 + 结果查询的完整流程，
 *   组件只需调用 Store 方法，无需关心 API 细节。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { EvaluationTask, EvaluationQueryParams, AgentResult, TaskProgress } from '@types'
import { evaluationApi } from '@api'

export const useEvaluationStore = defineStore('evaluation', () => {
  // ==================== 状态 ====================

  /** 任务列表 */
  const tasks = ref<EvaluationTask[]>([])
  /** 任务总数 */
  const total = ref(0)
  /** 加载中 */
  const loading = ref(false)
  /** 当前查看的任务详情 */
  const currentTask = ref<EvaluationTask | null>(null)
  /** 当前任务的评测结果（按 Agent 分组） */
  const results = ref<AgentResult[]>([])
  /** 进度信息（用于轮询展示） */
  const progress = ref<TaskProgress | null>(null)
  /** 查询参数 */
  const queryParams = ref<EvaluationQueryParams>({ page: 1, pageSize: 20 })

  // ==================== 操作方法 ====================

  /**
   * 获取任务列表。
   * 【Java 类比】≈ EvaluationServiceImpl.page(queryDTO)
   */
  async function fetchTasks(params?: Partial<EvaluationQueryParams>) {
    loading.value = true
    try {
      if (params) queryParams.value = { ...queryParams.value, ...params }
      const res = await evaluationApi.list(queryParams.value)
      tasks.value = res.data
      total.value = res.total
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取任务详情。
   * 【Java 类比】≈ EvaluationServiceImpl.getById(id)
   */
  async function fetchTaskDetail(id: number) {
    loading.value = true
    try {
      currentTask.value = await evaluationApi.detail(id)
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建评测任务。
   * 【Java 类比】≈ EvaluationServiceImpl.create(dto)
   */
  async function createTask(data: Parameters<typeof evaluationApi.create>[0]) {
    const created = await evaluationApi.create(data)
    await fetchTasks()
    return created
  }

  /**
   * 更新任务。
   * 【Java 类比】≈ EvaluationServiceImpl.update(id, dto)
   *   若当前详情页正好是更新的任务，同步刷新 currentTask 避免展示过期数据。
   */
  async function updateTask(id: number, data: Partial<EvaluationTask>) {
    const updated = await evaluationApi.update(id, data)
    if (currentTask.value?.id === id) currentTask.value = updated
    await fetchTasks()
    return updated
  }

  /**
   * 删除任务。
   * 【Java 类比】≈ EvaluationServiceImpl.delete(id)
   */
  async function deleteTask(id: number) {
    await evaluationApi.remove(id)
    if (currentTask.value?.id === id) currentTask.value = null
    await fetchTasks()
  }

  /**
   * 启动评测。
   * 【Java 类比】≈ EvaluationServiceImpl.start(id)，触发异步执行
   */
  async function startTask(id: number) {
    await evaluationApi.start(id)
    await fetchTasks()
  }

  /**
   * 取消评测。
   * 【Java 类比】≈ EvaluationServiceImpl.cancel(id)，中断正在执行的任务
   */
  async function restartTask(id: number) {
    await evaluationApi.restart(id)
    await fetchTasks()
  }

  async function cancelTask(id: number) {
    await evaluationApi.cancel(id)
    await fetchTasks()
  }

  /**
   * 获取进度 — 用于前端轮询展示进度条。
   * 【Java 类比】≈ EvaluationServiceImpl.getProgress(id)，返回 TaskProgress
   */
  async function fetchProgress(id: number) {
    progress.value = await evaluationApi.progress(id)
    return progress.value
  }

  /**
   * 获取评测结果 — 按 Agent 分组返回各维度得分。
   * 【Java 类比】≈ EvaluationServiceImpl.getResults(id)，返回 List<AgentResult>
   */
  async function fetchResults(id: number) {
    results.value = await evaluationApi.results(id)
    return results.value
  }

  return {
    tasks, total, loading, currentTask, results, progress, queryParams,
    fetchTasks, fetchTaskDetail, createTask, updateTask, deleteTask,
    startTask, restartTask, cancelTask, fetchProgress, fetchResults,
  }
})
