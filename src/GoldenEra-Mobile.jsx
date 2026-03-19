import { useState, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   Golden Era Mobile - Angkhana's 90-Day Metabolic Wellness Tracker
   Synced with Desktop App field names, scoring, Sheet API
   ═══════════════════════════════════════════════════════════════ */

const API = "https://script.google.com/macros/s/AKfycbxWHehS2Drs5gXKPuNv1u173pLu7Mr8ZOJ7KX5pEOS4L5K-X7HOeHBN1Cw9pUt5Byf2Hw/exec";
// Day 1 = 2 March 2026 (protocol start)
const DAY1 = new Date("2026-03-02");

// Theme - bold contrast
const t = {
  bg: "#E8E4DE", card: "#FDFCF9", tile: "#E8E3DB", on: "#C8DFC9",
  accent: "#4A7A50", dark: "#3D6842", text: "#1A1612", muted: "#8A7E72",
  sh: "0 2px 8px rgba(0,0,0,0.10)", shOn: "0 3px 10px rgba(74,122,80,0.20)",
  csh: "0 3px 16px rgba(0,0,0,0.08)", scoreBg: "rgba(74,122,80,0.6)",
  dotFill: "#FDFCF9",
};

const TARGETS = {
  glucose: { s: 211, g: 85, u: "mg/dL", l: "Fasting Glucose" },
  trig: { s: 702, g: 100, u: "mg/dL", l: "Triglycerides" },
  weight: { s: 73.6, g: 60, u: "kg", l: "Weight" },
  bmi: { s: 26.4, g: 22, u: "", l: "BMI" },
  hba1c: { s: 9.4, g: 5.5, u: "%", l: "HbA1C" },
  ggt: { s: 184, g: 25, u: "U/L", l: "GGT" },
};

// Grid items with CYCLING values
const GRID = [
  { id: "berb", icon: "\uD83C\uDF3F", l: "Berb", field: "berb", cycle: ["0", "x1", "x2"] },
  { id: "fish", icon: "\uD83D\uDC1F", l: "Fish", field: "fish", cycle: ["0", "x1", "x2", "x3"] },
  { id: "mag", icon: "\uD83D\uDC8A", l: "Mag", field: "mag", cycle: ["0", "x1", "x2", "x3"] },
  { id: "d3k2", icon: "\u2600\uFE0F", l: "D3K2", field: "d3k2", cycle: ["0", "x1", "x2"] },
  { id: "sleep", icon: "\uD83D\uDE34", l: "Sleep", field: "sleep", cycle: ["", "<6", "<7", "7+", "8+"] },
  { id: "move", icon: "\uD83D\uDEB6", l: "Walk", field: "moveAfter", cycle: ["", "x1", "x2", "x3"] },
  { id: "fiber", icon: "\uD83E\uDD57", l: "Fiber", field: "fiberFirst", cycle: [false, true] },
  { id: "sugar", icon: "\uD83D\uDEAB", l: "Sugar", field: "noSweet", cycle: [false, true] },
  { id: "water", icon: "\uD83D\uDCA7", l: "Water", field: "water", cycle: [false, true] },
  { id: "probio", icon: "\uD83E\uDDEB", l: "Probio", field: "probio", cycle: [false, true] },
  { id: "basil", icon: "\uD83C\uDF31", l: "Basil", field: "basil", cycle: [false, true] },
  { id: "brazil", icon: "\uD83E\uDD5C", l: "Brazil", field: "brazil", cycle: [false, true] },
];

const EXERCISES = ["rest", "walk", "stretch", "cardio", "weights"];

// ─── Helpers ───
const dayN = () => Math.max(1, Math.floor((new Date() - DAY1) / 864e5) + 1);
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
const fmtShort = () => new Date().toLocaleDateString("en-US", { day: "numeric", month: "short" });
const pctCh = (s, c) => (c != null && s ? ((c - s) / Math.abs(s) * 100).toFixed(1) : null);
const fmtPct = (v) => { if (v == null) return null; return `${parseFloat(v) > 0 ? "+" : ""}${v}%`; };

function calcIF(m1t, mLast) {
  if (!m1t || !mLast) return { display: "--:--", hours: 0 };
  const [h1, mn1] = m1t.split(":").map(Number);
  const [h2, mn2] = mLast.split(":").map(Number);
  if (isNaN(h1) || isNaN(h2)) return { display: "--:--", hours: 0 };
  const eat = (h2 * 60 + (mn2 || 0)) - (h1 * 60 + (mn1 || 0));
  if (eat <= 0) return { display: "--:--", hours: 0 };
  const f = 24 - Math.round(eat / 60);
  return { display: `${f}:${Math.round(eat / 60)}`, hours: f };
}

// Score (exact desktop match)
function getDayScore(wd) {
  if (!wd) return null;
  const has = wd.glucFast || wd.berb || wd.fish || wd.act || wd.moveAfter || wd.noSweet || wd.fiberFirst || wd.water || wd.sleep || wd.mag || wd.d3k2 || wd.m1t || wd.mLast;
  if (!has) return null;
  let b = 0, x = 0;
  if (wd.noSweet) b += 18;
  if (wd.berb === "x2") b += 15; else if (wd.berb === "x1") b += 7;
  if (wd.sleep === "7+" || wd.sleep === "8+") b += 14; else if (wd.sleep === "<7") b += 7;
  if (wd.fish === "x3") b += 10; else if (wd.fish === "x2") b += 6; else if (wd.fish === "x1") b += 3;
  if (wd.act && wd.act !== "none" && wd.act !== "0" && wd.act !== "") { b += 5; if (wd.act === "weights") x += 10; else if (wd.act === "cardio" || wd.act === "swim") x += 5; }
  if (wd.moveAfter === "x3") b += 8; else if (wd.moveAfter === "x2") b += 6; else if (wd.moveAfter === "x1") b += 3;
  if (wd.m1t && wd.mLast) { const { hours } = calcIF(wd.m1t, wd.mLast); if (hours >= 16) { b += 8; x += 5; } else if (hours >= 15) { b += 8; x += 2; } else if (hours >= 14) b += 8; else if (hours >= 13) b += 4; }
  if (wd.fiberFirst) b += 7;
  if (wd.water) b += 5;
  if (wd.mag && wd.mag !== "0") b += 5;
  if (wd.d3k2 && wd.d3k2 !== "0") b += 5;
  if (wd.probio) x += 2;
  if (wd.brazil) x += 2;
  if (wd.basil) x += 2;
  return { base: b, bonus: x, total: b + x };
}

function gridDisplay(field, val) {
  if (["fiberFirst", "noSweet", "water", "probio", "basil", "brazil"].includes(field)) return val ? "\u2713" : "";
  if (field === "sleep") return val || "";
  if (!val || val === "0") return "";
  return val;
}
function gridIsOn(field, val) {
  if (["fiberFirst", "noSweet", "water", "probio", "basil", "brazil"].includes(field)) return !!val;
  if (field === "sleep") return !!val && val !== "";
  return val && val !== "0" && val !== "";
}

// ─── API ───
async function apiLoad() {
  try {
    const r = await fetch(`${API}?action=load&t=${Date.now()}`);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) { console.error("Load:", e); return null; }
}

let _saveTimer = null;
function apiSave(date, data) {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "saveDay", date, data }) });
    } catch (e) { console.error("Save:", e); }
  }, 2000);
}

// ─── HOME ─────────────────────────────────────────────────
function HomeTab({ D, loading }) {
  const day = dayN();
  const today = todayISO();
  const dates = Object.keys(D).sort();
  const last7 = dates.slice(-7);
  const latest = dates.length ? D[dates[dates.length - 1]] : {};
  const todayD = D[today] || {};

  const gv = latest.glucFast ? parseFloat(latest.glucFast) : NaN;
  const tv = latest.triglycerides ? parseFloat(latest.triglycerides) : NaN;
  const wv = latest.weight ? parseFloat(latest.weight) : NaN;

  let streak = 0;
  for (let i = dates.length - 1; i >= 0; i--) { const r = D[dates[i]]; if (r && (r.glucFast || r.berb || r.noSweet)) streak++; else break; }

  const sc = getDayScore(todayD);
  const total = sc ? sc.total : 0;

  const wkScores = last7.map(d => getDayScore(D[d]));
  const wkDays = last7.map(d => { try { return ["S", "M", "T", "W", "T", "F", "S"][new Date(d + "T00:00:00").getDay()]; } catch { return "?"; } });
  while (wkScores.length < 7) { wkScores.unshift(null); wkDays.unshift("-"); }

  const gEntries = last7.filter(d => D[d]?.glucFast).map(d => ({
    v: parseFloat(D[d].glucFast),
    d: (() => { try { return ["S", "M", "T", "W", "T", "F", "S"][new Date(d + "T00:00:00").getDay()]; } catch { return "?"; } })()
  })).filter(e => !isNaN(e.v));

  return (
    <div style={{ padding: "14px 16px 90px", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Day + date + streak */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span style={{ fontSize: 24, fontWeight: 300, color: t.text, letterSpacing: "-0.03em" }}>{loading ? "..." : `Day ${day}`}</span>
          <span style={{ fontSize: 13, color: t.muted }}>{fmtShort()}</span>
        </div>
        <span style={{ fontSize: 13, color: t.accent, fontWeight: 600 }}>{streak > 0 && `\uD83D\uDD25 ${streak}`}</span>
      </div>

      {/* 3 metric boxes */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[
          { label: "Glucose", value: !isNaN(gv) ? gv : "--", unit: "mg/dL", change: !isNaN(gv) ? fmtPct(pctCh(TARGETS.glucose.s, gv)) : null },
          { label: "Trig", value: !isNaN(tv) ? tv : "--", unit: "mg/dL", change: !isNaN(tv) ? fmtPct(pctCh(TARGETS.trig.s, tv)) : null },
          { label: "Weight", value: !isNaN(wv) ? wv : "--", unit: "kg", change: !isNaN(wv) ? fmtPct(pctCh(TARGETS.weight.s, wv)) : null },
        ].map((m, i) => (
          <div key={i} style={{ flex: 1, background: t.card, borderRadius: 16, padding: "14px 10px", boxShadow: t.csh, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.muted, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 30, fontWeight: 200, color: t.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{m.value}</div>
            <div style={{ fontSize: 10, color: t.muted, marginTop: 3 }}>{m.unit}</div>
            {m.change && <div style={{ fontSize: 11, color: t.accent, fontWeight: 600, marginTop: 4 }}>{m.change}</div>}
          </div>
        ))}
      </div>

      {/* Today Score + Week bars */}
      <div style={{ background: t.card, borderRadius: 16, padding: "16px 18px", marginBottom: 14, boxShadow: t.csh }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 36, fontWeight: 200, color: t.text, letterSpacing: "-0.04em", lineHeight: 1 }}>{sc ? total : "--"}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: t.muted }}>Today Score</span>
              <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>{total}/100+</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: t.tile, overflow: "hidden" }}>
              <div style={{ width: `${Math.min(100, total)}%`, height: "100%", borderRadius: 3, background: t.accent, transition: "width 0.4s" }} />
            </div>
          </div>
        </div>
        <div style={{ borderTop: `1px solid ${t.tile}`, paddingTop: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {wkScores.slice(-7).map((s, i) => {
              const tot = s ? s.total : 0;
              const h = tot > 0 ? Math.max(8, Math.round(tot * 0.3)) : 5;
              const col = tot >= 80 ? t.accent : tot >= 40 ? t.scoreBg : "transparent";
              return (
                <div key={i} style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ width: 24, height: 36, borderRadius: 7, margin: "0 auto 3px", background: t.tile, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", boxShadow: tot > 0 ? t.sh : "none" }}>
                    <div style={{ width: "100%", height: h, borderRadius: "4px 4px 0 0", background: col }} />
                  </div>
                  <div style={{ fontSize: 10, color: tot > 0 ? t.muted : "#ccc" }}>{wkDays.slice(-7)[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Glucose trend */}
      <div style={{ background: t.card, borderRadius: 16, padding: "16px 18px", boxShadow: t.csh }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: t.muted }}>Fasting Glucose Trend</span>
          <span style={{ fontSize: 11, color: t.accent, fontWeight: 600 }}>{gEntries.length >= 2 ? `Last ${gEntries.length} days` : "Last 7 days"}</span>
        </div>
        {gEntries.length >= 2 ? (() => {
          const vals = gEntries.map(e => e.v);
          const mn = Math.min(...vals) - 10, mx = Math.max(...vals) + 10, w = 260, h = 55;
          const pts = vals.map((v, i) => ({ x: (i / (vals.length - 1)) * w, y: h - ((v - mn) / (mx - mn)) * h, v }));
          const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          const area = `${line} L${w},${h} L0,${h} Z`;
          return (
            <div>
              <svg width="100%" viewBox={`0 0 ${w} ${h + 12}`} style={{ display: "block", overflow: "visible" }}>
                <defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.accent} stopOpacity="0.3" /><stop offset="100%" stopColor={t.accent} stopOpacity="0" /></linearGradient></defs>
                <path d={area} fill="url(#gfill)" />
                <path d={line} fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {pts.map((p, i) => (<circle key={i} cx={p.x} cy={p.y} r={i === vals.length - 1 ? 5 : 3} fill={i === vals.length - 1 ? t.accent : t.dotFill} stroke={t.accent} strokeWidth={i === vals.length - 1 ? 2.5 : 1.5} />))}
                <text x={pts[pts.length - 1].x} y={pts[pts.length - 1].y - 9} textAnchor="middle" fontSize="11" fontWeight="700" fill={t.accent} fontFamily="DM Sans,sans-serif">{vals[vals.length - 1]}</text>
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                {gEntries.map((e, i) => (<div key={i} style={{ flex: 1, textAlign: "center", fontSize: 10, color: i === gEntries.length - 1 ? t.accent : t.muted, fontWeight: i === gEntries.length - 1 ? 600 : 400 }}>{e.d}</div>))}
              </div>
            </div>
          );
        })() : (
          <div style={{ padding: "24px 0", textAlign: "center", fontSize: 13, color: t.muted }}>{loading ? "Loading..." : "Log glucose to see the trend"}</div>
        )}
      </div>
    </div>
  );
}

// ─── LOG ──────────────────────────────────────────────────
function LogTab({ D, setD }) {
  const today = todayISO();
  const wd = D[today] || {};
  const up = (f, v) => { setD(p => { const u = { ...p, [today]: { ...(p[today] || {}), [f]: v } }; apiSave(today, u[today]); return u; }); };

  const { display: ifDisp, hours: ifH } = calcIF(wd.m1t, wd.mLast);
  const ifOn = ifDisp !== "--:--";

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const handleSave = async () => {
    setSaving(true);
    // If no exercise selected, send "none"
    const payload = { ...(D[today] || {}) };
    if (!payload.act || payload.act === "") payload.act = "none";
    try { await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain" }, body: JSON.stringify({ action: "saveDay", date: today, data: payload }) }); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch (e) { console.error(e); }
    setSaving(false);
  };

  const sc = getDayScore(wd);

  // Consistent input style for ALL 6 fields in the glucose card
  const cellStyle = {
    width: "100%", padding: "12px 6px", borderRadius: 12, border: "none",
    fontSize: 18, fontWeight: 300, textAlign: "center", color: t.text,
    fontFamily: "'DM Sans',sans-serif", background: t.tile, outline: "none",
    boxSizing: "border-box", boxShadow: t.sh, height: 48,
  };

  return (
    <div style={{ padding: "14px 14px 90px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px", marginBottom: 12 }}>
        <span style={{ fontSize: 22, fontWeight: 300, color: t.text }}>Log</span>
        <span style={{ fontSize: 12, color: t.accent, fontWeight: 600 }}>Day {dayN()}</span>
      </div>

      {/* Glucose + Meals + IF - consistent height inputs */}
      <div style={{ background: t.card, borderRadius: 20, padding: 18, marginBottom: 10, boxShadow: t.csh }}>
        {/* Row 1: 3 glucose inputs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[
            ["\uD83E\uDE78", "Fasting", "glucFast"],
            ["\uD83C\uDF7D\uFE0F", "Post-meal", "glucPost"],
            ["\uD83C\uDF19", "Night", "glucNight"],
          ].map(([icon, label, field], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: t.muted, marginBottom: 4 }}>{icon} {label}</div>
              <input inputMode="decimal" placeholder="-" value={wd[field] || ""} onChange={e => up(field, e.target.value)} style={cellStyle} />
            </div>
          ))}
        </div>
        {/* Row 2: 2 time inputs + IF display - same height */}
        <div style={{ display: "flex", gap: 8 }}>
          {[
            ["\uD83C\uDF73", "First meal", "m1t"],
            ["\uD83C\uDF05", "Last meal", "mLast"],
          ].map(([icon, label, field], i) => (
            <div key={i} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 10, color: t.muted, marginBottom: 4 }}>{icon} {label}</div>
              <input type="time" value={wd[field] || ""} onChange={e => up(field, e.target.value)} style={{ ...cellStyle, fontSize: 16 }} />
            </div>
          ))}
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 10, color: t.muted, marginBottom: 4 }}>{"\u23F1\uFE0F"} IF ratio</div>
            <div style={{
              ...cellStyle, display: "flex", alignItems: "center", justifyContent: "center",
              color: ifOn ? t.accent : t.muted,
              background: ifOn ? t.on : t.tile,
              boxShadow: ifOn ? t.shOn : t.sh,
              fontWeight: ifOn ? 500 : 300,
            }}>{ifDisp}</div>
          </div>
        </div>
      </div>

      {/* Cycling supplement grid */}
      <div style={{ background: t.card, borderRadius: 20, padding: 18, marginBottom: 10, boxShadow: t.csh }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {GRID.map(item => {
            const val = wd[item.field];
            const on = gridIsOn(item.field, val);
            const disp = gridDisplay(item.field, val);
            const tap = () => { const c = item.cycle; const idx = c.indexOf(val); up(item.field, c[(idx + 1) % c.length]); };
            return (
              <div key={item.id} onClick={tap} style={{
                textAlign: "center", padding: "10px 4px 7px", borderRadius: 14, cursor: "pointer",
                background: on ? t.on : t.tile, boxShadow: on ? t.shOn : t.sh,
                transition: "all 0.15s", WebkitTapHighlightColor: "transparent",
              }}>
                <div style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</div>
                <div style={{ fontSize: 10, color: on ? t.accent : t.muted, fontWeight: 600, lineHeight: 1.1 }}>{item.l}</div>
                {disp && <div style={{ fontSize: 12, color: t.accent, fontWeight: 700, marginTop: 2, lineHeight: 1 }}>{disp}</div>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Exercise pills: rest, walk, stretch, cardio, weights */}
      <div style={{ background: t.card, borderRadius: 20, padding: "14px 18px", marginBottom: 10, boxShadow: t.csh }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 18 }}>{"\uD83C\uDFCB\uFE0F"}</span>
          {EXERCISES.map(ex => {
            const on = wd.act === ex;
            return (
              <div key={ex} onClick={() => up("act", on ? "" : ex)} style={{
                padding: "7px 16px", borderRadius: 20, fontSize: 13, cursor: "pointer",
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
      <div style={{ background: t.card, borderRadius: 20, padding: "14px 18px", marginBottom: 10, boxShadow: t.csh }}>
        <textarea placeholder="\uD83D\uDCDD Notes..." rows={2} value={wd.notes || ""} onChange={e => up("notes", e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 12, border: "none", fontSize: 13, lineHeight: 1.5, color: t.text, fontFamily: "'DM Sans',sans-serif", background: t.tile, outline: "none", boxSizing: "border-box", boxShadow: t.sh, resize: "none" }} />
      </div>

      {/* Score preview */}
      {sc && (
        <div style={{ textAlign: "center", marginBottom: 10, fontSize: 14, color: t.muted }}>
          Score: <b style={{ color: t.accent, fontSize: 16 }}>{sc.total}</b>
          <span style={{ fontSize: 11, marginLeft: 4 }}>({sc.base} + {sc.bonus})</span>
        </div>
      )}

      {/* Save */}
      <div onClick={!saving ? handleSave : undefined} style={{
        padding: 14, borderRadius: 50, textAlign: "center",
        background: saved ? t.on : `linear-gradient(135deg, ${t.accent}, ${t.dark})`,
        color: saved ? t.accent : "#fff", fontSize: 15, fontWeight: 700,
        cursor: saving ? "wait" : "pointer", boxShadow: `0 6px 20px ${t.accent}40`,
        letterSpacing: "0.3px", opacity: saving ? 0.7 : 1, transition: "all 0.3s",
      }}>
        {saving ? "Saving..." : saved ? "\u2713 Saved!" : "Save"}
      </div>
    </div>
  );
}

// ─── JOURNEY ──────────────────────────────────────────────
function JourneyTab({ D, loading }) {
  const dates = Object.keys(D).sort();
  const find = (key) => { for (let i = dates.length - 1; i >= 0; i--) { const v = parseFloat(D[dates[i]]?.[key]); if (!isNaN(v)) return v; } return null; };

  const metrics = [
    { key: "glucose", cur: find("glucFast"), tgt: TARGETS.glucose, fb: null },
    { key: "trig", cur: find("triglycerides"), tgt: TARGETS.trig, fb: null },
    { key: "weight", cur: find("weight"), tgt: TARGETS.weight, fb: null },
    { key: "bmi", cur: find("bmi"), tgt: TARGETS.bmi, fb: null },
    { key: "hba1c", cur: find("hba1c"), tgt: TARGETS.hba1c, fb: "Next: Day 30" },
    { key: "ggt", cur: find("ggt"), tgt: TARGETS.ggt, fb: "Next: end Mar" },
  ];

  return (
    <div style={{ padding: "14px 16px 90px", fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 24, fontWeight: 300, color: t.text, letterSpacing: "-0.03em" }}>Journey</span>
      </div>
      {metrics.map(({ key, cur, tgt, fb }) => {
        const pct = cur != null ? Math.min(100, Math.max(0, ((tgt.s - cur) / (tgt.s - tgt.g)) * 100)) : 0;
        const ch = cur != null ? fmtPct(pctCh(tgt.s, cur)) : null;
        let note = fb;
        if (cur != null) {
          if (key === "glucose" && cur < 100) note = "Normal range!";
          else if (key === "weight") note = `-${(tgt.s - cur).toFixed(1)} kg`;
          else if (key === "trig" && cur <= 150) note = "Normal range!";
          else if (ch) note = ch;
        }
        return (
          <div key={key} style={{ background: t.card, borderRadius: 14, padding: "14px 16px", marginBottom: 8, boxShadow: t.csh }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
              <span style={{ fontSize: 14, color: t.text, fontWeight: 500 }}>{tgt.l}</span>
              <span style={{ fontSize: 16, fontWeight: 300, color: cur != null ? t.accent : t.muted }}>
                {cur ?? "---"} <span style={{ fontSize: 11, color: t.muted }}>{tgt.u}</span>
              </span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: t.tile, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ width: `${pct}%`, height: "100%", borderRadius: 3, background: cur != null ? t.accent : "transparent", transition: "width 0.5s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: t.muted }}>
              <span>{tgt.s} {">"} {tgt.g}{tgt.u}</span>
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
      width: "100%", maxWidth: 430, height: 60,
      background: t.card, display: "flex", justifyContent: "space-around", alignItems: "center",
      boxShadow: "0 -2px 12px rgba(0,0,0,0.07)",
      zIndex: 100, borderRadius: "20px 20px 0 0",
      paddingBottom: "max(0px, env(safe-area-inset-bottom))",
    }}>
      {[
        { key: "home", label: "Home", icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? t.accent : t.muted} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg> },
        { key: "log", label: "Log", icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? t.accent : t.muted} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg> },
        { key: "journey", label: "Journey", icon: (a) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? t.accent : t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 17 17 7" /><polyline points="7 7 17 7 17 17" /></svg> },
      ].map(({ key, label, icon }) => (
        <div key={key} onClick={() => setTab(key)} style={{ textAlign: "center", cursor: "pointer", padding: "6px 16px", WebkitTapHighlightColor: "transparent" }}>
          {icon(tab === key)}
          <div style={{ fontSize: 11, marginTop: 2, color: tab === key ? t.accent : t.muted, fontWeight: tab === key ? 700 : 500 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────
export default function GoldenEraMobile() {
  const [tab, setTab] = useState("home");
  const [D, setD] = useState({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await apiLoad();
    if (res) {
      if (res.tracker && typeof res.tracker === "object") setD(res.tracker);
      else if (Array.isArray(res)) { const o = {}; res.forEach(r => { if (r.date) o[r.date] = r; }); setD(o); }
      else if (res.data) { if (Array.isArray(res.data)) { const o = {}; res.data.forEach(r => { if (r.date) o[r.date] = r; }); setD(o); } else if (typeof res.data === "object") setD(res.data); }
      else if (typeof res === "object" && !Array.isArray(res)) {
        // Maybe the response itself is { "2026-03-10": {...}, ... }
        const keys = Object.keys(res).filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k));
        if (keys.length > 0) setD(res);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{
      fontFamily: "'DM Sans',sans-serif", background: t.bg, color: t.text,
      minHeight: "100dvh", maxWidth: 430, margin: "0 auto", position: "relative",
      overflowX: "hidden", WebkitFontSmoothing: "antialiased",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600;700&display=swap" rel="stylesheet" />
      <div style={{ minHeight: "calc(100dvh - 60px)" }}>
        {tab === "home" && <HomeTab D={D} loading={loading} />}
        {tab === "log" && <LogTab D={D} setD={setD} />}
        {tab === "journey" && <JourneyTab D={D} loading={loading} />}
      </div>
      <Nav tab={tab} setTab={setTab} />
    </div>
  );
}
