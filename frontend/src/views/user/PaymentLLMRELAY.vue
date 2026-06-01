<script setup lang="ts">
/**
 * PaymentView (PaymentLLMRELAY.vue) — 充值 / 账单
 * 自包裹 AppLayoutLLMRELAY。Apple 清新风。
 *
 * 真实 API（fork 现存）—— 注意 paymentAPI.* 返回 axios 响应，需 .data：
 *  - paymentAPI.getCheckoutInfo()  一次拿 methods/global_min/max/plans/balance_recharge_multiplier/help
 *  - paymentAPI.createOrder(data)  下单 → 按 result_type 处理 pay_url / qr_code
 *  - paymentAPI.getMyOrders()      我的订单
 *  余额来自 authStore.user.balance。
 *
 * 占位（标注 TODO）：
 *  - 二维码 / Stripe / Airwallex 衍生结算页放 P9（StripePopup/QRCode/Result/Orders）。
 *    本页拿到 pay_url 直接跳转；qr_code 暂以提示占位。
 */
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import AppLayoutLLMRELAY from '@/components/layout/AppLayoutLLMRELAY.vue'
import { paymentAPI } from '@/api/payment'
import type { MethodLimit, PaymentOrder, OrderStatus } from '@/types/payment'

const { t, locale } = useI18n()
const authStore = useAuthStore()
const appStore = useAppStore()
const isZh = computed(() => locale.value === 'zh')

const loading = ref(true)
const enabled = ref(true)
const methods = ref<Record<string, MethodLimit>>({})
const globalMin = ref(0)
const globalMax = ref(0)
const multiplier = ref(1)
const orders = ref<PaymentOrder[]>([])

const presets = [10, 30, 50, 100, 200, 500]
const amount = ref<number>(50)
const customAmount = ref('')
const method = ref('')
const paying = ref(false)

const methodKeys = computed(() => Object.keys(methods.value).filter((k) => methods.value[k]?.available !== false))
const effectiveAmount = computed(() => {
  const c = customAmount.value === '' ? amount.value : Number(customAmount.value)
  return isNaN(c) ? 0 : c
})
const balance = computed(() => {
  const v = Number(authStore.user?.balance || 0)
  return '$' + v.toFixed(v !== 0 && Math.abs(v) < 1 ? 4 : 2)
})

const METHOD_LABEL: Record<string, string> = {
  alipay: '支付宝', alipay_direct: '支付宝', wxpay: '微信支付', wxpay_direct: '微信支付',
  stripe: 'Stripe', easypay: 'EasyPay', airwallex: 'Airwallex'
}
function methodLabel(k: string): string {
  if (METHOD_LABEL[k] && isZh.value) return METHOD_LABEL[k]
  return k.charAt(0).toUpperCase() + k.slice(1).replace('_', ' ')
}

function pickPreset(v: number) { amount.value = v; customAmount.value = '' }

function fmtTime(s: string): string {
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleString(isZh.value ? 'zh-CN' : 'en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
function stLabel(s: OrderStatus): string {
  const k = 'user.payment.st.' + s
  const v = t(k)
  return v === k ? s : v
}
function stClass(s: OrderStatus): string {
  if (s === 'COMPLETED' || s === 'PAID') return 'tag-green'
  if (s === 'PENDING' || s === 'RECHARGING') return 'tag-amber'
  if (s === 'FAILED' || s === 'EXPIRED' || s === 'CANCELLED') return 'tag-gray'
  return 'tag-gray'
}

async function pay() {
  if (paying.value || !method.value || effectiveAmount.value <= 0) return
  paying.value = true
  try {
    const { data } = await paymentAPI.createOrder({
      amount: effectiveAmount.value,
      payment_type: method.value,
      order_type: 'balance',
      return_url: window.location.origin + '/payment/result',
      is_mobile: /Mobi|Android/i.test(navigator.userAgent)
    })
    if (data.pay_url) {
      appStore.showInfo(t('user.payment.redirecting'))
      window.location.assign(data.pay_url)
    } else if (data.qr_code) {
      // TODO(P9): 渲染二维码结算页（PaymentQRCodeLLMRELAY）。暂提示并刷新订单。
      appStore.showInfo(t('user.payment.redirecting'))
      await loadOrders()
    } else {
      await loadOrders()
    }
  } catch (e: any) {
    appStore.showError(e?.response?.data?.message || t('user.payment.err'))
  } finally { paying.value = false }
}

async function loadOrders() {
  try {
    const { data } = await paymentAPI.getMyOrders({ page: 1, page_size: 8 })
    orders.value = data.items || []
  } catch { /* noop */ }
}

async function load() {
  loading.value = true
  try {
    const { data } = await paymentAPI.getCheckoutInfo()
    methods.value = data.methods || {}
    globalMin.value = data.global_min || 0
    globalMax.value = data.global_max || 0
    multiplier.value = data.balance_recharge_multiplier || 1
    enabled.value = !data.balance_disabled
    method.value = methodKeys.value[0] || ''
  } catch {
    enabled.value = false
  } finally { loading.value = false }
  await loadOrders()
}
onMounted(load)
</script>

<template>
  <AppLayoutLLMRELAY>
    <div class="pay" data-screen-label="Payment">
      <div class="head">
        <div><h1 class="title">{{ t('user.payment.title') }}</h1><p class="sub">{{ t('user.payment.sub') }}</p></div>
        <div class="bal-pill"><span class="bal-l">{{ t('profile.balance') }}</span><span class="bal-v">{{ balance }}</span></div>
      </div>

      <div v-if="!enabled && !loading" class="card disabled-card">{{ t('user.payment.disabled') }}</div>

      <div v-else class="grid two">
        <!-- top-up -->
        <div class="card">
          <div class="card-title">{{ t('user.payment.amount') }}</div>
          <div class="presets">
            <button v-for="p in presets" :key="p" class="preset" :class="{ on: customAmount === '' && amount === p }" @click="pickPreset(p)">${{ p }}</button>
          </div>
          <div class="field">
            <label>{{ t('user.payment.custom') }}</label>
            <input v-model="customAmount" class="input" inputmode="decimal" :placeholder="String(amount)" />
            <p v-if="globalMin || globalMax" class="hint">
              <template v-if="globalMin">{{ t('user.payment.minHint', { min: '$' + globalMin }) }}</template>
              <template v-if="globalMin && globalMax"> · </template>
              <template v-if="globalMax">{{ t('user.payment.maxHint', { max: '$' + globalMax }) }}</template>
            </p>
            <p v-if="multiplier > 1" class="bonus">{{ t('user.payment.bonus', { x: multiplier }) }}</p>
          </div>

          <div class="card-title mt">{{ t('user.payment.method') }}</div>
          <div class="methods">
            <button v-for="k in methodKeys" :key="k" class="method" :class="{ on: method === k }" @click="method = k">{{ methodLabel(k) }}</button>
          </div>

          <button class="btn btn-primary btn-block btn-lg pay-btn" :disabled="paying || !method || effectiveAmount <= 0" @click="pay">
            {{ paying ? t('user.payment.paying') : t('user.payment.pay') + ' · $' + effectiveAmount }}
          </button>
        </div>

        <!-- recent orders -->
        <div class="card">
          <div class="card-title">{{ t('user.payment.recent') }}</div>
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr><th>{{ t('user.payment.ordCols.time') }}</th><th class="num">{{ t('user.payment.ordCols.amount') }}</th><th>{{ t('user.payment.ordCols.method') }}</th><th>{{ t('user.payment.ordCols.status') }}</th></tr></thead>
              <tbody>
                <tr v-if="!orders.length"><td colspan="4" class="center muted">{{ t('user.payment.empty') }}</td></tr>
                <tr v-for="o in orders" :key="o.id">
                  <td class="mono small">{{ fmtTime(o.created_at) }}</td>
                  <td class="num mono">${{ o.amount }}</td>
                  <td class="small">{{ methodLabel(o.payment_type) }}</td>
                  <td><span class="tag" :class="stClass(o.status)"><span class="d"></span>{{ stLabel(o.status) }}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayoutLLMRELAY>
</template>

<style scoped>
.pay { padding: 26px 30px 60px; max-width: 1180px; }
.pay * { box-sizing: border-box; }
.head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.title { font-size: 28px; font-weight: 650; letter-spacing: -0.02em; }
.sub { font-size: 15px; color: var(--ink-2); margin-top: 4px; }
.bal-pill { display: flex; flex-direction: column; align-items: flex-end; background: #fff; border: 1px solid var(--line-2); border-radius: 14px; padding: 10px 18px; box-shadow: var(--card-shadow); }
.bal-l { font-size: 11.5px; color: var(--ink-3); font-weight: 500; }
.bal-v { font-size: 20px; font-weight: 680; color: var(--accent-ink); letter-spacing: -0.02em; }
:global(html[data-dir='mono']) .bal-v { color: var(--ink); }

.grid { display: grid; gap: 16px; }
.two { grid-template-columns: 1fr 1fr; }

.card { background: #fff; border-radius: var(--radius); border: 1px solid var(--line-2); box-shadow: var(--card-shadow); padding: 24px 26px; }
.card-title { font-size: 16px; font-weight: 620; letter-spacing: -0.01em; margin-bottom: 14px; }
.card-title.mt { margin-top: 22px; }
.disabled-card { color: var(--ink-3); text-align: center; padding: 40px; }

.presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 16px; }
.preset { border: 1px solid var(--line); background: #fff; border-radius: 12px; padding: 14px 0; font-size: 16px; font-weight: 600; color: var(--ink); cursor: pointer; font-family: inherit; transition: all .15s; }
.preset:hover { border-color: var(--ink-4); }
.preset.on { border-color: transparent; box-shadow: inset 0 0 0 2px var(--accent); color: var(--accent-ink); background: var(--accent-soft); }
:global(html[data-dir='mono']) .preset.on { color: var(--ink); background: #ededed; }

.field { margin-bottom: 4px; }
.field label { display: block; font-size: 13px; font-weight: 550; color: var(--ink-2); margin-bottom: 7px; }
.input { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 12px 15px; font-size: 16px; font-family: inherit; color: var(--ink); background: var(--surface-2); transition: border-color .15s, box-shadow .15s, background .15s; }
.input:focus { outline: none; border-color: var(--accent); background: #fff; box-shadow: 0 0 0 4px var(--accent-soft); }
.hint { font-size: 12.5px; color: var(--ink-3); margin-top: 7px; }
.bonus { font-size: 12.5px; color: var(--accent-ink); font-weight: 600; margin-top: 5px; }
:global(html[data-dir='mono']) .bonus { color: var(--ink-2); }

.methods { display: flex; flex-wrap: wrap; gap: 10px; }
.method { border: 1px solid var(--line); background: #fff; border-radius: var(--pill); padding: 9px 18px; font-size: 14px; font-weight: 500; color: var(--ink-2); cursor: pointer; font-family: inherit; transition: all .15s; }
.method:hover { border-color: var(--ink-4); }
.method.on { border-color: var(--accent); color: var(--accent-ink); background: var(--accent-soft); }
:global(html[data-dir='mono']) .method.on { color: var(--ink); background: #ededed; border-color: var(--ink); }

.btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; border: none; border-radius: var(--pill); font-size: 15px; font-weight: 500; padding: 12px 22px; line-height: 1; cursor: pointer; font-family: inherit; transition: transform .12s, background .2s; }
.btn:active { transform: scale(0.98); }
.btn:disabled { opacity: .55; cursor: default; }
.btn-primary { background: var(--accent); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--accent-press); }
.btn-block { width: 100%; }
.btn-lg { font-size: 16px; padding: 14px; }
.pay-btn { margin-top: 22px; }

.table-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13.5px; }
.tbl th { text-align: left; font-size: 11.5px; color: var(--ink-3); font-weight: 600; padding: 0 12px 11px; }
.tbl th.num, .tbl td.num { text-align: right; }
.tbl td { padding: 11px 12px; border-top: 1px solid var(--line-2); }
.mono { font-family: var(--mono); }
.small { font-size: 12.5px; color: var(--ink-3); }
.muted { color: var(--ink-3); } .center { text-align: center; padding: 24px 0; }
.tag { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 9px; border-radius: var(--pill); }
.tag .d { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.tag-green { background: #e6f7ee; color: #14794a; }
.tag-amber { background: #fdf0db; color: #b45309; }
.tag-gray { background: var(--surface); color: var(--ink-3); }

@media (max-width: 900px) { .pay { padding: 20px; } .two { grid-template-columns: 1fr; } .head { flex-direction: column; align-items: flex-start; } }
</style>
