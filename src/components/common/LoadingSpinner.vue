<!--
  加载动画 — 三个依次闪烁的圆点，用于表格/卡片/页面级的加载态。

  【Java 类比】≈ Swing JProgressBar(INDETERMINATE) 或 Ajax Loading Indicator
    无进度的等待指示器，仅在 loading=true 时渲染该组件即可

  使用示例:
    <LoadingSpinner v-if="loading" />
-->
<template>
  <div class="flex items-center gap-2">
    <!-- 三个圆点，animation-delay 制造依次闪烁的波浪效果 -->
    <div class="flex gap-1">
      <span class="h-2 w-2 animate-pulse-dot rounded-full bg-ai-purple"></span>
      <span class="h-2 w-2 animate-pulse-dot rounded-full bg-ai-purple-light" style="animation-delay: 0.2s"></span>
      <span class="h-2 w-2 animate-pulse-dot rounded-full bg-ai-cyan" style="animation-delay: 0.4s"></span>
    </div>
    <span class="text-xs text-gray-500">加载中...</span>
  </div>
</template>
