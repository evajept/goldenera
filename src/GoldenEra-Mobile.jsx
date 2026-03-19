import { useState, useEffect, useCallback, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   Golden Era Mobile - Synced with Desktop App
   Field names, scoring, Sheet API format all matched to desktop
   ═══════════════════════════════════════════════════════════════ */

const API = "https://script.google.com/macros/s/AKfycbxWHehS2Drs5gXKPuNv1u173pLu7Mr8ZOJ7KX5pEOS4L5K-X7HOeHBN1Cw9pUt5Byf2Hw/exec";
const START = new Date("2025-04-21");

// Theme - bold contrast
const t = {
  bg: "#E8E4DE", card: "#FDFCF9", tile: "#E8E3DB", on: "#C8DFC9",
  accent: "#4A7A50", dark: "#3D6842", text: "#1A1612", muted: "#8A7E72",
  sh: "0 2px 8px rgba(0,0,0,0.10)", shOn: "0 3px 10px rgba(74,122,80,0.20)",
  csh: "0 3px 16px rgba(0,0,0,0.08)", scoreBg: "rgba(74,122,80,0.6)",
  dotFill: "#FDFCF9",
};

// ─── Targets ───
const TARGETS = {
  glucose: { s: 128, g: 99, u: "mg/dL", l: "Fasting Glucose" },
  trig: { s: 265, g: 150, u: "mg/dL", l: "Triglycerides" },
  weight: { s: 79.4, g: 69, u: "kg", l: "Weight" },
  bmi: { s: 31.5, g: 27.4, u: "", l: "BMI" },
  hba1c: { s: 6.8, g: 5.7, u: "%", l: "HbA1C" },
  ggt: { s: 78, g: 35, u: "U/L", l: "GGT" },
};

// ─── Grid items with CYCLING values (matching desktop) ───
const GRID = [
  { id: "berberine", icon: "🌿", l: "Berb", field: "berb", cycle: ["0", "x1", "x2"] },
  { id: "fish_oil", icon: "🐟", l: "Fish", field: "fish", cycle: ["0", "x1", "x2", "x3"] },
  { id: "magnesium", icon: "💊", l: "Mag", field: "mag", cycle: ["0", "x1", "x2", "x3"] },
  { id: "d3k2", icon: "☀️", l: "D3K2", field: "d3k2", cycle: ["0", "x1", "x2"] },
  { id: "sleep", icon: "😴", l: "Sleep", field: "sleep", cycle: ["", "<6", "<7", "7+", "8+"] },
  { id: "walk", icon: "🚶", l: "Walk", field: "moveAfter", cycle: ["", "x1", "x2", "x3"] },
  { id: "fiber", icon: "🥗", l: "Fiber", field: "fiberFirst", cycle: [false, true] },
  { id: "no_sugar", icon: "🚫", l: "Sugar", field: "noSweet", cycle: [false, true] },
  { id: "water", icon: "💧", l: "Water", field: "water", cycle: [false, true] },
  { id: "probiotic", icon: "🧫", l: "Probio", field: "probio", cycle: [false, true] },
  { id: "holy_basil", icon: "🌱", l: "Basil", field: "basil", cycle: [false, true] },
  { id: "brazil_nut", icon: "🥜", l: "Brazil", field: "brazil", cycle: [false, true] },
];

// Exercise options (matching desktop: none/rest/walk/housework/stretch/cardio/weights)
const EXERCISES = ["walk", "cardio", "weights", "swim", "stretch", "housework"];

// ─── Helpers ───
const dayN = (d = new Date()) => Math.max(1, Math.floor((d - START) / 864e5) + 1);
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmtShort = (d = new Date()) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
const pctChange = (s, c) => (c != null && s ? ((c - s) / Math.abs(s) * 100).toFixed(1) : null);
const fmtPct = (v) => { if (v == null) return null; const n = parseFloat(v); return `${n > 0 ? "+" : ""}${v}%`; };

function calcIF(m1t, mLast) {
  if (!m1t || !mLast) return { ratio: "--:--", fasting: 0 };
  const [h1, mn1] = m1t.split(":").map(Number);
  const [h2, mn2] = mLast.split(":").map(Number);
  if (isNaN(h1) || isNaN(h2)) return { ratio: "--:--", fasting: 0 };
  const eatMins = (h2 * 60 + (mn2 || 0)) - (h1 * 60 + (mn1 || 0));
  if (eatMins <= 0) return { ratio: "--:--", fasting: 0 };
  const eating = Math.round(eatMins / 60);
  const fasting = 24 - eating;
  return { ratio: `${fasting}:${eating}`, fasting };
}

// ─── Impact-weighted score (exact match to desktop getDayScore) ───
function getDayScore(wd) {
  if (!wd) return null;
  const hasData = wd.glucFast || wd.berb || wd.fish || wd.act || wd.moveAfter || wd.noSweet || wd.fiberFirst || wd.water || wd.sleep || wd.mag || wd.d3k2 || wd.m1t || wd.mLast;
  if (!hasData) return null;
  let base = 0, bonus = 0;
  // No sugar (18)
  if (wd.noSweet) base += 18;
  // Berberine (15): x1=7, x2=15
  if (wd.berb === "x2") base += 15; else if (wd.berb === "x1") base += 7;
  // Sleep (14): 7+=14, <7=7, <6=0
  if (wd.sleep === "7+" || wd.sleep === "8+") base += 14; else if (wd.sleep === "<7") base += 7;
  // Fish Oil (10): x1=3, x2=6, x3=10
  if (wd.fish === "x3") base += 10; else if (wd.fish === "x2") base += 6; else if (wd.fish === "x1") base += 3;
  // Exercise (5 base) + bonuses
  if (wd.act && wd.act !== "none" && wd.act !== "0" && wd.act !== "") {
    base += 5;
    if (wd.act === "weights") bonus += 10;
    else if (wd.act === "cardio" || wd.act === "swim") bonus += 5;
  }
  // After meal move (8): x1=3, x2=6, x3=8
  if (wd.moveAfter === "x3") base += 8; else if (wd.moveAfter === "x2") base += 6; else if (wd.moveAfter === "x1") base += 3;
  // Meal window (8 base + bonuses)
  if (wd.m1t && wd.mLast) {
    const { fasting } = calcIF(wd.m1t, wd.mLast);
    if (fasting >= 16) { base += 8; bonus += 5; }
    else if (fasting >= 15) { base += 8; bonus += 2; }
    else if (fasting >= 14) base += 8;
    else if (fasting >= 13) base += 4;
  }
  // Fiber first (7)
  if (wd.fiberFirst) base += 7;
  // Water 2L (5)
  if (wd.water) base += 5;
  // Magnesium (5)
  if (wd.mag && wd.mag !== "0") base += 5;
  // D3+K2 (5)
  if (wd.d3k2 && wd.d3k2 !== "0") base += 5;
  // Probiotics (+2 bonus)
  if (wd.probio) bonus += 2;
  // Brazil nuts (+2 bonus)
  if (wd.brazil) bonus += 2;
  // Basil seeds (+2 bonus)
  if (wd.basil) bonus += 2;
  return { base, bonus, total: base + bonus };
}

// ─── Display value for grid tile ───
function gridDisplay(field, value) {
  if (field === "fiberFirst" || field === "noSweet" || field === "water" || field === "probio" || field === "basil" || field === "brazil") {
    return value ? "✓" : "";
  }
  if (field === "sleep") return value || "";
  if (!value || value === "0" || value === "") return "";
  return value;
}
function gridIsOn(field, value) {
  if (field === "fiberFirst" || field === "noSweet" || field === "water" || field === "probio" || field === "basil" || field === "brazil") return !!value;
  if (field === "sleep") return value && value !== "";
  return value && value !== "0" && value !== "";
}

// ─── API (matching desktop format) ───
async function apiGet() {
  try {
    const r = await fetch(`${API}?action=load&t=${Date.now()}`);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) { console.error("GET:", e); return null; }
}

let saveTimer = null;
function apiSave(date, data) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "saveDay", date, data }),
      });
    } catch (e) { console.error("POST:", e); }
  }, 2000);
}

// ─── HOME TAB ────────────────────────────────────────────
function HomeTab({ allData, loading }) {
  const day = dayN();
  const today = todayISO();

  // Get sorted dates
  const dates = Object.keys(allData).sort();
  const last7dates = dates.slice(-7);
  const latestDate = dates.length ? dates[dates.length - 1] : null;
  const latest = latestDate ? allData[latestDate] : {};
  const todayData = allData[today] || {};

  const gv = latest.glucFast ? parseFloat(latest.glucFast) : NaN;
  const tv = latest.triglycerides ? parseFloat(latest.triglycerides) : NaN;
  const wv = latest.weight ? parseFloat(latest.weight) : NaN;
  // Also check body meas for weight from desktop format
  const gPct = !isNaN(gv) ? fmtPct(pctChange(TARGETS.glucose.s, gv)) : null;
  const tPct = !isNaN(tv) ? fmtPct(pctChange(TARGETS.trig.s, tv)) : null;
  const wPct = !isNaN(wv) ? fmtPct(pctChange(TARGETS.weight.s, wv)) : null;

  // Streak
  let streak = 0;
  for (let i = dates.length - 1; i >= 0; i--) {
    const r = allData[dates[i]];
    if (r && (r.glucFast || r.berb || r.fish || r.noSweet || r.moveAfter)) streak++;
    else break;
  }

  // Today score
  const todayScore = getDayScore(todayData);
  const todayTotal = todayScore ? todayScore.total : 0;
  const todayFields = todayScore ? Math.min(7, Math.round(todayScore.base / 14.3)) : 0;

  // Week scores
  const weekScores = last7dates.map(d => getDayScore(allData[d]));
  const weekDays = last7dates.map(d => {
    try { return ["S", "M", "T", "W", "T", "F", "S"][new Date(d + "T00:00:00").getDay()]; } catch { return "?"; }
  });
  while (weekScores.length < 7) { weekScores.unshift(null); weekDays.unshift("-"); }

  // Glucose trend
  const glucoseEntries = last7dates.filter(d => allData[d]?.glucFast).map(d => ({
    val: parseFloat(allData[d].glucFast),
    day: (() => { try { return ["S", "M", "T", "W", "T", "F", "S"][new Date(d + "T00:00:00").getDay()]; } catch { return "?"; } })()
  })).filter(e => !isNaN(e.val));

  return (
    <div style={{ padding: "12px 14px 80px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 300, color: t.text, letterSpacing: "-0.03em" }}>{loading ? "..." : `Day ${day}`}</span>
          <span style={{ fontSize: 11, color: t.muted }}>{fmtShort()}</span>
        </div>
        <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>{streak > 0 && `\uD83D\uDD25 ${streak}`}</span>
      </div>

      <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
        {[
          { label: "Glucose", value: !isNaN(gv) ? gv : "--", unit: "mg/dL", change: gPct },
          { label: "Trig", value: !isNaN(tv) ? tv : "--", unit: "mg/dL", change: tPct },
          { label: "Weight", value: !isNaN(wv) ? wv : "--", unit: "kg", change: wPct },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, background: t.card, borderRadius: 14, padding: "12px 8px", boxShadow: t.csh, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: t.muted, marginBottom: 3 }}>{m.label}</div>
            <div style={{ fontSize: 26, fontWeight: 200, color: t.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 8, color: t.muted, marginTop: 2 }}>{m.unit}</div>
            {m.change && <div style={{ fontSize: 9, color: t.accent, fontWeight: 600, marginTop: 3 }}>{m.change}</div>}
          </div>
        ))}
      </div>

      {/* Today Score + Week bars */}
      <div style={{ background: t.card, borderRadius: 14, padding: "14px 16px", marginBottom: 12, boxShadow: t.csh }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 200, color: t.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{todayScore ? todayTotal : "--"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: t.muted }}>Today Score</span>
              <span style={{ fontSize: 10, color: t.accent, fontWeight: 600 }}>{todayTotal}/100+</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: t.tile, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, todayTotal)}%`, height: "100%", borderRadius: 2, background: t.accent, transition: "width 0.4s" }} />
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${t.tile}`, paddingTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {weekScores.slice(-7).map((sc, i) => {
              const total = sc ? sc.total : 0;
              const h = total > 0 ? Math.max(6, Math.round(total * 0.32)) : 4;
              return (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 20, height: 32, borderRadius: 6, margin: "0 auto 2px", background: t.tile, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", boxShadow: total > 0 ? t.sh : "none" }}>
                    <div style={{ width: "100%", height: h, borderRadius: "3px 3px 0 0", background: total >= 80 ? t.accent : total >= 40 ? t.scoreBg : "transparent" }} />
                  </div>
                  <div style={{ fontSize: 8, color: total > 0 ? t.muted : "#ccc" }}>{weekDays.slice(-7)[i] || "-"}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Glucose trend */}
      <div style={{ background: t.card, borderRadius: 14, padding: "14px 16px", boxShadow: t.csh }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: t.muted }}>Fasting Glucose Trend</span>
          <span style={{ fontSize: 9, color: t.accent, fontWeight: 600 }}>{glucoseEntries.length >= 2 ? `Last ${glucoseEntries.length} days` : "Last 7 days"}</span>
        </div>
        {glucoseEntries.length >= 2 ? (() => {
          const vals = glucoseEntries.map(e => e.val);
          const mn = Math.min(...vals) - 10, mx = Math.max(...vals) + 10, w = 250, h = 50;
          const pts = vals.map((v, i) => ({ x: (i / (vals.length - 1)) * w, y: h - ((v - mn) / (mx - mn)) * h, v }));
          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          const area = `${line} L${w},${h} L0,${h} Z`;
          return (
            <div>
              <svg width="100%" viewBox={`0 0 ${w} ${h + 10}`} style={{ display: "block", overflow: "visible" }}>
                <defs><linearGradient id="gm" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.accent} stopOpacity="0.3" /><stop offset="100%" stopColor={t.accent} stopOpacity="0" /></linearGradient></defs>
                <path d={area} fill="url(#gm)" />
                <path d={line} fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r={i === vals.length - 1 ? 4 : 2.5} fill={i === vals.length - 1 ? t.accent : t.dotFill} stroke={t.accent} strokeWidth={i === vals.length - 1 ? 2 : 1.5} />))}
                <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 8} textAnchor="middle" fontSize="9" fontWeight="600" fill={t.accent} fontFamily="DM Sans,sans-serif">{vals[vals.length - 1]}</text>
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                {glucoseEntries.map((e, i) => (<div key={i} style={{ flex: 1, textAlign: "center", fontSize: 8, color: i === glucoseEntries.length - 1 ? t.accent : t.muted, fontWeight: i === glucoseEntries.length - 1 ? 600 : 400 }}>{e.day}</div>))}
              </div>
            </div>
          );
        })() : (
          <div style={{ padding: "20px 0", textAlign: "center", fontSize: 11, color: t.muted }}>{loading ? "Loading..." : "Log glucose to see the trend"}</div>
        )}
      </div>
    </div>
  );
}

// ─── LOG TAB ──────────────────────────────────────────────
function LogTab({ allData, setAllData }) {
  const today = todayISO();
  const wd = allData[today] || {};

  // Update a field for today
  const up = (field, value) => {
    setAllData(prev => {
      const updated = { ...prev, [today]: { ...(prev[today] || {}), [field]: value } };
      apiSave(today, updated[today]);
      return updated;
    });
  };

  const { ratio, fasting: ifHours } = calcIF(wd.m1t, wd.mLast);
  const ratioActive = ratio !== "--:--";

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(API, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ action: "saveDay", date: today, data: wd }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const inp = {
    width: "100%", padding: "9px 4px", borderRadius: 10, border: "none",
    fontSize: 16, fontWeight: 300, textAlign: "center", color: t.text,
    fontFamily: "'DM Sans',sans-serif", background: t.tile, outline: "none",
    boxSizing: "border-box", boxShadow: t.sh,
  };

  return (
    <div style={{ padding: "12px 12px 80px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px", marginBottom: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 300, color: t.text }}>Log</span>
        <span style={{ fontSize: 10, color: t.accent, fontWeight: 600 }}>Day {dayN()}</span>
      </div>

      {/* Glucose + Meal times + IF ratio */}
      <div style={{ background: t.card, borderRadius: 18, padding: 16, marginBottom: 8, boxShadow: t.csh }}>
        <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
          {[["🩸", "Fasting", "glucFast"], ["🍽️", "Post-meal", "glucPost"], ["🌙", "Night", "glucNight"]].map(([icon, label, field], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: t.muted, marginBottom: 3 }}>{icon} {label}</div>
              <input inputMode="decimal" placeholder="-" value={wd[field] || ""}
                onChange={(e) => up(field, e.target.value)} style={inp} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {[["🍳", "First meal", "m1t"], ["🌅", "Last meal", "mLast"]].map(([icon, label, field], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 8, color: t.muted, marginBottom: 3 }}>{icon} {label}</div>
              <input type="time" value={wd[field] || ""} onChange={(e) => up(field, e.target.value)}
                style={{ ...inp, fontSize: 14 }} />
            </div>
          ))}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 8, color: t.muted, marginBottom: 3 }}>⏱️ IF ratio</div>
            <div style={{
              padding: "9px 4px", borderRadius: 10, textAlign: "center", fontSize: 16, fontWeight: 300,
              color: ratioActive ? t.accent : t.muted,
              background: ratioActive ? t.on : t.tile,
              boxShadow: ratioActive ? t.shOn : t.sh,
            }}>{ratio}</div>
          </div>
        </div>
      </div>

      {/* 4-col cycling grid */}
      <div style={{ background: t.card, borderRadius: 18, padding: 16, marginBottom: 8, boxShadow: t.csh }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
          {GRID.map((item) => {
            const currentVal = wd[item.field];
            const on = gridIsOn(item.field, currentVal);
            const display = gridDisplay(item.field, currentVal);

            const handleTap = () => {
              const cycle = item.cycle;
              const currentIdx = cycle.indexOf(currentVal);
              const nextIdx = (currentIdx + 1) % cycle.length;
              up(item.field, cycle[nextIdx]);
            };

            return (
              <div key={item.id} onClick={handleTap}
                style={{
                  textAlign: "center", padding: "8px 3px 5px", borderRadius: 12, cursor: "pointer",
                  background: on ? t.on : t.tile,
                  boxShadow: on ? t.shOn : t.sh,
                  transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
                }}>
                <div style={{ fontSize: 16, marginBottom: 1 }}>{item.icon}</div>
                <div style={{ fontSize: 7, color: on ? t.accent : t.muted, fontWeight: 600, lineHeight: 1 }}>{item.l}</div>
                {display && <div style={{ fontSize: 9, color: t.accent, fontWeight: 700, marginTop: 1, lineHeight: 1 }}>{display}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exercise pills (select one) */}
      <div style={{ background: t.card, borderRadius: 18, padding: "12px 16px", marginBottom: 8, boxShadow: t.csh }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13 }}>🏋️</span>
          {EXERCISES.map((ex) => {
            const on = wd.act === ex;
            return (
              <div key={ex} onClick={() => up("act", on ? "" : ex)}
                style={{
                  padding: "5px 12px", borderRadius: 18, fontSize: 10, cursor: "pointer",
                  background: on ? t.accent : t.tile, color: on ? "#fff" : t.muted,
                  fontWeight: on ? 600 : 400, boxShadow: on ? t.shOn : t.sh,
                  transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
                  textTransform: "capitalize",
                }}>{ex}</div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div style={{ background: t.card, borderRadius: 18, padding: "12px 16px", marginBottom: 8, boxShadow: t.csh }}>
        <textarea placeholder="📝 Notes..." rows={2} value={wd.notes || ""}
          onChange={(e) => up("notes", e.target.value)}
          style={{
            width: "100%", padding: "8px 10px", borderRadius: 10, border: "none",
            fontSize: 11, lineHeight: 1.5, color: t.text,
            fontFamily: "'DM Sans',sans-serif", background: t.tile, outline: "none",
            boxSizing: "border-box", boxShadow: t.sh, resize: "none",
          }} />
      </div>

      {/* Score preview */}
      {getDayScore(wd) && (
        <div style={{ textAlign: "center", marginBottom: 8, fontSize: 12, color: t.muted }}>
          Score: <b style={{ color: t.accent, fontSize: 14 }}>{getDayScore(wd).total}</b>
          <span style={{ fontSize: 10, marginLeft: 4 }}>({getDayScore(wd).base} base + {getDayScore(wd).bonus} bonus)</span>
        </div>
      )}

      {/* Save */}
      <div onClick={!saving ? handleSave : undefined}
        style={{
          padding: 12, borderRadius: 50, textAlign: "center",
          background: saved ? t.on : `linear-gradient(135deg, ${t.accent}, ${t.dark})`,
          color: saved ? t.accent : "#fff",
          fontSize: 12, fontWeight: 600, cursor: saving ? "wait" : "pointer",
          boxShadow: `0 6px 20px ${t.accent}40`,
          letterSpacing: "0.03em", opacity: saving ? 0.7 : 1, transition: "all 0.3s",
        }}>
        {saving ? "Saving..." : saved ? "\u2713 Saved!" : "\u2728 Save & Analyze"}
      </div>
    </div>
  );
}

// ─── JOURNEY TAB ──────────────────────────────────────────
function JourneyTab({ allData, loading }) {
  const dates = Object.keys(allData).sort();
  const findLatest = (key) => {
    for (let i = dates.length - 1; i >= 0; i--) {
      const v = parseFloat(allData[dates[i]]?.[key]);
      if (!isNaN(v)) return v;
    }
    return null;
  };

  const metrics = [
    { key: "glucose", cur: findLatest("glucFast"), tgt: TARGETS.glucose, fb: null },
    { key: "trig", cur: findLatest("triglycerides"), tgt: TARGETS.trig, fb: null },
    { key: "weight", cur: findLatest("weight"), tgt: TARGETS.weight, fb: null },
    { key: "bmi", cur: findLatest("bmi"), tgt: TARGETS.bmi, fb: null },
    { key: "hba1c", cur: findLatest("hba1c"), tgt: TARGETS.hba1c, fb: "Next: Day 30" },
    { key: "ggt", cur: findLatest("ggt"), tgt: TARGETS.ggt, fb: "Next: end Mar" },
  ];

  return (
    <div style={{ padding: "12px 14px 80px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ paddingTop: 12, marginBottom: 14 }}>
        <span style={{ fontSize: 20, fontWeight: 300, color: t.text, letterSpacing: "-0.03em" }}>Journey</span>
      </div>
      {metrics.map(({ key, cur, tgt, fb }) => {
        const pctVal = cur != null ? Math.min(100, Math.max(0, ((tgt.s - cur) / (tgt.s - tgt.g)) * 100)) : 0;
        const changeStr = cur != null ? fmtPct(pctChange(tgt.s, cur)) : null;
        let note = fb;
        if (cur != null) {
          if (key === "glucose" && cur < 100) note = "Normal range!";
          else if (key === "weight") note = `-${(tgt.s - cur).toFixed(1)} kg`;
          else if (changeStr) note = changeStr;
        }
        return (
          <div key={key} style={{ background: t.card, borderRadius: 12, padding: "12px 14px", marginBottom: 7, boxShadow: t.csh }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: t.text }}>{tgt.l}</span>
              <span style={{ fontSize: 14, fontWeight: 300, color: cur != null ? t.accent : t.muted }}>
                {cur ?? "---"} <span style={{ fontSize: 9, color: t.muted }}>{tgt.u}</span>
              </span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: t.tile, overflow: "hidden", marginBottom: 3 }}>
              <div style={{ width: `${pctVal}%`, height: "100%", borderRadius: 2, background: cur != null ? t.accent : "transparent", transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: t.muted }}>
              <span>{tgt.s} {"\u2192"} {tgt.g}{tgt.u}</span>
              {note && <span style={{ color: cur != null ? t.accent : t.muted, fontWeight: cur != null ? 600 : 400 }}>{note}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────
function Nav({ tab, setTab }) {
  return (
    <div style={{
      position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
      width: "100%", maxWidth: 430, height: 52,
      background: t.card, display: "flex", justifyContent: "space-around", alignItems: "center",
      boxShadow: "0 -2px 10px rgba(0,0,0,0.06)",
      zIndex: 100, borderRadius: "18px 18px 0 0",
      paddingBottom: "max(0px, env(safe-area-inset-bottom))",
    }}>
      {[
        { key: "home", icon: "\u2299", label: "Home" },
        { key: "log", icon: "+", label: "Log" },
        { key: "journey", icon: "\u2197", label: "Journey" },
      ].map(({ key, icon, label }) => (
        <div key={key} onClick={() => setTab(key)}
          style={{ textAlign: "center", cursor: "pointer", padding: "6px 14px", WebkitTapHighlightColor: "transparent" }}>
          <div style={{ fontSize: 16, color: tab === key ? t.accent : "#ccc", marginBottom: 1 }}>{icon}</div>
          <div style={{ fontSize: 8, color: tab === key ? t.accent : t.muted, fontWeight: tab === key ? 600 : 400 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────
export default function GoldenEraMobile() {
  const [tab, setTab] = useState("home");
  const [allData, setAllData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    const res = await apiGet();
    if (res) {
      // Desktop format: { tracker: { "2026-03-10": { glucFast: "120", ... }, ... }, body: { ... } }
      if (res.tracker && typeof res.tracker === "object") {
        setAllData(res.tracker);
      } else if (Array.isArray(res)) {
        // Legacy array format: convert to keyed object
        const obj = {};
        res.forEach(r => { if (r.date) obj[r.date] = r; });
        setAllData(obj);
      } else if (res.data && Array.isArray(res.data)) {
        const obj = {};
        res.data.forEach(r => { if (r.date) obj[r.date] = r; });
        setAllData(obj);
      }
    } else {
      setError(true);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div style={{
      fontFamily: "'DM Sans',sans-serif", background: t.bg, color: t.text,
      minHeight: "100dvh", maxWidth: 430, margin: "0 auto", position: "relative",
      overflowX: "hidden", WebkitFontSmoothing: "antialiased",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />

      <div style={{ minHeight: "calc(100dvh - 52px)" }}>
        {tab === "home" && <HomeTab allData={allData} loading={loading} />}
        {tab === "log" && <LogTab allData={allData} setAllData={setAllData} />}
        {tab === "journey" && <JourneyTab allData={allData} loading={loading} />}
      </div>

      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}
