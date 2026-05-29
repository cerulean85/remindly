"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { cn } from "@/lib/utils"

const ZERO_WIDTH_SPACE = "\u200B"

export function normalizeEssayMarkdown(markdown: string) {
  return markdown
    .replace(/([^\s*])\*\*((?:['\u2019"\u201c\u201d])[^*\n]*?)\*\*/g, `$1${ZERO_WIDTH_SPACE}**$2**`)
    .replace(/\*\*((?:['\u2019"\u201c\u201d][^*\n]*?['\u2019"\u201c\u201d]))\*\*(?=[\p{L}\p{N}_])/gu, `**$1**${ZERO_WIDTH_SPACE}`)
}

function preserveExtraBlankLines(markdown: string) {
  return markdown.replace(/\n{3,}/g, (match) => {
    const blankLineCount = match.length - 1
    return `\n\n${Array.from({ length: blankLineCount - 1 }, () => ZERO_WIDTH_SPACE).join("\n\n")}\n\n`
  })
}

function normalizeMarkdown(content: string) {
  const chunks: string[] = []
  const lines = content.split("\n")
  let outsideFence = ""
  let insideFence = false

  const flushOutsideFence = () => {
    if (!outsideFence) return
    chunks.push(preserveExtraBlankLines(normalizeEssayMarkdown(outsideFence)))
    outsideFence = ""
  }

  lines.forEach((line, index) => {
    const lineWithEnding = index < lines.length - 1 ? `${line}\n` : line
    const isFence = /^\s*(```|~~~)/.test(line)

    if (isFence) {
      if (!insideFence) flushOutsideFence()
      chunks.push(lineWithEnding)
      insideFence = !insideFence
      return
    }

    if (insideFence) {
      chunks.push(lineWithEnding)
      return
    }

    outsideFence += lineWithEnding
  })

  flushOutsideFence()
  return chunks.join("")
}

export function MarkdownPreview({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown text-text-primary", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalizeMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}
