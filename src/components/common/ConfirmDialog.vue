<!--
  通用确认弹窗 — 遮罩 + 标题 + 消息 + 确认/取消按钮。
  点击遮罩或取消按钮触发 cancel，点击确认按钮触发 confirm。
  支持 variant 属性区分危险操作（红色）和普通操作（主色）。

  【Java 类比】≈ Swing JOptionPane.showConfirmDialog() 或 Bootstrap Modal
    父组件控制 show 属性（≈ 对话框的可见性），
    子组件通过 emit 通知父组件用户操作（≈ 回调 / EventListener）

  使用示例:
    <ConfirmDialog :show="showDeleteDialog" title="确认删除"
      :message="`确定要删除吗？`" variant="danger"
      @confirm="handleDelete" @cancel="showDeleteDialog = false" />
-->
<script setup lang="ts">
/** 弹窗配置 */
defineProps<{
  /** 是否显示 */
  show: boolean
  /** 标题 */
  title?: string
  /** 提示消息 */
  message?: string
  /** 确认按钮文字，默认"确认" */
  confirmText?: string
  /** 取消按钮文字，默认"取消" */
  cancelText?: string
  /** 加载中，禁用按钮防止重复提交 */
  loading?: boolean
  /** 确认按钮样式: 'danger' 红色 / 'primary' 主色 / 'default' 默认 */
  variant?: 'danger' | 'primary' | 'default'
}>()

/** 事件: confirm — 用户点击确认；cancel — 用户点击取消或遮罩 */
const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <!-- 遮罩层 — @click.self 仅点击遮罩本身触发（不冒泡到内部） -->
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="emit('cancel')">
    <div class="bg-white dark:bg-ai-card rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h3 class="text-lg font-bold">{{ title || '确认操作' }}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">{{ message || '确定要执行此操作吗？' }}</p>
      <!-- 按钮区 -->
      <div class="flex justify-end gap-3 pt-2">
        <button class="btn-secondary" :disabled="loading" @click="emit('cancel')">{{ cancelText || '取消' }}</button>
        <button
          class="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50"
          :class="{
            'bg-red-500 hover:bg-red-600 text-white': variant === 'danger',
            'bg-ai-purple hover:bg-ai-purple/80 text-white': variant === 'primary',
            'btn-secondary': variant === 'default' || !variant,
          }"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? '处理中...' : (confirmText || '确认') }}
        </button>
      </div>
    </div>
  </div>
</template>
