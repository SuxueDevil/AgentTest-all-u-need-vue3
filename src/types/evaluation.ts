/**
 * 评测任务类型定义 — 对齐 5 表设计中的 evaluation_task / evaluation_result。
 * questionIds/agentIds/dimensions 用 JSON 列，无独立 dataset 表。
 */

/** 维度配置 — 对应 evaluation_task.dimensions JSON */
export interface DimensionConfig {
  /** 维度标识（如 accuracy） */
  name: string
  /** 显示名称（如 准确性） */
  displayName: string
  /** 权重 0-1 */
  weight: number
  /** 通过阈值 0-1 */
  threshold: number
}

/** 评测任务 — 对应 evaluation_task 表 */
export interface EvaluationTask {
  id: number
  name: string
  description: string
  /** 题目 ID 列表 */
  questionIds: number[]
  /** 参评 Agent ID 列表 */
  agentIds: number[]
  /** 维度配置 */
  dimensions: DimensionConfig[]
  /** 题目总数 */
  questionCount: number
  /** 已完成数 */
  completedCount: number
  status: TaskStatus
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'cancelled' | 'failed'

/** 查询参数 */
export interface EvaluationQueryParams {
  page: number
  pageSize: number
  status?: TaskStatus
}

/** 进度 — GET /progress */
export interface TaskProgress {
  status: TaskStatus
  questionCount: number
  completedCount: number
}

/** 维度得分 — 对应 evaluation_result.dimension_scores JSON */
export interface DimensionScore {
  dimensionName: string
  score: number
  feedback: string
}

/** 单题结果明细 */
export interface ResultItem {
  questionId: number
  questionTitle: string
  score: number
  passed: boolean
  latencyMs: number
  tokensUsed: number
  /** Agent 原始回答（截断前500字） */
  rawResponse: string
  /** 各维度得分 + Judge 反馈理由 */
  dimensionScores: DimensionScore[]
}

/** Agent 评测结果 — GET /results 返回 */
export interface AgentResult {
  agentId: number
  agentName: string
  overallScore: number
  passed: boolean
  avgLatencyMs: number
  totalTokens: number
  dimensionScores: DimensionScore[]
  items: ResultItem[]
}
