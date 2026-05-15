/**
 * API 总出口
 * ---------------------------------------------------------------------------
 * 【Java 类比】≈ 一个 Facade 类，汇总所有 Service 的引用
 */
export { agentApi } from './modules/agent'
export { evaluationApi } from './modules/evaluation'
export { dashboardApi } from './modules/dashboard'
export { questionApi } from './modules/question'
export * as llmApi from './modules/llm'
export * from './client'
