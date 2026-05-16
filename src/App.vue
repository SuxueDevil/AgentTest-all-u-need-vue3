<script setup lang="ts">
import { useAppStore } from '@stores/modules/app'
import AppLayout from '@layouts/AppLayout.vue'

const appStore = useAppStore()
</script>

<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
