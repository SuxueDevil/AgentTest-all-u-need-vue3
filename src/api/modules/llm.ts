/**
 * LLM API 模块 — 与后端 LLMController 对应。
 * 【Java 类比】≈ 前端的 Feign Client，封装 HTTP 请求
 */
import { get, post, put, del } from '../client'
import type { LLM, LLMQueryParams } from '@types'
import type { PageResult } from '@types'

/** GET /api/llms — 分页查询 */
export function list(params: LLMQueryParams) {
  return get<PageResult<LLM>>('/llms', { params })
}

/** GET /api/llms/:id — 查询详情 */
export function detail(id: number) {
  return get<LLM>(`/llms/${id}`)
}

/** POST /api/llms — 创建 */
export function create(data: Partial<LLM>) {
  return post<LLM>('/llms', data)
}

/** PUT /api/llms/:id — 更新 */
export function update(id: number, data: Partial<LLM>) {
  return put<LLM>(`/llms/${id}`, data)
}

/** DELETE /api/llms/:id — 删除 */
export function remove(id: number) {
  return del<void>(`/llms/${id}`)
}
