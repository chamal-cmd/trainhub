import { BookOpen, CheckCircle2, ExternalLink, Terminal, Database, Key } from 'lucide-react'

const steps = [
  {
    num: 1,
    icon: Database,
    title: 'Create a free Supabase project',
    description: 'Go to supabase.com, sign up for free, and create a new project. Choose a region close to you.',
    action: { label: 'Open Supabase', href: 'https://supabase.com/dashboard' },
  },
  {
    num: 2,
    icon: Key,
    title: 'Get your API keys',
    description: 'In your Supabase project, go to Settings → API. Copy the Project URL and the anon/public key.',
    action: null,
  },
  {
    num: 3,
    icon: Terminal,
    title: 'Add your keys to .env.local',
    description: 'Open the .env.local file in your project folder and replace the placeholder values with your real keys.',
    code: `NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key`,
  },
  {
    num: 4,
    icon: Database,
    title: 'Run the database schema',
    description: 'In Supabase Dashboard → SQL Editor, paste the contents of supabase/schema.sql and click Run.',
    action: null,
  },
  {
    num: 5,
    icon: CheckCircle2,
    title: 'Restart the dev server',
    description: 'Stop the server (Ctrl+C) and run npm run dev again. You\'ll land on the login page.',
    code: `npm run dev`,
  },
]

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-violet-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">TrainHub Setup</h1>
          <p className="text-slate-500 text-sm mt-2">
            Connect your Supabase database to get started.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.num} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-800 flex items-center justify-center text-sm font-bold shrink-0">
                  {step.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm mb-1">{step.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{step.description}</p>
                  {step.code && (
                    <pre className="mt-2 bg-slate-900 text-emerald-400 text-xs rounded-lg px-3 py-2.5 font-mono overflow-x-auto">
                      {step.code}
                    </pre>
                  )}
                  {step.action && (
                    <a
                      href={step.action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-violet-700 hover:text-violet-800"
                    >
                      {step.action.label}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          After setup, this page will no longer appear.
        </p>
      </div>
    </div>
  )
}
