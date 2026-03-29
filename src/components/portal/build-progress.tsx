import { Check, Loader2, Circle } from 'lucide-react'

type StepState = 'done' | 'active' | 'pending'

interface Step {
  label: string
  state: StepState
}

function getSteps(status: string | null, step: string | null, buildComplete: boolean): Step[] {
  if (buildComplete || status === 'preview' || status === 'live') {
    return [
      { label: 'Project created', state: 'done' },
      { label: 'Files scaffolded', state: 'done' },
      { label: 'Site built', state: 'done' },
      { label: 'Preview ready', state: 'done' },
    ]
  }

  if (step === 'building' || status === 'building') {
    return [
      { label: 'Project created', state: 'done' },
      { label: 'Files scaffolded', state: 'done' },
      { label: 'Building your site...', state: 'active' },
      { label: 'Preview ready', state: 'pending' },
    ]
  }

  if (step === 'scaffolding') {
    return [
      { label: 'Project created', state: 'done' },
      { label: 'Scaffolding files...', state: 'active' },
      { label: 'Build site', state: 'pending' },
      { label: 'Preview ready', state: 'pending' },
    ]
  }

  // Default: draft/creating
  return [
    { label: 'Creating project...', state: 'active' },
    { label: 'Scaffold files', state: 'pending' },
    { label: 'Build site', state: 'pending' },
    { label: 'Preview ready', state: 'pending' },
  ]
}

function StepIcon({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
        <Check size={14} strokeWidth={3} />
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-black">
        <Loader2 size={14} className="animate-spin" />
      </div>
    )
  }
  return (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 dark:border-slate-600">
      <Circle size={8} className="text-slate-300 dark:text-slate-600" />
    </div>
  )
}

interface BuildProgressProps {
  status: string | null
  step: string | null
  buildComplete: boolean
  durationMs: number | null
  error: string | null
}

export function BuildProgress({ status, step, buildComplete, durationMs, error }: BuildProgressProps) {
  const steps = getSteps(status, step, buildComplete)

  return (
    <div className="section-card p-5">
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3">
            <StepIcon state={s.state} />
            <span
              className={`text-sm ${
                s.state === 'done'
                  ? 'text-slate-600 dark:text-slate-300'
                  : s.state === 'active'
                    ? 'font-medium text-slate-800 dark:text-white'
                    : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {s.label}
              {s.state === 'done' && i === 2 && durationMs !== null && (
                <span className="ml-1 text-xs text-slate-400">({(durationMs / 1000).toFixed(1)}s)</span>
              )}
            </span>
          </div>
        ))}
      </div>
      {error && (
        <div
          role="alert"
          className="mt-3 rounded bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300"
        >
          {error}
        </div>
      )}
    </div>
  )
}
