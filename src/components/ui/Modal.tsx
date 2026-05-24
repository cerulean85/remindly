"use client"

import { useRef } from "react"
import { cn } from "@/lib/utils"
import { useEscapeKey } from "@/hooks/useEscapeKey"
import { Button } from "./Button"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
  headerRight?: React.ReactNode
}

export function Modal({ open, onClose, title, children, className, headerRight }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  useEscapeKey(onClose, open)

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
          "w-full max-w-md max-h-[90dvh] rounded-2xl bg-surface-overlay shadow-popover flex flex-col overflow-hidden",
          className
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-6 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {headerRight && (
            <div className="shrink-0 flex items-center gap-2">{headerRight}</div>
          )}
        </div>
        <div className="overflow-y-auto px-6 py-4">{children}</div>
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
      <p className="mb-6 text-sm text-text-secondary">{description}</p>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={onClose}>취소</Button>
        <Button variant={confirmVariant} size="sm" onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  )
}
