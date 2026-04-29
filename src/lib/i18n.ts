"use client"

import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import ko from "../../messages/ko.json"
import en from "../../messages/en.json"

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      ko: { common: ko },
      en: { common: en },
    },
    lng: "ko",
    fallbackLng: "ko",
    supportedLngs: ["ko", "en"],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  })
}

export default i18n
