// keyusage.jsx — public "check your API key usage" page (ring visualization)
function Ring({ pct, isBal, amt, sub, title, reset, resetLabel, usedLabel, icon, delay }) {
  const R = 64, C = 2 * Math.PI * R;
  const [shown, setShown] = React.useState(0);
  React.useEffect(() => { const id = setTimeout(() => setShown(pct || 0), 120 + delay); return () => clearTimeout(id); }, [pct, delay]);
  const off = C - (shown / 100) * C;
  const IconC = icon === "calendar" ? Ic.Chart : icon === "clock" ? Ic.Pulse : Ic.Wallet;
  return (
    <div className="ring-card fade-up" style={{ animationDelay: delay + "ms" }}>
      <div className="ring-head">
        <span className="ring-title">{title}</span>
        <span className="ring-ic"><IconC size={17} /></span>
      </div>
      <div className="ring-wrap">
        <svg width="156" height="156" viewBox="0 0 156 156">
          <circle cx="78" cy="78" r={R} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth="11" />
          <circle cx="78" cy="78" r={R} fill="none" stroke="var(--accent)" strokeWidth="11" strokeLinecap="round"
            strokeDasharray={C.toFixed(1)} strokeDashoffset={off.toFixed(1)}
            transform="rotate(-90 78 78)" style={{ transition: "stroke-dashoffset 1s cubic-bezier(.22,.61,.36,1)" }} />
        </svg>
        <div className="ring-center">
          {isBal ? (
            <React.Fragment>
              <span className="ring-bal" style={{ color: "var(--accent-ink)" }}>{amt}</span>
              <span className="ring-sub">{sub}</span>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <span className="ring-pct">{shown}%</span>
              <span className="ring-sub">{usedLabel}</span>
              <span className="ring-amt">{amt}</span>
              {reset && <span className="ring-reset">⟳ {resetLabel} {reset}</span>}
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

function KeyUsage({ t, lang, setLang, navigate }) {
  const ku = t.ku;
  const [val, setVal] = React.useState("sk-relay-7Qx2a91F•••••••");
  const [range, setRange] = React.useState("7d");
  const [shown, setShown] = React.useState(true);
  return (
    <div className="ku-page">
      <div className="auth-topbar">
        <div className="wrap" style={{ display: "flex", alignItems: "center", height: 56 }}>
          <Logo onClick={() => navigate("landing")} />
          <div style={{ flex: 1 }}></div>
          <span className="nav-link" onClick={() => navigate("landing")}>{lang === "zh" ? "首页" : "Home"}</span>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>

      <main className="wrap" style={{ maxWidth: 880, paddingTop: 56, paddingBottom: 80 }}>
        <div className="center" style={{ marginBottom: 36 }}>
          <span className="eyebrow"><span className="dot"></span>LLMRELAY</span>
          <h1 className="h2" style={{ marginTop: 12 }}>{ku.title}</h1>
          <p className="lead" style={{ marginTop: 12, maxWidth: 520, margin: "12px auto 0" }}>{ku.subtitle}</p>
        </div>

        <div style={{ maxWidth: 560, margin: "0 auto 18px" }}>
          <div className="ku-input-row">
            <div className="ku-input-wrap">
              <span className="ku-lock"><Ic.Key size={18} /></span>
              <input className="input" style={{ paddingLeft: 44, height: 52 }} value={val}
                onChange={(e) => setVal(e.target.value)} placeholder={ku.placeholder} />
            </div>
            <button className="btn btn-primary" style={{ height: 52, padding: "0 26px" }} onClick={() => setShown(true)}>{ku.query}</button>
          </div>
          <p className="small center" style={{ marginTop: 12 }}>{ku.privacy}</p>
          <div className="ku-range">
            <span className="small">{ku.rangeLabel}</span>
            {ku.ranges.map((r) => (
              <button key={r.k} className={"ku-chip " + (range === r.k ? "on" : "")} onClick={() => setRange(r.k)}>{r.l}</button>
            ))}
          </div>
        </div>

        {shown && (
          <div className="fade-up">
            <div className="center" style={{ marginBottom: 18 }}>
              <span className="status-pill"><span className="pulse-dot"></span>{ku.statusActive}<span className="sep">|</span><span className="small">{ku.statusText}</span></span>
            </div>
            <div className="ring-grid">
              {ku.rings.map((r, i) => (
                <Ring key={i} {...r} title={r.t} usedLabel={ku.used} resetLabel={ku.reset} delay={i * 120} />
              ))}
            </div>
            <div className="card" style={{ marginTop: 22, overflow: "hidden" }}>
              <div style={{ padding: "18px 26px", borderBottom: "1px solid var(--line-2)" }}>
                <span className="ring-title">{ku.detailTitle}</span>
              </div>
              <div className="ku-detail">
                {ku.rows.map((row, i) => (
                  <div className="ku-detail-row" key={i}>
                    <span className="body" style={{ fontSize: 14.5 }}>{row.l}</span>
                    <span className="mono" style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500 }}>{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

Object.assign(window, { KeyUsage, Ring });
