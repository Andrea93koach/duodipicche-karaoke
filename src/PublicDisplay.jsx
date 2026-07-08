import { useState, useEffect, useRef } from "react";
import { B, DuoPiccheLogo, CHANNEL_NAME } from "./shared";

// Schermo pubblico: pensato per essere aperto in una scheda/finestra separata
// (una per ogni monitor esterno) e trascinato sullo schermo giusto durante la
// serata. Riceve lo stato dal pannello DJ via BroadcastChannel, non ha stato
// proprio sulla coda: è un semplice "ricevitore".
export default function PublicDisplay() {
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [localUrl, setLocalUrl] = useState(null);
  const [connected, setConnected] = useState(false);

  const channelRef = useRef(null);
  const idRef = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = e => {
      const msg = e.data;
      if (msg.type === "state") {
        setSong(msg.song);
        setIsPlaying(msg.isPlaying);
        setConnected(true);
      }
    };

    channel.postMessage({ type: "hello", id: idRef.current });
    channel.postMessage({ type: "requestState" });

    const announceBye = () => channel.postMessage({ type: "bye", id: idRef.current });
    window.addEventListener("beforeunload", announceBye);

    return () => {
      announceBye();
      window.removeEventListener("beforeunload", announceBye);
      channel.close();
    };
  }, []);

  // Il file locale arriva come oggetto File (clonabile via BroadcastChannel):
  // ricreiamo un object URL valido in questa scheda.
  useEffect(() => {
    if (song?.type === "local" && song.file) {
      const url = URL.createObjectURL(song.file);
      setLocalUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setLocalUrl(null);
  }, [song]);

  const handleLocalEnded = () => {
    channelRef.current?.postMessage({ type: "ended" });
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#0a0a08",
      display: "flex", flexDirection: "column",
    }}>
      {/* Logo + nome */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 20px",
        background: song
          ? "linear-gradient(to bottom, #000000cc, transparent)"
          : "transparent",
        pointerEvents: "none",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "#fff",
          borderRadius: 14,
          padding: "8px 18px 8px 8px",
          boxShadow: "0 2px 10px rgba(0,0,0,.35)",
        }}>
          <DuoPiccheLogo size={48} />
          <div>
            <div style={{
              fontSize: 20, fontWeight: 800, color: B.gold,
              letterSpacing: "-0.01em",
            }}>
              Duo di Picche
            </div>
            <div style={{ fontSize: 11, color: B.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Karaoke Night
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={toggleFullscreen}
        style={{
          position: "absolute", top: 14, right: 16, zIndex: 20,
          background: "#ffffff15", border: "1px solid #ffffff22",
          color: "#fff", borderRadius: 6, padding: "7px 14px",
          fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}
      >
        ⛶ Schermo intero
      </button>

      {song ? (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
          {song.type === "youtube" ? (
            <iframe
              key={song.videoId + String(isPlaying)}
              src={`https://www.youtube.com/embed/${song.videoId}?autoplay=${isPlaying?1:0}&controls=0&modestbranding=1&rel=0&fs=0`}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          ) : localUrl ? (
            <video
              src={localUrl}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
              autoPlay={isPlaying} controls={false}
              onEnded={handleLocalEnded}
            />
          ) : null}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            padding: "20px 24px",
            background: "linear-gradient(to top, #000000ee 0%, #00000055 60%, transparent 100%)",
            display: "flex", alignItems: "flex-end", gap: 14,
            pointerEvents: "none",
          }}>
            {song.thumb && (
              <img src={song.thumb}
                style={{ width: 72, height: 50, borderRadius: 6, objectFit: "cover",
                         border: "2px solid #e0a02066" }}
                alt=""
              />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#fff",
                            textShadow: "0 2px 12px #000c", lineHeight: 1.2 }}>
                {song.title}
              </div>
              {song.artist && (
                <div style={{ fontSize: 15, color: "#e0a020", marginTop: 4 }}>
                  {song.artist}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
                      alignItems: "center", justifyContent: "center", gap: 24 }}>
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
          <div style={{ textAlign: "center" }}>
            <div style={{
              fontSize: 34, fontWeight: 800, color: "#e0a020",
              textShadow: "0 0 40px #e0a02044",
            }}>
              Duo di Picche
            </div>
            <div style={{ fontSize: 14, color: "#ffffff33", marginTop: 6,
                          letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Karaoke Night · In attesa…
            </div>
            {!connected && (
              <div style={{ fontSize: 12, color: "#ffffff33", marginTop: 14 }}>
                In attesa di collegamento al pannello DJ…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
