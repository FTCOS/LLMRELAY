// dashboard.jsx — user dashboard (overview / keys / usage / billing / settings)
function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="stat-card">
      <div className="stat-label"><Icon size={15} /> {label}</div>
      <div className="stat-value" style={accent ? { color: "var(--accent-ink)" } : null}>{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}

function QuotaCard({ t }) {
  const data = [
    { k: "Claude", used: 2.1, lim: 5 }, { k: "GPT", used: 1.4, lim: 4 },
    { k: "DeepSeek", used: 0.8, lim: 3 }, { k: "Qwen", used: 0.4, lim: 2 },
  ];
  return (
    <div className="card card-pad">
      <div className="card-head">
        <div><div className="h3" style={{ fontSize: 18 }}>{t.dash.quotaTitle}</div>
          <div className="small" style={{ marginTop: 2 }}>{t.dash.quotaSub}</div></div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18, marginTop: 20 }}>
        {data.map((d) => {
          const pct = Math.round((d.used / d.lim) * 100);
          return (
            <div key={d.k}>
              <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 8 }}>
                <ModelBadge k={d.k} size={26} />
                <span style={{ fontWeight: 550, fontSize: 14.5, flex: 1 }}>{d.k}</span>
                <span className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{d.used}M / {d.lim}M</span>
              </div>
              <div className="meter"><span style={{ width: pct + "%" }}></span></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UsageChart({ t }) {
  const bars = [42, 58, 35, 70, 88, 64, 96];
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  return (
    <div className="card card-pad">
      <div className="h3" style={{ fontSize: 18 }}>{t.dash.usageTitle}</div>
      <div className="small" style={{ marginTop: 2 }}>{t.dash.usageUnit}</div>
      <div className="bars" style={{ marginTop: 18 }}>
        {bars.map((b, i) => (
          <div className="bar" key={i} style={{ height: b + "%" }} title={days[i]}><i></i></div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
        {days.map((d) => <span key={d} className="small" style={{ fontSize: 11, flex: 1, textAlign: "center" }}>{d}</span>)}
      </div>
    </div>
  );
}

const KEYS = [
  { name: "Claude Code", key: "sk-relay-7Qx2…a91F", scope: "Claude", created: "2026-05-12" },
  { name: "Cursor", key: "sk-relay-Lm0p…9KdR", scope: "All models", created: "2026-05-03" },
  { name: "production-api", key: "sk-relay-Zt8w…Vc2N", scope: "GPT · DeepSeek", created: "2026-04-21" },
  { name: "qwen-batch", key: "sk-relay-Hn4j…Ee7B", scope: "Qwen", created: "2026-04-08" },
];

function CopyBtn({ t }) {
  const [done, setDone] = React.useState(false);
  return (
    <button className="btn btn-ghost btn-sm" style={{ padding: "6px 12px", fontSize: 13 }}
      onClick={() => { setDone(true); setTimeout(() => setDone(false), 1400); }}>
      {done ? <Ic.Check size={14} /> : <Ic.Copy size={14} />} {done ? t.dash.copied : t.dash.copy}
    </button>
  );
}

function KeysTable({ t, compact }) {
  return (
    <div className="card" style={{ padding: "10px 14px 14px" }}>
      <table className="table">
        <thead><tr>
          <th>{t.dash.table.name}</th><th>{t.dash.table.key}</th>
          {!compact && <th>{t.dash.table.model}</th>}
          {!compact && <th>{t.dash.table.created}</th>}
          <th>{t.dash.table.status}</th><th></th>
        </tr></thead>
        <tbody>
          {KEYS.map((k, i) => (
            <tr key={i}>
              <td style={{ fontWeight: 550 }}>{k.name}</td>
              <td className="keyrow">{k.key}</td>
              {!compact && <td className="small">{k.scope}</td>}
              {!compact && <td className="small">{k.created}</td>}
              <td><span className="tag tag-green">● {t.dash.active}</span></td>
              <td style={{ textAlign: "right" }}><CopyBtn t={t} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentTable({ t }) {
  const rows = [
    { time: "14:32", model: 0, tok: "18,420", cost: "¥0.42" },
    { time: "14:28", model: 1, tok: "9,210", cost: "¥0.19" },
    { time: "14:15", model: 2, tok: "31,880", cost: "¥0.11" },
    { time: "13:58", model: 0, tok: "12,640", cost: "¥0.29" },
    { time: "13:40", model: 3, tok: "7,330", cost: "¥0.06" },
  ];
  const mk = ["Claude","GPT","DeepSeek","Qwen"];
  return (
    <div className="card" style={{ padding: "10px 14px 14px" }}>
      <table className="table">
        <thead><tr>
          <th>{t.dash.table.time}</th><th>{t.dash.table.model}</th>
          <th>{t.dash.table.tokens}</th><th>{t.dash.table.cost}</th><th>{t.dash.table.status}</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="mono small" style={{ color: "var(--ink-2)" }}>{r.time}</td>
              <td><div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <ModelBadge k={mk[r.model]} size={22} /><span style={{ fontWeight: 500, fontSize: 13.5 }}>{t.dash.models[r.model]}</span></div></td>
              <td className="mono" style={{ fontSize: 13 }}>{r.tok}</td>
              <td className="mono" style={{ fontSize: 13 }}>{r.cost}</td>
              <td><span className="tag tag-green">● 200</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Overview({ t }) {
  return (
    <div className="fade-up">
      <div className="grid g4" style={{ marginBottom: 22 }}>
        <StatCard icon={Ic.Wallet} label={t.dash.stats.balance.l} value="¥328.50" sub={t.dash.stats.balance.sub} accent />
        <StatCard icon={Ic.Coins} label={t.dash.stats.today.l} value="¥12.40" sub={t.dash.stats.today.sub} />
        <StatCard icon={Ic.Pulse} label={t.dash.stats.reqs.l} value="1,284" sub={t.dash.stats.reqs.sub} />
        <StatCard icon={Ic.Key} label={t.dash.stats.keys.l} value="4" sub={t.dash.stats.keys.sub} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 22 }}>
        <QuotaCard t={t} />
        <UsageChart t={t} />
      </div>
      <div className="sec-head"><div className="h3" style={{ fontSize: 18 }}>{t.dash.recentTitle}</div></div>
      <RecentTable t={t} />
    </div>
  );
}

function KeysView({ t }) {
  return (
    <div className="fade-up">
      <div className="sec-head">
        <div><div className="h3" style={{ fontSize: 18 }}>{t.dash.keysTitle}</div>
          <div className="small" style={{ marginTop: 2 }}>{t.dash.keysSub}</div></div>
        <button className="btn btn-primary btn-sm"><Ic.Plus size={15} /> {t.dash.newKey}</button>
      </div>
      <KeysTable t={t} />
    </div>
  );
}

function BillingView({ t }) {
  const amts = ["¥50", "¥100", "¥300", "¥500"];
  return (
    <div className="fade-up">
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginBottom: 22 }}>
        <div className="card card-pad">
          <div className="stat-label"><Ic.Wallet size={15} /> {t.dash.stats.balance.l}</div>
          <div className="stat-value" style={{ color: "var(--accent-ink)", fontSize: 40, marginTop: 6 }}>¥328.50</div>
          <div className="stat-sub">{t.dash.stats.balance.sub}</div>
          <div style={{ marginTop: 22 }}>
            <div className="small" style={{ marginBottom: 10, fontWeight: 550, color: "var(--ink-2)" }}>{t.dash.topup}</div>
            <div className="grid g4" style={{ gap: 10 }}>
              {amts.map((a, i) => (
                <button key={a} className={"btn " + (i === 2 ? "btn-primary" : "btn-outline")} style={{ padding: "12px 0" }}>{a}</button>
              ))}
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: 14 }}>{t.dash.topup}</button>
          </div>
        </div>
        <UsageChart t={t} />
      </div>
      <div className="sec-head"><div className="h3" style={{ fontSize: 18 }}>{t.dash.recentTitle}</div></div>
      <RecentTable t={t} />
    </div>
  );
}

function Dashboard({ t, lang, setLang, navigate }) {
  const [view, setView] = React.useState("overview");
  const nav = [
    { k: "overview", icon: Ic.Grid }, { k: "keys", icon: Ic.Key },
    { k: "usage", icon: Ic.Chart }, { k: "billing", icon: Ic.Wallet }, { k: "settings", icon: Ic.Gear },
  ];
  const titles = {
    overview: { h: t.dash.greet, s: t.dash.greetSub },
    keys: { h: t.dash.nav.keys, s: t.dash.keysSub },
    usage: { h: t.dash.nav.usage, s: t.dash.usageUnit },
    billing: { h: t.dash.nav.billing, s: t.dash.stats.balance.sub },
    settings: { h: t.dash.nav.settings, s: "" },
  };
  return (
    <div className="dash">
      <aside className="side">
        <div className="side-top"><Logo onClick={() => navigate("landing")} /></div>
        {nav.map((n) => {
          const Icon = n.icon;
          return (
            <div key={n.k} className={"side-nav-item " + (view === n.k ? "on" : "")} onClick={() => setView(n.k)}>
              <Icon className="ic" size={18} /> {t.dash.nav[n.k]}
            </div>
          );
        })}
        <div className="side-foot">
          <div className="side-nav-item" onClick={() => navigate("admin")} style={{ marginBottom: 4 }}>
            <Ic.Shield className="ic" size={18} /> {lang === "zh" ? "管理后台" : "Admin"}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 4px" }}>
            <div className="avatar">W</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Wei Shaw</div>
              <div className="small" style={{ fontSize: 11.5 }}>wei@llmrelay.ai</div>
            </div>
            <span className="side-logout" onClick={() => navigate("landing")} title="logout"><Ic.Logout size={16} /></span>
          </div>
          <div style={{ marginTop: 8, paddingTop: 8 }}><LangToggle lang={lang} setLang={setLang} /></div>
        </div>
      </aside>

      <main className="dash-main">
        <div className="dash-head">
          <div>
            <h1 className="h2" style={{ fontSize: 30 }}>{titles[view].h}</h1>
            {titles[view].s && <p className="body" style={{ fontSize: 15, marginTop: 4 }}>{titles[view].s}</p>}
          </div>
          <button className="btn btn-primary"><Ic.Plus size={16} /> {t.dash.topup}</button>
        </div>

        {view === "overview" && <Overview t={t} />}
        {view === "keys" && <KeysView t={t} />}
        {view === "usage" && <BillingView t={t} />}
        {view === "billing" && <BillingView t={t} />}
        {view === "settings" && <KeysView t={t} />}
      </main>
    </div>
  );
}

Object.assign(window, { Dashboard });
