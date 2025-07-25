import { Category } from '@/types'
import CategoryIcon from './CategoryIcon'

interface CategoryGridProps {
  categories: Category[]
  selectedCategoryId: string | null
  onCategorySelect: (categoryId: string) => void
  type: 'all' | 'expense' | 'income'
}

export default function CategoryGrid({
  categories,
  selectedCategoryId,
  onCategorySelect,
  type,
}: CategoryGridProps) {
  // Filter categories based on type
  const filteredCategories = type === 'all' 
    ? categories 
    : categories.filter(cat => cat.type === type)

  // Sort categories by order
  const sortedCategories = filteredCategories.sort((a, b) => a.order - b.order)

  const handleCategorySelect = (categoryId: string) => {
    onCategorySelect(categoryId)
  }

  return (
    <div 
      className="grid grid-cols-4 gap-4"
      role="group"
      aria-label="Category selection"
    >
      {sortedCategories.map((category, index) => (
        <div
          key={category.id}
          className="animate-in slide-in-from-bottom duration-300 ease-out"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CategoryIcon
            category={category}
            isSelected={selectedCategoryId === category.id}
            onClick={handleCategorySelect}
            size="md"
          />
        </div>
      ))}
    </div>
  )
}