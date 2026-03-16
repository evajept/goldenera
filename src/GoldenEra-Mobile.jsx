import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════
// GOLDEN ERA - Angkhana's Daily Companion
// Mobile-first, motivating, simple
// ═══════════════════════════════════════════════════

const PROTOCOL_START = "2026-03-02";
const BASELINE = { glucose: 211, hba1c: 9.4, trig: 702, ggt: 184, weight: 73.6 };

const safeStorage = {
  getItem: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// Seed data from actual tracker (Days 1-15)
const SEED = {
  "2026-03-02": { glucFast:"180", m1t:"7:00", mLast:"17:00", moveAfter:"x2", act:"walk", berb:"0", fish:"0", mag:"0", d3k2:"0", sleep:"<7", noSweet:false, fiberFirst:false, water:true, probio:true },
  "2026-03-03": { glucFast:"170", m1t:"7:00", mLast:"19:00", moveAfter:"x1", act:"walk", berb:"0", fish:"0", mag:"0", d3k2:"0", sleep:"<7", noSweet:true, fiberFirst:false, water:true, probio:true },
  "2026-03-04": { glucFast:"160", m1t:"7:00", mLast:"17:00", moveAfter:"x1", act:"walk", berb:"x1", fish:"x1", mag:"0", d3k2:"0", sleep:"<7", noSweet:true, fiberFirst:true, water:false, probio:true },
  "2026-03-05": { glucFast:"142", m1t:"7:00", mLast:"16:00", moveAfter:"x1", act:"walk", berb:"x1", fish:"x1", mag:"0", d3k2:"0", sleep:"<7", noSweet:true, fiberFirst:true, water:true, probio:true },
  "2026-03-06": { glucFast:"140", m1t:"7:00", mLast:"16:00", moveAfter:"x1", act:"walk", berb:"x2", fish:"x2", mag:"0", d3k2:"0", sleep:"<7", noSweet:true, fiberFirst:true, water:false, probio:true },
  "2026-03-07": { glucFast:"147", glucPost:"180", m1t:"7:00", mLast:"16:00", moveAfter:"x1", act:"walk", berb:"x1", fish:"x1", mag:"0", d3k2:"0", sleep:"<7", noSweet:true, fiberFirst:true, water:true, probio:true },
  "2026-03-08": { glucFast:"150", glucPost:"217", glucNight:"140", m1t:"7:00", mLast:"18:30", moveAfter:"x2", act:"walk", berb:"x2", fish:"x1", mag:"0", d3k2:"0", sleep:"<6", noSweet:true, fiberFirst:true, water:true, probio:true, weight:"71.8" },
  "2026-03-09": { glucFast:"150", glucPost:"150", glucNight:"137", m1t:"7:00", mLast:"16:00", moveAfter:"x2", act:"walk", berb:"x2", fish:"x3", mag:"0", d3k2:"0", sleep:"<7", noSweet:true, fiberFirst:true, water:true, probio:true },
  "2026-03-10": { glucFast:"123", glucPost:"160", glucNight:"131", m1t:"7:00", mLast:"16:00", moveAfter:"x1", act:"walk", berb:"x2", fish:"x3", mag:"0", d3k2:"0", sleep:"7+", noSweet:true, fiberFirst:true, water:true, probio:true },
  "2026-03-11": { glucFast:"120", glucPost:"143", glucNight:"127", m1t:"7:00", mLast:"16:15", moveAfter:"x2", act:"walk", berb:"x2", fish:"x3", mag:"x2", d3k2:"0", sleep:"7+", noSweet:true, fiberFirst:true, water:true, probio:false },
  "2026-03-12": { glucFast:"123", glucPost:"150", glucNight:"137", m1t:"6:30", mLast:"16:00", moveAfter:"x2", act:"walk", berb:"x2", fish:"x3", mag:"x2", d3k2:"x1", sleep:"<7", noSweet:true, fiberFirst:true, water:true, probio:false },
  "2026-03-13": { glucFast:"115", glucPost:"163", glucNight:"120", m1t:"6:15", mLast:"15:30", moveAfter:"x2", act:"cardio", berb:"x2", fish:"x3", mag:"x2", d3k2:"x2", sleep:"7+", noSweet:true, fiberFirst:true, water:true, probio:true },
  "2026-03-14": { glucFast:"118", glucPost:"140", glucNight:"115", m1t:"10:30", mLast:"16:30", moveAfter:"x1", act:"cardio", berb:"x2", fish:"x3", mag:"x2", d3k2:"x2", sleep:"7+", noSweet:true, fiberFirst:true, water:false, probio:true },
  "2026-03-15": { glucFast:"108", glucNight:"109", m1t:"11:00", mLast:"17:00", moveAfter:"x3", act:"cardio", berb:"x2", fish:"x3", mag:"x2", d3k2:"x1", sleep:"7+", noSweet:false, fiberFirst:true, water:true, probio:true, weight:"70.9" },
  "2026-03-16": { glucFast:"95", glucPost:"170" },
};

// Google Sheets API
const SHEET_API = "https://script.google.com/macros/s/AKfycbzm0jOVWmqFcrJw91GdhEMiOJE3AvJ7gLQVGNOL6xs3F9EHmHj-kEwO-06p7mwEviE/exec";
const saveQueue = {};
let saveTimer = null;
const queueSave = (date, data) => {
  saveQueue[date] = { ...saveQueue[date], ...data };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const payload = { ...saveQueue };
    Object.keys(saveQueue).forEach(k => delete saveQueue[k]);
    Object.entries(payload).forEach(([d, vals]) => {
      fetch(SHEET_API, { method: "POST", body: JSON.stringify({ date: d, tracker: vals }), headers: { "Content-Type": "text/plain" } }).catch(() => {});
    });
  }, 2000);
};

const getDayNum = (date) => {
  const d = date ? new Date(date) : new Date();
  return Math.max(0, Math.floor((d - new Date(PROTOCOL_START)) / (1000 * 60 * 60 * 24)) + 1);
};

const today = () => new Date().toISOString().split("T")[0];

export default function GoldenEraMobile() {
  const [data, setData] = useState(() => {
    try {
      const s = safeStorage.getItem("gem_data");
      const stored = s ? JSON.parse(s) : {};
      // Merge seed with stored (stored takes priority for fields that exist)
      const merged = { ...SEED };
      Object.entries(stored).forEach(([date, vals]) => {
        merged[date] = { ...(merged[date] || {}), ...vals };
      });
      return merged;
    } catch { return { ...SEED }; }
  });
  const [view, setView] = useState("home"); // home | log | history | learn
  const [analyzing, setAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState(null);
  const [celebrate, setCelebrate] = useState(null);
  const [logDate, setLogDate] = useState(today());
  const [syncing, setSyncing] = useState(false);

  // Sync from Google Sheets on mount
  useEffect(() => {
    const loadFromSheet = async () => {
      setSyncing(true);
      try {
        const res = await fetch(SHEET_API + "?action=getAll");
        if (res.ok) {
          const sheetData = await res.json();
          if (sheetData && typeof sheetData === "object" && Object.keys(sheetData).length > 0) {
            setData(prev => {
              const merged = { ...SEED, ...prev };
              Object.entries(sheetData).forEach(([date, vals]) => {
                if (vals && typeof vals === "object") {
                  merged[date] = { ...(merged[date] || {}), ...vals };
                }
              });
              return merged;
            });
          }
        }
      } catch (e) { /* Sheet sync failed, using seed + local data */ }
      setSyncing(false);
    };
    loadFromSheet();
  }, []);

  // Persist
  useEffect(() => { safeStorage.setItem("gem_data", JSON.stringify(data)); }, [data]);

  const td = data[logDate] || {};
  const dayNum = getDayNum(logDate);
  const isToday = logDate === today();

  // Helper to update today's data
  const set = (field, val) => {
    setData(prev => {
      const updated = { ...prev, [logDate]: { ...prev[logDate], [field]: val } };
      // Queue save to sheets
      queueSave(logDate, { [field]: val });
      return updated;
    });
  };

  // Toggle helper
  const toggle = (field) => set(field, td[field] ? false : true);
  const cycle = (field, opts) => {
    const cur = td[field] || opts[0];
    const idx = opts.indexOf(cur);
    set(field, opts[(idx + 1) % opts.length]);
  };

  // Calculate score
  const getScore = () => {
    let s = 0;
    if (td.glucFast) {
      const g = Number(td.glucFast);
      if (g <= 99) s += 25; else if (g <= 110) s += 20; else if (g <= 126) s += 15; else if (g <= 140) s += 10; else if (g <= 160) s += 5;
    }
    if (td.berb === "x2") s += 12; else if (td.berb === "x1") s += 6;
    if (td.fish === "x3") s += 8; else if (td.fish === "x2") s += 6; else if (td.fish === "x1") s += 3;
    if (td.mag === "x2" || td.mag === "x3") s += 5; else if (td.mag === "x1") s += 3;
    if (td.d3k2 === "x2") s += 5; else if (td.d3k2 === "x1") s += 3;
    if (td.sleep === "8+") s += 15; else if (td.sleep === "7+") s += 12; else if (td.sleep === "<7") s += 4;
    if (td.noSweet) s += 8;
    if (td.fiberFirst) s += 5;
    if (td.water) s += 3;
    if (td.moveAfter) s += 5;
    if (td.act && td.act !== "none" && td.act !== "rest") s += 7;
    return s;
  };

  // Streak
  const getStreak = () => {
    let streak = 0;
    const d = new Date();
    for (let i = 0; i < 90; i++) {
      const ds = d.toISOString().split("T")[0];
      const dd = data[ds];
      if (dd && (dd.glucFast || dd.berb || dd.sleep)) streak++;
      else if (i > 0) break;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  };

  // Milestones
  const checkMilestones = () => {
    if (!td.glucFast) return;
    const g = Number(td.glucFast);
    const yesterday = new Date(logDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const prevG = Number(data[yesterday.toISOString().split("T")[0]]?.glucFast);
    if (g < 100 && (!prevG || prevG >= 100)) return "Fasting under 100! Normal range!";
    if (g < 110 && prevG >= 120) return `Dropped to ${g}! Down ${BASELINE.glucose - g} from baseline!`;
    if (dayNum === 30) return "Day 30 milestone! One-third complete!";
    if (dayNum === 60) return "Day 60! Two-thirds of the journey!";
    return null;
  };

  // AI Analysis
  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const prev = (() => { const d = new Date(logDate); d.setDate(d.getDate() - 1); return data[d.toISOString().split("T")[0]] || {}; })();
      const trend3 = [];
      for (let i = 3; i >= 1; i--) {
        const d = new Date(logDate); d.setDate(d.getDate() - i);
        const ds = d.toISOString().split("T")[0]; const dd = data[ds] || {};
        if (dd.glucFast) trend3.push({ day: `${i}d ago`, fasting: dd.glucFast, sleep: dd.sleep || "-" });
      }
      const payload = { dayNumber: dayNum, date: logDate, today: td, yesterday: prev, trend: trend3, baseline: BASELINE };
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 600,
          system: `You are a friendly health coach for Angkhana's 90-day metabolic wellness protocol. She is Thai, 32F, baseline: fasting glucose 211, HbA1C 9.4%, trig 702. Supplements: berberine x2, fish oil x3, Mg x2, D3+K2. Protocol: IF, fiber first, no sugar, post-meal walks.

Given today's data, write a SHORT motivating daily summary (2-3 sentences max). Be warm, specific to her numbers, and encouraging. Mention what went well first. If something needs attention, frame it positively.

Then list 2-3 quick insights as JSON.

Respond ONLY with JSON, no markdown:
{"summary":"Your warm 2-3 sentence summary here","insights":[{"icon":"emoji","text":"Short insight","type":"win|tip|watch"}]}

"win" = green/positive, "tip" = amber/suggestion, "watch" = red/concern. Always put wins first.`,
          messages: [{ role: "user", content: JSON.stringify(payload) }]
        })
      });
      const r = await res.json();
      const text = (r.content || []).map(c => c.text || "").join("").replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(text);
      setAiInsight(parsed);
      const milestone = checkMilestones();
      if (milestone) setCelebrate(milestone);
    } catch (e) { console.error(e); setAiInsight({ summary: "Could not connect. Your data is saved!", insights: [] }); }
    setAnalyzing(false);
  };

  // Auto-analyze when logging is complete enough
  useEffect(() => {
    if (isToday && td.glucFast && td.sleep && !aiInsight && !analyzing) {
      const timer = setTimeout(() => runAnalysis(), 500);
      return () => clearTimeout(timer);
    }
  }, [td.glucFast, td.sleep]);

  // Theme - warm, organic
  const c = {
    bg: "#FBF8F4", card: "#FFFFFF", accent: "#C17B3A", accentLight: "#F5E6D3",
    green: "#4A7C59", greenBg: "#EDF5F0", greenLight: "#D4E8DB",
    amber: "#B8860B", amberBg: "#FFF8E7",
    red: "#C05746", redBg: "#FDE8E4",
    text: "#2D2418", textMuted: "#8B7D6B", textLight: "#B5A899",
    border: "#E8DFD4", shadow: "0 2px 12px rgba(45,36,24,0.06)",
    font: "'Source Serif 4', Georgia, serif",
  };

  const typeColor = { win: c.green, tip: c.amber, watch: c.red };
  const typeBg = { win: c.greenBg, tip: c.amberBg, watch: c.redBg };

  // ── Components ──
  const Btn = ({ children, active, onClick, style: s }) => (
    <button onClick={onClick} style={{
      padding: "10px 16px", fontSize: 15, fontWeight: 600, fontFamily: c.font,
      background: active ? c.accent : c.card, color: active ? "#fff" : c.text,
      border: `1.5px solid ${active ? c.accent : c.border}`, borderRadius: 12,
      cursor: "pointer", transition: "all 0.2s", ...s
    }}>{children}</button>
  );

  const ToggleBtn = ({ label, icon, active, onClick }) => (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "12px 8px", minWidth: 72, borderRadius: 14,
      background: active ? c.greenLight : c.card, border: `1.5px solid ${active ? c.green : c.border}`,
      cursor: "pointer", transition: "all 0.2s", fontFamily: c.font
    }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: active ? c.green : c.textMuted }}>{label}</span>
      {active && <span style={{ fontSize: 10, color: c.green, fontWeight: 700 }}>Done</span>}
    </button>
  );

  const SuppBtn = ({ label, icon, field, opts }) => {
    const val = td[field] || "0";
    const isActive = val !== "0";
    return (
      <button onClick={() => { const idx = opts.indexOf(val); set(field, opts[(idx + 1) % opts.length]); }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          padding: "12px 8px", minWidth: 72, borderRadius: 14, flex: 1,
          background: isActive ? c.greenLight : c.card, border: `1.5px solid ${isActive ? c.green : c.border}`,
          cursor: "pointer", transition: "all 0.2s", fontFamily: c.font
        }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? c.green : c.textMuted }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: isActive ? c.green : c.textLight }}>{val === "0" ? "Tap" : val}</span>
      </button>
    );
  };

  const score = getScore();
  const streak = getStreak();
  const progress = Math.min(100, Math.round(dayNum / 90 * 100));

  // ═══ RENDER ═══
  return (
    <div style={{ minHeight: "100vh", background: c.bg, fontFamily: c.font, color: c.text, maxWidth: 480, margin: "0 auto" }}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />

      {/* ── Celebration overlay ── */}
      {celebrate && (
        <div onClick={() => setCelebrate(null)} style={{
          position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.4)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 24
        }}>
          <div style={{
            background: c.card, borderRadius: 24, padding: "32px 28px", textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)", maxWidth: 320
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.accent, marginBottom: 8 }}>Milestone!</div>
            <div style={{ fontSize: 16, color: c.text, lineHeight: 1.6 }}>{celebrate}</div>
            <button onClick={() => setCelebrate(null)} style={{
              marginTop: 20, padding: "10px 32px", background: c.accent, color: "#fff",
              border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: c.font
            }}>Amazing!</button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: c.accent }}>Golden Era</div>
          <div style={{ fontSize: 12, color: c.textMuted }}>Day {getDayNum()} of 90</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {syncing && <div style={{ padding: "4px 10px", background: c.accentLight, borderRadius: 20, fontSize: 11, fontWeight: 600, color: c.accent }}>Syncing...</div>}
          {streak > 1 && <div style={{
            padding: "4px 10px", background: c.greenBg, borderRadius: 20, fontSize: 12, fontWeight: 700, color: c.green
          }}>🔥 {streak} day streak</div>}
        </div>
      </div>

      {/* ── 90-day progress bar ── */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ height: 6, background: c.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${c.accent}, ${c.green})`, borderRadius: 3, transition: "width 0.5s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
          <span style={{ fontSize: 10, color: c.textLight }}>Day 1</span>
          <span style={{ fontSize: 10, color: c.textMuted, fontWeight: 600 }}>{progress}%</span>
          <span style={{ fontSize: 10, color: c.textLight }}>Day 90</span>
        </div>
      </div>

      {/* ═══ HOME VIEW ═══ */}
      {view === "home" && (
        <div style={{ padding: "0 20px 100px" }}>

          {/* Score card */}
          <div style={{
            background: c.card, borderRadius: 20, padding: "24px 20px", marginBottom: 16,
            boxShadow: c.shadow, textAlign: "center"
          }}>
            <div style={{ fontSize: 13, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Today's Score</div>
            <div style={{ fontSize: 56, fontWeight: 800, color: score >= 80 ? c.green : score >= 50 ? c.amber : c.red, lineHeight: 1 }}>{score || "-"}</div>
            <div style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}>{score >= 80 ? "Full send! Keep going" : score >= 50 ? "Solid effort today" : score > 0 ? "Log more to boost your score" : "Start logging to see your score"}</div>

            {/* Quick stats */}
            {td.glucFast && (
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${c.border}` }}>
                <div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>Fasting</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: Number(td.glucFast) <= 99 ? c.green : Number(td.glucFast) <= 126 ? c.amber : c.red }}>{td.glucFast}</div>
                </div>
                {td.glucPost && <div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>Post-meal</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: Number(td.glucPost) <= 140 ? c.green : Number(td.glucPost) <= 180 ? c.amber : c.red }}>{td.glucPost}</div>
                </div>}
                <div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>Supps</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: (td.berb && td.berb !== "0" && td.fish && td.fish !== "0") ? c.green : c.amber }}>
                    {[td.berb, td.fish, td.mag, td.d3k2].filter(v => v && v !== "0").length}/4
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* AI Insight */}
          {aiInsight && (
            <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 16, boxShadow: c.shadow }}>
              <div style={{ fontSize: 14, color: c.text, lineHeight: 1.7, marginBottom: 12 }}>{aiInsight.summary}</div>
              {(aiInsight.insights || []).map((ins, i) => (
                <div key={i} style={{
                  display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 12px", marginBottom: 6,
                  background: typeBg[ins.type] || c.greenBg, borderRadius: 10
                }}>
                  <span style={{ fontSize: 16 }}>{ins.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: typeColor[ins.type] || c.text }}>{ins.text}</span>
                </div>
              ))}
            </div>
          )}

          {analyzing && (
            <div style={{ background: c.card, borderRadius: 20, padding: "24px 20px", marginBottom: 16, boxShadow: c.shadow, textAlign: "center" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✨</div>
              <div style={{ fontSize: 14, color: c.textMuted }}>Analyzing your day...</div>
            </div>
          )}

          {/* Log today button */}
          <button onClick={() => { setLogDate(today()); setView("log"); }} style={{
            width: "100%", padding: "18px", background: c.accent, color: "#fff",
            border: "none", borderRadius: 16, fontSize: 17, fontWeight: 700,
            cursor: "pointer", fontFamily: c.font, boxShadow: "0 4px 16px rgba(193,123,58,0.3)",
            marginBottom: 12
          }}>
            {td.glucFast ? "✏️ Edit Today's Log" : "📝 Log Today"}
          </button>

          {/* Quick re-analyze */}
          {td.glucFast && (
            <button onClick={runAnalysis} disabled={analyzing} style={{
              width: "100%", padding: "14px", background: c.card, color: c.accent,
              border: `1.5px solid ${c.accent}`, borderRadius: 16, fontSize: 15, fontWeight: 700,
              cursor: analyzing ? "wait" : "pointer", fontFamily: c.font, marginBottom: 16,
              opacity: analyzing ? 0.6 : 1
            }}>
              {analyzing ? "⏳ Analyzing..." : "✨ Get AI Insights"}
            </button>
          )}

          {/* This week mini chart */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", boxShadow: c.shadow, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>This Week</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 80, gap: 4 }}>
              {(() => {
                const bars = [];
                const d = new Date();
                const dow = d.getDay(); // 0=Sun
                const mondayOffset = dow === 0 ? -6 : 1 - dow;
                for (let i = 0; i < 7; i++) {
                  const bd = new Date();
                  bd.setDate(bd.getDate() + mondayOffset + i);
                  const ds = bd.toISOString().split("T")[0];
                  const dd = data[ds];
                  const g = dd?.glucFast ? Number(dd.glucFast) : null;
                  const dayNames = ["M", "T", "W", "T", "F", "S", "S"];
                  const isToday2 = ds === today();
                  bars.push(
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      {g && <span style={{ fontSize: 10, fontWeight: 700, color: g <= 99 ? c.green : g <= 126 ? c.amber : c.red }}>{g}</span>}
                      <div style={{
                        width: "100%", maxWidth: 32, borderRadius: 6,
                        height: g ? Math.max(12, ((250 - g) / 150) * 60) : 4,
                        background: g ? (g <= 99 ? c.green : g <= 126 ? `${c.amber}88` : `${c.red}66`) : c.border,
                        transition: "height 0.3s"
                      }} />
                      <span style={{ fontSize: 10, fontWeight: isToday2 ? 800 : 500, color: isToday2 ? c.accent : c.textLight }}>{dayNames[i]}</span>
                    </div>
                  );
                }
                return bars;
              })()}
            </div>
          </div>

          {/* ═══ WHERE AM I NOW - Journey Markers ═══ */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", boxShadow: c.shadow, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Where I Am Now</div>
            {(() => {
              // Get latest values from data
              const sortedDates = Object.keys(data).sort().reverse();
              const latestGluc = (() => { for (const ds of sortedDates) { if (data[ds]?.glucFast) return Number(data[ds].glucFast); } return null; })();
              const latestWeight = (() => { for (const ds of sortedDates) { if (data[ds]?.weight) return Number(data[ds].weight); } return null; })();

              // Markers: label, baseline, current, d30 pred, d60 pred, d90 target, unit, reverseDirection (lower is better)
              const markers = [
                { label: "Fasting Glucose", icon: "🩸", baseline: 211, current: latestGluc, d30: 105, d60: 95, target: 90, unit: "mg/dL", lower: true, zone: [
                  { max: 99, label: "Normal", color: c.green },
                  { max: 125, label: "Pre-diabetic", color: c.amber },
                  { max: 999, label: "Diabetic", color: c.red },
                ]},
                { label: "Weight", icon: "⚖️", baseline: 73.6, current: latestWeight, d30: 69, d60: 66, target: 63, unit: "kg", lower: true, zone: [] },
                { label: "HbA1C", icon: "📊", baseline: 9.4, current: null, d30: null, d60: 7.2, target: 6.0, unit: "%", lower: true, note: "Next check: Day 60", zone: [
                  { max: 5.6, label: "Normal", color: c.green },
                  { max: 6.4, label: "Pre-diabetic", color: c.amber },
                  { max: 99, label: "Diabetic", color: c.red },
                ]},
                { label: "Triglycerides", icon: "🧪", baseline: 702, current: null, d30: 350, d60: 200, target: 150, unit: "mg/dL", lower: true, note: "Next check: Day 30", zone: [
                  { max: 150, label: "Normal", color: c.green },
                  { max: 199, label: "Borderline", color: c.amber },
                  { max: 9999, label: "High", color: c.red },
                ]},
                { label: "Liver (GGT)", icon: "🫀", baseline: 184, current: null, d30: 100, d60: 60, target: 40, unit: "U/L", lower: true, note: "Next check: Day 30", zone: [
                  { max: 40, label: "Normal", color: c.green },
                  { max: 80, label: "Elevated", color: c.amber },
                  { max: 9999, label: "High", color: c.red },
                ]},
              ];

              return markers.map((m, mi) => {
                // Calculate position on bar (0% = baseline, 100% = target)
                const range = m.baseline - m.target; // for "lower is better"
                const currentPct = m.current != null ? Math.min(100, Math.max(0, ((m.baseline - m.current) / range) * 100)) : null;
                const d30Pct = m.d30 != null ? Math.min(100, Math.max(0, ((m.baseline - m.d30) / range) * 100)) : null;
                const d60Pct = m.d60 != null ? Math.min(100, Math.max(0, ((m.baseline - m.d60) / range) * 100)) : null;
                const currentColor = m.current != null ? (currentPct >= 80 ? c.green : currentPct >= 40 ? c.amber : c.red) : c.textLight;
                const currentZone = m.current != null && m.zone?.length ? m.zone.find(z => m.current <= z.max) : null;

                return (
                  <div key={mi} style={{ marginBottom: mi < markers.length - 1 ? 20 : 0 }}>
                    {/* Header row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 16 }}>{m.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: c.text }}>{m.label}</span>
                      </div>
                      {m.current != null ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: currentColor }}>{m.current}{m.unit === "kg" ? "" : ""}</span>
                          <span style={{ fontSize: 11, color: c.textMuted }}>{m.unit}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: c.textLight, fontStyle: "italic" }}>{m.note || "Pending"}</span>
                      )}
                    </div>

                    {/* Zone label */}
                    {currentZone && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: currentZone.color, marginBottom: 6 }}>
                        {currentZone.label} range {m.current != null && `- down ${Math.round(((m.baseline - m.current) / m.baseline) * 100)}% from baseline`}
                      </div>
                    )}

                    {/* Track */}
                    <div style={{ position: "relative", height: 20, marginBottom: 4 }}>
                      {/* Background track */}
                      <div style={{ position: "absolute", top: 8, left: 0, right: 0, height: 5, background: c.border, borderRadius: 3 }} />
                      {/* Filled portion */}
                      <div style={{ position: "absolute", top: 8, left: 0, width: `${currentPct ?? 0}%`, height: 5, background: `linear-gradient(90deg, ${c.accent}, ${currentColor})`, borderRadius: 3, transition: "width 0.5s" }} />

                      {/* D30 prediction marker */}
                      {d30Pct != null && (
                        <div style={{ position: "absolute", left: `${d30Pct}%`, top: 2, transform: "translateX(-50%)" }}>
                          <div style={{ width: 1, height: 16, background: `${c.textLight}88` }} />
                        </div>
                      )}
                      {/* D60 prediction marker */}
                      {d60Pct != null && (
                        <div style={{ position: "absolute", left: `${d60Pct}%`, top: 2, transform: "translateX(-50%)" }}>
                          <div style={{ width: 1, height: 16, background: `${c.textLight}88` }} />
                        </div>
                      )}

                      {/* Current position dot */}
                      {currentPct != null && (
                        <div style={{ position: "absolute", left: `${currentPct}%`, top: 3, transform: "translateX(-50%)" }}>
                          <div style={{ width: 14, height: 14, borderRadius: "50%", background: currentColor, border: "2.5px solid #fff", boxShadow: `0 1px 4px ${currentColor}66` }} />
                        </div>
                      )}

                      {/* Target flag at 100% */}
                      <div style={{ position: "absolute", right: -2, top: 2 }}>
                        <span style={{ fontSize: 12 }}>🏁</span>
                      </div>
                    </div>

                    {/* Labels below track */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 10, color: c.textLight }}>
                        <div style={{ fontWeight: 600 }}>Baseline</div>
                        <div>{m.baseline}{m.unit === "%" ? "%" : ""}</div>
                      </div>
                      <div style={{ display: "flex", gap: 12 }}>
                        {d30Pct != null && <div style={{ fontSize: 10, color: c.textLight, textAlign: "center" }}>
                          <div>D30</div>
                          <div>{m.d30}</div>
                        </div>}
                        {d60Pct != null && <div style={{ fontSize: 10, color: c.textLight, textAlign: "center" }}>
                          <div>D60</div>
                          <div>{m.d60}</div>
                        </div>}
                      </div>
                      <div style={{ fontSize: 10, color: c.green, textAlign: "right" }}>
                        <div style={{ fontWeight: 600 }}>Goal</div>
                        <div>{m.target}{m.unit === "%" ? "%" : ""}</div>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* ═══ LOG VIEW ═══ */}
      {view === "log" && (
        <div style={{ padding: "0 20px 100px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={() => setView("home")} style={{ background: "none", border: "none", fontSize: 16, color: c.accent, cursor: "pointer", fontFamily: c.font, fontWeight: 700 }}>← Back</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.text }}>
              {isToday ? "Today" : new Date(logDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - Day {dayNum}
            </div>
            <div style={{ width: 50 }} />
          </div>

          {/* Glucose */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>🩸 Glucose</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["glucFast", "Fasting"], ["glucPost", "Post-meal"], ["glucNight", "Night"]].map(([f, l]) => (
                <div key={f} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6, textAlign: "center" }}>{l}</div>
                  <input type="number" inputMode="numeric" placeholder="mg/dL" value={td[f] || ""} onChange={e => set(f, e.target.value)}
                    style={{
                      width: "100%", padding: "12px 8px", fontSize: 18, fontWeight: 700, textAlign: "center",
                      border: `1.5px solid ${td[f] ? c.green : c.border}`, borderRadius: 12, background: td[f] ? c.greenBg : c.bg,
                      fontFamily: c.font, color: c.text, outline: "none", boxSizing: "border-box"
                    }} />
                </div>
              ))}
            </div>
          </div>

          {/* Supplements */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>💊 Supplements</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <SuppBtn label="Berberine" icon="🌿" field="berb" opts={["0", "x1", "x2"]} />
              <SuppBtn label="Fish Oil" icon="🐟" field="fish" opts={["0", "x1", "x2", "x3"]} />
              <SuppBtn label="Magnesium" icon="💊" field="mag" opts={["0", "x1", "x2", "x3"]} />
              <SuppBtn label="D3+K2" icon="☀️" field="d3k2" opts={["0", "x1", "x2"]} />
            </div>
          </div>

          {/* Sleep */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>😴 Sleep</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["<6", "<7", "7+", "8+"].map(opt => (
                <button key={opt} onClick={() => set("sleep", opt)} style={{
                  flex: 1, padding: "14px 8px", borderRadius: 12, fontSize: 16, fontWeight: 700,
                  background: td.sleep === opt ? (opt === "7+" || opt === "8+" ? c.greenLight : `${c.amber}22`) : c.bg,
                  border: `1.5px solid ${td.sleep === opt ? (opt === "7+" || opt === "8+" ? c.green : c.amber) : c.border}`,
                  color: td.sleep === opt ? (opt === "7+" || opt === "8+" ? c.green : c.amber) : c.textMuted,
                  cursor: "pointer", fontFamily: c.font, transition: "all 0.15s"
                }}>{opt}</button>
              ))}
            </div>
          </div>

          {/* Exercise & Movement */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>🏃 Movement</div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 10 }}>Exercise</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {["walk", "cardio", "weights", "swim", "stretch", "housework"].map(opt => (
                <button key={opt} onClick={() => set("act", td.act === opt ? "" : opt)} style={{
                  padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: td.act === opt ? c.greenLight : c.bg,
                  border: `1.5px solid ${td.act === opt ? c.green : c.border}`,
                  color: td.act === opt ? c.green : c.textMuted,
                  cursor: "pointer", fontFamily: c.font, textTransform: "capitalize"
                }}>{opt}</button>
              ))}
            </div>
            <div style={{ fontSize: 12, color: c.textMuted, marginBottom: 10 }}>After-meal walk</div>
            <div style={{ display: "flex", gap: 8 }}>
              {["x1", "x2", "x3"].map(opt => (
                <button key={opt} onClick={() => set("moveAfter", td.moveAfter === opt ? "" : opt)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: td.moveAfter === opt ? c.greenLight : c.bg,
                  border: `1.5px solid ${td.moveAfter === opt ? c.green : c.border}`,
                  color: td.moveAfter === opt ? c.green : c.textMuted,
                  cursor: "pointer", fontFamily: c.font
                }}>{opt}</button>
              ))}
            </div>
          </div>

          {/* Habits */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>✅ Daily Habits</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
              <ToggleBtn label="Fiber first" icon="🥗" active={td.fiberFirst} onClick={() => toggle("fiberFirst")} />
              <ToggleBtn label="No sugar" icon="🚫" active={td.noSweet} onClick={() => toggle("noSweet")} />
              <ToggleBtn label="Water 2L" icon="💧" active={td.water} onClick={() => toggle("water")} />
              <ToggleBtn label="Probiotics" icon="🦠" active={td.probio} onClick={() => toggle("probio")} />
            </div>
          </div>

          {/* Meals */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 14 }}>⏰ Meal Timing</div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6 }}>First meal</div>
                <input type="time" value={td.m1t || ""} onChange={e => set("m1t", e.target.value)}
                  style={{ width: "100%", padding: "10px", fontSize: 15, border: `1.5px solid ${c.border}`, borderRadius: 12, fontFamily: c.font, background: c.bg, color: c.text, boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: c.textMuted, marginBottom: 6 }}>Last meal</div>
                <input type="time" value={td.mLast || ""} onChange={e => set("mLast", e.target.value)}
                  style={{ width: "100%", padding: "10px", fontSize: 15, border: `1.5px solid ${c.border}`, borderRadius: 12, fontFamily: c.font, background: c.bg, color: c.text, boxSizing: "border-box" }} />
              </div>
            </div>
            {td.m1t && td.mLast && (() => {
              const [h1, m1] = td.m1t.split(":").map(Number);
              const [h2, m2] = td.mLast.split(":").map(Number);
              const eat = (h2 * 60 + m2) - (h1 * 60 + m1);
              const fast = 24 * 60 - eat;
              const fh = Math.floor(fast / 60), fm = fast % 60;
              return <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: fh >= 16 ? c.green : fh >= 14 ? c.amber : c.red, textAlign: "center" }}>
                IF: {fh}:{String(fm).padStart(2, "0")} fasting window {fh >= 16 ? "- Great!" : fh >= 14 ? "- Good" : "- Try to tighten"}
              </div>;
            })()}
          </div>

          {/* Notes */}
          <div style={{ background: c.card, borderRadius: 20, padding: "20px", marginBottom: 14, boxShadow: c.shadow }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: c.text, marginBottom: 10 }}>📝 Notes</div>
            <textarea placeholder="What did you eat? How do you feel? Any observations..." value={td.notes || ""} onChange={e => set("notes", e.target.value)}
              rows={3} style={{
                width: "100%", padding: 12, fontSize: 14, border: `1.5px solid ${c.border}`, borderRadius: 12,
                fontFamily: c.font, background: c.bg, color: c.text, resize: "vertical", boxSizing: "border-box", outline: "none"
              }} />
          </div>

          {/* Analyze button */}
          <button onClick={() => { runAnalysis(); setView("home"); }} style={{
            width: "100%", padding: "16px", background: c.accent, color: "#fff",
            border: "none", borderRadius: 16, fontSize: 16, fontWeight: 700,
            cursor: "pointer", fontFamily: c.font, boxShadow: "0 4px 16px rgba(193,123,58,0.3)"
          }}>
            ✨ Save & Analyze
          </button>
        </div>
      )}

      {/* ═══ HISTORY VIEW ═══ */}
      {view === "history" && (
        <div style={{ padding: "0 20px 100px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 16 }}>History</div>
          {Object.keys(data).sort().reverse().filter(ds => data[ds]?.glucFast).slice(0, 14).map(ds => {
            const dd = data[ds];
            const dn2 = getDayNum(ds);
            const g = Number(dd.glucFast);
            const sc = (() => { let s = 0; if (g <= 99) s += 25; else if (g <= 110) s += 20; else if (g <= 126) s += 15; else if (g <= 140) s += 10; return s; })();
            return (
              <button key={ds} onClick={() => { setLogDate(ds); setView("log"); }} style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "14px 16px", background: c.card, borderRadius: 14, marginBottom: 8,
                border: `1px solid ${c.border}`, cursor: "pointer", fontFamily: c.font, textAlign: "left"
              }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: g <= 99 ? c.greenBg : g <= 126 ? c.amberBg : c.redBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: g <= 99 ? c.green : g <= 126 ? c.amber : c.red }}>{g}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Day {dn2}</div>
                  <div style={{ fontSize: 12, color: c.textMuted }}>{new Date(ds).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 11, color: c.textMuted }}>{dd.sleep || "-"} sleep</div>
                  <div style={{ fontSize: 11, color: c.textMuted }}>{[dd.berb, dd.fish, dd.mag, dd.d3k2].filter(v => v && v !== "0").length}/4 supps</div>
                </div>
              </button>
            );
          })}
          {Object.keys(data).filter(ds => data[ds]?.glucFast).length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: c.textMuted }}>No data yet. Start logging!</div>
          )}
        </div>
      )}

      {/* ═══ LEARN VIEW ═══ */}
      {view === "learn" && (
        <div style={{ padding: "0 20px 100px" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: c.text, marginBottom: 16 }}>Quick Tips</div>
          {[
            { icon: "🥗", title: "Eat in order", text: "Fiber and veggies first, then protein, then fat, carbs LAST. Same food in different order = less spike." },
            { icon: "🚶", title: "Walk after meals", text: "Even 10 minutes right after eating drops glucose 20-40 points. The sooner, the better." },
            { icon: "🍚", title: "Be selective with carbs", text: "White rice spikes hard (+80-100). Complex carbs like potato and pumpkin spike less (+20-40) and recover faster." },
            { icon: "💊", title: "Take supps with food", text: "Berberine and fish oil work on the food you're eating. Mg and D3+K2 work best at bedtime." },
            { icon: "😴", title: "Sleep is medicine", text: "One bad night (<6h) can raise fasting glucose 15-30 points. Magnesium at bedtime helps." },
            { icon: "💧", title: "Stay hydrated", text: "Dehydration raises cortisol which raises glucose. Aim for 2L+ per day." },
            { icon: "🏋️", title: "Weight training", text: "Muscles absorb glucose for 48 hours after training. The biggest unused lever." },
            { icon: "🧊", title: "Spike rules", text: "Under +30: excellent. +30-50: manageable. +50-80: poor. +80+: alarm. Pancreas couldn't respond." },
          ].map((tip, i) => (
            <div key={i} style={{
              display: "flex", gap: 12, padding: "16px", background: c.card, borderRadius: 16,
              marginBottom: 10, boxShadow: c.shadow, alignItems: "flex-start"
            }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{tip.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: c.text, marginBottom: 4 }}>{tip.title}</div>
                <div style={{ fontSize: 13, color: c.textMuted, lineHeight: 1.6 }}>{tip.text}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Bottom Nav ── */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 480, margin: "0 auto",
        background: c.card, borderTop: `1px solid ${c.border}`,
        display: "flex", paddingTop: 8, paddingBottom: 20, zIndex: 100
      }}>
        {[
          { id: "home", icon: "🏠", label: "Home" },
          { id: "log", icon: "📝", label: "Log" },
          { id: "history", icon: "📊", label: "History" },
          { id: "learn", icon: "💡", label: "Learn" },
        ].map(t => (
          <button key={t.id} onClick={() => { if (t.id === "log") setLogDate(today()); setView(t.id); }} style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            background: "none", border: "none", cursor: "pointer", fontFamily: c.font, padding: "4px 0"
          }}>
            <span style={{ fontSize: 20, opacity: view === t.id ? 1 : 0.5 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: view === t.id ? 700 : 500, color: view === t.id ? c.accent : c.textMuted }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
