# LLMRELAY — UI Redesign (设计稿)

模型平权 · Model Equality —— AI 模型中转平台界面的 Apple 清新风设计版。
纯前端高保真原型(数据为示例),中英双语,3 套视觉方向。

## 打开方式
- 直接用浏览器打开 `index.html` 即可(需联网加载 React / Babel CDN)。
- 或本地起静态服务器:`npx serve .` 然后访问对应地址。

## 页面
- 落地页 Landing
- 登录 / 注册 Auth
- 用户仪表盘 Dashboard(配额 / 用量 / API Key)
- 公开「查询用量」页 Key Usage(环形进度)
- 管理后台 Admin(总览 / 用户 / 账号池 / 用量 / 兑换码 …)

## 交互
- 右上「中 / EN」切换语言
- 左下「方向」切换 经典蓝 / 平权青 / 黑曜墨
- 工具栏 Tweaks 面板可快捷跳转各页 & 调圆角

## 文件结构
- `index.html`            入口(脚本/样式加载顺序)
- `styles.css` `landing.css` `app-extra.css`   样式系统
- `i18n.js` `i18n-admin.js`   中英文案
- `*.jsx`                 各页面 React 组件(浏览器内 Babel 编译)

> 注:这是设计稿,非接后端的生产代码。若要并入仓库 (FTCOS/LLMRELAY) 的 Vue 前端,需要按其组件规范改写。
