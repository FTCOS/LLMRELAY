// app.jsx — root: routing, language, direction, tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "direction": "classic",
  "language": "zh",
  "roundness": 18
}/*EDITMODE-END*/;

function DirectionSwitch({ dir, setDir, lang }) {
  const opts = [
    { k: "classic", zh: "经典", en: "Classic" },
    { k: "equity",  zh: "平权", en: "Equity" },
    { k: "mono",    zh: "黑曜", en: "Mono" },
  ];
  return (
    <div className="dir-switch">
      <span className="dir-label">{lang === "zh" ? "方向" : "Direction"}</span>
      <div className="dir-seg">
        {opts.map((o) => (
          <button key={o.k} className={dir === o.k ? "on" : ""} onClick={() => setDir(o.k)}>
            {lang === "zh" ? o.zh : o.en}
          </button>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [tw, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const dir = tw.direction;
  const lang = tw.language;
  const t = window.I18N[lang];

  const [route, setRoute] = React.useState(() => localStorage.getItem("llmrelay_route") || "landing");
  const navigate = React.useCallback((r) => {
    setRoute(r); localStorage.setItem("llmrelay_route", r);
    window.scrollTo({ top: 0 });
  }, []);

  // apply direction + roundness to <html>
  React.useEffect(() => {
    document.documentElement.setAttribute("data-dir", dir);
  }, [dir]);
  React.useEffect(() => {
    const r = tw.roundness;
    document.documentElement.style.setProperty("--radius", r + "px");
    document.documentElement.style.setProperty("--radius-lg", (r + 10) + "px");
    document.documentElement.style.setProperty("--radius-sm", Math.max(6, r - 8) + "px");
  }, [tw.roundness]);

  const setLang = (v) => setTweak("language", v);
  const setDir = (v) => setTweak("direction", v);

  return (
    <React.Fragment>
      {route === "landing" && (
        <React.Fragment>
          <Nav t={t} lang={lang} setLang={setLang} navigate={navigate} route={route} />
          <Landing t={t} dir={dir} navigate={navigate} />
          <Footer t={t} navigate={navigate} />
        </React.Fragment>
      )}
      {route === "auth" && <Auth t={t} lang={lang} setLang={setLang} navigate={navigate} />}
      {route === "keyusage" && <KeyUsage t={t} lang={lang} setLang={setLang} navigate={navigate} />}
      {route === "dashboard" && <Dashboard t={t} lang={lang} setLang={setLang} navigate={navigate} />}
      {route === "admin" && <Admin t={t} lang={lang} setLang={setLang} navigate={navigate} />}

      {route !== "dashboard" && route !== "admin" && <DirectionSwitch dir={dir} setDir={setDir} lang={lang} />}

      <TweaksPanel title={lang === "zh" ? "调整" : "Tweaks"}>
        <TweakSection label={lang === "zh" ? "设计方向" : "Direction"} />
        <TweakRadio label={lang === "zh" ? "方向" : "Style"} value={dir}
          options={["classic", "equity", "mono"]}
          onChange={(v) => setTweak("direction", v)} />
        <TweakSection label={lang === "zh" ? "语言与外观" : "Language & look"} />
        <TweakRadio label={lang === "zh" ? "语言" : "Language"} value={lang}
          options={["zh", "en"]} onChange={(v) => setTweak("language", v)} />
        <TweakSlider label={lang === "zh" ? "圆角" : "Roundness"} value={tw.roundness}
          min={4} max={28} unit="px" onChange={(v) => setTweak("roundness", v)} />
        <TweakSection />
        <TweakButton label={lang === "zh" ? "落地页" : "Landing"} onClick={() => navigate("landing")} />
        <TweakButton label={lang === "zh" ? "登录页" : "Sign in"} onClick={() => navigate("auth")} />
        <TweakButton label={lang === "zh" ? "查询用量" : "Usage lookup"} onClick={() => navigate("keyusage")} />
        <TweakButton label={lang === "zh" ? "用户仪表盘" : "Dashboard"} onClick={() => navigate("dashboard")} />
        <TweakButton label={lang === "zh" ? "管理后台" : "Admin"} onClick={() => navigate("admin")} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
