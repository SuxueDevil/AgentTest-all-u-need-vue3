/**
 * 评测任务 API 模块 — 封装 /api/evaluation 的所有 HTTP 请求。
 * 对应后端 EvaluationController 的 9 个接口。
 */
import { get, post, put, del } from '@api/client'
import type { EvaluationTask, EvaluationQueryParams, AgentResult, TaskProgress, PageResult } from '@types'

export const evaluationApi = {
  /** GET /api/evaluation — 分页查询任务列表 */
  list(params: EvaluationQueryParams) {
    return get<PageResult<EvaluationTask>>('/evaluation', { params })
  },

  /** GET /api/evaluation/:id — 查询任务详情 */
  detail(id: number) {
    return get<EvaluationTask>(`/evaluation/${id}`)
  },

  /** POST /api/evaluation — 创建评测任务 */
  create(data: {
    name: string
    description: string
    questionIds: number[]
    agentIds: number[]
    llmIds?: number[]
    dimensions: { name: string; displayName: string; weight: number; threshold: number }[]
  }) {
    return post<EvaluationTask>('/evaluation', data)
  },

  /** PUT /api/evaluation/:id — 更新任务 */
  update(id: number, data: Partial<EvaluationTask>) {
    return put<EvaluationTask>(`/evaluation/${id}`, data)
  },

  /** DELETE /api/evaluation/:id — 删除任务 */
  remove(id: number) {
    return del<void>(`/evaluation/${id}`)
  },

  /** POST /api/evaluation/:id/start — 启动评测（长超时：多轮对话耗时较长） */
  start(id: number) {
    return post<void>(`/evaluation/${id}/start`, undefined, { timeout: 600000 })
  },

  /** POST /api/evaluation/:id/restart — 重新开始（长超时：多轮对话耗时较长） */
  restart(id: number) {
    return post<void>(`/evaluation/${id}/restart`, undefined, { timeout: 600000 })
  },

  /** POST /api/evaluation/:id/cancel — 取消评测 */
  cancel(id: number) {
    return post<void>(`/evaluation/${id}/cancel`)
  },

  /** GET /api/evaluation/:id/progress — 进度轮询 */
  progress(id: number) {
    return get<TaskProgress>(`/evaluation/${id}/progress`)
  },

  /** GET /api/evaluation/:id/results — 结果查询（按 Agent 分组） */
  results(id: number) {
    return get<AgentResult[]>(`/evaluation/${id}/results`)
  },
}
