'use client'
export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8">
      <p className="text-slate-500 text-sm">Something went wrong. Please try again.</p>
      <button onClick={reset} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-xl hover:bg-indigo-700">Try again</button>
    </div>
  )
}