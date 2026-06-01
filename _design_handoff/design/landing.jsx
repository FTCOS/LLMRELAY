// landing.jsx — LLMRELAY marketing page
function HeroWindow({ t }) {
  const models = ["Claude", "GPT", "DeepSeek", "Qwen"];
  return (
    <div className="hero-window fade-up d3">
      <div className="hw-bar">
        <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
        <span className="hw-url mono">api.llmrelay.ai</span>
      </div>
      <div className="hw-body">
        <div className="hw-term mono">
          <div><span className="c-3">$</span> export <span className="c-k">OPENAI_BASE_URL</span>=<span className="c-s">https://api.llmrelay.ai/v1</span></div>
          <div><span className="c-3">$</span> export <span className="c-k">OPENAI_API_KEY</span>=<span className="c-s">sk-relay-••••••••</span></div>
          <div style={{ marginTop: 8 }}><span className="c-3">$</span> claude <span className="c-d"># 原生工具，直接驱动 · drives native tools</span></div>
          <div className="hw-ok"><span className="ok-dot"></span> connected · 4 models · 1 key</div>
        </div>
        <div className="hw-models">
          {models.map((m) => (
            <div className="hw-model" key={m}>
              <ModelBadge k={m} size={34} />
              <span>{m}</span>
              <span className="hw-on">●</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ t, dir, navigate }) {
  const editorial = dir === "mono";
  return (
    <section className={"hero " + (editorial ? "hero-left" : "")}>
      <div className="wrap">
        <div className={"hero-grid " + (editorial ? "two" : "one")}>
          <div className="hero-copy">
            <span className="eyebrow fade-up"><span className="dot"></span>{t.hero.eyebrow}</span>
            <h1 className="display grad-ink fade-up d1" style={{ marginTop: 18 }}>
              {t.hero.title_1}<br />{t.hero.title_2}
            </h1>
            <p className="lead fade-up d2" style={{ marginTop: 22, maxWidth: editorial ? 460 : 680, marginLeft: editorial ? 0 : "auto", marginRight: editorial ? 0 : "auto" }}>
              {t.hero.sub}
            </p>
            <div className="hero-cta fade-up d3">
              <button className="btn btn-primary btn-lg" onClick={() => navigate("auth")}>{t.hero.cta1}</button>
              <a className="link-chev" onClick={() => navigate("landing")} href="#" style={{ fontSize: 17 }}>
                {t.hero.cta2} <span className="c">›</span>
              </a>
            </div>
            <p className="small fade-up d4" style={{ marginTop: 26 }}>{t.hero.trust}</p>
          </div>
          {editorial && <HeroWindow t={t} />}
        </div>
        {!editorial && <div style={{ marginTop: 56 }}><HeroWindow t={t} /></div>}
      </div>
    </section>
  );
}

function ToolStrip({ t }) {
  return (
    <section className="section-sm" style={{ paddingTop: 40, paddingBottom: 40 }}>
      <div className="wrap center">
        <p className="small" style={{ marginBottom: 22, fontWeight: 500 }}>{t.logos.title}</p>
        <div className="tool-strip">
          {t.logos.tools.map((tool) => (
            <span className="tool-chip" key={tool}>{tool}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Models({ t, navigate }) {
  return (
    <section className="section tint" id="models">
      <div className="wrap">
        <div className="center" style={{ maxWidth: 640, margin: "0 auto 52px" }}>
          <span className="eyebrow"><span className="dot"></span>{t.models.eyebrow}</span>
          <h2 className="h2" style={{ marginTop: 14 }}>{t.models.title}</h2>
          <p className="lead" style={{ marginTop: 14 }}>{t.models.sub}</p>
        </div>
        <div className="grid g4">
          {t.models.items.map((m) => (
            <div className="model-tile" key={m.k}>
              <ModelBadge k={m.k} />
              <div>
                <div className="h3">{m.n}</div>
                <div className="mono" style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 3 }}>{m.d}</div>
              </div>
              <p className="body" style={{ fontSize: 14.5, marginTop: "auto" }}>{m.note}</p>
            </div>
          ))}
        </div>
        <div className="center" style={{ marginTop: 36 }}>
          <a className="link-chev" href="#" onClick={(e)=>{e.preventDefault();navigate("landing");}}>{t.models.cta} <span className="c">›</span></a>
        </div>
      </div>
    </section>
  );
}

function Values({ t }) {
  const icons = [window.Ic.Layers, window.Ic.Tag, window.Ic.Bolt, window.Ic.Shield];
  return (
    <section className="section" id="product">
      <div className="wrap">
        <div className="center" style={{ maxWidth: 680, margin: "0 auto 52px" }}>
          <span className="eyebrow"><span className="dot"></span>{t.values.eyebrow}</span>
          <h2 className="h2" style={{ marginTop: 14 }}>{t.values.title}</h2>
        </div>
        <div className="grid g2">
          {t.values.items.map((v, i) => {
            const Icon = icons[i];
            return (
              <div className="value-card" key={i}>
                <div className="value-ic"><Icon size={20} /></div>
                <div>
                  <div className="h3" style={{ marginBottom: 8 }}>{v.t}</div>
                  <p className="body" style={{ fontSize: 15.5 }}>{v.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Manifesto({ t }) {
  return (
    <section className="section tint">
      <div className="wrap-narrow center">
        <span className="eyebrow"><span className="dot"></span>{t.manifesto.eyebrow}</span>
        <blockquote className="manifesto-quote">{t.manifesto.quote}</blockquote>
        <p className="lead" style={{ marginTop: 24, color: "var(--ink-2)" }}>{t.manifesto.body}</p>
      </div>
    </section>
  );
}

function Pricing({ t, navigate }) {
  return (
    <section className="section" id="pricing">
      <div className="wrap">
        <div className="center" style={{ maxWidth: 640, margin: "0 auto 52px" }}>
          <span className="eyebrow"><span className="dot"></span>{t.pricing.eyebrow}</span>
          <h2 className="h2" style={{ marginTop: 14 }}>{t.pricing.title}</h2>
          <p className="lead" style={{ marginTop: 14 }}>{t.pricing.sub}</p>
        </div>
        <div className="grid g3" style={{ alignItems: "stretch" }}>
          {t.pricing.cards.map((c, i) => (
            <div className={"price-card " + (c.hi ? "hi" : "")} key={i}>
              <div className="price-tag">{c.tag}</div>
              <div className="h3">{c.name}</div>
              <div className="price-amt">{c.price}<span className="price-unit">{c.unit}</span></div>
              <div className="price-feats">
                {c.feat.map((f, j) => (
                  <div className="price-feat" key={j}><Ic.Check size={15} /> <span>{f}</span></div>
                ))}
              </div>
              <button className={"btn btn-block " + (c.hi ? "btn-primary" : "btn-outline")} onClick={() => navigate("auth")}>{c.cta}</button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBand({ t, navigate }) {
  return (
    <section className="cta-band">
      <div className="wrap-narrow center">
        <h2 className="h1" style={{ color: "#fff" }}>{t.ctaband.title}</h2>
        <p className="lead" style={{ color: "rgba(255,255,255,0.8)", marginTop: 16 }}>{t.ctaband.sub}</p>
        <div className="hero-cta" style={{ justifyContent: "center", marginTop: 30 }}>
          <button className="btn btn-lg cta-white" onClick={() => navigate("auth")}>{t.ctaband.cta1}</button>
          <button className="btn btn-lg cta-clear" onClick={() => navigate("landing")}>{t.ctaband.cta2}</button>
        </div>
      </div>
    </section>
  );
}

function Landing({ t, dir, navigate }) {
  return (
    <div>
      <Hero t={t} dir={dir} navigate={navigate} />
      <ToolStrip t={t} />
      <Models t={t} navigate={navigate} />
      <Values t={t} />
      <Manifesto t={t} />
      <Pricing t={t} navigate={navigate} />
      <CtaBand t={t} navigate={navigate} />
    </div>
  );
}

Object.assign(window, { Landing });
