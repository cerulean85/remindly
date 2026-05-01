"use client"

import { useEffect, useState } from "react"

interface ImageGalleryProps {
  images: string[]
  size?: "sm" | "md" | "inline"
}

export function ImageGallery({ images, size = "md" }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const open = activeIndex !== null

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null)
      else if (e.key === "ArrowLeft") setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length))
      else if (e.key === "ArrowRight") setActiveIndex((i) => (i === null ? null : (i + 1) % images.length))
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, images.length])

  if (images.length === 0) return null

  const isInline = size === "inline"
  const containerCls = isInline ? "flex flex-col gap-3" : "flex flex-wrap gap-2"
  const itemCls = isInline
    ? "w-full max-h-[28rem] block"
    : size === "sm"
      ? "h-16 w-16 shrink-0"
      : "h-24 w-24 shrink-0"
  const imgCls = isInline ? "w-full h-auto max-h-[28rem] object-contain" : "h-full w-full object-cover"

  return (
    <>
      <div className={containerCls}>
        {images.map((url, i) => (
          <button
            key={url}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setActiveIndex(i)
            }}
            className={`${itemCls} rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 hover:opacity-80 transition-opacity`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className={imgCls} />
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setActiveIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white text-xl hover:bg-white/20"
            onClick={(e) => { e.stopPropagation(); setActiveIndex(null) }}
            aria-label="Close"
          >
            ×
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 text-white text-2xl hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)) }}
                aria-label="Previous"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/10 text-white text-2xl hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setActiveIndex((i) => (i === null ? null : (i + 1) % images.length)) }}
                aria-label="Next"
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[activeIndex!]}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {activeIndex! + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  )
}
