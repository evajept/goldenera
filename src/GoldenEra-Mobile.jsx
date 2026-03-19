import { useState } from "react";

// Side-by-side: Current (soft) vs High Contrast

const PhoneFrame = ({ children, label, subtitle }) => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
    <div style={{ fontSize:16, fontWeight:700, fontFamily:"'DM Sans',sans-serif", color:"#1a1a1a" }}>{label}</div>
    <div style={{ fontSize:11, color:"#888", fontFamily:"'DM Sans',sans-serif", fontStyle:"italic", maxWidth:280, textAlign:"center" }}>{subtitle}</div>
    <div style={{
      width:320, height:680, borderRadius:36, overflow:"hidden",
      border:"9px solid #1a1a1a", boxShadow:"0 20px 60px rgba(0,0,0,0.15)",
      position:"relative", background:"#000",
    }}>
      <div style={{ height:"100%", overflow:"auto", position:"relative" }}>{children}</div>
    </div>
  </div>
);

// Theme objects
const soft = {
  bg:"#F0EDE8", card:"#FAF8F4", tileFill:"#EFEAE3", tileOn:"#E2EDE4",
  accent:"#6B9470", text:"#2C2822", muted:"#A09888",
  shadow:"0 2px 6px rgba(0,0,0,0.06)", shadowOn:"0 2px 8px rgba(107,148,112,0.12)",
  cardShadow:"0 2px 12px rgba(0,0,0,0.05)", gradStart:"0.2", gradEnd:"0",
  dotFill:"#FAF8F4", scoreBg:"rgba(107,148,112,0.5)",
};

const bold = {
  bg:"#E8E4DE", card:"#FFFFFF", tileFill:"#E8E3DB", tileOn:"#C8DFC9",
  accent:"#4A7A50", text:"#1A1612", muted:"#8A7E72",
  shadow:"0 2px 8px rgba(0,0,0,0.1)", shadowOn:"0 3px 10px rgba(74,122,80,0.2)",
  cardShadow:"0 3px 16px rgba(0,0,0,0.08)", gradStart:"0.3", gradEnd:"0",
  dotFill:"#FFFFFF", scoreBg:"rgba(74,122,80,0.6)",
};

const mid = {
  bg:"#ECE9E3", card:"#FDFCF9", tileFill:"#EBE6DF", tileOn:"#D5E8D7",
  accent:"#5B8A60", text:"#221E18", muted:"#958A7D",
  shadow:"0 2px 7px rgba(0,0,0,0.08)", shadowOn:"0 2px 9px rgba(91,138,96,0.16)",
  cardShadow:"0 2px 14px rgba(0,0,0,0.06)", gradStart:"0.25", gradEnd:"0",
  dotFill:"#FDFCF9", scoreBg:"rgba(91,138,96,0.55)",
};

const HomeTab = ({ t }) => (
  <div style={{ padding:"16px 14px 80px", fontFamily:"'DM Sans',sans-serif" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:44, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
        <span style={{ fontSize:20, fontWeight:300, color:t.text, letterSpacing:"-0.03em" }}>Day 15</span>
        <span style={{ fontSize:11, color:t.muted }}>16 Mar</span>
      </div>
      <span style={{ fontSize:11, color:t.accent, fontWeight:600 }}>🔥 15</span>
    </div>

    <div style={{ display:"flex", gap:7, marginBottom:12 }}>
      {[
        { label:"Glucose", value:"95", unit:"mg/dL", change:"-55%" },
        { label:"Trig", value:"231", unit:"mg/dL", change:"-67%" },
        { label:"Weight", value:"70.9", unit:"kg", change:"-3.7%" },
      ].map((m,i) => (
        <div key={i} style={{ flex:1, background:t.card, borderRadius:14, padding:"12px 8px", boxShadow:t.cardShadow, textAlign:"center" }}>
          <div style={{ fontSize:9, color:t.muted, marginBottom:3 }}>{m.label}</div>
          <div style={{ fontSize:26, fontWeight:200, color:t.text, letterSpacing:"-0.04em", lineHeight:1 }}>{m.value}</div>
          <div style={{ fontSize:8, color:t.muted, marginTop:2 }}>{m.unit}</div>
          <div style={{ fontSize:9, color:t.accent, fontWeight:600, marginTop:3 }}>{m.change}</div>
        </div>
      ))}
    </div>

    <div style={{ background:t.card, borderRadius:14, padding:"14px 16px", marginBottom:12, boxShadow:t.cardShadow }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
        <div style={{ fontSize:32, fontWeight:200, color:t.text, letterSpacing:"-0.04em", lineHeight:1 }}>86</div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
            <span style={{ fontSize:10, color:t.muted }}>Today Score</span>
            <span style={{ fontSize:10, color:t.accent, fontWeight:600 }}>5 of 7</span>
          </div>
          <div style={{ height:4, borderRadius:2, background:t.tileFill, overflow:"hidden" }}>
            <div style={{ width:"71%", height:"100%", borderRadius:2, background:t.accent }}/>
          </div>
        </div>
      </div>
      <div style={{ borderTop:`1px solid ${t.tileFill}`, paddingTop:10 }}>
        <div style={{ display:"flex", justifyContent:"space-between" }}>
          {["M","T","W","T","F","S","S"].map((d,i) => {
            const score = [88,92,86,90,86,0,0][i];
            const h = score > 0 ? Math.round(score * 0.35) : 4;
            return (
              <div key={i} style={{ textAlign:"center", flex:1 }}>
                <div style={{
                  width:20, height:32, borderRadius:6, margin:"0 auto 2px",
                  background:t.tileFill, display:"flex", alignItems:"flex-end",
                  justifyContent:"center", overflow:"hidden",
                  boxShadow: score > 0 ? t.shadow : "none",
                }}>
                  <div style={{
                    width:"100%", height:h, borderRadius:"3px 3px 0 0",
                    background: score >= 90 ? t.accent : score >= 80 ? t.scoreBg : "transparent",
                  }}/>
                </div>
                <div style={{ fontSize:8, color: i < 5 ? t.muted : "#ccc" }}>{d}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <div style={{ background:t.card, borderRadius:14, padding:"14px 16px", boxShadow:t.cardShadow }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6 }}>
        <span style={{ fontSize:10, color:t.muted }}>Fasting Glucose Trend</span>
        <span style={{ fontSize:9, color:t.accent, fontWeight:600 }}>Last 7 days</span>
      </div>
      {(() => {
        const data = [120,112,105,98,102,97,95];
        const min = 80, max = 130, w = 250, h = 50;
        const pts = data.map((v,i) => ({ x:(i/(data.length-1))*w, y:h-((v-min)/(max-min))*h, v }));
        const line = pts.map((p,i) => `${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
        const area = `${line} L${w},${h} L0,${h} Z`;
        const gid = `g${t === soft ? "s" : t === mid ? "m" : "b"}`;
        return (
          <div>
            <svg width="100%" viewBox={`0 0 ${w} ${h+10}`} style={{ display:"block", overflow:"visible" }}>
              <defs>
                <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={t.accent} stopOpacity={t.gradStart}/>
                  <stop offset="100%" stopColor={t.accent} stopOpacity={t.gradEnd}/>
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${gid})`}/>
              <path d={line} fill="none" stroke={t.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              {pts.map((p,i) => (
                <circle key={i} cx={p.x} cy={p.y} r={i===data.length-1?4:2.5}
                  fill={i===data.length-1?t.accent:t.dotFill}
                  stroke={t.accent} strokeWidth={i===data.length-1?2:1.5}/>
              ))}
              <text x={pts[pts.length-1].x} y={pts[pts.length-1].y-8} textAnchor="middle" fontSize="9" fontWeight="600" fill={t.accent} fontFamily="DM Sans,sans-serif">95</text>
            </svg>
          </div>
        );
      })()}
      <div style={{ display:"flex", justifyContent:"space-between", marginTop:3 }}>
        {["M","T","W","T","F","S","S"].map((d,i) => (
          <div key={i} style={{ flex:1, textAlign:"center", fontSize:8, color:i===6?t.accent:t.muted, fontWeight:i===6?600:400 }}>{d}</div>
        ))}
      </div>
    </div>
  </div>
);

const LogTab = ({ t }) => (
  <div style={{ padding:"44px 12px 80px", fontFamily:"'DM Sans',sans-serif" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", padding:"0 4px", marginBottom:10 }}>
      <span style={{ fontSize:18, fontWeight:300, color:t.text }}>Log</span>
      <span style={{ fontSize:10, color:t.accent, fontWeight:600 }}>Day 15</span>
    </div>

    <div style={{ background:t.card, borderRadius:18, padding:"16px", marginBottom:8, boxShadow:t.cardShadow }}>
      <div style={{ display:"flex", gap:7, marginBottom:12 }}>
        {[["🩸","Fasting"],["🍽️","Post-meal"],["🌙","Night"]].map(([icon,l],i) => (
          <div key={i} style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:8, color:t.muted, marginBottom:3 }}>{icon} {l}</div>
            <input placeholder="-" style={{ width:"100%", padding:"9px 4px", borderRadius:10, border:"none", fontSize:16, fontWeight:300, textAlign:"center", color:t.text, fontFamily:"'DM Sans',sans-serif", background:t.tileFill, outline:"none", boxSizing:"border-box", boxShadow:t.shadow }}/>
          </div>
        ))}
      </div>
      <div style={{ display:"flex", gap:7 }}>
        {[["🍳","First meal"],["🌅","Last meal"]].map(([icon,l],i) => (
          <div key={i} style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:8, color:t.muted, marginBottom:3 }}>{icon} {l}</div>
            <input placeholder="--:--" style={{ width:"100%", padding:"9px 4px", borderRadius:10, border:"none", fontSize:16, fontWeight:300, textAlign:"center", color:t.text, fontFamily:"'DM Sans',sans-serif", background:t.tileFill, outline:"none", boxSizing:"border-box", boxShadow:t.shadow }}/>
          </div>
        ))}
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ fontSize:8, color:t.muted, marginBottom:3 }}>⏱️ IF ratio</div>
          <div style={{ padding:"9px 4px", borderRadius:10, background:t.tileOn, textAlign:"center", fontSize:16, fontWeight:300, color:t.accent, boxShadow:t.shadowOn }}>17:7</div>
        </div>
      </div>
    </div>

    <div style={{ background:t.card, borderRadius:18, padding:"16px", marginBottom:8, boxShadow:t.cardShadow }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:6 }}>
        {[
          { icon:"🌿", l:"Berb", v:"x1", on:true },
          { icon:"🐟", l:"Fish", v:"x3", on:true },
          { icon:"💊", l:"Mag", v:"x2", on:true },
          { icon:"☀️", l:"D3K2", v:"x2", on:true },
          { icon:"😴", l:"Sleep", v:"7+", on:true },
          { icon:"🚶", l:"Walk", v:"x3", on:true },
          { icon:"🥗", l:"Fiber", v:"✓", on:true },
          { icon:"🚫", l:"Sugar", v:"✓", on:true },
          { icon:"💧", l:"Water", v:"", on:false },
          { icon:"🧫", l:"Probio", v:"✓", on:true },
          { icon:"🌱", l:"Basil", v:"✓", on:true },
          { icon:"🥜", l:"Brazil", v:"✓", on:true },
        ].map((item,i) => (
          <div key={i} style={{
            textAlign:"center", padding:"8px 3px 5px", borderRadius:12, cursor:"pointer",
            background: item.on ? t.tileOn : t.tileFill,
            boxShadow: item.on ? t.shadowOn : t.shadow,
          }}>
            <div style={{ fontSize:16, marginBottom:1 }}>{item.icon}</div>
            <div style={{ fontSize:7, color: item.on ? t.accent : t.muted, fontWeight:600, lineHeight:1 }}>{item.l}</div>
            {item.v && <div style={{ fontSize:9, color:t.accent, fontWeight:700, marginTop:1, lineHeight:1 }}>{item.v}</div>}
          </div>
        ))}
      </div>
    </div>

    <div style={{ background:t.card, borderRadius:18, padding:"12px 16px", marginBottom:8, boxShadow:t.cardShadow }}>
      <div style={{ display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" }}>
        <span style={{ fontSize:13 }}>🏋️</span>
        {["Walk","Cardio","Weights","Swim","Stretch","House"].map((o,j) => (
          <div key={j} style={{ padding:"5px 12px", borderRadius:18, fontSize:10, cursor:"pointer", background:j===1?t.accent:t.tileFill, color:j===1?"#fff":t.muted, fontWeight:j===1?600:400, boxShadow:j===1?t.shadowOn:t.shadow }}>{o}</div>
        ))}
      </div>
    </div>

    <div style={{ background:t.card, borderRadius:18, padding:"12px 16px", marginBottom:8, boxShadow:t.cardShadow }}>
      <textarea placeholder="📝 Notes..." rows={2} style={{ width:"100%", padding:"8px 10px", borderRadius:10, border:"none", fontSize:11, lineHeight:1.5, color:t.text, fontFamily:"'DM Sans',sans-serif", background:t.tileFill, outline:"none", boxSizing:"border-box", boxShadow:t.shadow, resize:"none" }}/>
    </div>

    <div style={{ padding:"12px", borderRadius:50, textAlign:"center", background:`linear-gradient(135deg, ${t.accent}, #4A7A50)`, color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", boxShadow:`0 6px 20px ${t.accent}40`, letterSpacing:"0.03em" }}>✨ Save & Analyze</div>
  </div>
);

const JourneyTab = ({ t }) => (
  <div style={{ padding:"16px 14px 80px", fontFamily:"'DM Sans',sans-serif" }}>
    <div style={{ paddingTop:44, marginBottom:14 }}>
      <span style={{ fontSize:20, fontWeight:300, color:t.text, letterSpacing:"-0.03em" }}>Journey</span>
    </div>

    {[
      { label:"Fasting Glucose", baseline:211, current:95, goal:85, unit:"mg/dL", note:"Normal range!" },
      { label:"Triglycerides", baseline:702, current:231, goal:100, unit:"mg/dL", note:"-67% in 15d" },
      { label:"Weight", baseline:73.6, current:70.9, goal:60, unit:"kg", note:"-2.7 kg" },
      { label:"BMI", baseline:26.4, current:25.4, goal:22, unit:"", note:"" },
      { label:"HbA1C", baseline:9.4, current:null, goal:5.5, unit:"%", note:"Next: Day 30" },
      { label:"GGT", baseline:184, current:null, goal:25, unit:"U/L", note:"Next: end Mar" },
    ].map((m,i) => {
      const pct = m.current ? Math.min(100, Math.max(0, ((m.baseline - m.current) / (m.baseline - m.goal)) * 100)) : 0;
      return (
        <div key={i} style={{ background:t.card, borderRadius:12, padding:"12px 14px", marginBottom:7, boxShadow:t.cardShadow }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:5 }}>
            <span style={{ fontSize:12, color:t.text }}>{m.label}</span>
            <span style={{ fontSize:14, fontWeight:300, color: m.current ? t.accent : t.muted }}>
              {m.current ?? "---"} <span style={{ fontSize:9, color:t.muted }}>{m.unit}</span>
            </span>
          </div>
          <div style={{ height:4, borderRadius:2, background:t.tileFill, overflow:"hidden", marginBottom:3 }}>
            <div style={{ width:`${pct}%`, height:"100%", borderRadius:2, background: m.current ? t.accent : "transparent", transition:"width 0.5s" }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:9, color:t.muted }}>
            <span>{m.baseline} → {m.goal}{m.unit}</span>
            {m.note && <span style={{ color: m.current ? t.accent : t.muted, fontWeight: m.current ? 600 : 400 }}>{m.note}</span>}
          </div>
        </div>
      );
    })}
  </div>
);

export default function Comparison() {
  const [tabA, setTabA] = useState("home");
  const [tabB, setTabB] = useState("home");
  const [tabC, setTabC] = useState("home");

  const Nav = ({ tab, setTab, t }) => (
    <div style={{
      position:"sticky", bottom:0, left:0, right:0, height:52,
      background:t.card, display:"flex", justifyContent:"space-around", alignItems:"center",
      boxShadow:"0 -2px 10px rgba(0,0,0,0.04)",
    }}>
      {[{ key:"home", icon:"⊙", label:"Home" },{ key:"log", icon:"+", label:"Log" },{ key:"journey", icon:"↗", label:"Journey" }].map(({ key, icon, label }) => (
        <div key={key} onClick={() => setTab(key)} style={{ textAlign:"center", cursor:"pointer", padding:"6px 14px" }}>
          <div style={{ fontSize:16, color:tab===key?t.accent:"#ccc", marginBottom:1 }}>{icon}</div>
          <div style={{ fontSize:8, color:tab===key?t.accent:t.muted, fontWeight:tab===key?600:400 }}>{label}</div>
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#F5F3EF", fontFamily:"'DM Sans',sans-serif", padding:"28px 16px 50px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{ textAlign:"center", marginBottom:28 }}>
        <div style={{ fontSize:24, fontWeight:300, color:"#1a1a1a" }}>Contrast Comparison</div>
        <div style={{ fontSize:12, color:"#888", marginTop:4 }}>Same layout. Tap Home/Log on each phone.</div>
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap:28, flexWrap:"wrap", alignItems:"flex-start" }}>
        <PhoneFrame label="Golden Era Mobile" subtitle="Medium contrast. Balanced readability + warmth.">
          <div style={{ background:mid.bg, minHeight:"100%", fontFamily:"'DM Sans',sans-serif" }}>
            {tabC === "home" && <HomeTab t={mid}/>}
            {tabC === "log" && <LogTab t={mid}/>}
            {tabC === "journey" && <JourneyTab t={mid}/>}
            <Nav tab={tabC} setTab={setTabC} t={mid}/>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
