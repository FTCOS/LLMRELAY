// icons.jsx — minimal line icons (Apple-ish, 1.6 stroke) + model meta
const Ic = {};
function mk(path, vb) {
  return function Icon({ size = 18, className = "", stroke = 1.7, ...p }) {
    return (
      <svg width={size} height={size} viewBox={vb || "0 0 24 24"} fill="none"
        stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
        className={className} {...p}>{path}</svg>
    );
  };
}
Ic.Grid    = mk(<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>);
Ic.Key     = mk(<><circle cx="8" cy="8" r="4.5"/><path d="M11.2 11.2 20 20M16 16l2-2M19 19l1.5-1.5"/></>);
Ic.Chart   = mk(<><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></>);
Ic.Wallet  = mk(<><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 14.5h2"/></>);
Ic.Gear    = mk(<><circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18 6l-2 2M8 16l-2 2M18 18l-2-2M8 8 6 6"/></>);
Ic.Plus    = mk(<><path d="M12 5v14M5 12h14"/></>);
Ic.Bolt    = mk(<><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></>);
Ic.Coins   = mk(<><ellipse cx="9" cy="6" rx="6" ry="3"/><path d="M3 6v6c0 1.66 2.7 3 6 3s6-1.34 6-3"/><path d="M9 12.9c.3 0 .6 0 .9-.04"/><ellipse cx="15" cy="14" rx="6" ry="3"/><path d="M9 18c0 1.66 2.7 3 6 3s6-1.34 6-3v-6"/></>);
Ic.Pulse   = mk(<><path d="M2 12h4l3-8 4 16 3-8h6"/></>);
Ic.Check    = mk(<><path d="M20 6 9 17l-5-5"/></>);
Ic.Copy    = mk(<><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></>);
Ic.Chevron = mk(<><path d="m9 6 6 6-6 6"/></>);
Ic.ArrowR  = mk(<><path d="M5 12h14M13 6l6 6-6 6"/></>);
Ic.Layers  = mk(<><path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/></>);
Ic.Shield  = mk(<><path d="M12 2 4 5v6c0 5 3.5 8.5 8 11 4.5-2.5 8-6 8-11V5l-8-3z"/></>);
Ic.Tag     = mk(<><path d="M3 11V4a1 1 0 0 1 1-1h7l9 9-8 8-9-9z"/><circle cx="7.5" cy="7.5" r="1.3"/></>);
Ic.Github  = mk(<><path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.3 4.3 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.3 2.3 5.3 2.6 5.3 2.6a4.3 4.3 0 0 0-.1 3.2A4.6 4.6 0 0 0 3.9 9c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></>);
Ic.Google  = mk(<><path d="M21 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.1a4.3 4.3 0 0 1-1.9 2.8v2.3h3.1c1.8-1.7 2.7-4.1 2.7-6.7z"/><path d="M12 21c2.4 0 4.5-.8 6-2.2l-3.1-2.3c-.8.6-2 .9-2.9.9-2.3 0-4.2-1.5-4.9-3.6H3.9v2.3A9 9 0 0 0 12 21z"/><path d="M7.1 13.8a5.4 5.4 0 0 1 0-3.5V8H3.9a9 9 0 0 0 0 8.1l3.2-2.3z"/><path d="M12 6.6c1.3 0 2.5.5 3.4 1.3l2.6-2.6A9 9 0 0 0 3.9 8l3.2 2.3C7.8 8.1 9.7 6.6 12 6.6z"/></>);
Ic.Globe   = mk(<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"/></>);
Ic.Logout  = mk(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></>);

// per-model meta (letter glyph + tint — NOT brand logos)
const MODEL_META = {
  Claude:   { c:"#C96442", g:"#E08766" },
  GPT:      { c:"#10A37F", g:"#1FBF97" },
  DeepSeek: { c:"#4D6BFE", g:"#6E86FF" },
  Qwen:     { c:"#6E56CF", g:"#8B74E8" },
};
function ModelBadge({ k, size = 44 }) {
  const m = MODEL_META[k] || { c: "#888", g: "#aaa" };
  return (
    <div className="model-badge" style={{ width: size, height: size,
      background: `linear-gradient(145deg, ${m.g}, ${m.c})`, borderRadius: size * 0.27,
      fontSize: size * 0.42 }}>{k[0]}</div>
  );
}

Object.assign(window, { Ic, ModelBadge, MODEL_META });
