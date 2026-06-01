<script setup lang="ts">
import { useRouter } from 'vue-router'
/**
 * RegisterLLMRELAY.vue — 注册（Apple 清新风，对齐 design/auth.jsx）
 * 新文件，不覆盖现有 RegisterView.vue。
 * 主流程接通：useAuthStore().register()；邮箱验证码 authAPI.sendVerifyCode()（按 settings 决定是否需要）。
 * 注意：后端 RegisterRequest 无 username 字段 —— 故不收「昵称」，仅 email + password (+ verify_code)。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import authAPI from '@/api/auth'
import { setLocale } from '@/i18n'
import type { RegisterRequest } from '@/types'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const appStore = useAppStore()

const email = ref('')
const password = ref('')
const code = ref('')
const loading = ref(false)
const sending = ref(false)
const countdown = ref(0)
const error = ref('')
let timer: ReturnType<typeof setInterval> | null = null

const settings = computed(() => appStore.cachedPublicSettings)
const needVerify = computed(() => settings.value?.email_verify_enabled ?? false)
const regEnabled = computed(() => settings.value?.registration_enabled ?? true)
const githubOn = computed(() => settings.value?.github_oauth_enabled ?? false)
const googleOn = computed(() => settings.value?.google_oauth_enabled ?? false)
const showOAuth = computed(() => githubOn.value || googleOn.value)
const isZh = computed(() => locale.value === 'zh')

function validEmail(v: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)
}

async function sendCode(): Promise<void> {
  error.value = ''
  if (!validEmail(email.value.trim())) { error.value = t('auth.errors.emailInvalid'); return }
  if (countdown.value > 0 || sending.value) return
  sending.value = true
  try {
    const res = await authAPI.sendVerifyCode({ email: email.value.trim() })
    countdown.value = res?.countdown || 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0 && timer) { clearInterval(timer); timer = null }
    }, 1000)
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || t('auth.errors.generic')
  } finally {
    sending.value = false
  }
}

async function onSubmit(): Promise<void> {
  error.value = ''
  if (!regEnabled.value) { error.value = t('auth.register.disabled'); return }
  if (!validEmail(email.value.trim())) { error.value = t('auth.errors.emailInvalid'); return }
  if (password.value.length < 8) { error.value = t('auth.errors.pwdShort'); return }
  if (needVerify.value && !code.value.trim()) { error.value = t('auth.errors.codeRequired'); return }

  loading.value = true
  try {
    const payload: RegisterRequest = {
      email: email.value.trim(),
      password: password.value,
      ...(needVerify.value ? { verify_code: code.value.trim() } : {})
      // TODO(api): 如启用邀请码/优惠码，可在此加 invitation_code / promo_code（见 RegisterRequest 类型）
    }
    await authStore.register(payload)
    // TODO(router): 接手后改成 router.push
    window.location.assign(authStore.isAdmin ? '/admin/dashboard' : '/dashboard')
  } catch (e: any) {
    error.value = e?.response?.data?.message || e?.message || t('auth.errors.generic')
  } finally {
    loading.value = false
  }
}

function oauth(provider: 'github' | 'google'): void {
  window.location.assign(`/api/v1/auth/oauth/${provider}/start`)
}
function goLogin(): void { void router.push('/login') } // TODO(router)
function goHome(): void { void router.push('/') }
function switchLang(c: 'zh' | 'en'): void { void setLocale(c) }

onMounted(() => {
  document.documentElement.setAttribute('data-dir', 'classic')
  if (!appStore.publicSettingsLoaded) void appStore.fetchPublicSettings()
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <div class="auth-page" data-screen-label="Register">
    <div class="auth-topbar">
      <div class="bar-inner">
        <a class="logo" href="/" @click.prevent="goHome">
          <span class="logo-mark" aria-hidden="true"></span>
          <span class="logo-word"><b>LLM</b><span class="r">RELAY</span></span>
        </a>
        <div class="spacer"></div>
        <div class="lang">
          <button :class="{ on: isZh }" @click="switchLang('zh')">中</button>
          <button :class="{ on: !isZh }" @click="switchLang('en')">EN</button>
        </div>
      </div>
    </div>

    <div class="auth-wrap">
      <div class="auth-card">
        <div class="auth-tabs">
          <button @click="goLogin">{{ t('auth.loginTab') }}</button>
          <button class="on">{{ t('auth.signupTab') }}</button>
        </div>

        <h2 class="title">{{ t('auth.register.title') }}</h2>
        <p class="sub">{{ t('auth.register.sub') }}</p>

        <form @submit.prevent="onSubmit">
          <div class="field">
            <label>{{ t('auth.email') }}</label>
            <input v-model="email" class="input" type="email" autocomplete="email" :placeholder="t('auth.emailPh')" />
          </div>

          <div v-if="needVerify" class="field">
            <label>{{ t('auth.verifyCode') }}</label>
            <div class="code-row">
              <input v-model="code" class="input" inputmode="numeric" :placeholder="t('auth.codePh')" />
              <button type="button" class="btn btn-outline code-btn" :disabled="countdown > 0 || sending" @click="sendCode">
                {{ sending ? t('auth.sending') : (countdown > 0 ? t('auth.resend', { n: countdown }) : t('auth.sendCode')) }}
              </button>
            </div>
          </div>

          <div class="field">
            <label>{{ t('auth.password') }}</label>
            <input v-model="password" class="input" type="password" autocomplete="new-password" :placeholder="t('auth.pwdPh')" />
          </div>

          <p v-if="error" class="err">{{ error }}</p>

          <button class="btn btn-primary btn-block btn-lg" type="submit" :disabled="loading">
            {{ loading ? t('auth.register.submitting') : t('auth.register.submit') }}
          </button>
        </form>

        <template v-if="showOAuth">
          <div class="divider">{{ t('auth.or') }}</div>
          <div class="oauth-row">
            <button v-if="githubOn" class="oauth-btn" @click="oauth('github')">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.3 5.3 2.6 5.3 2.6a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 3.9 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>
              GitHub
            </button>
            <button v-if="googleOn" class="oauth-btn" @click="oauth('google')">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M21 12.2H12v3.4h5.1a4.3 4.3 0 0 1-1.9 2.8"/><path d="M7.1 13.8a5.4 5.4 0 0 1 0-3.5"/></svg>
              Google
            </button>
          </div>
        </template>

        <p class="terms">{{ t('auth.register.terms') }}</p>
        <p class="foot">{{ t('auth.register.haveAccount') }} <a href="/login" @click.prevent="goLogin">{{ t('auth.register.toLogin') }}</a></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page { min-height: 100vh; background: var(--surface); font-family: var(--font); color: var(--ink);
  -webkit-font-smoothing: antialiased; letter-spacing: -0.003em; }
.auth-page * { box-sizing: border-box; }

.auth-topbar { position: sticky; top: 0; z-index: 30; background: rgba(255,255,255,0.72);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--line-2); }
.bar-inner { max-width: var(--maxw); margin: 0 auto; display: flex; align-items: center; height: 56px; padding: 0 28px; }
.spacer { flex: 1; }

.logo { display: inline-flex; align-items: center; gap: 9px; cursor: pointer; user-select: none; text-decoration: none; }
.logo-mark { width: 26px; height: 26px; border-radius: 7px; background: var(--accent); position: relative; flex: none; }
.logo-mark::before, .logo-mark::after { content: ""; position: absolute; width: 6px; height: 6px; border-top: 2px solid #fff; border-right: 2px solid #fff; top: 9px; transform: rotate(45deg); }
.logo-mark::before { left: 7px; } .logo-mark::after { left: 13px; opacity: .55; }
.logo-word { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
.logo-word b { font-weight: 700; } .logo-word .r { color: var(--ink-3); font-weight: 500; }

.lang { display: inline-flex; align-items: center; border-radius: var(--pill); background: rgba(0,0,0,0.05); padding: 2px; font-size: 12px; font-weight: 600; }
.lang button { border: none; background: transparent; color: var(--ink-3); padding: 4px 9px; border-radius: var(--pill); cursor: pointer; transition: all .15s; }
.lang button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }

.auth-wrap { min-height: calc(100vh - 57px); display: grid; place-items: center; padding: 48px 20px; }
.auth-card { width: 100%; max-width: 420px; background: var(--bg); border-radius: var(--radius-lg);
  box-shadow: var(--card-shadow-lift); padding: 40px 38px 30px; animation: llmrelay-fade-up .6s both; }

.auth-tabs { display: flex; background: var(--surface); border-radius: var(--pill); padding: 3px; margin-bottom: 26px; }
.auth-tabs button { flex: 1; border: none; background: transparent; padding: 9px; border-radius: var(--pill); font-size: 14px; font-weight: 550; color: var(--ink-3); cursor: pointer; transition: all .18s; font-family: inherit; }
.auth-tabs button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 3px rgba(0,0,0,0.12); }

.title { font-size: 24px; font-weight: 640; letter-spacing: -0.02em; }
.sub { font-size: 14.5px; color: var(--ink-2); margin-top: 6px; margin-bottom: 22px; }

.field { margin-bottom: 14px; }
.field label { display: block; font-size: 13px; font-weight: 550; color: var(--ink-2); margin-bottom: 7px; }
.input { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 13px 15px; font-size: 15px;
  font-family: inherit; color: var(--ink); background: var(--surface-2);
  transition: border-color .15s, box-shadow .15s, background .15s; }
.input:focus { outline: none; border-color: var(--accent); background: #fff; box-shadow: 0 0 0 4px var(--accent-soft); }
.input::placeholder { color: var(--ink-4); }

.code-row { display: flex; gap: 10px; }
.code-row .input { flex: 1; }
.code-btn { flex: none; white-space: nowrap; padding: 0 16px; font-size: 13.5px; }

.err { color: #e11d48; font-size: 13px; margin: 4px 0 12px; }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; border-radius: var(--pill);
  font-size: 16px; font-weight: 500; letter-spacing: -0.01em; padding: 11px 22px; line-height: 1; cursor: pointer; font-family: inherit;
  transition: transform .12s ease, background .2s ease, box-shadow .2s ease; white-space: nowrap; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: .6; cursor: default; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-press); }
.btn-outline { background: transparent; color: var(--accent-ink); box-shadow: inset 0 0 0 1px var(--line); }
.btn-outline:hover:not(:disabled) { box-shadow: inset 0 0 0 1px var(--ink-4); }
.btn-lg { font-size: 17px; padding: 14px 30px; }
.btn-block { width: 100%; margin-top: 8px; }

.divider { display: flex; align-items: center; gap: 14px; margin: 22px 0; color: var(--ink-4); font-size: 12px; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background: var(--line); }
.oauth-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.oauth-row:has(> :only-child) { grid-template-columns: 1fr; }
.oauth-btn { display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--line);
  background: #fff; border-radius: 12px; padding: 11px; font-size: 14px; font-weight: 500; color: var(--ink); cursor: pointer;
  font-family: inherit; transition: background .15s, border-color .15s; }
.oauth-btn:hover { background: var(--surface); }

.terms { text-align: center; font-size: 12.5px; color: var(--ink-3); line-height: 1.5; margin-top: 20px; }
.foot { text-align: center; font-size: 14px; color: var(--ink-3); margin-top: 14px; }
.foot a { color: var(--accent-ink); text-decoration: none; font-weight: 500; }
</style>
