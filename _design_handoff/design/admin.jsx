// admin.jsx — admin console: shell + dashboard + users + accounts + usage + redeem
const CARD_ICON = { keys: Ic.Key, accounts: Ic.Layers, reqs: Ic.Pulse, users: Ic.Plus,
  todayTok: Ic.Bolt, totalTok: Ic.Coins, perf: Ic.Bolt, resp: Ic.Pulse };

function AdminShell({ t, lang, setLang, navigate, view, setView, children, title, sub, action }) {
  const a = t.admin;
  const items = ["dashboard", "users", "accounts", "groups", "usage", "redeem", "subs", "settings"];
  const icons = { dashboard: Ic.Grid, users: Ic.Plus, accounts: Ic.Layers, groups: Ic.Shield,
    usage: Ic.Chart, redeem: Ic.Tag, subs: Ic.Wallet, settings: Ic.Gear };
  return (
    <div className="admin">
      <aside className="admin-side">
        <div style={{ padding: "8px 8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo onClick={() => navigate("landing")} />
        </div>
        <div style={{ padding: "0 8px 12px" }}><span className="admin-badge">{a.badge}</span></div>
        {items.map((k) => {
          const Icon = icons[k];
          return (
            <div key={k} className={"side-nav-item " + (view === k ? "on" : "")} onClick={() => setView(k)}>
              <Icon className="ic" size={18} /> {a.nav[k]}
            </div>
          );
        })}
        <div className="side-foot">
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
            <div className="avatar">A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Admin</div>
              <div className="small" style={{ fontSize: 11.5 }}>admin@llmrelay.ai</div>
            </div>
            <span className="side-logout" onClick={() => navigate("landing")} title="exit"><Ic.Logout size={16} /></span>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div>
            <div style={{ fontSize: 17, fontWeight: 640, letterSpacing: "-0.01em" }}>{title}</div>
            {sub && <div className="small" style={{ fontSize: 12.5 }}>{sub}</div>}
          </div>
          <div style={{ flex: 1 }}></div>
          <span className="nav-link" onClick={() => navigate("dashboard")}>{lang === "zh" ? "用户端" : "User app"}</span>
          <LangToggle lang={lang} setLang={setLang} />
          {action}
        </div>
        <div className="admin-body">{children}</div>
      </div>
    </div>
  );
}

function Donut({ items }) {
  let acc = 0; const stops = [];
  items.forEach((it) => { const start = acc; acc += it.v; stops.push(`${it.c} ${start}% ${acc}%`); });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
      <div style={{ width: 150, height: 150, borderRadius: "50%", flex: "none",
        background: `conic-gradient(${stops.join(",")})`, position: "relative" }}>
        <div style={{ position: "absolute", inset: 28, borderRadius: "50%", background: "#fff" }}></div>
      </div>
      <div className="donut-legend">
        {items.map((it, i) => (
          <div className="li" key={i}>
            <span className="sw" style={{ background: it.c }}></span>
            <span style={{ flex: 1, fontWeight: 500 }}>{it.label}</span>
            <span className="mono" style={{ color: "var(--ink-3)" }}>{it.v}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminDashboard({ t }) {
  const d = t.admin.dash;
  const bars = [54, 68, 49, 82, 95, 73, 100, 64, 88, 76, 92, 70, 84, 99];
  const dist = [
    { label: "Claude", v: 44, c: MODEL_META.Claude.c }, { label: "GPT", v: 28, c: MODEL_META.GPT.c },
    { label: "DeepSeek", v: 18, c: MODEL_META.DeepSeek.c }, { label: "Qwen", v: 10, c: MODEL_META.Qwen.c },
  ];
  const top = [
    { n: "wei@llmrelay.ai", t: "12.4M", p: 100 }, { n: "lin@studio.dev", t: "8.9M", p: 72 },
    { n: "zhao@acme.co", t: "6.1M", p: 49 }, { n: "chen@lab.ai", t: "4.7M", p: 38 }, { n: "k@indie.app", t: "3.2M", p: 26 },
  ];
  return (
    <div className="fade-up">
      <div className="grid g4" style={{ gap: 14, marginBottom: 22 }}>
        {d.cards.map((c) => {
          const Icon = CARD_ICON[c.k] || Ic.Grid;
          return (
            <div className="admin-stat" key={c.k}>
              <div className="row">
                <div className={"ico tone-" + c.tone}><Icon size={19} /></div>
                <div style={{ minWidth: 0 }}>
                  <div className="l">{c.l}</div>
                  <div className="v">{c.v}</div>
                  <div className="s">{c.s}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">{d.reqTrend}</span><span className="small">{d.days7}</span></div>
          <div style={{ padding: 22 }}><div className="mbars">{bars.map((b, i) => <div className="b" key={i} style={{ height: b + "%" }}></div>)}</div></div>
        </div>
        <div className="panel">
          <div className="panel-head"><span className="panel-title">{d.modelDist}</span></div>
          <div style={{ padding: "26px 22px" }}><Donut items={dist} /></div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head"><span className="panel-title">{d.topUsers}</span></div>
        <div style={{ padding: "10px 22px 18px" }}>
          {top.map((u, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0", borderBottom: i < top.length - 1 ? "1px solid var(--line-2)" : "none" }}>
              <span className="mono small" style={{ width: 18, color: "var(--ink-4)" }}>{i + 1}</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 14 }}>{u.n}</span>
              <div style={{ flex: 1.5, maxWidth: 280 }}><div className="meter"><span style={{ width: u.p + "%" }}></span></div></div>
              <span className="mono" style={{ fontSize: 13, color: "var(--ink-2)", width: 64, textAlign: "right" }}>{u.t}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminUsers({ t }) {
  const u = t.admin.users;
  const rows = [
    { e: "wei@llmrelay.ai", role: "admin", g: "core", bal: "¥1,280", use: "12.4M", st: "active", j: "2025-11-02", c: "#0071e3" },
    { e: "lin@studio.dev", role: "user", g: "pro", bal: "¥328", use: "8.9M", st: "active", j: "2026-01-18", c: "#7c3aed" },
    { e: "zhao@acme.co", role: "user", g: "team", bal: "¥912", use: "6.1M", st: "active", j: "2026-02-09", c: "#16a34a" },
    { e: "chen@lab.ai", role: "user", g: "pro", bal: "¥44", use: "4.7M", st: "disabled", j: "2026-03-22", c: "#d97706" },
    { e: "k@indie.app", role: "user", g: "free", bal: "¥0", use: "3.2M", st: "active", j: "2026-04-30", c: "#e11d48" },
    { e: "sara@design.io", role: "user", g: "free", bal: "¥156", use: "1.1M", st: "active", j: "2026-05-14", c: "#0891b2" },
  ];
  return (
    <div className="fade-up">
      <div className="toolbar">
        <div className="search-box"><span className="si"><Ic.Grid size={15} /></span><input placeholder={u.search} /></div>
        <select className="sel"><option>{u.roles.all}</option><option>{u.roles.admin}</option><option>{u.roles.user}</option></select>
        <select className="sel"><option>{u.states.all}</option><option>{u.states.active}</option><option>{u.states.disabled}</option></select>
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-primary btn-sm"><Ic.Plus size={15} /> {u.add}</button>
      </div>
      <div className="panel" style={{ overflow: "hidden" }}>
        <table className="atable">
          <thead><tr>
            <th>{u.cols.user}</th><th>{u.cols.role}</th><th>{u.cols.group}</th><th>{u.cols.balance}</th>
            <th>{u.cols.usage}</th><th>{u.cols.status}</th><th>{u.cols.joined}</th><th>{u.cols.act}</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <span className="u-avatar" style={{ background: r.c }}>{r.e[0].toUpperCase()}</span>
                  <span style={{ fontWeight: 500 }}>{r.e}</span></div></td>
                <td><span className={"role-tag " + (r.role === "admin" ? "role-admin" : "role-user")}>{u.roles[r.role]}</span></td>
                <td className="small" style={{ color: "var(--ink-2)" }}>{r.g}</td>
                <td className="mono" style={{ fontWeight: 550 }}>{r.bal}</td>
                <td className="mono" style={{ color: "var(--ink-2)" }}>{r.use}</td>
                <td><span className="dot-tag"><span className={"d " + (r.st === "active" ? "d-green" : "d-gray")}></span>{u.states[r.st]}</span></td>
                <td className="small">{r.j}</td>
                <td><button className="btn-ico" style={{ marginLeft: "auto" }}><Ic.Gear size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminAccounts({ t }) {
  const a = t.admin.accounts;
  const rows = [
    { n: "claude-team-01", k: "Claude", type: "oauth", cc: "8", st: "active", lu: "刚刚" },
    { n: "openai-pool-02", k: "GPT", type: "apikey", cc: "12", st: "active", lu: "1m" },
    { n: "deepseek-main", k: "DeepSeek", type: "apikey", cc: "20", st: "active", lu: "3m" },
    { n: "qwen-dash-01", k: "Qwen", type: "apikey", cc: "16", st: "active", lu: "8m" },
    { n: "claude-team-02", k: "Claude", type: "oauth", cc: "8", st: "error", lu: "2h" },
    { n: "openai-pool-03", k: "GPT", type: "apikey", cc: "12", st: "active", lu: "12m" },
  ];
  return (
    <div className="fade-up">
      <div className="toolbar">
        <div className="search-box"><span className="si"><Ic.Grid size={15} /></span><input placeholder={t.admin.common.search} /></div>
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-primary btn-sm"><Ic.Plus size={15} /> {a.add}</button>
      </div>
      <div className="panel" style={{ overflow: "hidden" }}>
        <table className="atable">
          <thead><tr>
            <th>{a.cols.account}</th><th>{a.cols.platform}</th><th>{a.cols.type}</th>
            <th>{a.cols.concurrency}</th><th>{a.cols.status}</th><th>{a.cols.lastUsed}</th><th>{a.cols.act}</th>
          </tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 550 }}>{r.n}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><ModelBadge k={r.k} size={24} /><span style={{ fontWeight: 500 }}>{r.k}</span></div></td>
                <td><span className="role-tag role-user">{r.type === "oauth" ? a.oauth : a.apikey}</span></td>
                <td className="mono">{r.cc}</td>
                <td><span className="dot-tag"><span className={"d " + (r.st === "active" ? "d-green" : "d-red")}></span>{t.admin.common[r.st]}</span></td>
                <td className="small">{r.lu}</td>
                <td><button className="btn-ico" style={{ marginLeft: "auto" }}><Ic.Gear size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminUsage({ t }) {
  const us = t.admin.usage;
  const dist = [
    { label: "Claude", v: 44, c: MODEL_META.Claude.c }, { label: "GPT", v: 28, c: MODEL_META.GPT.c },
    { label: "DeepSeek", v: 18, c: MODEL_META.DeepSeek.c }, { label: "Qwen", v: 10, c: MODEL_META.Qwen.c },
  ];
  const bars = [40, 62, 55, 78, 90, 70, 96, 60, 84, 72];
  const logs = [
    { tm: "14:32:10", u: "wei@llmrelay.ai", m: 0, tok: "18,420", c: "¥0.42" },
    { tm: "14:31:55", u: "lin@studio.dev", m: 1, tok: "9,210", c: "¥0.19" },
    { tm: "14:31:40", u: "zhao@acme.co", m: 2, tok: "31,880", c: "¥0.11" },
    { tm: "14:31:22", u: "k@indie.app", m: 3, tok: "7,330", c: "¥0.06" },
    { tm: "14:30:58", u: "chen@lab.ai", m: 0, tok: "12,640", c: "¥0.29" },
    { tm: "14:30:31", u: "sara@design.io", m: 1, tok: "5,120", c: "¥0.11" },
  ];
  const mk = ["Claude", "GPT", "DeepSeek", "Qwen"];
  return (
    <div className="fade-up">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="panel"><div className="panel-head"><span className="panel-title">{us.modelDist}</span></div>
          <div style={{ padding: "26px 22px" }}><Donut items={dist} /></div></div>
        <div className="panel"><div className="panel-head"><span className="panel-title">{us.tokTrend}</span><span className="small">{t.admin.dash.days7}</span></div>
          <div style={{ padding: 22 }}><div className="mbars" style={{ height: 150 }}>{bars.map((b, i) => <div className="b" key={i} style={{ height: b + "%" }}></div>)}</div></div></div>
      </div>
      <div className="panel" style={{ overflow: "hidden" }}>
        <div className="panel-head"><span className="panel-title">{us.title}</span>
          <button className="btn btn-ghost btn-sm"><Ic.ArrowR size={14} /> {t.admin.common.export}</button></div>
        <table className="atable">
          <thead><tr><th>{us.cols.time}</th><th>{us.cols.user}</th><th>{us.cols.model}</th><th>{us.cols.tokens}</th><th>{us.cols.cost}</th><th>{us.cols.status}</th></tr></thead>
          <tbody>
            {logs.map((r, i) => (
              <tr key={i}>
                <td className="mono small" style={{ color: "var(--ink-2)" }}>{r.tm}</td>
                <td style={{ fontWeight: 500 }}>{r.u}</td>
                <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}><ModelBadge k={mk[r.m]} size={22} /><span style={{ fontSize: 13 }}>{t.dash.models[r.m]}</span></div></td>
                <td className="mono">{r.tok}</td>
                <td className="mono">{r.c}</td>
                <td><span className="dot-tag"><span className="d d-green"></span>200</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminRedeem({ t }) {
  const r = t.admin.redeem;
  const rows = [
    { code: "RELAY-7QX2-A91F-K3M0", v: "¥100", ty: "balance", st: "used", by: "lin@studio.dev", cr: "2026-05-10" },
    { code: "RELAY-LM0P-9KDR-X2VC", v: "¥50", ty: "balance", st: "unused", by: "—", cr: "2026-05-12" },
    { code: "RELAY-ZT8W-VC2N-EE7B", v: "日卡", ty: "daily", st: "unused", by: "—", cr: "2026-05-12" },
    { code: "RELAY-HN4J-EE7B-7QX2", v: "¥300", ty: "balance", st: "used", by: "zhao@acme.co", cr: "2026-05-08" },
    { code: "RELAY-3M0K-A91F-LM0P", v: "¥50", ty: "balance", st: "expired", by: "—", cr: "2026-04-01" },
  ];
  const sc = { used: "d-gray", unused: "d-green", expired: "d-amber" };
  return (
    <div className="fade-up">
      <div className="toolbar">
        <div className="search-box"><span className="si"><Ic.Tag size={15} /></span><input placeholder={t.admin.common.search} /></div>
        <div style={{ flex: 1 }}></div>
        <button className="btn btn-ghost btn-sm">{r.batch}</button>
        <button className="btn btn-primary btn-sm"><Ic.Plus size={15} /> {r.create}</button>
      </div>
      <div className="panel" style={{ overflow: "hidden" }}>
        <table className="atable">
          <thead><tr><th>{r.cols.code}</th><th>{r.cols.value}</th><th>{r.cols.type}</th><th>{r.cols.state}</th><th>{r.cols.usedBy}</th><th>{r.cols.created}</th><th>{r.cols.act}</th></tr></thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                <td className="mono" style={{ fontWeight: 550 }}>{row.code}</td>
                <td className="mono">{row.v}</td>
                <td><span className="role-tag role-user">{r.types[row.ty]}</span></td>
                <td><span className="dot-tag"><span className={"d " + sc[row.st]}></span>{r.states[row.st]}</span></td>
                <td className="small" style={{ color: "var(--ink-2)" }}>{row.by}</td>
                <td className="small">{row.cr}</td>
                <td><button className="btn-ico" style={{ marginLeft: "auto" }}><Ic.Copy size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Admin({ t, lang, setLang, navigate }) {
  const [view, setView] = React.useState("dashboard");
  const a = t.admin;
  const map = {
    dashboard: { c: <AdminDashboard t={t} />, ttl: a.dash.title, sub: a.dash.sub },
    users: { c: <AdminUsers t={t} />, ttl: a.users.title, sub: a.users.sub },
    accounts: { c: <AdminAccounts t={t} />, ttl: a.accounts.title, sub: a.accounts.sub },
    groups: { c: <AdminAccounts t={t} />, ttl: a.nav.groups, sub: a.accounts.sub },
    usage: { c: <AdminUsage t={t} />, ttl: a.usage.title, sub: a.usage.sub },
    redeem: { c: <AdminRedeem t={t} />, ttl: a.redeem.title, sub: a.redeem.sub },
    subs: { c: <AdminUsers t={t} />, ttl: a.nav.subs, sub: a.users.sub },
    settings: { c: <AdminRedeem t={t} />, ttl: a.nav.settings, sub: "" },
  };
  const cur = map[view];
  return (
    <AdminShell t={t} lang={lang} setLang={setLang} navigate={navigate} view={view} setView={setView}
      title={cur.ttl} sub={cur.sub}>
      {cur.c}
    </AdminShell>
  );
}

Object.assign(window, { Admin });
