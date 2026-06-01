<script setup lang="ts">
/**
 * ProfileView (ProfileLLMRELAY.vue) — 个人资料 + 安全 + 余额通知
 * 自包裹 AppLayoutLLMRELAY。Apple 清新风。
 *
 * 真实 API（fork 现存）：
 *  - userAPI.updateProfile({ username, avatar_url, balance_notify_enabled, balance_notify_threshold })
 *  - userAPI.changePassword(old, new)
 *  用户对象来自 authStore.user（refreshUser 同步）。
 *  注：仓库 user.ts 未见“删除账号”端点 → 该功能留 TODO，不在此实现。
 */
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppLayoutLLMRELAY from '@/components/layout/AppLayoutLLMRELAY.vue'
import userAPI from '@/api/user'

const { t } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()

const user = computed(() => authStore.user)
const avatarChar = computed(() => (user.value?.username?.[0] || user.value?.email?.[0] || 'U').toUpperCase())

// ---- account form ----
const username = ref('')
const avatarUrl = ref('')
const savingAccount = ref(false)

// ---- balance notify ----
const notifyEnabled = ref(false)
const notifyThreshold = ref('')
const savingNotify = ref(false)

function syncFromUser() {
  username.value = user.value?.username || ''
  avatarUrl.value = user.value?.avatar_url || ''
  notifyEnabled.value = !!user.value?.balance_notify_enabled
  notifyThreshold.value = user.value?.balance_notify_threshold != null ? String(user.value.balance_notify_threshold) : ''
}
watch(user, syncFromUser, { immediate: true })

async function saveAccount() {
  if (savingAccount.value) return
  savingAccount.value = true
  try {
    await userAPI.updateProfile({ username: username.value.trim(), avatar_url: avatarUrl.value.trim() || null })
    await authStore.refreshUser?.()
    appStore.showSuccess(t('profile.saved'))
  } catch { appStore.showError(t('profile.err')) }
  finally { savingAccount.value = false }
}

async function saveNotify() {
  if (savingNotify.value) return
  savingNotify.value = true
  try {
    await userAPI.updateProfile({
      balance_notify_enabled: notifyEnabled.value,
      balance_notify_threshold: notifyThreshold.value === '' ? null : Number(notifyThreshold.value)
    })
    await authStore.refreshUser?.()
    appStore.showSuccess(t('profile.saved'))
  } catch { appStore.showError(t('profile.err')) }
  finally { savingNotify.value = false }
}

// ---- change password ----
const curPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const changingPwd = ref(false)
const pwdErr = ref('')

async function changePassword() {
  pwdErr.value = ''
  if (newPwd.value.length < 8) { pwdErr.value = t('profile.pwdShort'); return }
  if (newPwd.value !== confirmPwd.value) { pwdErr.value = t('profile.pwdMismatch'); return }
  changingPwd.value = true
  try {
    await userAPI.changePassword(curPwd.value, newPwd.value)
    curPwd.value = newPwd.value = confirmPwd.value = ''
    appStore.showSuccess(t('profile.pwdChanged'))
  } catch (e: any) {
    pwdErr.value = e?.response?.data?.message || t('profile.err')
  } finally { changingPwd.value = false }
}

function usd(n: number | undefined | null): string {
  const v = Number(n || 0)
  return '$' + v.toFixed(v !== 0 && Math.abs(v) < 1 ? 4 : 2)
}

onMounted(() => { if (!user.value) authStore.refreshUser?.().catch(() => {}) })
</script>

<template>
  <AppLayoutLLMRELAY>
    <div class="profile" data-screen-label="Profile">
      <div class="head">
        <h1 class="title">{{ t('profile.title') }}</h1>
        <p class="sub">{{ t('profile.sub') }}</p>
      </div>

      <!-- account -->
      <div class="card">
        <div class="card-title">{{ t('profile.secAccount') }}</div>
        <div class="id-row">
          <span class="avatar"><img v-if="avatarUrl" :src="avatarUrl" alt="" /><template v-else>{{ avatarChar }}</template></span>
          <div class="id-meta">
            <div class="id-name">{{ user?.username || (user?.email ? user.email.split('@')[0] : '') }}</div>
            <div class="id-mail">{{ user?.email }}</div>
          </div>
          <span class="role-tag" :class="user?.role === 'admin' ? 'role-admin' : 'role-user'">
            {{ user?.role === 'admin' ? t('profile.roleAdmin') : t('profile.roleUser') }}
          </span>
        </div>

        <div class="grid2">
          <div class="field"><label>{{ t('profile.username') }}</label><input v-model="username" class="input" :placeholder="t('profile.usernamePh')" /></div>
          <div class="field"><label>{{ t('profile.balance') }}</label><input class="input" :value="usd(user?.balance)" disabled /></div>
        </div>
        <div class="field"><label>{{ t('profile.avatar') }}</label><input v-model="avatarUrl" class="input" :placeholder="t('profile.avatarPh')" /></div>
        <div class="foot">
          <button class="btn btn-primary" :disabled="savingAccount" @click="saveAccount">{{ savingAccount ? t('profile.saving') : t('profile.save') }}</button>
        </div>
      </div>

      <!-- security -->
      <div class="card">
        <div class="card-title">{{ t('profile.secSecurity') }}</div>
        <div class="field"><label>{{ t('profile.curPwd') }}</label><input v-model="curPwd" class="input" type="password" autocomplete="current-password" :placeholder="t('profile.pwdPh')" /></div>
        <div class="grid2">
          <div class="field"><label>{{ t('profile.newPwd') }}</label><input v-model="newPwd" class="input" type="password" autocomplete="new-password" :placeholder="t('profile.pwdPh')" /></div>
          <div class="field"><label>{{ t('profile.confirmPwd') }}</label><input v-model="confirmPwd" class="input" type="password" autocomplete="new-password" :placeholder="t('profile.pwdPh')" /></div>
        </div>
        <p v-if="pwdErr" class="err">{{ pwdErr }}</p>
        <div class="foot">
          <button class="btn btn-primary" :disabled="changingPwd || !curPwd || !newPwd" @click="changePassword">{{ changingPwd ? t('profile.changing') : t('profile.changePwd') }}</button>
        </div>
      </div>

      <!-- balance notify -->
      <div class="card">
        <div class="card-title">{{ t('profile.secNotify') }}</div>
        <label class="switch-row">
          <span class="switch-label">{{ t('profile.notifyEnable') }}</span>
          <button class="switch" :class="{ on: notifyEnabled }" type="button" @click="notifyEnabled = !notifyEnabled"><span class="knob"></span></button>
        </label>
        <div class="field" :class="{ disabled: !notifyEnabled }">
          <label>{{ t('profile.notifyThreshold') }}</label>
          <input v-model="notifyThreshold" class="input" inputmode="decimal" placeholder="0" :disabled="!notifyEnabled" />
          <p class="hint">{{ t('profile.notifyHint') }}</p>
        </div>
        <div class="foot">
          <button class="btn btn-primary" :disabled="savingNotify" @click="saveNotify">{{ savingNotify ? t('profile.saving') : t('profile.save') }}</button>
        </div>
      </div>
    </div>
  </AppLayoutLLMRELAY>
</template>

<style scoped>
.profile { padding: 26px 30px 60px; max-width: 760px; }
.profile * { box-sizing: border-box; }
.head { margin-bottom: 20px; }
.title { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; }
.sub { font-size: 15px; color: var(--ink-2); margin-top: 4px; }

.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); box-shadow: var(--card-shadow); padding: 24px 26px; margin-bottom: 16px; }
.card-title { font-size: 16px; font-weight: 620; letter-spacing: -0.01em; margin-bottom: 18px; }

.id-row { display: flex; align-items: center; gap: 14px; padding-bottom: 20px; margin-bottom: 20px; border-bottom: 1px solid var(--line-2); }
.avatar { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(145deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #fff)); color: #fff; display: grid; place-items: center; font-size: 20px; font-weight: 700; flex: none; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
:global(html[data-dir='mono']) .avatar { background: #1d1d1f; }
.id-meta { flex: 1; min-width: 0; }
.id-name { font-size: 16px; font-weight: 600; }
.id-mail { font-size: 13px; color: var(--ink-3); }
.role-tag { font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: var(--pill); }
.role-admin { background: var(--accent-soft); color: var(--accent-ink); }
:global(html[data-dir='mono']) .role-admin { background: #ededed; color: var(--ink); }
.role-user { background: var(--surface); color: var(--ink-3); }

.field { margin-bottom: 14px; }
.field.disabled { opacity: .5; }
.field label { display: block; font-size: 13px; font-weight: 550; color: var(--ink-2); margin-bottom: 7px; }
.input { width: 100%; border: 1px solid var(--line); border-radius: 11px; padding: 11px 14px; font-size: 14.5px; font-family: inherit; color: var(--ink); background: var(--surface-2); transition: border-color .15s, box-shadow .15s, background .15s; }
.input:focus { outline: none; border-color: var(--accent); background: #fff; box-shadow: 0 0 0 4px var(--accent-soft); }
.input:disabled { color: var(--ink-3); }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.hint { font-size: 12.5px; color: var(--ink-3); margin-top: 7px; }
.err { color: #e11d48; font-size: 13px; margin: 2px 0 12px; }
.foot { display: flex; justify-content: flex-end; margin-top: 8px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: none; border-radius: var(--pill); font-size: 14.5px; font-weight: 500; padding: 10px 20px; line-height: 1; cursor: pointer; font-family: inherit; transition: transform .12s, background .2s; }
.btn:active { transform: scale(0.97); }
.btn:disabled { opacity: .55; cursor: default; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-press); }

.switch-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 18px; cursor: pointer; }
.switch-label { font-size: 14.5px; font-weight: 500; color: var(--ink); }
.switch { width: 46px; height: 28px; border-radius: var(--pill); border: none; background: rgba(0,0,0,0.12); position: relative; cursor: pointer; transition: background .2s; flex: none; }
.switch.on { background: var(--accent); }
.knob { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform .2s; }
.switch.on .knob { transform: translateX(18px); }

@media (max-width: 700px) { .profile { padding: 20px; } .grid2 { grid-template-columns: 1fr; } }
</style>
