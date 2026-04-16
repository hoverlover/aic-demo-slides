"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

function RemoteInner() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get("room");

  const [room, setRoom] = useState(roomParam || "");
  const [connected, setConnected] = useState(!!roomParam);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [inputValue, setInputValue] = useState(roomParam || "");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollState = useCallback(
    async (roomCode: string) => {
      try {
        const res = await fetch(`/api/state?room=${roomCode}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Room expired or not found");
            setConnected(false);
            if (pollRef.current) clearInterval(pollRef.current);
          }
          return;
        }
        const data = await res.json();
        setCurrent(data.current);
        setTotal(data.total);
        setError("");
      } catch {
        // network blip, keep polling
      }
    },
    []
  );

  const connect = useCallback(
    async (roomCode: string) => {
      setError("");
      const res = await fetch(`/api/state?room=${roomCode}`);
      if (!res.ok) {
        setError("Room not found. Check the code and try again.");
        return;
      }
      const data = await res.json();
      setCurrent(data.current);
      setTotal(data.total);
      setRoom(roomCode);
      setConnected(true);

      // Start polling
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => pollState(roomCode), 500);
    },
    [pollState]
  );

  // Auto-connect if room param provided
  useEffect(() => {
    if (roomParam) {
      connect(roomParam);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomParam, connect]);

  const sendNav = async (action: "prev" | "next") => {
    if (!room) return;
    try {
      const res = await fetch("/api/nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room, action }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrent(data.current);
        setTotal(data.total);
      }
    } catch {
      // ignore
    }
  };

  if (!connected) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>Slide Remote</div>
        <div style={styles.subtitle}>Enter the room code shown on the presentation</div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputValue.length === 4) connect(inputValue);
          }}
          style={styles.form}
        >
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]{4}"
            maxLength={4}
            placeholder="0000"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.replace(/\D/g, "").slice(0, 4))}
            style={styles.input}
            autoFocus
          />
          <button
            type="submit"
            disabled={inputValue.length !== 4}
            style={{
              ...styles.connectBtn,
              opacity: inputValue.length === 4 ? 1 : 0.4,
            }}
          >
            Connect
          </button>
        </form>
        {error && <div style={styles.error}>{error}</div>}
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>Remote Control</div>
      <div style={styles.roomBadge}>Room {room}</div>
      <div style={styles.counter}>
        <span style={styles.counterCurrent}>{current}</span>
        <span style={styles.counterTotal}> / {total}</span>
      </div>
      <div style={styles.buttons}>
        <button style={styles.navBtn} onClick={() => sendNav("prev")}>
          Prev
        </button>
        <button style={styles.navBtn} onClick={() => sendNav("next")}>
          Next
        </button>
      </div>
      {error && <div style={styles.error}>{error}</div>}
    </div>
  );
}

export default function RemotePage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "#111",
            color: "#888",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Loading...
        </div>
      }
    >
      <RemoteInner />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    background: "#111",
    color: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    padding: "2rem",
    gap: "2rem",
  },
  title: {
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#ccc",
    letterSpacing: "0.05em",
  },
  subtitle: {
    fontSize: "0.95rem",
    color: "#666",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.2rem",
  },
  input: {
    fontSize: "2.5rem",
    fontWeight: 700,
    textAlign: "center",
    width: "180px",
    padding: "0.6rem",
    borderRadius: "12px",
    border: "2px solid #333",
    background: "#1a1a1a",
    color: "#fff",
    letterSpacing: "0.3em",
    fontFamily: "monospace",
    outline: "none",
  },
  connectBtn: {
    fontSize: "1.1rem",
    fontWeight: 600,
    padding: "0.8rem 2.5rem",
    borderRadius: "12px",
    border: "2px solid #555",
    background: "#222",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.15s",
  },
  roomBadge: {
    fontSize: "0.85rem",
    color: "#888",
    background: "#1a1a1a",
    padding: "0.4rem 1rem",
    borderRadius: "8px",
    border: "1px solid #333",
    fontFamily: "monospace",
  },
  counter: {
    fontSize: "4rem",
    fontWeight: 700,
  },
  counterCurrent: {
    color: "#fff",
  },
  counterTotal: {
    color: "#444",
    fontWeight: 400,
  },
  buttons: {
    display: "flex",
    gap: "1.5rem",
  },
  navBtn: {
    fontSize: "1.4rem",
    fontWeight: 700,
    padding: "1.5rem 3rem",
    borderRadius: "16px",
    border: "2px solid #444",
    background: "#1a1a1a",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.15s",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    minWidth: "120px",
  },
  error: {
    color: "#f87171",
    fontSize: "0.9rem",
    textAlign: "center",
  },
};
