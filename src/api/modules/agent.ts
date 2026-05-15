/**
 * Agent API 模块 — 封装 /api/agents 的所有 HTTP 请求。
 * 每个方法对应后端 AgentController 的一个接口。
 * 调用方通过 agentApi.xxx() 发起请求，返回值已经过 client.ts 响应拦截器解包。
 */
import { get, post, put, del } from '@api/client'
import type { Agent, AgentQueryParams, PageResult } from '@types'

export const agentApi = {
  /** GET /api/agents — 分页查询，支持 keyword/type/status 筛选 */
  list(params: AgentQueryParams) {
    return get<PageResult<Agent>>('/agents', { params })
  },

  /** GET /api/agents/:id — 查询详情 */
  detail(id: number) {
    return get<Agent>(`/agents/${id}`)
  },

  /** POST /api/agents — 创建 Agent */
  create(data: Partial<Agent>) {
    return post<Agent>('/agents', data)
  },

  /** PUT /api/agents/:id — 更新 Agent（支持部分更新） */
  update(id: number, data: Partial<Agent>) {
    return put<Agent>(`/agents/${id}`, data)
  },

  /** DELETE /api/agents/:id — 删除 Agent */
  remove(id: number) {
    return del<void>(`/agents/${id}`)
  },

  /** POST /api/agents/:id/test-connection — 向 Agent endpoint 发送 ping 测试连通性 */
  testConnection(id: number) {
    return post<boolean>(`/agents/${id}/test-connection`)
  },
}
