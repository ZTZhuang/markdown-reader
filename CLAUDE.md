# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Type-check (vue-tsc) and build for production
npm run preview  # Preview production build
```

## Architecture

This is a Vue 3 + TypeScript markdown reader with mobile-first responsive design.

### Data Layer (`src/db/`)
- Uses Dexie (IndexedDB wrapper) for client-side persistence
- `folderOps` and `fileOps` provide CRUD operations
- Files are sorted by leading number prefix (e.g., "01-intro.md" sorts before "02-chapter.md")

### State Management (`src/composables/useFileStore.ts`)
- Global state using module-level refs (shared across all consumers)
- Manages folders, files, and current selections
- Provides file navigation (prev/next) within a folder

### Components Structure
- `views/Home.vue` - Main layout with responsive sidebar
- `components/Sidebar.vue` - Folder/file tree navigation
- `components/MarkdownPreview.vue` - Renders markdown with highlight.js
- `components/FileItem.vue` / `FolderItem.vue` - Tree items

### Key Dependencies
- Vue 3 with Composition API (`<script setup>`)
- Element Plus for UI components
- TailwindCSS for styling
- markdown-it + highlight.js for rendering