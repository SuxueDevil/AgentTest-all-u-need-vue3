/**
 * 常量定义 — 枚举值的显示文本映射
 * =============================================================================
 * 【Java 类比】≈ 给 Enum 的每个值绑定一个 displayName 属性
 *   enum AgentType { LLM("大语言模型"), MULTI_MODAL("多模态"), ... }
 *
 * 【TS 特性 — as const】
 *   as const 告诉 TS："这个对象的值不会改变，请推导出最精确的类型"。
 *   不加 as const：TS 推导 AGENT_TYPES 为 { llm: string, ... }（宽泛类型）
 *   加了 as const：TS 推导为 { llm: "大语言模型", ... }（精确字面量类型）
 *   类似于 Java 的 final + 泛型精确推断。
 */

/** Agent 类型的显示名称 */
export const AGENT_TYPES = {
  llm: '大语言模型',
  'multi-modal': '多模态',
  'tool-use': '工具调用',
  'code-gen': '代码生成',
  rag: 'RAG检索',
} as const

/** Agent 状态的显示名称 */
export const AGENT_STATUS = {
  active: '运行中',
  inactive: '已停用',
  evaluating: '评测中',
  error: '异常',
} as const

/** 任务状态的显示名称 */
export const TASK_STATUS = {
  pending: '等待中',
  running: '进行中',
  completed: '已完成',
  cancelled: '已取消',
  failed: '失败',
} as const

/** 问题分类的显示名称 */
export const QUESTION_CATEGORIES = {
  reasoning: '推理',
  coding: '编程',
  qa: '问答',
  translation: '翻译',
  summarization: '摘要',
} as const

/** 难度等级的显示名称 */
export const DIFFICULTY_LEVELS = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  mixed: '混合',
} as const

/**
 * 导航菜单配置
 * ---------------------------------------------------------------------------
 * 数组中每个元素的形状由 TS 自动推导（因为 as const），
 * 所以使用时 IDE 会有智能提示。
 * 【Java 类比】≈ List<NavItem> 的静态初始化
 */
export const NAV_ITEMS = [
  { path: '/agents', label: 'Agent管理', icon: 'Bot' },
  { path: '/llms', label: 'LLM模型', icon: 'Cpu' },
  { path: '/dashboard', label: '仪表盘', icon: 'LayoutDashboard' },
  { path: '/questions', label: '题库管理', icon: 'BookOpen' },
  { path: '/evaluation', label: '评测任务', icon: 'ClipboardCheck' },
  { path: '/reports', label: '评测报告', icon: 'FileText' },
] as const
