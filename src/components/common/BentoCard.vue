<!--
  栅格卡片 — Bento Grid 布局的基础单元。
  通过 cols/rows 控制卡片在网格中的跨度，类似 CSS Grid 的 grid-column/grid-row。

  【Java 类比】≈ JPanel + GridBagConstraints 的封装，控件在网格布局中的占位规则

  使用示例:
    <BentoCard title="统计" :cols="2" :rows="1">
      <StatCard ... />
    </BentoCard>
-->
<script setup lang="ts">
/** 卡片配置 */
defineProps<{
  /** 卡片标题，显示在顶部 */
  title?: string
  /** 网格列跨度（1=默认宽度，2=占两列） */
  cols?: number
  /** 网格行跨度（1=默认高度，2=占两行） */
  rows?: number
  /** 禁止 overflow:hidden，需要内容溢出（如 Dropdown）时设为 true */
  noOverflow?: boolean
}>()
</script>

<template>
  <div
    class="bento-card-hover flex flex-col"
    :class="{ 'overflow-hidden': !noOverflow }"
    :style="{
      gridColumn: cols ? `span ${cols}` : undefined,
      gridRow: rows ? `span ${rows}` : undefined,
    }"
  >
    <!-- 标题区 -->
    <div v-if="title" class="mb-4 text-sm font-medium text-gray-500 dark:text-gray-400 shrink-0">{{ title }}</div>
    <!-- 内容区 — flex-1 填充剩余空间 -->
    <div class="flex-1 min-h-0" :class="{ 'overflow-y-auto': !noOverflow }">
      <slot />
    </div>
  </div>
</template>
