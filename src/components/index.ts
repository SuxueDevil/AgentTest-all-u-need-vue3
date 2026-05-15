/**
 * 全局组件注册
 * =============================================================================
 * 【Java 类比】≈ Spring 的 @Bean 批量注册
 *   把常用的 UI 组件注册为全局组件，这样在任何 .vue 文件中都可以
 *   直接使用 <BentoCard />、<DataTable />，不需要手动 import。
 *
 * 【优缺点】
 *   - 优点：高频组件不用在每个页面 import
 *   - 缺点：全局组件太多会影响编译速度，只把真正高频的放这里
 */
import type { App } from 'vue'
import BentoCard from './common/BentoCard.vue'
import StatCard from './common/StatCard.vue'
import StatusBadge from './common/StatusBadge.vue'
import DataTable from './common/DataTable.vue'
import LoadingSpinner from './common/LoadingSpinner.vue'
import EmptyState from './common/EmptyState.vue'
import DropdownSelect from './common/DropdownSelect.vue'

/**
 * 注册全局组件
 * ---------------------------------------------------------------------------
 * app.component('组件名', 组件对象) ≈ @Bean(name="BentoCard")
 * 注册后全局可用，相当于在模板中自动 import
 */
export function registerGlobalComponents(app: App) {
  app.component('BentoCard', BentoCard)
  app.component('StatCard', StatCard)
  app.component('StatusBadge', StatusBadge)
  app.component('DataTable', DataTable)
  app.component('LoadingSpinner', LoadingSpinner)
  app.component('EmptyState', EmptyState)
  app.component('DropdownSelect', DropdownSelect)
}

// 同时保留命名导出，方便需要显式 import 的场景
export { BentoCard, StatCard, StatusBadge, DataTable, LoadingSpinner, EmptyState }
