<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useFileStore } from '../composables/useFileStore'
import { fileOps } from '../db'
import FolderItem from './FolderItem.vue'
import FileItem from './FileItem.vue'

const {
  folders,
  currentFolderId,
  files,
  loadFolders,
  createFolder,
  selectFolder,
  createFile,
  selectFile,
  currentFileId
} = useFileStore()

const showNewFolderDialog = ref(false)
const newFolderName = ref('')
const fileInputRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)

// 展开状态：记录哪些文件夹是展开的
const expandedFolders = ref<Set<number>>(new Set())

// 文件夹下的文件数量（用于显示展开图标）
const folderFileCounts = ref<Map<number, number>>(new Map())

// 初始化加载
onMounted(async () => {
  await loadFolders()
  // 加载每个文件夹的文件数量
  await loadAllFolderFileCounts()
})

// 加载所有文件夹的文件数量
const loadAllFolderFileCounts = async () => {
  for (const folder of folders.value) {
    if (folder.id) {
      const folderFiles = await fileOps.getByFolder(folder.id)
      folderFileCounts.value.set(folder.id, folderFiles.length)
    }
  }
}

// 当选择文件夹时，自动展开
watch(currentFolderId, (newId) => {
  if (newId && !expandedFolders.value.has(newId)) {
    expandedFolders.value.add(newId)
  }
})

// 监听 folders 变化，更新文件数量
watch(folders, async () => {
  await loadAllFolderFileCounts()
}, { deep: true })

const handleToggleExpand = async (folderId: number) => {
  if (expandedFolders.value.has(folderId)) {
    expandedFolders.value.delete(folderId)
  } else {
    expandedFolders.value.add(folderId)
    // 如果当前没有选中这个文件夹，需要选中它来加载文件
    if (currentFolderId.value !== folderId) {
      await selectFolder(folderId)
    }
  }
}

const isFolderExpanded = (folderId: number) => {
  return expandedFolders.value.has(folderId)
}

const handleFolderSelect = async (folderId: number) => {
  await selectFolder(folderId)
  // 更新文件数量
  folderFileCounts.value.set(folderId, files.value.length)
}

const handleCreateFolder = async () => {
  const name = newFolderName.value.trim()
  if (!name) {
    ElMessage.warning('请输入文件夹名称')
    return
  }
  try {
    const id = await createFolder(name)
    await handleFolderSelect(id)
    expandedFolders.value.add(id)
    folderFileCounts.value.set(id, 0)
    showNewFolderDialog.value = false
    newFolderName.value = ''
    ElMessage.success('文件夹创建成功')
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

const handleUploadClick = () => {
  if (!currentFolderId.value) {
    ElMessage.warning('请先选择文件夹')
    return
  }
  fileInputRef.value?.click()
}

const handleFileChange = async (e: Event) => {
  const input = e.target as HTMLInputElement
  const selectedFiles = input.files
  if (!selectedFiles || selectedFiles.length === 0) return

  isUploading.value = true
  let successCount = 0

  for (const file of Array.from(selectedFiles)) {
    if (!file.name.toLowerCase().endsWith('.md')) {
      ElMessage.warning(`${file.name} 不是 Markdown 文件`)
      continue
    }

    try {
      const content = await readFileContent(file)
      await createFile(file.name, content, currentFolderId.value!)
      successCount++
    } catch (err) {
      ElMessage.error(`${file.name} 上传失败`)
    }
  }

  isUploading.value = false
  input.value = '' // 重置 input

  if (successCount > 0) {
    ElMessage.success(`成功上传 ${successCount} 个文件`)
    // 更新文件数量
    if (currentFolderId.value) {
      folderFileCounts.value.set(currentFolderId.value, files.value.length)
    }
  }
}

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'UTF-8')
  })
}

const handleDrop = async (e: DragEvent) => {
  e.preventDefault()
  if (!currentFolderId.value) {
    ElMessage.warning('请先选择文件夹')
    return
  }

  const droppedFiles = e.dataTransfer?.files
  if (!droppedFiles || droppedFiles.length === 0) return

  isUploading.value = true
  let successCount = 0

  for (const file of Array.from(droppedFiles)) {
    if (!file.name.toLowerCase().endsWith('.md')) {
      continue
    }

    try {
      const content = await readFileContent(file)
      await createFile(file.name, content, currentFolderId.value!)
      successCount++
    } catch (err) {
      console.error('上传失败', err)
    }
  }

  isUploading.value = false

  if (successCount > 0) {
    ElMessage.success(`成功上传 ${successCount} 个文件`)
    if (currentFolderId.value) {
      folderFileCounts.value.set(currentFolderId.value, files.value.length)
    }
  }
}

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
}

// 获取文件夹文件数量
const getFolderFileCount = (folderId: number): number => {
  if (currentFolderId.value === folderId) {
    return files.value.length
  }
  return folderFileCounts.value.get(folderId) || 0
}

</script>

<template>
  <div class="sidebar flex flex-col bg-white h-full">
    <!-- 头部操作栏 -->
    <div class="p-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
      <h2 class="text-base font-medium text-gray-800">文件夹</h2>
      <button
        class="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm active:scale-95 transition-transform flex items-center justify-center"
        @click="showNewFolderDialog = true"
        aria-label="新建文件夹"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
        </svg>
      </button>
    </div>

    <!-- 文件夹和文件列表 -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div v-if="folders.length === 0" class="p-6 text-center">
        <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
          </svg>
        </div>
        <p class="text-gray-400 text-sm">暂无文件夹</p>
        <p class="text-gray-300 text-xs mt-1">点击右上角创建</p>
      </div>

      <template v-for="folder in folders" :key="folder.id">
        <FolderItem
          :folder="folder"
          :is-active="currentFolderId === folder.id"
          :file-count="getFolderFileCount(folder.id!)"
          :is-expanded="isFolderExpanded(folder.id!)"
          @select="handleFolderSelect"
          @toggle-expand="handleToggleExpand"
        />

        <!-- 文件列表（展开时显示） -->
        <Transition name="collapse">
          <div v-if="isFolderExpanded(folder.id!) && currentFolderId === folder.id && files.length > 0" class="bg-gray-50/50">
            <FileItem
              v-for="file in files"
              :key="file.id"
              :file="file"
              :is-active="currentFileId === file.id"
              @select="selectFile"
            />
          </div>
        </Transition>
      </template>
    </div>

    <!-- 上传按钮 -->
    <div
      class="p-3 mb-4 border-t border-gray-100 safe-area-bottom flex-shrink-0"
      @drop="handleDrop"
      @dragover="handleDragOver"
    >
      <button
        class="w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
        :class="currentFolderId
          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm active:scale-[0.98]'
          : 'bg-gray-100 text-gray-400'"
        :disabled="!currentFolderId"
        @click="handleUploadClick"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
        </svg>
        <span>{{ isUploading ? '上传中...' : '上传 Markdown 文件' }}</span>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        accept=".md,.markdown"
        multiple
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <!-- 新建文件夹弹窗 - 居中显示 -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showNewFolderDialog"
          class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          @click.self="showNewFolderDialog = false"
        >
          <div class="w-full max-w-sm mx-4 bg-white rounded-2xl p-5 shadow-xl">
            <h3 class="text-lg font-semibold mb-4 text-center text-gray-800">新建文件夹</h3>
            <input
              v-model="newFolderName"
              type="text"
              placeholder="输入文件夹名称"
              class="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              @keyup.enter="handleCreateFolder"
              autofocus
            />
            <div class="flex gap-3 mt-5">
              <button
                class="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-medium active:bg-gray-200 transition-colors"
                @click="showNewFolderDialog = false"
              >
                取消
              </button>
              <button
                class="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium active:scale-[0.98] transition-transform shadow-sm"
                @click="handleCreateFolder"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 折叠动画 */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  max-height: 1000px;
}
</style>