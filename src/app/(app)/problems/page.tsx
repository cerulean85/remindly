import { Suspense } from "react"
import { ProblemsPageClient } from "./ProblemsPageClient"

// useSearchParams() inside ProblemsPageClient requires a Suspense boundary so
// Next.js can prerender the page shell without knowing the URL search params.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProblemsPageClient />
    </Suspense>
  )
}
