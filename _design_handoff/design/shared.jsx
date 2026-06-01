// shared.jsx — Logo, Nav, Footer, language toggle
function Logo({ onClick }) {
  return (
    <div className="logo" onClick={onClick}>
      <span className="logo-mark" aria-hidden="true"></span>
      <span className="logo-word"><b>LLM</b><span className="r">RELAY</span></span>
    </div>
  );
}

function LangToggle({ lang, setLang }) {
  return (
    <div className="lang" role="group" aria-label="language">
      <button className={lang === "zh" ? "on" : ""} onClick={() => setLang("zh")}>中</button>
      <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
    </div>
  );
}

function Nav({ t, lang, setLang, navigate, route }) {
  const links = [
    { k: "product", to: "landing" }, { k: "models", to: "landing" },
    { k: "pricing", to: "landing" }, { k: "docs", to: "landing" },
  ];
  return (
    <nav className="nav">
      <div className="nav-inner">
        <Logo onClick={() => navigate("landing")} />
        <div className="nav-links">
          {links.map((l) => (
            <span key={l.k} className="nav-link" onClick={() => navigate(l.to)}>{t.nav[l.k]}</span>
          ))}
        </div>
        <div className="nav-spacer"></div>
        <div className="nav-right">
          <LangToggle lang={lang} setLang={setLang} />
          <span className="nav-link" onClick={() => navigate("keyusage")}>{t.ku.nav}</span>
          <span className="nav-link" onClick={() => navigate("auth")}>{t.nav.login}</span>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("auth")}>{t.nav.signup}</button>
        </div>
      </div>
    </nav>
  );
}

function Footer({ t, navigate }) {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="foot-cols">
          <div className="foot-col">
            <Logo onClick={() => navigate("landing")} />
            <p className="small" style={{ marginTop: 14, maxWidth: 260, lineHeight: 1.5 }}>{t.footer.tagline}</p>
          </div>
          {t.footer.cols.map((c, i) => (
            <div className="foot-col" key={i}>
              <h5>{c.h}</h5>
              {c.links.map((l, j) => <a key={j} onClick={(e)=>e.preventDefault()} href="#">{l}</a>)}
            </div>
          ))}
        </div>
        <div className="small" style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid var(--line-2)" }}>
          {t.footer.copy}
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Logo, LangToggle, Nav, Footer });
