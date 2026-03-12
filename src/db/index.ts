import Dexie, { Table } from 'dexie'
import type { Folder, FileItem } from '../types'

class MarkdownDatabase extends Dexie {
  folders!: Table<Folder, number>
  files!: Table<FileItem, number>

  constructor() {
    super('MarkdownReaderDB')
    this.version(1).stores({
      folders: '++id, name, createdAt, updatedAt',
      files: '++id, name, folderId, createdAt, updatedAt'
    })
  }
}

export const db = new MarkdownDatabase()

// 从文件名中提取开头的数字用于排序
function extractLeadingNumber(name: string): number {
  // 移除 .md 后缀
  const cleanName = name.replace(/\.md$/i, '')
  // 匹配开头的数字（支持 "1."、"1-"、"1 "、"01" 等格式）
  const match = cleanName.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : Infinity
}

// 文件排序函数：优先按数字排序，数字相同或无数字按名称排序
function sortFiles(files: FileItem[]): FileItem[] {
  return files.sort((a, b) => {
    const numA = extractLeadingNumber(a.name)
    const numB = extractLeadingNumber(b.name)

    // 都有数字前缀，按数字排序
    if (numA !== Infinity && numB !== Infinity) {
      if (numA !== numB) {
        return numA - numB
      }
      // 数字相同，按名称排序
      return a.name.localeCompare(b.name, 'zh-CN')
    }

    // 一个有数字，一个没有，有数字的排前面
    if (numA !== Infinity) return -1
    if (numB !== Infinity) return 1

    // 都没有数字，按更新时间倒序
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

// 文件夹操作
export const folderOps = {
  async getAll(): Promise<Folder[]> {
    return await db.folders.orderBy('updatedAt').reverse().toArray()
  },

  async create(name: string): Promise<number> {
    const now = new Date()
    return await db.folders.add({
      name,
      createdAt: now,
      updatedAt: now
    })
  },

  async update(id: number, name: string): Promise<void> {
    await db.folders.update(id, {
      name,
      updatedAt: new Date()
    })
  },

  async delete(id: number): Promise<void> {
    // 级联删除文件夹下的所有文件
    await db.files.where('folderId').equals(id).delete()
    await db.folders.delete(id)
  }
}

// 文件操作
export const fileOps = {
  async getByFolder(folderId: number): Promise<FileItem[]> {
    const files = await db.files.where('folderId').equals(folderId).toArray()
    return sortFiles(files)
  },

  async getById(id: number): Promise<FileItem | undefined> {
    return await db.files.get(id)
  },

  async create(name: string, content: string, folderId: number): Promise<number> {
    const now = new Date()
    return await db.files.add({
      name,
      content,
      folderId,
      createdAt: now,
      updatedAt: now
    })
  },

  async update(id: number, data: Partial<Pick<FileItem, 'name' | 'content'>>): Promise<void> {
    await db.files.update(id, {
      ...data,
      updatedAt: new Date()
    })
  },

  async delete(id: number): Promise<void> {
    await db.files.delete(id)
  }
}