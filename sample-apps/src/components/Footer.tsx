function getMainSiteUrl(): string {
  const host = window.location.hostname
  // test-sample-apps.codebg.com → test.codebg.com
  // sample-apps.codebg.com → codebg.com
  // anything else (local dev) → codebg.com
  if (host.startsWith('test-sample-apps.')) return `https://test.${host.replace('test-sample-apps.', '')}`
  if (host.startsWith('sample-apps.')) return `https://${host.replace('sample-apps.', '')}`
  return 'https://codebg.com'
}

export default function Footer() {
  const siteUrl = getMainSiteUrl()

  return (
    <footer className="card footer">
      <p>
        Sample site by{' '}
        <a href={siteUrl} target="_blank" rel="noreferrer">
          CodeBG
        </a>
        . Want your own version?{' '}
        <a href={`${siteUrl}#contact`} target="_blank" rel="noreferrer">
          Contact us
        </a>
        .
      </p>
    </footer>
  )
}
