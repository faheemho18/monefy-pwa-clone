import { Category } from '@/types'
import CategoryIcon from './CategoryIcon'

interface CategoryGridProps {
  categories: Category[]
  selectedCategoryId?: string
  onCategorySelect: (category: Category) => void
  type: 'expense' | 'income'
}

export default function CategoryGrid({
  categories,
  selectedCategoryId,
  onCategorySelect,
  type,
}: CategoryGridProps) {
  const filteredCategories = categories.filter(cat => cat.type === type)

  return (
    <div className="grid grid-cols-4 gap-3">
      {filteredCategories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category)}
          className={`
            flex flex-col items-center p-3 rounded-xl transition-all
            ${selectedCategoryId === category.id
              ? 'bg-blue-100 border-2 border-blue-500 scale-105'
              : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
            }
          `}
        >
          <div className={`
            ${category.color} p-2 rounded-lg mb-2 text-white
            ${selectedCategoryId === category.id ? 'shadow-lg' : ''}
          `}>
            <CategoryIcon icon={category.icon} size="md" />
          </div>
          <span className="text-xs font-medium text-gray-700 text-center leading-tight">
            {category.name}
          </span>
        </button>
      ))}
    </div>
  )
}