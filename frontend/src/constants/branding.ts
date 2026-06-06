export const LEGACY_SITE_NAME = 'Sub2API'
export const DEFAULT_SITE_NAME = 'LLMRelay'
export const DEFAULT_SITE_LOGO = '/logo.svg'

export const LEGACY_SITE_SUBTITLE = 'Subscription to API Conversion Platform'
export const DEFAULT_SITE_SUBTITLE = 'AI API Gateway Platform'

export const DEFAULT_SITE_TITLE_SUFFIX = 'AI API Gateway'

export function normalizeSiteName(value?: string | null): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || trimmed === LEGACY_SITE_NAME) {
    return DEFAULT_SITE_NAME
  }
  return trimmed
}

export function normalizeSiteSubtitle(value?: string | null): string {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  if (!trimmed || trimmed === LEGACY_SITE_SUBTITLE) {
    return DEFAULT_SITE_SUBTITLE
  }
  return trimmed
}
