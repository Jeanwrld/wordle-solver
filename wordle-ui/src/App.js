import { useState, useEffect, useCallback, useRef } from "react";

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = "https://web-production-ea1d.up.railway.app";

async function fetchSuggestion(history) {
  const res = await fetch(`${API_BASE}/suggest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ history }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TILE_STATES = { 0: "grey", 1: "yellow", 2: "green" };
const TILE_LABELS = { 0: "⬜", 1: "🟨", 2: "🟩" };
const STATE_COLORS = {
  grey:    { bg: "#3a3a3c", text: "#ffffff", glow: "none" },
  yellow:  { bg: "#b59f3b", text: "#ffffff", glow: "0 0 16px #b59f3b66" },
  green:   { bg: "#538d4e", text: "#ffffff", glow: "0 0 16px #538d4e88" },
  empty:   { bg: "transparent", text: "#ffffff", glow: "none" },
  pending: { bg: "transparent", text: "#ffffff", glow: "none" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tile({ letter, colorState = "empty", size = 62, animate = false }) {
  const col = STATE_COLORS[colorState] || STATE_COLORS.empty;
  const hasBorder = colorState === "empty" || colorState === "pending";
  return (
    <div style={{
      width: size, height: size,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: col.bg,
      border: hasBorder ? `2px solid ${letter ? "#565758" : "#3a3a3c"}` : "2px solid transparent",
      borderRadius: 4,
      fontSize: size * 0.38,
      fontWeight: 700,
      fontFamily: "'Archivo Black', sans-serif",
      color: col.text,
      letterSpacing: 1,
      boxShadow: col.glow,
      transition: "background 0.25s ease, box-shadow 0.25s ease",
      transform: animate ? "scale(1.08)" : "scale(1)",
    }}>
      {(letter || "").toUpperCase()}
    </div>
  );
}

function GuessRow({ word, pattern, size = 62 }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Tile
          key={i}
          letter={word?.[i] || ""}
          colorState={pattern ? TILE_STATES[pattern[i]] : word?.[i] ? "pending" : "empty"}
          size={size}
        />
      ))}
    </div>
  );
}

function PatternSelector({ word, onConfirm, onCancel }) {
  const [pat, setPat] = useState([0, 0, 0, 0, 0]);
  const cycle = i => setPat(p => { const n = [...p]; n[i] = (n[i] + 1) % 3; return n; });

  return (
    <div style={{
      background: "#1a1a1b",
      border: "1px solid #3a3a3c",
      borderRadius: 12,
      padding: "20px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    }}>
      <p style={{ margin: 0, color: "#818384", fontSize: 13, letterSpacing: 1, textTransform: "uppercase" }}>
        Tap tiles to cycle colour
      </p>
      <div style={{ display: "flex", gap: 5 }}>
        {word.split("").map((l, i) => (
          <div key={i} onClick={() => cycle(i)} style={{ cursor: "pointer" }}>
            <Tile letter={l} colorState={TILE_STATES[pat[i]]} size={58} />
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#818384" }}>
        {[0,1,2].map(s => (
          <span key={s}>{TILE_LABELS[s]} = {["Grey","Yellow","Green"][s]}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={onCancel} style={btnStyle("secondary")}>Cancel</button>
        <button onClick={() => onConfirm(pat)} style={btnStyle("primary")}>Confirm →</button>
      </div>
    </div>
  );
}

function SuggestionCard({ word, entropy, isPossible, rank, onClick }) {
  const pct = Math.min(entropy / 6, 1);
  return (
    <div onClick={() => onClick(word)}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 14px", borderRadius: 8, cursor: "pointer",
        background: "#1a1a1b",
        border: `1px solid ${isPossible ? "#538d4e55" : "#3a3a3c"}`,
        transition: "border-color 0.15s, background 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = "#252526"; e.currentTarget.style.borderColor = isPossible ? "#538d4e" : "#565758"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#1a1a1b"; e.currentTarget.style.borderColor = isPossible ? "#538d4e55" : "#3a3a3c"; }}
    >
      <span style={{ color: "#565758", fontFamily: "monospace", fontSize: 12, width: 20 }}>{rank}.</span>
      <span style={{
        fontFamily: "'Archivo Black', sans-serif",
        fontSize: 17, letterSpacing: 3,
        color: isPossible ? "#538d4e" : "#d7dadc",
        flex: 1,
      }}>
        {word.toUpperCase()}
      </span>
      {isPossible && (
        <span style={{ fontSize: 10, color: "#538d4e", background: "#538d4e22", padding: "2px 6px", borderRadius: 4 }}>
          POSSIBLE
        </span>
      )}
      <div style={{ width: 60, height: 3, background: "#3a3a3c", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: `${pct*100}%`, height: "100%", background: "#538d4e", borderRadius: 2 }} />
      </div>
      <span style={{ fontFamily: "monospace", fontSize: 11, color: "#818384", width: 44, textAlign: "right" }}>
        {entropy.toFixed(2)}b
      </span>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function btnStyle(variant) {
  return {
    padding: "10px 24px",
    background: variant === "primary" ? "#538d4e" : "transparent",
    color: variant === "primary" ? "#ffffff" : "#818384",
    border: `1px solid ${variant === "primary" ? "#538d4e" : "#3a3a3c"}`,
    borderRadius: 6,
    fontFamily: "'Archivo Black', sans-serif",
    fontSize: 13, letterSpacing: 1,
    cursor: "pointer",
    transition: "background 0.15s",
  };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [history, setHistory]           = useState([]);   // [{word, pattern}]
  const [suggestions, setSuggestions]   = useState([]);
  const [, setCurrentSuggestion] = useState("");
  const [possibleCount, setPossibleCount] = useState(2315);
  const [bitsLeft, setBitsLeft]         = useState(11.18);
  const [phase, setPhase]               = useState("suggest"); // suggest | pattern | solved | failed
  const [pendingWord, setPendingWord]   = useState("");
  const [inputWord, setInputWord]       = useState("");
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const inputRef = useRef(null);

  // Load initial suggestion
  useEffect(() => {
    loadSuggestion([]);
  }, []);

  const loadSuggestion = async (hist) => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSuggestion(hist);
      setSuggestions(data.top_suggestions || []);
      setCurrentSuggestion(data.suggestion);
      setPossibleCount(data.possible_count);
      setBitsLeft(data.bits_remaining);
      if (data.solved) setPhase("solved");
    } catch (e) {
      setError("Could not reach API. Is the backend running?");
    }
    setLoading(false);
  };

  const handleWordSubmit = useCallback((word) => {
    const w = word.trim().toLowerCase();
    if (w.length !== 5) { setError("Word must be 5 letters"); return; }
    setError("");
    setPendingWord(w);
    setInputWord("");
    setPhase("pattern");
  }, []);

  const handlePatternConfirm = useCallback(async (pattern) => {
    const isWin = pattern.every(p => p === 2);
    const newHistory = [...history, { word: pendingWord, pattern }];
    setHistory(newHistory);
    setPendingWord("");

    if (isWin) {
      setPhase("solved");
      return;
    }
    if (newHistory.length >= 6) {
      setPhase("failed");
      return;
    }

    setPhase("suggest");
    await loadSuggestion(newHistory);
  }, [history, pendingWord]);

  const handleReset = () => {
    setHistory([]);
    setSuggestions([]);
    setPendingWord("");
    setInputWord("");
    setPhase("suggest");
    setError("");
    loadSuggestion([]);
  };

  const progressPct = 1 - possibleCount / 2315;
  const MAX_ROWS = 6;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#121213",
      color: "#d7dadc",
      fontFamily: "'Segoe UI', sans-serif",
      display: "flex", justifyContent: "center",
      padding: "24px 16px 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #565758; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 2px; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: "1px solid #3a3a3c", paddingBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#818384", letterSpacing: 4, textTransform: "uppercase", marginBottom: 6 }}>
            Neural Network · Entropy Strategy
          </div>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 36, margin: 0, letterSpacing: 4, color: "#ffffff" }}>
            WORDLE<span style={{ color: "#538d4e" }}>.</span>AI
          </h1>
          {/* Progress bar */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: "#3a3a3c", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                width: `${progressPct*100}%`, height: "100%",
                background: "linear-gradient(90deg, #538d4e, #b59f3b)",
                borderRadius: 2, transition: "width 0.6s ease",
              }} />
            </div>
            <span style={{ fontSize: 11, color: "#818384", whiteSpace: "nowrap" }}>
              {possibleCount.toLocaleString()} words · {bitsLeft}b
            </span>
            <button onClick={handleReset} style={{
              background: "transparent", border: "1px solid #3a3a3c",
              color: "#818384", padding: "4px 12px", borderRadius: 4,
              fontSize: 11, cursor: "pointer", fontFamily: "inherit",
              letterSpacing: 1,
            }}>NEW</button>
          </div>
        </div>

        {/* Board */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginBottom: 28 }}>
          {Array.from({ length: MAX_ROWS }).map((_, ri) => {
            const isHistory = ri < history.length;
            const isPending = !isHistory && phase === "pattern" && ri === history.length;
            return (
              <GuessRow
                key={ri}
                word={isHistory ? history[ri].word : isPending ? pendingWord : ""}
                pattern={isHistory ? history[ri].pattern : null}
              />
            );
          })}
        </div>

        {/* Pattern picker */}
        {phase === "pattern" && (
          <div style={{ marginBottom: 24 }}>
            <PatternSelector
              word={pendingWord}
              onConfirm={handlePatternConfirm}
              onCancel={() => { setPendingWord(""); setPhase("suggest"); }}
            />
          </div>
        )}

        {/* Solved / Failed banners */}
        {phase === "solved" && (
          <div style={{
            background: "#0d2b0d", border: "1px solid #538d4e",
            borderRadius: 10, padding: "20px 24px", textAlign: "center",
            marginBottom: 24, boxShadow: "0 0 40px #538d4e22",
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#538d4e", letterSpacing: 2 }}>
              SOLVED
            </div>
            <div style={{ color: "#818384", fontSize: 13, marginTop: 4 }}>
              in {history.length} {history.length === 1 ? "guess" : "guesses"}
            </div>
          </div>
        )}
        {phase === "failed" && (
          <div style={{
            background: "#2b0d0d", border: "1px solid #e74c3c",
            borderRadius: 10, padding: "16px 24px", textAlign: "center", marginBottom: 24,
          }}>
            <div style={{ color: "#e74c3c", fontFamily: "'Archivo Black', sans-serif", letterSpacing: 2 }}>OUT OF GUESSES</div>
            <div style={{ color: "#818384", fontSize: 12, marginTop: 4 }}>Press NEW to try again</div>
          </div>
        )}

        {/* Suggestions panel */}
        {(phase === "suggest") && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#818384", letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>
              {loading ? "Thinking…" : history.length === 0 ? "Best openers" : "AI suggestions"}
            </div>

            {loading ? (
              <div style={{ textAlign: "center", color: "#538d4e", padding: 20 }}>
                <div style={{ fontSize: 24, animation: "spin 1s linear infinite" }}>⟳</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map((s, i) => (
                  <SuggestionCard
                    key={s.word}
                    rank={i+1}
                    word={s.word}
                    entropy={s.entropy}
                    isPossible={s.is_possible}
                    onClick={w => handleWordSubmit(w)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Manual input */}
        {phase === "suggest" && (
          <div>
            <div style={{ fontSize: 11, color: "#818384", letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>
              Or type your own
            </div>
            {error && (
              <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 8 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <input
                ref={inputRef}
                value={inputWord}
                onChange={e => setInputWord(e.target.value.slice(0,5))}
                onKeyDown={e => e.key === "Enter" && handleWordSubmit(inputWord)}
                maxLength={5}
                placeholder="CRANE"
                style={{
                  flex: 1, background: "#1a1a1b",
                  border: "1px solid #3a3a3c", borderRadius: 6,
                  padding: "12px 16px", color: "#ffffff",
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 18, letterSpacing: 4, textTransform: "uppercase",
                }}
              />
              <button
                onClick={() => handleWordSubmit(inputWord)}
                style={{
                  ...btnStyle("primary"),
                  padding: "12px 22px", fontSize: 14,
                }}
              >
                GO
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{
          marginTop: 36, paddingTop: 16, borderTop: "1px solid #3a3a3c",
          fontSize: 11, color: "#565758", textAlign: "center", letterSpacing: 1,
        }}>
          Model: supervised learning · entropy-optimal training data
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}