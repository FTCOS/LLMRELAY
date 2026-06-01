// i18n-admin.js — extends window.I18N with Key-Usage + Admin strings
(function () {
  const Z = window.I18N.zh, E = window.I18N.en;

  Z.ku = {
    nav: "查询用量",
    title: "查询 API Key 用量",
    subtitle: "输入你的 Key，实时查看余额、配额与明细。我们不会存储你的密钥。",
    placeholder: "sk-relay-xxxxxxxxxxxx",
    query: "查询", querying: "查询中…",
    privacy: "🔒 仅用于本次查询，绝不存储你的 Key。",
    rangeLabel: "时间范围",
    ranges: [{ k: "7d", l: "近 7 天" }, { k: "30d", l: "近 30 天" }, { k: "custom", l: "自定义" }],
    statusActive: "正常", statusText: "服务可用",
    used: "已用", reset: "重置",
    rings: [
      { t: "余额", isBal: true, amt: "¥328.50", sub: "可用余额" },
      { t: "今日配额", pct: 42, amt: "$4.20 / $10", reset: "6h 后", icon: "clock" },
      { t: "本月配额", pct: 68, amt: "$204 / $300", reset: "12 天后", icon: "calendar" },
    ],
    detailTitle: "明细信息",
    rows: [
      { l: "Key 名称", v: "Claude Code" },
      { l: "模型范围", v: "Claude · GPT · DeepSeek · Qwen" },
      { l: "创建时间", v: "2026-05-12" },
      { l: "最近使用", v: "2 分钟前" },
      { l: "总请求数", v: "48,210" },
      { l: "累计 Tokens", v: "62.4M" },
    ],
    empty: "输入上方的 API Key 即可查看用量。",
  };
  E.ku = {
    nav: "Usage lookup",
    title: "Check API Key usage",
    subtitle: "Enter your key to see balance, quota and details in real time. We never store your key.",
    placeholder: "sk-relay-xxxxxxxxxxxx",
    query: "Check", querying: "Checking…",
    privacy: "🔒 Used only for this lookup — your key is never stored.",
    rangeLabel: "Range",
    ranges: [{ k: "7d", l: "Last 7 days" }, { k: "30d", l: "Last 30 days" }, { k: "custom", l: "Custom" }],
    statusActive: "Active", statusText: "Service available",
    used: "used", reset: "resets",
    rings: [
      { t: "Balance", isBal: true, amt: "¥328.50", sub: "available" },
      { t: "Daily quota", pct: 42, amt: "$4.20 / $10", reset: "in 6h", icon: "clock" },
      { t: "Monthly quota", pct: 68, amt: "$204 / $300", reset: "in 12d", icon: "calendar" },
    ],
    detailTitle: "Details",
    rows: [
      { l: "Key name", v: "Claude Code" },
      { l: "Model scope", v: "Claude · GPT · DeepSeek · Qwen" },
      { l: "Created", v: "2026-05-12" },
      { l: "Last used", v: "2 min ago" },
      { l: "Total requests", v: "48,210" },
      { l: "Total tokens", v: "62.4M" },
    ],
    empty: "Enter an API key above to view its usage.",
  };

  Z.admin = {
    badge: "管理后台",
    nav: { dashboard: "总览", users: "用户", accounts: "账号池", groups: "渠道分组", usage: "用量", redeem: "兑换码", subs: "订阅", settings: "设置" },
    common: { active: "正常", error: "异常", total: "累计", search: "搜索", refresh: "刷新", export: "导出", create: "新建", all: "全部", actual: "实际", standard: "标准", time: "时间范围" },
    dash: {
      title: "总览", sub: "平台实时运行概况",
      cards: [
        { k: "keys", l: "API Keys", v: "3,482", s: "3,210 正常", tone: "blue" },
        { k: "accounts", l: "上游账号", v: "126", s: "118 正常 · 8 异常", tone: "purple" },
        { k: "reqs", l: "今日请求", v: "184,920", s: "累计 42.6M", tone: "green" },
        { k: "users", l: "新增用户", v: "+57", s: "累计 12,840", tone: "emerald" },
        { k: "todayTok", l: "今日 Tokens", v: "1.24B", s: "$1,204 / $1,560 / $2,010", tone: "amber" },
        { k: "totalTok", l: "累计 Tokens", v: "318B", s: "$284K 实际成本", tone: "indigo" },
        { k: "perf", l: "吞吐", v: "2,310", s: "RPM · 4.8M TPM", tone: "violet" },
        { k: "resp", l: "平均响应", v: "820ms", s: "1,043 活跃用户", tone: "rose" },
      ],
      reqTrend: "请求趋势", tokTrend: "Token 用量趋势", modelDist: "模型分布", topUsers: "活跃用户 Top",
      days7: "近 7 日",
    },
    users: {
      title: "用户管理", sub: "管理用户、角色与配额",
      search: "搜索邮箱 / 昵称", role: "角色", status: "状态", group: "分组",
      roles: { all: "全部角色", admin: "管理员", user: "用户" },
      states: { all: "全部状态", active: "正常", disabled: "已禁用" },
      cols: { user: "用户", role: "角色", group: "分组", balance: "余额", usage: "本月用量", status: "状态", joined: "注册时间", act: "操作" },
      add: "添加用户",
    },
    accounts: {
      title: "账号池", sub: "上游订阅账号与渠道",
      cols: { account: "账号", platform: "平台", type: "类型", concurrency: "并发", status: "状态", lastUsed: "最近使用", act: "操作" },
      add: "添加账号", oauth: "OAuth", apikey: "API Key",
    },
    usage: {
      title: "用量统计", sub: "请求、Token 与成本分析",
      modelDist: "模型分布", groupDist: "分组分布", endpointDist: "端点分布", tokTrend: "Token 趋势",
      cols: { time: "时间", user: "用户", model: "模型", tokens: "Tokens", cost: "费用", status: "状态" },
      byTokens: "按 Tokens", byRequests: "按请求", byCost: "按费用",
    },
    redeem: {
      title: "兑换码", sub: "生成与管理充值兑换码",
      create: "生成兑换码", batch: "批量生成",
      cols: { code: "兑换码", value: "面额", type: "类型", state: "状态", usedBy: "使用者", created: "创建时间", act: "操作" },
      states: { unused: "未使用", used: "已使用", expired: "已过期" },
      types: { balance: "余额", daily: "日卡" },
    },
  };
  E.admin = {
    badge: "Admin",
    nav: { dashboard: "Dashboard", users: "Users", accounts: "Accounts", groups: "Channels", usage: "Usage", redeem: "Redeem", subs: "Subscriptions", settings: "Settings" },
    common: { active: "Active", error: "Error", total: "Total", search: "Search", refresh: "Refresh", export: "Export", create: "New", all: "All", actual: "actual", standard: "standard", time: "Time range" },
    dash: {
      title: "Dashboard", sub: "Real-time platform overview",
      cards: [
        { k: "keys", l: "API Keys", v: "3,482", s: "3,210 active", tone: "blue" },
        { k: "accounts", l: "Upstream accounts", v: "126", s: "118 active · 8 error", tone: "purple" },
        { k: "reqs", l: "Requests today", v: "184,920", s: "42.6M total", tone: "green" },
        { k: "users", l: "New users", v: "+57", s: "12,840 total", tone: "emerald" },
        { k: "todayTok", l: "Tokens today", v: "1.24B", s: "$1,204 / $1,560 / $2,010", tone: "amber" },
        { k: "totalTok", l: "Total tokens", v: "318B", s: "$284K actual cost", tone: "indigo" },
        { k: "perf", l: "Throughput", v: "2,310", s: "RPM · 4.8M TPM", tone: "violet" },
        { k: "resp", l: "Avg response", v: "820ms", s: "1,043 active users", tone: "rose" },
      ],
      reqTrend: "Requests trend", tokTrend: "Token usage trend", modelDist: "Model distribution", topUsers: "Top active users",
      days7: "Last 7 days",
    },
    users: {
      title: "Users", sub: "Manage users, roles and quotas",
      search: "Search email / name", role: "Role", status: "Status", group: "Group",
      roles: { all: "All roles", admin: "Admin", user: "User" },
      states: { all: "All status", active: "Active", disabled: "Disabled" },
      cols: { user: "User", role: "Role", group: "Group", balance: "Balance", usage: "Usage (mo)", status: "Status", joined: "Joined", act: "Actions" },
      add: "Add user",
    },
    accounts: {
      title: "Accounts", sub: "Upstream subscription accounts & channels",
      cols: { account: "Account", platform: "Platform", type: "Type", concurrency: "Concurrency", status: "Status", lastUsed: "Last used", act: "Actions" },
      add: "Add account", oauth: "OAuth", apikey: "API Key",
    },
    usage: {
      title: "Usage", sub: "Requests, tokens & cost analytics",
      modelDist: "Model distribution", groupDist: "Group distribution", endpointDist: "Endpoint distribution", tokTrend: "Token trend",
      cols: { time: "Time", user: "User", model: "Model", tokens: "Tokens", cost: "Cost", status: "Status" },
      byTokens: "By tokens", byRequests: "By requests", byCost: "By cost",
    },
    redeem: {
      title: "Redeem codes", sub: "Generate & manage top-up codes",
      create: "Generate", batch: "Batch",
      cols: { code: "Code", value: "Value", type: "Type", state: "Status", usedBy: "Used by", created: "Created", act: "Actions" },
      states: { unused: "Unused", used: "Used", expired: "Expired" },
      types: { balance: "Balance", daily: "Daily" },
    },
  };
})();
