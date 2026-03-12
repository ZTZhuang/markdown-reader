import { ref, computed } from 'vue'
import { folderOps, fileOps } from '../db'
import type { Folder, FileItem } from '../types'

// 全局状态
const folders = ref<Folder[]>([])
const currentFolderId = ref<number | null>(null)
const currentFileId = ref<number | null>(null)
const files = ref<FileItem[]>([])
const currentFile = ref<FileItem | null>(null)

export function useFileStore() {
  // 文件夹相关
  const loadFolders = async () => {
    folders.value = await folderOps.getAll()
  }

  const createFolder = async (name: string) => {
    const id = await folderOps.create(name)
    await loadFolders()
    return id
  }

  const renameFolder = async (id: number, name: string) => {
    await folderOps.update(id, name)
    await loadFolders()
  }

  const deleteFolder = async (id: number) => {
    await folderOps.delete(id)
    if (currentFolderId.value === id) {
      currentFolderId.value = null
      files.value = []
    }
    await loadFolders()
  }

  // 文件相关
  const loadFiles = async (folderId: number) => {
    files.value = await fileOps.getByFolder(folderId)
  }

  const selectFolder = async (folderId: number) => {
    currentFolderId.value = folderId
    currentFileId.value = null
    currentFile.value = null
    await loadFiles(folderId)
  }

  const createFile = async (name: string, content: string, folderId: number) => {
    const id = await fileOps.create(name, content, folderId)
    await loadFiles(folderId)
    return id
  }

  const selectFile = async (fileId: number) => {
    const file = await fileOps.getById(fileId)
    if (file) {
      currentFileId.value = fileId
      currentFile.value = file
    }
  }

  const updateFile = async (id: number, data: Partial<Pick<FileItem, 'name' | 'content'>>) => {
    await fileOps.update(id, data)
    if (currentFile.value?.id === id) {
      currentFile.value = await fileOps.getById(id) || null
    }
    if (currentFolderId.value) {
      await loadFiles(currentFolderId.value)
    }
  }

  const deleteFile = async (id: number) => {
    await fileOps.delete(id)
    if (currentFileId.value === id) {
      currentFileId.value = null
      currentFile.value = null
    }
    if (currentFolderId.value) {
      await loadFiles(currentFolderId.value)
    }
  }

  // 计算属性
  const currentFolder = computed(() =>
    folders.value.find(f => f.id === currentFolderId.value)
  )

  // 当前文件索引
  const currentFileIndex = computed(() => {
    if (!currentFileId.value || files.value.length === 0) return -1
    return files.value.findIndex(f => f.id === currentFileId.value)
  })

  // 是否有上一个/下一个文件
  const hasPrevFile = computed(() => currentFileIndex.value > 0)
  const hasNextFile = computed(() =>
    currentFileIndex.value >= 0 && currentFileIndex.value < files.value.length - 1
  )

  // 导航到上一个文件
  const prevFile = async () => {
    if (hasPrevFile.value) {
      const prevFileItem = files.value[currentFileIndex.value - 1]
      if (prevFileItem?.id) {
        await selectFile(prevFileItem.id)
      }
    }
  }

  // 导航到下一个文件
  const nextFile = async () => {
    if (hasNextFile.value) {
      const nextFileItem = files.value[currentFileIndex.value + 1]
      if (nextFileItem?.id) {
        await selectFile(nextFileItem.id)
      }
    }
  }

  return {
    // 状态
    folders,
    currentFolderId,
    currentFileId,
    files,
    currentFile,
    currentFolder,
    currentFileIndex,
    hasPrevFile,
    hasNextFile,

    // 文件夹操作
    loadFolders,
    createFolder,
    renameFolder,
    deleteFolder,

    // 文件操作
    loadFiles,
    selectFolder,
    createFile,
    selectFile,
    updateFile,
    deleteFile,

    // 导航
    prevFile,
    nextFile
  }
}