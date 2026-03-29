import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TemplateMeta, BusinessInfoInput } from '../types/portal'
import { fetchTemplates, createProject } from '../lib/projects-api'
import { TemplateCard } from '../components/portal/template-card'
import { BusinessInfoForm } from '../components/portal/business-info-form'
import { BuildProgress } from '../components/portal/build-progress'
import { useProjectEvents } from '../hooks/use-project-events'

type WizardStep = 'template' | 'info' | 'building'

export function NewProjectPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<WizardStep>('template')
  const [templates, setTemplates] = useState<TemplateMeta[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const events = useProjectEvents(createdProjectId ?? undefined)

  // Auto-redirect when build completes
  useEffect(() => {
    if (events.buildComplete || events.status === 'preview') {
      const timer = setTimeout(() => navigate('/portal/dashboard', { replace: true }), 1500)
      return () => clearTimeout(timer)
    }
  }, [events.buildComplete, events.status, navigate])

  useEffect(() => {
    fetchTemplates()
      .then((res) => {
        if (res.ok) {
          setTemplates(res.data)
        } else {
          setError('Failed to load templates')
        }
      })
      .catch(() => {
        setError('Failed to load templates')
      })
      .finally(() => setLoading(false))
  }, [])

  const handleTemplateSelect = (slug: string) => {
    setSelectedSlug(slug)
    setStep('info')
  }

  const handleBusinessInfoSubmit = async (info: BusinessInfoInput) => {
    if (!selectedSlug) return
    setError('')
    setCreating(true)

    try {
      const res = await createProject({ templateSlug: selectedSlug, businessInfo: info })
      if (res.ok) {
        setCreatedProjectId(res.data.id)
        setStep('building')
      } else {
        setError(res.error)
        setCreating(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p role="status" className="animate-pulse text-slate-500 dark:text-slate-400">
          Loading templates...
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {step === 'template' && (
        <>
          <h1 className="mb-2 text-2xl font-semibold text-slate-800 dark:text-white">Pick a template</h1>
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            Choose a starting point for your website. You can customize everything later.
          </p>
          {error && templates.length === 0 && (
            <p role="alert" className="mb-4 text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <TemplateCard
                key={t.slug}
                template={t}
                selected={selectedSlug === t.slug}
                onSelect={handleTemplateSelect}
              />
            ))}
          </div>
        </>
      )}

      {step === 'info' && (
        <>
          <h1 className="mb-2 text-2xl font-semibold text-slate-800 dark:text-white">Your business info</h1>
          <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
            This info goes directly on your website. You can change it anytime.
          </p>
          <div className="section-card mx-auto max-w-md p-6">
            <BusinessInfoForm
              onSubmit={handleBusinessInfoSubmit}
              onBack={() => setStep('template')}
              loading={creating}
            />
            {error && (
              <p role="alert" className="mt-4 text-center text-sm text-red-400">
                {error}
              </p>
            )}
          </div>
        </>
      )}

      {step === 'building' && (
        <div className="mx-auto max-w-md">
          <h1 className="mb-6 text-center text-2xl font-semibold text-slate-800 dark:text-white">
            Building your site...
          </h1>
          <BuildProgress
            status={events.status}
            step={events.step}
            buildComplete={events.buildComplete}
            durationMs={events.durationMs}
            error={events.error}
          />
          {events.buildComplete && (
            <p className="mt-4 text-center text-sm text-green-600 dark:text-green-400">
              Redirecting to your dashboard...
            </p>
          )}
        </div>
      )}
    </div>
  )
}
