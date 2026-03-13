<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
}>()

const previewRef = ref<HTMLElement | null>(null)
const escapeHtml = new MarkdownIt().utils.escapeHtml

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`
      } catch (error) {
        console.error(error)
      }
    }

    return `<pre class="hljs"><code>${escapeHtml(str)}</code></pre>`
  }
})

md.enable(['link', 'image'])

const renderedContent = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})

onMounted(() => {
  addCopyButtons()
})

watch(
  () => props.content,
  () => {
    setTimeout(addCopyButtons, 100)
  }
)

function addCopyButtons() {
  if (!previewRef.value) return

  const codeBlocks = previewRef.value.querySelectorAll('pre')
  codeBlocks.forEach((block) => {
    if (block.querySelector('.copy-btn')) return

    block.style.position = 'relative'

    const copyBtn = document.createElement('button')
    copyBtn.className = 'copy-btn'
    copyBtn.textContent = 'Copy'
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
        copyBtn.textContent = 'Copied'
        setTimeout(() => {
          copyBtn.textContent = 'Copy'
        }, 2000)
      } catch (error) {
        console.error('Copy failed', error)
      }
    }

    block.appendChild(copyBtn)
    block.addEventListener('mouseenter', () => {
      copyBtn.style.opacity = '1'
    })
    block.addEventListener('mouseleave', () => {
      copyBtn.style.opacity = '0'
    })
  })
}

function handleContentClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  const anchor = target?.closest('a') as HTMLAnchorElement | null
  const href = anchor?.getAttribute('href')

  if (!href) return
  if (!href.startsWith('http://') && !href.startsWith('https://')) return

  event.preventDefault()
  window.open(href, '_blank', 'noopener,noreferrer')
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

.markdown-body pre {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.markdown-body pre code {
  white-space: pre;
  word-break: normal;
}

.markdown-body table {
  display: block;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.markdown-body .copy-btn {
  min-height: 32px;
  min-width: 48px;
}

.markdown-body .copy-btn:active {
  background: #f3f4f6 !important;
}
</style>
