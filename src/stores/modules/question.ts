/**
 * 题库 Store — 管理问题列表、分页和 CRUD 操作。
 * 【Java 类比】≈ QuestionServiceImpl + 前端缓存层
 *   组件不直接调用 questionApi，而是通过 Store 操作数据并自动同步列表。
 *   相当于 Controller → Service → Mapper 中的 Service 层。
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Question, QuestionQueryParams } from '@types'
import { questionApi } from '@api'

export const useQuestionStore = defineStore('question', () => {
  // ==================== 状态 ====================

  /** 问题列表（当前页数据） */
  const questions = ref<Question[]>([])
  /** 符合条件的总记录数 */
  const total = ref(0)
  /** 请求进行中的标识，组件据此显示 Loading */
  const loading = ref(false)
  /** 最近一次请求的错误信息，成功时为 null */
  const error = ref<string | null>(null)
  /** 列表查询参数，组件修改后调用 fetchQuestions 生效 */
  const queryParams = ref<QuestionQueryParams>({ page: 1, pageSize: 20 })

  // ==================== 操作方法 ====================

  /**
   * 获取问题列表。
   * 【Java 类比】≈ QuestionServiceImpl.page(queryDTO)，返回 PageResult<QuestionVO>
   *
   * @param params 可选的查询参数，传入时与当前 queryParams 合并
   */
  async function fetchQuestions(params?: Partial<QuestionQueryParams>) {
    loading.value = true
    error.value = null
    try {
      if (params) queryParams.value = { ...queryParams.value, ...params }
      const res = await questionApi.list(queryParams.value)
      questions.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.message || '获取问题列表失败'
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建问题，成功后自动刷新列表。
   * 【Java 类比】≈ QuestionServiceImpl.create(dto)，insert 后返回最新分页
   */
  async function createQuestion(data: Partial<Question>) {
    error.value = null
    try {
      await questionApi.create(data)
      await fetchQuestions()
    } catch (e: any) {
      error.value = e?.message || '创建问题失败'
      throw e
    }
  }

  /**
   * 更新问题。
   * 【Java 类比】≈ QuestionServiceImpl.update(id, dto)
   */
  async function updateQuestion(id: number, data: Partial<Question>) {
    error.value = null
    try {
      await questionApi.update(id, data)
      await fetchQuestions()
    } catch (e: any) {
      error.value = e?.message || '更新问题失败'
      throw e
    }
  }

  /**
   * 删除单个问题。
   * 【Java 类比】≈ QuestionServiceImpl.delete(id)
   */
  async function deleteQuestion(id: number) {
    error.value = null
    try {
      await questionApi.remove(id)
      await fetchQuestions()
    } catch (e: any) {
      error.value = e?.message || '删除问题失败'
      throw e
    }
  }

  /**
   * 批量删除，传入 ID 数组。
   * 【Java 类比】≈ QuestionServiceImpl.batchDelete(ids)，返回删除条数
   */
  async function batchDeleteQuestions(ids: number[]) {
    error.value = null
    try {
      await questionApi.batchRemove(ids)
      await fetchQuestions()
    } catch (e: any) {
      error.value = e?.message || '批量删除失败'
      throw e
    }
  }

  async function generateQuestions(params: { category: string; difficulty: string; questionType: string; count: number; turnCount?: number; roleContext?: string }) {
    error.value = null
    try {
      await questionApi.generate(params)
      await fetchQuestions()
    } catch (e: any) {
      error.value = e?.message || 'AI生成题目失败'
      throw e
    }
  }

  return {
    questions, total, loading, error, queryParams,
    fetchQuestions, createQuestion, updateQuestion, deleteQuestion, batchDeleteQuestions,
    generateQuestions,
  }
})
