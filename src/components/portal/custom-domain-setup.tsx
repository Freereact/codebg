import { useState, useEffect } from 'react'
import { Globe, CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { setDomain, verifyDomainDns, getDomainStatus, removeDomain } from '../../lib/domain-api'
import type { DomainStatus } from '../../types/portal'

interface CustomDomainSetupProps {
  projectId: string
  domain: string | null
  domainStatus: DomainStatus | null
}

export function CustomDomainSetup({
  projectId,
  domain: initialDomain,
  domainStatus: initialStatus,
}: CustomDomainSetupProps) {
  const [domain, setDomainValue] = useState(initialDomain)
  const [status, setStatus] = useState<DomainStatus | null>(initialStatus)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [dnsInstructions, setDnsInstructions] = useState<{ target: string; altTarget: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // Poll for status when provisioning
  useEffect(() => {
    if (status !== 'ssl_provisioning') return
    const interval = setInterval(async () => {
      const res = await getDomainStatus(projectId)
      if (res.ok && res.data.domainStatus !== 'ssl_provisioning') {
        setStatus(res.data.domainStatus)
        if (res.data.domainStatus === 'error') setError(res.data.domainError ?? 'Provisioning failed')
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [status, projectId])

  const handleSetDomain = async () => {
    if (!inputValue.trim()) return
    setError('')
    setLoading(true)
    const res = await setDomain(projectId, inputValue.trim())
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDomainValue(res.data.domain)
    setStatus(res.data.domainStatus)
    setDnsInstructions({
      target: res.data.dnsInstructions.target,
      altTarget: res.data.dnsInstructions.alternativeTarget,
    })
  }

  const handleVerify = async () => {
    setError('')
    setLoading(true)
    const res = await verifyDomainDns(projectId)
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setStatus(res.data.domainStatus)
    if (!res.data.verified) {
      setError('DNS record not detected yet. It can take up to 48 hours to propagate. Try again shortly.')
    }
  }

  const handleRemove = async () => {
    setError('')
    setLoading(true)
    const res = await removeDomain(projectId)
    setLoading(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setDomainValue(null)
    setStatus(null)
    setDnsInstructions(null)
    setInputValue('')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Active domain
  if (status === 'active' && domain) {
    return (
      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800/50 dark:bg-green-900/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-600 dark:text-green-400" />
            <a
              href={`https://${domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-800 hover:underline dark:text-green-300"
            >
              {domain} <ExternalLink size={12} className="ml-1 inline" />
            </a>
          </div>
          <button
            onClick={handleRemove}
            disabled={loading}
            className="text-xs text-slate-400 hover:text-red-500"
            aria-label="Remove custom domain"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )
  }

  // Provisioning in progress
  if (status === 'ssl_provisioning' || status === 'dns_verified') {
    return (
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/50 dark:bg-amber-900/20">
        <div className="flex items-center gap-2">
          <Loader2 size={16} className="animate-spin text-amber-600 dark:text-amber-400" />
          <span className="text-sm text-amber-800 dark:text-amber-300">Provisioning SSL for {domain}...</span>
        </div>
      </div>
    )
  }

  // Error state
  if (status === 'error') {
    return (
      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800/50 dark:bg-red-900/20">
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 dark:text-red-400" />
          <span className="text-sm text-red-800 dark:text-red-300">{error || 'Domain setup failed'}</span>
        </div>
        <div className="mt-2 flex gap-2">
          <Button onClick={handleVerify} disabled={loading}>
            {loading ? 'Retrying...' : 'Retry'}
          </Button>
          <button onClick={handleRemove} disabled={loading} className="text-xs text-slate-400 hover:text-red-500">
            Remove
          </button>
        </div>
      </div>
    )
  }

  // Pending — show DNS instructions as a guided checklist
  if (status === 'pending' && domain) {
    const cnameTarget = dnsInstructions?.target ?? 'custom.codebg.com'
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-3 text-xs font-medium text-slate-800 dark:text-slate-200">
          Connect <strong>{domain}</strong> — 2 steps:
        </p>

        <div className="mb-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              1
            </span>
            <div>
              <p>Go to your domain provider and add this DNS record:</p>
              <div className="mt-1 flex items-center gap-2 rounded bg-slate-100 px-2 py-1.5 font-mono dark:bg-slate-700">
                <span className="flex-1">CNAME → {cnameTarget}</span>
                <button
                  onClick={() => copyToClipboard(cnameTarget)}
                  className="shrink-0 text-slate-400 hover:text-accent"
                  aria-label="Copy CNAME target"
                >
                  {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                </button>
              </div>
              {dnsInstructions?.altTarget && (
                <p className="mt-1 text-[11px] text-slate-400">
                  Apex domain? Use A record → {dnsInstructions.altTarget}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 text-[10px] font-bold text-slate-400 dark:border-slate-600">
              2
            </span>
            <p>Click verify once your DNS record is saved (can take a few minutes to propagate).</p>
          </div>
        </div>

        {error && (
          <div className="mb-2 rounded bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            {error}
          </div>
        )}
        <div className="flex gap-2">
          <Button onClick={handleVerify} disabled={loading}>
            {loading ? 'Checking...' : 'Verify DNS'}
          </Button>
          <button onClick={handleRemove} disabled={loading} className="text-xs text-slate-400 hover:text-red-500">
            Cancel
          </button>
        </div>
      </div>
    )
  }

  // No domain — setup form
  return (
    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex items-center gap-2 mb-2">
        <Globe size={14} className="text-accent" />
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Custom domain</span>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="mybusiness.com"
          className="input flex-1 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleSetDomain()}
        />
        <Button onClick={handleSetDomain} disabled={loading || !inputValue.trim()}>
          {loading ? 'Setting up...' : 'Set up'}
        </Button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
