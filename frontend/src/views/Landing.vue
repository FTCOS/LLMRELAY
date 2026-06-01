<script setup lang="ts">
/**
 * Landing.vue — LLMRELAY 落地页（Apple 清新风 · 模型平权）
 * 视觉对齐设计稿 design/landing.jsx。
 * - 设计 token 来自全局 src/assets/styles/tokens.css（var(--accent) 等），不依赖 Tailwind。
 * - 文案走 vue-i18n（landing.* 命名空间，见 i18n/locales/landing.{zh,en}.json）。
 * - direction 切换通过 <html data-dir="classic|equity|mono"> + CSS 变量。
 * - 仅调用 settings/public（appStore.fetchPublicSettings）；其它 API 不接，留 TODO。
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppStore } from '@/stores/app'
import { setLocale } from '@/i18n'
import { useRouter } from 'vue-router'

const { t, locale } = useI18n()
const appStore = useAppStore()
const router = useRouter()

// ---- 站点公开设置（真实 API：GET /api/v1/settings/public）----
const brand = computed(() =>
  appStore.siteName && appStore.siteName !== 'Sub2API' ? appStore.siteName : 'LLMRELAY'
)
const heroSub = computed(
  () => appStore.cachedPublicSettings?.site_subtitle || t('landing.hero.sub')
)
const docUrl = computed(() => appStore.docUrl || '')
// TODO(api): 文档/状态/账号等其它数据后续接入；落地页只读 settings/public。

// ---- 方向（classic / equity / mono）----
type Dir = 'classic' | 'equity' | 'mono'
const dir = ref<Dir>('classic')
function setDir(d: Dir) {
  dir.value = d
  document.documentElement.setAttribute('data-dir', d)
}

// ---- 语言切换 ----
const isZh = computed(() => locale.value === 'zh')
function switchLang(code: 'zh' | 'en') {
  void setLocale(code)
}

// ---- 模型阵容（字母色块，非品牌 logo）----
const models = [
  { k: 'Claude', d: 'Sonnet · Opus · Haiku', from: '#E08766', to: '#C96442', note: 'claudeNote' },
  { k: 'GPT', d: 'GPT-5 · o-series', from: '#1FBF97', to: '#10A37F', note: 'gptNote' },
  { k: 'DeepSeek', d: 'V3 · R1', from: '#6E86FF', to: '#4D6BFE', note: 'deepseekNote' },
  { k: 'Qwen', d: 'Max · Plus', from: '#8B74E8', to: '#6E56CF', note: 'qwenNote' }
]
const toolKeys = ['Claude Code', 'Codex', 'Cursor', 'Cline', 'OpenAI SDK', 'Gemini CLI']

const pricing = [
  { tag: 'tag1', name: 'name1', price: 'price1', unit: 'unit1', cta: 'cta1', feats: ['f1a', 'f1b', 'f1c', 'f1d'], hi: false },
  { tag: 'tag2', name: 'name2', price: 'price2', unit: 'unit2', cta: 'cta2', feats: ['f2a', 'f2b', 'f2c', 'f2d'], hi: true },
  { tag: 'tag3', name: 'name3', price: 'price3', unit: 'unit3', cta: 'cta3', feats: ['f3a', 'f3b', 'f3c', 'f3d'], hi: false }
]

const editorial = computed(() => dir.value === 'mono')

function goLogin() {
  void router.push('/login')
}
function goDocs() {
  if (docUrl.value) window.open(docUrl.value, '_blank', 'noopener')
}

onMounted(() => {
  setDir(dir.value)
  if (!appStore.publicSettingsLoaded) {
    // 真实 API：仅落地页需要的公开设置
    void appStore.fetchPublicSettings()
  }
})
</script>

<template>
  <div class="llm-landing" data-screen-label="Landing">
    <!-- ============ Nav ============ -->
    <nav class="nav">
      <div class="nav-inner">
        <a class="logo" href="/" @click.prevent>
          <span class="logo-mark" aria-hidden="true"></span>
          <span class="logo-word">
            <template v-if="brand === 'LLMRELAY'"><b>LLM</b><span class="r">RELAY</span></template>
            <template v-else>{{ brand }}</template>
          </span>
        </a>
        <div class="nav-links">
          <span class="nav-link">{{ t('landing.nav.product') }}</span>
          <span class="nav-link">{{ t('landing.nav.models') }}</span>
          <span class="nav-link">{{ t('landing.nav.pricing') }}</span>
          <span class="nav-link" @click="goDocs">{{ t('landing.nav.docs') }}</span>
        </div>
        <div class="nav-spacer"></div>
        <div class="lang" role="group" aria-label="language">
          <button :class="{ on: isZh }" @click="switchLang('zh')">中</button>
          <button :class="{ on: !isZh }" @click="switchLang('en')">EN</button>
        </div>
        <span class="nav-link" @click="goLogin">{{ t('landing.nav.login') }}</span>
        <button class="btn btn-primary btn-sm" @click="goLogin">{{ t('landing.nav.signup') }}</button>
      </div>
    </nav>

    <!-- ============ Hero ============ -->
    <section class="hero" :class="{ 'hero-left': editorial }">
      <div class="wrap">
        <div class="hero-grid" :class="editorial ? 'two' : 'one'">
          <div class="hero-copy">
            <span class="eyebrow"><span class="dot"></span>{{ t('landing.hero.eyebrow') }}</span>
            <h1 class="display grad-ink">{{ t('landing.hero.title1') }}<br />{{ t('landing.hero.title2') }}</h1>
            <p class="lead" :class="{ 'lead-center': !editorial }">{{ heroSub }}</p>
            <div class="hero-cta">
              <button class="btn btn-primary btn-lg" @click="goLogin">{{ t('landing.hero.cta1') }}</button>
              <a class="link-chev" href="#models" >{{ t('landing.hero.cta2') }} <span class="c">›</span></a>
            </div>
            <p class="small trust">{{ t('landing.hero.trust') }}</p>
          </div>

          <!-- Terminal window mock -->
          <div class="hero-window">
            <div class="hw-bar">
              <span class="dotc r"></span><span class="dotc y"></span><span class="dotc g"></span>
              <span class="hw-url mono">api.llmrelay.ai</span>
            </div>
            <div class="hw-body">
              <div class="hw-term mono">
                <div class="ln"><span class="c3">$</span> export <span class="ck">OPENAI_BASE_URL</span>=<span class="cs">https://api.llmrelay.ai/v1</span></div>
                <div class="ln"><span class="c3">$</span> export <span class="ck">OPENAI_API_KEY</span>=<span class="cs">sk-relay-••••••••</span></div>
                <div class="ln d3"><span class="c3">$</span> claude <span class="cd">{{ t('landing.term.comment') }}</span></div>
                <div class="hw-ok"><span class="ok-dot"></span> {{ t('landing.term.connected') }}</div>
              </div>
              <div class="hw-models">
                <div v-for="m in models" :key="m.k" class="hw-model">
                  <span class="badge" :style="{ background: `linear-gradient(145deg, ${m.from}, ${m.to})` }">{{ m.k[0] }}</span>
                  <span class="nm">{{ m.k }}</span>
                  <span class="on">●</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Tool strip ============ -->
    <section class="strip">
      <div class="wrap center">
        <p class="small strip-title">{{ t('landing.tools.title') }}</p>
        <div class="tool-strip">
          <span v-for="tool in toolKeys" :key="tool" class="tool-chip">{{ tool }}</span>
        </div>
      </div>
    </section>

    <!-- ============ Models ============ -->
    <section id="models" class="section tint">
      <div class="wrap">
        <div class="head center">
          <span class="eyebrow"><span class="dot"></span>{{ t('landing.models.eyebrow') }}</span>
          <h2 class="h2">{{ t('landing.models.title') }}</h2>
          <p class="lead">{{ t('landing.models.sub') }}</p>
        </div>
        <div class="grid g4">
          <div v-for="m in models" :key="m.k" class="model-tile">
            <span class="badge lg" :style="{ background: `linear-gradient(145deg, ${m.from}, ${m.to})` }">{{ m.k[0] }}</span>
            <div>
              <div class="h3">{{ m.k }}</div>
              <div class="mono tile-d">{{ m.d }}</div>
            </div>
            <p class="body tile-note">{{ t('landing.models.' + m.note) }}</p>
          </div>
        </div>
        <div class="center cta-row">
          <a class="link-chev" href="#pricing">{{ t('landing.models.cta') }} <span class="c">›</span></a>
        </div>
      </div>
    </section>

    <!-- ============ Values ============ -->
    <section class="section">
      <div class="wrap">
        <div class="head center">
          <span class="eyebrow"><span class="dot"></span>{{ t('landing.values.eyebrow') }}</span>
          <h2 class="h2">{{ t('landing.values.title') }}</h2>
        </div>
        <div class="grid g2">
          <div class="value-card">
            <div class="value-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></svg></div>
            <div><div class="h3 v-t">{{ t('landing.values.v1t') }}</div><p class="body v-d">{{ t('landing.values.v1d') }}</p></div>
          </div>
          <div class="value-card">
            <div class="value-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg></div>
            <div><div class="h3 v-t">{{ t('landing.values.v2t') }}</div><p class="body v-d">{{ t('landing.values.v2d') }}</p></div>
          </div>
          <div class="value-card">
            <div class="value-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg></div>
            <div><div class="h3 v-t">{{ t('landing.values.v3t') }}</div><p class="body v-d">{{ t('landing.values.v3d') }}</p></div>
          </div>
          <div class="value-card">
            <div class="value-ic"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z"/></svg></div>
            <div><div class="h3 v-t">{{ t('landing.values.v4t') }}</div><p class="body v-d">{{ t('landing.values.v4d') }}</p></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ Manifesto ============ -->
    <section class="section tint">
      <div class="wrap-narrow center">
        <span class="eyebrow"><span class="dot"></span>{{ t('landing.manifesto.eyebrow') }}</span>
        <blockquote class="manifesto-quote">{{ t('landing.manifesto.quote') }}</blockquote>
        <p class="lead manifesto-body">{{ t('landing.manifesto.body') }}</p>
      </div>
    </section>

    <!-- ============ Pricing ============ -->
    <section id="pricing" class="section">
      <div class="wrap">
        <div class="head center">
          <span class="eyebrow"><span class="dot"></span>{{ t('landing.pricing.eyebrow') }}</span>
          <h2 class="h2">{{ t('landing.pricing.title') }}</h2>
          <p class="lead">{{ t('landing.pricing.sub') }}</p>
        </div>
        <div class="grid g3">
          <div v-for="(c, i) in pricing" :key="i" class="price-card" :class="{ hi: c.hi }">
            <div class="price-tag">{{ t('landing.pricing.' + c.tag) }}</div>
            <div class="h3">{{ t('landing.pricing.' + c.name) }}</div>
            <div class="price-amt">{{ t('landing.pricing.' + c.price) }}<span class="price-unit">{{ t('landing.pricing.' + c.unit) }}</span></div>
            <div class="price-feats">
              <div v-for="f in c.feats" :key="f" class="price-feat">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                <span>{{ t('landing.pricing.' + f) }}</span>
              </div>
            </div>
            <button class="btn btn-block" :class="c.hi ? 'btn-primary' : 'btn-outline'" @click="goLogin">{{ t('landing.pricing.' + c.cta) }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- ============ CTA band ============ -->
    <section class="cta-band">
      <div class="wrap-narrow center">
        <h2 class="h1 cta-title">{{ t('landing.ctaband.title') }}</h2>
        <p class="lead cta-sub">{{ t('landing.ctaband.sub') }}</p>
        <div class="hero-cta center-cta">
          <button class="btn btn-lg cta-white" @click="goLogin">{{ t('landing.ctaband.cta1') }}</button>
          <button class="btn btn-lg cta-clear" @click="goDocs">{{ t('landing.ctaband.cta2') }}</button>
        </div>
      </div>
    </section>

    <!-- ============ Footer ============ -->
    <footer class="footer">
      <div class="wrap">
        <div class="foot-cols">
          <div class="foot-col">
            <a class="logo" href="/" @click.prevent>
              <span class="logo-mark" aria-hidden="true"></span>
              <span class="logo-word"><b>LLM</b><span class="r">RELAY</span></span>
            </a>
            <p class="small foot-tag">{{ t('landing.footer.tagline') }}</p>
          </div>
          <div class="foot-col">
            <h5>{{ t('landing.footer.col1') }}</h5>
            <a>{{ t('landing.footer.col1a') }}</a><a>{{ t('landing.footer.col1b') }}</a><a>{{ t('landing.footer.col1c') }}</a><a>{{ t('landing.footer.col1d') }}</a>
          </div>
          <div class="foot-col">
            <h5>{{ t('landing.footer.col2') }}</h5>
            <a>{{ t('landing.footer.col2a') }}</a><a>{{ t('landing.footer.col2b') }}</a><a>{{ t('landing.footer.col2c') }}</a><a>{{ t('landing.footer.col2d') }}</a>
          </div>
          <div class="foot-col">
            <h5>{{ t('landing.footer.col3') }}</h5>
            <a>{{ t('landing.footer.col3a') }}</a><a>{{ t('landing.footer.col3b') }}</a><a>{{ t('landing.footer.col3c') }}</a><a>{{ t('landing.footer.col3d') }}</a>
          </div>
        </div>
        <div class="small foot-copy">{{ t('landing.footer.copy') }}</div>
      </div>
    </footer>

    <!-- ============ Direction switch (demo; 上线可移除或保留) ============ -->
    <div class="dir-switch">
      <span class="dir-label">{{ t('landing.dir.label') }}</span>
      <div class="dir-seg">
        <button :class="{ on: dir === 'classic' }" @click="setDir('classic')">{{ t('landing.dir.classic') }}</button>
        <button :class="{ on: dir === 'equity' }" @click="setDir('equity')">{{ t('landing.dir.equity') }}</button>
        <button :class="{ on: dir === 'mono' }" @click="setDir('mono')">{{ t('landing.dir.mono') }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tokens come from global tokens.css (var(--accent) …). Component styles only. */
.llm-landing { font-family: var(--font); color: var(--ink); background: var(--bg);
  -webkit-font-smoothing: antialiased; font-size: 17px; line-height: 1.5; letter-spacing: -0.003em; }
.llm-landing * { box-sizing: border-box; }

.wrap { max-width: var(--maxw); margin: 0 auto; padding: 0 28px; }
.wrap-narrow { max-width: 760px; margin: 0 auto; padding: 0 28px; }
.section { padding: 100px 0; }
.tint { background: var(--tint); }
.center { text-align: center; }
.head { max-width: 660px; margin: 0 auto 52px; }

.eyebrow { font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: var(--accent-ink);
  display: inline-flex; align-items: center; gap: 7px; }
.eyebrow .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

.display { font-size: clamp(40px, 6.2vw, 80px); line-height: 1.04; letter-spacing: -0.025em; font-weight: 650; margin-top: 18px; }
.h1 { font-size: clamp(32px, 4.4vw, 56px); line-height: 1.07; letter-spacing: -0.02em; font-weight: 650; }
.h2 { font-size: clamp(26px, 3vw, 40px); line-height: 1.12; letter-spacing: -0.018em; font-weight: 640; margin-top: 14px; }
.h3 { font-size: 22px; line-height: 1.2; letter-spacing: -0.01em; font-weight: 620; }
.lead { font-size: clamp(19px, 2vw, 23px); line-height: 1.42; color: var(--ink-2); font-weight: 420; margin-top: 14px; }
.body { font-size: 17px; color: var(--ink-2); line-height: 1.5; }
.small { font-size: 14px; color: var(--ink-3); }
.mono { font-family: var(--mono); }
.grad-ink { background: linear-gradient(180deg, var(--ink) 0%, #3a3a3d 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent; }

/* buttons */
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none;
  border-radius: var(--pill); font-size: 16px; font-weight: 500; letter-spacing: -0.01em;
  padding: 11px 22px; line-height: 1; cursor: pointer; font-family: inherit;
  transition: transform .12s ease, background .2s ease, box-shadow .2s ease, color .2s ease; white-space: nowrap; }
.btn:active { transform: scale(0.97); }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover { background: var(--accent-press); }
.btn-outline { background: transparent; color: var(--accent-ink); box-shadow: inset 0 0 0 1px var(--line); }
.btn-outline:hover { box-shadow: inset 0 0 0 1px var(--ink-4); }
.btn-lg { font-size: 18px; padding: 14px 30px; }
.btn-sm { font-size: 14px; padding: 8px 16px; }
.btn-block { width: 100%; }
.link-chev { color: var(--accent-ink); font-weight: 480; display: inline-flex; align-items: center; gap: 3px; font-size: 16px; text-decoration: none; }
.link-chev .c { transition: transform .15s ease; }
.link-chev:hover .c { transform: translateX(3px); }

/* nav */
.nav { position: sticky; top: 0; z-index: 50; height: 48px; background: rgba(255,255,255,0.72);
  backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
  border-bottom: 1px solid var(--line-2); }
.nav-inner { max-width: var(--maxw); margin: 0 auto; height: 100%; padding: 0 28px; display: flex; align-items: center; gap: 8px; }
.nav-links { display: flex; align-items: center; gap: 4px; margin-left: 22px; }
.nav-link { font-size: 13px; color: var(--ink-2); padding: 6px 11px; border-radius: 8px; font-weight: 450; cursor: pointer; transition: background .15s, color .15s; }
.nav-link:hover { background: rgba(0,0,0,0.05); color: var(--ink); }
.nav-spacer { flex: 1; }
.lang { display: inline-flex; align-items: center; border-radius: var(--pill); background: rgba(0,0,0,0.05); padding: 2px; font-size: 12px; font-weight: 600; }
.lang button { border: none; background: transparent; color: var(--ink-3); padding: 4px 9px; border-radius: var(--pill); cursor: pointer; transition: all .15s; }
.lang button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.12); }

/* logo */
.logo { display: inline-flex; align-items: center; gap: 9px; cursor: pointer; user-select: none; text-decoration: none; }
.logo-mark { width: 26px; height: 26px; border-radius: 7px; background: var(--accent); position: relative; flex: none; }
.logo-mark::before, .logo-mark::after { content: ""; position: absolute; width: 6px; height: 6px; border-top: 2px solid #fff; border-right: 2px solid #fff; top: 9px; transform: rotate(45deg); }
.logo-mark::before { left: 7px; } .logo-mark::after { left: 13px; opacity: .55; }
.logo-word { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; color: var(--ink); }
.logo-word b { font-weight: 700; } .logo-word .r { color: var(--ink-3); font-weight: 500; }

/* hero */
.hero { padding: 84px 0 30px; overflow: hidden; }
.hero-left { padding-top: 70px; }
.hero-grid.one { text-align: center; }
.hero-grid.one .hero-copy { display: contents; }
.hero-grid.one .hero-window { margin: 56px auto 0; max-width: 760px; }
.hero-grid.two { display: grid; grid-template-columns: 1.05fr 1fr; gap: 48px; align-items: center; }
.hero-grid.two .hero-window { margin: 0; }
.hero-copy .eyebrow { animation: llmrelay-fade-up .7s both; }
.display { animation: llmrelay-fade-up .7s .05s both; }
.lead { max-width: 680px; }
.lead-center { margin-left: auto; margin-right: auto; }
.hero-cta { display: flex; align-items: center; gap: 22px; margin-top: 34px; }
.hero-grid.one .hero-cta { justify-content: center; }
.trust { margin-top: 26px; }

.hero-window { background: var(--bg); border-radius: var(--radius-lg); box-shadow: var(--card-shadow-lift);
  border: 1px solid var(--line-2); overflow: hidden; animation: llmrelay-fade-up .7s .19s both; }
.hw-bar { display: flex; align-items: center; gap: 7px; padding: 13px 16px; border-bottom: 1px solid var(--line-2); background: var(--surface-2); }
.hw-bar .dotc { width: 11px; height: 11px; border-radius: 50%; }
.hw-bar .r { background: #ff5f57; } .hw-bar .y { background: #febc2e; } .hw-bar .g { background: #28c840; }
.hw-url { margin-left: 10px; font-size: 12px; color: var(--ink-3); }
.hw-body { padding: 22px; display: grid; gap: 18px; }
.hw-term { background: #1d1d1f; border-radius: 14px; padding: 18px 20px; font-size: 13px; line-height: 1.85; color: #e6e6e6; overflow-x: auto; }
.hw-term .ln { animation: llmrelay-line-in .5s both; }
.hw-term .d3 { animation-delay: .25s; margin-top: 8px; }
.hw-term .c3 { color: #6b8afd; } .hw-term .ck { color: #d291ff; } .hw-term .cs { color: #6fdc8c; } .hw-term .cd { color: #6e6e73; }
.hw-ok { margin-top: 10px; color: #9aa0a6; display: flex; align-items: center; gap: 8px; font-size: 12.5px; }
.ok-dot { width: 7px; height: 7px; border-radius: 50%; background: #28c840; box-shadow: 0 0 0 4px rgba(40,200,64,.18); }
.hw-models { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.hw-model { display: flex; align-items: center; gap: 11px; padding: 11px 14px; border: 1px solid var(--line-2); border-radius: 13px; font-size: 14px; font-weight: 550; }
.hw-model .nm { flex: 1; } .hw-model .on { color: #28c840; font-size: 9px; }

.badge { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; color: #fff; font-weight: 700; font-size: 15px; flex: none; }
.badge.lg { width: 44px; height: 44px; border-radius: 12px; font-size: 18px; }
:global(html[data-dir='mono']) .badge { filter: saturate(0.18) brightness(0.96); }

/* tool strip */
.strip { padding: 40px 0; }
.strip-title { margin-bottom: 22px; font-weight: 500; }
.tool-strip { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }
.tool-chip { font-size: 14px; font-weight: 550; color: var(--ink-2); background: var(--surface); padding: 9px 18px; border-radius: var(--pill); }

/* models */
.grid { display: grid; gap: 20px; }
.g4 { grid-template-columns: repeat(4, 1fr); }
.g3 { grid-template-columns: repeat(3, 1fr); align-items: stretch; }
.g2 { grid-template-columns: repeat(2, 1fr); }
.model-tile { background: var(--bg); border-radius: var(--radius); border: 1px solid var(--line-2); padding: 22px 22px 20px; display: flex; flex-direction: column; gap: 13px; transition: box-shadow .25s ease, transform .25s ease, border-color .25s; }
.model-tile:hover { box-shadow: var(--card-shadow-lift); transform: translateY(-3px); border-color: transparent; }
.tile-d { font-size: 12.5px; color: var(--ink-3); margin-top: 3px; }
.tile-note { font-size: 14.5px; margin-top: auto; }
.cta-row { margin-top: 36px; }

/* values */
.value-card { display: flex; gap: 18px; align-items: flex-start; padding: 30px; background: var(--bg); border: 1px solid var(--line-2); border-radius: var(--radius); transition: box-shadow .25s, transform .25s; }
.value-card:hover { box-shadow: var(--card-shadow); transform: translateY(-2px); }
.value-ic { width: 46px; height: 46px; border-radius: 13px; background: var(--accent-soft); color: var(--accent-ink); display: grid; place-items: center; flex: none; }
:global(html[data-dir='mono']) .value-ic { color: var(--ink); }
.v-t { margin-bottom: 8px; } .v-d { font-size: 15.5px; }

/* manifesto */
.manifesto-quote { font-size: clamp(28px, 4vw, 46px); line-height: 1.18; letter-spacing: -0.02em; font-weight: 640; margin-top: 22px; text-wrap: balance; color: var(--ink); }
.manifesto-body { margin-top: 24px; }

/* pricing */
.price-card { background: var(--bg); border: 1px solid var(--line); border-radius: var(--radius); padding: 30px 28px 28px; display: flex; flex-direction: column; gap: 14px; transition: box-shadow .25s, transform .25s; }
.price-card:hover { box-shadow: var(--card-shadow); transform: translateY(-3px); }
.price-card.hi { border-color: transparent; box-shadow: 0 0 0 2px var(--accent), var(--card-shadow-lift); }
.price-tag { font-size: 12px; font-weight: 700; color: var(--accent-ink); letter-spacing: 0.02em; text-transform: uppercase; }
:global(html[data-dir='mono']) .price-tag { color: var(--ink-2); }
.price-amt { font-size: 38px; font-weight: 680; letter-spacing: -0.025em; display: flex; align-items: baseline; gap: 8px; margin: 2px 0 4px; }
.price-unit { font-size: 13px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; }
.price-feats { display: flex; flex-direction: column; gap: 11px; margin: 6px 0 10px; }
.price-feat { display: flex; align-items: center; gap: 10px; font-size: 14.5px; color: var(--ink-2); }
.price-feat svg { color: var(--accent); flex: none; }
:global(html[data-dir='mono']) .price-feat svg { color: var(--ink); }
.price-card .btn { margin-top: auto; }

/* cta band */
.cta-band { padding: 96px 0; background: linear-gradient(160deg, color-mix(in oklab, var(--accent) 92%, #000) 0%, var(--accent) 100%); }
:global(html[data-dir='mono']) .cta-band { background: linear-gradient(160deg, #2a2a2d, #1d1d1f); }
.cta-title { color: #fff; } .cta-sub { color: rgba(255,255,255,0.8); margin-top: 16px; }
.center-cta { justify-content: center; margin-top: 30px; }
.cta-white { background: #fff; color: var(--ink); }
.cta-white:hover { background: rgba(255,255,255,0.9); }
.cta-clear { background: rgba(255,255,255,0.16); color: #fff; }
.cta-clear:hover { background: rgba(255,255,255,0.26); }

/* footer */
.footer { background: var(--surface); border-top: 1px solid var(--line-2); padding: 48px 0 40px; }
.foot-cols { display: grid; grid-template-columns: 1.4fr repeat(3, 1fr); gap: 32px; }
.foot-col h5 { font-size: 12px; color: var(--ink-3); font-weight: 600; margin-bottom: 12px; }
.foot-col a { display: block; color: var(--ink-2); font-size: 13px; padding: 5px 0; cursor: pointer; text-decoration: none; }
.foot-col a:hover { color: var(--ink); }
.foot-tag { margin-top: 14px; max-width: 260px; line-height: 1.5; }
.foot-copy { margin-top: 40px; padding-top: 22px; border-top: 1px solid var(--line-2); color: var(--ink-3); }

/* direction switch */
.dir-switch { position: fixed; left: 18px; bottom: 18px; z-index: 60; display: flex; align-items: center; gap: 9px;
  background: rgba(255,255,255,0.8); backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px);
  border: 1px solid var(--line-2); border-radius: var(--pill); padding: 5px 6px 5px 13px; box-shadow: var(--card-shadow); }
.dir-label { font-size: 11px; font-weight: 600; color: var(--ink-3); letter-spacing: .02em; }
.dir-seg { display: flex; background: rgba(0,0,0,0.05); border-radius: var(--pill); padding: 2px; }
.dir-seg button { border: none; background: transparent; padding: 5px 11px; border-radius: var(--pill); font-size: 12px; font-weight: 600; color: var(--ink-3); cursor: pointer; transition: all .15s; }
.dir-seg button.on { background: #fff; color: var(--ink); box-shadow: 0 1px 2px rgba(0,0,0,0.14); }

@media (max-width: 880px) {
  .section { padding: 72px 0; }
  .hero-grid.two { grid-template-columns: 1fr; }
  .g4 { grid-template-columns: repeat(2, 1fr); }
  .g3, .g2 { grid-template-columns: 1fr; }
  .nav-links { display: none; }
  .foot-cols { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 560px) {
  .hero-cta { flex-direction: column; align-items: stretch; }
  .hero-grid.one .hero-cta { align-items: center; }
  .hw-models { grid-template-columns: 1fr; }
  .g4 { grid-template-columns: 1fr; }
  .dir-label { display: none; }
}
</style>
