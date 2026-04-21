"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import resourcesToBackend from "i18next-resources-to-backend"

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(
      resourcesToBackend(
        (language: string) => import(`../../messages/${language}.json`)
      )
    )
    .init({
      fallbackLng: "ko",
      supportedLngs: ["ko", "en"],
      defaultNS: "common",
      interpolation: { escapeValue: false },
    })
}

export default i18n
