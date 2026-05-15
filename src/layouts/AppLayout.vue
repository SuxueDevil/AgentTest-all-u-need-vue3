<!--
  应用布局壳 — 顶部 Header + 中间 <slot /> + 底部导航。
  所有页面通过 <router-view> 渲染在 <slot /> 位置。
-->
<script setup lang="ts">
import BottomNav from './BottomNav.vue'
import AppHeader from './AppHeader.vue'
import { useAppStore } from '@stores'

const appStore = useAppStore()
</script>

<template>
  <div
    class="app-layout flex h-screen flex-col overflow-hidden transition-colors duration-300"
    :class="appStore.theme === 'light' ? 'bg-glass-light' : 'bg-ai-surface'"
  >
    <!-- 顶部: Logo + 主题切换 -->
    <AppHeader />
    <!-- 主内容区: flex-1 填充剩余高度，overflow-auto 独立滚动 -->
    <main class="flex-1 overflow-auto px-6 py-6 pb-20">
      <slot />
    </main>
    <!-- 底部导航栏（移动端优先） -->
    <BottomNav />
  </div>
</template>
