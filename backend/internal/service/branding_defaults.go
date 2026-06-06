package service

import "strings"

const (
	legacyBrandSiteName      = "Sub2API"
	defaultBrandSiteName     = "LLMRelay"
	legacyBrandSiteSubtitle  = "Subscription to API Conversion Platform"
	defaultBrandSiteSubtitle = "AI API Gateway Platform"
)

func normalizeBrandSiteName(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" || trimmed == legacyBrandSiteName {
		return defaultBrandSiteName
	}
	return trimmed
}

func normalizeBrandSiteSubtitle(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" || trimmed == legacyBrandSiteSubtitle {
		return defaultBrandSiteSubtitle
	}
	return trimmed
}
