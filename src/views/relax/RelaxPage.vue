<!-- 休息页 — 音乐播放器 + 每日一言 + 日历 -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, RefreshCw } from 'lucide-vue-next'

// ==================== 音乐播放器 ====================

interface Track { title: string; artist: string; url: string; cover: string }

const playlist = ref<Track[]>([])
const playlistLoading = ref(true)

const audio = ref<HTMLAudioElement | null>(null)
const currentIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const isMuted = ref(false)
const showPlaylist = ref(false)
const currentTrack = computed(() => playlist.value[currentIndex.value] ?? null)

const progressPercent = computed(() =>
  duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0
)

function initAudio() {
  if (!audio.value) {
    audio.value = new Audio()
    audio.value.volume = volume.value
    audio.value.addEventListener('timeupdate', () => { currentTime.value = audio.value?.currentTime ?? 0 })
    audio.value.addEventListener('loadedmetadata', () => { duration.value = audio.value?.duration ?? 0 })
    audio.value.addEventListener('ended', next)
    audio.value.addEventListener('play', () => { isPlaying.value = true })
    audio.value.addEventListener('pause', () => { isPlaying.value = false })
  }
}

function loadTrack(index: number) {
  initAudio()
  if (!audio.value) return
  currentIndex.value = index
  audio.value.src = playlist.value[index].url
  audio.value.load()
  audio.value.play().catch(() => { /* autoplay blocked */ })
}

function togglePlay() {
  if (!audio.value?.src) { loadTrack(currentIndex.value); return }
  if (audio.value.paused) { audio.value.play().catch(() => {}) }
  else { audio.value.pause() }
}

function prev() { const len = playlist.value.length; if (!len) return; loadTrack((currentIndex.value - 1 + len) % len) }
function next() { const len = playlist.value.length; if (!len) return; loadTrack((currentIndex.value + 1) % len) }

function seek(e: MouseEvent) {
  initAudio()
  if (!audio.value || !duration.value) return
  const bar = e.currentTarget as HTMLElement
  const rect = bar.getBoundingClientRect()
  audio.value.currentTime = ((e.clientX - rect.left) / rect.width) * duration.value
}

function formatTime(sec: number) {
  if (!sec || !isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function toggleMute() {
  initAudio()
  isMuted.value = !isMuted.value
  if (audio.value) audio.value.muted = isMuted.value
}

onUnmounted(() => {
  if (audio.value) { audio.value.pause(); audio.value = null }
})

// ==================== 每日一言 ====================

const quote = ref('')
const quoteAuthor = ref('')
const quoteLoading = ref(true)

async function fetchQuote() {
  quoteLoading.value = true
  try {
    const res = await fetch('https://v1.hitokoto.cn/?c=a&c=b&c=c&c=d&c=e&c=f&c=g&c=h&c=i&c=j&c=k&c=l')
    const data = await res.json()
    quote.value = data.hitokoto
    quoteAuthor.value = data.from || '佚名'
  } catch {
    quote.value = '生活不止眼前的苟且，还有诗和远方。'
    quoteAuthor.value = '高晓松'
  } finally {
    quoteLoading.value = false
  }
}

// ==================== 日历 ====================

const now = new Date()
const calYear = ref(now.getFullYear())
const calMonth = ref(now.getMonth()) // 0-11
const today = now.getDate()

const monthLabel = computed(() => `${calYear.value}年${calMonth.value + 1}月`)

/** 本月日历网格（7列 × 5~6行），多余格子填 null */
const calendarDays = computed(() => {
  const firstDay = new Date(calYear.value, calMonth.value, 1).getDay() // 0=周日
  const daysInMonth = new Date(calYear.value, calMonth.value + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

function prevMonth() { if (calMonth.value === 0) { calYear.value--; calMonth.value = 11 } else { calMonth.value-- } }
function nextMonth() { if (calMonth.value === 11) { calYear.value++; calMonth.value = 0 } else { calMonth.value++ } }

// ==================== 网易云音乐 ====================

async function fetchPlaylist() {
  playlistLoading.value = true
  playlistLoading.value = true
  try {
    const res = await fetch('https://api.injahow.cn/meting/?server=netease&type=playlist&id=3778678')
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0) {
      playlist.value = data.slice(0, 30).map((s: any, i: number) => {
        // 网易云封面: pic 字段或根据 id 拼接，都拿不到用渐变色
        let cover = s.pic || s.cover || ''
        if (!cover && s.id) {
          cover = `https://p2.music.126.net/${s.id}.jpg`
        }
        if (!cover) cover = ''
        return {
          title: s.name || s.title || '未知歌曲',
          artist: s.artist || s.author || '未知歌手',
          url: s.url || '',
          cover,
        }
      })
    }
  } catch { /* 无网兜底 */ }
  finally { playlistLoading.value = false }
}

onMounted(() => {
  fetchQuote()
  fetchPlaylist()
})
</script>

<template>
  <div>
  <!-- 落樱动画 — 粉色细碎花瓣 -->
  <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div v-for="i in 40" :key="i"
      class="sakura-petal"
      :style="{
        left: `${(i * 7 + 3) % 100}%`,
        animationDelay: `${(i * 0.6) % 10}s`,
        animationDuration: `${6 + (i % 6)}s`,
        opacity: 0.4 + (i % 5) * 0.1,
        width: `${4 + (i % 5)}px`,
        height: `${6 + (i % 6)}px`,
        backgroundColor: ['#fbb6ce','#faa0c0','#f8a5c2','#fecdd3','#f9b8d4','#fcc2d8'][i%6],
        borderRadius: `${30 + (i % 40)}% ${70 - (i % 30)}%`,
        transform: `rotate(${i * 33}deg)`,
      }"
    />
  </div>

  <div class="max-w-2xl mx-auto space-y-6 pb-24 relative z-10">
    <!-- 标题 -->
    <div class="text-center pt-4">
      <h1 class="text-2xl font-bold font-heading">☕ 休息一下</h1>
      <p class="text-sm text-gray-400 mt-1">听首歌，看看日历，放松片刻</p>
    </div>

    <!-- 每日一言（无边框） -->
    <div class="text-center space-y-2 py-6">
      <div class="flex items-center justify-center gap-2">
        <button class="p-1 text-gray-400 hover:text-ai-purple transition-colors" title="换一句" @click="fetchQuote">
          <RefreshCw :size="14" :class="{ 'animate-spin': quoteLoading }" />
        </button>
      </div>
      <div v-if="quoteLoading" class="text-gray-400 text-sm">加载中...</div>
      <template v-else>
        <p class="text-xl leading-relaxed text-gray-700 dark:text-gray-200 italic">「{{ quote }}」</p>
        <p class="text-xs text-gray-400">—— {{ quoteAuthor }}</p>
      </template>
    </div>
  </div>

  <!-- 右上角日历 -->
  <div class="fixed top-20 right-6 z-20 bento-card p-3 space-y-1.5 opacity-85 hover:opacity-100 transition-opacity">
    <div class="flex items-center justify-between px-0.5">
      <button class="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        @click="prevMonth"><SkipBack :size="13" /></button>
      <span class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ monthLabel }}</span>
      <button class="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        @click="nextMonth"><SkipForward :size="13" /></button>
    </div>
    <div class="grid grid-cols-7 text-center text-[10px] font-medium text-gray-400">
      <div v-for="d in weekDays" :key="d">{{ d }}</div>
    </div>
    <div class="grid grid-cols-7 text-center gap-0.5">
      <div v-for="(day, idx) in calendarDays" :key="idx"
        class="flex items-center justify-center w-6 h-6 rounded text-xs transition-colors mx-auto"
        :class="[
          !day ? '' :
          day === today && calMonth === now.getMonth() && calYear === now.getFullYear()
            ? 'bg-ai-purple text-white font-bold'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-ai-surface'
        ]"
      >{{ day }}</div>
    </div>
  </div>

  <!-- 音乐播放器：默认只露封面在右下角，hover 滑出完整控件 -->
  <div class="fixed bottom-20 right-0 z-50 group">
    <!-- 播放列表弹出 -->
    <div v-if="showPlaylist && playlist.length" class="absolute bottom-full right-0 mb-2 w-56 max-h-72 overflow-y-auto rounded-2xl bg-white/10 dark:bg-black/10 backdrop-blur-xl shadow-xl border border-white/10 p-2 space-y-0.5">
      <div v-for="(track, i) in playlist" :key="i"
        class="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors"
        :class="i === currentIndex ? 'bg-ai-purple/20 text-ai-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-white/10'"
        @click="loadTrack(i); showPlaylist = false">
        <div class="w-6 h-6 rounded flex-shrink-0" :style="track.cover ? { backgroundImage: `url(${track.cover})`, backgroundSize: 'cover' } : { background: '#e5e7eb' }" />
        <span class="flex-1 truncate">{{ track.title }}</span>
        <span class="text-[10px] text-gray-400">{{ track.artist }}</span>
      </div>
    </div>

    <!-- 播放器主体 -->
    <div
      class="flex items-center gap-2 bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-2xl pl-2 pr-3 py-2 shadow-xl border border-white/20 dark:border-white/10 transition-all duration-300 w-[360px]"
    >
      <!-- 专辑图标 -->
      <div
        class="w-8 h-8 rounded-lg flex-shrink-0"
        :style="(currentTrack && currentTrack.cover) ? { backgroundImage: `url(${currentTrack.cover})`, backgroundSize: 'cover' } : { background: '#e5e7eb' }"
        @click="showPlaylist = !showPlaylist"
      />

      <!-- 曲目信息 + 进度 -->
      <div class="flex-1 min-w-0">
        <p class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ currentTrack?.title ?? '暂无歌曲' }}</p>
        <p class="text-[10px] text-gray-400 truncate">{{ currentTrack?.artist ?? '' }}</p>
        <!-- 进度条 + 时间 -->
        <div class="flex items-center gap-1 mt-0.5">
          <span class="text-[10px] font-mono text-gray-400 w-7 shrink-0">{{ formatTime(currentTime) }}</span>
          <div class="flex-1 h-1.5 rounded-full cursor-pointer overflow-hidden" style="background: rgba(128,128,128,0.25)" @click="seek">
            <div class="h-full rounded-full" style="background: #7C3AED; transition: width 0.3s" :style="{ width: `${progressPercent}%` }" />
          </div>
          <span class="text-[10px] font-mono text-gray-400 w-7 shrink-0">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <!-- 控制按钮：后退 / 播放 / 前进 / 静音 / 列表 -->
      <div class="flex items-center gap-0.5">
        <button class="p-1 text-gray-600 dark:text-gray-300 hover:text-ai-purple" @click="prev"><SkipBack :size="14" /></button>
        <button class="p-1 text-gray-600 dark:text-gray-300 hover:text-ai-purple" @click="togglePlay">
          <Pause v-if="isPlaying" :size="14" />
          <Play v-else :size="14" class="ml-0.5" />
        </button>
        <button class="p-1 text-gray-600 dark:text-gray-300 hover:text-ai-purple" @click="next"><SkipForward :size="14" /></button>
        <button class="p-1 text-gray-600 dark:text-gray-300 hover:text-ai-purple" @click="toggleMute">
          <VolumeX v-if="isMuted" :size="14" />
          <Volume2 v-else :size="14" />
        </button>
      </div>
    </div>
  </div>
  </div> <!-- 单根包裹，确保 page-animate 过渡动画生效 -->
</template>

<style scoped>
@keyframes sakura-fall {
  0%   { transform: translateY(-5vh) rotate(0deg) translateX(0); }
  25%  { transform: translateY(25vh) rotate(90deg) translateX(40px); }
  50%  { transform: translateY(55vh) rotate(180deg) translateX(-30px); }
  75%  { transform: translateY(75vh) rotate(270deg) translateX(20px); }
  100% { transform: translateY(105vh) rotate(360deg) translateX(-10px); }
}

.sakura-petal {
  position: absolute;
  top: -10px;
  animation: sakura-fall linear infinite;
  user-select: none;
}
</style>

<style>
</style>
