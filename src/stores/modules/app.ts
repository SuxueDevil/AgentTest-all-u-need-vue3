/**
 * 应用全局 Store — 主题切换
 * =============================================================================
 * 【Java 类比 — Pinia 是什么？】
 *   Pinia Store ≈ Spring 中一个 @Service + 全局单例 Bean + 观察者模式
 *
 *   Pinia 之于 Vue，等同于：
 *   - Spring 的 ApplicationContext（管理全局共享状态）
 *   - Redux 之于 React（集中式状态管理）
 *
 *   核心区别：Store 中的状态是"响应式"（reactive）的，
 *   任何组件读取 store.xxx，当 xxx 变化时，组件自动重新渲染。
 *   无需手动 addListener / notify，框架自动处理。
 *
 * 【Java 类比 — defineStore】
 *   defineStore('app', () => { ... })
 *   第一个参数 'app' 是 Store 的唯一标识（≈ Bean name）
 *   第二个参数是一个返回对象的函数（≈ @Bean 工厂方法）
 *
 * 【Java 类比 — ref】
 *   ref<T>(initialValue) ≈ Java 的 AtomicReference<T>，但它还是"可观察的"
 *   - 读取：theme.value（必须 .value，相当于 .get()）
 *   - 写入：theme.value = 'dark'（相当于 .set("dark")）
 *   - 在 <template> 中自动 .value，所以模板里直接写 theme 即可
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  /**
   * 主题状态 — 从 localStorage 读取，默认 dark
   * ---------------------------------------------------------------------------
   * 泛型 ref<'dark' | 'light'> = 这个 ref 只能是 'dark' 或 'light'
   * 相当于 Java 的：AtomicReference<Theme> where Theme is enum { DARK, LIGHT }
   *
   * localStorage ≈ 浏览器的持久化 KV 存储（≈ 轻量级 Redis / Properties 文件）
   *   getItem(key) → 读取
   *   setItem(key, value) → 写入
   *   数据持久化在浏览器中，关闭页面后不丢失
   */
  const theme = ref<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') || 'dark'
  )

  /** 应用主题到 <html> class，触发 Tailwind dark: 变体 */
  function applyTheme(t: 'dark' | 'light') {
    const root = document.documentElement
    root.classList.remove('dark')
    document.body.classList.remove('bg-ai-surface', 'text-white', 'bg-gray-100', 'text-gray-900')

    if (t === 'dark') {
      root.classList.add('dark')
      document.body.classList.add('bg-ai-surface', 'text-white')
    } else {
      document.body.classList.add('bg-gray-100', 'text-gray-900')
    }
  }

  function setTheme(t: 'dark' | 'light') {
    theme.value = t
    localStorage.setItem('theme', t)
    applyTheme(t)
  }

  /** 切换暗黑/明亮主题 */
  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  applyTheme(theme.value)

  const sidebarCollapsed = ref(false)

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  return { theme, setTheme, toggleTheme, sidebarCollapsed, toggleSidebar }
})
