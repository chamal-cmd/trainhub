'use client'

export default function RootError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-8">
        <p className="text-slate-500 text-sm mb-4">Something went wrong loading this page.</p>
        <button onClick={reset} className="px-4 py-2 bg-violet-700 text-white text-sm rounded-xl hover:bg-violet-800">
          Try again
        </button>
      </div>
    </div>
  )
}
