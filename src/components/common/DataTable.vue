<!--
  通用数据表格 — 基于 CSS Grid 的响应式表格。
  支持列定义、排序触发、行点击、loading/empty 状态，单元格内容通过具名 slot 自定义渲染。

  【Java 类比】≈ JTable / Thymeleaf th:each 表格渲染 + Spring Data Page 的分页数据载体
    columns  ≈ 列模型定义（类似 @Column 注解）
    data     ≈ PageResult.data（当前页数据列表）
    slot     ≈ 自定义 CellRenderer（每列可单独定制渲染逻辑）

  使用示例:
    <DataTable :columns="columns" :data="list" :loading="loading" @row-click="handleClick">
      <template #cell-name="{ row }">{{ row.name }}</template>
    </DataTable>
-->
<script setup lang="ts" generic="T extends Record<string, unknown>">
import { computed } from 'vue'

const props = defineProps<{
  /** 列定义: key=字段名, label=表头, width=列宽(如"2fr"), sortable=可排序 */
  columns: { key: string; label: string; width?: string; sortable?: boolean }[]
  /** 表格数据（当前页） */
  data: T[]
  /** 加载中标识 */
  loading?: boolean
  /** 空数据时的提示文字 */
  emptyText?: string
}>()

/** 事件: sort — 点击可排序列；rowClick — 点击数据行 */
const emit = defineEmits<{
  sort: [key: string]
  rowClick: [row: T]
}>()

/** 根据列定义动态生成 grid-template-columns */
const gridTemplate = computed(() =>
  props.columns.map((c) => c.width || '1fr').join(' '),
)
</script>

<template>
  <div class="overflow-hidden rounded-xl border border-gray-200 dark:border-ai-border">
    <!-- 表头 -->
    <div
      class="grid items-center gap-4 border-b border-gray-200 dark:border-ai-border bg-white/70 dark:bg-ai-card px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400"
      :style="{ gridTemplateColumns: gridTemplate }"
    >
      <div
        v-for="col in columns"
        :key="col.key"
        class="flex items-center gap-1"
        :class="{ 'cursor-pointer select-none': col.sortable }"
        @click="col.sortable && emit('sort', col.key)"
      >
        <slot :name="`head-${col.key}`">{{ col.label }}</slot>
      </div>
    </div>

    <!-- 数据行 -->
    <div class="divide-y divide-gray-200 dark:divide-ai-border">
      <div
        v-for="(row, idx) in data"
        :key="idx"
        class="grid items-center gap-4 px-4 py-3 text-sm transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
        :class="{ 'cursor-pointer': !!emit }"
        :style="{ gridTemplateColumns: gridTemplate }"
        @click="emit('rowClick', row)"
      >
        <div v-for="col in columns" :key="col.key" class="truncate">
          <!-- 具名 slot 允许自定义列渲染，fallback 为原始值 -->
          <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
            {{ row[col.key] }}
          </slot>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && data.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
      <span class="text-4xl mb-3">📋</span>
      <span class="text-sm">{{ emptyText || '暂无数据' }}</span>
    </div>

    <!-- 加载态 -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <LoadingSpinner />
    </div>
  </div>
</template>
