<!--
  底部导航栏 — 移动端专用，从 NAV_ITEMS 常量渲染图标式导航。
  固定在页面底部，毛玻璃背景效果。
-->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { NAV_ITEMS } from '@constants'
import {
  LayoutDashboard,
  Bot,
  Cpu,
  BookOpen,
  ClipboardCheck,
  FileText,
} from 'lucide-vue-next'
import type { Component } from 'vue'

const route = useRoute()
const router = useRouter()

/** 图标名 → lucide 组件的映射表 */
const iconMap: Record<string, Component> = {
  LayoutDashboard,
  Bot,
  Cpu,
  BookOpen,
  ClipboardCheck,
  FileText,
}

/** 判断当前路由是否属于指定路径，用于高亮当前导航项 */
const isActive = (path: string) => route.path.startsWith(path)

/** 根据常量中的 icon 名称获取 lucide 组件 */
function getIcon(name: string): Component {
  return iconMap[name] || Bot
}
</script>

<template>
  <nav
    class="bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl"
    :class="[
      'border-white/10 bg-white/5 dark:border-ai-border dark:bg-ai-purple-bg/70',
    ]"
  >
    <div class="mx-auto flex max-w-2xl items-center justify-center gap-1 px-2 py-1">
      <!-- 遍历 NAV_ITEMS 渲染导航按钮 -->
      <button
        v-for="item in NAV_ITEMS"
        :key="item.path"
        class="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-200"
        :class="
          isActive(item.path)
            ? 'text-ai-purple-light'
            : 'text-gray-400 hover:text-gray-200 dark:text-gray-500 dark:hover:text-gray-300'
        "
        @click="router.push(item.path)"
      >
        <div
          class="flex items-center justify-center rounded-lg p-1 transition-all duration-200"
          :class="isActive(item.path) ? 'bg-ai-purple/15' : ''"
        >
          <component :is="getIcon(item.icon)" :size="20" />
        </div>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </nav>
</template>
