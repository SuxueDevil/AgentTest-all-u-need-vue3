/**
 * 题库相关类型定义 — 与后端 QuestionVO / DTO 对应。
 * Turn 对应 Question.Turn 内嵌类，questionType 区分单轮/多轮。
 */

/** 多轮对话中的单轮 */
export interface Turn {
  /** 轮次序号，从 1 开始 */
  turnOrder: number
  /** 角色: user / assistant */
  role: 'user' | 'assistant'
  /** 消息内容 */
  content: string
}

/** 问题实体 — 对应后端 QuestionVO */
export interface Question {
  id: number
  /** 问题标题 */
  title: string
  /** 分类: reasoning / coding / qa / translation / summarization */
  category: QuestionCategory
  /** 难度: easy / medium / hard */
  difficulty: DifficultyLevel
  /** 单轮 / 多轮 */
  questionType: QuestionType
  /** 多轮对话内容，单轮时为空数组 */
  turns: Turn[]
  /** 期望答案（评分参考） */
  expectedAnswer: string
  /** 标签列表 */
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type QuestionCategory = 'reasoning' | 'coding' | 'qa' | 'translation' | 'summarization'
export type DifficultyLevel = 'easy' | 'medium' | 'hard'
export type QuestionType = 'single' | 'multi'

/** 问题列表查询参数 — 对应后端 QuestionQueryDTO */
export interface QuestionQueryParams {
  page: number
  pageSize: number
  /** 模糊匹配 title */
  keyword?: string
  /** 按分类筛选 */
  category?: QuestionCategory
  /** 按难度筛选 */
  difficulty?: DifficultyLevel
  /** 按类型筛选 */
  questionType?: QuestionType
}

/** 导入结果 — 对应后端 importQuestions 返回的 Map */
export interface ImportResult {
  successCount: number
  failCount: number
  errors: { row: number; message: string }[]
}
