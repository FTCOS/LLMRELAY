<script setup lang="ts">
/**
 * UsageView (UsageLLMRELAY.vue) — 详细用量分析
 * 自包裹 AppLayoutLLMRELAY。Apple 清新风。
 *
 * 真实 API（fork 现存，shape 已核对）：
 *  - usageAPI.getDashboardStats()    概览（total_requests/total_tokens/total_actual_cost/average_duration_ms）
 *  - usageAPI.getDashboardTrend()    趋势柱图（trend[]: {date,total_tokens}）
 *  - usageAPI.getDashboardModels()   模型分布（models[]: {model,total_tokens}）
 *  - usageAPI.query({page,page_size,start_date,end_date})  分页日志（UsageLog）
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import AppLayoutLLMRELAY from '@/components/layout/AppLayoutLLMRELAY.vue'
import usageAPI from '@/api/usage'
import Chart from 'chart.js/auto'
import type { UsageLog } from '@/types'
import type { UserDashboardStats } from '@/api/usage'

const { t, locale } = useI18n()
const appStore = useAppStore()
const isZh = computed(() => locale.value === 'zh')

const stats = ref<UserDashboardStats | null>(null)
const logs = ref<UsageLog[]>([])
const page = ref(1)
const pageSize = 15
const total = ref(0)
const range = ref<'7d' | '30d' | 'all'>('7d')
const loadingLogs = ref(false)
const trendCanvas = ref<HTMLCanvasElement | null>(null)
const modelCanvas = ref<HTMLCanvasElement | null>(null)
let trendChart: Chart | null = null
let modelChart: Chart | null = null

function usd(n: number | null | undefined): string {
  const v = Number(n || 0)
  return '$' + v.toFixed(v !== 0 && Math.abs(v) < 1 ? 4 : 2)
}
function compact(n: number | null | undefined): string {
  const v = Number(n || 0)
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B'
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M'
  if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K'
  return String(v)
}
function accent(): string { return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#0071e3' }
function accentSoft(): string { return getComputedStyle(document.documentElement).getPropertyValue('--accent-soft').trim() || '#e9f2ff' }

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const avgMs = computed(() => (stats.value?.average_duration_ms ? Math.round(stats.value.average_duration_ms) + 'ms' : '—'))

function dateParams() {
  if (range.value === 'all') return {}
  const now = new Date()
  const days = range.value === '7d' ? 7 : 30
  const start = new Date(now.getTime() - days * 86400000)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  return { start_date: fmt(start), end_date: fmt(now) }
}

function fmtTime(s: string): string {
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  return d.toLocaleString(isZh.value ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadLogs() {
  loadingLogs.value = true
  try {
    const res = await usageAPI.query({ page: page.value, page_size: pageSize, ...dateParams() })
    logs.value = res.items || []
    total.value = res.total || 0
  } catch { appStore.showError(t('user.usage.empty')) }
  finally { loadingLogs.value = false }
}

function renderTrend(trend: { date: string; total_tokens: number }[]) {
  if (!trendCanvas.value) return
  if (trendChart) trendChart.destroy()
  const ctx = trendCanvas.value.getContext('2d')!
  const grad = ctx.createLinearGradient(0, 0, 0, 180)
  grad.addColorStop(0, accent()); grad.addColorStop(1, accentSoft())
  trendChart = new Chart(ctx, {
    type: 'bar',
    data: { labels: trend.map((p) => p.date.slice(5)), datasets: [{ data: trend.map((p) => p.total_tokens), backgroundColor: grad, borderRadius: 6, maxBarThickness: 26 }] },
    options: { responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => compact(c.parsed.y) + ' tokens' } } },
      scales: { x: { grid: { display: false }, ticks: { color: '#86868b', font: { size: 11 } }, border: { display: false } },
        y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: '#86868b', font: { size: 11 }, callback: (v) => compact(Number(v)) }, border: { display: false } } } }
  })
}
function renderModels(models: { model: string; total_tokens: number }[]) {
  if (!modelCanvas.value) return
  if (modelChart) modelChart.destroy()
  const top = [...models].sort((a, b) => b.total_tokens - a.total_tokens).slice(0, 6)
  const palette = ['#C96442', '#10A37F', '#4D6BFE', '#6E56CF', '#0891b2', '#aeaeb2']
  const ctx = modelCanvas.value.getContext('2d')!
  modelChart = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: top.map((m) => m.model.slice(0, 22)), datasets: [{ data: top.map((m) => m.total_tokens), backgroundColor: palette, borderWidth: 0, hoverOffset: 6 }] },
    options: { responsive: true, maintainAspectRatio: false, cutout: '64%',
      plugins: { legend: { position: 'right', labels: { color: '#515154', font: { size: 12 }, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' } } } }
  })
}

async function setRange(r: '7d' | '30d' | 'all') {
  range.value = r; page.value = 1
  await loadLogs()
}
function go(p: number) { if (p >= 1 && p <= totalPages.value) { page.value = p; loadLogs() } }

async function load() {
  try {
    const s = await usageAPI.getDashboardStats(); stats.value = s
  } catch { /* noop */ }
  await loadLogs()
  await nextTick()
  usageAPI.getDashboardTrend().then((r) => renderTrend(r.trend || [])).catch(() => {})
  usageAPI.getDashboardModels().then((r) => renderModels(r.models || [])).catch(() => {})
}
onMounted(load)
onBeforeUnmount(() => { if (trendChart) trendChart.destroy(); if (modelChart) modelChart.destroy() })
</script>

<template>
  <AppLayoutLLMRELAY>
    <div class="usage" data-screen-label="Usage">
      <div class="head">
        <div><h1 class="title">{{ t('user.usage.title') }}</h1><p class="sub">{{ t('user.usage.sub') }}</p></div>
        <div class="range-seg">
          <button :class="{ on: range === '7d' }" @click="setRange('7d')">{{ t('user.usage.r7d') }}</button>
          <button :class="{ on: range === '30d' }" @click="setRange('30d')">{{ t('user.usage.r30d') }}</button>
          <button :class="{ on: range === 'all' }" @click="setRange('all')">{{ t('user.usage.rall') }}</button>
        </div>
      </div>

      <div class="grid g4 cards">
        <div class="stat"><div class="stat-l">{{ t('user.usage.stats.reqs') }}</div><div class="stat-v">{{ compact(stats?.total_requests) }}</div></div>
        <div class="stat"><div class="stat-l">{{ t('user.usage.stats.tokens') }}</div><div class="stat-v">{{ compact(stats?.total_tokens) }}</div></div>
        <div class="stat"><div class="stat-l">{{ t('user.usage.stats.cost') }}</div><div class="stat-v accent">{{ usd(stats?.total_actual_cost) }}</div></div>
        <div class="stat"><div class="stat-l">{{ t('user.usage.stats.avg') }}</div><div class="stat-v">{{ avgMs }}</div></div>
      </div>

      <div class="grid two">
        <div class="card"><div class="card-head"><div class="card-title">{{ t('user.usage.trend') }}</div><div class="card-sub">{{ t('user.usage.trendUnit') }}</div></div><div class="chart-wrap"><canvas ref="trendCanvas"></canvas></div></div>
        <div class="card"><div class="card-head"><div class="card-title">{{ t('user.usage.models') }}</div><div class="card-sub">{{ t('user.usage.modelsUnit') }}</div></div><div class="chart-wrap"><canvas ref="modelCanvas"></canvas></div></div>
      </div>

      <div class="card">
        <div class="card-head"><div class="card-title">{{ t('user.usage.logTitle') }}</div></div>
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr><th>{{ t('user.usage.cols.time') }}</th><th>{{ t('user.usage.cols.model') }}</th><th class="num">{{ t('user.usage.cols.tokens') }}</th><th class="num">{{ t('user.usage.cols.cost') }}</th><th class="num">{{ t('user.usage.cols.dur') }}</th><th>{{ t('user.usage.cols.status') }}</th></tr></thead>
            <tbody>
              <tr v-if="loadingLogs"><td colspan="6" class="center muted">…</td></tr>
              <tr v-else-if="!logs.length"><td colspan="6" class="center muted">{{ t('user.usage.empty') }}</td></tr>
              <tr v-for="r in logs" :key="r.id">
                <td class="mono small">{{ fmtTime(r.created_at) }}</td>
                <td class="model-cell">{{ r.model }}</td>
                <td class="num mono">{{ compact((r.input_tokens || 0) + (r.output_tokens || 0)) }}</td>
                <td class="num mono">{{ usd(r.actual_cost) }}</td>
                <td class="num mono small">{{ r.duration_ms ? r.duration_ms + 'ms' : '—' }}</td>
                <td><span class="tag tag-green"><span class="d"></span>{{ t('user.usage.ok') }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="totalPages > 1" class="pager">
          <button class="pg" :disabled="page <= 1" @click="go(page - 1)">{{ t('user.usage.prev') }}</button>
          <span class="pg-info">{{ t('user.usage.page', { n: page }) }} / {{ totalPages }}</span>
          <button class="pg" :disabled="page >= totalPages" @click="go(page + 1)">{{ t('user.usage.next') }}</button>
        </div>
      </div>
    </div>
  </AppLayoutLLMRELAY>
</template>

<style scoped>
.usage { padding: 26px 30px 60px; max-width: 1180px; }
.usage * { box-sizing: border-box; }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.title { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; }
.sub { font-size: 15px; color: var(--ink-2); margin-top: 4px; }

.range-seg { display: flex; background: rgba(0,0,0,0.05); border-radius: var(--pill); padding: 2px; }
.range-seg button { border: none; background: transparent; padding: 7px 14px; border-radius: var(--pill); font-size: 13px; font-weight: 600; color: var(--ink-3); cursor: pointer; transition: all .15s; }
.range-seg button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.14); }

.grid { display: grid; gap: 16px; }
.g4 { grid-template-columns: repeat(4, 1fr); }
.two { grid-template-columns: 1fr 1fr; }
.cards, .grid.two { margin-bottom: 16px; }

.stat { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); padding: 18px 20px; box-shadow: var(--card-shadow); }
.stat-l { font-size: 12.5px; color: var(--ink-3); font-weight: 500; margin-bottom: 8px; }
.stat-v { font-size: 26px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.stat-v.accent { color: var(--accent-ink); }
:global(html[data-dir='mono']) .stat-v.accent { color: var(--ink); }

.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); box-shadow: var(--card-shadow); padding: 22px 24px; }
.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 620; letter-spacing: -0.01em; }
.card-sub { font-size: 12.5px; color: var(--ink-3); }
.chart-wrap { height: 200px; position: relative; }

.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tbl th { text-align: left; font-size: 11.5px; color: var(--ink-3); font-weight: 600; padding: 0 12px 11px; }
.tbl th.num, .tbl td.num { text-align: right; }
.tbl td { padding: 11px 12px; border-top: 1px solid var(--line-2); }
.tbl tbody tr:hover td { background: var(--surface-2); }
.model-cell { font-weight: 500; max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: var(--mono); }
.small { font-size: 12.5px; color: var(--ink-3); }
.muted { color: var(--ink-3); } .center { text-align: center; padding: 24px 0; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: var(--pill); }
.tag .d { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tag-green { background: #e6f7ee; color: #14794a; }

.pager { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 18px; }
.pg { border: 1px solid var(--line); background: #fff; border-radius: 9px; padding: 7px 16px; font-size: 13px; font-weight: 500; color: var(--ink-2); cursor: pointer; font-family: inherit; }
.pg:hover:not(:disabled) { background: var(--surface); }
.pg:disabled { opacity: .45; cursor: default; }
.pg-info { font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; }

@media (max-width: 900px) { .usage { padding: 20px; } .g4 { grid-template-columns: repeat(2,1fr); } .two { grid-template-columns: 1fr; } .head { flex-direction: column; align-items: flex-start; } }
</style>
