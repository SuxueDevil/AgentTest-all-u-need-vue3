<script setup lang="ts">
import AppLayout from '@layouts/AppLayout.vue'
</script>

<template>
  <AppLayout>
    <router-view v-slot="{ Component, route }">
      <component :is="Component" :key="route.path" class="page-animate" />
    </router-view>
  </AppLayout>
</template>

<style>
/* 页面切换动画 — 原生 CSS animation，绕过 Vue transition 的渲染时机问题 */
.page-animate {
  animation: page-in 0.6s ease;
}

@keyframes page-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}
</style>
