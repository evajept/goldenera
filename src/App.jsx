import React, { useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   Golden Era Desktop - Angkhana's 90-Day Metabolic Wellness Tracker
   Redesigned with mobile theme language
   ═══════════════════════════════════════════════════════════════ */

// localStorage shim
const _s={};
const LS={
  get:(k)=>{try{return localStorage.getItem(k)}catch{return _s[k]||null}},
  set:(k,v)=>{try{localStorage.setItem(k,v)}catch{_s[k]=v}},
  rm:(k)=>{try{localStorage.removeItem(k)}catch{delete _s[k]}},
};

// Font
const FL="https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600;700;800&display=swap";
if(!document.querySelector(`link[href="${FL}"]`)){const l=document.createElement("link");l.rel="stylesheet";l.href=FL;document.head.appendChild(l);}

const API="https://script.google.com/macros/s/AKfycbxWHehS2Drs5gXKPuNv1u173pLu7Mr8ZOJ7KX5pEOS4L5K-X7HOeHBN1Cw9pUt5Byf2Hw/exec";

// Debounced save
const _sq={};let _st=null;
const qSave=(date,data,type="tracker")=>{_sq[type+"-"+date]={date,data,type};clearTimeout(_st);_st=setTimeout(async()=>{const items=Object.values(_sq);Object.keys(_sq).forEach(k=>delete _sq[k]);for(const i of items){try{const action=i.type==="body"?"saveBody":i.type==="lab"?"saveLab":"saveDay";await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action,date:i.date,data:i.data})})}catch(e){console.log("Sync err:",e)}}},2000)};

const WEIGHT=73.6,HCM=167;
const BMI_VAL=(WEIGHT/((HCM/100)**2)).toFixed(1);

// ─── Theme (mobile design language) ───
const t={
  bg:"#E8E4DE",card:"#FDFCF9",tile:"#E8E3DB",on:"#C8DFC9",
  accent:"#4A7A50",dark:"#3D6842",text:"#1A1612",muted:"#8A7E72",light:"#B0A698",
  ok:"#4A7A50",okBg:"#E8F0E8",okBd:"#C8DFC9",
  warn:"#B8860B",warnBg:"#FDF6E8",warnBd:"#E8D8B0",
  danger:"#C44",dangerBg:"#FDF0EE",dangerBd:"#E8C8C0",
  sh:"0 2px 8px rgba(0,0,0,0.10)",shOn:"0 3px 10px rgba(74,122,80,0.20)",
  csh:"0 3px 16px rgba(0,0,0,0.08)",
  r:16,rs:10,font:"'DM Sans',sans-serif",
};
const stC={critical:{bg:t.dangerBg,tx:t.danger},warning:{bg:t.warnBg,tx:t.warn},ok:{bg:t.okBg,tx:t.ok}};

// ─── Lab markers ───
const labMarkers=[
  {marker:"HbA1C",confirmed:"9.4%",normal:"<5.7%",status:"critical",s30:"8.2-8.5%",s60:"7.0-7.5%",s90:"5.8-6.3%"},
  {marker:"Fasting Glucose",confirmed:"211",normal:"70-99",status:"critical",s30:"140-160",s60:"110-125",s90:"85-100"},
  {marker:"Triglycerides",confirmed:"702",day15:"231",normal:"<160",status:"critical",s30:"160-180",s60:"120-140",s90:"90-110"},
  {marker:"GGT",confirmed:"184",normal:"9-39",status:"critical",s30:"100-130",s60:"50-70",s90:"25-40"},
  {marker:"SGPT (ALT)",confirmed:"50",normal:"<35",status:"warning",s30:"35-40",s60:"25-30",s90:"18-25"},
  {marker:"SGOT (AST)",confirmed:"31",normal:"<32",status:"ok",s30:"26-30",s60:"22-26",s90:"18-22"},
  {marker:"Cholesterol",confirmed:"220",normal:"<200",status:"warning",s30:"200-210",s60:"190-200",s90:"180-195"},
  {marker:"Uric Acid",confirmed:"7.2",normal:"2.3-6.1",status:"warning",s30:"6.2-6.5",s60:"5.5-6.0",s90:"5.0-5.5"},
  {marker:"HDL-C",confirmed:"45",normal:">44",status:"ok",s30:"46-48",s60:"48-52",s90:"52-58"},
  {marker:"LDL-C",confirmed:"109",normal:"<130",status:"ok",s30:"105-110",s60:"100-108",s90:"95-105"},
  {marker:"Creatinine",confirmed:"0.52",normal:"0.5-0.9",status:"ok",s30:"0.52",s60:"0.52",s90:"0.52"},
  {marker:"eGFR",confirmed:"130",normal:">90",status:"ok",s30:"130",s60:"130",s90:"128"},
  {marker:"Weight",confirmed:"73.6",normal:"BMI<23",status:"warning",s30:"69-70",s60:"65-67",s90:"60-63"},
  {marker:"BMI",confirmed:"26.4",normal:"18.5-22.9",status:"warning",s30:"24.7-25.1",s60:"23.3-24.0",s90:"21.5-22.6"},
];

const labMeanings={
  "HbA1C":{what:"Average blood sugar over 3 months",why:"9.4% = uncontrolled diabetes.",risk:"Nerve/kidney/vision damage if sustained above 8%.",fix:"Berberine, low-carb, walking, sleep 7+"},
  "Fasting Glucose":{what:"Blood sugar after 8+ hours fasting",why:"211 = severely elevated. Normal 70-99.",risk:"Damages blood vessels, nerves.",fix:"Berberine, fiber first, zero sweet drinks, IF 14:10"},
  "Triglycerides":{what:"Fat in blood from food and liver",why:"702 (4x limit). Day 15: 231 (-67%).",risk:"Pancreatitis risk cleared. Target <150.",fix:"Fish oil 3-4g/day, zero sweet drinks, swimming"},
  "GGT":{what:"Liver enzyme for damage/inflammation",why:"184 = 4.7x upper limit. Fatty liver.",risk:"Liver inflammation, scarring if untreated.",fix:"Liver regenerates in 6-8 weeks. Remove sugar"},
  "SGPT (ALT)":{what:"Liver cell damage marker",why:"50 = slightly above 35 limit.",risk:"Mild. Will normalize with fatty liver resolution.",fix:"Same as GGT. ALT drops faster"},
  "SGOT (AST)":{what:"Enzyme in liver, heart, muscles",why:"31 = within normal (<32).",risk:"OK. Monitor alongside ALT.",fix:"No action needed"},
  "Cholesterol":{what:"Total LDL + HDL + VLDL",why:"220 = mildly elevated. Driven by high trig.",risk:"Moderate. Will drop as trig normalizes.",fix:"Fish oil, fiber, walking"},
  "Uric Acid":{what:"Waste from breaking down purines",why:"7.2 = above 6.1 limit. Gout risk.",risk:"Gout flares, kidney stones.",fix:"Hydration 2L+, reduce organ meats"},
  "HDL-C":{what:"Good cholesterol",why:"45 = borderline (min 44). Target 50+.",risk:"Low HDL = higher cardio risk.",fix:"Exercise, olive oil, nuts"},
  "LDL-C":{what:"Bad cholesterol",why:"109 = within normal (<130).",risk:"OK for now.",fix:"Focus on trig and glucose first"},
  "Creatinine":{what:"Kidney waste product",why:"0.52 = perfect.",risk:"None. Kidneys healthy.",fix:"Stay hydrated"},
  "eGFR":{what:"Kidney filtration rate",why:"130 = excellent (>90 normal).",risk:"None.",fix:"Maintain hydration"},
  "Weight":{what:"Body weight",why:"73.6 kg = BMI 26.4 (overweight).",risk:"Visceral fat drives insulin resistance.",fix:"Low-carb + walking + IF"},
  "BMI":{what:"Weight/height. Asian cutoff 23",why:"26.4 = overweight.",risk:"Every 1pt drop improves insulin sensitivity.",fix:"Target 21-22"},
};

// ─── Chart data ───
const chartData={
  gluc:[{m:"26 Feb",v:211,c:true},{m:"2 Mar",v:180,c:true},{m:"3 Mar",v:170,c:true},{m:"4 Mar",v:160,c:true},{m:"5 Mar",v:142,c:true},{m:"6 Mar",v:140,c:true},{m:"7 Mar",v:147,c:true},{m:"8 Mar",v:150,c:true},{m:"9 Mar",v:150,c:true},{m:"10 Mar",v:123,c:true},{m:"11 Mar",v:120,c:true},{m:"12 Mar",v:123,c:true},{m:"13 Mar",v:115,c:true},{m:"14 Mar",v:118,c:true},{m:"15 Mar",v:108,c:true},{m:"D30",v:95},{m:"D60",v:85},{m:"D90",v:80}],
  hb:[{m:"26 Feb",v:9.4,c:true},{m:"D30",v:7.8},{m:"D60",v:6.5},{m:"D90",v:5.7}],
  trig:[{m:"26 Feb",v:702,c:true},{m:"16 Mar",v:231,c:true},{m:"D30",v:170},{m:"D60",v:125},{m:"D90",v:95}],
  wt:[{m:"26 Feb",v:73.6,c:true},{m:"8 Mar",v:71.8,c:true},{m:"15 Mar",v:70.9,c:true},{m:"D30",v:69},{m:"D60",v:65},{m:"D90",v:62}],
  ggt:[{m:"26 Feb",v:184,c:true},{m:"D30",v:110},{m:"D60",v:55},{m:"D90",v:30}],
  chol:[{m:"26 Feb",v:220,c:true},{m:"D30",v:205},{m:"D60",v:195},{m:"D90",v:187}],
  bmi:[{m:"26 Feb",v:26.4,c:true},{m:"8 Mar",v:25.7,c:true},{m:"15 Mar",v:25.4,c:true},{m:"D30",v:24.7},{m:"D60",v:23.3},{m:"D90",v:22.2}],
};
const cSets={
  hb:{data:chartData.hb,label:"HbA1C",ref:5.7,refL:"<5.7%",dom:[4,10]},
  trig:{data:chartData.trig,label:"Triglycerides",ref:150,refL:"<150",dom:[0,750]},
  wt:{data:chartData.wt,label:"Weight",ref:60,refL:"60kg",dom:[55,75]},
  ggt:{data:chartData.ggt,label:"GGT",ref:39,refL:"<39",dom:[0,200]},
  chol:{data:chartData.chol,label:"Cholesterol",ref:200,refL:"<200",dom:[150,240]},
  gluc:{data:[chartData.gluc[0],chartData.gluc[14],chartData.gluc[15],chartData.gluc[16],chartData.gluc[17]],label:"Glucose",ref:99,refL:"<99",dom:[50,230]},
  bmi:{data:chartData.bmi,label:"BMI",ref:23,refL:"<23",dom:[18,28]},
};

// ─── Clinical notes ───
const clinicalNotes={
  "16 Mar (Day 15)":[
    {icon:"🎉",sev:"excellent",title:"TRIGLYCERIDES 231 - down 67% from 702",text:"Lab confirmed: 702 to 231 in 15 days. Well below 500 pancreatitis threshold."},
    {icon:"🐟",sev:"excellent",title:"Fish oil x3 validated",text:"Therapeutic-dose fish oil + sugar elimination + IF driving the 67% drop."},
    {icon:"🎯",sev:"ontrack",title:"Next target: TG under 150",text:"Maintain fish oil x3, strict on refined carbs, swimming 3-4x/week."},
  ],
  "15 Mar (Day 14)":[
    {icon:"🎉",sev:"excellent",title:"Fasting 108 - holding steady",text:"Liver gap -7. Third consecutive negative liver gap. Down 103 from 211 (-49%)."},
    {icon:"🍵",sev:"excellent",title:"Stevia confirmed safe",text:"Thai tea + cola with stevia: no glucose spike."},
    {icon:"🍫",sev:"grow",title:"No sugar broken",text:"Cranberry soda + chocolate mousse spiked 133 to 170 (+37)."},
  ],
  "14 Mar (Day 13)":[
    {icon:"🫀",sev:"excellent",title:"Liver gap -2 (first negative)",text:"Night 120, fasting 118. Liver responding to insulin during sleep."},
    {icon:"🏊",sev:"excellent",title:"Swimming: glucose to 92",text:"After cardio swim + stretching. First time approaching normal range."},
    {icon:"⏰",sev:"excellent",title:"IF 18:6 achieved",text:"10:30-16:30 window. Best IF ratio yet."},
  ],
  "13 Mar (Day 12)":[
    {icon:"📉",sev:"excellent",title:"Fasting 115, all-time low - Score 105",text:"Down 96 from 211 (-45%). Below pre-diabetic threshold."},
    {icon:"🏊",sev:"excellent",title:"Swimming: 131 to 101",text:"First reading approaching normal. Exercise is most powerful acute tool."},
    {icon:"🍚",sev:"grow",title:"3 spoons low GI rice: +46 spike",text:"117 to 163. Pancreas isn't ready for rice yet."},
  ],
};

// ─── Daily habits ───
const dailyHabits=[
  {icon:"☀️",step:"Wake: Water + sunlight + 5 deep breaths",impact:"Resets circadian rhythm"},
  {icon:"🌱",step:"Basil seeds in water 15 min before meal",impact:"Reduces spike 20-35%"},
  {icon:"🥗",step:"Eat fiber + protein FIRST, carbs LAST",impact:"Reduces spike up to 40%"},
  {icon:"🌿",step:"Berberine 600mg with first bites",impact:"Works like metformin"},
  {icon:"🐟",step:"Fish oil with meals (3-4g/day)",impact:"Lowers triglycerides 25-50%"},
  {icon:"🚶",step:"Walk 10-15 min after each meal",impact:"Drops glucose 20-40 pts"},
  {icon:"🏋️",step:"Weight training 2x/week",impact:"Muscles absorb glucose 24-48hr after"},
  {icon:"🚫",step:"Zero sweet drinks",impact:"#1 triglyceride driver"},
  {icon:"⏰",step:"IF 14:10 window",impact:"Liver processes fat overnight"},
  {icon:"🥜",step:"Brazil nuts x3 with last meal",impact:"Thyroid + immune support"},
  {icon:"💧",step:"Water 2L+ daily",impact:"Flushes toxins, prevents false hunger"},
  {icon:"💊",step:"Bedtime: Mg 200-400mg + D3/K2",impact:"Improves sleep + fasting glucose"},
  {icon:"😴",step:"Sleep 7+ hours",impact:"Poor sleep = glucose +15-30 next morning"},
];

// ─── Supplements ───
const supps=[
  {name:"Berberine",dose:"600mg x2 w/ meals",trig:"-20-35%",hb:"-0.9-2%",icon:"🌿"},
  {name:"Fish Oil",dose:"3-4g EPA+DHA split",trig:"-20-50%",hb:"Min",icon:"🐟"},
  {name:"Magnesium",dose:"200mg+ bedtime",trig:"-5-15%",hb:"-0.3-0.5%",icon:"💎"},
  {name:"D3 + K2",dose:"2000-5000 IU + 100mcg",trig:"Indirect",hb:"-0.3-0.5%",icon:"☀️"},
];

// ─── Tracker rows (matching Sheet) ───
const trackerRows=[
  {label:"🩸 Fasting Glucose",field:"glucFast",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🍽️ Post-meal",field:"glucPost",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🌙 Night",field:"glucNight",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🫀 Liver Gap",field:"_liverGap",type:"computed",section:"glucose"},
  {label:"🍳 First meal",field:"m1t",type:"time",section:"meals"},
  {label:"🌙 Last meal",field:"mLast",type:"time",section:"meals"},
  {label:"⏱️ IF ratio",field:"_ifRatio",type:"computed",section:"meals"},
  {label:"🚶 After meal move",field:"moveAfter",type:"select",opts:["x1","x2","x3"],section:"activity"},
  {label:"🏋️ Exercise",field:"act",type:"select",opts:["none","rest","walk","housework","stretch","cardio","weights"],section:"activity"},
  {label:"🌿 Berberine",field:"berb",type:"select",opts:["0","x1","x2"],section:"supps"},
  {label:"🐟 Fish Oil",field:"fish",type:"select",opts:["0","x1","x2","x3"],section:"supps"},
  {label:"💊 Magnesium",field:"mag",type:"select",opts:["0","x1","x2","x3"],section:"supps"},
  {label:"☀️ D3 + K2",field:"d3k2",type:"select",opts:["0","x1","x2"],section:"supps"},
  {label:"🥗 Fiber first",field:"fiberFirst",type:"check",section:"habits"},
  {label:"🚫 No sugar",field:"noSweet",type:"check",section:"habits"},
  {label:"💧 Water 2L",field:"water",type:"check",section:"habits"},
  {label:"🦠 Probiotics",field:"probio",type:"check",section:"habits"},
  {label:"🌱 Basil seeds",field:"basil",type:"check",section:"habits"},
  {label:"🥜 Brazil nuts",field:"brazil",type:"check",section:"habits"},
  {label:"😴 Sleep",field:"sleep",type:"select",opts:["<6","<7","7+","8+"],section:"sleep"},
  {label:"📝 Notes",field:"notes",type:"text",ph:"...",section:"notes"},
];

const tabDefs=[{icon:"+",label:"Log"},{icon:"↗",label:"Journey"},{icon:"🩸",label:"Labs"},{icon:"📖",label:"Guide"}];

// ─── Score calculation (exact match) ───
const getDayScore=(wd)=>{
  if(!wd)return null;
  const has=wd.glucFast||wd.berb||wd.fish||wd.act||wd.moveAfter||wd.noSweet||wd.fiberFirst||wd.water||wd.sleep||wd.mag||wd.d3k2||wd.m1t||wd.mLast;
  if(!has)return null;
  let b=0,x=0;
  if(wd.noSweet)b+=18;
  if(wd.berb==="x2")b+=15;else if(wd.berb==="x1")b+=7;
  if(wd.sleep==="7+"||wd.sleep==="8+")b+=14;else if(wd.sleep==="<7")b+=7;
  if(wd.fish==="x3")b+=10;else if(wd.fish==="x2")b+=6;else if(wd.fish==="x1")b+=3;
  if(wd.act&&wd.act!=="none"&&wd.act!=="0"){b+=5;if(wd.act==="weights")x+=10;else if(wd.act==="cardio")x+=5;}
  if(wd.moveAfter==="x3")b+=8;else if(wd.moveAfter==="x2")b+=6;else if(wd.moveAfter==="x1")b+=3;
  if(wd.m1t&&wd.mLast){const[h1,n1]=(wd.m1t||"").split(":").map(Number);const[h2,n2]=(wd.mLast||"").split(":").map(Number);if(!isNaN(h1)&&!isNaN(h2)){const e=(h2*60+(n2||0))-(h1*60+(n1||0));const f=24-(e/60);if(f>=16){b+=8;x+=5}else if(f>=15){b+=8;x+=2}else if(f>=14)b+=8;else if(f>=13)b+=4;}}
  if(wd.fiberFirst)b+=7;
  if(wd.water)b+=5;
  if(wd.mag&&wd.mag!=="0")b+=5;
  if(wd.d3k2&&wd.d3k2!=="0")b+=5;
  if(wd.probio)x+=2;if(wd.brazil)x+=2;if(wd.basil)x+=2;
  return{base:b,bonus:x,total:b+x};
};

// ─── Journey data ───
const journeyData=[
  {label:"Fasting glucose",baseline:211,current:95,d30:150,d60:118,d90:93,goal:85,unit:"mg/dL",dec:0,note:"Hit normal range Day 15"},
  {label:"Weight",baseline:73.6,current:70.9,d30:69.5,d60:66,d90:61.5,goal:60,unit:"kg",dec:1,note:"5% threshold at 69.9 kg"},
  {label:"BMI",baseline:26.4,current:25.4,d30:24.9,d60:23.7,d90:22.1,goal:22,unit:"",dec:1},
  {label:"Triglycerides",baseline:702,current:231,d30:170,d60:125,d90:95,goal:100,unit:"mg/dL",dec:0,note:"Day 15: 231 (-67%)"},
  {label:"HbA1C",baseline:9.4,current:null,d30:8.4,d60:7.3,d90:6.1,goal:5.5,unit:"%",dec:1,note:"Awaiting Day 30 lab"},
  {label:"GGT",baseline:184,current:null,d30:115,d60:60,d90:33,goal:25,unit:"U/L",dec:0,note:"Awaiting Day 30 lab"},
];

// (food content moved inline to Food tab)

// (science content moved inline to Science tab)

// ═══ Shared UI components ═══
const Pill=({active,children,onClick})=>(<button onClick={onClick} style={{padding:"7px 16px",borderRadius:50,fontSize:13,fontWeight:active?700:500,border:"none",cursor:"pointer",background:active?t.accent:t.tile,color:active?"#fff":t.muted,fontFamily:t.font,boxShadow:active?t.shOn:t.sh,transition:"all 0.15s"}}>{children}</button>);
const Card=({children,style:s={}})=>(<div style={{background:t.card,borderRadius:t.r,padding:"16px 18px",marginBottom:12,boxShadow:t.csh,...s}}>{children}</div>);

// ═══ MAIN COMPONENT ═══
export default function GoldenEra(){
  const[tab,setTab]=useState(0);
  const[sheetStatus,setSS]=useState("idle");
  const[labChart,setLC]=useState("hb");
  const[trendChart,setTC]=useState("glucose");
  const[noteTab,setNT]=useState("16 Mar (Day 15)");
  const[labMeanTab,setLMT]=useState(0);
  const[expandedLab,setEL]=useState(null);
  const[sciTopic,setSciTopic]=useState(null);
  const[scoreOpen,setScoreOpen]=useState(false);
  const[analyzing,setAnalyzing]=useState(false);
  const[aiNotes,setAiNotes]=useState({});
  const[actTab,setActTab]=useState("activities");
  const[guideSection,setGS]=useState("lifestyle");
  const[showMeas,setShowMeas]=useState(true);
  const[showLab,setShowLab]=useState(true);
  const[labData,setLabData]=useState(()=>{try{const s=LS.get("ge_labData");return s?JSON.parse(s):{}}catch{return{}}});

  // Week navigation
  const[weekStart,setWS]=useState(()=>{const d=new Date();const dy=d.getDay();const df=d.getDate()-dy+(dy===0?-6:1);return new Date(d.setDate(df)).toISOString().split("T")[0]});
  const getWD=s=>{const r=[];for(let i=0;i<7;i++){const d=new Date(s);d.setDate(d.getDate()+i);r.push(d.toISOString().split("T")[0])}return r};
  const weekDates=getWD(weekStart);
  const dn=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const shiftW=dir=>{const d=new Date(weekStart);d.setDate(d.getDate()+dir*7);setWS(d.toISOString().split("T")[0])};

  // Tracker data
  const[weekData,setWD]=useState(()=>{try{const s=LS.get("ge_weekData");return s?JSON.parse(s):{}}catch{return{}}});
  const upWD=(date,f,v)=>setWD(p=>{const u={...p,[date]:{...(p[date]||{}),[f]:v}};qSave(date,u[date],"tracker");return u});
  const[bodyMeas,setBM]=useState(()=>{try{const s=LS.get("ge_bodyMeas");return s?JSON.parse(s):{}}catch{return{}}});

  // Persist
  React.useEffect(()=>{try{LS.set("ge_weekData",JSON.stringify(weekData))}catch{}},[weekData]);

  // Load from Sheet
  React.useEffect(()=>{
    setSS("loading");
    fetch(API+"?action=load").then(r=>r.json()).then(d=>{
      if(d.tracker&&Object.keys(d.tracker).length>0){
        setWD(p=>({...p,...d.tracker}));
        // Extract body_ and lab_ fields into their states
        const bm={},ld={};
        Object.entries(d.tracker).forEach(([date,dayData])=>{
          Object.entries(dayData).forEach(([k,v])=>{
            if(k.startsWith("body_")) bm[`${k.replace("body_","")}-${date}`]=v;
            if(k.startsWith("lab_")) ld[`${k}-${date}`]=v;
          });
        });
        if(Object.keys(bm).length>0) setBM(p=>({...p,...bm}));
        if(Object.keys(ld).length>0) setLabData(p=>({...p,...ld}));
      }
      if(d.body&&Object.keys(d.body).length>0)setBM(p=>({...p,...d.body}));
      if(d.lab&&Object.keys(d.lab).length>0)setLabData(p=>({...p,...d.lab}));
      setSS("synced");
    }).catch(()=>setSS("error"));
  },[]);

  // Week score
  const getWeekScore=()=>{let tb=0,tx=0,n=0;weekDates.forEach(d=>{const s=getDayScore(weekData[d]||{});if(s){tb+=s.base;tx+=s.bonus;n++}});return n>0?{score:Math.round(tb/n),bonus:Math.round(tx/n),total:Math.round((tb+tx)/n),days:n}:{score:0,bonus:0,total:0,days:0}};
  const ws=getWeekScore();
  const dayNum=Math.max(0,Math.floor((new Date()-new Date("2026-03-02"))/864e5)+1);

  // ─── Chart renderer ───
  const MiniChart=({ck})=>{
    const ch=cSets[ck];if(!ch)return null;
    const pts=ch.data.filter(p=>p.v!=null);if(pts.length<2)return null;
    const W=420,H=130,PX=50,PY=18;
    const[mn,mx]=ch.dom;const rng=mx-mn;
    const xS=(W-PX*2)/(ch.data.length-1);
    const toY=v=>PY+(H-PY*2)*(1-(v-mn)/rng);
    const toX=i=>PX+i*xS;
    const all=ch.data.map((p,i)=>({...p,x:toX(i),y:p.v!=null?toY(p.v):null}));
    const valid=all.filter(p=>p.y!=null);
    const conf=valid.filter(p=>p.c);
    const pred=valid.filter(p=>!p.c);
    const lastC=conf[conf.length-1];
    const refY=toY(ch.ref);
    return(
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:160}}>
        <line x1={PX} y1={refY} x2={W-PX} y2={refY} stroke={t.ok} strokeDasharray="4,3" strokeWidth={1} opacity={0.5}/>
        <text x={W-PX+4} y={refY+3} fontSize={9} fill={t.ok}>{ch.refL}</text>
        {conf.length>1&&<polyline points={conf.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={t.accent} strokeWidth={2.5}/>}
        {lastC&&pred.length>0&&<polyline points={[lastC,...pred].map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={t.accent} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.4}/>}
        {valid.map((p,i)=>(<g key={i}><circle cx={p.x} cy={p.y} r={p.c?5:4} fill={p.c?t.accent:t.card} stroke={t.accent} strokeWidth={p.c?0:1.5} opacity={p.c?1:0.5}/><text x={p.x} y={p.y-10} textAnchor="middle" fontSize={9} fontWeight={p.c?700:400} fill={p.c?t.accent:t.muted}>{p.v}{p.c?" ✓":""}</text></g>))}
        {ch.data.map((p,i)=>(<text key={i} x={toX(i)} y={H-3} textAnchor="middle" fontSize={8} fill={p.c?t.accent:t.muted} fontWeight={p.c?600:400}>{p.m}</text>))}
      </svg>
    );
  };

  // ─── Trend chart with multi-line support ───
  const TrendChart=({type})=>{
    const labels=["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12","D13","D14","D15"];
    const fasting=[180,170,160,142,140,147,150,150,123,120,123,115,118,108,95];
    const postMeal=[null,null,null,null,null,180,217,150,160,143,150,163,140,null,170];
    const night=[null,null,null,null,null,null,140,137,131,127,137,120,115,109,null];
    const scores=[33,40,60,67,73,67,61,85,89,93,91,105,106,108,96];
    const wLabels=["Base","D7","D14"];const wData=[73.6,71.8,70.9];
    const ifData=[14,12,14,15,15,15,12,15,15,15,14,15,18,null,18];

    const W=380,H=100,P={t:16,b:20,l:30,r:10};
    const cw=W-P.l-P.r,ch=H-P.t-P.b;

    const mkLine=(data,lbls,yMin,yMax,color,title,refLines,multi)=>{
      const allV=multi?multi.flatMap(m=>m.data.filter(v=>v!=null)):(data||[]).filter(v=>v!=null);
      if(allV.length<2)return null;
      const lo=yMin??Math.floor(Math.min(...allV)-(Math.max(...allV)-Math.min(...allV))*0.15||5);
      const hi=yMax??Math.ceil(Math.max(...allV)+(Math.max(...allV)-Math.min(...allV))*0.15||5);
      const rng=hi-lo||1;
      const xp=i=>P.l+(i/(lbls.length-1))*cw;
      const yp=v=>P.t+(1-(v-lo)/rng)*ch;
      const path=d=>{const pts=d.map((v,i)=>v!=null?{x:xp(i),y:yp(v)}:null).filter(Boolean);return pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")};
      const lines=multi||[{data,color,label:null}];
      return(
        <Card>
          <div style={{fontSize:14,fontWeight:700,color:t.text,marginBottom:8}}>{title}</div>
          {multi&&multi.length>1&&<div style={{display:"flex",gap:12,marginBottom:6}}>{multi.map((m,i)=>(<span key={i} style={{fontSize:11,color:m.color,fontWeight:600}}>● {m.label}</span>))}</div>}
          <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:200}}>
            {(refLines||[]).map((rl,i)=>(<g key={i}><line x1={P.l} y1={yp(rl.v)} x2={W-P.r} y2={yp(rl.v)} stroke={rl.color} strokeWidth={0.6} strokeDasharray="3,3"/><text x={W-P.r+2} y={yp(rl.v)+3} fontSize={7} fill={rl.color}>{rl.label}</text></g>))}
            {lines.map((ln,li)=>{const p=path(ln.data);const pts=ln.data.map((v,i)=>v!=null?{x:xp(i),y:yp(v),v}:null).filter(Boolean);return(<g key={li}><path d={p} fill="none" stroke={ln.color} strokeWidth={1.5} strokeLinecap="round"/>{pts.map((p,i)=>(<g key={i}><circle cx={p.x} cy={p.y} r={2.5} fill={ln.color} stroke={t.card} strokeWidth={1}/>{(i===0||i===pts.length-1)&&<text x={p.x} y={p.y-6} textAnchor="middle" fontSize={7} fontWeight={700} fill={ln.color}>{typeof p.v==="number"&&p.v%1!==0?p.v.toFixed(1):p.v}</text>}</g>))}</g>)})}
            {lbls.map((l,i)=>(i===0||i===lbls.length-1||i%3===0)&&<text key={i} x={xp(i)} y={H-2} textAnchor="middle" fontSize={7} fill={t.muted}>{l}</text>)}
          </svg>
        </Card>
      );
    };

    if(type==="glucose")return mkLine(null,labels,80,230,null,"Glucose Trend",[{v:99,color:t.ok,label:"Normal"}],[{data:fasting,color:t.accent,label:"Fasting"},{data:postMeal,color:t.danger,label:"Post-meal"},{data:night,color:"#8A7E72",label:"Night"}]);
    if(type==="score")return mkLine(scores,labels,0,121,t.ok,"Habit Score",[{v:100,color:t.accent,label:"Max"}]);
    if(type==="weight")return mkLine(wData,wLabels,null,null,t.accent,"Weight (kg)");
    if(type==="if")return mkLine(ifData,labels,10,20,"#6b7c5e","IF Hours Fasted",[{v:14,color:t.warn,label:"14:10"},{v:16,color:t.ok,label:"16:8"}]);
    if(type==="liver"){const gap=labels.map((_,i)=>{if(i===0)return null;const pn=night[i-1],cf=fasting[i];if(pn==null||cf==null)return null;return cf-pn});return mkLine(gap,labels,null,null,"#9b6b3d","Liver Gap",[{v:0,color:t.ok,label:"Zero"}]);}
    return null;
  };

  // ═══ RENDER ═══
  return(
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:t.font,color:t.text,display:"flex",flexDirection:"column"}}>
      {/* TOP BAR - Design C: tile tabs, no title */}
      <div style={{position:"sticky",top:0,zIndex:100,background:t.bg,padding:"10px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 1px 6px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",gap:3,flex:1}}>
          {tabDefs.map((td,i)=>{
            const active=tab===i;
            return(<button key={td.label} onClick={()=>setTab(i)} style={{padding:"8px 14px",borderRadius:12,border:"none",cursor:"pointer",fontFamily:t.font,fontSize:13,fontWeight:active?700:500,color:active?t.accent:t.muted,background:active?t.on:"transparent",boxShadow:active?t.shOn:"none",transition:"all 0.15s",display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:14}}>{td.icon}</span>{td.label}
            </button>);
          })}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,flexShrink:0}}>
          {sheetStatus==="synced"&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:t.okBg,color:t.ok,fontWeight:600}}>synced</span>}
          {sheetStatus==="loading"&&<span style={{fontSize:9,padding:"3px 8px",borderRadius:50,background:t.warnBg,color:t.warn,fontWeight:600}}>loading</span>}
          <span style={{fontSize:13,color:t.muted,fontWeight:500}}>Day {dayNum}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{flex:1,padding:"20px 16px",overflowY:"auto",paddingBottom:24,maxWidth:900,margin:"0 auto",width:"100%"}}>

        {/* ══ LOG TAB ══ */}
        {tab===0&&(<div>
          {/* Week nav */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <button onClick={()=>shiftW(-1)} style={{background:t.tile,border:"none",borderRadius:50,width:36,height:36,cursor:"pointer",fontSize:16,color:t.text,boxShadow:t.sh,fontFamily:t.font}}>◀</button>
            <span style={{fontSize:16,fontWeight:700,color:t.accent}}>{new Date(weekDates[0]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} - {new Date(weekDates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
            <button onClick={()=>shiftW(1)} style={{background:t.tile,border:"none",borderRadius:50,width:36,height:36,cursor:"pointer",fontSize:16,color:t.text,boxShadow:t.sh,fontFamily:t.font}}>▶</button>
            {ws.days>0&&<div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:24,fontWeight:200,color:t.accent}}>{ws.total}</span>
              <span style={{fontSize:12,color:t.muted}}>avg/day</span>
            </div>}
          </div>

          {/* Tracker table */}
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%",minWidth:7*72+140}}>
                <thead><tr style={{background:t.tile}}>
                  <th style={{position:"sticky",left:0,background:t.tile,zIndex:2,padding:"10px 10px",fontSize:12,color:t.muted,textAlign:"left",minWidth:140,fontWeight:600}}></th>
                  {weekDates.map((d,i)=>(<th key={d} style={{padding:"10px 4px",fontSize:12,color:t.accent,textAlign:"center",minWidth:64,fontWeight:700}}><div>{dn[i]}</div><div style={{fontWeight:400,color:t.light,fontSize:11}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
                </tr></thead>
                <tbody>
                  {trackerRows.map((row,ri)=>{
                    const prev=ri>0?trackerRows[ri-1].section:null;
                    const div=row.section!==prev&&ri>0;
                    const wd=d=>weekData[d]||{};
                    const bg=ri%2===0?t.card:"#F5F2ED";
                    return(<React.Fragment key={row.field}>
                      {div&&<tr><td colSpan={8} style={{height:2,background:t.on,padding:0}}></td></tr>}
                      <tr style={{background:bg}}>
                        <td style={{position:"sticky",left:0,background:bg,zIndex:1,padding:"6px 10px",fontSize:12,color:t.text,fontWeight:600,whiteSpace:"nowrap"}}>{row.label}</td>
                        {weekDates.map((d,di)=>{
                          const val=wd(d)[row.field]||"";
                          if(row.type==="computed"){
                            if(row.field==="_liverGap"){
                              const tf=wd(d).glucFast;const pd=new Date(d);pd.setDate(pd.getDate()-1);const pn=wd(pd.toISOString().split("T")[0]).glucNight;
                              let disp="-",col=t.muted;
                              if(tf&&pn){const g=Number(tf)-Number(pn);disp=g>0?`+${g}`:String(g);col=g<=5?t.ok:g<=15?t.warn:t.danger}
                              return <td key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:12,color:col,fontWeight:600}}>{disp}</td>;
                            }
                            const m1=wd(d).m1t||"",mL=wd(d).mLast||"";
                            let disp="-",col=t.muted;
                            if(m1&&mL){const[h1,n1]=m1.split(":").map(Number);const[h2,n2]=mL.split(":").map(Number);if(!isNaN(h1)&&!isNaN(h2)){const e=(h2*60+(n2||0))-(h1*60+(n1||0));const f=24-Math.round(e/60);disp=`${f}:${Math.round(e/60)}`;col=f>=16?t.ok:f>=14?t.accent:f>=12?t.warn:t.danger}}
                            return <td key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:12,color:col,fontWeight:600}}>{disp}</td>;
                          }
                          if(row.type==="check"){
                            const on=!!wd(d)[row.field];
                            return <td key={d} onClick={()=>upWD(d,row.field,!on)} style={{padding:"4px",textAlign:"center",cursor:"pointer"}}><div style={{width:28,height:28,borderRadius:"50%",margin:"0 auto",background:on?t.accent:t.tile,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:on?t.shOn:t.sh,transition:"all 0.15s"}}><span style={{fontSize:13,color:on?"#fff":t.light,fontWeight:700}}>{on?"✓":"·"}</span></div></td>;
                          }
                          if(row.type==="select"){
                            return <td key={d} style={{padding:0}}><select value={val} onChange={e=>upWD(d,row.field,e.target.value)} style={{padding:"6px 2px",border:"none",fontSize:12,width:"100%",minWidth:52,background:"transparent",color:val?t.text:t.light,fontFamily:t.font,outline:"none",cursor:"pointer",textAlign:"center",fontWeight:val?600:400}}><option value="">-</option>{(row.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}</select></td>;
                          }
                          const isG=row.section==="glucose"&&val;
                          const gCol=isG?(Number(val)<=99?t.ok:Number(val)<=140?t.warn:t.danger):t.text;
                          return <td key={d} style={{padding:0}}><input type="text" inputMode={row.type==="number"?"numeric":undefined} placeholder={row.type==="time"?"HH:MM":(row.ph||"-")} value={val} onChange={e=>upWD(d,row.field,e.target.value)} style={{padding:"6px 4px",border:"none",fontSize:12,width:"100%",minWidth:52,background:"transparent",color:isG?gCol:t.text,fontWeight:isG?700:400,fontFamily:t.font,outline:"none",textAlign:"center",boxSizing:"border-box"}}/></td>;
                        })}
                      </tr>
                    </React.Fragment>)})}
                  {/* Score row */}
                  <tr><td colSpan={8} style={{height:2,background:t.on,padding:0}}></td></tr>
                  <tr style={{background:t.okBg}}>
                    <td style={{position:"sticky",left:0,background:t.okBg,zIndex:1,padding:"8px 10px",fontSize:14,color:t.accent,fontWeight:800}}>Score</td>
                    {weekDates.map(d=>{const s=getDayScore(weekData[d]||{});const tot=s?s.total:null;const col=tot==null?t.light:tot>=80?t.ok:tot>=50?t.warn:t.danger;return <td key={d} style={{padding:"8px 4px",textAlign:"center",fontSize:15,fontWeight:800,color:col}}>{tot??"-"}</td>})}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Score explanation */}
          <div onClick={()=>setScoreOpen(!scoreOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",padding:"10px 4px",marginBottom:scoreOpen?0:12}}>
            <span style={{fontSize:13,fontWeight:700,color:t.accent}}>How is the score calculated?</span>
            <span style={{color:t.muted}}>{scoreOpen?"▼":"▶"}</span>
          </div>
          {scoreOpen&&<Card style={{marginBottom:16}}>
            <div style={{fontWeight:800,marginBottom:8}}>Base /100</div>
            {[["🚫 No sugar","18"],["🌿 Berberine","15"],["😴 Sleep","14"],["🐟 Fish Oil","10"],["🚶 After meal move","8"],["⏳ Meal window","8"],["🥗 Fiber first","7"],["🏋️ Exercise","5"],["💧 Water","5"],["💊 Magnesium","5"],["☀️ D3+K2","5"]].map(([n,p],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13}}><span>{n}</span><span style={{color:t.accent,fontWeight:700}}>{p}</span></div>))}
            <div style={{fontWeight:800,marginTop:12,marginBottom:8}}>Bonuses</div>
            {[["🏋️ Weights","+10"],["🏊 Cardio/swim","+5"],["⏳ IF 16:8+","+5"],["⏳ IF 15:9","+2"],["🦠 Probiotics","+2"],["🥜 Brazil nuts","+2"],["🌱 Basil seeds","+2"]].map(([n,p],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:13,color:t.muted}}><span>{n}</span><span style={{color:t.ok,fontWeight:700}}>{p}</span></div>))}
          </Card>}

          {/* Body Measurements - collapsible */}
          <div onClick={()=>setShowMeas(!showMeas)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:24,marginBottom:showMeas?10:0,cursor:"pointer",padding:"4px 0"}}>
            <span style={{fontSize:16,fontWeight:700}}>Body Measurements</span>
            <span style={{fontSize:13,color:t.muted,padding:"4px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showMeas?"Hide":"Show"}</span>
          </div>
          {showMeas&&<Card style={{padding:0,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr style={{background:t.tile}}>
                  <th style={{position:"sticky",left:0,background:t.tile,zIndex:2,padding:"8px 10px",fontSize:12,color:t.muted,textAlign:"left",width:120,fontWeight:600}}>Measurement</th>
                  {weekDates.map((d,i)=>(<th key={d} style={{padding:"8px 4px",fontSize:12,color:t.accent,textAlign:"center",fontWeight:700}}><div>{dn[i]}</div><div style={{fontWeight:400,color:t.light,fontSize:11}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
                </tr></thead>
                <tbody>{[
                  {label:"⚖️ Weight",field:"weight",ph:"kg"},
                  {label:"📏 Neck",field:"neck",ph:"cm"},
                  {label:"📏 Shoulder",field:"shoulder",ph:"cm"},
                  {label:"💪 Upper Arm",field:"arm",ph:"cm"},
                  {label:"📏 Chest",field:"chest",ph:"cm"},
                  {label:"📏 Waist",field:"waist",ph:"cm"},
                  {label:"📏 Belly",field:"belly",ph:"cm"},
                  {label:"📏 Hip",field:"hip",ph:"cm"},
                  {label:"📐 Waist:Hip",field:"whr",ph:"ratio"},
                  {label:"🦵 Thigh",field:"thigh",ph:"cm"},
                  {label:"🦶 Calve",field:"calve",ph:"cm"},
                ].map((row,i)=>{
                  const bg=i%2===0?t.card:"#F5F2ED";
                  return(<tr key={row.field} style={{background:bg}}>
                    <td style={{position:"sticky",left:0,background:bg,zIndex:1,padding:"6px 10px",fontSize:12,color:t.text,fontWeight:600,whiteSpace:"nowrap"}}>{row.label}</td>
                    {weekDates.map(d=>(<td key={d} style={{padding:0}}><input type="text" placeholder={row.ph} value={bodyMeas[`${row.field}-${d}`]||""} onChange={e=>{const v=e.target.value;setBM(p=>{const n={...p,[`${row.field}-${d}`]:v};try{LS.set("ge_bodyMeas",JSON.stringify(n))}catch{};const bf={};Object.keys(n).forEach(k=>{if(k.endsWith("-"+d)){bf[k.split("-")[0]]=n[k]}});qSave(d,bf,"body");return n})}} style={{padding:"6px 4px",border:"none",fontSize:12,width:"100%",background:"transparent",color:t.text,fontFamily:t.font,outline:"none",textAlign:"center",boxSizing:"border-box"}}/></td>))}
                  </tr>)})}</tbody>
              </table>
            </div>
          </Card>}

          {/* Lab Markers - collapsible */}
          <div onClick={()=>setShowLab(!showLab)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:20,marginBottom:showLab?10:0,cursor:"pointer",padding:"4px 0"}}>
            <span style={{fontSize:16,fontWeight:700}}>Lab Markers</span>
            <span style={{fontSize:13,color:t.muted,padding:"4px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showLab?"Hide":"Show"}</span>
          </div>
          {showLab&&<Card style={{padding:0,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{borderCollapse:"collapse",width:"100%"}}>
                <thead><tr style={{background:t.tile}}>
                  <th style={{position:"sticky",left:0,background:t.tile,zIndex:2,padding:"8px 10px",fontSize:12,color:t.muted,textAlign:"left",width:140,fontWeight:600}}>Lab Marker</th>
                  {weekDates.map((d,i)=>(<th key={d} style={{padding:"8px 4px",fontSize:12,color:t.accent,textAlign:"center",fontWeight:700}}><div>{dn[i]}</div><div style={{fontWeight:400,color:t.light,fontSize:11}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
                </tr></thead>
                <tbody>{[
                  {label:"🩸 HbA1C (%)",field:"lab_hba1c",ph:"%"},
                  {label:"🩸 Fasting Glucose",field:"lab_glucose",ph:"mg/dL"},
                  {label:"🩸 Triglycerides",field:"lab_trig",ph:"mg/dL"},
                  {label:"🫁 GGT",field:"lab_ggt",ph:"U/L"},
                  {label:"🫁 SGPT (ALT)",field:"lab_alt",ph:"U/L"},
                  {label:"🫁 SGOT (AST)",field:"lab_ast",ph:"U/L"},
                  {label:"❤️ Cholesterol",field:"lab_chol",ph:"mg/dL"},
                  {label:"🔶 Uric Acid",field:"lab_uric",ph:"mg/dL"},
                  {label:"💚 HDL-C",field:"lab_hdl",ph:"mg/dL"},
                  {label:"❤️ LDL-C",field:"lab_ldl",ph:"mg/dL"},
                  {label:"💧 Creatinine",field:"lab_creat",ph:"mg/dL"},
                  {label:"💧 eGFR",field:"lab_egfr",ph:"mL/min"},
                ].map((row,i)=>{
                  const bg=i%2===0?t.card:"#F5F2ED";
                  return(<tr key={row.field} style={{background:bg}}>
                    <td style={{position:"sticky",left:0,background:bg,zIndex:1,padding:"6px 10px",fontSize:12,color:t.text,fontWeight:600,whiteSpace:"nowrap"}}>{row.label}</td>
                    {weekDates.map(d=>(<td key={d} style={{padding:0}}><input type="text" placeholder={row.ph} value={labData[`${row.field}-${d}`]||""} onChange={e=>{const v=e.target.value;setLabData(p=>{const n={...p,[`${row.field}-${d}`]:v};try{LS.set("ge_labData",JSON.stringify(n))}catch{};const lf={};Object.keys(n).forEach(k=>{if(k.endsWith("-"+d)){lf[k.split("-")[0]]=n[k]}});qSave(d,lf,"lab");return n})}} style={{padding:"6px 4px",border:"none",fontSize:12,width:"100%",background:"transparent",color:t.text,fontFamily:t.font,outline:"none",textAlign:"center",boxSizing:"border-box"}}/></td>))}
                  </tr>)})}</tbody>
              </table>
            </div>
          </Card>}
        </div>)}

        {/* ══ JOURNEY TAB ══ */}
        {tab===1&&(<div>
          {/* Week nav (same as Log) */}
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
            <button onClick={()=>shiftW(-1)} style={{background:t.tile,border:"none",borderRadius:50,width:36,height:36,cursor:"pointer",fontSize:16,color:t.text,boxShadow:t.sh,fontFamily:t.font}}>◀</button>
            <span style={{fontSize:16,fontWeight:700,color:t.accent}}>{new Date(weekDates[0]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} - {new Date(weekDates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
            <button onClick={()=>shiftW(1)} style={{background:t.tile,border:"none",borderRadius:50,width:36,height:36,cursor:"pointer",fontSize:16,color:t.text,boxShadow:t.sh,fontFamily:t.font}}>▶</button>
          </div>

          {/* Weekly Insight */}
          <div style={{fontSize:16,fontWeight:700,marginBottom:10}}>Insight</div>
          {(()=>{
            const glucVals=weekDates.map(d=>{const v=weekData[d]?.glucFast;return v?Number(v):null}).filter(v=>v);
            const glucMin=glucVals.length?Math.min(...glucVals):null;
            const glucMax=glucVals.length?Math.max(...glucVals):null;
            const glucAvg=glucVals.length?Math.round(glucVals.reduce((a,b)=>a+b,0)/glucVals.length):null;
            const postVals=weekDates.map(d=>{const v=weekData[d]?.glucPost;return v?Number(v):null}).filter(v=>v);
            const postAvg=postVals.length?Math.round(postVals.reduce((a,b)=>a+b,0)/postVals.length):null;
            const postMin=postVals.length?Math.min(...postVals):null;
            const postMax=postVals.length?Math.max(...postVals):null;
            let sleepGood=0,sleepTotal=0;const sleepH=[];
            weekDates.forEach(d=>{const s=weekData[d]?.sleep;if(s){sleepTotal++;if(s==="7+"||s==="8+")sleepGood++;if(s==="8+")sleepH.push(8.5);else if(s==="7+")sleepH.push(7.5);else if(s==="<7")sleepH.push(6.5);else if(s==="<6")sleepH.push(5.5)}});
            const sleepAvg=sleepH.length?Math.round(sleepH.reduce((a,b)=>a+b,0)/sleepH.length*10)/10:null;
            const weekNum=Math.ceil(dayNum/7);
            const expectedGluc=weekNum>0?Math.round(211-(211-150)*(weekNum*7/30)):null;
            const aheadPred=expectedGluc&&glucAvg?glucAvg<expectedGluc:false;
            const predDiff=expectedGluc&&glucAvg?expectedGluc-glucAvg:0;
            const parts=[];
            if(glucAvg){let g=`Fasting glucose avg at ${glucAvg}`;if(aheadPred)g+=`, beating the Day ${weekNum*7} prediction by ${predDiff} points`;g+=".";parts.push(g)}
            const learnings=[];const focus=[];
            const berbDays=weekDates.filter(d=>{const v=weekData[d]?.berb;return v&&v!=="0"}).length;
            const fishDays=weekDates.filter(d=>{const v=weekData[d]?.fish;return v&&v!=="0"}).length;
            const walkDays=weekDates.filter(d=>weekData[d]?.moveAfter).length;
            if(glucVals.length>=3){const tr=glucVals[glucVals.length-1]-glucVals[0];if(Math.min(...glucVals)<=99)learnings.push({text:"Fasting glucose hit normal range (<100)",sev:"excellent"});else if(tr<=-15)learnings.push({text:`Fasting dropped ${Math.abs(Math.round(tr))} pts this week`,sev:"excellent"});else if(glucAvg<=130)learnings.push({text:`Fasting averaging ${glucAvg}, approaching normal`,sev:"excellent"})}
            if(Math.min(berbDays,fishDays)>=5&&glucVals.length>=3)learnings.push({text:`Berberine + fish oil taken ${Math.min(berbDays,fishDays)}/7 days, glucose trending down`,sev:"excellent"});
            if(walkDays>=4)learnings.push({text:`Post-meal walks ${walkDays}/7 days`,sev:"excellent"});
            if(sleepTotal>=3&&sleepGood>=5)learnings.push({text:`${sleepGood}/${sleepTotal} nights 7+ hours`,sev:"excellent"});
            if(sleepTotal>=3&&sleepGood<=2)learnings.push({text:`Only ${sleepGood}/${sleepTotal} nights 7+ sleep`,sev:"grow"});
            if(sleepGood<sleepTotal)focus.push({icon:"😴",text:"Prioritize 7+ hours sleep every night"});
            if(postAvg&&postAvg>140)focus.push({icon:"🍚",text:"Experiment with complex carbs instead of rice"});
            const exDays=weekDates.filter(d=>weekData[d]?.act&&weekData[d].act!=="none").length;
            if(exDays<4)focus.push({icon:"🏃",text:"Cardio at least 2-3x this week"});
            if(!weekDates.some(d=>weekData[d]?.act==="weights"))focus.push({icon:"💪",text:"Start weight training"});
            if(focus.length===0)focus.push({icon:"🔥",text:"Maintain consistency"});
            const sevColor={excellent:t.ok,ontrack:t.warn,grow:t.danger};
            const sevIcon={excellent:"\u2713",ontrack:"\u2192",grow:"\u26A0"};
            learnings.sort((a,b)=>({excellent:0,ontrack:1,grow:2}[a.sev]??1)-({excellent:0,ontrack:1,grow:2}[b.sev]??1));

            // Key highlights: Week Score (left) | Fasting | Post-meal | Sleep (no Supps)
            const highlights=[
              ws.days>0?{label:"Week Score",val:ws.total,range:`${ws.days} days tracked`,color:ws.total>=70?t.ok:ws.total>=40?t.warn:t.danger}:null,
              glucAvg?{label:"Fasting",val:glucAvg,range:`${glucMin}-${glucMax}`,color:glucAvg<=99?t.ok:glucAvg<=140?t.warn:t.danger,pred:expectedGluc?`vs ~${expectedGluc} pred`:null,predAhead:aheadPred}:null,
              postAvg?{label:"Post-meal",val:postAvg,range:`spike ${postMin}-${postMax}`,color:postAvg<=140?t.ok:postAvg<=180?t.warn:t.danger}:null,
              sleepAvg?{label:"Sleep avg",val:`${sleepAvg}h`,range:`${sleepGood}/${sleepTotal} nights 7+`,color:sleepAvg>=7?t.ok:sleepAvg>=6.5?t.warn:t.danger}:null,
            ].filter(Boolean);

            return(<div>
              {/* Narrative */}
              {parts.length>0&&<div style={{fontSize:13,color:t.text,lineHeight:1.7,marginBottom:16}}>{parts.join(" ")}</div>}

              {/* Key highlights row (score first, then metrics) */}
              {highlights.length>0&&<div style={{display:"flex",alignItems:"stretch",marginBottom:16}}>
                {highlights.map((m,i,arr)=>(<React.Fragment key={i}>
                  <div style={{textAlign:"center",padding:"0 10px",flex:1}}>
                    <div style={{fontSize:11,color:t.muted,textTransform:"uppercase",letterSpacing:"0.5px"}}>{m.label}</div>
                    <div style={{fontSize:22,fontWeight:800,color:m.color}}>{m.val}</div>
                    {m.range&&<div style={{fontSize:11,color:t.muted}}>{m.range}</div>}
                    {m.pred&&<div style={{fontSize:10,color:m.predAhead?t.ok:t.warn,fontWeight:600}}>{m.pred}</div>}
                  </div>
                  {i<arr.length-1&&<div style={{width:1,background:t.tile,flexShrink:0}}/>}
                </React.Fragment>))}
              </div>}

              {/* Key Learnings + Next Week Focus (below highlights) */}
              {(learnings.length>0||focus.length>0)&&<div style={{display:"flex",gap:10,marginBottom:16}}>
                {learnings.length>0&&<Card style={{flex:1,background:t.okBg,padding:"12px 16px",marginBottom:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:t.ok,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Key Learnings</div>
                  {learnings.slice(0,6).map((l,i)=>(<div key={i} style={{fontSize:13,color:sevColor[l.sev],fontWeight:600,lineHeight:1.7}}>{sevIcon[l.sev]} {l.text}</div>))}
                </Card>}
                {focus.length>0&&<Card style={{flex:1,background:"#dde8f5",padding:"12px 16px",marginBottom:0}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#185fa5",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>Next Week Focus</div>
                  {focus.slice(0,4).map((f,i)=>(<div key={i} style={{fontSize:13,color:t.text,fontWeight:600,lineHeight:1.7}}>{f.icon} {f.text}</div>))}
                </Card>}
              </div>}
            </div>);
          })()}

          {/* Daily Notes */}
          <div style={{fontSize:16,fontWeight:700,marginBottom:10}}>Daily Notes</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
            {Object.keys(clinicalNotes).reverse().map(k=>(<Pill key={k} active={noteTab===k} onClick={()=>setNT(k)}>{k.replace(/\s*\(Day\s*\d+\)/,"")}</Pill>))}
          </div>
          {(clinicalNotes[noteTab]||[]).map((n,i)=>{
            const col={excellent:t.ok,ontrack:t.warn,grow:t.danger}[n.sev]||t.muted;
            return(<div key={i} style={{display:"flex",gap:10,marginBottom:10,padding:"0 4px"}}>
              <span style={{fontSize:18,flexShrink:0}}>{n.icon}</span>
              <div><div style={{fontSize:14,fontWeight:700,color:col,marginBottom:2}}>{n.title}</div><div style={{fontSize:13,color:t.muted,lineHeight:1.6}}>{n.text}</div></div>
            </div>);
          })}

          {/* Trend charts */}
          <div style={{fontSize:16,fontWeight:700,marginTop:24,marginBottom:10}}>Trends</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
            {[["glucose","Glucose"],["liver","Liver Gap"],["score","Score"],["weight","Weight"],["if","IF"]].map(([k,l])=>(<Pill key={k} active={trendChart===k} onClick={()=>setTC(k)}>{l}</Pill>))}
          </div>
          <TrendChart type={trendChart}/>

          {/* Lab prediction chart */}
          <div style={{fontSize:16,fontWeight:700,marginTop:24,marginBottom:10}}>Lab Trend</div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
            {[["hb","HbA1C"],["trig","Trig"],["gluc","Glucose"],["ggt","GGT"],["chol","Chol"],["wt","Weight"],["bmi","BMI"]].map(([k,l])=>(<Pill key={k} active={labChart===k} onClick={()=>setLC(k)}>{l}</Pill>))}
          </div>
          <Card><MiniChart ck={labChart}/></Card>

          {/* Journey progress bars */}
          <div style={{fontSize:16,fontWeight:700,marginTop:24,marginBottom:10}}>Journey</div>
          <Card>
            {journeyData.map((g,gi)=>{
              const range=Math.abs(g.baseline-g.goal);
              const pA=g.current!=null&&range>0?Math.min(1,Math.abs(g.baseline-g.current)/range):0;
              const pctA=Math.round(pA*100);
              const p30=range>0?Math.round(Math.min(1,Math.abs(g.baseline-g.d30)/range)*100):0;
              const p60=range>0?Math.round(Math.min(1,Math.abs(g.baseline-g.d60)/range)*100):0;
              const p90=range>0?Math.round(Math.min(1,Math.abs(g.baseline-g.d90)/range)*100):0;
              const dotCol=g.current==null?"#B4B2A9":pctA>=80?t.ok:pctA>=40?t.warn:"#D85A30";
              const fmt=(v,d)=>v==null?"?":d>0?Number(v).toFixed(d):String(v);
              const show=g.current!=null;
              return(<div key={gi} style={{paddingBottom:gi<journeyData.length-1?14:0,marginBottom:gi<journeyData.length-1?14:0,borderBottom:gi<journeyData.length-1?`1px solid ${t.tile}`:"none"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:14,fontWeight:700}}>{g.label}</span>
                  <div style={{textAlign:"right"}}>
                    <span style={{fontSize:20,fontWeight:200,color:show?dotCol:"#B4B2A9",letterSpacing:"-0.03em"}}>{fmt(g.current,g.dec)}<span style={{fontSize:12,fontWeight:400,color:t.muted}}> {g.unit}</span></span>
                    {show&&<div style={{fontSize:11,color:dotCol,fontWeight:500}}>({pctA}%)</div>}
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <div style={{width:40,textAlign:"center"}}><div style={{fontSize:9,color:t.muted}}>Start</div><div style={{fontSize:11,fontWeight:600,color:t.muted}}>{fmt(g.baseline,g.dec)}</div></div>
                  <div style={{flex:1,position:"relative",height:10,borderRadius:5,background:t.tile,marginTop:22,marginBottom:22}}>
                    <div style={{position:"absolute",height:"100%",borderRadius:5,left:0,width:"40%",background:"#F09595",opacity:0.25}}/>
                    <div style={{position:"absolute",height:"100%",borderRadius:5,left:"40%",width:"30%",background:"#EF9F27",opacity:0.25}}/>
                    <div style={{position:"absolute",height:"100%",borderRadius:5,left:"70%",width:"30%",background:"#5DCAA5",opacity:0.25}}/>
                    {[{p:p30,l:"D30",v:g.d30},{p:p60,l:"D60",v:g.d60},{p:p90,l:"D90",v:g.d90}].map(({p,l,v},i)=>(<React.Fragment key={i}><div style={{position:"absolute",top:"50%",left:`${p}%`,width:7,height:7,borderRadius:2,background:"#999",transform:"translate(-50%,-50%)",zIndex:2,opacity:0.4+i*0.15}}/><div style={{position:"absolute",top:16,left:`${p}%`,transform:"translateX(-50%)",fontSize:9,color:"#999",textAlign:"center",lineHeight:1.1,opacity:0.6+i*0.15}}><div style={{fontWeight:500}}>{l}</div><div>{fmt(v,g.dec)}</div></div></React.Fragment>))}
                    {show&&<><div style={{position:"absolute",top:"50%",left:`${pctA}%`,width:14,height:14,borderRadius:"50%",background:dotCol,border:`2px solid ${t.card}`,transform:"translate(-50%,-50%)",zIndex:3}}/><div style={{position:"absolute",top:-24,left:`${pctA}%`,transform:"translateX(-50%)",fontSize:10,fontWeight:600,color:dotCol,textAlign:"center",lineHeight:1.1,zIndex:4}}><div>Now</div><div>{fmt(g.current,g.dec)}</div></div></>}
                  </div>
                  <div style={{width:38,textAlign:"center"}}><div style={{fontSize:9,color:t.muted}}>Goal</div><div style={{fontSize:11,fontWeight:700,color:t.ok}}>{fmt(g.goal,g.dec)}</div></div>
                </div>
                {g.note&&<div style={{fontSize:11,color:t.muted,fontStyle:"italic",marginTop:-6}}>{g.note}</div>}
              </div>);
            })}
          </Card>
        </div>)}

        {/* ══ LABS TAB ══ */}
        {tab===2&&(<div>
          <div style={{fontSize:18,fontWeight:700,marginBottom:4}}>Lab Results & Prediction</div>
          <div style={{color:t.muted,fontSize:13,marginBottom:16}}>Confirmed data vs predicted trajectory</div>

          {/* Lab table */}
          <Card style={{padding:0,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                <thead><tr style={{background:t.tile}}>
                  <th style={{position:"sticky",left:0,zIndex:3,background:t.tile,padding:"10px 12px",textAlign:"left",fontSize:13,color:t.muted,fontWeight:600,minWidth:120}}>Marker</th>
                  <th style={{padding:"10px 8px",textAlign:"center",fontSize:12,color:t.light,minWidth:60}}>Normal</th>
                  <th style={{padding:"10px 10px",textAlign:"center",fontSize:13,fontWeight:700,color:t.text,minWidth:70}}>26 Feb</th>
                  {["Day 30","Day 60","Day 90"].map(d=>(<th key={d} style={{padding:"10px 12px",textAlign:"center",fontSize:13,fontWeight:700,color:t.accent,minWidth:80}}>{d}</th>))}
                </tr></thead>
                <tbody>{labMarkers.map((r,ri)=>{const sc=stC[r.status];const bg=ri%2===0?t.card:"#F5F2ED";return(
                  <tr key={r.marker} style={{background:bg}}>
                    <td style={{position:"sticky",left:0,zIndex:2,background:bg,padding:"8px 12px",fontSize:14,fontWeight:600}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:8,height:8,borderRadius:"50%",background:sc.tx,flexShrink:0}}/>{r.marker}</div></td>
                    <td style={{padding:"8px",textAlign:"center",fontSize:12,color:t.light}}>{r.normal}</td>
                    <td style={{padding:"8px 10px",textAlign:"center",fontSize:16,fontWeight:800,color:sc.tx}}>{r.confirmed}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:14,fontWeight:600,color:t.accent,opacity:.7}}>{r.s30}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:14,fontWeight:600,color:t.accent,opacity:.85}}>{r.s60}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:15,fontWeight:700,color:t.accent}}>{r.s90}</td>
                  </tr>)})}</tbody>
              </table>
            </div>
          </Card>

          {/* Lab insights accordion */}
          <div style={{fontSize:16,fontWeight:700,marginTop:24,marginBottom:10}}>Lab Insights</div>
          <div style={{display:"flex",gap:4,marginBottom:12}}>
            {[{k:0,l:"26 Feb"},{k:1,l:"Day 30"},{k:2,l:"Day 60"},{k:3,l:"Day 90"}].map(({k,l})=>(<Pill key={k} active={labMeanTab===k} onClick={()=>setLMT(k)}>{l}</Pill>))}
          </div>
          <Card style={{padding:0,overflow:"hidden"}}>
            {labMarkers.map((r,ri)=>{
              const meaning=labMeanings[r.marker];if(!meaning)return null;
              const sc=stC[r.status];const open=expandedLab===ri;
              const pKeys=["confirmed","s30","s60","s90"];
              const val=labMeanTab===0?r.confirmed:(r[pKeys[labMeanTab]]||"-");
              return(<div key={r.marker} style={{background:open?"#F5F2ED":t.card}}>
                <div onClick={()=>setEL(open?null:ri)} style={{display:"flex",alignItems:"center",gap:8,padding:"12px 16px",cursor:"pointer"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:sc.tx,flexShrink:0}}/>
                  <span style={{fontSize:14,fontWeight:600,flex:1}}>{r.marker}</span>
                  <span style={{fontSize:11,padding:"3px 8px",borderRadius:50,background:sc.bg,color:sc.tx,fontWeight:600}}>{r.status}</span>
                  <span style={{fontSize:18,fontWeight:700,color:labMeanTab===0?sc.tx:t.accent,minWidth:60,textAlign:"right"}}>{val}</span>
                  <span style={{fontSize:12,color:t.light,marginLeft:6}}>{open?"▲":"▼"}</span>
                </div>
                {open&&<div style={{padding:"0 16px 14px 32px",fontSize:13,lineHeight:1.7}}>
                  <div>{meaning.what}</div>
                  <div>{meaning.why}</div>
                  <div style={{color:t.danger}}>{meaning.risk}</div>
                  <div style={{color:t.ok}}>Fix: {meaning.fix}</div>
                </div>}
                {ri<labMarkers.length-1&&<div style={{height:1,background:t.tile,marginLeft:16,marginRight:16}}/>}
              </div>);
            })}
          </Card>

        </div>)}


        {/* ══ GUIDE TAB ══ */}
        {tab===3&&(()=>{
          const activities=[
            {name:"Weight training",emoji:"🏋️",pts:"-30-60 pts",note:"Muscles become glucose sponges for 24-48hr"},
            {name:"HIIT / circuits",emoji:"⚡",pts:"-40-60 pts",note:"15 min = hours of benefit"},
            {name:"Long walk 30+ min",emoji:"🚶",pts:"-30-50 pts",note:"The #1 tool"},
            {name:"Swimming",emoji:"🏊",pts:"-25-40 pts",note:"Low joint stress, full body"},
            {name:"Dancing",emoji:"💃",pts:"-20-35 pts",note:"Fun, burns without feeling like exercise"},
            {name:"Walk 10-15 min",emoji:"👟",pts:"-20-40 pts",note:"Best ROI. After every meal"},
            {name:"Housework",emoji:"🧹",pts:"-15-25 pts",note:"All count"},
            {name:"Stretching / yoga",emoji:"🧘",pts:"-5-10 pts",note:"Flexibility + stress reduction"},
          ];
          const recovery=[
            {name:"Infrared sauna",emoji:"🧖",pts:"-10-20 pts",note:"Improves insulin sensitivity"},
            {name:"Deep tissue massage",emoji:"💆",pts:"-5-10 pts",note:"Lowers cortisol 30%"},
            {name:"Cold shower (30s)",emoji:"🧊",pts:"-10-15 pts",note:"Activates brown fat"},
            {name:"Breathing exercises",emoji:"🌬️",pts:"-5-10 pts",note:"4-7-8 breathing lowers cortisol"},
          ];
          const fullScience={
            spikes:[{h:"What is a spike?",p:"Carbs flood bloodstream. Healthy pancreas releases insulin in minutes. When impaired, glucose stays elevated."},{h:"Delta ranges",p:"Under +30: Excellent.\n+30-50: Moderate.\n+50-80: Poor.\n+80+: Alarm."},{h:"Angkhana's data",p:"White rice: +97 (alarm). Low GI rice: +46 (moderate). Potatoes: +20 (ok). Chicken+veggies: negative delta."}],
            pancreas:[{h:"Beta cell fatigue",p:"Not dead - exhausted. Remove fat + reduce demand = they recover."},{h:"Recovery",p:"1. Remove demand (no sugar).\n2. Improve sensitivity (berberine, exercise, sleep).\n3. Reduce visceral fat (IF, walking).\n4. Beta cells regenerate 4-12 weeks."}],
            exercise:[{h:"Insulin bypass",p:"GLUT4 transporters open WITHOUT insulin. Angkhana's swim: 131 to 101."},{h:"48-hour effect",p:"After intense exercise, insulin sensitivity improves for 48 hours. Cumulative."}],
            supps:[{h:"Berberine",p:"Works like metformin. Activates AMPK. Take WITH food."},{h:"Fish Oil",p:"Omega-3s reduce liver triglyceride production. 3-4g/day."},{h:"Magnesium",p:"300+ enzyme reactions. Glycinate form best. Bedtime."},{h:"D3+K2",p:"Insulin receptor support. Take with fat."}],
            sleep:[{h:"Cortisol connection",p:"Poor sleep triggers cortisol. One night <6h = glucose +15-30."},{h:"Glucose-sleep cycle",p:"High evening glucose disrupts sleep. Break with: early dinner, magnesium."}],
            food:[{h:"Fiber first, carbs last",p:"Same food, different order = 40% less spike."},{h:"IF mechanism",p:"Fasting window: insulin drops, fat-burning starts. 16:8 = 16h liver processing."}],
          };
          return(<div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>
            {[["lifestyle","Lifestyle"],["food","Food & Supps"],["science","Body Science"]].map(([k,l])=>(<Pill key={k} active={guideSection===k} onClick={()=>setGS(k)}>{l}</Pill>))}
          </div>

          {guideSection==="lifestyle"&&<>
            <div style={{fontSize:16,fontWeight:700,marginBottom:12}}>Daily Habits</div>
            <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:28}}>
              {dailyHabits.map((h,i)=>(<Card key={i} style={{display:"flex",gap:12,alignItems:"flex-start",padding:"12px 16px",marginBottom:0}}>
                <span style={{fontSize:20,flexShrink:0}}>{h.icon}</span>
                <div><div style={{fontSize:14,fontWeight:600,lineHeight:1.3}}>{h.step}</div><div style={{fontSize:12,color:t.muted,marginTop:3}}>{h.impact}</div></div>
              </Card>))}
            </div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Activity Ideas</div>
            <div style={{display:"flex",gap:4,marginBottom:12}}>
              <Pill active={actTab==="activities"} onClick={()=>setActTab("activities")}>Activities</Pill>
              <Pill active={actTab==="recovery"} onClick={()=>setActTab("recovery")}>Recovery</Pill>
            </div>
            <Card style={{padding:"14px 16px"}}>
              {(actTab==="activities"?activities:recovery).map((a,i,arr)=>(
                <div key={i} style={{padding:"6px 0",borderBottom:i<arr.length-1?`1px solid ${t.tile}`:"none",display:"flex",gap:10,alignItems:"flex-start"}}>
                  <span style={{fontSize:18,flexShrink:0}}>{a.emoji}</span>
                  <div style={{flex:1}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontSize:13,fontWeight:600}}>{a.name}</span><span style={{fontSize:11,color:t.ok,fontWeight:700}}>{a.pts}</span></div><div style={{fontSize:12,color:t.muted}}>{a.note}</div></div>
                </div>))}
            </Card>
          </>}

          {guideSection==="food"&&<>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>What Your Body Needs</div>
            <Card style={{padding:0,overflow:"hidden",marginBottom:20}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr style={{background:t.tile}}>{["Nutrient","Daily","Per Meal","Portion Guide","Why"].map(h=>(<th key={h} style={{padding:"10px 12px",textAlign:h==="Daily"||h==="Per Meal"?"center":"left",fontSize:13,color:t.muted,fontWeight:600}}>{h}</th>))}</tr></thead>
                <tbody>{[["🌾 Fiber","25-35g","8-12g","1 cup broccoli + basil seeds","Eat FIRST",t.ok],["🥑 Fat","70-90g","23-30g","Olive oil + almonds","35-40% calories",t.ok],["🥩 Protein","80-100g","27-33g","4 eggs or 120g chicken","35-40% calories",t.ok],["🍚 Carbs","40-60g","13-20g","Veggies or quarter sweet potato","Eat LAST",t.warn],["💧 Water","2-2.5L","8-10 glasses","","Prevents false hunger",t.ok]].map(([n,d,m,p,w,col],i)=>(<tr key={i} style={{background:i%2===0?t.card:"#F5F2ED"}}><td style={{padding:"8px 12px",fontSize:14,fontWeight:700}}>{n}</td><td style={{padding:"8px 12px",textAlign:"center",fontSize:13,fontWeight:700,color:col}}>{d}</td><td style={{padding:"8px 12px",textAlign:"center",fontSize:13,color:t.muted}}>{m}</td><td style={{padding:"8px 12px",fontSize:12,color:t.text}}>{p}</td><td style={{padding:"8px 12px",fontSize:12,color:t.muted}}>{w}</td></tr>))}</tbody>
              </table>
            </Card>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Supplements</div>
            <Card style={{padding:0,overflow:"hidden",marginBottom:20}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr style={{background:t.tile}}><th style={{padding:"10px 14px",textAlign:"left",fontSize:13,color:t.muted,fontWeight:600}}>Supplement</th><th style={{padding:"10px 14px",textAlign:"left",fontSize:13,color:t.muted,fontWeight:600}}>Dose</th><th style={{padding:"10px 14px",textAlign:"center",fontSize:13,color:t.muted,fontWeight:600}}>Trig</th><th style={{padding:"10px 14px",textAlign:"center",fontSize:13,color:t.muted,fontWeight:600}}>A1C</th></tr></thead>
              <tbody>{supps.map((s,i)=>(<tr key={s.name} style={{background:i%2===0?t.card:"#F5F2ED"}}><td style={{padding:"10px 14px",fontSize:14,fontWeight:700}}>{s.icon} {s.name}</td><td style={{padding:"10px 14px",fontSize:13,color:t.muted}}>{s.dose}</td><td style={{padding:"10px 14px",textAlign:"center",fontSize:13,fontWeight:600,color:t.danger}}>{s.trig}</td><td style={{padding:"10px 14px",textAlign:"center",fontSize:13,fontWeight:600,color:t.ok}}>{s.hb}</td></tr>))}</tbody></table>
            </Card>
            <div style={{fontSize:16,fontWeight:700,marginBottom:4}}>Carb Guide (GI)</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
              <Card style={{background:t.okBg,padding:"12px 14px",marginBottom:0}}><div style={{fontSize:13,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>SAFE</div>{[["Konjac rice","0"],["Shirataki","0"],["Glass noodle","39"],["Sweet potato","44"],["Basmati","50"],["Low GI rice","54"]].map(([n,g],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,fontWeight:600}}>{n}</span><span style={{fontSize:11,color:t.ok,fontWeight:700}}>GI {g}</span></div>))}</Card>
              <Card style={{background:t.warnBg,padding:"12px 14px",marginBottom:0}}><div style={{fontSize:13,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>LIMIT</div>{[["Corn","52"],["Taro","53"],["Potato","58"],["Oat milk","60"],["Brown rice","68"]].map(([n,g],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,fontWeight:600}}>{n}</span><span style={{fontSize:11,color:t.warn,fontWeight:700}}>GI {g}</span></div>))}</Card>
              <Card style={{background:t.dangerBg,padding:"12px 14px",marginBottom:0}}><div style={{fontSize:13,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>AVOID</div>{[["Instant noodle","73"],["White bread","75"],["Rice porridge","83"],["Sticky rice","87"],["Jasmine rice","89"]].map(([n,g],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0"}}><span style={{fontSize:12,fontWeight:600}}>{n}</span><span style={{fontSize:11,color:t.danger,fontWeight:700}}>GI {g}</span></div>))}</Card>
            </div>
            <div style={{fontSize:16,fontWeight:700,marginBottom:10}}>Food Guide</div>
            {[["🥩 Protein",["Eggs 2-3/meal","Salmon, sardines","Chicken breast/thigh","Firm tofu","Greek yogurt","Shrimp"],["Pork belly (small)","Duck"],["Hotdog","Processed ham","KFC","Fish balls"]],["🥬 Vegetables",["Morning glory","Bitter gourd","Broccoli","Spinach, kale","Mushrooms","Cucumber, tomato"],["Carrots (cooked)","Peas"],["Corn","Potatoes / taro"]],["🥑 Fats",["Olive oil","Avocado","Almonds (30g)","Dark choc 85%+"],["Butter (small)","Cheese (small)"],["Canola oil","Margarine"]],["☕ Drinks",["Water","Green tea","Black coffee","Almond milk"],["Soy milk","Sparkling water"],["Milk tea","Soda","Fruit juice","Alcohol"]],["🍫 Treats",["Dark choc 85%+","Stevia","Monk fruit"],["Dark choc 70%","Yogurt + berries"],["Candy","Ice cream","Honey","Sugar"]]].map(([cat,safe,limit,avoid],ci)=>(<div key={ci} style={{marginBottom:16}}><div style={{fontSize:15,fontWeight:700,color:t.accent,marginBottom:8}}>{cat}</div><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}><Card style={{background:t.okBg,padding:"12px 14px",marginBottom:0}}><div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:6,textAlign:"center"}}>SAFE</div>{safe.map((x,i)=>(<div key={i} style={{fontSize:12,padding:"2px 0"}}>{x}</div>))}</Card><Card style={{background:t.warnBg,padding:"12px 14px",marginBottom:0}}><div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:6,textAlign:"center"}}>LIMIT</div>{limit.map((x,i)=>(<div key={i} style={{fontSize:12,padding:"2px 0"}}>{x}</div>))}</Card><Card style={{background:t.dangerBg,padding:"12px 14px",marginBottom:0}}><div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:6,textAlign:"center"}}>AVOID</div>{avoid.map((x,i)=>(<div key={i} style={{fontSize:12,padding:"2px 0"}}>{x}</div>))}</Card></div></div>))}
          </>}

          {guideSection==="science"&&<>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
              {[["spikes","Spikes"],["pancreas","Pancreas"],["exercise","Exercise"],["supps","Supplements"],["sleep","Sleep"],["food","Food"]].map(([k,l])=>(<Pill key={k} active={sciTopic===k} onClick={()=>setSciTopic(sciTopic===k?null:k)}>{l}</Pill>))}
            </div>
            {sciTopic&&fullScience[sciTopic]?fullScience[sciTopic].map((c,i)=>(<Card key={i}><div style={{fontSize:15,fontWeight:700,color:t.accent,marginBottom:6}}>{c.h}</div>{c.p.split("\n").map((line,li)=>(<div key={li} style={{fontSize:13,color:t.text,lineHeight:1.7,marginBottom:li>0?4:0}}>{line}</div>))}</Card>)):<div style={{fontSize:13,color:t.muted,fontStyle:"italic"}}>Select a topic above</div>}
          </>}
        </div>);})()}
      </div>

    </div>
  );
}
