// No need to import React in modern React with JSX transform

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Monefy PWA Clone
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Zero-cost expense tracker for 2-user households
        </p>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🚀 Phase 0: Foundation & Setup
          </h2>
          <div className="space-y-2 text-left">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">GitHub repository initialized</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              <span className="text-sm">React + Vite + TypeScript setup</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-500 mr-2">⏳</span>
              <span className="text-sm">Tailwind CSS integration</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">⭕</span>
              <span className="text-sm text-gray-500">Firebase configuration</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">⭕</span>
              <span className="text-sm text-gray-500">Project structure creation</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Ready for development 🎯
        </p>
      </div>
    </div>
  )
}

export default App