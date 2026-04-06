import { Link } from 'react-router-dom'
import { Layout, PenLine, Eye } from 'lucide-react'
import { Button } from '../ui/button'

const steps = [
  { icon: Layout, label: 'Pick a template', description: '6 industry designs to start from' },
  { icon: PenLine, label: 'Add your info', description: 'Name, phone, address, hours' },
  { icon: Eye, label: 'Preview your site', description: 'Ready in seconds, free forever' },
]

interface EmptyProjectsStateProps {
  userName?: string
}

export function EmptyProjectsState({ userName }: EmptyProjectsStateProps) {
  const displayName = userName ? userName.split('@')[0] : null

  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <h2 className="mb-1 text-2xl font-semibold text-slate-800 dark:text-white">
        {displayName ? `Welcome, ${displayName}` : 'Welcome to CodeBG'}
      </h2>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        Create your business website in three quick steps.
      </p>

      <div className="mb-10 grid w-full max-w-lg gap-4 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div key={i} className="section-card flex flex-col items-center gap-2 p-4">
            <s.icon size={24} className="text-accent" />
            <p className="text-sm font-medium text-slate-800 dark:text-white">{s.label}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.description}</p>
          </div>
        ))}
      </div>

      <Button size="lg" className="min-h-[3.5rem] px-8 text-base pulse-glow" asChild>
        <Link to="/portal/projects/new">Create your first website</Link>
      </Button>
    </div>
  )
}
