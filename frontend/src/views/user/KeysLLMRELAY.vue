<script setup lang="ts">
/**
 * KeysView (KeysLLMRELAY.vue) — API Keys 管理（列表 + 新建弹窗 + 复制 + 启停 + 撤销）
 * 自包裹 AppLayoutLLMRELAY（符合 fork 惯例）。Apple 清新风。
 *
 * 真实 API（fork 现存）：
 *  - keysAPI.list(1, 100)                          列表
 *  - keysAPI.create(name, groupId, ..., quota, expiresInDays)  新建
 *  - keysAPI.toggleStatus(id, 'active'|'inactive') 启停
 *  - keysAPI.delete(id)                            撤销
 *  - userGroupsAPI.getAvailable()                  可绑定分组
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import AppLayoutLLMRELAY from '@/components/layout/AppLayoutLLMRELAY.vue'
import keysAPI from '@/api/keys'
import userGroupsAPI from '@/api/groups'
import type { ApiKey, Group } from '@/types'

const { t, locale } = useI18n()
const appStore = useAppStore()
const isZh = computed(() => locale.value === 'zh')

const loading = ref(true)
const keys = ref<ApiKey[]>([])
const groups = ref<Group[]>([])
const search = ref('')

const filtered = computed(() =>
  !search.value.trim() ? keys.value
    : keys.value.filter((k) => k.name.toLowerCase().includes(search.value.trim().toLowerCase()))
)

function usd(n: number | null | undefined): string {
  const v = Number(n || 0)
  return '$' + v.toFixed(v !== 0 && Math.abs(v) < 1 ? 4 : 2)
}
function maskKey(k: string): string {
  if (!k) return ''
  return k.length <= 14 ? k : k.slice(0, 10) + '••••' + k.slice(-4)
}
function fmtDate(s: string | null): string {
  if (!s) return t('keys.never')
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(isZh.value ? 'zh-CN' : 'en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
function groupName(k: ApiKey): string {
  return k.group?.name || groups.value.find((g) => g.id === k.group_id)?.name || t('keys.fGroupAuto')
}
function statusLabel(s: string): string {
  return s === 'active' ? t('keys.active') : s === 'quota_exhausted' ? t('keys.exhausted') : s === 'expired' ? t('keys.expired') : t('keys.inactive')
}
function statusClass(s: string): string {
  return s === 'active' ? 'tag-green' : s === 'expired' || s === 'quota_exhausted' ? 'tag-amber' : 'tag-gray'
}

async function copyKey(k: string) {
  try { await navigator.clipboard.writeText(k); appStore.showSuccess(t('keys.copied')) }
  catch { appStore.showError(t('keys.err')) }
}

async function toggle(k: ApiKey) {
  try {
    const next = k.status === 'active' ? 'inactive' : 'active'
    const updated = await keysAPI.toggleStatus(k.id, next)
    const i = keys.value.findIndex((x) => x.id === k.id)
    if (i >= 0) keys.value[i] = updated
    appStore.showSuccess(t('keys.updated'))
  } catch { appStore.showError(t('keys.err')) }
}

async function revoke(k: ApiKey) {
  if (!window.confirm(t('keys.revokeConfirm'))) return
  try {
    await keysAPI.delete(k.id)
    keys.value = keys.value.filter((x) => x.id !== k.id)
    appStore.showSuccess(t('keys.revoked'))
  } catch { appStore.showError(t('keys.err')) }
}

// ---- create dialog ----
const showCreate = ref(false)
const creating = ref(false)
const form = ref({ name: '', group_id: '' as number | '', quota: '', expiry: '' })
const createdKey = ref<ApiKey | null>(null)

function openCreate() {
  form.value = { name: '', group_id: '', quota: '', expiry: '' }
  createdKey.value = null
  showCreate.value = true
}
async function submitCreate() {
  if (!form.value.name.trim() || creating.value) return
  creating.value = true
  try {
    const groupId = form.value.group_id === '' ? null : Number(form.value.group_id)
    const quota = form.value.quota === '' ? undefined : Number(form.value.quota)
    const expiry = form.value.expiry === '' ? undefined : Number(form.value.expiry)
    const created = await keysAPI.create(form.value.name.trim(), groupId, undefined, undefined, undefined, quota, expiry)
    keys.value = [created, ...keys.value]
    createdKey.value = created
    appStore.showSuccess(t('keys.created'))
  } catch { appStore.showError(t('keys.err')) }
  finally { creating.value = false }
}

async function load() {
  loading.value = true
  try {
    const [k, g] = await Promise.allSettled([keysAPI.list(1, 100), userGroupsAPI.getAvailable()])
    if (k.status === 'fulfilled') keys.value = k.value.items || []
    if (g.status === 'fulfilled') groups.value = g.value || []
  } catch { appStore.showError(t('keys.err')) }
  finally { loading.value = false }
}
onMounted(load)

// inline icons (setup scope → template-visible)
const iconCopy = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>'
const iconTrash = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>'
const iconPause = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>'
const iconPlay = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v16l13-8z"/></svg>'
</script>

<template>
  <AppLayoutLLMRELAY>
    <div class="keys" data-screen-label="Keys">
      <div class="head">
        <div>
          <h1 class="title">{{ t('keys.title') }}</h1>
          <p class="sub">{{ t('keys.sub') }}</p>
        </div>
        <button class="btn btn-primary" @click="openCreate">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {{ t('keys.new') }}
        </button>
      </div>

      <div class="toolbar">
        <div class="search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
          <input v-model="search" :placeholder="t('keys.search')" />
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="tbl">
            <thead><tr>
              <th>{{ t('keys.cols.name') }}</th><th>{{ t('keys.cols.key') }}</th><th>{{ t('keys.cols.group') }}</th>
              <th>{{ t('keys.cols.usage') }}</th><th>{{ t('keys.cols.status') }}</th><th>{{ t('keys.cols.expires') }}</th><th class="num">{{ t('keys.cols.action') }}</th>
            </tr></thead>
            <tbody>
              <tr v-if="loading"><td colspan="7" class="center muted">…</td></tr>
              <tr v-else-if="!filtered.length"><td colspan="7" class="center muted">{{ t('keys.empty') }}</td></tr>
              <tr v-for="k in filtered" :key="k.id">
                <td class="kname">{{ k.name }}</td>
                <td class="mono small keycell">{{ maskKey(k.key) }}</td>
                <td class="small">{{ groupName(k) }}</td>
                <td class="mono small">{{ usd(k.quota_used) }}<template v-if="k.quota > 0"> / {{ usd(k.quota) }}</template></td>
                <td><span class="tag" :class="statusClass(k.status)"><span class="d"></span>{{ statusLabel(k.status) }}</span></td>
                <td class="small">{{ fmtDate(k.expires_at) }}</td>
                <td class="num">
                  <div class="row-actions">
                    <button class="mini" @click="copyKey(k.key)" :title="t('keys.copy')"><span v-html="iconCopy"></span></button>
                    <button class="mini" @click="toggle(k)" :title="k.status === 'active' ? t('keys.disable') : t('keys.enable')"><span v-html="k.status === 'active' ? iconPause : iconPlay"></span></button>
                    <button class="mini danger" @click="revoke(k)" :title="t('keys.revoke')"><span v-html="iconTrash"></span></button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- create modal -->
    <transition name="fade">
      <div v-if="showCreate" class="modal-scrim" @click.self="showCreate = false">
        <div class="modal">
          <div class="modal-head">
            <h3>{{ t('keys.createTitle') }}</h3>
            <button class="x" @click="showCreate = false">✕</button>
          </div>

          <template v-if="!createdKey">
            <div class="field"><label>{{ t('keys.fName') }}</label><input v-model="form.name" class="input" :placeholder="t('keys.fNamePh')" /></div>
            <div class="field">
              <label>{{ t('keys.fGroup') }}</label>
              <select v-model="form.group_id" class="input">
                <option value="">{{ t('keys.fGroupAuto') }}</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
            <div class="grid2">
              <div class="field"><label>{{ t('keys.fQuota') }}</label><input v-model="form.quota" class="input" inputmode="decimal" placeholder="0" /></div>
              <div class="field"><label>{{ t('keys.fExpiry') }}</label><input v-model="form.expiry" class="input" inputmode="numeric" :placeholder="t('keys.never')" /></div>
            </div>
            <div class="modal-foot">
              <button class="btn btn-ghost" @click="showCreate = false">{{ t('keys.cancel') }}</button>
              <button class="btn btn-primary" :disabled="!form.name.trim() || creating" @click="submitCreate">{{ creating ? t('keys.saving') : t('keys.save') }}</button>
            </div>
          </template>

          <template v-else>
            <p class="created-note">{{ t('keys.created') }}</p>
            <div class="created-key">
              <code class="mono">{{ createdKey.key }}</code>
              <button class="btn btn-primary btn-sm" @click="copyKey(createdKey.key)">{{ t('keys.copy') }}</button>
            </div>
            <div class="modal-foot">
              <button class="btn btn-primary" @click="showCreate = false">{{ t('keys.ok') || 'OK' }}</button>
            </div>
          </template>
        </div>
      </div>
    </transition>
  </AppLayoutLLMRELAY>
</template>

<style scoped>
.keys { padding: 26px 30px 60px; max-width: 1180px; }
.keys * { box-sizing: border-box; }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.title { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; }
.sub { font-size: 15px; color: var(--ink-2); margin-top: 4px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: none; border-radius: var(--pill);
  font-size: 14.5px; font-weight: 500; padding: 10px 18px; line-height: 1; cursor: pointer; font-family: inherit; transition: transform .12s, background .2s; white-space: nowrap; }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: .55; cursor: default; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-press); }
.btn-ghost { background: rgba(0,0,0,0.045); color: var(--ink); }
.btn-ghost:hover { background: rgba(0,0,0,0.08); }
.btn-sm { font-size: 13px; padding: 8px 14px; }

.toolbar { margin-bottom: 14px; }
.search { position: relative; max-width: 300px; display: flex; align-items: center; }
.search svg { position: absolute; left: 12px; color: var(--ink-4); }
.search input { width: 100%; height: 38px; border: 1px solid var(--line); border-radius: 10px; padding: 0 12px 0 36px; font-size: 13.5px; font-family: inherit; background: #fff; }
.search input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }

.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); box-shadow: var(--card-shadow); overflow: hidden; }
.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tbl th { text-align: left; font-size: 11.5px; color: var(--ink-3); font-weight: 600; padding: 14px 16px; background: var(--surface-2); border-bottom: 1px solid var(--line-2); }
.tbl th.num { text-align: right; }
.tbl td { padding: 12px 16px; border-bottom: 1px solid var(--line-2); }
.tbl tr:last-child td { border-bottom: none; }
.tbl tbody tr:hover td { background: var(--surface-2); }
.tbl td.num { text-align: right; }
.kname { font-weight: 550; }
.keycell { color: var(--ink-2); }
.mono { font-family: var(--mono); }
.small { font-size: 12.5px; color: var(--ink-3); }
.muted { color: var(--ink-3); } .center { text-align: center; padding: 26px 0; }

.tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: var(--pill); }
.tag .d { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tag-green { background: #e6f7ee; color: #14794a; }
.tag-amber { background: #fdf0db; color: #b45309; }
.tag-gray { background: var(--surface); color: var(--ink-3); }

.row-actions { display: inline-flex; gap: 6px; }
.mini { width: 30px; height: 30px; border: 1px solid var(--line); background: #fff; border-radius: 8px; display: grid; place-items: center; color: var(--ink-2); cursor: pointer; transition: background .15s, color .15s, border-color .15s; }
.mini:hover { background: var(--surface); color: var(--ink); }
.mini.danger:hover { background: #fff0f2; color: #e11d48; border-color: #f8c4cd; }

.modal-scrim { position: fixed; inset: 0; background: rgba(0,0,0,0.32); display: grid; place-items: center; z-index: 100; padding: 20px; }
.modal { width: 100%; max-width: 440px; background: #fff; border-radius: var(--radius-lg); box-shadow: var(--card-shadow-lift); padding: 26px 26px 22px; }
.modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.modal-head h3 { font-size: 19px; font-weight: 640; }
.x { border: none; background: transparent; font-size: 16px; color: var(--ink-3); cursor: pointer; }
.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; font-weight: 550; color: var(--ink-2); margin-bottom: 7px; }
.input { width: 100%; border: 1px solid var(--line); border-radius: 11px; padding: 11px 14px; font-size: 14.5px; font-family: inherit; color: var(--ink); background: var(--surface-2); transition: border-color .15s, box-shadow .15s, background .15s; }
.input:focus { outline: none; border-color: var(--accent); background: #fff; box-shadow: 0 0 0 4px var(--accent-soft); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.modal-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.created-note { font-size: 14px; color: var(--ink-2); margin-bottom: 12px; }
.created-key { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line-2); border-radius: 12px; padding: 12px 14px; margin-bottom: 18px; }
.created-key code { flex: 1; font-size: 12.5px; word-break: break-all; color: var(--ink); }

.fade-enter-active, .fade-leave-active { transition: opacity .16s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) { .keys { padding: 20px; } .head { flex-direction: column; align-items: flex-start; } }
</style>
