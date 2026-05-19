/**
 * LLM 相关类型定义 — 对应后端 LLM 实体 / VO / DTO。
 */

/** LLM 模型 — 对应后端 LLMVO */
export interface LLM {
  id: number
  name: string
  model: string
  endpointUrl: string
  status: LLMStatus
  createdAt: string
  updatedAt: string
}

/** LLM 状态 */
export type LLMStatus = 'active' | 'inactive'

/** LLM 查询参数 — 对应后端 LLMQueryDTO */
export interface LLMQueryParams {
  page: number
  pageSize: number
  keyword?: string
}
