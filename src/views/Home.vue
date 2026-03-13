<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useFileStore } from '../composables/useFileStore'
import Sidebar from '../components/Sidebar.vue'
import MarkdownPreview from '../components/MarkdownPreview.vue'

const {
  currentFile,
  currentFolder,
  loadFolders,
  hasPrevFile,
  hasNextFile,
  prevFile,
  nextFile,
  currentFileIndex,
  files
} = useFileStore()

const sidebarOpen = ref(false)
const isMobile = ref(false)
const contentAreaRef = ref<HTMLDivElement | null>(null)
const isDark = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarOpen.value = true
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDark.value = true
  } else if (savedTheme === 'light') {
    isDark.value = false
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  document.documentElement.classList.toggle('dark', isDark.value)

  checkMobile()
  window.addEventListener('resize', checkMobile)
  // 初始化加载
  loadFolders()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const toggleSidebar = () => {
  sidebarOpen.value = !sidebarOpen.value
}

const closeSidebar = () => {
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.classList.toggle('dark', isDark.value)
}

const scrollToTop = async () => {
  await nextTick()
  if (contentAreaRef.value) {
    contentAreaRef.value.scrollTop = 0
  }
}

const goPrev = async () => {
  if (!hasPrevFile.value) return
  await prevFile()
  await scrollToTop()
}

const goNext = async () => {
  if (!hasNextFile.value) return
  await nextFile()
  await scrollToTop()
}
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50">
    <header class="md:hidden flex items-center px-4 py-3 bg-white border-b border-gray-100 safe-area-top">
      <button
        class="flex-shrink-0 p-2 rounded-lg active:bg-gray-100"
        @click="toggleSidebar"
        aria-label="菜单"
      >
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <h1 class="flex-1 text-lg font-medium text-gray-800 text-center truncate px-2">
        {{ currentFile?.name.replace(/\.md$/i, '') || currentFolder?.name || 'Markdown Reader' }}
      </h1>
      <button
        class="flex-shrink-0 p-2 rounded-lg active:bg-gray-100"
        @click="toggleTheme"
        :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
      >
        <svg v-if="!isDark" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646a9 9 0 1011.708 11.708z" />
        </svg>
        <svg v-else class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      </button>
    </header>

    <div class="flex-1 flex overflow-hidden">
      <Transition name="overlay">
        <div
          v-if="isMobile && sidebarOpen"
          class="fixed inset-0 z-40 bg-black/30"
          @click="closeSidebar"
        ></div>
      </Transition>

      <Transition name="sidebar">
        <aside
          v-show="sidebarOpen"
          class="fixed md:relative z-50 md:z-auto left-0 top-0 h-full w-72 md:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col"
        >
          <div class="hidden md:flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h1 class="text-lg font-semibold text-gray-800">Markdown Reader</h1>
          </div>
          <div class="flex-1 min-h-0">
            <Sidebar @file-selected="closeSidebar" />
          </div>
        </aside>
      </Transition>

      <main class="flex-1 overflow-hidden flex flex-col">
        <div class="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <h2 class="text-lg font-medium text-gray-800 truncate">
            {{ currentFile?.name.replace(/\.md$/i, '') || '选择文件预览' }}
          </h2>

          <div class="flex items-center gap-2 flex-shrink-0 ml-4">
            <button
              class="w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
              @click="toggleTheme"
              :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <svg v-if="!isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646a9 9 0 1011.708 11.708z" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </button>
            <template v-if="currentFile">
              <span class="text-sm text-gray-400 mr-2">
                {{ currentFileIndex + 1 }} / {{ files.length }}
              </span>
            </template>
            <button
              v-if="currentFile"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              :class="hasPrevFile ? 'text-gray-600 hover:bg-gray-100 active:bg-gray-200' : 'text-gray-300 cursor-not-allowed'"
              :disabled="!hasPrevFile"
              @click="goPrev"
              aria-label="上一页"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              v-if="currentFile"
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              :class="hasNextFile ? 'text-gray-600 hover:bg-gray-100 active:bg-gray-200' : 'text-gray-300 cursor-not-allowed'"
              :disabled="!hasNextFile"
              @click="goNext"
              aria-label="下一页"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div ref="contentAreaRef" class="flex-1 overflow-y-auto bg-white">
          <div v-if="currentFile" class="max-w-3xl mx-auto">
            <MarkdownPreview :content="currentFile.content" />

            <div class="md:hidden flex items-center justify-center gap-4 py-2 bg-white border-t border-gray-100 safe-area-bottom">
              <button
                class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                :class="hasPrevFile ? 'text-gray-600 active:bg-gray-100' : 'text-gray-300'"
                :disabled="!hasPrevFile"
                @click="goPrev"
                aria-label="上一页"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span class="text-sm text-gray-500 px-4">
                {{ currentFileIndex + 1 }} / {{ files.length }}
              </span>
              <button
                class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                :class="hasNextFile ? 'text-gray-600 active:bg-gray-100' : 'text-gray-300'"
                :disabled="!hasNextFile"
                @click="goNext"
                aria-label="下一页"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 p-4">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p class="text-center text-sm">
              {{ isMobile ? '点击左上角菜单选择文件' : '从左侧选择文件夹和文件' }}
            </p>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.safe-area-top {
  padding-top: env(safe-area-inset-top);
}

.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
