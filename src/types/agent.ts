/**
 * Agent 相关类型定义 — 与后端 com.agenttest.pojo 包下的 VO / DTO 对应。
 * 前端通过这些接口获得类型提示，编译期即可发现字段不匹配。
 */

/**
 * Agent 实体 — 对应后端 AgentVO。
 * 注意: 详情接口不返回 authCredential（后端 VO 已脱敏），
 * 仅创建/编辑时前端可传入此字段。
 */
export interface Agent {
  id: number
  name: string
  description: string
  model: string
  type: AgentType
  status: AgentStatus
  /** Agent API 端点 URL */
  endpointUrl: string
  /** 请求模板 JSON，{{messages}} 占位符 */
  requestBody: string
  /** 响应协议: sse / json / auto */
  responseProtocol: string
  /** 响应内容提取路径，如 choices[0].message.content */
  responseContentPath: string
  /** 鉴权方式（不含凭证值） */
  authType: string
  /** 鉴权凭证（仅创建/编辑表单填写，列表和详情不返回） */
  authCredential: string
  createdAt: string
  updatedAt: string
}

/** Agent 类型 — 对应数据库 agent.type 字段 */
export type AgentType = 'llm' | 'multi-modal' | 'tool-use' | 'code-gen' | 'rag'

/** Agent 状态 — 对应数据库 agent.status 字段 */
export type AgentStatus = 'active' | 'inactive' | 'evaluating' | 'error'

/**
 * Agent 列表查询参数 — 对应后端 AgentQueryDTO。
 * page 和 pageSize 必传（有默认值），其余可选。
 */
export interface AgentQueryParams {
  page: number
  pageSize: number
  /** 模糊搜索，匹配 name 和 description */
  keyword?: string
  /** 按类型筛选 */
  type?: AgentType
  /** 按状态筛选 */
  status?: AgentStatus
}

/** 分页结果 — 对应后端 PageResult<T> */
export interface PageResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
