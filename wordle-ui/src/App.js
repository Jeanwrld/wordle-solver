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

const TILE_STATES = { 0: "grey", 1: "yellow", 2: "green" };
const TILE_LABELS = { 0: "⬜", 1: "🟨", 2: "🟩" };
const STATE_COLORS = {
  grey:    { bg: "#3a3a3c", text: "#ffffff", glow: "none" },
  yellow:  { bg: "#b59f3b", text: "#ffffff", glow: "0 0 16px #b59f3b66" },
  green:   { bg: "#538d4e", text: "#ffffff", glow: "0 0 16px #538d4e88" },
  empty:   { bg: "transparent", text: "#ffffff", glow: "none" },
  pending: { bg: "transparent", text: "#ffffff", glow: "none" },
};

// ─── Help Modal ───────────────────────────────────────────────────────────────
const pStyle = { margin: 0, fontSize: 13, color: "#818384", lineHeight: 1.7 };

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, color: "#538d4e", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10, fontWeight: 700 }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function HelpModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 100, padding: 16,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#1a1a1b", border: "1px solid #3a3a3c", borderRadius: 12,
        padding: "32px 28px", maxWidth: 480, width: "100%",
        maxHeight: "90vh", overflowY: "auto",
        fontFamily: "'Segoe UI', sans-serif", color: "#d7dadc",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, margin: 0, color: "#ffffff", letterSpacing: 2 }}>
            HOW TO USE
          </h2>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#818384", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <Section title="What is Wordle?">
          <p style={pStyle}>
            Wordle is a daily word puzzle by the New York Times. You get <b style={{ color: "#ffffff" }}>6 attempts</b> to
            guess a secret 5-letter word. After each guess, tiles change colour to show how close you were.
          </p>
          <a href="https://www.nytimes.com/games/wordle/index.html" target="_blank" rel="noreferrer"
            style={{ display: "inline-block", marginTop: 8, color: "#538d4e", fontSize: 13, letterSpacing: 1 }}>
            → Play Wordle on NYT ↗
          </a>
        </Section>

        <Section title="Colour Guide">
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
            {[
              { color: "#538d4e", label: "🟩 Green", desc: "Correct letter, correct position" },
              { color: "#b59f3b", label: "🟨 Yellow", desc: "Letter is in the word, wrong position" },
              { color: "#3a3a3c", label: "⬜ Grey",   desc: "Letter is not in the word at all" },
            ].map(({ color, label, desc }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 4, background: color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#ffffff" }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#818384" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="How to Use This App">
          <ol style={{ paddingLeft: 18, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              <> Open <a href="https://www.nytimes.com/games/wordle/index.html" target="_blank" rel="noreferrer" style={{ color: "#538d4e" }}>Wordle on NYT ↗</a> in another tab.</>,
              <> This app suggests <b style={{ color: "#ffffff" }}>CRANE</b> as your first guess. Type it into Wordle.</>,
              <> Look at the colours Wordle gives you. Come back here and click the suggestion to open the pattern picker.</>,
              <> Tap each tile to set its colour — once for yellow, twice for green, leave for grey. Hit <b style={{ color: "#ffffff" }}>Confirm</b>.</>,
              <> The AI calculates the next best guess. Repeat until you win!</>,
            ].map((step, i) => (
              <li key={i} style={{ fontSize: 13, color: "#d7dadc", lineHeight: 1.6 }}>{step}</li>
            ))}
          </ol>
        </Section>

        <Section title="About the AI">
          <p style={pStyle}>
            The solver uses a neural network trained on <b style={{ color: "#ffffff" }}>entropy-optimal</b> Wordle games.
            Each guess maximises the expected information gained — cutting remaining possible words in half as efficiently as possible.
          </p>
          <p style={{ ...pStyle, marginTop: 8 }}>
            Result: <b style={{ color: "#538d4e" }}>100% win rate</b> across all 2,315 Wordle answers, averaging <b style={{ color: "#538d4e" }}>3.46 guesses</b>.
          </p>
          <a href="https://github.com/Jeanwrld/wordle-solver" target="_blank" rel="noreferrer"
            style={{ display: "inline-block", marginTop: 8, color: "#538d4e", fontSize: 13, letterSpacing: 1 }}>
            → View source on GitHub ↗
          </a>
        </Section>

        <button onClick={onClose} style={{
          marginTop: 8, width: "100%", padding: "12px",
          background: "#538d4e", border: "none", borderRadius: 6,
          fontFamily: "'Archivo Black', sans-serif",
          fontSize: 14, color: "#ffffff", cursor: "pointer", letterSpacing: 2,
        }}>
          LET'S PLAY
        </button>
      </div>
    </div>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────
function Tile({ letter, colorState = "empty", size = 62 }) {
  const col = STATE_COLORS[colorState] || STATE_COLORS.empty;
  const hasBorder = colorState === "empty" || colorState === "pending";
  return (
    <div style={{
      width: size, height: size,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: col.bg,
      border: hasBorder ? `2px solid ${letter ? "#565758" : "#3a3a3c"}` : "2px solid transparent",
      borderRadius: 4, fontSize: size * 0.38, fontWeight: 700,
      fontFamily: "'Archivo Black', sans-serif", color: col.text,
      letterSpacing: 1, boxShadow: col.glow,
      transition: "background 0.25s ease, box-shadow 0.25s ease",
    }}>
      {(letter || "").toUpperCase()}
    </div>
  );
}

function GuessRow({ word, pattern, size = 62 }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Tile key={i} letter={word?.[i] || ""}
          colorState={pattern ? TILE_STATES[pattern[i]] : word?.[i] ? "pending" : "empty"}
          size={size} />
      ))}
    </div>
  );
}

function PatternSelector({ word, onConfirm, onCancel }) {
  const [pat, setPat] = useState([0, 0, 0, 0, 0]);
  const cycle = i => setPat(p => { const n = [...p]; n[i] = (n[i] + 1) % 3; return n; });
  return (
    <div style={{
      background: "#1a1a1b", border: "1px solid #3a3a3c", borderRadius: 12,
      padding: "20px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
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
        {[0,1,2].map(s => <span key={s}>{TILE_LABELS[s]} = {["Grey","Yellow","Green"][s]}</span>)}
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
    <div onClick={() => onClick(word)} style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 14px", borderRadius: 8, cursor: "pointer",
      background: "#1a1a1b", border: `1px solid ${isPossible ? "#538d4e55" : "#3a3a3c"}`,
      transition: "border-color 0.15s, background 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "#252526"; e.currentTarget.style.borderColor = isPossible ? "#538d4e" : "#565758"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "#1a1a1b"; e.currentTarget.style.borderColor = isPossible ? "#538d4e55" : "#3a3a3c"; }}
    >
      <span style={{ color: "#565758", fontFamily: "monospace", fontSize: 12, width: 20 }}>{rank}.</span>
      <span style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 17, letterSpacing: 3, color: isPossible ? "#538d4e" : "#d7dadc", flex: 1 }}>
        {word.toUpperCase()}
      </span>
      {isPossible && (
        <span style={{ fontSize: 10, color: "#538d4e", background: "#538d4e22", padding: "2px 6px", borderRadius: 4 }}>POSSIBLE</span>
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

function btnStyle(variant) {
  return {
    padding: "10px 24px",
    background: variant === "primary" ? "#538d4e" : "transparent",
    color: variant === "primary" ? "#ffffff" : "#818384",
    border: `1px solid ${variant === "primary" ? "#538d4e" : "#3a3a3c"}`,
    borderRadius: 6, fontFamily: "'Archivo Black', sans-serif",
    fontSize: 13, letterSpacing: 1, cursor: "pointer", transition: "background 0.15s",
  };
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [history, setHistory]             = useState([]);
  const [suggestions, setSuggestions]     = useState([]);
  const [, setCurrentSuggestion]          = useState("crane");
  const [possibleCount, setPossibleCount] = useState(2315);
  const [bitsLeft, setBitsLeft]           = useState(11.18);
  const [phase, setPhase]                 = useState("suggest");
  const [pendingWord, setPendingWord]     = useState("");
  const [inputWord, setInputWord]         = useState("");
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [showHelp, setShowHelp]           = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { loadSuggestion([]); }, []);

  const loadSuggestion = async (hist) => {
    setLoading(true); setError("");
    
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
    setError(""); setPendingWord(w); setInputWord(""); setPhase("pattern");
  }, []);

  const handlePatternConfirm = useCallback(async (pattern) => {
    const isWin = pattern.every(p => p === 2);
    const newHistory = [...history, { word: pendingWord, pattern }];
    setHistory(newHistory); setPendingWord("");
    if (isWin) { setPhase("solved"); return; }
    if (newHistory.length >= 6) { setPhase("failed"); return; }
    setPhase("suggest");
    await loadSuggestion(newHistory);
  }, [history, pendingWord]);

  const handleReset = () => {
    setHistory([]); setSuggestions([]); setPendingWord("");
    setInputWord(""); setPhase("suggest"); setError("");
    loadSuggestion([]);
  };

  const progressPct = 1 - possibleCount / 2315;

  return (
    <div style={{
      minHeight: "100vh", background: "#121213", color: "#d7dadc",
      fontFamily: "'Segoe UI', sans-serif",
      display: "flex", justifyContent: "center", padding: "24px 16px 48px",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        * { box-sizing: border-box; }
        input::placeholder { color: #565758; }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #3a3a3c; border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      <div style={{ width: "100%", maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: "1px solid #3a3a3c", paddingBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#818384", letterSpacing: 4, textTransform: "uppercase", marginBottom: 6 }}>
            Neural Network · Entropy Strategy
          </div>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 36, margin: 0, letterSpacing: 4, color: "#ffffff" }}>
            WORDLE<span style={{ color: "#538d4e" }}>.</span>AI
          </h1>
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
            <button onClick={() => setShowHelp(true)} style={{
              background: "transparent", border: "1px solid #3a3a3c",
              color: "#818384", padding: "4px 12px", borderRadius: 4,
              fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#538d4e"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#3a3a3c"}
            >HOW?</button>
            <button onClick={handleReset} style={{
              background: "transparent", border: "1px solid #3a3a3c",
              color: "#818384", padding: "4px 12px", borderRadius: 4,
              fontSize: 11, cursor: "pointer", fontFamily: "inherit", letterSpacing: 1,
            }}>NEW</button>
          </div>
        </div>

        {/* Board */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, marginBottom: 28 }}>
          {Array.from({ length: 6 }).map((_, ri) => {
            const isHistory = ri < history.length;
            const isPending = !isHistory && phase === "pattern" && ri === history.length;
            return (
              <GuessRow key={ri}
                word={isHistory ? history[ri].word : isPending ? pendingWord : ""}
                pattern={isHistory ? history[ri].pattern : null}
              />
            );
          })}
        </div>

        {/* Pattern picker */}
        {phase === "pattern" && (
          <div style={{ marginBottom: 24 }}>
            <PatternSelector word={pendingWord} onConfirm={handlePatternConfirm}
              onCancel={() => { setPendingWord(""); setPhase("suggest"); }} />
          </div>
        )}

        {/* Solved */}
        {phase === "solved" && (
          <div style={{
            background: "#0d2b0d", border: "1px solid #538d4e", borderRadius: 10,
            padding: "20px 24px", textAlign: "center", marginBottom: 24, boxShadow: "0 0 40px #538d4e22",
          }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>🎉</div>
            <div style={{ fontFamily: "'Archivo Black', sans-serif", fontSize: 22, color: "#538d4e", letterSpacing: 2 }}>SOLVED</div>
            <div style={{ color: "#818384", fontSize: 13, marginTop: 4 }}>in {history.length} {history.length === 1 ? "guess" : "guesses"}</div>
          </div>
        )}

        {/* Failed */}
        {phase === "failed" && (
          <div style={{
            background: "#2b0d0d", border: "1px solid #e74c3c",
            borderRadius: 10, padding: "16px 24px", textAlign: "center", marginBottom: 24,
          }}>
            <div style={{ color: "#e74c3c", fontFamily: "'Archivo Black', sans-serif", letterSpacing: 2 }}>OUT OF GUESSES</div>
            <div style={{ color: "#818384", fontSize: 12, marginTop: 4 }}>Press NEW to try again</div>
          </div>
        )}

        {/* Suggestions */}
        {phase === "suggest" && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, color: "#818384", letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>
              {loading ? "Thinking…" : history.length === 0 ? "Best openers" : "AI suggestions"}
            </div>
            {loading ? (
              <div style={{ textAlign: "center", color: "#538d4e", padding: 20 }}>
                <div style={{ fontSize: 24, display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map((s, i) => (
                  <SuggestionCard key={s.word} rank={i+1} word={s.word} entropy={s.entropy}
                    isPossible={s.is_possible} onClick={w => handleWordSubmit(w)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Input */}
        {phase === "suggest" && (
          <div>
            <div style={{ fontSize: 11, color: "#818384", letterSpacing: 3, marginBottom: 10, textTransform: "uppercase" }}>
              Or type your own
            </div>
            {error && <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <input ref={inputRef} value={inputWord}
                onChange={e => setInputWord(e.target.value.slice(0,5))}
                onKeyDown={e => e.key === "Enter" && handleWordSubmit(inputWord)}
                maxLength={5} placeholder="CRANE"
                style={{
                  flex: 1, background: "#1a1a1b", border: "1px solid #3a3a3c",
                  borderRadius: 6, padding: "12px 16px", color: "#ffffff",
                  fontFamily: "'Archivo Black', sans-serif",
                  fontSize: 18, letterSpacing: 4, textTransform: "uppercase",
                }}
              />
              <button onClick={() => handleWordSubmit(inputWord)}
                style={{ ...btnStyle("primary"), padding: "12px 22px", fontSize: 14 }}>
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
          <div style={{ marginTop: 6 }}>
            <a href="https://github.com/Jeanwrld/wordle-solver" target="_blank" rel="noreferrer"
              style={{ color: "#538d4e", textDecoration: "none", letterSpacing: 1 }}>
              ⌥ github.com/Jeanwrld/wordle-solver
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}