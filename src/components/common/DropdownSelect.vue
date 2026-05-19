<!--
  下拉选择器 — 替代原生 <select>，支持过渡动画和选项样式。

  交互：
    - 点击触发器 → 切换开/关
    - 鼠标悬停触发器 → 自动展开
    - 鼠标移出 → 300ms 延迟关闭（给时间移到面板上）
    - 鼠标移入面板 → 取消关闭
    - 鼠标移出面板 → 200ms 延迟关闭
    - 点击外部 / 滚动页面 → 立即关闭
    - 选中选项 → 关闭 + emit v-model + change 事件
    - clearable=true 且有选中值时 → 面板顶部显示"全部"清空选项
-->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

/** 下拉选项 — 对应后端枚举或字典条目 */
interface Option {
  value: string | number
  label: string
}

const props = withDefaults(defineProps<{
  /** v-model 绑定值，'' 或 null 时显示 placeholder */
  modelValue?: string | number
  /** 选项列表 */
  options: Option[]
  /** 未选中时的占位文字，如"分类""状态" */
  placeholder?: string
  /** 触发器宽度 Tailwind 类名，如 w-24 w-28 w-full */
  widthClass?: string
  /** 是否显示"全部"清空选项，默认 false（仅筛选栏使用，表单不需要） */
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

// ==================== 状态 ====================

/** 面板是否打开 */
const open = ref(false)
/** 触发器 DOM 引用，用于定位面板 */
const triggerRef = ref<HTMLElement | null>(null)
/** 面板 DOM 引用，用于点击外部检测（替代全局 querySelector） */
const panelRef = ref<HTMLElement | null>(null)
/** 面板内联定位样式（top / left），每次打开时根据触发器位置实时计算 */
const panelStyle = ref<Record<string, string>>({})

/** 触发器显示文字 — 已选中 → label，未选中 → placeholder */
const selectedLabel = computed(() => {
  if (props.modelValue === '' || props.modelValue == null) return props.placeholder
  const opt = props.options.find(o => o.value === props.modelValue)
  return opt?.label ?? props.placeholder
})

/** 是否处于未选中状态（显示 placeholder 灰色态） */
const isPlaceholder = computed(() => props.modelValue === '' || props.modelValue == null)

// ==================== 定位 ====================

/** 根据触发器位置计算面板定位，下方空间不足时自动上翻 */
function updatePosition() {
  if (!triggerRef.value) return
  const rect = triggerRef.value.getBoundingClientRect()
  const estHeight = 280 // 预估面板最大高度（max-h-60 ≈ 240px + padding）
  const spaceBelow = window.innerHeight - rect.bottom

  if (spaceBelow < estHeight && rect.top > estHeight) {
    // 下方不够，翻到触发器上方
    panelStyle.value = {
      top: (rect.top - 4) + 'px',
      left: rect.left + 'px',
      transform: 'translateY(-100%)',
    }
  } else {
    panelStyle.value = {
      top: (rect.bottom + 4) + 'px',
      left: rect.left + 'px',
    }
  }
}

// ==================== 交互 ====================

/** hover 离开后的延迟关闭定时器 */
let closeTimer: ReturnType<typeof setTimeout> | null = null

/** 展开面板并实时定位 */
function openPanel() {
  clearCloseTimer()
  if (open.value) return
  open.value = true
  nextTick(updatePosition)
}

/** 关闭面板并清除定时器 */
function closePanel() {
  clearCloseTimer()
  open.value = false
}

/** 点击触发器 — 切换开/关 */
function toggle() {
  if (open.value) { closePanel() } else { openPanel() }
}

/** 鼠标离开触发器 — 延迟 300ms 关闭，给用户时间移到面板 */
function onTriggerLeave() {
  closeTimer = setTimeout(closePanel, 300)
}

/** 鼠标进入面板 — 取消关闭定时器 */
function onPanelEnter() {
  clearCloseTimer()
}

/** 鼠标离开面板 — 200ms 后关闭 */
function onPanelLeave() {
  closeTimer = setTimeout(closePanel, 200)
}

function clearCloseTimer() {
  if (closeTimer) { clearTimeout(closeTimer); closeTimer = null }
}

/** 选中选项 — emit v-model + change，关闭面板 */
function select(value: string | number) {
  emit('update:modelValue', value)
  emit('change', value)
  closePanel()
}

/** 点击组件外部 → 关闭。通过 triggerRef/panelRef 判断点击目标是否在组件内 */
function onWindowClick(e: MouseEvent) {
  if (!open.value) return
  const target = e.target as Node
  if (triggerRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  closePanel()
}

/** 页面滚动 → 面板位置可能偏移，直接关闭 */
function onScroll() {
  if (open.value) closePanel()
}

onMounted(() => {
  // capture 阶段监听，避免某些元素 stopPropagation 导致漏检
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
    <!-- 触发器按钮 — 复用 input-field 样式，保持与搜索框/下拉框视觉统一 -->
    <button
      ref="triggerRef"
      type="button"
      class="input-field flex items-center gap-2 text-left !pr-3"
      :class="{ 'text-gray-400 dark:text-gray-500': isPlaceholder }"
      @click="toggle"
      @mouseenter="openPanel"
    >
      <span class="truncate">{{ selectedLabel }}</span>
      <ChevronDown :size="14" class="flex-shrink-0 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': open }" />
    </button>

    <!-- 下拉面板 — Teleport 到 body 避免父容器 overflow/clip 裁剪 -->
    <Teleport to="body">
      <Transition name="dd-panel">
        <div
          v-if="open"
          ref="panelRef"
          class="fixed z-[100] rounded-xl border py-1 shadow-xl backdrop-blur-xl bg-white dark:bg-ai-card border-gray-200 dark:border-ai-border w-max max-h-60 overflow-y-auto"
          :style="panelStyle"
          @mouseenter="onPanelEnter"
          @mouseleave="onPanelLeave"
        >
          <!-- 筛选栏 clearable 模式：已选中值时顶部显示"全部"用于清空 -->
          <button
            v-if="clearable && !isPlaceholder"
            type="button"
            class="block text-left px-4 py-2 text-sm whitespace-nowrap transition-colors duration-150 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-ai-surface"
            @click="select('')"
          >
            全部
          </button>
          <div v-if="clearable && !isPlaceholder" class="mx-3 my-0.5 border-t border-gray-100 dark:border-gray-800" />
          <!-- 选项列表 -->
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
/* 面板过渡动画 — 不用 scoped，因为 Teleport 到 body 后 scoped 选择器不匹配 */
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
