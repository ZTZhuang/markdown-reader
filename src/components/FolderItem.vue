<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useFileStore } from '../composables/useFileStore'
import type { Folder } from '../types'

const props = defineProps<{
  folder: Folder
  isActive: boolean
  fileCount: number
  isExpanded: boolean
}>()

const emit = defineEmits<{
  select: [id: number]
  rename: [id: number, name: string]
  delete: [id: number]
  toggleExpand: [id: number]
}>()

const { renameFolder, deleteFolder } = useFileStore()

const isEditing = ref(false)
const editName = ref('')

const displayName = computed(() => {
  return props.folder.name.length > 12
    ? props.folder.name.slice(0, 12) + '...'
    : props.folder.name
})

const hasFiles = computed(() => props.fileCount > 0)

const handleClick = () => {
  if (!isEditing.value) {
    emit('select', props.folder.id!)
  }
}

const startEdit = () => {
  editName.value = props.folder.name
  isEditing.value = true
}

const finishEdit = async () => {
  if (editName.value.trim() && editName.value !== props.folder.name) {
    await renameFolder(props.folder.id!, editName.value.trim())
    ElMessage.success('重命名成功')
  }
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

const handleDelete = async () => {
  try {
    const message = hasFiles.value
      ? `删除文件夹将同时删除其中的 ${props.fileCount} 个文件，确定要删除吗？`
      : '确定要删除这个空文件夹吗？'
    await ElMessageBox.confirm(message, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
      confirmButtonClass: 'el-button--danger'
    })
    await deleteFolder(props.folder.id!)
    ElMessage.success('文件夹已删除')
  } catch (e) {
    // 用户取消
  }
}

const handleToggleExpand = (e: Event) => {
  e.stopPropagation()
  emit('toggleExpand', props.folder.id!)
}
</script>

<template>
  <div
    class="folder-item group"
    :class="{ 'bg-blue-50/80': isActive }"
    @click="handleClick"
  >
    <div class="flex items-center gap-3 px-3 py-2.5 min-h-[52px]">
      <!-- 文件夹图标 -->
      <div
        class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
        :class="hasFiles ? 'bg-amber-100' : 'bg-gray-100'"
      >
        <svg
          class="w-5 h-5"
          :class="hasFiles ? 'text-amber-500' : 'text-gray-400'"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
        </svg>
      </div>

      <!-- 名称和文件数量 -->
      <div class="flex-1 min-w-0">
        <template v-if="isEditing">
          <input
            v-model="editName"
            class="w-full px-2 py-1 text-sm border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click.stop
            @keyup.enter="finishEdit"
            @keyup.escape="cancelEdit"
            @blur="finishEdit"
            ref="editInput"
            autofocus
          />
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700 truncate">{{ displayName }}</span>
            <!-- 文件数量标签 -->
            <span
              v-if="hasFiles"
              class="px-1.5 py-0.5 text-xs rounded-md bg-blue-100 text-blue-600 font-medium flex-shrink-0"
            >
              {{ fileCount }}
            </span>
            <span
              v-else
              class="px-1.5 py-0.5 text-xs rounded-md bg-gray-100 text-gray-400 flex-shrink-0"
            >
              空
            </span>
          </div>
        </template>
      </div>

      <!-- 操作按钮组 -->
      <div class="flex items-center gap-0.5 flex-shrink-0" @click.stop>
        <!-- 展开/收起按钮 -->
        <button
          v-if="hasFiles"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-all"
          @click="handleToggleExpand"
          :aria-label="isExpanded ? '收起' : '展开'"
        >
          <svg
            class="w-5 h-5 transition-transform duration-200"
            :class="{ 'rotate-90': isExpanded }"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <!-- 占位符（空文件夹时保持对齐） -->
        <div v-else class="w-8 h-8"></div>

        <!-- 编辑按钮 -->
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 active:bg-emerald-100 transition-all"
          @click="startEdit"
          aria-label="重命名"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
        </button>

        <!-- 删除按钮 -->
        <button
          class="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 active:bg-red-100 transition-all"
          @click="handleDelete"
          aria-label="删除"
        >
          <svg class="w-4.5 h-4.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.folder-item {
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s ease;
}

.folder-item:active {
  background-color: #f3f4f6;
}

.folder-item.bg-blue-50\/80:active {
  background-color: #eff6ff;
}

/* 自定义图标大小 */
.w-4\.5 {
  width: 1.125rem;
}

.h-4\.5 {
  height: 1.125rem;
}
</style>