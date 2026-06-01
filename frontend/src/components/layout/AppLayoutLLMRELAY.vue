<script setup lang="ts">
/**
 * AppLayoutLLMRELAY.vue — 后台壳子（Apple 清新风，所有登录后页都包它）
 * 新文件，不覆盖现有 AppLayout.vue。
 *
 * 结构：左 Sidebar（logo + 版本号 + 导航 router-link）+ 顶 Header（面包屑 + 中/EN + 方向 + 用户下拉）
 *      + <router-view/> 渲染子路由。
 * 复用：useAuthStore（user/isAdmin/logout）、useAppStore（siteName/siteVersion）。沿用 tokens.css。
 * 不写 router —— 接手时把 admin/* 与 user/* 的 meta.layout 切到本组件。
 *
 * 导航项目前由本地 NAV 常量提供（便于 build/preview）；接手后可改为读 router meta 生成。
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const isZh = computed(() => locale.value === 'zh')
const siteVersion = computed(() => appStore.siteVersion || 'V1')
const user = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)

// 用户名 / 头像首字母（来自真实 user）
const displayName = computed(() => user.value?.username || user.value?.email?.split('@')[0] || 'User')
const email = computed(() => user.value?.email || '')
const avatarChar = computed(() => (displayName.value[0] || 'U').toUpperCase())
const avatarUrl = computed(() => user.value?.avatar_url || '')

// ---- 导航（接手时可改为 router meta 驱动）----
// to 路径为占位；按你接手后的实际路由调整。icon 用内联 SVG name。
const NAV = [
  { to: '/dashboard', key: 'overview', icon: 'grid' },
  { to: '/keys', key: 'keys', icon: 'key' },
  { to: '/usage', key: 'usage', icon: 'chart' },
  { to: '/billing', key: 'billing', icon: 'wallet' },
  { to: '/settings', key: 'settings', icon: 'gear' }
]
const ADMIN_NAV = [
  { to: '/admin/dashboard', key: 'adminDashboard', icon: 'grid' },
  { to: '/admin/users', key: 'users', icon: 'users' },
  { to: '/admin/accounts', key: 'accounts', icon: 'layers' },
  { to: '/admin/redeem', key: 'redeem', icon: 'tag' }
]

// ---- 面包屑（取 route.meta.titleKey / title / name）----
const crumb = computed(() => {
  const m = route.meta as any
  if (m?.titleKey) { try { return t(m.titleKey) } catch { /* noop */ } }
  if (m?.title) return m.title
  return route.name ? String(route.name) : ''
})

// ---- 方向 ----
type Dir = 'classic' | 'equity' | 'mono'
const dir = ref<Dir>('classic')
function setDir(d: Dir) {
  dir.value = d
  document.documentElement.setAttribute('data-dir', d)
  try { localStorage.setItem('llmrelay_dir', d) } catch { /* noop */ }
}

function switchLang(c: 'zh' | 'en') { void setLocale(c) }

// ---- 用户下拉 ----
const menuOpen = ref(false)
const menuRef = ref<HTMLElement | null>(null)
function toggleMenu() { menuOpen.value = !menuOpen.value }
function onDocClick(e: MouseEvent) {
  if (menuRef.value && !menuRef.value.contains(e.target as Node)) menuOpen.value = false
}
async function onLogout() {
  menuOpen.value = false
  try { await authStore.logout() } catch { /* noop */ }
  // TODO(router): 接手后改成 router.push('/login')
  window.location.assign('/login')
}
function go(path: string) {
  menuOpen.value = false
  // 用 router（壳内导航），失败兜底 location
  router.push(path).catch(() => window.location.assign(path))
}

// ---- 移动端抽屉 ----
const sideOpen = ref(false)

// ---- 内联图标集（在 setup 作用域内，模板可用）----
const ICONS: Record<string, string> = {
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2 20 20M16 16l2-2M19 19l1.5-1.5"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18 6l-2 2M8 16l-2 2M18 18l-2-2M8 8 6 6"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5 6-5s6 1.7 6 5M16 11a3 3 0 0 0 0-6M18 20c0-2.5-1-4-3-4.6"/></svg>',
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></svg>',
  tag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>'
}
function icon(name: string): string { return ICONS[name] || '' }

onMounted(() => {
  const saved = (localStorage.getItem('llmrelay_dir') as Dir) || 'classic'
  setDir(saved)
  document.addEventListener('click', onDocClick)
  if (!appStore.publicSettingsLoaded) void appStore.fetchPublicSettings()
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<template>
  <div class="shell" data-screen-label="AppShell">
    <!-- ========= Sidebar ========= -->
    <aside class="side" :class="{ open: sideOpen }">
      <div class="side-top">
        <a class="logo" href="/" @click.prevent="go('/dashboard')">
          <span class="logo-mark" aria-hidden="true"></span>
          <span class="logo-word"><b>LLM</b><span class="r">RELAY</span></span>
        </a>
        <span class="ver">{{ siteVersion }}</span>
      </div>

      <nav class="side-nav">
        <router-link v-for="item in NAV" :key="item.to" :to="item.to" class="nav-item" @click="sideOpen = false">
          <span class="ic" v-html="icon(item.icon)"></span>
          <span>{{ t('appShell.nav.' + item.key) }}</span>
        </router-link>

        <template v-if="isAdmin">
          <div class="nav-sec">{{ t('appShell.nav.adminSection') }}</div>
          <router-link v-for="item in ADMIN_NAV" :key="item.to" :to="item.to" class="nav-item" @click="sideOpen = false">
            <span class="ic" v-html="icon(item.icon)"></span>
            <span>{{ t('appShell.nav.' + item.key) }}</span>
          </router-link>
        </template>
      </nav>
    </aside>
    <div class="scrim" :class="{ show: sideOpen }" @click="sideOpen = false"></div>

    <!-- ========= Main ========= -->
    <div class="main">
      <header class="topbar">
        <button class="burger" @click="sideOpen = !sideOpen" aria-label="menu">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div class="crumb">
          <span class="crumb-site">{{ appStore.siteName === 'Sub2API' ? 'LLMRELAY' : appStore.siteName }}</span>
          <span v-if="crumb" class="crumb-sep">/</span>
          <span v-if="crumb" class="crumb-cur">{{ crumb }}</span>
        </div>
        <div class="spacer"></div>

        <!-- direction -->
        <div class="dir-seg" :title="t('appShell.dir.label')">
          <button :class="{ on: dir === 'classic' }" @click="setDir('classic')">{{ t('appShell.dir.classic') }}</button>
          <button :class="{ on: dir === 'equity' }" @click="setDir('equity')">{{ t('appShell.dir.equity') }}</button>
          <button :class="{ on: dir === 'mono' }" @click="setDir('mono')">{{ t('appShell.dir.mono') }}</button>
        </div>

        <!-- language -->
        <div class="lang">
          <button :class="{ on: isZh }" @click="switchLang('zh')">中</button>
          <button :class="{ on: !isZh }" @click="switchLang('en')">EN</button>
        </div>

        <!-- user -->
        <div class="user" ref="menuRef">
          <button class="user-btn" @click="toggleMenu">
            <span class="avatar"><img v-if="avatarUrl" :src="avatarUrl" alt="" /><template v-else>{{ avatarChar }}</template></span>
            <span class="uname">{{ displayName }}</span>
            <svg class="chev" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <transition name="pop">
            <div v-if="menuOpen" class="dropdown">
              <div class="dd-head">
                <span class="avatar lg"><img v-if="avatarUrl" :src="avatarUrl" alt="" /><template v-else>{{ avatarChar }}</template></span>
                <div class="dd-id">
                  <div class="dd-name">{{ displayName }}</div>
                  <div class="dd-mail">{{ email }}</div>
                </div>
              </div>
              <div class="dd-sep"></div>
              <button class="dd-item" @click="go('/profile')"><span class="ic" v-html="icon('user')"></span>{{ t('appShell.header.profile') }}</button>
              <button class="dd-item" @click="go('/keys')"><span class="ic" v-html="icon('key')"></span>{{ t('appShell.header.keys') }}</button>
              <div class="dd-sep"></div>
              <button class="dd-item danger" @click="onLogout"><span class="ic" v-html="icon('logout')"></span>{{ t('appShell.header.logout') }}</button>
            </div>
          </transition>
        </div>
      </header>

      <main class="content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: 236px 1fr; min-height: 100vh; background: var(--surface);
  font-family: var(--font); color: var(--ink); -webkit-font-smoothing: antialiased; letter-spacing: -0.003em; }
.shell * { box-sizing: border-box; }

/* sidebar */
.side { background: rgba(255,255,255,0.72); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border-right: 1px solid var(--line-2); padding: 16px 14px; position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column; gap: 4px; z-index: 40; }
.side-top { display: flex; align-items: center; justify-content: space-between; padding: 8px 8px 18px; }
.logo { display: inline-flex; align-items: center; gap: 9px; cursor: pointer; text-decoration: none; user-select: none; }
.logo-mark { width: 24px; height: 24px; border-radius: 7px; background: var(--accent); position: relative; flex: none; }
.logo-mark::before, .logo-mark::after { content: ""; position: absolute; width: 5.5px; height: 5.5px; border-top: 2px solid #fff; border-right: 2px solid #fff; top: 8px; transform: rotate(45deg); }
.logo-mark::before { left: 6px; } .logo-mark::after { left: 11.5px; opacity: .55; }
.logo-word { font-size: 16.5px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
.logo-word b { font-weight: 700; } .logo-word .r { color: var(--ink-3); font-weight: 500; }
.ver { font-size: 11px; font-weight: 600; color: var(--ink-3); background: var(--surface); border: 1px solid var(--line-2); padding: 2px 7px; border-radius: var(--pill); }

.side-nav { display: flex; flex-direction: column; gap: 2px; overflow-y: auto; }
.nav-item { display: flex; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 10px;
  font-size: 14px; font-weight: 500; color: var(--ink-2); cursor: pointer; text-decoration: none; transition: background .15s, color .15s; }
.nav-item:hover { background: rgba(0,0,0,0.045); color: var(--ink); }
.nav-item .ic { width: 18px; height: 18px; flex: none; display: inline-flex; }
.nav-item .ic :deep(svg) { width: 18px; height: 18px; }
.nav-item.router-link-active { background: var(--accent-soft); color: var(--accent-ink); }
:global(html[data-dir='mono']) .nav-item.router-link-active { background: #ededed; color: var(--ink); }
.nav-sec { font-size: 11px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-4); padding: 16px 11px 7px; }

/* main */
.main { min-width: 0; display: flex; flex-direction: column; }
.topbar { position: sticky; top: 0; z-index: 30; height: 60px; background: rgba(255,255,255,0.72);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--line-2); display: flex; align-items: center; gap: 12px; padding: 0 24px; }
.burger { display: none; border: none; background: transparent; color: var(--ink-2); cursor: pointer; padding: 6px; border-radius: 8px; }
.burger:hover { background: rgba(0,0,0,0.05); }
.crumb { display: flex; align-items: center; gap: 8px; font-size: 14px; min-width: 0; }
.crumb-site { font-weight: 600; color: var(--ink); }
.crumb-sep { color: var(--ink-4); }
.crumb-cur { color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spacer { flex: 1; }

.dir-seg { display: flex; background: rgba(0,0,0,0.05); border-radius: var(--pill); padding: 2px; }
.dir-seg button { border: none; background: transparent; padding: 5px 10px; border-radius: var(--pill); font-size: 12px; font-weight: 600; color: var(--ink-3); cursor: pointer; transition: all .15s; }
.dir-seg button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.14); }

.lang { display: inline-flex; align-items: center; border-radius: var(--pill); background: rgba(0,0,0,0.05); padding: 2px; font-size: 12px; font-weight: 600; }
.lang button { border: none; background: transparent; color: var(--ink-3); padding: 4px 9px; border-radius: var(--pill); cursor: pointer; transition: all .15s; }
.lang button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }

.avatar { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(145deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #fff));
  color: #fff; display: grid; place-items: center; font-size: 12px; font-weight: 700; flex: none; overflow: hidden; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar.lg { width: 40px; height: 40px; font-size: 15px; }
:global(html[data-dir='mono']) .avatar { background: #1d1d1f; }

.user { position: relative; }
.user-btn { display: flex; align-items: center; gap: 8px; border: none; background: transparent; cursor: pointer; padding: 4px 6px 4px 4px; border-radius: var(--pill); transition: background .15s; }
.user-btn:hover { background: rgba(0,0,0,0.05); }
.uname { font-size: 13.5px; font-weight: 550; color: var(--ink); max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.chev { color: var(--ink-3); }

.dropdown { position: absolute; right: 0; top: 46px; width: 248px; background: #fff; border: 1px solid var(--line-2);
  border-radius: 14px; box-shadow: var(--card-shadow-lift); padding: 8px; }
.dd-head { display: flex; align-items: center; gap: 11px; padding: 8px 8px 10px; }
.dd-id { min-width: 0; }
.dd-name { font-size: 14px; font-weight: 600; }
.dd-mail { font-size: 12px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dd-sep { height: 1px; background: var(--line-2); margin: 6px 0; }
.dd-item { display: flex; align-items: center; gap: 11px; width: 100%; border: none; background: transparent; cursor: pointer;
  padding: 9px 10px; border-radius: 9px; font-size: 14px; font-weight: 500; color: var(--ink-2); font-family: inherit; text-align: left; }
.dd-item:hover { background: var(--surface); color: var(--ink); }
.dd-item .ic { width: 17px; height: 17px; display: inline-flex; }
.dd-item .ic :deep(svg) { width: 17px; height: 17px; }
.dd-item.danger { color: #e11d48; }
.dd-item.danger:hover { background: #fff0f2; }

.pop-enter-active, .pop-leave-active { transition: opacity .14s ease, transform .14s ease; }
.pop-enter-from, .pop-leave-to { opacity: 0; transform: translateY(-6px) scale(0.98); }

.content { padding: 0; flex: 1; }

.scrim { display: none; }

@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }
  .side { position: fixed; left: 0; top: 0; width: 260px; transform: translateX(-100%); transition: transform .22s ease; }
  .side.open { transform: none; }
  .burger { display: inline-flex; }
  .scrim.show { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.3); z-index: 35; }
  .dir-seg { display: none; }
  .uname { display: none; }
}
</style>
