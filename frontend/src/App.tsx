import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-indigo-700 to-indigo-500">
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h1 className="text-6xl font-bold text-white mb-8 drop-shadow-lg">
          Flooding Islands
        </h1>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 shadow-2xl">
          <p className="text-white text-xl mb-6">
            A 2-player turn-based strategy game
          </p>
          
          <div className="flex gap-4 mb-6">
            <div className="bg-yellow-400 text-gray-900 px-6 py-3 rounded-lg font-semibold">
              Dry Field
            </div>
            <div className="bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold">
              Flooded Field
            </div>
          </div>

          <button
            onClick={() => setCount((count) => count + 1)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            Test Counter: {count}
          </button>
          
          <p className="text-white/80 text-sm mt-6">
            Vite + React + TypeScript + Tailwind CSS
          </p>
        </div>
      </div>
    </div>
  )
}

export default App

