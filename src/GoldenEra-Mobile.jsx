import React, { useState, useEffect, useCallback } from "react";
import { clinicalNotes as STATIC_NOTES, labMarkers as SHARED_LAB_MARKERS, labMeanings as SHARED_LAB_MEANINGS, TARGETS, SHEET_API, buildInsightPrompt } from "./shared/data";

/* ═══════════════════════════════════════════════════════════════
   Golden Era Mobile v3
   Imports shared data from ./shared/data.js
   ═══════════════════════════════════════════════════════════════ */

const API = SHEET_API;
const DAY1 = new Date("2026-03-02");
const t = {
  bg:"#E8E4DE",card:"#FDFCF9",tile:"#E8E3DB",on:"#C8DFC9",
  accent:"#4A7A50",dark:"#3D6842",text:"#1A1612",muted:"#8A7E72",light:"#B0A698",
  warn:"#B8860B",danger:"#C44",ok:"#4A7A50",
  okBg:"#E8F0E8",warnBg:"#FDF6E8",dangerBg:"#FDF0EE",
  sh:"0 2px 8px rgba(0,0,0,0.10)",shOn:"0 3px 10px rgba(74,122,80,0.20)",
  csh:"0 3px 16px rgba(0,0,0,0.08)",dotFill:"#FDFCF9",
};
// TARGETS imported from shared/data.js

const GRID=[
  {id:"berb",icon:"\uD83C\uDF3F",l:"Berb",field:"berb",cycle:["0","x1","x2"]},
  {id:"fish",icon:"\uD83D\uDC1F",l:"Fish",field:"fish",cycle:["0","x1","x2","x3"]},
  {id:"mag",icon:"\uD83D\uDC8A",l:"Mag",field:"mag",cycle:["0","x1","x2","x3"]},
  {id:"d3k2",icon:"\u2600\uFE0F",l:"D3K2",field:"d3k2",cycle:["0","x1","x2"]},
  {id:"sleep",icon:"\uD83D\uDE34",l:"Sleep",field:"sleep",cycle:["","<6","<7","7+","8+"]},
  {id:"move",icon:"\uD83D\uDEB6",l:"Walk",field:"moveAfter",cycle:["","x1","x2","x3"]},
  {id:"fiber",icon:"\uD83E\uDD57",l:"Fiber",field:"fiberFirst",cycle:[false,true]},
  {id:"sugar",icon:"\uD83D\uDEAB",l:"Sugar",field:"noSweet",cycle:[false,true]},
  {id:"water",icon:"\uD83D\uDCA7",l:"Water",field:"water",cycle:[false,true]},
  {id:"probio",icon:"\uD83E\uDDEB",l:"Probio",field:"probio",cycle:[false,true]},
  {id:"basil",icon:"\uD83C\uDF31",l:"Basil",field:"basil",cycle:[false,true]},
  {id:"brazil",icon:"\uD83E\uDD5C",l:"Brazil",field:"brazil",cycle:[false,true]},
];
const EXERCISES=["rest","walk","stretch","cardio","weights"];

// ─── Clinical Notes (shared with desktop - update in one place) ───
// CLINICAL_NOTES imported from shared/data.js


const BODY_ROWS=[
  {label:"\u2696\uFE0F Weight",field:"body_weight",ph:"kg"},
  {label:"\uD83D\uDCCF Neck",field:"body_neck",ph:"cm"},
  {label:"\uD83D\uDCCF Waist",field:"body_waist",ph:"cm"},
  {label:"\uD83D\uDCCF Hip",field:"body_hip",ph:"cm"},
  {label:"\uD83D\uDCCF Chest",field:"body_chest",ph:"cm"},
  {label:"\uD83D\uDCCF Belly",field:"body_belly",ph:"cm"},
  {label:"\uD83D\uDCAA Arm",field:"body_arm",ph:"cm"},
  {label:"\uD83E\uDDB5 Thigh",field:"body_thigh",ph:"cm"},
];
const LAB_ROWS=[
  {label:"\uD83E\uDE78 HbA1C",field:"lab_hba1c",ph:"%"},
  {label:"\uD83E\uDE78 Glucose",field:"lab_glucose",ph:"mg/dL"},
  {label:"\uD83E\uDE78 Trig",field:"lab_trig",ph:"mg/dL"},
  {label:"\uD83E\uDE78 GGT",field:"lab_ggt",ph:"U/L"},
  {label:"\uD83E\uDE78 ALT",field:"lab_alt",ph:"U/L"},
  {label:"\uD83E\uDE78 AST",field:"lab_ast",ph:"U/L"},
  {label:"\u2764\uFE0F Chol",field:"lab_chol",ph:"mg/dL"},
  {label:"\uD83D\uDD36 Uric",field:"lab_uric",ph:"mg/dL"},
  {label:"\uD83D\uDC9A HDL",field:"lab_hdl",ph:"mg/dL"},
  {label:"\u2764\uFE0F LDL",field:"lab_ldl",ph:"mg/dL"},
  {label:"\uD83D\uDCA7 Creat",field:"lab_creat",ph:"mg/dL"},
  {label:"\uD83D\uDCA7 eGFR",field:"lab_egfr",ph:"mL/min"},
];

// --- Helpers ---
const dayN=(d)=>Math.max(1,Math.floor(((d||new Date())-DAY1)/864e5)+1);
const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const dateISO=(d)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const fmtShort=(d)=>(d||new Date()).toLocaleDateString("en-US",{day:"numeric",month:"short"});
const pctCh=(s,c)=>(c!=null&&s?((c-s)/Math.abs(s)*100).toFixed(1):null);
const fmtPct=(v)=>{if(v==null)return null;return `${parseFloat(v)>0?"+":""}${v}%`};

function getWeekDates(ref){
  const d=ref?new Date(ref):new Date();const dy=d.getDay();
  const diff=d.getDate()-dy+(dy===0?-6:1);const mon=new Date(d);mon.setDate(diff);
  const dates=[];for(let i=0;i<7;i++){const dd=new Date(mon);dd.setDate(mon.getDate()+i);dates.push(dateISO(dd))}return dates;
}
function calcIF(m1t,mLast){
  if(!m1t||!mLast)return{display:"--:--",hours:0};
  const[h1,mn1]=m1t.split(":").map(Number);const[h2,mn2]=mLast.split(":").map(Number);
  if(isNaN(h1)||isNaN(h2))return{display:"--:--",hours:0};
  const eat=(h2*60+(mn2||0))-(h1*60+(mn1||0));if(eat<=0)return{display:"--:--",hours:0};
  const f=24-Math.round(eat/60);return{display:`${f}:${Math.round(eat/60)}`,hours:f};
}
function getDayScore(wd){
  if(!wd)return null;
  const has=wd.glucFast||wd.berb||wd.fish||wd.act||wd.moveAfter||wd.noSweet||wd.fiberFirst||wd.water||wd.sleep||wd.mag||wd.d3k2||wd.m1t||wd.mLast;
  if(!has)return null;let b=0,x=0;
  if(wd.noSweet)b+=18;if(wd.berb==="x2")b+=15;else if(wd.berb==="x1")b+=7;
  if(wd.sleep==="7+"||wd.sleep==="8+")b+=14;else if(wd.sleep==="<7")b+=7;
  if(wd.fish==="x3")b+=10;else if(wd.fish==="x2")b+=6;else if(wd.fish==="x1")b+=3;
  if(wd.act&&wd.act!=="none"&&wd.act!=="0"&&wd.act!==""){b+=5;if(wd.act==="weights")x+=10;else if(wd.act==="cardio"||wd.act==="swim")x+=5;}
  if(wd.moveAfter==="x3")b+=8;else if(wd.moveAfter==="x2")b+=6;else if(wd.moveAfter==="x1")b+=3;
  if(wd.m1t&&wd.mLast){const{hours}=calcIF(wd.m1t,wd.mLast);if(hours>=16){b+=8;x+=5}else if(hours>=15){b+=8;x+=2}else if(hours>=14)b+=8;else if(hours>=13)b+=4}
  if(wd.fiberFirst)b+=7;if(wd.water)b+=5;if(wd.mag&&wd.mag!=="0")b+=5;if(wd.d3k2&&wd.d3k2!=="0")b+=5;
  if(wd.probio)x+=2;if(wd.brazil)x+=2;if(wd.basil)x+=2;
  return{base:b,bonus:x,total:b+x};
}
function gridDisplay(f,v){if(["fiberFirst","noSweet","water","probio","basil","brazil"].includes(f))return v?"\u2713":"";if(f==="sleep")return v||"";if(!v||v==="0")return"";return v}
function gridIsOn(f,v){if(["fiberFirst","noSweet","water","probio","basil","brazil"].includes(f))return!!v;if(f==="sleep")return!!v&&v!=="";return v&&v!=="0"&&v!==""}

// Score bar color - gradient based on score
function scoreBarColor(tot){
  if(tot>=90)return t.accent;if(tot>=70)return"rgba(74,122,80,0.85)";if(tot>=50)return"rgba(74,122,80,0.6)";if(tot>=30)return"rgba(74,122,80,0.4)";if(tot>0)return"rgba(74,122,80,0.25)";return"transparent";
}

// --- API ---
async function apiLoad(){try{const r=await fetch(`${API}?action=load&t=${Date.now()}`);if(!r.ok)throw new Error(r.status);return await r.json()}catch(e){console.error("Load:",e);return null}}
let _st=null;
function apiSave(date,data,action="saveDay"){clearTimeout(_st);_st=setTimeout(async()=>{try{await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action,date,data})})}catch(e){console.error("Save:",e)}},2000)}

// --- HOME ---
function HomeTab({D,loading,setTab,notes}){
  const day=dayN();const today=todayISO();const dates=Object.keys(D).sort();
  const todayD=D[today]||{};const todayLogged=!!(todayD.glucFast||todayD.berb||todayD.fish||todayD.noSweet||todayD.moveAfter||todayD.act);
  const findLatest=(key)=>{for(let i=dates.length-1;i>=0;i--){const v=parseFloat(D[dates[i]]?.[key]);if(!isNaN(v))return v}return NaN};
  const gv=findLatest("glucFast"),tv=findLatest("lab_trig"),wv=findLatest("body_weight");
  let streak=0;for(let i=dates.length-1;i>=0;i--){const r=D[dates[i]];if(r&&(r.glucFast||r.berb||r.noSweet))streak++;else break}
  const sc=getDayScore(todayD);const total=sc?sc.total:0;
  const weekDates=getWeekDates();const dn=["M","T","W","T","F","S","S"];
  const wkScores=weekDates.map(d=>getDayScore(D[d]));
  // Glucose: build M-S axis, only plot days that have data
  const gAll=weekDates.map((d,i)=>{const v=D[d]?.glucFast?parseFloat(D[d].glucFast):NaN;return{d:dn[i],v,idx:i,hasData:!isNaN(v)}});
  const gEntries=gAll.filter(e=>e.hasData);

  return(
    <div style={{padding:"14px 16px 90px",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{display:"flex",alignItems:"baseline",gap:10}}>
          <span style={{fontSize:24,fontWeight:300,color:t.text,letterSpacing:"-0.03em"}}>{loading?"...": `Day ${day}`}</span>
          <span style={{fontSize:13,color:t.muted}}>{fmtShort()}</span>
        </div>
        {!todayLogged&&!loading?(
          <div onClick={()=>setTab("log")} style={{display:"flex",alignItems:"center",gap:5,background:t.accent,color:"#fff",padding:"6px 14px",borderRadius:50,fontSize:11,fontWeight:600,cursor:"pointer",boxShadow:t.shOn}}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Log
          </div>
        ):(<span style={{fontSize:13,color:t.accent,fontWeight:600}}>{streak>0&&`\uD83D\uDD25 ${streak}`}</span>)}
      </div>

      {/* Metric boxes - bold black */}
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[{label:"Glucose",value:!isNaN(gv)?gv:"--",unit:"mg/dL",change:!isNaN(gv)?fmtPct(pctCh(TARGETS.glucose.s,gv)):null,empty:isNaN(gv)},{label:"Trig",value:!isNaN(tv)?tv:"--",unit:"mg/dL",change:!isNaN(tv)?fmtPct(pctCh(TARGETS.trig.s,tv)):null,empty:isNaN(tv)},{label:"Weight",value:!isNaN(wv)?wv:"--",unit:"kg",change:!isNaN(wv)?fmtPct(pctCh(TARGETS.weight.s,wv)):null,empty:isNaN(wv)}].map((m,i)=>(
          <div key={i} style={{flex:1,background:t.card,borderRadius:16,padding:"14px 10px",boxShadow:t.csh,textAlign:"center",position:"relative"}}>
            {m.empty&&<div style={{position:"absolute",top:8,right:8,width:6,height:6,borderRadius:"50%",background:t.warn}}/>}
            <div style={{fontSize:11,color:t.muted,marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:28,fontWeight:700,color:m.empty?t.light:t.text,letterSpacing:"-0.04em",lineHeight:1}}>{m.value}</div>
            <div style={{fontSize:10,color:t.muted,marginTop:3}}>{m.unit}</div>
            {m.change&&<div style={{fontSize:11,color:t.accent,fontWeight:600,marginTop:4}}>{m.change}</div>}
          </div>
        ))}
      </div>

      {/* Score + week bars with gradient */}
      <div style={{background:t.card,borderRadius:16,padding:"16px 18px",marginBottom:14,boxShadow:t.csh}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
          <div style={{fontSize:36,fontWeight:200,color:sc?t.text:t.light,letterSpacing:"-0.04em",lineHeight:1}}>{sc?total:"--"}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <span style={{fontSize:12,color:t.muted}}>Today Score</span>
              <span style={{fontSize:12,color:t.accent,fontWeight:600}}>{total}/100+</span>
            </div>
            <div style={{height:5,borderRadius:3,background:t.tile,overflow:"hidden"}}>
              <div style={{width:`${Math.min(100,total)}%`,height:"100%",borderRadius:3,background:t.accent,transition:"width 0.4s"}}/>
            </div>
          </div>
        </div>
        {!todayLogged&&!loading&&<div style={{fontSize:11,color:t.warn,marginBottom:10}}>No data logged today</div>}
        <div style={{borderTop:`1px solid ${t.tile}`,paddingTop:12}}>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            {wkScores.map((s,i)=>{const tot=s?s.total:0;const h=tot>0?Math.max(8,Math.round(tot*0.3)):5;const isToday=weekDates[i]===today;
              return(<div key={i} style={{textAlign:"center",flex:1}}>
                <div style={{width:24,height:36,borderRadius:7,margin:"0 auto 3px",background:t.tile,display:"flex",alignItems:"flex-end",justifyContent:"center",overflow:"hidden",boxShadow:tot>0?t.sh:"none"}}>
                  <div style={{width:"100%",height:h,borderRadius:"4px 4px 0 0",background:scoreBarColor(tot)}}/>
                </div>
                <div style={{fontSize:10,color:isToday?t.accent:(tot>0?t.muted:"#ccc"),fontWeight:isToday?700:400}}>{dn[i]}</div>
              </div>)})}
          </div>
        </div>
      </div>

      {/* Glucose trend with full M-S axis */}
      <div style={{background:t.card,borderRadius:16,padding:"16px 18px",boxShadow:t.csh}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
          <span style={{fontSize:12,color:t.muted}}>Fasting Glucose Trend</span>
          <span style={{fontSize:11,color:t.accent,fontWeight:600}}>This week</span>
        </div>
        {gEntries.length>=2?(()=>{
          const vals=gEntries.map(e=>e.v);const mn=Math.min(...vals)-10,mx=Math.max(...vals)+10;
          const w=260,h=55;
          // Map to x positions based on weekday index (0-6 for M-S)
          const pts=gEntries.map(e=>({x:(e.idx/6)*w,y:h-((e.v-mn)/(mx-mn))*h,v:e.v}));
          const line=pts.map((p,i)=>`${i===0?"M":"L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
          const area=`${line} L${pts[pts.length-1].x},${h} L${pts[0].x},${h} Z`;
          return(<div>
            <svg width="100%" viewBox={`0 0 ${w} ${h+12}`} style={{display:"block",overflow:"visible"}}>
              <defs><linearGradient id="gfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={t.accent} stopOpacity="0.3"/><stop offset="100%" stopColor={t.accent} stopOpacity="0"/></linearGradient></defs>
              <path d={area} fill="url(#gfill)"/>
              <path d={line} fill="none" stroke={t.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              {pts.map((p,i)=>(<circle key={i} cx={p.x} cy={p.y} r={i===pts.length-1?5:3} fill={i===pts.length-1?t.accent:t.dotFill} stroke={t.accent} strokeWidth={i===pts.length-1?2.5:1.5}/>))}
              <text x={pts[pts.length-1].x} y={pts[pts.length-1].y-9} textAnchor="middle" fontSize="11" fontWeight="700" fill={t.accent} fontFamily="DM Sans,sans-serif">{vals[vals.length-1]}</text>
            </svg>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
              {dn.map((d,i)=>{const hasData=gEntries.some(e=>e.idx===i);return(<div key={i} style={{flex:1,textAlign:"center",fontSize:10,color:hasData?t.accent:t.light,fontWeight:hasData?600:400}}>{d}</div>)})}
            </div>
          </div>);
        })():(
          <div style={{padding:"24px 0",textAlign:"center",fontSize:13,color:t.muted}}>{loading?"Loading...":"Log glucose to see the trend"}</div>
        )}
      </div>

      {/* Latest insight teaser - P3 */}
      {(()=>{
        const keys=Object.keys(notes||{}).sort((a,b)=>{const dA=parseInt(a.match(/Day (\d+)/)?.[1]||"0");const dB=parseInt(b.match(/Day (\d+)/)?.[1]||"0");return dB-dA});
        if(keys.length===0)return null;
        const latestKey=keys[0];const latestNotes=(notes||{})[latestKey];const first=latestNotes?latestNotes[0]:null;if(!first)return null;
        const sevCol={excellent:t.ok,ontrack:t.warn,grow:t.danger}[first.sev]||t.muted;
        return(
          <div onClick={()=>setTab("journey")} style={{background:t.card,borderRadius:16,padding:"12px 16px",marginTop:12,boxShadow:t.csh,cursor:"pointer"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{flex:1}}>
                <div style={{fontSize:10,color:t.muted,marginBottom:3}}>{latestKey}</div>
                <div style={{fontSize:13,fontWeight:600,color:sevCol,lineHeight:1.3}}>{first.icon} {first.title}</div>
                <div style={{fontSize:11,color:t.muted,marginTop:3,lineHeight:1.4,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{first.text}</div>
              </div>
              <div style={{fontSize:16,color:t.light,marginLeft:10,flexShrink:0}}>{">"}</div>
            </div>
            <div style={{textAlign:"center",fontSize:10,color:t.accent,fontWeight:600,marginTop:8,paddingTop:6,borderTop:`1px solid ${t.tile}`}}>View full insights in Journey</div>
          </div>
        );
      })()}
    </div>
  );
}
function LogTab({D,setD}){
  const[selDate,setSelDate]=useState(todayISO());
  const[showBody,setShowBody]=useState(false);
  const[showLab,setShowLab]=useState(false);
  const today=todayISO();const isToday=selDate===today;
  const selDayNum=dayN(new Date(selDate+"T00:00:00"));
  const wd=D[selDate]||{};
  const up=(f,v)=>{setD(p=>{const u={...p,[selDate]:{...(p[selDate]||{}),[f]:v}};apiSave(selDate,u[selDate]);return u})};
  const upBody=(f,v)=>{
    setD(p=>{const u={...p,[selDate]:{...(p[selDate]||{}),[f]:v}};return u});
    // Collect all body_ fields for this date and save
    setTimeout(()=>{
      const bd={};BODY_ROWS.forEach(r=>{const val=D[selDate]?.[r.field]||(r.field===f?v:"");if(val)bd[r.field.replace("body_","")]=val});
      apiSave(selDate,bd,"saveBody");
    },100);
  };
  const upLab=(f,v)=>{
    setD(p=>{const u={...p,[selDate]:{...(p[selDate]||{}),[f]:v}};return u});
    setTimeout(()=>{
      const ld={};LAB_ROWS.forEach(r=>{const val=D[selDate]?.[r.field]||(r.field===f?v:"");if(val)ld[r.field]=val});
      apiSave(selDate,ld,"saveLab");
    },100);
  };
  const shiftDate=(dir)=>{const d=new Date(selDate+"T00:00:00");d.setDate(d.getDate()+dir);const iso=dateISO(d);if(d<DAY1||iso>today)return;setSelDate(iso)};
  const{display:ifDisp}=calcIF(wd.m1t,wd.mLast);const ifOn=ifDisp!=="--:--";
  const[saved,setSaved]=useState(false);const[saving,setSaving]=useState(false);
  const handleSave=async()=>{setSaving(true);const payload={...(D[selDate]||{})};if(!payload.act||payload.act==="")payload.act="none";try{await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"saveDay",date:selDate,data:payload})});setSaved(true);setTimeout(()=>setSaved(false),2500)}catch(e){console.error(e)}setSaving(false)};
  const sc=getDayScore(wd);
  const cellStyle={width:"100%",padding:"12px 6px",borderRadius:12,border:"none",fontSize:18,fontWeight:300,textAlign:"center",color:t.text,fontFamily:"'DM Sans',sans-serif",background:t.tile,outline:"none",boxSizing:"border-box",boxShadow:t.sh,height:48};
  const miniInput={width:"100%",padding:"8px 4px",borderRadius:10,border:"none",fontSize:14,fontWeight:400,textAlign:"center",color:t.text,fontFamily:"'DM Sans',sans-serif",background:t.tile,outline:"none",boxSizing:"border-box",boxShadow:t.sh};

  return(
    <div style={{padding:"14px 14px 90px",fontFamily:"'DM Sans',sans-serif"}}>
      {/* Date picker */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0 4px",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div onClick={()=>shiftDate(-1)} style={{width:30,height:30,borderRadius:50,background:t.tile,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",boxShadow:t.sh,fontSize:14,color:t.text}}>{"<"}</div>
          <div style={{textAlign:"center"}}><span style={{fontSize:18,fontWeight:300,color:t.text}}>{isToday?"Today":fmtShort(new Date(selDate+"T00:00:00"))}</span>{!isToday&&<div style={{fontSize:10,color:t.warn,fontWeight:600}}>Backlog</div>}</div>
          <div onClick={()=>shiftDate(1)} style={{width:30,height:30,borderRadius:50,background:t.tile,display:"flex",alignItems:"center",justifyContent:"center",cursor:selDate>=today?"default":"pointer",boxShadow:t.sh,fontSize:14,color:selDate>=today?t.light:t.text,opacity:selDate>=today?0.4:1}}>{">"}</div>
        </div>
        <div style={{textAlign:"right"}}><span style={{fontSize:12,color:t.accent,fontWeight:600}}>Day {selDayNum}</span>{!isToday&&<div onClick={()=>setSelDate(today)} style={{fontSize:10,color:t.accent,cursor:"pointer",textDecoration:"underline"}}>Back to today</div>}</div>
      </div>

      {/* Glucose + Meals + IF */}
      <div style={{background:t.card,borderRadius:20,padding:18,marginBottom:10,boxShadow:t.csh}}>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["\uD83E\uDE78","Fasting","glucFast"],["\uD83C\uDF7D\uFE0F","Post-meal","glucPost"],["\uD83C\uDF19","Night","glucNight"]].map(([icon,label,field],i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:t.muted,marginBottom:4}}>{icon} {label}</div><input inputMode="decimal" placeholder="-" value={wd[field]||""} onChange={e=>up(field,e.target.value)} style={cellStyle}/></div>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          {[["\uD83C\uDF73","First meal","m1t"],["\uD83C\uDF05","Last meal","mLast"]].map(([icon,label,field],i)=>(
            <div key={i} style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:t.muted,marginBottom:4}}>{icon} {label}</div><input type="time" value={wd[field]||""} onChange={e=>up(field,e.target.value)} style={{...cellStyle,fontSize:16}}/></div>
          ))}
          <div style={{flex:1,textAlign:"center"}}><div style={{fontSize:10,color:t.muted,marginBottom:4}}>{"\u23F1\uFE0F"} IF</div><div style={{...cellStyle,display:"flex",alignItems:"center",justifyContent:"center",color:ifOn?t.accent:t.muted,background:ifOn?t.on:t.tile,boxShadow:ifOn?t.shOn:t.sh,fontWeight:ifOn?500:300}}>{ifDisp}</div></div>
        </div>
      </div>

      {/* Grid */}
      <div style={{background:t.card,borderRadius:20,padding:18,marginBottom:10,boxShadow:t.csh}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4, 1fr)",gap:8}}>
          {GRID.map(item=>{const val=wd[item.field];const on=gridIsOn(item.field,val);const disp=gridDisplay(item.field,val);
            return(<div key={item.id} onClick={()=>{const c=item.cycle;const idx=c.indexOf(val);up(item.field,c[(idx+1)%c.length])}} style={{textAlign:"center",padding:"10px 4px 7px",borderRadius:14,cursor:"pointer",background:on?t.on:t.tile,boxShadow:on?t.shOn:t.sh,transition:"all 0.15s",WebkitTapHighlightColor:"transparent"}}>
              <div style={{fontSize:22,marginBottom:2}}>{item.icon}</div>
              <div style={{fontSize:10,color:on?t.accent:t.muted,fontWeight:600,lineHeight:1.1}}>{item.l}</div>
              {disp&&<div style={{fontSize:12,color:t.accent,fontWeight:700,marginTop:2,lineHeight:1}}>{disp}</div>}
            </div>)})}
        </div>
      </div>

      {/* Exercise */}
      <div style={{background:t.card,borderRadius:20,padding:"14px 18px",marginBottom:10,boxShadow:t.csh}}>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <span style={{fontSize:18}}>{"\uD83C\uDFCB\uFE0F"}</span>
          {EXERCISES.map(ex=>{const on=wd.act===ex;return(<div key={ex} onClick={()=>up("act",on?"":ex)} style={{padding:"7px 16px",borderRadius:20,fontSize:13,cursor:"pointer",background:on?t.accent:t.tile,color:on?"#fff":t.muted,fontWeight:on?600:400,boxShadow:on?t.shOn:t.sh,transition:"all 0.15s",WebkitTapHighlightColor:"transparent",textTransform:"capitalize"}}>{ex}</div>)})}
        </div>
      </div>

      {/* Notes */}
      <div style={{background:t.card,borderRadius:20,padding:"14px 18px",marginBottom:10,boxShadow:t.csh}}>
        <textarea placeholder={"\uD83D\uDCDD Notes..."} rows={2} value={wd.notes||""} onChange={e=>up("notes",e.target.value)} style={{width:"100%",padding:"10px 12px",borderRadius:12,border:"none",fontSize:13,lineHeight:1.5,color:t.text,fontFamily:"'DM Sans',sans-serif",background:t.tile,outline:"none",boxSizing:"border-box",boxShadow:t.sh,resize:"none"}}/>
      </div>

      {/* Body Measurements - collapsible */}
      <div onClick={()=>setShowBody(!showBody)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",cursor:"pointer",marginBottom:showBody?0:4}}>
        <span style={{fontSize:14,fontWeight:600,color:t.text}}>{"\u2696\uFE0F"} Body Measurements</span>
        <span style={{fontSize:11,color:t.muted,padding:"3px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showBody?"Hide":"Show"}</span>
      </div>
      {showBody&&<div style={{background:t.card,borderRadius:20,padding:16,marginBottom:10,boxShadow:t.csh}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {BODY_ROWS.map(r=>(<div key={r.field}><div style={{fontSize:10,color:t.muted,marginBottom:3}}>{r.label}</div><input inputMode="decimal" placeholder={r.ph} value={wd[r.field]||""} onChange={e=>upBody(r.field,e.target.value)} style={miniInput}/></div>))}
        </div>
      </div>}

      {/* Lab Markers - collapsible */}
      <div onClick={()=>setShowLab(!showLab)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 4px",cursor:"pointer",marginBottom:showLab?0:4}}>
        <span style={{fontSize:14,fontWeight:600,color:t.text}}>{"\uD83E\uDE78"} Lab Markers</span>
        <span style={{fontSize:11,color:t.muted,padding:"3px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showLab?"Hide":"Show"}</span>
      </div>
      {showLab&&<div style={{background:t.card,borderRadius:20,padding:16,marginBottom:10,boxShadow:t.csh}}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          {LAB_ROWS.map(r=>(<div key={r.field}><div style={{fontSize:9,color:t.muted,marginBottom:3}}>{r.label}</div><input inputMode="decimal" placeholder={r.ph} value={wd[r.field]||""} onChange={e=>upLab(r.field,e.target.value)} style={{...miniInput,fontSize:13}}/></div>))}
        </div>
      </div>}

      {/* Score */}
      {sc&&(<div style={{textAlign:"center",marginBottom:10,fontSize:14,color:t.muted}}>Score: <b style={{color:t.accent,fontSize:16}}>{sc.total}</b><span style={{fontSize:11,marginLeft:4}}>({sc.base} + {sc.bonus})</span></div>)}

      {/* Save */}
      <div onClick={!saving?handleSave:undefined} style={{padding:14,borderRadius:50,textAlign:"center",background:saved?t.on:`linear-gradient(135deg, ${t.accent}, ${t.dark})`,color:saved?t.accent:"#fff",fontSize:15,fontWeight:700,cursor:saving?"wait":"pointer",boxShadow:`0 6px 20px ${t.accent}40`,letterSpacing:"0.3px",opacity:saving?0.7:1,transition:"all 0.3s"}}>
        {saving?"Saving...":saved?"\u2713 Saved!":isToday?"Save":`Save ${fmtShort(new Date(selDate+"T00:00:00"))}`}
      </div>
    </div>
  );
}

// --- JOURNEY ---
function JourneyTab({D,loading,notes:CLINICAL_NOTES,generateInsight,analyzing}){
  const[showLabs,setShowLabs]=useState(false);
  const[expandedLab,setExpandedLab]=useState(null);
  const[showInsight,setShowInsight]=useState(true);
  const[showNotes,setShowNotes]=useState(false);
  const[noteDay,setNoteDay]=useState(()=>{const keys=Object.keys(CLINICAL_NOTES).sort((a,b)=>{const dA=parseInt(a.match(/Day (\d+)/)?.[1]||"0");const dB=parseInt(b.match(/Day (\d+)/)?.[1]||"0");return dB-dA});return keys[0]||null});
  const dates=Object.keys(D).sort();
  const find=(key)=>{for(let i=dates.length-1;i>=0;i--){const v=parseFloat(D[dates[i]]?.[key]);if(!isNaN(v))return v}return null};
  const metrics=[
    {key:"glucose",cur:find("glucFast"),tgt:TARGETS.glucose,fb:null},
    {key:"trig",cur:find("lab_trig"),tgt:TARGETS.trig,fb:null},
    {key:"weight",cur:find("body_weight"),tgt:TARGETS.weight,fb:null},
    {key:"bmi",cur:(()=>{const w=find("body_weight");return w?parseFloat((w/((1.67)**2)).toFixed(1)):null})(),tgt:TARGETS.bmi,fb:null},
    {key:"hba1c",cur:find("lab_hba1c"),tgt:TARGETS.hba1c,fb:"Next: Day 30"},
    {key:"ggt",cur:find("lab_ggt"),tgt:TARGETS.ggt,fb:"Next: end Mar"},
  ];

  // Lab data with confirmed + predictions (matching desktop)
  const labMarkers=SHARED_LAB_MARKERS;
  const stC={critical:{bg:t.dangerBg,tx:t.danger},warning:{bg:t.warnBg,tx:t.warn},ok:{bg:t.okBg,tx:t.ok}};

  return(
    <div style={{padding:"14px 16px 90px",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{marginBottom:16}}><span style={{fontSize:24,fontWeight:300,color:t.text,letterSpacing:"-0.03em"}}>Journey</span></div>

      {/* Progress bars */}
      {metrics.map(({key,cur,tgt,fb})=>{
        const pct=cur!=null?Math.min(100,Math.max(0,((tgt.s-cur)/(tgt.s-tgt.g))*100)):0;
        const ch=cur!=null?fmtPct(pctCh(tgt.s,cur)):null;
        let note=fb;if(cur!=null){if(key==="glucose"&&cur<100)note="Normal range!";else if(key==="weight")note=`-${(tgt.s-cur).toFixed(1)} kg`;else if(key==="trig"&&cur<=150)note="Normal range!";else if(ch)note=ch}
        return(<div key={key} style={{background:t.card,borderRadius:14,padding:"14px 16px",marginBottom:8,boxShadow:t.csh}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
            <span style={{fontSize:14,color:t.text,fontWeight:500}}>{tgt.l}</span>
            <span style={{fontSize:16,fontWeight:700,color:cur!=null?t.text:t.muted}}>{cur??"---"} <span style={{fontSize:11,fontWeight:400,color:t.muted}}>{tgt.u}</span></span>
          </div>
          <div style={{height:5,borderRadius:3,background:t.tile,overflow:"hidden",marginBottom:4}}>
            <div style={{width:`${pct}%`,height:"100%",borderRadius:3,background:cur!=null?t.accent:"transparent",transition:"width 0.5s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:t.muted}}>
            <span>{tgt.s} {">"} {tgt.g}{tgt.u}</span>
            {note&&<span style={{color:cur!=null?t.accent:t.muted,fontWeight:cur!=null?600:400}}>{note}</span>}
          </div>
        </div>)})}

      {/* Weekly Insight - collapsible */}
      <div onClick={()=>setShowInsight(!showInsight)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 4px",cursor:"pointer",marginTop:8}}>
        <span style={{fontSize:16,fontWeight:600,color:t.text}}>{"\uD83D\uDCA1"} Weekly Insight</span>
        <span style={{fontSize:11,color:t.muted,padding:"3px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showInsight?"Hide":"Show"}</span>
      </div>
      {showInsight&&(()=>{
        // Compute week metrics from data
        const today=new Date();const dy=today.getDay();const diff=today.getDate()-dy+(dy===0?-6:1);
        const mon=new Date(today);mon.setDate(diff);const weekDates=[];
        for(let i=0;i<7;i++){const dd=new Date(mon);dd.setDate(mon.getDate()+i);weekDates.push(`${dd.getFullYear()}-${String(dd.getMonth()+1).padStart(2,"0")}-${String(dd.getDate()).padStart(2,"0")}`);}
        const glucVals=weekDates.map(d=>{const v=D[d]?.glucFast;return v?parseFloat(v):null}).filter(v=>v&&!isNaN(v));
        const glucAvg=glucVals.length?Math.round(glucVals.reduce((a,b)=>a+b,0)/glucVals.length):null;
        const postVals=weekDates.map(d=>{const v=D[d]?.glucPost;return v?parseFloat(v):null}).filter(v=>v&&!isNaN(v));
        const postAvg=postVals.length?Math.round(postVals.reduce((a,b)=>a+b,0)/postVals.length):null;
        let sleepGood=0,sleepTotal=0;
        weekDates.forEach(d=>{const s=D[d]?.sleep;if(s){sleepTotal++;if(s==="7+"||s==="8+")sleepGood++}});

        return(<div>
          {/* Key highlights */}
          {glucAvg&&<div style={{display:"flex",gap:6,marginBottom:10}}>
            {[
              {label:"Fasting",val:glucAvg,color:glucAvg<=99?t.ok:glucAvg<=140?t.warn:t.danger},
              postAvg&&{label:"Post-meal",val:postAvg,color:postAvg<=140?t.ok:postAvg<=180?t.warn:t.danger},
              sleepTotal>0&&{label:"Sleep",val:`${sleepGood}/${sleepTotal}`,sub:"nights 7+",color:sleepGood>=sleepTotal*0.7?t.ok:t.warn},
            ].filter(Boolean).map((m,i)=>(
              <div key={i} style={{flex:1,textAlign:"center",background:t.card,borderRadius:12,padding:"8px 4px",boxShadow:t.csh}}>
                <div style={{fontSize:9,color:t.muted,textTransform:"uppercase"}}>{m.label}</div>
                <div style={{fontSize:18,fontWeight:700,color:m.color}}>{m.val}</div>
                {m.sub&&<div style={{fontSize:9,color:t.muted}}>{m.sub}</div>}
              </div>
            ))}
          </div>}

          {/* Key learnings + Next week focus */}
          <div style={{background:t.okBg,borderRadius:12,padding:"10px 14px",marginBottom:6}}>
            <div style={{fontSize:10,fontWeight:700,color:t.ok,textTransform:"uppercase",marginBottom:4}}>Key Learnings</div>
            {glucVals.length>=2&&glucVals[glucVals.length-1]<glucVals[0]&&<div style={{fontSize:12,color:t.ok,fontWeight:600,lineHeight:1.6}}>{"\u2713"} Fasting trending down this week</div>}
            {glucAvg&&glucAvg<=100&&<div style={{fontSize:12,color:t.ok,fontWeight:600,lineHeight:1.6}}>{"\u2713"} Fasting avg in normal range ({glucAvg})</div>}
            {sleepGood>=4&&<div style={{fontSize:12,color:t.ok,fontWeight:600,lineHeight:1.6}}>{"\u2713"} {sleepGood}/{sleepTotal} nights 7+ hours sleep</div>}
          </div>
          <div style={{background:"#dde8f5",borderRadius:12,padding:"10px 14px",marginBottom:10}}>
            <div style={{fontSize:10,fontWeight:700,color:"#185fa5",textTransform:"uppercase",marginBottom:4}}>Next Week Focus</div>
            <div style={{fontSize:12,color:t.text,fontWeight:600,lineHeight:1.6}}>{"\uD83D\uDE34"} Maintain sleep 7+ streak</div>
            <div style={{fontSize:12,color:t.text,fontWeight:600,lineHeight:1.6}}>{"\uD83C\uDFCA"} Resume swimming / cardio</div>
            <div style={{fontSize:12,color:t.text,fontWeight:600,lineHeight:1.6}}>{"\uD83E\uDDE0"} Trust low readings - don't panic eat</div>
          </div>
        </div>);
      })()}

      {/* Daily Notes - collapsible */}
      <div onClick={()=>setShowNotes(!showNotes)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 4px",cursor:"pointer"}}>
        <span style={{fontSize:16,fontWeight:600,color:t.text}}>{"\uD83D\uDCDD"} Daily Notes</span>
        <span style={{fontSize:11,color:t.muted,padding:"3px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showNotes?"Hide":"Show"}</span>
      </div>
      {showNotes&&<div>
        <div onClick={(e)=>{e.stopPropagation();if(!analyzing)generateInsight()}} style={{textAlign:"center",padding:"10px 0",marginBottom:10}}>
          <span style={{padding:"8px 20px",borderRadius:50,fontSize:12,fontWeight:600,cursor:analyzing?"wait":"pointer",background:analyzing?t.tile:`linear-gradient(135deg, ${t.accent}, ${t.dark})`,color:analyzing?t.muted:"#fff",boxShadow:t.shOn,display:"inline-flex",alignItems:"center",gap:5}}>
            {analyzing?<>{"\u23F3"} Analyzing...</>:<>{"\u2728"} Generate Today's Insight</>}
          </span>
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:10}}>
          {Object.keys(CLINICAL_NOTES).sort((a,b)=>{const dA=parseInt(a.match(/Day (\d+)/)?.[1]||"0");const dB=parseInt(b.match(/Day (\d+)/)?.[1]||"0");return dB-dA}).map(k=>{
            const active=noteDay===k;
            return(<div key={k} onClick={()=>setNoteDay(k)} style={{padding:"5px 12px",borderRadius:50,fontSize:11,fontWeight:active?700:500,cursor:"pointer",background:active?t.accent:t.tile,color:active?"#fff":t.muted,boxShadow:active?t.shOn:t.sh}}>{k.replace(/\s*\(Day\s*\d+\)/,"")}</div>);
          })}
        </div>
        {noteDay&&CLINICAL_NOTES[noteDay]&&CLINICAL_NOTES[noteDay].map((n,i)=>{
          const col={excellent:t.ok,ontrack:t.warn,grow:t.danger}[n.sev]||t.muted;
          return(<div key={i} style={{display:"flex",gap:10,marginBottom:10,padding:"0 4px"}}>
            <span style={{fontSize:16,flexShrink:0}}>{n.icon}</span>
            <div><div style={{fontSize:13,fontWeight:700,color:col,marginBottom:2}}>{n.title}</div><div style={{fontSize:12,color:t.muted,lineHeight:1.5}}>{n.text}</div></div>
          </div>);
        })}
      </div>}

      {/* Lab Data & Prediction - hideable scroll table */}
      <div onClick={()=>setShowLabs(!showLabs)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 4px",cursor:"pointer",marginTop:8}}>
        <span style={{fontSize:16,fontWeight:600,color:t.text}}>{"\uD83E\uDE78"} Lab Data & Prediction</span>
        <span style={{fontSize:11,color:t.muted,padding:"3px 10px",borderRadius:50,background:t.tile,boxShadow:t.sh}}>{showLabs?"Hide":"Show"}</span>
      </div>
      {showLabs&&(()=>{
        const labMeanings=SHARED_LAB_MEANINGS;
        return(<div style={{background:t.card,borderRadius:14,overflow:"hidden",boxShadow:t.csh}}>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:520,fontSize:12}}>
              <thead><tr style={{background:t.tile}}>
                <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:t.muted,minWidth:100}}>Marker</th>
                <th style={{padding:"8px 8px",textAlign:"center",color:t.light,fontWeight:600,minWidth:50,fontSize:11}}>Normal</th>
                <th style={{padding:"8px 6px",textAlign:"center",color:t.muted,fontWeight:700,minWidth:50}}>Base</th>
                <th style={{padding:"8px 6px",textAlign:"center",color:t.muted,fontWeight:600,minWidth:55}}>D30</th>
                <th style={{padding:"8px 6px",textAlign:"center",color:t.muted,fontWeight:600,minWidth:55}}>D60</th>
                <th style={{padding:"8px 6px",textAlign:"center",color:t.accent,fontWeight:700,minWidth:55}}>D90</th>
                <th style={{padding:"8px 4px",minWidth:20}}></th>
              </tr></thead>
              <tbody>{labMarkers.map((r,ri)=>{
                const sc=stC[r.status];const bg=ri%2===0?t.card:"#F5F2ED";
                const meaning=labMeanings[r.marker];
                const isOpen=expandedLab===ri;
                return(<React.Fragment key={r.marker}>
                  <tr style={{background:bg,cursor:"pointer"}} onClick={()=>setExpandedLab(isOpen?null:ri)}>
                    <td style={{padding:"8px 10px",fontWeight:600,fontSize:13}}>
                      <div style={{display:"flex",alignItems:"center",gap:5}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:sc.tx,flexShrink:0}}/>
                        {r.marker}
                      </div>
                    </td>
                    <td style={{padding:"8px 8px",textAlign:"center",fontSize:10,color:t.light}}>{r.normal}</td>
                    <td style={{padding:"8px 6px",textAlign:"center",fontSize:14,fontWeight:700,color:sc.tx}}>{r.confirmed}</td>
                    <td style={{padding:"8px 6px",textAlign:"center",color:t.muted,fontSize:12}}>{r.s30}</td>
                    <td style={{padding:"8px 6px",textAlign:"center",color:t.muted,fontSize:12}}>{r.s60}</td>
                    <td style={{padding:"8px 6px",textAlign:"center",fontWeight:700,color:t.accent,fontSize:13}}>{r.s90}</td>
                    <td style={{padding:"8px 4px",textAlign:"center",fontSize:10,color:t.light}}>{isOpen?"\u25B2":"\u25BC"}</td>
                  </tr>
                  {isOpen&&meaning&&<tr><td colSpan={7} style={{padding:"10px 14px 12px",background:"#F9F8F5",borderBottom:`1px solid ${t.tile}`}}>
                    <div style={{fontSize:12,color:t.text,lineHeight:1.6}}>{meaning.what}</div>
                    <div style={{fontSize:12,color:t.text,lineHeight:1.6}}>{meaning.why}</div>
                    <div style={{fontSize:12,color:t.danger,lineHeight:1.6}}>{meaning.risk}</div>
                    <div style={{fontSize:12,color:t.ok,lineHeight:1.6}}>Fix: {meaning.fix}</div>
                  </td></tr>}
                </React.Fragment>);
              })}</tbody>
            </table>
          </div>
        </div>);
      })()}
    </div>
  );
}

// --- GUIDE (full content: Lifestyle + Food + Science) ---
function GuideTab(){
  const[sec,setSec]=useState("lifestyle");
  const[actTab,setActTab]=useState("activities");
  const[sciTopic,setSciTopic]=useState(null);
  const[sciOpen,setSciOpen]=useState(null);
  const Pill=({active,children,onClick})=>(<div onClick={onClick} style={{padding:"7px 14px",borderRadius:50,fontSize:12,fontWeight:active?700:500,cursor:"pointer",background:active?t.accent:t.tile,color:active?"#fff":t.muted,boxShadow:active?t.shOn:t.sh,transition:"all 0.15s",WebkitTapHighlightColor:"transparent"}}>{children}</div>);
  const Col=({title,color,bg,items})=>(<div style={{minWidth:180,background:bg,borderRadius:12,padding:"10px 12px",flexShrink:0}}><div style={{fontSize:11,fontWeight:700,color,textAlign:"center",marginBottom:6}}>{title}</div>{items.map((x,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:i<items.length-1?`1px solid ${color}22`:"none"}}><span style={{fontSize:12,fontWeight:500,color:t.text}}>{x[0]}</span>{x[1]&&<span style={{fontSize:11,fontWeight:600,color}}>{x[1]}</span>}</div>))}</div>);

  const habits=[
    {icon:"\u2600\uFE0F",step:"Wake: Water + sunlight + 5 breaths",impact:"Resets circadian rhythm"},
    {icon:"\uD83C\uDF31",step:"Basil seeds 15 min before meal",impact:"Reduces spike 20-35%"},
    {icon:"\uD83E\uDD57",step:"Fiber + protein FIRST, carbs LAST",impact:"Reduces spike up to 40%"},
    {icon:"\uD83C\uDF3F",step:"Berberine 600mg with first bites",impact:"Works like metformin"},
    {icon:"\uD83D\uDC1F",step:"Fish oil with meals (3-4g/day)",impact:"Lowers trig 25-50%"},
    {icon:"\uD83D\uDEB6",step:"Walk 10-15 min after each meal",impact:"Drops glucose 20-40 pts"},
    {icon:"\uD83C\uDFCB\uFE0F",step:"Weight training 2x/week",impact:"Muscles absorb glucose 24-48hr"},
    {icon:"\uD83D\uDEAB",step:"Zero sweet drinks",impact:"#1 trig driver"},
    {icon:"\u23F0",step:"IF 14:10 window",impact:"Liver processes fat overnight"},
    {icon:"\uD83E\uDD5C",step:"Brazil nuts x3 with last meal",impact:"Thyroid + immune"},
    {icon:"\uD83D\uDCA7",step:"Water 2L+ daily",impact:"Flushes toxins"},
    {icon:"\uD83D\uDC8A",step:"Bedtime: Mg + D3/K2",impact:"Improves sleep + fasting"},
    {icon:"\uD83D\uDE34",step:"Sleep 7+ hours",impact:"Poor sleep = glucose +15-30"},
  ];
  const activities=[
    {name:"Weight training",emoji:"\uD83C\uDFCB\uFE0F",pts:"-30-60 pts",note:"Muscles become glucose sponges for 24-48hr"},
    {name:"HIIT / circuits",emoji:"\u26A1",pts:"-40-60 pts",note:"15 min = hours of benefit"},
    {name:"Stairs climbing",emoji:"\uD83E\uDEDC",pts:"-25-40 pts",note:"Free, available everywhere"},
    {name:"Long walk 30+ min",emoji:"\uD83D\uDEB6",pts:"-30-50 pts",note:"The #1 tool"},
    {name:"Swimming",emoji:"\uD83C\uDFCA",pts:"-25-40 pts",note:"Low joint stress, full body"},
    {name:"Dancing",emoji:"\uD83D\uDC83",pts:"-20-35 pts",note:"Fun, burns without feeling like exercise"},
    {name:"Walk 10-15 min",emoji:"\uD83D\uDC5F",pts:"-20-40 pts",note:"Best ROI. After every meal"},
    {name:"Housework",emoji:"\uD83E\uDDF9",pts:"-15-25 pts",note:"All count"},
    {name:"Stretching / yoga",emoji:"\uD83E\uDDD8",pts:"-5-10 pts",note:"Flexibility + stress reduction"},
  ];
  const recovery=[
    {name:"Infrared sauna",emoji:"\uD83E\uDDD6",pts:"-10-20 pts",note:"Improves insulin sensitivity"},
    {name:"Deep tissue massage",emoji:"\uD83D\uDC86",pts:"-5-10 pts",note:"Lowers cortisol 30%"},
    {name:"Cold shower (30s)",emoji:"\uD83E\uDDCA",pts:"-10-15 pts",note:"Activates brown fat"},
    {name:"Legs up the wall",emoji:"\uD83E\uDDB5",pts:"Recovery",note:"Calms nervous system"},
    {name:"Foam rolling",emoji:"\uD83E\uDDBD",pts:"Recovery",note:"Breaks up fascia"},
    {name:"Breathing exercises",emoji:"\uD83C\uDF2C\uFE0F",pts:"-5-10 pts",note:"4-7-8 lowers cortisol"},
  ];

  const foodCats=[
    ["Carb Guide (GI)",[["Konjac rice","GI 0"],["Shirataki noodle","GI 0"],["Cauliflower rice","GI 5"],["Glass noodle","GI 39"],["Oats","GI 40"],["Sweet potato","GI 44"],["Basmati rice","GI 50"],["Low GI rice","GI 54"]],[["Corn","GI 52"],["Taro","GI 53"],["Potato","GI 58"],["Oat milk","GI 60"],["Rice berry","GI 62"],["Pumpkin","GI 64"],["Brown rice","GI 68"]],[["Pastries","GI 70"],["Instant noodle","GI 73"],["White bread","GI 75"],["Mashed potato","GI 78"],["Rice porridge","GI 83"],["Sticky rice","GI 87"],["Jasmine rice","GI 89"]]],
    ["Fruit Guide (GI)",[["Guava","GI 12"],["Cherries","GI 22"],["Strawberries","GI 25"],["Blueberries","GI 25"],["Grapefruit","GI 25"],["Apple","GI 36"],["Pear","GI 38"]],[["Orange","GI 43"],["Grapes","GI 46"],["Dragon fruit","GI 48"],["Kiwi","GI 50"],["Mango","GI 51"],["Banana","GI 51"],["Papaya","GI 56"]],[["Durian","GI 44*"],["Lychee","GI 57"],["Rambutan","GI 59"],["Pineapple","GI 66"],["Ripe banana","GI 70"],["Watermelon","GI 72"]]],
    ["Protein",[["Eggs 2-3/meal"],["Salmon, sardines"],["Chicken breast/thigh"],["Pork tenderloin"],["Firm tofu"],["Greek yogurt"],["Shrimp, squid"]],[["Fried chicken (no batter)"],["Pork belly (small)"],["Duck"],["Beef (lean)"]],[["Hotdog, sausage"],["Processed ham"],["KFC / battered"],["Fish balls"]]],
    ["Vegetables",[["Morning glory"],["Bitter gourd"],["Broccoli, cauliflower"],["Spinach, kale"],["Mushrooms"],["Cucumber, tomato"],["Cabbage, lettuce"],["Kimchi"]],[["Carrots (cooked)"],["Peas"],["Bell pepper"],["Beetroot"]],[["Corn (starch)"],["Potatoes / taro"],["Canned w/ sugar"]]],
    ["Healthy Fats",[["Olive oil"],["Coconut oil"],["Avocado"],["Almonds, walnuts"],["Pumpkin seeds"],["Dark choc 85%+"]],[["Butter (small)"],["Cheese (small)"],["Coconut cream"],["Dark choc 70%"]],[["Canola / soybean oil"],["Margarine"],["Honey-roasted nuts"]]],
    ["Drinks",[["Water 8-10 glasses"],["Green tea"],["Ginger tea"],["Black coffee"],["Almond milk"],["Chrysanthemum tea"]],[["Unsweetened soy milk"],["Coconut water (small)"],["Sparkling water"]],[["Milk tea / cha yen"],["Soda"],["3-in-1 coffee"],["Fruit juice"],["Energy drinks"],["Alcohol"]]],
    ["Treats",[["Dark choc 85%+"],["Stevia"],["Monk fruit"],["Unsweetened cacao"]],[["Dark choc 70%"],["Coconut cream dessert"],["Yogurt + berries"]],[["Candy, ice cream"],["Honey, agave"],["Coconut sugar"],["Regular sugar"]]],
  ];

  const science={
    spikes:[
      {h:"What is a spike?",p:"When you eat carbs, glucose floods your bloodstream. A healthy pancreas releases insulin within minutes (first-phase response). When impaired, glucose stays elevated - that's a spike."},
      {h:"Delta ranges",p:"Under +30: Excellent - pancreas responded on time.\n+30-50: Moderate - manageable but shouldn't be daily.\n+50-80: Poor - first-phase insulin didn't fire.\n+80+: Alarm - triggers inflammation cascades."},
      {h:"Absolute ranges",p:"Under 140: Target - no damage.\n140-180: Damage zone - repairable if occasional.\n180-250: Active damage - glycation.\n250+: Emergency."},
      {h:"Area under the curve",p:"Not just the peak - it's how LONG glucose stays high. 160 that drops in 30 min (post-walk) does far less damage than 160 for 3 hours (sitting)."},
      {h:"Angkhana's data",p:"White rice: +97 (alarm). Low GI rice 3 spoons: +46 (moderate). Potatoes: +20 (ok). Chicken + veggies: negative delta (perfect)."},
    ],
    pancreas:[
      {h:"How insulin works",p:"Beta cells produce insulin in two phases: quick burst (5 min) and sustained release (1-2 hrs). In Type 2, first-phase is impaired."},
      {h:"Beta cell fatigue",p:"Not dead - exhausted and surrounded by fat. Remove fat + reduce demand = they recover."},
      {h:"Insulin resistance",p:"Cells downregulate receptors when constantly flooded. Pancreas produces MORE insulin, exhausting beta cells. Breaking this cycle is the core goal."},
      {h:"Recovery signs",p:"Fasting dropping = liver becoming insulin-sensitive. Spikes shrinking = beta cells recovering. Same meal smaller spike = peripheral sensitivity improving."},
    ],
    exercise:[
      {h:"Insulin bypass",p:"GLUT4 transporters open WITHOUT insulin. Angkhana's swim: 131 to 101."},
      {h:"Walking after meals",p:"10-15 min drops post-meal glucose 20-40 points. Leg muscles act as glucose sponges."},
      {h:"Weight training",p:"Biggest unused lever. Micro-tears = muscles absorb glucose for 24-48 hours to repair. More muscle = more disposal 24/7."},
      {h:"48-hour effect",p:"After intense exercise, insulin sensitivity improves for 48 hours. Cumulative."},
    ],
    supps:[
      {h:"Berberine",p:"Works like metformin. Activates AMPK. Increases glucose uptake, reduces liver production. Takes 2-4 weeks. Must take WITH food."},
      {h:"Fish Oil",p:"Omega-3s reduce liver triglyceride production. Anti-inflammatory for insulin receptors. 3-4g/day for therapeutic effect."},
      {h:"Magnesium",p:"300+ enzyme reactions including insulin signaling. Glycinate absorbs best. Bedtime dosing improves sleep."},
      {h:"D3 + K2",p:"Vitamin D receptors on beta cells and muscle cells. K2 directs calcium to bones. Always take with fat."},
      {h:"Timing",p:"Berberine + Fish Oil WITH meals: work on the food you're eating.\nMg + D3/K2 at BEDTIME: Mg calms for sleep, D3 absorbs overnight."},
    ],
    sleep:[
      {h:"Cortisol connection",p:"Poor sleep triggers cortisol. Cortisol tells liver to dump glucose. One night <6h = glucose +15-30 next morning."},
      {h:"Sleep loss = insulin resistance",p:"One night of 4-5 hours reduces sensitivity by 25-30%. A week of <6h = pre-diabetic resistance levels."},
      {h:"Growth hormone",p:"Deep sleep triggers growth hormone for muscle repair, fat metabolism, beta cell regeneration. Poor sleep = slower recovery."},
      {h:"Glucose-sleep cycle",p:"High evening glucose disrupts sleep. Poor sleep raises morning glucose. Break with: early dinner, walk, dark room, magnesium."},
    ],
    food:[
      {h:"Fiber first, carbs last",p:"Fiber creates a gel barrier. Carbs absorb slowly. Same meal, different order = 40% less spike."},
      {h:"GI truth",p:"'Low GI' measured in healthy people. For impaired insulin, even low GI spikes significantly. Angkhana's low GI rice +46 proves this."},
      {h:"Protein + fat = safe",p:"Protein: minimal insulin, zero spike. Fat: zero insulin. Combined: steady energy 4-6 hours."},
      {h:"Carb threshold",p:"Everyone has a personal threshold. Angkhana's is very low now (3 spoons rice overwhelmed). Threshold rises as beta cells recover."},
      {h:"IF mechanism",p:"Fasting: insulin drops, body switches to fat-burning. 16:8 = 16 hours liver fat-processing per day."},
      {h:"Meal timing",p:"Insulin sensitivity highest in morning, drops through day. Same meal at 7am = smaller spike than 7pm."},
    ],
  };

  return(
    <div style={{padding:"14px 16px 90px",fontFamily:"'DM Sans',sans-serif"}}>
      <div style={{marginBottom:14}}><span style={{fontSize:24,fontWeight:300,color:t.text,letterSpacing:"-0.03em"}}>Guide</span></div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:16}}>
        {[["lifestyle","Lifestyle"],["food","Food & Supps"],["science","Body Science"]].map(([k,l])=>(<Pill key={k} active={sec===k} onClick={()=>setSec(k)}>{l}</Pill>))}
      </div>

      {/* LIFESTYLE */}
      {sec==="lifestyle"&&<div>
        <div style={{fontSize:14,fontWeight:700,marginBottom:10}}>Daily Habits</div>
        {habits.map((h,i)=>(<div key={i} style={{background:t.card,borderRadius:14,padding:"10px 14px",marginBottom:5,boxShadow:t.csh,display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{fontSize:18,flexShrink:0}}>{h.icon}</span>
          <div><div style={{fontSize:13,fontWeight:600,lineHeight:1.3}}>{h.step}</div><div style={{fontSize:11,color:t.muted,marginTop:2}}>{h.impact}</div></div>
        </div>))}
        <div style={{fontSize:14,fontWeight:700,marginTop:16,marginBottom:6}}>Activity Ideas</div>
        <div style={{display:"flex",gap:4,marginBottom:10}}>
          <Pill active={actTab==="activities"} onClick={()=>setActTab("activities")}>Activities</Pill>
          <Pill active={actTab==="recovery"} onClick={()=>setActTab("recovery")}>Recovery</Pill>
        </div>
        <div style={{background:t.card,borderRadius:14,overflow:"hidden",boxShadow:t.csh}}>
          {(actTab==="activities"?activities:recovery).map((a,i,arr)=>(
            <div key={i} style={{padding:"10px 14px",borderBottom:i<arr.length-1?`1px solid ${t.tile}`:"none",display:"flex",gap:10,alignItems:"flex-start"}}>
              <span style={{fontSize:18,flexShrink:0}}>{a.emoji}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{a.name}</span>
                  <span style={{fontSize:11,color:t.ok,fontWeight:700}}>{a.pts}</span>
                </div>
                <div style={{fontSize:11,color:t.muted}}>{a.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* FOOD - slidable 3-col grid per category */}
      {sec==="food"&&<div>
        {foodCats.map(([cat,safe,limit,avoid],ci)=>(<div key={ci} style={{marginBottom:16}}>
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:8}}>{cat}</div>
          <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch",marginLeft:-4,marginRight:-4,paddingLeft:4,paddingRight:4}}>
            <div style={{display:"flex",gap:8,minWidth:540}}>
              <Col title="SAFE" color={t.ok} bg={t.okBg} items={safe}/>
              <Col title="LIMIT" color={t.warn} bg={t.warnBg} items={limit}/>
              <Col title="AVOID" color={t.danger} bg={t.dangerBg} items={avoid}/>
            </div>
          </div>
        </div>))}
        <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:8,marginTop:8}}>Supplements</div>
        {[
          ["\uD83C\uDF3F","Berberine","600mg x2 w/ meals","Trig -20-35%, A1C -0.9-2%"],
          ["\uD83D\uDC1F","Fish Oil","3-4g EPA+DHA split","Trig -20-50%"],
          ["\uD83D\uDC8E","Magnesium","200mg+ bedtime","A1C -0.3-0.5%"],
          ["\u2600\uFE0F","D3 + K2","2000-5000 IU + 100mcg","Insulin receptor support"],
        ].map(([icon,n,d,e],i)=>(
          <div key={i} style={{background:t.card,borderRadius:12,padding:"10px 14px",marginBottom:5,boxShadow:t.csh,display:"flex",gap:10,alignItems:"center"}}>
            <span style={{fontSize:18}}>{icon}</span>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{n}</div><div style={{fontSize:11,color:t.muted}}>{d}</div></div>
            <span style={{fontSize:10,color:t.accent,fontWeight:600,textAlign:"right",maxWidth:80}}>{e}</span>
          </div>
        ))}
        <div style={{fontSize:13,fontWeight:600,color:t.accent,marginTop:12,marginBottom:6}}>Quick Rules</div>
        {[
          ["\uD83E\uDD57","Eating order matters","Fiber/veggies first, then protein, then fat, carbs LAST."],
          ["\uD83C\uDF72","Soup = secret weapon","Tom jeud, bone broth. Fills stomach, very low calorie."],
          ["\uD83D\uDEAB","Added sugar limit","Day 1-30: 0g. Day 31-60: max 10g. Day 61-90: max 15g."],
        ].map(([icon,tip,detail],i)=>(
          <div key={i} style={{background:t.card,borderRadius:10,padding:"10px 14px",marginBottom:4,boxShadow:t.csh}}>
            <div style={{fontSize:12,fontWeight:700,color:t.text}}>{icon} {tip}</div>
            <div style={{fontSize:11,color:t.muted,marginTop:2}}>{detail}</div>
          </div>
        ))}
      </div>}

      {/* SCIENCE - S2 accordion */}
      {sec==="science"&&<div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:12}}>
          {[["spikes","Spikes"],["pancreas","Pancreas"],["exercise","Exercise"],["supps","Supplements"],["sleep","Sleep"],["food","Food"]].map(([k,l])=>(<Pill key={k} active={sciTopic===k} onClick={()=>{setSciTopic(sciTopic===k?null:k);setSciOpen(null)}}>{l}</Pill>))}
        </div>
        {sciTopic&&science[sciTopic]?(<div style={{background:t.card,borderRadius:14,overflow:"hidden",boxShadow:t.csh}}>
          {science[sciTopic].map((c,i,arr)=>(
            <React.Fragment key={i}>
              <div onClick={()=>setSciOpen(sciOpen===i?null:i)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 14px",cursor:"pointer",borderBottom:sciOpen===i||i<arr.length-1?`1px solid ${t.tile}`:"none"}}>
                <span style={{fontSize:13,fontWeight:600,color:t.accent}}>{c.h}</span>
                <span style={{fontSize:10,color:t.light}}>{sciOpen===i?"\u25B2":"\u25BC"}</span>
              </div>
              {sciOpen===i&&<div style={{padding:"8px 14px 14px",background:"#F9F8F5",borderBottom:i<arr.length-1?`1px solid ${t.tile}`:"none"}}>
                {c.p.split("\n").map((line,li)=>(<div key={li} style={{fontSize:12,color:t.text,lineHeight:1.7,marginBottom:li>0?2:0}}>{line}</div>))}
              </div>}
            </React.Fragment>
          ))}
        </div>):(!sciTopic&&<div style={{fontSize:13,color:t.muted,fontStyle:"italic"}}>Select a topic above</div>)}
      </div>}
    </div>
  );
}

// --- NAV (4 tabs) ---
function Nav({tab,setTab}){
  return(
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:430,height:60,background:t.card,display:"flex",justifyContent:"space-around",alignItems:"center",boxShadow:"0 -2px 12px rgba(0,0,0,0.07)",zIndex:100,borderRadius:"20px 20px 0 0",paddingBottom:"max(0px, env(safe-area-inset-bottom))"}}>
      {[
        {key:"home",label:"Home",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?t.accent:t.muted} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>},
        {key:"log",label:"Log",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?t.accent:t.muted} strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>},
        {key:"journey",label:"Journey",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?t.accent:t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="7 17 17 7"/><polyline points="7 7 17 7 17 17"/></svg>},
        {key:"guide",label:"More",icon:(a)=><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?t.accent:t.muted} strokeWidth="2.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>},
      ].map(({key,label,icon})=>(
        <div key={key} onClick={()=>setTab(key)} style={{textAlign:"center",cursor:"pointer",padding:"6px 14px",WebkitTapHighlightColor:"transparent"}}>
          {icon(tab===key)}
          <div style={{fontSize:11,marginTop:2,color:tab===key?t.accent:t.muted,fontWeight:tab===key?700:500}}>{label}</div>
        </div>
      ))}
    </div>
  );
}

// --- MAIN ---
export default function GoldenEraMobile(){
  const[tab,setTab]=useState("home");const[D,setD]=useState({});const[loading,setLoading]=useState(true);
  const[aiNotes,setAiNotes]=useState({});
  const[analyzing,setAnalyzing]=useState(false);

  // Merge static + AI notes
  const CLINICAL_NOTES={...STATIC_NOTES,...aiNotes};

  const load=useCallback(async()=>{
    setLoading(true);const res=await apiLoad();
    if(res){
      let tracker={};if(res.tracker&&typeof res.tracker==="object")tracker=res.tracker;
      if(res.body&&typeof res.body==="object"){Object.entries(res.body).forEach(([k,v])=>{const parts=k.split("-");const field=parts[0];const date=parts.slice(1).join("-");if(date&&field){if(!tracker[date])tracker[date]={};tracker[date]["body_"+field]=v}})}
      if(res.lab&&typeof res.lab==="object"){Object.entries(res.lab).forEach(([k,v])=>{const idx=k.indexOf("-2026-");if(idx===-1)return;const field=k.substring(0,idx);const date=k.substring(idx+1);if(date&&field){if(!tracker[date])tracker[date]={};tracker[date][field]=v}})}
      if(res.insights&&Object.keys(res.insights).length>0)setAiNotes(res.insights);
      setD(tracker);
    }
    setLoading(false);
  },[]);

  const generateInsight=async(targetDate)=>{
    setAnalyzing(true);
    try{
      const td=targetDate||new Date().toISOString().split("T")[0];
      const dn2=Math.max(1,Math.floor((new Date(td)-new Date("2026-03-02"))/864e5)+1);
      const dateObj=new Date(td+"T00:00:00");
      const dateStr=dateObj.toLocaleDateString("en-US",{day:"numeric",month:"short"});
      const dayD=D[td]||{};
      const hist={};
      for(let i=1;i<=7;i++){const d2=new Date(dateObj);d2.setDate(d2.getDate()-i);const k=d2.toISOString().split("T")[0];if(D[k])hist[k]=D[k]}
      const prevKey=Object.keys(CLINICAL_NOTES).sort((a,b)=>{const dA=parseInt(a.match(/Day (\d+)/)?.[1]||"0");const dB=parseInt(b.match(/Day (\d+)/)?.[1]||"0");return dB-dA})[0];
      const prevText=prevKey?JSON.stringify(CLINICAL_NOTES[prevKey]):"";
      const prompt=buildInsightPrompt(dayD,dn2,dateStr,hist,prevText);
      const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await resp.json();
      const text=data.content?.map(c=>c.text||"").join("")||"";
      const clean=text.replace(/```json|```/g,"").trim();
      const insights=JSON.parse(clean);
      const dateKey=`${dateStr} (Day ${dn2})`;
      await fetch(API,{method:"POST",headers:{"Content-Type":"text/plain"},body:JSON.stringify({action:"saveInsight",dateKey,insights})});
      setAiNotes(p=>({...p,[dateKey]:insights}));
    }catch(err){console.error("Insight generation failed:",err)}
    setAnalyzing(false);
  };

  useEffect(()=>{load()},[load]);
  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:t.bg,color:t.text,minHeight:"100dvh",maxWidth:430,margin:"0 auto",position:"relative",overflowX:"hidden",WebkitFontSmoothing:"antialiased"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@200;300;400;500;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{minHeight:"calc(100dvh - 60px)"}}>
        {tab==="home"&&<HomeTab D={D} loading={loading} setTab={setTab} notes={CLINICAL_NOTES}/>}
        {tab==="log"&&<LogTab D={D} setD={setD}/>}
        {tab==="journey"&&<JourneyTab D={D} loading={loading} notes={CLINICAL_NOTES} generateInsight={generateInsight} analyzing={analyzing}/>}
        {tab==="guide"&&<GuideTab/>}
      </div>
      <Nav tab={tab} setTab={setTab}/>
    </div>
  );
}
