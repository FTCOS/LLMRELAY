<script setup lang="ts">
/**
 * KeyUsageLLMRELAY.vue — 公开「查询 API Key 用量」（Apple 清新风，对齐 design/keyusage.jsx）
 * 新文件，不覆盖现有 KeyUsageView.vue（接手时决定 swap）。
 *
 * 真实数据来源：网关端点 GET /v1/usage（注意：不是 /api/v1/...），
 * 用用户填入的 sk-relay key 作 Bearer。与原 KeyUsageView 同源同响应：
 *   - mode = 'quota_limited' → { status, quota{used,limit,remaining}, rate_limits[]{window,used,limit,reset_at}, expires_at }
 *   - 否则（钱包/订阅）       → { balance?, subscription?{daily/weekly/monthly_usage|limit_usd}, planName? }
 * 仅此一个端点 + settings/public（外壳）；不写 router（接手时接）。
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const appStore = useAppStore()

const apiKey = ref('')
const keyVisible = ref(false)
const loading = ref(false)
const error = ref('')
const data = ref<any>(null)
const animated = ref(false)
const now = ref(Date.now())
let clock: ReturnType<typeof setInterval> | null = null

const isZh = computed(() => locale.value === 'zh')

function usd(n: number): string {
  if (n == null || isNaN(n)) return '$0.00'
  return '$' + Number(n).toFixed(Number(n) < 1 ? 4 : 2)
}

// ---- fetch (gateway /v1/usage with the user's key) ----
async function query(): Promise<void> {
  const key = apiKey.value.trim()
  if (!key || loading.value) return
  error.value = ''
  loading.value = true
  animated.value = false
  try {
    const res = await fetch('/v1/usage', { headers: { Authorization: 'Bearer ' + key } })
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) throw new Error(t('keyusage.errInvalid'))
      const body = await res.json().catch(() => null)
      throw new Error(body?.error?.message || body?.message || t('keyusage.errGeneric'))
    }
    data.value = await res.json()
    // 挂载后触发环形动画
    nextTick(() => requestAnimationFrame(() => setTimeout(() => { animated.value = true }, 60)))
  } catch (e: any) {
    data.value = null
    error.value = e?.message || t('keyusage.errGeneric')
  } finally {
    loading.value = false
  }
}

// ---- derive rings from the real response ----
interface Ring { title: string; pct: number; amount: string; isBalance?: boolean; resetAt?: string | null }

const modeLabel = computed(() => {
  const d = data.value
  if (!d) return ''
  if (d.mode === 'quota_limited') return t('keyusage.modeQuota')
  if (d.subscription) return d.planName || t('keyusage.modeSub')
  return t('keyusage.modeWallet')
})

const isActive = computed(() => {
  const d = data.value
  if (!d) return false
  if (d.mode === 'quota_limited') return d.isValid !== false && d.status === 'active'
  return true
})

const rings = computed<Ring[]>(() => {
  const d = data.value
  if (!d) return []
  const items: Ring[] = []
  if (d.mode === 'quota_limited') {
    if (d.quota) {
      const pct = d.quota.limit > 0 ? Math.min(Math.round((d.quota.used / d.quota.limit) * 100), 100) : 0
      items.push({ title: t('keyusage.totalQuota'), pct, amount: `${usd(d.quota.used)} / ${usd(d.quota.limit)}` })
    }
    for (const rl of d.rate_limits || []) {
      const pct = rl.limit > 0 ? Math.min(Math.round((rl.used / rl.limit) * 100), 100) : 0
      const wl: Record<string, string> = { '5h': isZh.value ? '5 小时配额' : '5h quota', '1d': isZh.value ? '今日配额' : 'Daily', '7d': isZh.value ? '7 日配额' : '7-day' }
      items.push({ title: wl[rl.window] || rl.window, pct, amount: `${usd(rl.used)} / ${usd(rl.limit)}`, resetAt: rl.reset_at })
    }
  } else if (d.subscription) {
    const s = d.subscription
    const rows = [
      { l: isZh.value ? '今日配额' : 'Daily', u: s.daily_usage_usd, m: s.daily_limit_usd },
      { l: isZh.value ? '本周配额' : 'Weekly', u: s.weekly_usage_usd, m: s.weekly_limit_usd },
      { l: isZh.value ? '本月配额' : 'Monthly', u: s.monthly_usage_usd, m: s.monthly_limit_usd },
    ]
    for (const r of rows) {
      if (r.m != null && r.m > 0) {
        const pct = Math.min(Math.round((r.u / r.m) * 100), 100)
        items.push({ title: r.l, pct, amount: `${usd(r.u)} / ${usd(r.m)}` })
      }
    }
    if (d.balance != null) items.push({ title: t('keyusage.balance'), pct: 0, amount: usd(d.balance), isBalance: true })
  } else if (d.balance != null) {
    items.push({ title: t('keyusage.balance'), pct: 0, amount: usd(d.balance), isBalance: true })
  }
  return items
})

const detailRows = computed(() => {
  const d = data.value
  if (!d) return []
  const r = t('keyusage.rows') as any
  const out: { l: string; v: string }[] = []
  out.push({ l: r.name, v: d.name || d.key_name || r.unnamed })
  out.push({ l: r.mode, v: modeLabel.value })
  if (d.group_name || d.group) out.push({ l: r.group, v: d.group_name || d.group })
  if (d.balance != null) out.push({ l: r.balance, v: usd(d.balance) })
  if (d.created_at) out.push({ l: r.createdAt, v: fmtDate(d.created_at) })
  out.push({ l: r.expiresAt, v: d.expires_at ? fmtDate(d.expires_at) : r.never })
  if (d.last_used_at) out.push({ l: r.lastUsed, v: fmtDate(d.last_used_at) })
  return out
})

function fmtDate(s: string): string {
  const dt = new Date(s)
  if (isNaN(dt.getTime())) return s
  return dt.toLocaleDateString(isZh.value ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// 重置倒计时（相对时间，随时钟刷新）
function resetIn(iso?: string | null): string {
  if (!iso) return ''
  const ms = new Date(iso).getTime() - now.value
  if (isNaN(ms) || ms <= 0) return isZh.value ? '即将' : 'soon'
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const d = Math.floor(h / 24)
  if (d >= 1) return isZh.value ? `${d} 天后` : `in ${d}d`
  if (h >= 1) return isZh.value ? `${h} 小时后` : `in ${h}h`
  return isZh.value ? `${m} 分钟后` : `in ${m}m`
}

const C = 2 * Math.PI * 64
function ringOffset(r: Ring): number {
  if (!animated.value) return C
  if (r.isBalance) return 0
  return C - (Math.min(r.pct, 100) / 100) * C
}

function switchLang(c: 'zh' | 'en'): void { void setLocale(c) }
function goHome(): void { window.location.assign('/') } // TODO(router)

onMounted(() => {
  document.documentElement.setAttribute('data-dir', 'classic')
  if (!appStore.publicSettingsLoaded) void appStore.fetchPublicSettings()
  clock = setInterval(() => { now.value = Date.now() }, 30000)
})
onBeforeUnmount(() => { if (clock) clearInterval(clock) })
</script>

<template>
  <div class="ku-page" data-screen-label="KeyUsage">
    <div class="topbar">
      <div class="bar-inner">
        <a class="logo" href="/" @click.prevent="goHome">
          <span class="logo-mark" aria-hidden="true"></span>
          <span class="logo-word"><b>LLM</b><span class="r">RELAY</span></span>
        </a>
        <div class="spacer"></div>
        <a class="nav-link" href="/" @click.prevent="goHome">{{ isZh ? '首页' : 'Home' }}</a>
        <div class="lang">
          <button :class="{ on: isZh }" @click="switchLang('zh')">中</button>
          <button :class="{ on: !isZh }" @click="switchLang('en')">EN</button>
        </div>
      </div>
    </div>

    <main class="ku-main">
      <div class="head">
        <span class="eyebrow"><span class="dot"></span>LLMRELAY</span>
        <h1 class="h2">{{ t('keyusage.title') }}</h1>
        <p class="lead">{{ t('keyusage.subtitle') }}</p>
      </div>

      <div class="query-block">
        <div class="input-row">
          <div class="input-wrap">
            <span class="lock" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2 20 20M16 16l2-2M19 19l1.5-1.5"/></svg>
            </span>
            <input
              v-model="apiKey"
              class="input"
              :type="keyVisible ? 'text' : 'password'"
              :placeholder="t('keyusage.placeholder')"
              autocomplete="off" spellcheck="false"
              @keyup.enter="query"
            />
            <button class="reveal" type="button" @click="keyVisible = !keyVisible">{{ keyVisible ? t('keyusage.hide') : t('keyusage.show') }}</button>
          </div>
          <button class="btn btn-primary q-btn" :disabled="loading || !apiKey.trim()" @click="query">
            {{ loading ? t('keyusage.querying') : t('keyusage.query') }}
          </button>
        </div>
        <p class="privacy">{{ t('keyusage.privacy') }}</p>
        <p v-if="error" class="err">{{ error }}</p>
      </div>

      <div v-if="data && rings.length" class="result">
        <div class="status-center">
          <span class="status-pill">
            <span class="pulse-dot" :class="{ off: !isActive }"></span>
            {{ isActive ? t('keyusage.statusActive') : modeLabel }}
            <span class="sep">|</span>
            <span class="muted">{{ modeLabel }}</span>
          </span>
        </div>

        <div class="ring-grid" :class="'n' + Math.min(rings.length, 3)">
          <div v-for="(r, i) in rings" :key="i" class="ring-card" :style="{ animationDelay: i * 90 + 'ms' }">
            <div class="ring-head">
              <span class="ring-title">{{ r.title }}</span>
            </div>
            <div class="ring-wrap">
              <svg width="156" height="156" viewBox="0 0 156 156">
                <circle cx="78" cy="78" r="64" fill="none" stroke="rgba(0,0,0,0.07)" stroke-width="11" />
                <circle
                  cx="78" cy="78" r="64" fill="none" stroke="var(--accent)" stroke-width="11" stroke-linecap="round"
                  :stroke-dasharray="C.toFixed(1)" :stroke-dashoffset="ringOffset(r).toFixed(1)"
                  transform="rotate(-90 78 78)" class="ring-prog"
                />
              </svg>
              <div class="ring-center">
                <template v-if="r.isBalance">
                  <span class="ring-bal">{{ r.amount }}</span>
                  <span class="ring-sub">{{ t('keyusage.available') }}</span>
                </template>
                <template v-else>
                  <span class="ring-pct">{{ r.pct }}%</span>
                  <span class="ring-sub">{{ t('keyusage.used') }}</span>
                  <span class="ring-amt">{{ r.amount }}</span>
                  <span v-if="r.resetAt" class="ring-reset">⟳ {{ t('keyusage.reset') }} {{ resetIn(r.resetAt) }}</span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-card">
          <div class="detail-head"><span class="ring-title">{{ t('keyusage.detailTitle') }}</span></div>
          <div class="detail-body">
            <div v-for="(row, i) in detailRows" :key="i" class="detail-row">
              <span class="d-l">{{ row.l }}</span>
              <span class="d-v mono">{{ row.v }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!loading && !error" class="empty">
        <p class="muted">{{ t('keyusage.empty') }}</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ku-page { min-height: 100vh; background: var(--surface); font-family: var(--font); color: var(--ink);
  -webkit-font-smoothing: antialiased; letter-spacing: -0.003em; }
.ku-page * { box-sizing: border-box; }

.topbar { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.72);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--line-2); }
.bar-inner { max-width: var(--maxw); margin: 0 auto; display: flex; align-items: center; gap: 10px; height: 56px; padding: 0 28px; }
.spacer { flex: 1; }
.nav-link { font-size: 13px; color: var(--ink-2); padding: 6px 11px; border-radius: 8px; font-weight: 450; cursor: pointer; text-decoration: none; transition: background .15s, color .15s; }
.nav-link:hover { background: rgba(0,0,0,0.05); color: var(--ink); }

.logo { display: inline-flex; align-items: center; gap: 9px; cursor: pointer; user-select: none; text-decoration: none; }
.logo-mark { width: 26px; height: 26px; border-radius: 7px; background: var(--accent); position: relative; flex: none; }
.logo-mark::before, .logo-mark::after { content: ""; position: absolute; width: 6px; height: 6px; border-top: 2px solid #fff; border-right: 2px solid #fff; top: 9px; transform: rotate(45deg); }
.logo-mark::before { left: 7px; } .logo-mark::after { left: 13px; opacity: .55; }
.logo-word { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
.logo-word b { font-weight: 700; } .logo-word .r { color: var(--ink-3); font-weight: 500; }

.lang { display: inline-flex; align-items: center; border-radius: var(--pill); background: rgba(0,0,0,0.05); padding: 2px; font-size: 12px; font-weight: 600; }
.lang button { border: none; background: transparent; color: var(--ink-3); padding: 4px 9px; border-radius: var(--pill); cursor: pointer; transition: all .15s; }
.lang button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }

.ku-main { max-width: 880px; margin: 0 auto; padding: 56px 28px 80px; }
.head { text-align: center; margin-bottom: 36px; }
.eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: var(--accent-ink); display: inline-flex; align-items: center; gap: 7px; }
.eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
.h2 { font-size: clamp(26px, 3vw, 40px); line-height: 1.12; letter-spacing: -0.018em; font-weight: 640; margin-top: 12px; }
.lead { font-size: clamp(17px, 2vw, 20px); line-height: 1.42; color: var(--ink-2); font-weight: 420; margin: 12px auto 0; max-width: 520px; }

.query-block { max-width: 560px; margin: 0 auto; }
.input-row { display: flex; gap: 12px; }
.input-wrap { flex: 1; position: relative; display: flex; align-items: center; }
.lock { position: absolute; left: 15px; color: var(--ink-4); pointer-events: none; }
.input { width: 100%; height: 52px; border: 1px solid var(--line); border-radius: 14px; padding: 0 64px 0 44px;
  font-size: 15px; font-family: var(--mono); color: var(--ink); background: var(--surface-2);
  transition: border-color .15s, box-shadow .15s, background .15s; }
.input:focus { outline: none; border-color: var(--accent); background: #fff; box-shadow: 0 0 0 4px var(--accent-soft); }
.input::placeholder { color: var(--ink-4); font-family: var(--font); }
.reveal { position: absolute; right: 12px; border: none; background: transparent; color: var(--ink-3); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 4px 6px; font-family: inherit; }
.reveal:hover { color: var(--ink); }
.q-btn { height: 52px; padding: 0 26px; font-size: 16px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: var(--pill);
  font-weight: 500; letter-spacing: -0.01em; line-height: 1; cursor: pointer; font-family: inherit;
  transition: transform .12s ease, background .2s ease; white-space: nowrap; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: .55; cursor: default; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-press); }

.privacy { text-align: center; font-size: 13px; color: var(--ink-3); margin-top: 12px; }
.err { text-align: center; color: #e11d48; font-size: 14px; margin-top: 12px; }

.result { animation: llmrelay-fade-up .5s both; margin-top: 36px; }
.status-center { text-align: center; margin-bottom: 18px; }
.status-pill { display: inline-flex; align-items: center; gap: 9px; background: #fff; border: 1px solid var(--line);
  border-radius: var(--pill); padding: 9px 18px; font-size: 14px; font-weight: 550; box-shadow: var(--card-shadow); }
.status-pill .sep { color: var(--ink-4); font-weight: 400; }
.status-pill .muted { color: var(--ink-3); font-weight: 450; }
.pulse-dot { width: 9px; height: 9px; border-radius: 50%; background: #28c840; box-shadow: 0 0 0 0 rgba(40,200,64,.5); animation: ku-pulse 1.8s infinite; }
.pulse-dot.off { background: var(--ink-4); animation: none; }
@keyframes ku-pulse { 0% { box-shadow: 0 0 0 0 rgba(40,200,64,.45); } 70% { box-shadow: 0 0 0 8px rgba(40,200,64,0); } 100% { box-shadow: 0 0 0 0 rgba(40,200,64,0); } }

.ring-grid { display: grid; gap: 18px; }
.ring-grid.n1 { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
.ring-grid.n2 { grid-template-columns: repeat(2, 1fr); }
.ring-grid.n3 { grid-template-columns: repeat(3, 1fr); }
.ring-card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); padding: 26px 24px;
  box-shadow: var(--card-shadow); animation: llmrelay-fade-up .5s both; }
.ring-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.ring-title { font-size: 12px; font-weight: 650; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-3); }
.ring-wrap { position: relative; display: grid; place-items: center; }
.ring-prog { transition: stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1); }
.ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
.ring-pct { font-size: 30px; font-weight: 680; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; }
.ring-bal { font-size: 24px; font-weight: 680; letter-spacing: -0.02em; color: var(--accent-ink); }
.ring-sub { font-size: 12px; color: var(--ink-3); }
.ring-amt { font-size: 13px; font-weight: 650; color: var(--accent-ink); margin-top: 3px; font-variant-numeric: tabular-nums; }
.ring-reset { font-size: 11px; color: var(--ink-4); margin-top: 3px; }

.detail-card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); box-shadow: var(--card-shadow); margin-top: 22px; overflow: hidden; }
.detail-head { padding: 18px 26px; border-bottom: 1px solid var(--line-2); }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 26px; border-bottom: 1px solid var(--line-2); }
.detail-row:last-child { border-bottom: none; }
.d-l { font-size: 14.5px; color: var(--ink-2); }
.d-v { font-size: 13.5px; color: var(--ink); font-weight: 500; }
.mono { font-family: var(--mono); }
.muted { color: var(--ink-3); }
.empty { text-align: center; padding: 48px 0; font-size: 15px; }

@media (max-width: 720px) {
  .ring-grid.n2, .ring-grid.n3 { grid-template-columns: 1fr; max-width: 360px; margin: 0 auto; }
  .input-row { flex-direction: column; }
  .q-btn { height: 48px; }
}

/* mono direction keeps balance/amount ink-colored for restraint */
:global(html[data-dir='mono']) .ring-bal,
:global(html[data-dir='mono']) .ring-amt,
:global(html[data-dir='mono']) .eyebrow { color: var(--ink); }
</style>
