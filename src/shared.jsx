import logoUrl from "./assets/logo.svg";

// Canale di sincronizzazione tra il pannello DJ e le finestre di schermo pubblico
export const CHANNEL_NAME = "duodipicche-karaoke-sync";

// ─── YouTube helper ─────────────────────────────────────────────────
export function extractYTId(url) {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

// ─── Fetch YouTube oEmbed ────────────────────────────────────────────
export async function fetchYTMeta(videoId) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ─── Brand tokens — sfondo bianco, accenti oro dal logo ─────────────
export const B = {
  bg:          "#ffffff",
  surface:     "#f8f8f6",
  surfaceHigh: "#f0efeb",
  border:      "#e0ddd4",
  borderLight: "#ede9e0",
  gold:        "#c89010",
  goldHover:   "#a87200",
  goldLight:   "#f5e0a0",
  goldBg:      "#fdf8ee",
  text:        "#1a1a14",
  textMid:     "#4a4a3a",
  muted:       "#9a9480",
  danger:      "#c0392b",
  dangerBg:    "#fdf0ee",
  black:       "#0a0a08",
};

// ─── Reusable components ─────────────────────────────────────────────
export function Btn({ onClick, variant = "gold", disabled, children, style = {} }) {
  const base = {
    border: "none", cursor: disabled ? "not-allowed" : "pointer",
    borderRadius: 7, fontWeight: 700, fontSize: 13,
    padding: "9px 16px", transition: "all .15s",
    opacity: disabled ? 0.38 : 1, whiteSpace: "nowrap",
    fontFamily: "inherit",
  };
  const variants = {
    gold:    { background: B.gold, color: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,.15)" },
    ghost:   { background: B.surfaceHigh, color: B.text, border: `1px solid ${B.border}` },
    danger:  { background: B.dangerBg, color: B.danger, border: `1px solid #e8b0a8` },
    outline: { background: "#fff", color: B.gold, border: `1.5px solid ${B.gold}` },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Badge({ children }) {
  return (
    <span style={{
      display: "inline-block",
      background: B.goldBg, color: B.gold,
      border: `1px solid ${B.goldLight}`,
      borderRadius: 4, fontSize: 11, fontWeight: 700,
      padding: "2px 7px", letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
      textTransform: "uppercase", color: B.muted, marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

export function Divider({ style = {} }) {
  return (
    <div style={{
      height: 1,
      background: B.border,
      ...style,
    }} />
  );
}

// ─── Logo component ──────────────────────────────────────────────────
export function DuoPiccheLogo({ size = 44 }) {
  return (
    <img
      src={logoUrl}
      alt="Duo di Picche"
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}
