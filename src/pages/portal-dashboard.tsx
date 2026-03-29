import { useEffect } from 'react'
import { useAuth } from '../contexts/auth-context'
import { useProjects } from '../hooks/use-projects'
import { EmptyProjectsState } from '../components/portal/empty-state'
import { ProjectCard } from '../components/portal/project-card'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export function PortalDashboardPage() {
  const { state: authState } = useAuth()
  const { projects, loading, error, refetch } = useProjects()

  const email = authState.status === 'authenticated' ? authState.user.email : ''
  const name = email.includes('@') ? email.split('@')[0] : 'there'

  // Auto-refresh when any project is building
  useEffect(() => {
    if (projects.some((p) => p.status === 'draft' || p.status === 'building')) {
      const timer = setInterval(refetch, 2000)
      return () => clearInterval(timer)
    }
  }, [projects, refetch])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p role="status" className="animate-pulse text-slate-500 dark:text-slate-400">
          Loading your projects...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p role="alert" className="text-sm text-red-500">
          Something went wrong loading your projects. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold text-slate-800 dark:text-white">
        {getGreeting()}, {name}
      </h1>

      {projects.length === 0 ? (
        <EmptyProjectsState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} onDeleted={refetch} />
          ))}
        </div>
      )}
    </div>
  )
}
