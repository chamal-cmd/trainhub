'use client'

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
      <p className="text-slate-500 text-sm">Something went wrong. Please try again.</p>
      <button onClick={reset} className="px-4 py-2 bg-violet-700 text-white text-sm rounded-xl hover:bg-violet-800">
        Try again
      </button>
    </div>
  )
}
