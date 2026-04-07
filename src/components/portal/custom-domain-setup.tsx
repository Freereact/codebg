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
      setError(res.data.reason ?? 'DNS not pointing to our server yet')
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

  // Pending — show DNS instructions
  if (status === 'pending' && domain) {
    return (
      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50">
        <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">
          Add this DNS record at your domain provider:
        </p>
        <div className="mb-2 rounded bg-slate-100 p-2 font-mono text-xs dark:bg-slate-700">
          <div className="flex items-center justify-between">
            <span>
              CNAME {domain} → {dnsInstructions?.target ?? 'custom.codebg.com'}
            </span>
            <button
              onClick={() => copyToClipboard(dnsInstructions?.target ?? 'custom.codebg.com')}
              className="text-slate-400 hover:text-accent"
              aria-label="Copy CNAME target"
            >
              {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
        {dnsInstructions?.altTarget && (
          <p className="mb-2 text-[11px] text-slate-500 dark:text-slate-400">
            Or A record: {domain} → {dnsInstructions.altTarget}
          </p>
        )}
        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
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
