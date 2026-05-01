"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/Button"
import { ConfirmModal } from "@/components/ui/Modal"
import { MarkdownPreview } from "@/components/notes/MarkdownPreview"
import { SearchIcon, XIcon } from "@/components/ui/Icons"
import { uploadImage } from "@/lib/uploadImage"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

type NoteListItem = {
  id: string
  title: string
  updatedAt: string
  createdAt: string
}

type Note = NoteListItem & { content: string }

type ViewMode = "edit" | "preview" | "split"

const VIEW_STORAGE_KEY = "notes.viewMode"

function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const isToday = d.toDateString() === today.toDateString()
  if (isToday) return d.toLocaleTimeString("ko", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("ko", { year: "2-digit", month: "2-digit", day: "2-digit" })
}

export default function NotesPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState("")
  const [draftContent, setDraftContent] = useState("")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("split")
  const [showSidebar, setShowSidebar] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const insertAtCursor = (markdown: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setDraftContent((prev) => prev + markdown)
      return
    }
    const start = textarea.selectionStart ?? draftContent.length
    const end = textarea.selectionEnd ?? draftContent.length
    const before = draftContent.slice(0, start)
    const after = draftContent.slice(end)
    const next = before + markdown + after
    setDraftContent(next)
    requestAnimationFrame(() => {
      textarea.focus()
      const cursor = start + markdown.length
      textarea.setSelectionRange(cursor, cursor)
    })
  }

  const handleImageFiles = async (files: FileList | File[] | null | undefined) => {
    if (!files) return
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"))
    if (list.length === 0) return
    setUploadError(null)
    setUploading(true)
    try {
      const snippets: string[] = []
      for (const file of list) {
        const url = await uploadImage(file)
        const alt = file.name.replace(/\.[^.]+$/, "")
        snippets.push(`![${alt}](${url})`)
      }
      insertAtCursor("\n" + snippets.join("\n") + "\n")
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err))
    } finally {
      setUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData?.items ?? [])
    const imageFiles = items
      .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
      .map((it) => it.getAsFile())
      .filter((f): f is File => f !== null)
    if (imageFiles.length === 0) return
    e.preventDefault()
    handleImageFiles(imageFiles)
  }

  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault()
    setIsDragging(false)
    handleImageFiles(e.dataTransfer.files)
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY)
    if (stored === "edit" || stored === "preview" || stored === "split") setViewMode(stored)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode)
  }, [viewMode])

  const { data: notes = [], isLoading } = useQuery<NoteListItem[]>({
    queryKey: ["notes", debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      const qs = params.toString()
      return fetch(`/api/notes${qs ? `?${qs}` : ""}`).then((r) => r.json())
    },
  })

  const { data: selectedNote } = useQuery<Note>({
    queryKey: ["note", selectedId],
    queryFn: () => fetch(`/api/notes/${selectedId}`).then((r) => r.json()),
    enabled: !!selectedId,
  })

  useEffect(() => {
    if (selectedNote && selectedNote.id === selectedId) {
      setDraftTitle(selectedNote.title)
      setDraftContent(selectedNote.content)
      setSaveStatus("idle")
    }
  }, [selectedNote, selectedId])

  const createMutation = useMutation({
    mutationFn: () =>
      fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "", content: "" }),
      }).then((r) => r.json()),
    onSuccess: (note: Note) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.setQueryData(["note", note.id], note)
      setSelectedId(note.id)
      setDraftTitle("")
      setDraftContent("")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/notes/${id}`, { method: "DELETE" }),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["notes"] })
      queryClient.removeQueries({ queryKey: ["note", id] })
      if (selectedId === id) {
        setSelectedId(null)
        setDraftTitle("")
        setDraftContent("")
      }
      setPendingDeleteId(null)
    },
  })

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!selectedId || !selectedNote) return
    if (draftTitle === selectedNote.title && draftContent === selectedNote.content) {
      return
    }
    setSaveStatus("saving")
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${selectedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: draftTitle, content: draftContent }),
        })
        if (!res.ok) throw new Error("save failed")
        const updated = (await res.json()) as Note
        queryClient.setQueryData(["note", selectedId], updated)
        queryClient.setQueryData<NoteListItem[]>(["notes", debouncedSearch], (prev) => {
          if (!prev) return prev
          const next = prev.filter((n) => n.id !== selectedId)
          next.unshift({
            id: updated.id,
            title: updated.title,
            updatedAt: updated.updatedAt,
            createdAt: updated.createdAt,
          })
          return next
        })
        setSaveStatus("saved")
      } catch {
        setSaveStatus("idle")
      }
    }, 600)
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [draftTitle, draftContent, selectedId, selectedNote, debouncedSearch, queryClient])

  const filteredNotes = notes
  const isEmptyList = !isLoading && filteredNotes.length === 0

  const noteTitle = (n: NoteListItem) => n.title.trim() || t("notes.untitled")

  const previewSnippet = useMemo(() => {
    if (!selectedNote?.content) return ""
    return selectedNote.content.replace(/\s+/g, " ").slice(0, 120)
  }, [selectedNote?.content])

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] md:h-screen">
      <aside
        className={cn(
          "flex flex-col border-r border-gray-200 dark:border-neutral-800 bg-white dark:bg-black",
          showSidebar ? "flex w-full md:w-80 shrink-0" : "hidden md:flex md:w-80 md:shrink-0"
        )}
      >
        <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("notes.title")}</h1>
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            + {t("notes.add")}
          </Button>
        </div>
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("notes.searchPlaceholder")}
              className="w-full rounded-full border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 pl-9 pr-9 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={t("common.close")}
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-3">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-400">{t("common.loading")}</div>
          ) : isEmptyList ? (
            <div className="p-4 text-sm text-gray-400 text-center">
              {debouncedSearch ? t("notes.noSearchResults") : t("notes.noNotes")}
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredNotes.map((note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(note.id)
                      setShowSidebar(false)
                    }}
                    className={cn(
                      "w-full text-left rounded-xl px-3 py-2 transition-colors",
                      selectedId === note.id
                        ? "bg-emerald-50 dark:bg-emerald-950/60"
                        : "hover:bg-gray-100 dark:hover:bg-neutral-800/60"
                    )}
                  >
                    <div className="flex items-baseline gap-2">
                      <p className={cn(
                        "flex-1 truncate text-sm font-medium",
                        note.title.trim() ? "text-gray-900 dark:text-gray-100" : "text-gray-400 italic"
                      )}>
                        {noteTitle(note)}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0">{formatDate(note.updatedAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <section
        className={cn(
          "flex-1 flex flex-col bg-white dark:bg-black",
          showSidebar ? "hidden md:flex" : "flex"
        )}
      >
        {!selectedId || !selectedNote ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            {t("notes.selectOrCreate")}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setShowSidebar(true)}
                className="md:hidden text-gray-500 hover:text-gray-900 dark:hover:text-gray-100"
                aria-label={t("notes.backToList")}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploading}
                className="text-xs text-emerald-500 hover:text-emerald-600 disabled:opacity-50 px-2 py-1"
              >
                {uploading ? t("notes.uploading") : t("notes.attachImage")}
              </button>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={(e) => handleImageFiles(e.target.files)}
              />
              <span className="text-xs text-gray-400 ml-auto">
                {uploadError
                  ? <span className="text-red-500">{uploadError}</span>
                  : saveStatus === "saving"
                  ? t("notes.saving")
                  : saveStatus === "saved"
                  ? t("notes.saved")
                  : ""}
              </span>
              <div className="flex rounded-lg border border-gray-200 dark:border-neutral-700 overflow-hidden text-xs">
                {(["edit", "split", "preview"] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={cn(
                      "px-2.5 py-1 transition-colors",
                      viewMode === m
                        ? "bg-emerald-500 text-white"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800"
                    )}
                  >
                    {t(`notes.view.${m}`)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteId(selectedId)}
                className="text-xs text-gray-500 hover:text-red-500 px-2 py-1"
              >
                {t("notes.delete")}
              </button>
            </div>

            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder={t("notes.titlePlaceholder")}
              className="w-full px-6 pt-5 pb-2 text-2xl font-semibold bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
            />

            <div className="flex flex-1 min-h-0 overflow-hidden border-t border-gray-100 dark:border-neutral-800">
              {(viewMode === "edit" || viewMode === "split") && (
                <div
                  className={cn(
                    "flex-1 min-w-0 relative",
                    viewMode === "split" && "border-r border-gray-200 dark:border-neutral-800"
                  )}
                >
                  <textarea
                    ref={textareaRef}
                    value={draftContent}
                    onChange={(e) => setDraftContent(e.target.value)}
                    onPaste={handlePaste}
                    onDragOver={(e) => {
                      if (e.dataTransfer.types.includes("Files")) {
                        e.preventDefault()
                        setIsDragging(true)
                      }
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    placeholder={t("notes.contentPlaceholder")}
                    spellCheck={false}
                    className="w-full h-full resize-none px-6 py-4 text-sm font-mono leading-relaxed bg-transparent outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 text-gray-900 dark:text-gray-100"
                  />
                  {isDragging && (
                    <div className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 dark:bg-emerald-500/10 flex items-center justify-center text-sm font-medium text-emerald-600 dark:text-emerald-300">
                      {t("notes.dropImage")}
                    </div>
                  )}
                </div>
              )}
              {(viewMode === "preview" || viewMode === "split") && (
                <div className="flex-1 min-w-0 overflow-y-auto px-6 py-4">
                  {draftContent.trim() ? (
                    <MarkdownPreview content={draftContent} />
                  ) : (
                    <p className="text-sm text-gray-400">{previewSnippet || t("notes.previewEmpty")}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </section>

      <ConfirmModal
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={() => pendingDeleteId && deleteMutation.mutate(pendingDeleteId)}
        title={t("notes.delete")}
        description={t("notes.deleteConfirm")}
      />
    </div>
  )
}
