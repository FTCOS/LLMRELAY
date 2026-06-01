/**
 * tailwind.config.llmrelay.js — LLMRELAY Apple-clean theme override
 *
 * 基于 fork 现有 tailwind.config.js，仅改主题层（颜色/阴影/渐变/圆角/字体）。
 * 用法（部署侧二选一）：
 *   A. 直接替换 frontend/tailwind.config.js 的内容为本文件；或
 *   B. 重命名为 tailwind.config.js 覆盖。
 * content / darkMode / animation / keyframes 与原版保持一致，保证现有 50+ view 不掉功能。
 *
 * 核心变化：primary 青(#14b8a6) → Apple 蓝(#0071e3)。
 * 因为 fork 的 .btn-primary / .badge-primary / .sidebar-link-active / .progress-bar 等
 * 组件类全部 @apply *-primary-*，换 primary 调色板即可一次性重刷全站强调色。
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 主色调 — Apple 蓝（classic 方向）。50→950 阶梯，锚点 500 = #0071e3
        primary: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#b6d5ff',
          300: '#84b8ff',
          400: '#4a94ff',
          500: '#0071e3',
          600: '#005ec4',
          700: '#004c9e',
          800: '#003d7f',
          900: '#00305f',
          950: '#001d3b'
        },
        // 辅助色 — 中性冷灰（保留 slate 体系，作为次级文本/边框）
        accent: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        },
        // 深色模式背景（保留 slate 中性，避免重写 dark 体系，仅强调色随 primary 变蓝）
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      },
      fontFamily: {
        // macOS 原生栈（SF Pro + 苹方），与 tokens.css 的 --font 一致
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'SF Pro Text',
          'Helvetica Neue',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'system-ui',
          'sans-serif'
        ],
        mono: ['SF Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        // Apple 风：低层 1px + 远层柔和大投影，告别青色 glow
        glass: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 28px rgba(0, 0, 0, 0.06)',
        'glass-sm': '0 1px 2px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.05)',
        glow: '0 4px 16px rgba(0, 113, 227, 0.12)',
        'glow-lg': '0 8px 30px rgba(0, 113, 227, 0.16)',
        card: '0 1px 2px rgba(0, 0, 0, 0.04), 0 8px 24px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 2px 6px rgba(0, 0, 0, 0.06), 0 18px 40px rgba(0, 0, 0, 0.09)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        // 蓝色温和渐变（按钮/进度条用），不再青色
        'gradient-primary': 'linear-gradient(135deg, #0071e3 0%, #005ec4 100%)',
        'gradient-dark': 'linear-gradient(135deg, #2a2a2d 0%, #1d1d1f 100%)',
        'gradient-glass':
          'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        // mesh 收敛成极淡的蓝雾（几乎留白），去掉原青色大色块
        'mesh-gradient':
          'radial-gradient(at 40% 20%, rgba(0, 113, 227, 0.05) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(0, 113, 227, 0.03) 0px, transparent 50%)'
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        shimmer: 'shimmer 2s linear infinite',
        glow: 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { '0%': { opacity: '0', transform: 'translateX(20px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.95)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        // glow keyframe 收敛成蓝色微光
        glow: { '0%': { boxShadow: '0 0 16px rgba(0, 113, 227, 0.14)' }, '100%': { boxShadow: '0 0 24px rgba(0, 113, 227, 0.22)' } }
      },
      backdropBlur: { xs: '2px' },
      borderRadius: {
        // 收敛激进大圆角到 Apple 中等档（xl=12 / 2xl=16 保持不变）
        '3xl': '1.125rem', // 24px → 18px
        '4xl': '1.25rem'   // 32px → 20px
      }
    }
  },
  plugins: []
}
