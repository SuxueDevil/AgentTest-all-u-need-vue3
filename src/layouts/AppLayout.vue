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
    <AppHeader />
    <main class="flex-1 overflow-auto px-6 py-6 pb-20">
      <slot />
    </main>
    <BottomNav />
  </div>
</template>
