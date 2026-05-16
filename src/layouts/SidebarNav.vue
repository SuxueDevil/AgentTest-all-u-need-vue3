<!--
  侧边导航栏 — 桌面端专用，可折叠。从 NAV_ITEMS 常量渲染导航链接，
  支持折叠/展开动画，当前路由高亮。

  【Java 类比】≈ Spring MVC 的侧边栏 include + @RequestScope 的 activePath 判断
    isActive(path) ≈ request.requestURI.startsWith(path) 高亮当前菜单项
    router.push()  ≈ response.sendRedirect() 跳转页面
-->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@stores'
import { NAV_ITEMS } from '@constants'
import {
  LayoutDashboard,
  Bot,
  MessageSquare,
  ClipboardCheck,
  Database,
  FileText,
  Settings,
  PanelRightOpen,
  PanelLeftClose,
} from 'lucide-vue-next'
import type { Component } from 'vue'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

/** 图标名 → lucide 组件的映射表 */
const iconMap: Record<string, Component> = {
  LayoutDashboard,
  Bot,
  MessageSquare,
  ClipboardCheck,
  Database,
  FileText,
  Settings,
}

/** 判断当前路由是否属于指定路径 */
const isActive = (path: string) => route.path.startsWith(path)

/** 根据常量中的 icon 名称获取 lucide 组件 */
function getIcon(name: string): Component {
  return iconMap[name] || Bot
}
</script>

<template>
  <aside
    class="sidebar fixed left-0 top-0 z-40 flex h-full flex-col border-r border-ai-border transition-all duration-300"
    :class="[
      appStore.sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
      'bg-ai-purple-bg/80 backdrop-blur-lg',
    ]"
  >
    <!-- Logo 区 — 折叠时只显示图标 -->
    <div class="flex h-16 items-center gap-3 border-b border-ai-border px-4">
      <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-ai-purple to-ai-cyan">
        <Bot :size="20" class="text-white" />
      </div>
      <transition name="fade">
        <span
          v-if="!appStore.sidebarCollapsed"
          class="text-lg font-semibold font-heading text-white whitespace-nowrap"
        >
          智能评测
        </span>
      </transition>
    </div>

    <!-- 导航菜单 — 从 NAV_ITEMS 常量动态渲染 -->
    <nav class="flex-1 space-y-1 overflow-y-auto p-3">
      <div v-for="item in NAV_ITEMS" :key="item.path">
        <button
          class="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200"
          :class="
            isActive(item.path)
              ? 'bg-ai-purple/20 text-ai-purple-light shadow-sm'
              : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
          "
          @click="router.push(item.path)"
        >
          <component :is="getIcon(item.icon)" :size="20" />
          <transition name="fade">
            <span v-if="!appStore.sidebarCollapsed" class="whitespace-nowrap">{{ item.label }}</span>
          </transition>
        </button>
      </div>
    </nav>

    <!-- 底部折叠/展开按钮 -->
    <div class="border-t border-ai-border p-3">
      <button
        class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-gray-400 transition-colors hover:bg-white/5 hover:text-gray-200"
        @click="appStore.toggleSidebar()"
      >
        <component
          :is="appStore.sidebarCollapsed ? PanelRightOpen : PanelLeftClose"
          :size="20"
        />
        <transition name="fade">
          <span v-if="!appStore.sidebarCollapsed">收起菜单</span>
        </transition>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
