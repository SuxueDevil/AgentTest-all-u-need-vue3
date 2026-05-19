/**
 * HTTP 客户端 — 基于 Axios 封装。
 * - 统一 baseURL、超时、请求头
 * - 请求拦截器: 自动附带 Token
 * - 响应拦截器: 自动解包后端 ApiResponse<T>，调用方直接拿到 data
 */
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { appConfig } from '@config'

/** Axios 实例 — 预配置 baseURL / timeout / Content-Type */
const instance: AxiosInstance = axios.create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

/** 请求拦截器: 从 localStorage 读取 token 并注入 Authorization 头 */
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

/**
 * 响应拦截器:
 * 1. 自动解包后端 Response<T> 格式 — 判断 body.code === 200 且有 data 字段，直接返回 body.data
 * 2. 401 时清除 token 并跳转登录
 */
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data
    // 后端统一返回 { code, message, data }，这里自动解包到 data
    if (body && typeof body.code === 'number' && 'data' in body) {
      if (body.code !== 200) {
        return Promise.reject(new Error(body.message || '请求失败'))
      }
      return body.data
    }
    return body
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

/** GET 请求，返回 Promise<T> */
export async function get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return instance.get(url, config) as Promise<T>
}

/** POST 请求 */
export async function post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return instance.post(url, data, config) as Promise<T>
}

/** PUT 请求 */
export async function put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return instance.put(url, data, config) as Promise<T>
}

/** DELETE 请求（del 避免与 JS 保留字冲突） */
export async function del<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return instance.delete(url, config) as Promise<T>
}

export default instance
