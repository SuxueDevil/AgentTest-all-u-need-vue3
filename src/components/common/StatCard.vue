<!--
  统计卡片 — 仪表盘专用，展示单条指标（标签 + 数值 + 趋势）。

  【Java 类比】≈ DashboardService.getStats() 返回的单个指标渲染组件
    类似 Spring MVC 中一个 ModelAttribute + Thymeleaf 模板片段

  使用示例:
    <StatCard label="活跃Agent" :value="12" trend="↑ 12%" trend-type="up" :icon="Bot" />
-->
<script setup lang="ts">
import type { Component } from 'vue'

/** 统计卡片配置 */
defineProps<{
  /** 指标名称 */
  label: string
  /** 指标数值（已格式化） */
  value: string | number
  /** 趋势文字，如 "↑ 12%" */
  trend?: string
  /** 趋势方向: up=涨(绿) / down=跌(红) / neutral=持平(灰) */
  trendType?: 'up' | 'down' | 'neutral'
  /** 图标组件（lucide-vue-next 的 Component 类型） */
  icon: Component
}>()
</script>

<template>
  <div class="bento-card-hover flex items-start gap-4">
    <!-- 图标容器 — 半透明紫色背景 -->
    <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-ai-purple/15">
      <component :is="icon" :size="22" class="text-ai-purple-light" />
    </div>
    <div class="flex-1 min-w-0">
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">{{ label }}</p>
      <p class="stat-value text-2xl">{{ value }}</p>
      <!-- 趋势指示 -->
      <p v-if="trend" class="mt-1 text-xs" :class="{
        'text-eval-pass': trendType === 'up',
        'text-eval-fail': trendType === 'down',
        'text-gray-400': trendType === 'neutral',
      }">
        {{ trend }}
      </p>
    </div>
  </div>
</template>
