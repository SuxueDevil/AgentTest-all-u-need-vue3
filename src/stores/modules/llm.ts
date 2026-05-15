/**
 * LLM Store — 管理 LLM 模型列表、分页和 CRUD。
 * 【Java 类比】≈ LLMServiceImpl + 前端缓存层
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LLM, LLMQueryParams } from '@types'
import { llmApi } from '@api'

export const useLLMStore = defineStore('llm', () => {
  const llms = ref<LLM[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const queryParams = ref<LLMQueryParams>({ page: 1, pageSize: 20 })

  async function fetchLLMs(params?: Partial<LLMQueryParams>) {
    loading.value = true
    error.value = null
    try {
      if (params) queryParams.value = { ...queryParams.value, ...params }
      const res = await llmApi.list(queryParams.value)
      llms.value = res.data
      total.value = res.total
    } catch (e: any) {
      error.value = e?.message || '获取LLM列表失败'
    } finally {
      loading.value = false
    }
  }

  async function createLLM(data: Partial<LLM>) {
    error.value = null
    try {
      await llmApi.create(data)
      await fetchLLMs()
    } catch (e: any) {
      error.value = e?.message || '创建LLM失败'
      throw e
    }
  }

  async function updateLLM(id: number, data: Partial<LLM>) {
    error.value = null
    try {
      await llmApi.update(id, data)
      await fetchLLMs()
    } catch (e: any) {
      error.value = e?.message || '更新LLM失败'
      throw e
    }
  }

  async function deleteLLM(id: number) {
    error.value = null
    try {
      await llmApi.remove(id)
      await fetchLLMs()
    } catch (e: any) {
      error.value = e?.message || '删除LLM失败'
      throw e
    }
  }

  return { llms, total, loading, error, queryParams,
    fetchLLMs, createLLM, updateLLM, deleteLLM }
})
