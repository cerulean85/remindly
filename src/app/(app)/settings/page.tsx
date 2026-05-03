"use client"

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Image from "next/image"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { ConfirmModal } from "@/components/ui/Modal"
import { ColorPicker } from "@/components/categories/ColorPicker"
import { ThemeToggle } from "@/components/settings/ThemeToggle"
import { LanguageToggle } from "@/components/settings/LanguageToggle"
import type { Category, UserSettings } from "@/types"
import { useTranslation } from "react-i18next"
import "@/lib/i18n"

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 p-5">
      <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</h2>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const [showAddCategory, setShowAddCategory] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)

  const [catName, setCatName] = useState("")
  const [catColor, setCatColor] = useState("#10b981")

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((r) => r.json()),
  })

  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ["settings"],
    queryFn: () => fetch("/api/settings").then((r) => r.json()),
  })

  const [thresholdInput, setThresholdInput] = useState<string>("")
  const [staleDaysInput, setStaleDaysInput] = useState<string>("")

  useEffect(() => {
    if (!userSettings) return

    let active = true
    queueMicrotask(() => {
      if (!active) return
      setThresholdInput(String(userSettings.retrievalThreshold))
      setStaleDaysInput(String(userSettings.staleDays))
    })
    return () => {
      active = false
    }
  }, [userSettings])

  const updateSettings = useMutation({
    mutationFn: (data: Partial<UserSettings>) =>
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      queryClient.invalidateQueries({ queryKey: ["problems"] })
    },
  })

  const createCat = useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setShowAddCategory(false)
      setCatName(""); setCatColor("#10b981")
    },
  })

  const editCat = useMutation({
    mutationFn: (data: { id: string; name: string; color: string }) =>
      fetch(`/api/categories/${data.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); setEditCategory(null) },
  })

  const deleteCat = useMutation({
    mutationFn: (id: string) => fetch(`/api/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); setDeleteCategory(null) },
  })

  const deleteAccount = useMutation({
    mutationFn: () => fetch("/api/account", { method: "DELETE" }),
    onSuccess: () => signOut({ callbackUrl: "/login" }),
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("settings.title")}</h1>

      <Section title={t("settings.theme")}>
        <ThemeToggle />
      </Section>

      <Section title={t("settings.language")}>
        <LanguageToggle />
      </Section>

      <Section title={t("settings.retrieval")}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings.retrievalThreshold")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={100}
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                onBlur={() => {
                  const v = Number(thresholdInput)
                  if (Number.isFinite(v) && v >= 0 && v <= 100 && v !== userSettings?.retrievalThreshold) {
                    updateSettings.mutate({ retrievalThreshold: v })
                  }
                }}
                className="w-24 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-sm text-gray-500">%</span>
              <p className="ml-auto text-xs text-gray-400">{t("settings.retrievalThresholdHint")}</p>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("settings.staleDays")}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={365}
                value={staleDaysInput}
                onChange={(e) => setStaleDaysInput(e.target.value)}
                onBlur={() => {
                  const v = Number(staleDaysInput)
                  if (Number.isFinite(v) && v >= 1 && v <= 365 && v !== userSettings?.staleDays) {
                    updateSettings.mutate({ staleDays: v })
                  }
                }}
                className="w-24 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <span className="text-sm text-gray-500">{t("settings.daysSuffix")}</span>
              <p className="ml-auto text-xs text-gray-400">{t("settings.staleDaysHint")}</p>
            </div>
          </div>
        </div>
      </Section>

      <Section title={t("categories.title")}>
        <div className="flex flex-col gap-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-gray-50 dark:hover:bg-neutral-800"
            >
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
              <span className="text-xs text-gray-400">{cat._count?.problems ?? 0}개</span>
              <button className="text-xs text-gray-400 hover:text-emerald-500" onClick={() => { setEditCategory(cat); setCatName(cat.name); setCatColor(cat.color) }}>수정</button>
              <button className="text-xs text-gray-400 hover:text-red-500" onClick={() => setDeleteCategory(cat)}>삭제</button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setShowAddCategory(true)} className="mt-2">
            + {t("categories.add")}
          </Button>
        </div>
      </Section>

      {session?.user && (
        <Section title={t("settings.account")}>
          <div className="flex items-center gap-3 mb-4">
            {session.user.image ? (
              <Image src={session.user.image} alt="" width={40} height={40} className="rounded-full" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium">
                {session.user.name?.[0] ?? "U"}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{session.user.name}</p>
              <p className="text-xs text-gray-500">{session.user.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" onClick={() => signOut({ callbackUrl: "/login" })}>
              {t("settings.logout")}
            </Button>
            <Button variant="danger" onClick={() => setShowDeleteAccount(true)}>
              {t("settings.deleteAccount")}
            </Button>
          </div>
        </Section>
      )}

      <div className="text-center text-xs text-gray-400 pb-4">
        <p>{t("settings.copyright")}</p>
      </div>

      {/* Add Category Modal */}
      <Modal open={showAddCategory} onClose={() => setShowAddCategory(false)} title={t("categories.add")}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("categories.name")}</label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("categories.color")}</label>
            <ColorPicker value={catColor} onChange={setCatColor} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowAddCategory(false)}>{t("common.cancel")}</Button>
            <Button size="sm" onClick={() => createCat.mutate({ name: catName, color: catColor })} disabled={!catName.trim()}>{t("common.save")}</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Category Modal */}
      <Modal open={!!editCategory} onClose={() => setEditCategory(null)} title={t("categories.edit")}>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("categories.name")}</label>
            <input
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{t("categories.color")}</label>
            <ColorPicker value={catColor} onChange={setCatColor} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditCategory(null)}>{t("common.cancel")}</Button>
            <Button size="sm" onClick={() => editCategory && editCat.mutate({ id: editCategory.id, name: catName, color: catColor })} disabled={!catName.trim()}>{t("common.save")}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={() => deleteCategory && deleteCat.mutate(deleteCategory.id)}
        title={t("categories.delete")}
        description={t("categories.deleteConfirm")}
      />

      <ConfirmModal
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={() => deleteAccount.mutate()}
        title={t("settings.deleteAccount")}
        description={t("settings.deleteAccountConfirm")}
      />
    </div>
  )
}
