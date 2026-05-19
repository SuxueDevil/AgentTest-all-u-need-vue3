/**
 * 前端路由配置 — URL 与页面组件的映射
 * =============================================================================
 * 【Java 类比】≈ Spring MVC 的 @RequestMapping + Controller 映射
 *   但关键区别是：前端路由全部在浏览器端完成，
 *   切换页面不会请求服务器，只是替换 DOM 内容。
 *
 * 【核心概念 — 前端路由（SPA 单页应用）】
 *   浏览器地址栏 URL 变化 → Vue Router 拦截 → 匹配对应组件 → 渲染到页面
 *   整个过程没有 HTTP 请求，页面不刷新。
 *   相当于：浏览器内的 URL 分发器。
 *
 * 【Java 类比 — RouteRecordRaw】
 *   routes 数组 ≈ 一个 Controller 中所有 @GetMapping 的集合
 *   每个元素 = path(URL模式) + component(返回的视图)
 *   meta = 路由元数据（附加信息，如标题、图标）
 */
import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由表 — 定义所有 URL 与组件的映射关系
 * ---------------------------------------------------------------------------
 * async component: () => import('...') 是"懒加载"（Lazy Loading）
 *   只有首次访问该路由时才下载对应的 JS 文件。
 *   相当于 Java 中 Class.forName("...").newInstance() — 按需加载。
 *   不加懒加载的话，所有页面代码会打包在一起，首屏加载很慢。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard', // 根路径自动跳转到仪表盘
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@views/dashboard/DashboardPage.vue'),
    meta: { title: '仪表盘', icon: 'LayoutDashboard' },
  },
  {
    path: '/agents',
    name: 'Agents',
    component: () => import('@views/agent/AgentListPage.vue'),
    meta: { title: 'Agent管理', icon: 'Bot' },
  },
  {
    path: '/llms',
    name: 'LLMs',
    component: () => import('@views/llm/LLMListPage.vue'),
    meta: { title: 'LLM模型', icon: 'Cpu' },
  },
  {
    path: '/agents/:id',
    // :id 是动态路由参数（Path Variable）
    // 例如 /agents/123 → 组件内通过 route.params.id 获取 "123"
    // 相当于 @GetMapping("/agents/{id}") + @PathVariable
    name: 'AgentDetail',
    component: () => import('@views/agent/AgentDetailPage.vue'),
    meta: { title: 'Agent详情', icon: 'Bot', hidden: true },
    // hidden: true = 不在导航菜单中显示（详情页是二级页面）
  },
  {
    path: '/evaluation',
    name: 'Evaluation',
    component: () => import('@views/evaluation/EvaluationPage.vue'),
    meta: { title: '评测任务', icon: 'ClipboardCheck' },
  },
  {
    path: '/evaluation/:id',
    name: 'EvaluationDetail',
    component: () => import('@views/evaluation/EvaluationDetailPage.vue'),
    meta: { title: '评测详情', icon: 'ClipboardCheck', hidden: true },
  },

  {
    path: '/questions',
    name: 'Questions',
    component: () => import('@views/question/QuestionListPage.vue'),
    meta: { title: '题库管理', icon: 'BookOpen' },
  },

  {
    path: '/reports',
    name: 'Reports',
    component: () => import('@views/report/ReportPage.vue'),
    meta: { title: '评测报告', icon: 'FileText' },
  },
  {
    path: '/relax',
    name: 'Relax',
    component: () => import('@views/relax/RelaxPage.vue'),
    meta: { title: '休息一下', icon: 'Coffee' },
  },
  {
    /**
     * 404 兜底路由 — 匹配所有未被上面路由处理的路径
     * ---------------------------------------------------------------------------
     * path: '/:pathMatch(.*)*' 是 Vue Router 4 的通配符语法
     *   相当于 Spring MVC 中最后注册的 catch-all 路由
     */
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@views/error/NotFoundPage.vue'),
    meta: { title: '404', hidden: true },
  },
]

/**
 * 创建 Router 实例
 * ---------------------------------------------------------------------------
 * createWebHistory() — 使用 HTML5 History 模式（URL 无 # 号，更干净）
 *   需要服务器配置 fallback 到 index.html
 *   如果服务器不支持，可用 createWebHashHistory()（URL 带 #，无需服务器配合）
 *
 * scrollBehavior — 切换路由时回到页面顶部
 */
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

/**
 * 全局路由守卫 — 在每次路由切换前执行
 * ---------------------------------------------------------------------------
 * 【Java 类比】≈ Spring 的 Interceptor / Filter
 *   可以用来做权限校验、埋点、标题更新等
 *
 *   这里做的事情：
 *   to.meta.title 来自路由表中定义的 meta.title
 *   每次进入新页面，自动更新浏览器标签标题为 "页面标题 | 应用名"
 */
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title} | Test-All-u-Need`
  next() // 放行，相当于 FilterChain.doFilter()
})

export default router
