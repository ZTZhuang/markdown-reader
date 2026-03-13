<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useFileStore } from '../composables/useFileStore'
import Sidebar from '../components/Sidebar.vue'
import MarkdownPreview from '../components/MarkdownPreview.vue'

const { currentFile, currentFolder, loadFolders,  hasPrevFile, hasNextFile, prevFile, nextFile, currentFileIndex, files } = useFileStore()

const sidebarOpen = ref(false)
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768
  if (!isMobile.value) {
    sidebarOpen.value = true
  }
}

onMounted(() => {
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
</script>

<template>
  <div class="h-full flex flex-col bg-gray-50">
    <!-- 移动端顶部导航栏 -->
    <header class="md:hidden flex items-center px-4 py-3 bg-white border-b border-gray-100 safe-area-top">
      <button
        class="flex-shrink-0 p-2 rounded-lg active:bg-gray-100"
        @click="toggleSidebar"
        aria-label="菜单"
      >
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      <h1 class="flex-1 text-lg font-medium text-gray-800 text-center truncate px-2">
        {{ currentFile?.name.replace(/\.md$/i, '') || currentFolder?.name || 'Markdown Reader' }}
      </h1>
      <div class="flex-shrink-0 w-10"></div>
    </header>

    <!-- 主内容区 -->
    <div class="flex-1 flex overflow-hidden">
      <!-- 侧边栏遮罩（移动端） -->
      <Transition name="overlay">
        <div
          v-if="isMobile && sidebarOpen"
          class="fixed inset-0 z-40 bg-black/30"
          @click="closeSidebar"
        ></div>
      </Transition>

      <!-- 侧边栏 -->
      <Transition name="sidebar">
        <aside
          v-show="sidebarOpen"
          class="fixed md:relative z-50 md:z-auto left-0 top-0 h-full w-72 md:w-64 bg-white border-r border-gray-100 flex-shrink-0 flex flex-col"
        >
          <!-- 桌面端标题 -->
          <div class="hidden md:flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <h1 class="text-lg font-semibold text-gray-800">Markdown Reader</h1>
          </div>
          <!-- 侧边栏内容 -->
          <div class="flex-1 min-h-0">
            <Sidebar @file-selected="closeSidebar" />
          </div>
        </aside>
      </Transition>

      <!-- 预览区域 -->
      <main class="flex-1 overflow-hidden flex flex-col">
        <!-- 桌面端标题栏 -->
        <div class="hidden md:flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100">
          <h2 class="text-lg font-medium text-gray-800 truncate">
            {{ currentFile?.name.replace(/\.md$/i, '') || '选择文件预览' }}
          </h2>
          <!-- 导航按钮 -->
          <div v-if="currentFile" class="flex items-center gap-2 flex-shrink-0 ml-4">
            <span class="text-sm text-gray-400 mr-2">
              {{ currentFileIndex + 1 }} / {{ files.length }}
            </span>
            <button
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              :class="hasPrevFile
                ? 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                : 'text-gray-300 cursor-not-allowed'"
              :disabled="!hasPrevFile"
              @click="prevFile"
              aria-label="上一个文件"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <button
              class="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
              :class="hasNextFile
                ? 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
                : 'text-gray-300 cursor-not-allowed'"
              :disabled="!hasNextFile"
              @click="nextFile"
              aria-label="下一个文件"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 移动端底部导航栏 -->
        <div v-if="isMobile && currentFile" class="md:hidden flex items-center justify-center gap-4 py-2 bg-white border-t border-gray-100 safe-area-bottom">
          <button
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            :class="hasPrevFile
              ? 'text-gray-600 active:bg-gray-100'
              : 'text-gray-300'"
            :disabled="!hasPrevFile"
            @click="prevFile"
            aria-label="上一个文件"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <span class="text-sm text-gray-500 px-4">
            {{ currentFileIndex + 1 }} / {{ files.length }}
          </span>
          <button
            class="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
            :class="hasNextFile
              ? 'text-gray-600 active:bg-gray-100'
              : 'text-gray-300'"
            :disabled="!hasNextFile"
            @click="nextFile"
            aria-label="下一个文件"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>

        <!-- 内容区 -->
        <div class="flex-1 overflow-y-auto bg-white">
          <div v-if="currentFile" class="max-w-3xl mx-auto">
            <MarkdownPreview :content="currentFile.content" />
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 p-4">
            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
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

/* 侧边栏动画 */
.sidebar-enter-active,
.sidebar-leave-active {
  transition: transform 0.3s ease;
}

.sidebar-enter-from,
.sidebar-leave-to {
  transform: translateX(-100%);
}

/* 遮罩动画 */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>