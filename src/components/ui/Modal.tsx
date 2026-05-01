"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 shadow-xl p-6",
          className
        )}
      >
        <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        {children}
      </div>
    </div>
  )
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "확인",
  confirmVariant = "danger",
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmLabel?: string
  confirmVariant?: "primary" | "danger"
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
        <Button variant={confirmVariant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
