<!--
  状态标签 — 根据 status 值自动显示对应颜色和中文名称。

  【Java 类比】≈ 枚举的 displayName + CSS class 映射
    相当于 AgentStatus.toBadge() 或 TaskStatus.getLabel()

  支持的状态映射（跨 Agent / 评测任务 / 题库）:
    active=运行中 | inactive=已停用 | evaluating=评测中 | error=异常
    pending=等待中 | running=进行中 | completed=已完成 | cancelled=已取消 | failed=失败
-->
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 状态值（英文 key） */
  status: string
  /** 状态所属类型: agent(Agent状态) / task(评测任务状态) / eval(评测结果) */
  type?: 'agent' | 'task' | 'eval'
}>()

/** 状态 → 显示名 + CSS 类的映射表 */
const statusMap: Record<string, { label: string; cls: string }> = {
  active: { label: '运行中', cls: 'badge-success' },
  inactive: { label: '已停用', cls: 'text-gray-400 bg-gray-500/10' },
  evaluating: { label: '评测中', cls: 'badge-info' },
  error: { label: '异常', cls: 'badge-error' },
  pending: { label: '等待中', cls: 'badge-warning' },
  running: { label: '进行中', cls: 'badge-info' },
  completed: { label: '已完成', cls: 'badge-success' },
  cancelled: { label: '已取消', cls: 'text-gray-400 bg-gray-500/10' },
  failed: { label: '失败', cls: 'badge-error' },
}

/** 根据 status 值计算显示信息，未匹配时 fallback 为原始值 */
const display = computed(() => statusMap[props.status] || { label: props.status, cls: 'badge-info' })
</script>

<template>
  <span :class="display.cls">{{ display.label }}</span>
</template>
