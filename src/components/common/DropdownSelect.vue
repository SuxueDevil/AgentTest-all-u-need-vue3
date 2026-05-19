<!--
  下拉选择器 — 替代原生 <select>，支持过渡动画和选项样式。

  【Java 类比】≈ 自定义 JComboBox + popup 动画
    原生 select 弹出是 OS 级渲染，无法加样式/动画；
    此处用 div 模拟下拉面板，Teleport 到 body 避免 overflow 裁剪。
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

interface Option {
  value: string | number
  label: string
}

const props = withDefaults(defineProps<{
  modelValue?: string | number
  options: Option[]
  placeholder?: string
  widthClass?: string
  /** 是否显示"全部"清空选项，默认 false（仅筛选栏使用） */
  clearable?: boolean
}>(), {
  modelValue: '',
  placeholder: '请选择',
  widthClass: 'w-full',
  clearable: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
  change: [value: string | number]
}>()

const open = ref(false)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const panelStyle = ref<Record<string, string>>({})

const selectedLabel = computed(() => {
  if (props.modelValue === '' || props.modelValue == null) return props.placeholder
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt?.label ?? props.placeholder
})

const isPlaceholder = computed(() => props.modelValue === '' || props.modelValue == null)

// ==================== 定位 ====================

function updatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  panelStyle.value = {
    top: (rect.bottom + 4) + 'px',
    left: rect.left + 'px',
  }
}

// ==================== 交互 ====================

let closeTimer: ReturnType<typeof setTimeout> | null = null

function openPanel() {
  clearCloseTimer()
  if (open.value) return
  open.value = true
  nextTick(updatePosition)
}

function closePanel() {
  clearCloseTimer()
  open.value = false
}

function toggle() {
  if (open.value) { closePanel() } else { openPanel() }
}

function onTriggerLeave() {
  closeTimer = setTimeout(closePanel, 300)
}

function onPanelEnter() {
  clearCloseTimer()
}

function onPanelLeave() {
  closeTimer = setTimeout(closePanel, 200)
}

function clearCloseTimer() {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

function select(value: string | number) {
  emit('update:modelValue', value)
  emit('change', value)
  closePanel()
}

function onWindowClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  // 点击触发器 → toggle 已处理，不重复关闭
  if (triggerRef.value?.contains(target)) return
  // 点击面板内的选项 → select 已处理
  if (panelRef.value?.contains(target)) return
  closePanel()
}

function onScroll() {
  if (open.value) closePanel()
}

onMounted(() => {
  window.addEventListener('click', onWindowClick, true)
  window.addEventListener('scroll', onScroll)
})
onUnmounted(() => {
  window.removeEventListener('click', onWindowClick, true)
  window.removeEventListener('scroll', onScroll)
  clearCloseTimer()
})
</script>

<template>
  <div class="relative inline-block" :class="widthClass" @mouseleave="onTriggerLeave">
    <!-- 触发器 -->
    <button
      ref="triggerRef"
      type="button"
      class="input-field flex items-center justify-between gap-2 text-left"
      :class="{ 'text-gray-400 dark:text-gray-500': isPlaceholder }"
      @click="toggle"
      @mouseenter="openPanel"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <ChevronDown :size="14" class="flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': open }" />
    </button>

    <!-- 下拉面板 — Teleport 到 body，避免父容器 overflow/clip 裁剪 -->
    <Teleport to="body">
      <Transition name="dd-panel">
        <div
          v-if="open"
          ref="panelRef"
          class="fixed z-[100] rounded-xl border py-1 shadow-xl backdrop-blur-xl bg-white dark:bg-ai-card border-gray-200 dark:border-ai-border w-max"
          :style="panelStyle"
          @mouseenter="onPanelEnter"
          @mouseleave="onPanelLeave"
        >
          <!-- 筛选栏：已选中值时顶部显示"全部"用于清空 -->
          <button
            v-if="clearable && !isPlaceholder"
            type="button"
            class="block text-left px-4 py-2 text-sm whitespace-nowrap transition-colors duration-150 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-ai-surface"
            @click="select('')"
          >
            全部
          </button>
          <div v-if="clearable && !isPlaceholder" class="mx-3 my-0.5 border-t border-gray-100 dark:border-gray-800" />
          <button
            v-for="opt in options"
            :key="opt.value"
            type="button"
            class="block text-left px-4 py-2 text-sm whitespace-nowrap transition-colors duration-150"
            :class="opt.value === modelValue
              ? 'bg-ai-purple/10 text-ai-purple font-medium'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-ai-surface'"
            @click="select(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
/* 过渡动画 — 不用 scoped，因为 Teleport 到 body 后 scoped 选择器不匹配 */
.dd-panel-enter-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dd-panel-leave-active {
  transition: opacity 0.1s ease, transform 0.1s ease;
}
.dd-panel-enter-from {
  opacity: 0;
  transform: translateY(-6px) scaleY(0.95);
}
.dd-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px) scaleY(0.97);
}
</style>
