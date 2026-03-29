/**
 * CodeBG Review Overlay
 * Inert by default — only activates when parent frame sends 'enable-review' via postMessage.
 * In standalone mode (no parent frame): does nothing.
 */
;(function () {
  var reviewMode = false
  var activeEl = null

  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'enable-review') {
      if (!reviewMode) {
        reviewMode = true
        initOverlay()
      }
    }
  })

  function initOverlay() {
    var style = document.createElement('style')
    style.textContent =
      '[data-review-hover]{outline:2px solid #f97316;outline-offset:-2px;cursor:pointer;position:relative}' +
      '[data-review-hover]::after{content:attr(data-review-label);position:absolute;top:4px;right:4px;background:#f97316;color:#fff;font-size:12px;padding:2px 8px;border-radius:4px;pointer-events:none;font-family:sans-serif;z-index:9999}' +
      '.codebg-review-banner{position:fixed;top:0;left:0;right:0;padding:8px 16px;background:#f97316;color:#fff;text-align:center;font-size:14px;z-index:10000;font-family:sans-serif}'
    document.head.appendChild(style)

    var banner = document.createElement('div')
    banner.className = 'codebg-review-banner'
    banner.textContent = 'Review Mode — Click any section to leave feedback'
    document.body.prepend(banner)

    // Find all sections with id attributes (direct children of .page, or known IDs)
    var sections = document.querySelectorAll('[id]')
    sections.forEach(function (el) {
      // Skip tiny elements and scripts
      if (el.offsetHeight < 20) return
      if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'LINK') return

      el.addEventListener('mouseenter', function () {
        if (!reviewMode) return
        var heading = el.querySelector('h1, h2, h3')
        var label = heading ? heading.textContent.trim() : el.id
        el.setAttribute('data-review-hover', '')
        el.setAttribute('data-review-label', label)
        activeEl = el
      })

      el.addEventListener('mouseleave', function () {
        el.removeAttribute('data-review-hover')
        el.removeAttribute('data-review-label')
        if (activeEl === el) activeEl = null
      })

      el.addEventListener('click', function (e) {
        if (!reviewMode) return
        e.preventDefault()
        e.stopPropagation()

        var heading = el.querySelector('h1, h2, h3')
        var title = heading ? heading.textContent.trim() : el.id

        window.parent.postMessage(
          {
            type: 'section-click',
            sectionId: el.id,
            sectionTitle: title,
          },
          '*',
        )
      })
    })
  }
})()
