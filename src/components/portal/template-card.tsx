import { ExternalLink } from 'lucide-react'
import type { TemplateMeta } from '../../types/portal'
import { SAMPLE_APPS_URL } from '../../lib/config'

const TEMPLATE_COLORS: Record<string, string> = {
  autoshop: 'from-blue-600 to-blue-800',
  bakery: 'from-amber-600 to-amber-800',
  dental: 'from-cyan-600 to-cyan-800',
  massage: 'from-violet-600 to-violet-800',
  'skaha-cafe': 'from-yellow-600 to-yellow-800',
  winery: 'from-rose-700 to-rose-900',
}

const TEMPLATE_PREVIEW_SLUGS: Record<string, string> = {
  autoshop: 'autoshop',
  bakery: 'bakery-service',
  dental: 'dental-cabinet',
  massage: 'massage-service',
  'skaha-cafe': 'skaha-beach-cafe',
  winery: 'winery',
}

interface TemplateCardProps {
  template: TemplateMeta
  selected: boolean
  onSelect: (slug: string) => void
}

export function TemplateCard({ template, selected, onSelect }: TemplateCardProps) {
  const gradient = TEMPLATE_COLORS[template.slug] ?? 'from-slate-600 to-slate-800'
  const previewSlug = TEMPLATE_PREVIEW_SLUGS[template.slug]

  return (
    <div
      className={`section-card card-hover w-full text-left transition-all ${
        selected ? 'ring-2 ring-accent ring-offset-2 ring-offset-surface dark:ring-offset-[#1a1d23]' : ''
      }`}
    >
      <button type="button" aria-pressed={selected} onClick={() => onSelect(template.slug)} className="w-full">
        <div className={`flex h-32 items-center justify-center rounded-t-[20px] bg-gradient-to-br ${gradient}`}>
          <span className="text-2xl font-bold text-white/90">{template.title}</span>
        </div>
        <div className="p-4 pb-2">
          <h3 className="text-sm font-medium text-slate-800 dark:text-white">{template.title}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{template.description}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {template.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600 dark:bg-slate-700 dark:text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </button>
      {previewSlug && (
        <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-700">
          <a
            href={`${SAMPLE_APPS_URL}/${previewSlug}/`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            Preview live sample <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  )
}
