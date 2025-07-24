import { useState, useEffect } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import TransactionCard from '@/components/Transaction/TransactionCard'
import CategoryGrid from '@/components/Category/CategoryGrid'
import { DEFAULT_EXPENSE_CATEGORIES } from '@/constants/categories'
import { nanoid } from 'nanoid'

export default function ResponsiveTest() {
  const [viewportInfo, setViewportInfo] = useState('')
  const { transactions, categories } = useLocalStorage()

  // Mock categories for testing
  const mockCategories = DEFAULT_EXPENSE_CATEGORIES.map(cat => ({ 
    ...cat, 
    id: nanoid(), 
    householdId: 'demo' 
  }))

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      // Determine breakpoint
      let breakpoint = 'xs'
      if (width >= 1536) breakpoint = '2xl'
      else if (width >= 1280) breakpoint = 'xl'
      else if (width >= 1024) breakpoint = 'lg'
      else if (width >= 768) breakpoint = 'md'
      else if (width >= 640) breakpoint = 'sm'
      
      setViewportInfo(`${width}x${height} (${breakpoint})`)
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  const testSizes = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPhone 12 Pro Max', width: 428, height: 926 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Desktop Small', width: 1280, height: 720 },
    { name: 'Desktop Large', width: 1920, height: 1080 },
  ]

  const simulateSize = (width: number, height: number) => {
    // This is just for display - actual testing needs browser dev tools
    const breakpoint = width >= 1536 ? '2xl' : 
                      width >= 1280 ? 'xl' : 
                      width >= 1024 ? 'lg' : 
                      width >= 768 ? 'md' : 
                      width >= 640 ? 'sm' : 'xs'
    setViewportInfo(`${width}x${height} (${breakpoint}) - Simulated`)
  }

  return (
    <div className="space-y-6 p-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-xl font-bold mb-4">Responsive Design Test</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <h3 className="font-semibold mb-2">Current Viewport</h3>
            <p className="text-sm text-gray-600">{viewportInfo}</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Device Pixel Ratio</h3>
            <p className="text-sm text-gray-600">{window.devicePixelRatio}x</p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Touch Support</h3>
            <p className="text-sm text-gray-600">
              {'ontouchstart' in window ? 'Yes' : 'No'}
            </p>
          </div>
        </div>
      </div>

      {/* Test Size Buttons */}
      <div>
        <h2 className="font-semibold mb-3">Test Different Sizes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {testSizes.map((size) => (
            <button
              key={size.name}
              onClick={() => simulateSize(size.width, size.height)}
              className="bg-white border border-gray-200 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium text-sm">{size.name}</div>
              <div className="text-xs text-gray-500">{size.width}x{size.height}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Grid Test */}
      <div>
        <h2 className="font-semibold mb-3">Responsive Grid Test</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 text-center">
              <div className="text-sm font-medium">Item {i}</div>
              <div className="text-xs text-gray-500 mt-1">
                <div className="block sm:hidden">xs</div>
                <div className="hidden sm:block md:hidden">sm</div>
                <div className="hidden md:block lg:hidden">md</div>
                <div className="hidden lg:block xl:hidden">lg</div>
                <div className="hidden xl:block 2xl:hidden">xl</div>
                <div className="hidden 2xl:block">2xl</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Touch Target Test */}
      <div>
        <h2 className="font-semibold mb-3">Touch Target Size Test</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Too Small (&lt; 44px)</h3>
            <div className="flex flex-wrap gap-2">
              <button className="bg-red-500 text-white w-8 h-8 rounded text-xs">32px</button>
              <button className="bg-red-500 text-white w-10 h-10 rounded text-xs">40px</button>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Good Size (&ge; 44px)</h3>
            <div className="flex flex-wrap gap-2">
              <button className="bg-green-500 text-white w-11 h-11 rounded text-xs">44px</button>
              <button className="bg-green-500 text-white w-12 h-12 rounded text-xs">48px</button>
              <button className="bg-green-500 text-white w-14 h-14 rounded text-xs">56px</button>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Scale Test */}
      <div>
        <h2 className="font-semibold mb-3">Typography Scale Test</h2>
        <div className="space-y-2">
          <div className="text-xs">text-xs (12px)</div>
          <div className="text-sm">text-sm (14px)</div>
          <div className="text-base">text-base (16px)</div>
          <div className="text-lg">text-lg (18px)</div>
          <div className="text-xl">text-xl (20px)</div>
          <div className="text-2xl">text-2xl (24px)</div>
          <div className="text-3xl">text-3xl (30px)</div>
        </div>
      </div>

      {/* Real Component Tests */}
      <div>
        <h2 className="font-semibold mb-3">Real Component Tests</h2>
        
        {/* Category Grid Test */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Category Grid</h3>
          <CategoryGrid
            categories={mockCategories}
            selectedCategoryId={mockCategories[0]?.id}
            onCategorySelect={() => {}}
            type="expense"
          />
        </div>

        {/* Transaction Cards Test */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-2">Transaction Cards</h3>
          <div className="space-y-2">
            {transactions.slice(0, 3).map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoryId)
              if (!category) return null
              
              return (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  category={category}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              )
            })}
          </div>
        </div>
      </div>

      {/* Spacing and Layout Test */}
      <div>
        <h2 className="font-semibold mb-3">Spacing and Layout Test</h2>
        <div className="space-y-4">
          <div className="bg-gray-100 p-2 rounded">padding-2 (8px)</div>
          <div className="bg-gray-100 p-4 rounded">padding-4 (16px)</div>
          <div className="bg-gray-100 p-6 rounded">padding-6 (24px)</div>
          <div className="bg-gray-100 p-8 rounded">padding-8 (32px)</div>
        </div>
      </div>

      {/* Accessibility Test */}
      <div>
        <h2 className="font-semibold mb-3">Accessibility Test</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Focus Indicators</h3>
            <div className="space-x-2">
              <button className="bg-blue-500 text-white px-4 py-2 rounded focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Button 1
              </button>
              <button className="bg-green-500 text-white px-4 py-2 rounded focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                Button 2
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-2">Color Contrast</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 text-white p-3 rounded">
                High contrast (AAA)
              </div>
              <div className="bg-gray-600 text-white p-3 rounded">
                Medium contrast (AA)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h2 className="font-semibold mb-2">Testing Instructions</h2>
        <ol className="text-sm space-y-1 list-decimal list-inside">
          <li>Use browser dev tools to test responsive breakpoints</li>
          <li>Test touch interactions on actual mobile devices</li>
          <li>Verify minimum touch target size of 44px</li>
          <li>Check text readability at different zoom levels</li>
          <li>Test keyboard navigation and focus indicators</li>
          <li>Verify color contrast meets WCAG guidelines</li>
        </ol>
      </div>
    </div>
  )
}