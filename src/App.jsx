import { useState, useRef, useEffect } from "react";
import logoUrl from "./assets/logo.svg";

// ─── YouTube helper ─────────────────────────────────────────────────
function extractYTId(url) {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/
  );
  return m ? m[1] : null;
}

// ─── Brand tokens — sfondo bianco, accenti oro dal logo ─────────────
const B = {
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

// ─── Fetch YouTube oEmbed ────────────────────────────────────────────
async function fetchYTMeta(videoId) {
  try {
    const r = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

// ─── Reusable components ─────────────────────────────────────────────
function Btn({ onClick, variant = "gold", disabled, children, style = {} }) {
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

function Badge({ children, color = B.gold }) {
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

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: "0.14em",
      textTransform: "uppercase", color: B.muted, marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

function Divider({ style = {} }) {
  return (
    <div style={{
      height: 1,
      background: B.border,
      ...style,
    }} />
  );
}

// ─── Logo component ──────────────────────────────────────────────────
function DuoPiccheLogo({ size = 44 }) {
  return (
    <img
      src={logoUrl}
      alt="Duo di Picche"
      style={{ width: size, height: size, objectFit: "contain", display: "block" }}
    />
  );
}

// ─── Main App ──────────────────────────────────────────────────────────
export default function KaraokeDJ() {
  const [queue, setQueue] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [publicOpen, setPublicOpen] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [localFile, setLocalFile] = useState(null);
  const [localName, setLocalName] = useState("");
  const [localObjectUrl, setLocalObjectUrl] = useState(null);
  const [addMode, setAddMode] = useState("youtube");
  const [isPlaying, setIsPlaying] = useState(false);
  const [addingMeta, setAddingMeta] = useState(false);

  const fileInputRef = useRef(null);
  const previewVideoRef = useRef(null);

  const currentSong = currentIdx !== null ? queue[currentIdx] : null;

  useEffect(() => () => {
    queue.forEach(s => s.type === "local" && URL.revokeObjectURL(s.src));
  }, []);

  const handleAddYT = async () => {
    const id = extractYTId(ytUrl.trim());
    if (!id) return alert("Link YouTube non valido");
    setAddingMeta(true);
    const meta = await fetchYTMeta(id);
    setQueue(q => [...q, {
      id: Date.now(), type: "youtube", videoId: id,
      title: meta?.title || `Video ${id}`,
      thumb: `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
      artist: meta?.author_name || "",
    }]);
    setYtUrl("");
    setAddingMeta(false);
  };

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setLocalFile(f);
    setLocalObjectUrl(URL.createObjectURL(f));
    setLocalName(f.name.replace(/\.[^.]+$/, ""));
  };

  const handleAddLocal = () => {
    if (!localFile) return;
    const src = URL.createObjectURL(localFile);
    setQueue(q => [...q, {
      id: Date.now(), type: "local", src,
      title: localName || localFile.name.replace(/\.[^.]+$/, ""),
      thumb: null, artist: "",
    }]);
    setLocalFile(null); setLocalName(""); setLocalObjectUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const playSong  = idx => { setCurrentIdx(idx); setIsPlaying(true); };
  const playNext  = () => {
    if (currentIdx === null) return;
    const n = currentIdx + 1;
    if (n < queue.length) playSong(n); else { setCurrentIdx(null); setIsPlaying(false); }
  };
  const playPrev  = () => currentIdx > 0 && playSong(currentIdx - 1);

  const removeFromQueue = id => {
    setQueue(q => {
      const idx = q.findIndex(s => s.id === id);
      const rem = q[idx];
      if (rem?.type === "local") URL.revokeObjectURL(rem.src);
      const nq = q.filter(s => s.id !== id);
      if (currentIdx !== null) {
        if (idx < currentIdx) setCurrentIdx(c => c - 1);
        else if (idx === currentIdx) { setCurrentIdx(null); setIsPlaying(false); }
      }
      return nq;
    });
  };

  const moveUp = idx => {
    if (idx === 0) return;
    setQueue(q => { const n=[...q]; [n[idx-1],n[idx]]=[n[idx],n[idx-1]]; return n; });
    if (currentIdx === idx) setCurrentIdx(idx-1);
    else if (currentIdx === idx-1) setCurrentIdx(idx);
  };
  const moveDown = idx => {
    if (idx === queue.length-1) return;
    setQueue(q => { const n=[...q]; [n[idx],n[idx+1]]=[n[idx+1],n[idx]]; return n; });
    if (currentIdx === idx) setCurrentIdx(idx+1);
    else if (currentIdx === idx+1) setCurrentIdx(idx);
  };

  const inputStyle = {
    background: "#fff", border: `1.5px solid ${B.border}`,
    borderRadius: 7, color: B.text, fontSize: 14,
    padding: "10px 12px", outline: "none",
    width: "100%", boxSizing: "border-box", fontFamily: "inherit",
  };

  // ── Schermo pubblico ─────────────────────────────────────────────
  const PublicScreen = () => (
    <div style={{
      position:"fixed", inset:0, background:"#0a0a08",
      display:"flex", flexDirection:"column", zIndex:9999,
    }}>
      {/* Logo + nome */}
      <div style={{
        position:"absolute", top:0, left:0, right:0, zIndex:10,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 20px",
        background: currentSong
          ? "linear-gradient(to bottom, #000000cc, transparent)"
          : "transparent",
        pointerEvents:"none",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* Logo bianco su nero */}
          <div style={{
            background: "#fff",
            borderRadius: 10,
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <DuoPiccheLogo size={44} />
          </div>
          <div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: "#e0a020",
              letterSpacing: "-0.01em", textShadow: `0 0 20px #e0a02066`,
            }}>
              Duo di Picche
            </div>
            <div style={{ fontSize: 11, color: "#ffffff55", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Karaoke Night
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setPublicOpen(false)}
        style={{
          position:"absolute", top:14, right:16, zIndex:20,
          background:"#ffffff15", border:`1px solid #ffffff22`,
          color:"#fff", borderRadius:6, padding:"7px 14px",
          fontSize:12, cursor:"pointer", fontFamily:"inherit",
        }}
      >
        ← Chiudi
      </button>

      {currentSong ? (
        <div style={{ width:"100%", height:"100%", position:"relative" }}>
          {currentSong.type === "youtube" ? (
            <iframe
              key={currentSong.videoId + String(isPlaying)}
              src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=${isPlaying?1:0}&controls=0&modestbranding=1&rel=0&fs=0`}
              style={{ width:"100%", height:"100%", border:"none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : (
            <video
              src={currentSong.src}
              style={{ width:"100%", height:"100%", objectFit:"contain" }}
              autoPlay={isPlaying} controls={false}
              onEnded={playNext}
            />
          )}
          <div style={{
            position:"absolute", bottom:0, left:0, right:0,
            padding:"20px 24px",
            background:"linear-gradient(to top, #000000ee 0%, #00000055 60%, transparent 100%)",
            display:"flex", alignItems:"flex-end", gap:14,
            pointerEvents:"none",
          }}>
            {currentSong.thumb && (
              <img src={currentSong.thumb}
                style={{ width:72, height:50, borderRadius:6, objectFit:"cover",
                         border:"2px solid #e0a02066" }}
                alt=""
              />
            )}
            <div style={{ flex:1 }}>
              <div style={{ fontSize:26, fontWeight:800, color:"#fff",
                            textShadow:"0 2px 12px #000c", lineHeight:1.2 }}>
                {currentSong.title}
              </div>
              {currentSong.artist && (
                <div style={{ fontSize:15, color:"#e0a020", marginTop:4 }}>
                  {currentSong.artist}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
                      alignItems:"center", justifyContent:"center", gap:24 }}>
          <div style={{
            background: "#fff",
            borderRadius: 20,
            padding: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <DuoPiccheLogo size={140} />
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{
              fontSize:34, fontWeight:800, color:"#e0a020",
              textShadow:"0 0 40px #e0a02044",
            }}>
              Duo di Picche
            </div>
            <div style={{ fontSize:14, color:"#ffffff33", marginTop:6,
                          letterSpacing:"0.15em", textTransform:"uppercase" }}>
              Karaoke Night · In attesa…
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── DJ Panel ──────────────────────────────────────────────────────
  return (
    <div style={{
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      background: B.bg, color: B.text,
      minHeight: "100vh", display: "flex", flexDirection: "column",
    }}>
      {publicOpen && <PublicScreen />}

      {/* TOP BAR */}
      <div style={{
        background: B.bg,
        borderBottom: `1.5px solid ${B.border}`,
        padding: "10px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <DuoPiccheLogo size={46} />
          <div>
            <div style={{ fontSize:17, fontWeight:800, color:B.black, letterSpacing:"-0.01em" }}>
              Duo di Picche
            </div>
            <div style={{ fontSize:10, color:B.muted, letterSpacing:"0.12em",
                          textTransform:"uppercase" }}>
              Pannello DJ
            </div>
          </div>
        </div>

        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {currentSong && (
            <Badge>
              ▶ {currentSong.title.slice(0,30)}{currentSong.title.length>30?"…":""}
            </Badge>
          )}
          <Btn onClick={() => setPublicOpen(true)}>
            📺 Schermo pubblico
          </Btn>
        </div>
      </div>

      {/* MAIN GRID */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 320px",
        flex: 1, overflow: "hidden",
      }}>

        {/* ── LEFT ────────────────────────────────────────────────── */}
        <div style={{
          display:"flex", flexDirection:"column", padding:20, gap:18, overflowY:"auto",
        }}>

          {/* Aggiungi canzone */}
          <div>
            <SectionLabel>Aggiungi canzone</SectionLabel>
            <div style={{
              display:"flex", borderRadius:8, overflow:"hidden",
              border:`1.5px solid ${B.border}`, marginBottom:12,
            }}>
              {["youtube","local"].map(m => (
                <button key={m} onClick={() => setAddMode(m)} style={{
                  flex:1, padding:"8px 0", fontSize:13, fontWeight:700,
                  border:"none", cursor:"pointer", fontFamily:"inherit",
                  background: addMode===m ? B.gold : "#fff",
                  color: addMode===m ? "#fff" : B.muted,
                  transition:"all .2s",
                }}>
                  {m==="youtube" ? "▶ YouTube" : "📁 File locale"}
                </button>
              ))}
            </div>

            {addMode === "youtube" ? (
              <div style={{ display:"flex", gap:8 }}>
                <input
                  style={inputStyle}
                  placeholder="Incolla link YouTube…"
                  value={ytUrl}
                  onChange={e => setYtUrl(e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleAddYT()}
                />
                <Btn onClick={handleAddYT} disabled={addingMeta}>
                  {addingMeta ? "…" : "+ Aggiungi"}
                </Btn>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                <input
                  ref={fileInputRef} type="file" accept="video/*"
                  onChange={handleFileChange}
                  style={{ ...inputStyle, padding:"8px 10px" }}
                />
                {localFile && (
                  <>
                    <input
                      style={inputStyle}
                      placeholder="Titolo canzone"
                      value={localName}
                      onChange={e => setLocalName(e.target.value)}
                    />
                    {localObjectUrl && (
                      <video src={localObjectUrl}
                        style={{ width:"100%", maxHeight:130, borderRadius:7,
                                 objectFit:"contain", background:"#000",
                                 border:`1.5px solid ${B.border}` }}
                        controls
                      />
                    )}
                    <Btn onClick={handleAddLocal}>+ Aggiungi alla coda</Btn>
                  </>
                )}
              </div>
            )}
          </div>

          {/* In riproduzione */}
          {currentSong && (
            <div style={{
              background: B.goldBg,
              border: `1.5px solid ${B.goldLight}`,
              borderRadius: 10, padding: 16,
            }}>
              <SectionLabel>In riproduzione</SectionLabel>

              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                {currentSong.thumb ? (
                  <img src={currentSong.thumb}
                    style={{ width:84, height:58, borderRadius:7, objectFit:"cover",
                             border:`1.5px solid ${B.goldLight}` }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width:84, height:58, borderRadius:7,
                    background:B.surfaceHigh, display:"flex",
                    alignItems:"center", justifyContent:"center", fontSize:28,
                    border:`1.5px solid ${B.border}`,
                  }}>🎵</div>
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:15, lineHeight:1.3, color:B.text,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {currentSong.title}
                  </div>
                  {currentSong.artist && (
                    <div style={{ fontSize:12, color:B.gold, marginTop:3 }}>{currentSong.artist}</div>
                  )}
                  <div style={{ marginTop:6 }}>
                    <Badge>{currentSong.type==="youtube" ? "YouTube" : "File locale"}</Badge>
                  </div>
                </div>
              </div>

              {currentSong.type==="local" ? (
                <video ref={previewVideoRef} src={currentSong.src}
                  style={{ width:"100%", maxHeight:170, borderRadius:7, background:"#000",
                           marginBottom:12, objectFit:"contain",
                           border:`1.5px solid ${B.border}` }}
                  controls autoPlay={isPlaying}
                />
              ) : (
                <div style={{
                  borderRadius:8, overflow:"hidden", aspectRatio:"16/9",
                  background:"#000", marginBottom:12,
                  border:`1.5px solid ${B.border}`, maxHeight:170,
                }}>
                  <iframe
                    key={currentSong.videoId+"-dj"}
                    src={`https://www.youtube.com/embed/${currentSong.videoId}?autoplay=0&controls=1&modestbranding=1&rel=0`}
                    style={{ width:"100%", height:"100%", border:"none" }}
                    allow="autoplay; encrypted-media"
                  />
                </div>
              )}

              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <Btn variant="ghost" onClick={playPrev} disabled={!currentIdx}>⏮ Prec</Btn>
                <Btn onClick={() => setIsPlaying(p => !p)}>
                  {isPlaying ? "⏸ Pausa" : "▶ Play"}
                </Btn>
                <Btn variant="ghost" onClick={playNext}
                  disabled={currentIdx===queue.length-1}>Succ ⏭</Btn>
                <Btn variant="danger"
                  onClick={() => { setCurrentIdx(null); setIsPlaying(false); }}>
                  ⏹ Stop
                </Btn>
              </div>
            </div>
          )}

          {queue.length === 0 && (
            <div style={{
              textAlign:"center", color:B.muted, padding:"40px 20px", fontSize:13,
            }}>
              <div style={{ fontSize:40, marginBottom:12, opacity:0.35 }}>🎶</div>
              Aggiungi canzoni alla coda per iniziare la serata
            </div>
          )}
        </div>

        {/* ── RIGHT: coda ─────────────────────────────────────────── */}
        <div style={{
          background: B.surface,
          borderLeft: `1.5px solid ${B.border}`,
          display:"flex", flexDirection:"column",
          padding:14, gap:8, overflowY:"auto",
        }}>
          <SectionLabel>
            Coda — {queue.length} {queue.length===1?"canzone":"canzoni"}
          </SectionLabel>

          <Divider style={{ marginBottom: 4 }} />

          {queue.length === 0 && (
            <div style={{ color:B.muted, fontSize:12, textAlign:"center", marginTop:16 }}>
              Nessuna canzone in coda
            </div>
          )}

          {queue.map((song, idx) => (
            <div
              key={song.id}
              onClick={() => playSong(idx)}
              style={{
                background: idx===currentIdx ? B.goldBg : "#fff",
                border: `1.5px solid ${idx===currentIdx ? B.goldLight : B.borderLight}`,
                borderRadius: 8, padding:"9px 10px",
                display:"flex", alignItems:"center", gap:8,
                cursor:"pointer", transition:"all .15s",
              }}
            >
              <span style={{ fontSize:10, color: idx===currentIdx ? B.gold : B.muted,
                             width:16, textAlign:"center", flexShrink:0, fontWeight:700 }}>
                {idx===currentIdx ? "▶" : idx+1}
              </span>
              {song.thumb ? (
                <img src={song.thumb}
                  style={{ width:50, height:34, borderRadius:4,
                           objectFit:"cover", flexShrink:0, background:"#000",
                           border:`1px solid ${B.border}` }}
                  alt=""
                />
              ) : (
                <div style={{
                  width:50, height:34, borderRadius:4, flexShrink:0,
                  background:B.surfaceHigh, display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:18,
                }}>🎵</div>
              )}
              <span style={{
                flex:1, fontSize:12, lineHeight:1.35,
                overflow:"hidden", display:"-webkit-box",
                WebkitLineClamp:2, WebkitBoxOrient:"vertical",
                color: idx===currentIdx ? B.gold : B.text,
                fontWeight: idx===currentIdx ? 700 : 400,
              }}>
                {song.title}
              </span>
              <div style={{ display:"flex", flexDirection:"column", gap:3, flexShrink:0 }}>
                {[
                  { label:"▲", fn: e => { e.stopPropagation(); moveUp(idx); },   dis: idx===0 },
                  { label:"▼", fn: e => { e.stopPropagation(); moveDown(idx); }, dis: idx===queue.length-1 },
                  { label:"✕", fn: e => { e.stopPropagation(); removeFromQueue(song.id); }, danger:true },
                ].map(({ label, fn, dis, danger }) => (
                  <button key={label} onClick={dis ? undefined : fn} style={{
                    padding:"2px 6px", fontSize:11, fontWeight:700,
                    border:`1.5px solid ${danger ? "#e8b0a8" : B.border}`,
                    borderRadius:4, cursor: dis ? "not-allowed" : "pointer",
                    background: danger ? B.dangerBg : "#fff",
                    color: dis ? B.muted : danger ? B.danger : B.textMid,
                    opacity: dis ? 0.35 : 1, fontFamily:"inherit",
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
