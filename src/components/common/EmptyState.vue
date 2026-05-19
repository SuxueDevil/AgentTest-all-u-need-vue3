<!--
  空状态占位 — 当列表/搜索无结果时展示友好提示，避免空白页面。

  【Java 类比】≈ Collections.emptyList() 检查后的友好提示视图
    相当于 Spring MVC 中 model.isEmpty() 时渲染的提示片段

  使用示例:
    <EmptyState :icon="FileText" title="暂无数据" description="去创建第一条记录吧">
      <button class="btn-secondary">新建</button>
    </EmptyState>
-->
<script setup lang="ts">
import type { Component } from 'vue'

/** 空状态配置 */
defineProps<{
  /** 图标组件（lucide-vue-next） */
  icon?: Component
  /** 主标题，默认"暂无数据" */
  title?: string
  /** 副标题描述 */
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20">
    <div v-if="icon" class="mb-4 text-gray-600">
      <component :is="icon" :size="48" />
    </div>
    <h3 class="text-lg font-medium text-gray-400">{{ title || '暂无数据' }}</h3>
    <p class="mt-1 text-sm text-gray-500">{{ description || '当前没有可显示的内容' }}</p>
    <!-- 插槽用于放置操作按钮（如"新建"） -->
    <slot />
  </div>
</template>
