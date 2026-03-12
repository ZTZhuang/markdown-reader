<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFileStore } from '../composables/useFileStore'
import type { FileItem } from '../types'

const props = defineProps<{
  file: FileItem
  isActive: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
}>()

const { deleteFile } = useFileStore()

const displayName = computed(() => {
  const name = props.file.name.replace(/\.md$/i, '')
  return name.length > 14 ? name.slice(0, 14) + '...' : name
})

const handleClick = () => {
  emit('select', props.file.id!)
}

const handleDelete = async (e: Event) => {
  e.stopPropagation()
  try {
    await ElMessageBox.confirm(
      '确定要删除这个文件吗？',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    await deleteFile(props.file.id!)
    ElMessage.success('文件已删除')
  } catch (e) {
    // 用户取消
  }
}
</script>

<template>
  <div
    class="file-item group"
    :class="{ 'bg-blue-100/60': isActive }"
    @click="handleClick"
  >
    <div class="flex items-center gap-3 px-3 py-2 pl-6 min-h-[48px]">
      <!-- 文件图标 -->
      <div
        class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        :class="isActive ? 'bg-blue-200' : 'bg-gray-100 group-hover:bg-gray-200'"
      >
        <svg
          class="w-4 h-4"
          :class="isActive ? 'text-blue-600' : 'text-gray-400'"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>

      <!-- 文件名 -->
      <div class="flex-1 min-w-0">
        <span
          class="text-sm truncate block"
          :class="isActive ? 'text-blue-700 font-medium' : 'text-gray-600'"
        >
          {{ displayName }}
        </span>
      </div>

      <!-- 删除按钮 -->
      <button
        class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-all flex-shrink-0"
        @click="handleDelete"
        aria-label="删除文件"
      >
        <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.file-item {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.file-item:active {
  background-color: #e5e7eb;
}

.file-item.bg-blue-100\/60:active {
  background-color: #dbeafe;
}

/* 自定义图标大小 */
.w-4\.5 {
  width: 1.125rem;
}

.h-4\.5 {
  height: 1.125rem;
}
</style>