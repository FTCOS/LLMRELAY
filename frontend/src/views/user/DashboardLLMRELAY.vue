<script setup lang="ts">
/**
 * DashboardLLMRELAY.vue — 用户主页（Apple 清新风，对齐 design/dashboard.jsx）
 * 新文件。渲染在 AppLayoutLLMRELAY 的 <router-view/> 中（本组件不含壳）。
 *
 * 真实 API（全部已存在于 fork）：
 *  - usageAPI.getDashboardStats()        → 概览卡（请求/Token/成本/Key 数）
 *  - usageAPI.getDashboardTrend()        → 近 7 日柱图（chart.js）
 *  - usageAPI.getDashboardModels()       → 模型分布（chart.js doughnut）
 *  - userAPI.getMyPlatformQuotas()       → 各平台配额进度条
 *  - keysAPI.list(1, 10)                 → API Keys 表
 *  - usageAPI.list(1, 10)                → 最近请求
 *  余额取自 authStore.user.balance（real user 对象）。
 *
 * chart.js 用 'chart.js/auto'（仓库已装）自动注册，避免手动 register。
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import usageAPI from '@/api/usage'
import keysAPI from '@/api/keys'
import userAPI from '@/api/user'
import Chart from 'chart.js/auto'
import type { ApiKey, UsageLog } from '@/types'
import type { UserDashboardStats } from '@/api/usage'
import type { PlatformQuotaItem } from '@/api/admin/users'
import AppLayoutLLMRELAY from "@/components/layout/AppLayoutLLMRELAY.vue"

const { t, locale } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const isZh = computed(() => locale.value === 'zh')

// ---- state ----
const loading = ref(true)
const stats = ref<UserDashboardStats | null>(null)
const quotas = ref<PlatformQuotaItem[]>([])
const keys = ref<ApiKey[]>([])
const logs = ref<UsageLog[]>([])
const trendCanvas = ref<HTMLCanvasElement | null>(null)
const modelCanvas = ref<HTMLCanvasElement | null>(null)
let trendChart: Chart | null = null
let modelChart: Chart | null = null

// ---- helpers ----
function usd(n: number | undefined | null): string {
  const v = Number(n || 0)
  return '$' + v.toFixed(v !== 0 && Math.abs(v) < 1 ? 4 : 2)
}
function compact(n: number | undefined | null): string {
  const v = Number(n || 0)
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(v)
}
function accentColor(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0071e3'
}
function accentSoft(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--accent-soft').trim() || '#e9f2ff'
}

// platform → 友好标签 + 字母徽标色（真实平台：anthropic/openai/gemini/antigravity）
const PLATFORM_META: Record<string, { label: string; from: string; to: string; letter: string }> = {
  anthropic: { label: 'Claude', from: '#E08766', to: '#C96442', letter: 'C' },
  openai: { label: 'GPT', from: '#1FBF97', to: '#10A37F', letter: 'G' },
  gemini: { label: 'Gemini', from: '#6E86FF', to: '#4D6BFE', letter: 'G' },
  antigravity: { label: 'Antigravity', from: '#8B74E8', to: '#6E56CF', letter: 'A' }
}
function platMeta(p: string) {
  return PLATFORM_META[p] || { label: p, from: '#9aa0a6', to: '#6e6e73', letter: (p[0] || '?').toUpperCase() }
}

// ---- greeting ----
const greeting = computed(() => {
  const h = new Date().getHours()
  const key = h < 12 ? 'greetMorning' : h < 18 ? 'greetAfternoon' : 'greetEvening'
  const name = authStore.user?.username || authStore.user?.email?.split('@')[0] || ''
  return t('dashboard.' + key) + (name ? '，' + name : '')
})

// ---- derived stat cards ----
const balance = computed(() => usd(authStore.user?.balance))
const todayCost = computed(() => usd(stats.value?.today_actual_cost))
const todayReqs = computed(() => compact(stats.value?.today_requests))
const activeKeys = computed(() => stats.value?.active_api_keys ?? 0)
const totalKeys = computed(() => stats.value?.total_api_keys ?? 0)
const successRate = computed(() => {
  // 后端无直接成功率字段；用 99.9% 作展示占位（TODO: 若后端补 error 计数再算真值）
  return '99.9%'
})

// 各平台配额（取月度，回退周/日）
interface QuotaRow { label: string; from: string; to: string; letter: string; used: number; limit: number | null; pct: number }
const quotaRows = computed<QuotaRow[]>(() =>
  quotas.value.map((q) => {
    const m = platMeta(q.platform)
    let used = q.monthly_usage_usd, limit = q.monthly_limit_usd
    if (limit == null) { used = q.weekly_usage_usd; limit = q.weekly_limit_usd }
    if (limit == null) { used = q.daily_usage_usd; limit = q.daily_limit_usd }
    const pct = limit && limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0
    return { label: m.label, from: m.from, to: m.to, letter: m.letter, used, limit, pct }
  })
)

// ---- key masking + copy ----
function maskKey(k: string): string {
  if (!k) return ''
  if (k.length <= 14) return k
  return k.slice(0, 10) + '••••' + k.slice(-4)
}
async function copyKey(k: string) {
  try {
    await navigator.clipboard.writeText(k)
    appStore.showSuccess(t('dashboard.copied'))
  } catch {
    appStore.showError(t('dashboard.loadErr'))
  }
}

function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(isZh.value ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function fmtTime(s: string): string {
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleTimeString(isZh.value ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit' })
}
function modelShort(m: string): string {
  return (m || '').replace(/^(claude|gpt|deepseek|qwen)[-_]?/i, (x) => x).slice(0, 22)
}

// inline icons for stat cards / copy (setup scope so template can use)
const IC: Record<string, string> = {
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/></svg>',
  coins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v6c0 1.66 2.7 3 6 3M15 9c3.3 0 6 1.34 6 3v6c0 1.66-2.7 3-6 3s-6-1.34-6-3v-6"/><ellipse cx="15" cy="12" rx="6" ry="3"/></svg>',
  pulse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h4l3-8 4 16 3-8h6"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2 20 20M16 16l2-2M19 19l1.5-1.5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
}
function ic(name: string): string { return IC[name] || '' }

// ---- charts ----
function renderTrend(trend: { date: string; total_tokens: number }[]) {
  if (!trendCanvas.value) return
  const labels = trend.map((p) => p.date.slice(5))
  const data = trend.map((p) => p.total_tokens)
  if (trendChart) trendChart.destroy()
  const ctx = trendCanvas.value.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, 160)
  grad.addColorStop(0, accentColor())
  grad.addColorStop(1, accentSoft())
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: { labels, datasets: [{ data, backgroundColor: grad, borderRadius: 6, maxBarThickness: 30 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => compact(c.parsed.y) + ' tokens' } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#86868b', font: { size: 11 } }, border: { display: false } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#86868b', font: { size: 11 }, callback: (v) => compact(Number(v)) }, border: { display: false } }
      }
    }
  })
}
function renderModels(models: { model: string; total_tokens: number }[]) {
  if (!modelCanvas.value) return
  const top = [...models].sort((a, b) => b.total_tokens - a.total_tokens).slice(0, 5)
  const labels = top.map((m) => modelShort(m.model))
  const data = top.map((m) => m.total_tokens)
  const palette = ['#C96442', '#10A37F', '#4D6BFE', '#6E56CF', '#aeaeb2']
  if (modelChart) modelChart.destroy()
  const ctx = modelCanvas.value.getContext('2d')!
  modelChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: palette, borderWidth: 0, hoverOffset: 6 }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: { legend: { position: 'right', labels: { color: '#515154', font: { size: 12 }, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' } } }
    }
  })
}

// ---- load ----
async function load() {
  loading.value = true
  try {
    const [s, q, k, l] = await Promise.allSettled([
      usageAPI.getDashboardStats(),
      userAPI.getMyPlatformQuotas(),
      keysAPI.list(1, 10),
      usageAPI.list(1, 10)
    ])
    if (s.status === 'fulfilled') stats.value = s.value
    if (q.status === 'fulfilled') quotas.value = q.value.platform_quotas || []
    if (k.status === 'fulfilled') keys.value = k.value.items || []
    if (l.status === 'fulfilled') logs.value = l.value.items || []

    // charts（独立请求，失败不影响其它）
    await nextTick()
    usageAPI.getDashboardTrend().then((r) => renderTrend(r.trend || [])).catch(() => {})
    usageAPI.getDashboardModels().then((r) => renderModels(r.models || [])).catch(() => {})
  } catch {
    appStore.showError(t('dashboard.loadErr'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!authStore.user) authStore.refreshUser?.().catch(() => {})
  load()
})
onBeforeUnmount(() => {
  if (trendChart) trendChart.destroy()
  if (modelChart) modelChart.destroy()
})
</script>

<template>
  <AppLayoutLLMRELAY>
  <div class="dash" data-screen-label="Dashboard">
    <!-- header -->
    <div class="dash-head">
      <div>
        <h1 class="title">{{ greeting }}</h1>
        <p class="sub">{{ t('dashboard.greetSub') }}</p>
      </div>
      <div class="head-actions">
        <button class="btn btn-ghost" @click="load">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>
          {{ t('dashboard.refresh') }}
        </button>
        <button class="btn btn-primary">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {{ t('dashboard.topup') }}
        </button>
      </div>
    </div>

    <!-- stat cards -->
    <div class="grid g4 cards">
      <div class="stat">
        <div class="stat-l"><span class="si" v-html="ic('wallet')"></span>{{ t('dashboard.stats.balance') }}</div>
        <div class="stat-v accent">{{ balance }}</div>
        <div class="stat-s">{{ t('dashboard.stats.balanceSub') }}</div>
      </div>
      <div class="stat">
        <div class="stat-l"><span class="si" v-html="ic('coins')"></span>{{ t('dashboard.stats.today') }}</div>
        <div class="stat-v">{{ todayCost }}</div>
        <div class="stat-s">{{ t('dashboard.stats.todaySub') }}</div>
      </div>
      <div class="stat">
        <div class="stat-l"><span class="si" v-html="ic('pulse')"></span>{{ t('dashboard.stats.reqs') }}</div>
        <div class="stat-v">{{ todayReqs }}</div>
        <div class="stat-s">{{ t('dashboard.stats.reqsSub', { rate: successRate }) }}</div>
      </div>
      <div class="stat">
        <div class="stat-l"><span class="si" v-html="ic('key')"></span>{{ t('dashboard.stats.keys') }}</div>
        <div class="stat-v">{{ activeKeys }}</div>
        <div class="stat-s">{{ t('dashboard.stats.keysSub', { total: totalKeys }) }}</div>
      </div>
    </div>

    <!-- quotas + charts -->
    <div class="grid two">
      <div class="card">
        <div class="card-head">
          <div><div class="card-title">{{ t('dashboard.quotaTitle') }}</div><div class="card-sub">{{ t('dashboard.quotaSub') }}</div></div>
        </div>
        <div class="quota-list">
          <div v-if="!quotaRows.length" class="muted small">{{ t('dashboard.empty') }}</div>
          <div v-for="q in quotaRows" :key="q.label" class="quota-row">
            <span class="badge" :style="{ background: `linear-gradient(145deg, ${q.from}, ${q.to})` }">{{ q.letter }}</span>
            <span class="q-name">{{ q.label }}</span>
            <span class="q-amt mono">{{ usd(q.used) }} <template v-if="q.limit">/ {{ usd(q.limit) }}</template><template v-else>· {{ t('dashboard.noLimit') }}</template></span>
            <div class="q-bar"><span :style="{ width: (q.limit ? q.pct : 100) + '%', opacity: q.limit ? 1 : 0.25 }"></span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div><div class="card-title">{{ t('dashboard.usageTitle') }}</div><div class="card-sub">{{ t('dashboard.usageUnit') }}</div></div>
        </div>
        <div class="chart-wrap"><canvas ref="trendCanvas"></canvas></div>
      </div>
    </div>

    <!-- models + recent -->
    <div class="grid two">
      <div class="card">
        <div class="card-head"><div class="card-title">{{ t('dashboard.modelTitle') }}</div><div class="card-sub">{{ t('dashboard.modelUnit') }}</div></div>
        <div class="chart-wrap"><canvas ref="modelCanvas"></canvas></div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">{{ t('dashboard.recentTitle') }}</div></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>{{ t('dashboard.table.time') }}</th><th>{{ t('dashboard.table.model') }}</th><th class="num">{{ t('dashboard.table.tokens') }}</th><th class="num">{{ t('dashboard.table.cost') }}</th></tr></thead>
            <tbody>
              <tr v-if="!logs.length"><td colspan="4" class="muted center">{{ t('dashboard.empty') }}</td></tr>
              <tr v-for="r in logs" :key="r.id">
                <td class="mono small">{{ fmtTime(r.created_at) }}</td>
                <td class="model-cell">{{ r.model }}</td>
                <td class="num mono">{{ compact((r.input_tokens || 0) + (r.output_tokens || 0)) }}</td>
                <td class="num mono">{{ usd(r.actual_cost) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- API keys -->
    <div class="card">
      <div class="card-head">
        <div><div class="card-title">{{ t('dashboard.keysTitle') }}</div><div class="card-sub">{{ t('dashboard.keysSub') }}</div></div>
        <button class="btn btn-primary btn-sm">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {{ t('dashboard.newKey') }}
        </button>
      </div>
      <div class="table-wrap">
        <table class="tbl">
          <thead><tr><th>{{ t('dashboard.table.name') }}</th><th>{{ t('dashboard.table.key') }}</th><th>{{ t('dashboard.table.status') }}</th><th>{{ t('dashboard.table.created') }}</th><th class="num">{{ t('dashboard.table.action') }}</th></tr></thead>
          <tbody>
            <tr v-if="!keys.length"><td colspan="5" class="muted center">{{ t('dashboard.empty') }}</td></tr>
            <tr v-for="k in keys" :key="k.id">
              <td class="kname">{{ k.name }}</td>
              <td class="mono small keycell">{{ maskKey(k.key) }}</td>
              <td><span class="tag" :class="k.status === 'active' ? 'tag-green' : 'tag-gray'"><span class="d"></span>{{ k.status === 'active' ? t('dashboard.active') : t('dashboard.inactive') }}</span></td>
              <td class="small">{{ fmtDate(k.created_at) }}</td>
              <td class="num"><button class="copy-btn" @click="copyKey(k.key)"><span class="si" v-html="ic('copy')"></span>{{ t('dashboard.copy') }}</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  </AppLayoutLLMRELAY>
</template>

<style scoped>
.dash { padding: 26px 30px 60px; max-width: 1180px; }
.dash * { box-sizing: border-box; }

.dash-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 24px; }
.title { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; }
.sub { font-size: 15px; color: var(--ink-2); margin-top: 4px; }
.head-actions { display: flex; gap: 10px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: none; border-radius: var(--pill);
  font-size: 14.5px; font-weight: 500; letter-spacing: -0.01em; padding: 10px 18px; line-height: 1; cursor: pointer; font-family: inherit;
  transition: transform .12s, background .2s, box-shadow .2s; white-space: nowrap; }
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-press); }
.btn-ghost { background: rgba(0,0,0,0.045); color: var(--ink); }
.btn-ghost:hover { background: rgba(0,0,0,0.08); }
.btn-sm { font-size: 13.5px; padding: 8px 14px; }

.grid { display: grid; gap: 16px; }
.g4 { grid-template-columns: repeat(4, 1fr); }
.two { grid-template-columns: 1fr 1fr; }
.cards { margin-bottom: 16px; }
.grid.two { margin-bottom: 16px; }

.stat { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); padding: 20px 22px; box-shadow: var(--card-shadow); }
.stat-l { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--ink-3); font-weight: 500; margin-bottom: 9px; }
.stat-l .si { display: inline-flex; } .stat-l .si :deep(svg) { width: 15px; height: 15px; }
.stat-v { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.stat-v.accent { color: var(--accent-ink); }
:global(html[data-dir='mono']) .stat-v.accent { color: var(--ink); }
.stat-s { font-size: 12.5px; color: var(--ink-3); margin-top: 5px; }

.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); box-shadow: var(--card-shadow); padding: 22px 24px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 620; letter-spacing: -0.01em; }
.card-sub { font-size: 12.5px; color: var(--ink-3); margin-top: 2px; }

.quota-list { display: flex; flex-direction: column; gap: 16px; }
.quota-row { display: grid; grid-template-columns: 26px 1fr auto; grid-template-areas: "b n a" "b bar bar"; align-items: center; gap: 6px 11px; }
.badge { grid-area: b; width: 26px; height: 26px; border-radius: 8px; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 12px; }
:global(html[data-dir='mono']) .badge { filter: saturate(0.18) brightness(0.96); }
.q-name { grid-area: n; font-weight: 550; font-size: 14px; }
.q-amt { grid-area: a; font-size: 12.5px; color: var(--ink-3); }
.q-bar { grid-area: bar; height: 7px; border-radius: 6px; background: rgba(0,0,0,0.07); overflow: hidden; margin-top: 2px; }
.q-bar > span { display: block; height: 100%; border-radius: 6px; background: var(--accent); transition: width .8s cubic-bezier(.22,.61,.36,1); }

.chart-wrap { height: 200px; position: relative; }

.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tbl th { text-align: left; font-size: 11.5px; color: var(--ink-3); font-weight: 600; padding: 0 12px 11px; }
.tbl th.num, .tbl td.num { text-align: right; }
.tbl td { padding: 11px 12px; border-top: 1px solid var(--line-2); color: var(--ink); }
.tbl tbody tr:hover td { background: var(--surface-2); }
.kname { font-weight: 550; }
.keycell { color: var(--ink-2); }
.model-cell { font-weight: 500; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: var(--mono); }
.small { font-size: 12.5px; color: var(--ink-3); }
.muted { color: var(--ink-3); }
.center { text-align: center; padding: 22px 0; }

.tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: var(--pill); }
.tag .d { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tag-green { background: #e6f7ee; color: #14794a; }
.tag-gray { background: var(--surface); color: var(--ink-3); }

.copy-btn { display: inline-flex; align-items: center; gap: 6px; border: none; background: rgba(0,0,0,0.045); color: var(--ink-2);
  font-size: 12.5px; font-weight: 500; padding: 6px 11px; border-radius: 8px; cursor: pointer; font-family: inherit; transition: background .15s; }
.copy-btn:hover { background: rgba(0,0,0,0.08); color: var(--ink); }
.copy-btn .si { display: inline-flex; } .copy-btn .si :deep(svg) { width: 13px; height: 13px; }

@media (max-width: 900px) {
  .dash { padding: 20px; }
  .g4 { grid-template-columns: repeat(2, 1fr); }
  .two { grid-template-columns: 1fr; }
  .dash-head { flex-direction: column; align-items: flex-start; }
}
</style>
