import { useEffect } from 'react'
import { SITE_NAME, SITE_URL } from '../config/site'

function setMeta(selector, attr, key, content) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Meta por rota sem dependência extra. `path` vira o canonical (só páginas públicas).
export default function usePageMeta({ title, description, path }) {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle
    if (description) {
      setMeta('meta[name="description"]', 'name', 'description', description)
      setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    }
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    if (path !== undefined) {
      const url = `${SITE_URL}${path}`
      setCanonical(url)
      setMeta('meta[property="og:url"]', 'property', 'og:url', url)
    }
  }, [title, description, path])
}
