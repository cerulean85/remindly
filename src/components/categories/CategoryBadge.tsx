import { Badge } from "@/components/ui/Badge"
import type { Category } from "@/types"

export function CategoryBadge({ category }: { category: Category | null | undefined }) {
  if (!category) return null
  return <Badge color={category.color}>{category.name}</Badge>
}
