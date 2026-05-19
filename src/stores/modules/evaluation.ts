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
  /** 最近一次请求的错误信息，成功时为 null */
  const error = ref<string | null>(null)
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
  async function fetchTasks(params?: Partial<EvaluationQueryParams>, silent = false) {
    if (!silent) loading.value = true
    error.value = null
    try {
      if (params) queryParams.value = { ...queryParams.value, ...params }
      const res = await evaluationApi.list(queryParams.value)
      tasks.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.message || '获取任务列表失败'
    } finally {
      if (!silent) loading.value = false
    }
  }

  /**
   * 获取任务详情。
   * 【Java 类比】≈ EvaluationServiceImpl.getById(id)
   */
  async function fetchTaskDetail(id: number) {
    loading.value = true
    error.value = null
    try {
      currentTask.value = await evaluationApi.detail(id)
    } catch (e: any) {
      error.value = e?.message || '获取任务详情失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建评测任务。
   * 【Java 类比】≈ EvaluationServiceImpl.create(dto)
   */
  async function createTask(data: Parameters<typeof evaluationApi.create>[0]) {
    error.value = null
    try {
      const created = await evaluationApi.create(data)
      await fetchTasks()
      return created
    } catch (e: any) {
      error.value = e?.message || '创建任务失败'
      throw e
    }
  }

  /**
   * 更新任务。
   * 【Java 类比】≈ EvaluationServiceImpl.update(id, dto)
   *   若当前详情页正好是更新的任务，同步刷新 currentTask 避免展示过期数据。
   */
  async function updateTask(id: number, data: Partial<EvaluationTask>) {
    error.value = null
    try {
      const updated = await evaluationApi.update(id, data)
      if (currentTask.value?.id === id) currentTask.value = updated
      await fetchTasks()
      return updated
    } catch (e: any) {
      error.value = e?.message || '更新任务失败'
      throw e
    }
  }

  /**
   * 删除任务。
   * 【Java 类比】≈ EvaluationServiceImpl.delete(id)
   */
  async function deleteTask(id: number) {
    error.value = null
    try {
      await evaluationApi.remove(id)
      if (currentTask.value?.id === id) currentTask.value = null
      await fetchTasks()
    } catch (e: any) {
      error.value = e?.message || '删除任务失败'
      throw e
    }
  }

  /**
   * 启动评测。
   * 【Java 类比】≈ EvaluationServiceImpl.start(id)，触发异步执行
   * 注：不自动调用 fetchTasks()，由调用方按需刷新列表（列表页自刷新 / 详情页不需要）
   */
  async function startTask(id: number) {
    error.value = null
    try {
      await evaluationApi.start(id)
    } catch (e: any) {
      error.value = e?.message || '启动评测失败'
      throw e
    }
  }

  /**
   * 取消评测。
   * 【Java 类比】≈ EvaluationServiceImpl.cancel(id)，中断正在执行的任务
   */
  async function restartTask(id: number) {
    error.value = null
    try {
      await evaluationApi.restart(id)
      await fetchTasks()
    } catch (e: any) {
      error.value = e?.message || '重启评测失败'
      throw e
    }
  }

  async function cancelTask(id: number) {
    error.value = null
    try {
      await evaluationApi.cancel(id)
      await fetchTasks()
    } catch (e: any) {
      error.value = e?.message || '取消评测失败'
      throw e
    }
  }

  /**
   * 获取进度 — 用于前端轮询展示进度条。
   * 【Java 类比】≈ EvaluationServiceImpl.getProgress(id)，返回 TaskProgress
   */
  async function fetchProgress(id: number) {
    try {
      progress.value = await evaluationApi.progress(id)
      return progress.value
    } catch (e: any) {
      error.value = e?.message || '获取进度失败'
      return null
    }
  }

  /**
   * 静默刷新所有 running 任务的进度（只调 progress 轻量接口，不走分页查询）。
   * 用于列表页轮询进度条，更新 completedCount 和 status 到现有 tasks 数组上。
   * 【Java 类比】≈ EvaluationServiceImpl.getProgress(id)，返回 TaskProgressVO
   */
  async function refreshRunningProgress() {
    const runningTasks = tasks.value.filter(t => t.status === 'running')
    for (const task of runningTasks) {
      try {
        const p = await evaluationApi.progress(task.id)
        if (p) {
          task.completedCount = p.completedCount
          if (p.status && p.status !== task.status) {
            task.status = p.status as typeof task.status
          }
        }
      } catch { /* 静默忽略单条失败 */ }
    }
  }

  /**
   * 获取评测结果 — 按 Agent 分组返回各维度得分。
   * 【Java 类比】≈ EvaluationServiceImpl.getResults(id)，返回 List<AgentResult>
   */
  async function fetchResults(id: number) {
    error.value = null
    try {
      results.value = await evaluationApi.results(id)
      return results.value
    } catch (e: any) {
      error.value = e?.message || '获取结果失败'
      return []
    }
  }

  return {
    tasks, total, loading, error, currentTask, results, progress, queryParams,
    fetchTasks, fetchTaskDetail, createTask, updateTask, deleteTask,
    startTask, restartTask, cancelTask, fetchProgress, fetchResults, refreshRunningProgress,
  }
})
