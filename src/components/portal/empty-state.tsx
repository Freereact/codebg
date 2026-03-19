import { Link } from 'react-router-dom'
import { Globe } from 'lucide-react'
import { Button } from '../ui/button'

export function EmptyProjectsState() {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <Globe size={48} className="mb-4 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      <h2 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">No projects yet</h2>
      <p className="mb-8 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Get your business online in days, not weeks. Pick a plan and we will build your site.
      </p>
      <Button size="lg" className="min-h-[3.5rem] px-8 text-base" asChild>
        <Link to="/portal/projects/new">Start your website</Link>
      </Button>
    </div>
  )
}
