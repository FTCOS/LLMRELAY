// auth.jsx — login / register
function Auth({ t, lang, setLang, navigate }) {
  const [tab, setTab] = React.useState("login");
  const a = t.auth;
  const isLogin = tab === "login";
  return (
    <div className="auth-page">
      <div className="auth-topbar">
        <div className="wrap" style={{ display: "flex", alignItems: "center", height: 56 }}>
          <Logo onClick={() => navigate("landing")} />
          <div style={{ flex: 1 }}></div>
          <LangToggle lang={lang} setLang={setLang} />
        </div>
      </div>
      <div className="auth-wrap">
        <div className="auth-card fade-up">
          <div className="auth-tabs">
            <button className={isLogin ? "on" : ""} onClick={() => setTab("login")}>{a.loginTab}</button>
            <button className={!isLogin ? "on" : ""} onClick={() => setTab("signup")}>{a.signupTab}</button>
          </div>

          <h2 className="h3" style={{ fontSize: 24 }}>{isLogin ? a.welcome : a.createTitle}</h2>
          <p className="body" style={{ fontSize: 14.5, marginTop: 6, marginBottom: 22 }}>{isLogin ? a.welcomeSub : a.createSub}</p>

          <form onSubmit={(e) => { e.preventDefault(); navigate("dashboard"); }}>
            {!isLogin && (
              <div className="field">
                <label>{a.name}</label>
                <input className="input" placeholder={a.placeholders.name} />
              </div>
            )}
            <div className="field">
              <label>{a.email}</label>
              <input className="input" type="email" placeholder={a.placeholders.email} defaultValue="wei@llmrelay.ai" />
            </div>
            <div className="field">
              <label style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{a.password}</span>
                {isLogin && <a href="#" onClick={(e)=>e.preventDefault()} style={{ fontSize: 13, fontWeight: 400 }}>{a.forgot}</a>}
              </label>
              <input className="input" type="password" placeholder={a.placeholders.pwd} defaultValue="••••••••••" />
            </div>
            {!isLogin && (
              <div className="field">
                <label>{a.confirm}</label>
                <input className="input" type="password" placeholder={a.placeholders.confirm} />
              </div>
            )}
            <button className="btn btn-primary btn-block btn-lg" type="submit" style={{ marginTop: 8 }}>
              {isLogin ? a.loginBtn : a.signupBtn}
            </button>
          </form>

          <div className="divider">{a.or}</div>
          <div className="oauth-row">
            <button className="oauth-btn" onClick={() => navigate("dashboard")}><Ic.Github size={17} /> GitHub</button>
            <button className="oauth-btn" onClick={() => navigate("dashboard")}><Ic.Google size={17} /> Google</button>
          </div>

          {!isLogin && <p className="small center" style={{ marginTop: 20, lineHeight: 1.5 }}>{a.terms}</p>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Auth });
