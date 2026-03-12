// 文件夹类型
export interface Folder {
  id?: number
  name: string
  createdAt: Date
  updatedAt: Date
}

// 文件类型
export interface FileItem {
  id?: number
  name: string
  content: string
  folderId: number
  createdAt: Date
  updatedAt: Date
}

// 用于创建文件夹的参数
export interface CreateFolderParams {
  name: string
}

// 用于创建文件的参数
export interface CreateFileParams {
  name: string
  content: string
  folderId: number
}