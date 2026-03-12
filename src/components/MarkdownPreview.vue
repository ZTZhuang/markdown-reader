<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

const previewRef = ref<HTMLElement | null>(null)

// 配置 markdown-it
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (e) {
        console.error(e)
      }
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  }
})

// 启用 GFM 扩展（任务列表等）
md.enable(['link', 'image'])

const renderedContent = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})

// 处理代码块语言标识
onMounted(() => {
  addCopyButtons()
})

watch(() => props.content, () => {
  setTimeout(addCopyButtons, 100)
})

function addCopyButtons() {
  if (!previewRef.value) return
  const codeBlocks = previewRef.value.querySelectorAll('pre')
  codeBlocks.forEach((block) => {
    if (block.querySelector('.copy-btn')) return
    block.style.position = 'relative'

    const copyBtn = document.createElement('button')
    copyBtn.className = 'copy-btn'
    copyBtn.textContent = '复制'
    copyBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      padding: 4px 8px;
      font-size: 12px;
      background: rgba(255,255,255,0.9);
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s;
    `
    copyBtn.onclick = async () => {
      const code = block.querySelector('code')?.textContent || ''
      try {
        await navigator.clipboard.writeText(code)
        copyBtn.textContent = '已复制'
        setTimeout(() => { copyBtn.textContent = '复制' }, 2000)
      } catch (e) {
        console.error('复制失败', e)
      }
    }

    block.appendChild(copyBtn)
    block.addEventListener('mouseenter', () => { copyBtn.style.opacity = '1' })
    block.addEventListener('mouseleave', () => { copyBtn.style.opacity = '0' })
  })
}

// 处理链接点击（在新窗口打开）
function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (target.tagName === 'A') {
    e.preventDefault()
    const href = target.getAttribute('href')
    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }
}
</script>

<template>
  <div
    ref="previewRef"
    class="markdown-body p-4 pb-safe"
    v-html="renderedContent"
    @click="handleContentClick"
  ></div>
</template>

<style>
@import 'highlight.js/styles/github.css';

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

/* 移动端代码块优化 */
.markdown-body pre {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.markdown-body pre code {
  white-space: pre;
  word-break: normal;
}

/* 表格滚动 */
.markdown-body table {
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* 移动端复制按钮触摸优化 */
.markdown-body .copy-btn {
  min-height: 32px;
  min-width: 48px;
}

.markdown-body .copy-btn:active {
  background: #f3f4f6 !important;
}
</style>