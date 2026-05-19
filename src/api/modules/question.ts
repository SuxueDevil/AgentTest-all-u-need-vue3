/**
 * 题库 API 模块 — 封装 /api/questions 的所有 HTTP 请求。
 * 每个方法对应后端 QuestionController 的一个接口。
 */
import { get, post, put, del } from '@api/client'
import type { Question, QuestionQueryParams, PageResult, ImportResult } from '@types'

export const questionApi = {
  /** GET /api/questions — 分页查询 */
  list(params: QuestionQueryParams) {
    return get<PageResult<Question>>('/questions', { params })
  },

  /** GET /api/questions/:id — 查询详情 */
  detail(id: number) {
    return get<Question>(`/questions/${id}`)
  },

  /** POST /api/questions — 创建问题 */
  create(data: Partial<Question>) {
    return post<Question>('/questions', data)
  },

  /** PUT /api/questions/:id — 更新问题 */
  update(id: number, data: Partial<Question>) {
    return put<Question>(`/questions/${id}`, data)
  },

  /** DELETE /api/questions/:id — 删除问题 */
  remove(id: number) {
    return del<void>(`/questions/${id}`)
  },

  /** DELETE /api/questions/batch — 批量删除 */
  batchRemove(ids: number[]) {
    return del<number>('/questions/batch', { data: ids })
  },

  /** POST /api/questions/import — CSV/JSON 文件导入 */
  importFile(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return post<ImportResult>('/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** GET /api/questions/export?format=json — 导出文件，返回下载链接 */
  exportFile(format: 'csv' | 'json' = 'json') {
    return `/api/questions/export?format=${format}`
  },

  /** POST /api/questions/generate — AI 生成题目，turnCount 仅多轮时有效，roleContext 可选角色场景 */
  generate(params: { category: string; difficulty: string; questionType: string; count: number; turnCount?: number; roleContext?: string }) {
    return post<Question[]>('/questions/generate', params)
  },
}
