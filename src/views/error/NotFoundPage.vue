<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Home } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-32">
    <div class="text-8xl font-bold font-heading stat-value mb-4">404</div>
    <h2 class="text-xl text-gray-600 dark:text-gray-300 mb-2">页面不存在</h2>
    <p class="text-sm text-gray-400 dark:text-gray-500 mb-6">您访问的页面已被移除或URL不正确</p>
    <button class="btn-secondary" @click="router.push('/dashboard')">
      <Home :size="16" />
      返回首页
    </button>
  </div>
</template>
