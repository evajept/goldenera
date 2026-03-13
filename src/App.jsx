import React, { useState } from "react";

const FONT_LINK = "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap";
if(!document.querySelector(`link[href="${FONT_LINK}"]`)){const l=document.createElement("link");l.rel="stylesheet";l.href=FONT_LINK;document.head.appendChild(l);}

const SHEET_API = "https://script.google.com/macros/s/AKfycbxWHehS2Drs5gXKPuNv1u173pLu7Mr8ZOJ7KX5pEOS4L5K-X7HOeHBN1Cw9pUt5Byf2Hw/exec";

// Debounced save to Google Sheets
const saveQueue = {};
let saveTimer = null;
const queueSave = (date, data, type="tracker") => {
  saveQueue[type+"-"+date] = { date, data, type };
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    const items = Object.values(saveQueue);
    Object.keys(saveQueue).forEach(k => delete saveQueue[k]);
    for (const item of items) {
      try {
        const action = item.type === "body" ? "saveBody" : "saveDay";
        await fetch(SHEET_API, {
          method: "POST",
          headers: { "Content-Type": "text/plain" },
          body: JSON.stringify({ action, date: item.date, data: item.data }),
        });
      } catch (err) {
        console.log("Sheet sync error:", err);
      }
    }
  }, 2000); // 2s debounce
};

const WEIGHT = 73.6, HEIGHT_CM = 167;
const BMI = (WEIGHT / ((HEIGHT_CM / 100) ** 2)).toFixed(1);

const labMarkers = [
  { marker:"HbA1C", confirmed:"9.4%", normal:"<5.7%", status:"critical",
    s30:"8.2–8.5%",s60:"7.0–7.5%",s90:"5.8–6.3%", m30:"8.7–9.0%",m60:"7.7–8.2%",m90:"6.8–7.2%", n30:"9.2–9.3%",n60:"8.8–9.0%",n90:"8.2–8.6%" },
  { marker:"Fasting Glucose", confirmed:"211", normal:"70–99", status:"critical",
    s30:"140–160",s60:"110–125",s90:"85–100", m30:"160–180",m60:"140–155",m90:"120–140", n30:"195–205",n60:"185–195",n90:"170–200" },
  { marker:"Triglycerides", confirmed:"702", normal:"<160", status:"critical",
    s30:"350–400",s60:"180–220",s90:"100–150", m30:"480–520",m60:"280–320",m90:"180–220", n30:"640–670",n60:"560–600",n90:"450–520" },
  { marker:"GGT", confirmed:"184", normal:"9–39", status:"critical",
    s30:"100–130",s60:"50–70",s90:"25–40", m30:"130–150",m60:"80–110",m90:"50–80", n30:"160–175",n60:"140–160",n90:"100–150" },
  { marker:"SGPT (ALT)", confirmed:"50", normal:"<35", status:"warning",
    s30:"35–40",s60:"25–30",s90:"18–25", m30:"40–45",m60:"30–38",m90:"25–35", n30:"45–50",n60:"40–48",n90:"35–45" },
  { marker:"SGOT (AST)", confirmed:"31", normal:"<32", status:"ok",
    s30:"26–30",s60:"22–26",s90:"18–22", m30:"28–31",m60:"25–29",m90:"22–28", n30:"30–32",n60:"29–31",n90:"28–32" },
  { marker:"Cholesterol", confirmed:"220", normal:"<200", status:"warning",
    s30:"200–210",s60:"190–200",s90:"180–195", m30:"210–218",m60:"200–210",m90:"195–210", n30:"218–222",n60:"215–220",n90:"210–220" },
  { marker:"Uric Acid", confirmed:"7.2", normal:"2.3–6.1", status:"warning",
    s30:"6.2–6.5",s60:"5.5–6.0",s90:"5.0–5.5", m30:"6.5–6.8",m60:"6.0–6.5",m90:"5.5–6.2", n30:"7.0–7.1",n60:"6.8–7.0",n90:"6.5–7.0" },
  { marker:"HDL-C", confirmed:"45", normal:">44", status:"ok",
    s30:"46–48",s60:"48–52",s90:"52–58", m30:"45–47",m60:"46–49",m90:"48–52", n30:"44–45",n60:"44–46",n90:"44–46" },
  { marker:"LDL-C", confirmed:"109", normal:"<130", status:"ok",
    s30:"105–110",s60:"100–108",s90:"95–105", m30:"108–112",m60:"105–110",m90:"100–115", n30:"108–112",n60:"107–112",n90:"105–115" },
  { marker:"Creatinine", confirmed:"0.52", normal:"0.5–0.9", status:"ok",
    s30:"0.52",s60:"0.52",s90:"0.52", m30:"0.52",m60:"0.52",m90:"0.52", n30:"0.52",n60:"0.52",n90:"0.52" },
  { marker:"eGFR", confirmed:"130", normal:">90", status:"ok",
    s30:"130",s60:"130",s90:"128", m30:"130",m60:"130",m90:"129", n30:"130",n60:"130",n90:"130" },
  { marker:"Weight", confirmed:"73.6", normal:"BMI<23", status:"warning",
    s30:"69–70",s60:"65–67",s90:"60–63", m30:"71–72",m60:"68–70",m90:"65–67", n30:"72–73",n60:"71–72",n90:"69–71" },
  { marker:"BMI", confirmed:"26.4", normal:"18.5–22.9", status:"warning",
    s30:"24.7–25.1",s60:"23.3–24.0",s90:"21.5–22.6", m30:"25.4–25.8",m60:"24.4–25.1",m90:"23.3–24.0", n30:"25.8–26.2",n60:"25.4–25.8",n90:"24.7–25.4" },
];

// Clinical notes per checkup date
const clinicalNotes = {
  "26 Feb": [
    { icon:"🔄", sev:"ontrack", title:"Recalibration week", text:"Processing lab results, preparing for Angkhana's move-in and new job transition. Using this time to plan the protocol, set up tracking systems, and establish baseline measurements." },
    { icon:"🚨", sev:"grow", title:"Pancreatitis Risk", text:"Trig 702 (4x limit). Above 500 = acute pancreatitis risk. If severe stomach pain radiating to back, nausea, vomiting, go to ER immediately." },
    { icon:"🫁", sev:"grow", title:"Fatty Liver (NAFLD)", text:"GGT 184 + ALT 50 confirms fatty liver. Reversible. Liver regenerates in 6-8 weeks once triggers removed." },
    { icon:"🩸", sev:"grow", title:"Uncontrolled Diabetes", text:"HbA1C 9.4% + Glucose 211. Without intervention, nerve/kidney/vision damage risk increases within 1-2 years." },
    { icon:"✅", sev:"excellent", title:"Kidneys Normal", text:"Creatinine 0.52, eGFR 130. Kidneys healthy. Safe for all supplements." },
  ],
  "7 Mar (Day 5)": [
    { icon:"🎉", sev:"excellent", title:"Glucose 211 to 142 (Day 5)", text:"Dropped 69 points (-33%) in 5 days. Ahead of predictions. Protocol is working." },
    { icon:"🚶", sev:"excellent", title:"Walking daily + berberine started", text:"Berberine ramped from x1 to x2 by Day 5. Walking after meals every day. These two are the biggest drivers." },
    { icon:"🍚", sev:"grow", title:"Post-meal spike 208", text:"4 spoons rice berry + potato + pumpkin = too many carbs. Target <30g carbs/meal. Drop potato." },
    { icon:"😴", sev:"grow", title:"Sleep <7 every night so far", text:"Consistent <7h sleep. This alone costs 15-30 pts on fasting glucose. Sleep is the missing lever." },
    { icon:"💊", sev:"grow", title:"Mg + D3/K2 still zero", text:"5 days without these supplements. Magnesium improves sleep AND fasting glucose." },
  ],
  "7 Mar (Day 6)": [
    { icon:"🐟", sev:"excellent", title:"No spike at lunch, no carbs", text:"Mar 7: Salmon + broccoli = no glucose spike. Confirms protein + fat meals are safe and effective." },
  ],
  "8 Mar (Day 7)": [
    { icon:"⚖️", sev:"excellent", title:"Weight 73.6 to 71.8 kg (-1.8)", text:"Lost 1.8 kg in first week. First 1-2 kg is water/inflammation. Sustainable pace." },
    { icon:"📐", sev:"excellent", title:"Hip 103 to 99 cm (-4 cm)", text:"Biggest single measurement drop. Fat is mobilizing." },
    { icon:"📏", sev:"excellent", title:"Neck 42 to 39 cm (-3 cm)", text:"Neck circumference tracks insulin resistance. 3 cm drop is a strong signal." },
    { icon:"🍚", sev:"grow", title:"White rice spike to 217", text:"Mar 8: Tom yum with white boiled rice + spicy glass noodle salad spiked to 217. Had to walk and do chores to bring it down to 150. White rice confirmed off-limits." },
  ],
  "10 Mar (Day 9)": [
    { icon:"🎉", sev:"excellent", title:"Glucose 211 to 123 (Day 9)", text:"Dropped 88 points (-42%) in 9 days. Now only 24 points above normal range (70-99)." },
    { icon:"🍚", sev:"ontrack", title:"Low GI rice test passed", text:"Post-meal 160 after low GI rice (spike +37). Compare: white rice spike was +97 (to 217). Low GI works." },
    { icon:"📉", sev:"excellent", title:"No-carb meals = no spike", text:"Salmon-style meals still producing drops, not spikes. Metabolism is recovering." },
  ],
  "11 Mar (Day 10)": [
    { icon:"📊", sev:"ontrack", title:"Fasting glucose 120, steady", text:"Day 10: consolidating in low 120s. Body is finding a new set point." },
    { icon:"🧠", sev:"ontrack", title:"Brain work spikes glucose", text:"Mar 11: After lunch spike 120 to 137. Peak 143 during meeting, not stress but focused attention. Bottom 116, probably after berberine kicked in." },
  ],
  "12 Mar (Day 11)": [
    { icon:"📊", sev:"ontrack", title:"Fasting glucose 123, holding", text:"Day 11: stable in 120s range. Consistent." },
    { icon:"💊", sev:"excellent", title:"Magnesium finally started", text:"Day 11: Mg x2 started. Should help sleep quality and fasting glucose." },
    { icon:"😴", sev:"ontrack", title:"Spike when exhausted", text:"Mar 12: Glucose spiked when feeling exhausted. Fatigue and stress raise cortisol which raises glucose." },
  ],
  "13 Mar (Day 12)": [
    { icon:"📉", sev:"excellent", title:"Fasting glucose 117, new low", text:"Day 12: 117 is the lowest fasting reading yet. Down 94 points from baseline 211." },
    { icon:"🍚", sev:"grow", title:"Low GI rice still spikes", text:"Mar 13: 2 spoons of low GI rice spiked post-meal to 163. After days of no rice at all, even small amounts cause a spike. Body still not ready for rice." },
    { icon:"☀️", sev:"excellent", title:"D3/K2 started", text:"Day 12: First dose of D3/K2. Now all 4 core supplements are active." },
    { icon:"😴", sev:"excellent", title:"Sleep improving, two 7+ nights", text:"Day 10 and Day 12 both logged 7+ hours. Sleep is starting to shift." },
  ],
};

// Chart data: confirmed = real, predicted = projection
// Timeline: 26 Feb = Day 0, 2 Mar = Day 1, 10 Mar = Day 9
const chartData = {
  strict: {
    gluc:[{m:"26 Feb",v:211,confirmed:true},{m:"2 Mar",v:180,confirmed:true},{m:"5 Mar",v:142,confirmed:true},{m:"8 Mar",v:150,confirmed:true},{m:"10 Mar",v:123,confirmed:true},{m:"D30",v:100,confirmed:false},{m:"D60",v:88,confirmed:false},{m:"D90",v:82,confirmed:false}],
    hb:[{m:"26 Feb",v:9.4,confirmed:true},{m:"D30",v:7.8,confirmed:false},{m:"D60",v:6.5,confirmed:false},{m:"D90",v:5.7,confirmed:false}],
    trig:[{m:"26 Feb",v:702,confirmed:true},{m:"D30",v:350,confirmed:false},{m:"D60",v:200,confirmed:false},{m:"D90",v:135,confirmed:false}],
    wt:[{m:"26 Feb",v:73.6,confirmed:true},{m:"8 Mar",v:71.8,confirmed:true},{m:"D30",v:68,confirmed:false},{m:"D60",v:64,confirmed:false},{m:"D90",v:61,confirmed:false}],
    ggt:[{m:"26 Feb",v:184,confirmed:true},{m:"D30",v:110,confirmed:false},{m:"D60",v:55,confirmed:false},{m:"D90",v:30,confirmed:false}],
    chol:[{m:"26 Feb",v:220,confirmed:true},{m:"D30",v:205,confirmed:false},{m:"D60",v:195,confirmed:false},{m:"D90",v:187,confirmed:false}],
    bmi:[{m:"26 Feb",v:26.4,confirmed:true},{m:"8 Mar",v:25.7,confirmed:true},{m:"D30",v:24.4,confirmed:false},{m:"D60",v:23.0,confirmed:false},{m:"D90",v:21.9,confirmed:false}],
  },
};

const dailyHabits = [
  {icon:"☀️",step:"Wake: Water + sunlight + 5 deep breaths",impact:"Resets circadian rhythm, primes cortisol curve, hydrates after sleep"},
  {icon:"🌱",step:"Basil seeds (เม็ดแมงลัก) in water 15 min before meal",impact:"Reduces post-meal spike 20-35%. Gel fiber slows carb absorption"},
  {icon:"🥗",step:"Eat fiber + protein FIRST, carbs LAST",impact:"Reduces glucose spike up to 40%. Order matters more than amount"},
  {icon:"🌿",step:"Berberine 600mg with first bites of food",impact:"Works like metformin. Take WITH food, not on empty stomach"},
  {icon:"🐟",step:"Fish oil with meals (total 3-4g/day)",impact:"Directly lowers triglycerides 25-50%. Most impactful supplement for trig"},
  {icon:"🚶",step:"Walk 10-15 min after each meal",impact:"Drops post-meal glucose 20-40 pts. Even slow walking counts"},
  {icon:"🏋️",step:"Weight training 2x/week (any resistance)",impact:"Biggest unused lever. Muscles absorb glucose for 24-48hr after"},
  {icon:"🚫",step:"Zero sweet drinks",impact:"#1 triglyceride driver. Each ชาเย็น = +30-50 trig points"},
  {icon:"⏰",step:"IF 14:10 window (eat within 10 hrs)",impact:"Gives liver time to process fat overnight. Lowers fasting glucose"},
  {icon:"🥜",step:"Brazil nuts x3 with last meal (selenium)",impact:"Supports thyroid function and immune regulation"},
  {icon:"💧",step:"Water 2L+ throughout the day",impact:"Flushes toxins, prevents false hunger, helps kidneys process"},
  {icon:"💊",step:"Bedtime: Magnesium 200-400mg + D3 5000IU/K2 120mcg",impact:"Mg improves sleep + lowers fasting glucose 5-15. D3 for insulin receptors"},
  {icon:"😴",step:"Sleep 7+ hours",impact:"Poor sleep = glucose +15-30 next morning. Non-negotiable"},
];

const hungerToolkit = {
  between: {
    title: "Between meals (7:00-17:00)",
    safe: ["Water (plain or sparkling)","Green tea, herbal tea","Almond milk unsweetened (max 360ml/day)","A few plain almonds or walnuts (10-15 pieces)","Raw cacao + almond milk + stevia (rich in magnesium, kills sugar cravings)","Cucumber slices","Hard-boiled egg","A small handful of pumpkin seeds"],
  },
  after: {
    title: "After eating window (after 17:00)",
    safe: ["Water (plain or sparkling)","Herbal tea (ginger, chrysanthemum)","Green tea","Bone broth (warm, salty, filling)","Salt + water (electrolytes)","Sparkling water with lemon"],
  },
  tips: [
    { q:"Is it real hunger or emotional?", a:"Real hunger builds gradually, emotional hunger comes suddenly. If sudden: drink water, wait 15 min. If still hungry after 15 min, it's real.", icon:"🧠" },
    { q:"Not enough protein?", a:"If hungry 1-2 hrs after eating, likely not enough protein. Aim 30-40g per meal (4 eggs, 120g chicken, 150g fish). Protein keeps you full 4-6 hrs.", icon:"🥩" },
    { q:"Sugar or carb craving?", a:"Often a sign of magnesium deficiency, poor sleep, or blood sugar crash. Take magnesium, drink water, or eat a few almonds. Dark cacao also helps.", icon:"🍫" },
    { q:"Hungry at night?", a:"Usually habit, not real hunger. Brush teeth early, drink warm herbal tea. If persistent, you may not be eating enough protein or fat during the day.", icon:"🌙" },
    { q:"Stressed or tired?", a:"Cortisol makes you crave sugar. Try 5 min deep breathing, short walk, or call someone. Stress-eating raises glucose more than normal eating.", icon:"😮‍💨" },
    { q:"Dehydrated?", a:"Thirst is often mistaken for hunger. Drink a full glass of water and wait 10 min. 80% of the time the hunger goes away.", icon:"💧" },
  ],
};

const extraActs = [
  { task:"Weight training 2x/week", icon:"💪", p:"HIGHEST", impact:"Builds muscle = more glucose disposal. Squats, lunges, push-ups" },
  { task:"Morning sunlight 10-15 min", icon:"☀️", p:"HIGH", impact:"Resets circadian rhythm, better insulin sensitivity + sleep" },
  { task:"Long walk 30-45 min", icon:"🚶", p:"HIGH", impact:"Burns fat directly. Best on rest days" },
  { task:"Basil seeds (เม็ดแมงลัก) in water before meals, wait 15 min", icon:"🌾", p:"HIGH", impact:"Gel barrier slows sugar absorption 30-40%" },
  { task:"Sauna / steam", icon:"♨️", p:"MED", impact:"Improves circulation, reduces inflammation" },
  { task:"Deep breathing 5 min", icon:"🧘", p:"MED", impact:"Parasympathetic activation lowers cortisol and glucose" },
  { task:"Desk movement: heel raises, squats", icon:"🦶", p:"MED", impact:"20 heel raises = calves pump glucose out of blood" },
  { task:"ACV (1 tsp in water) before meals", icon:"🍎", p:"MED", impact:"Reduces spike 20-30%. Optional. Start when ready" },
  { task:"Cold shower finish 30-60s", icon:"🧊", p:"MED", impact:"Activates brown fat, improves insulin sensitivity" },
  { task:"Cacao drink (unsweetened)", icon:"🍫", p:"MED", impact:"Satisfies sweet craving. Rich in magnesium" },
  { task:"Acupressure: ST36, SP6, LIV3", icon:"📍", p:"MED", impact:"Stimulates digestive and metabolic points" },
  { task:"Hijama (end of month 2)", icon:"🩸", p:"MED", impact:"Schedule after trig drops below 300" },
];
const prioColors = { HIGHEST:"#15803d", HIGH:"#16a34a", MED:"#65a30d", LOW:"#ca8a04", OPT:"#9ca3af", SCHED:"#9ca3af" };

const activityActivities = [
  {name:"Weight training",emoji:"🏋️",pts:"-30-60 pts",note:"Muscles become glucose sponges for 24-48hr"},
  {name:"HIIT / circuits",emoji:"⚡",pts:"-40-60 pts",note:"15 min = hours of benefit"},
  {name:"Stairs climbing",emoji:"🪜",pts:"-25-40 pts",note:"Free, available everywhere"},
  {name:"Long walk 30+ min",emoji:"🚶",pts:"-30-50 pts",note:"The #1 tool. CGM will prove it"},
  {name:"Swimming",emoji:"🏊",pts:"-25-40 pts",note:"Low joint stress, full body"},
  {name:"Bike / cycle",emoji:"🚴",pts:"-25-40 pts",note:"Sustained cardio, indoor or outdoor"},
  {name:"Dancing",emoji:"💃",pts:"-20-35 pts",note:"Fun, social, burns without feeling like exercise"},
  {name:"Walk 10-15 min",emoji:"👟",pts:"-20-40 pts",note:"Best ROI. Do after every meal"},
  {name:"Heel raises",emoji:"🦶",pts:"-10-15 pts",note:"At desk, activates calf muscles"},
  {name:"Housework",emoji:"🧹",pts:"-15-25 pts",note:"Mopping, sweeping, cleaning all count"},
  {name:"Stretching / yoga",emoji:"🧘",pts:"-5-10 pts",note:"Flexibility + stress reduction"},
];
const activityRecovery = [
  {name:"Infrared sauna",emoji:"🧖",pts:"-10-20 pts",benefit:"Improves insulin sensitivity, detox, reduces inflammation"},
  {name:"Deep tissue massage",emoji:"💆",pts:"-5-10 pts",benefit:"Lowers cortisol 30%, improves circulation, reduces muscle tension"},
  {name:"Cold shower (30s)",emoji:"🧊",pts:"-10-15 pts",benefit:"Activates brown fat, boosts metabolism, builds mental resilience"},
  {name:"Legs up the wall",emoji:"🦵",pts:"Recovery",benefit:"Reduces swelling, calms nervous system, improves sleep quality"},
  {name:"Foam rolling",emoji:"🧽",pts:"Recovery",benefit:"Breaks up fascia, speeds recovery, reduces soreness"},
  {name:"Breathing exercises",emoji:"🌬️",pts:"-5-10 pts",benefit:"4-7-8 breathing lowers cortisol and blood sugar within minutes"},
];

// ═══ 9F CANTEEN MEAL PLAN — Week 9-13 Mar ═══
const canteenWeek = {
  week: "9-13 Mar 2026",
  dailySalad: "Mixed Green Vegetables with Dressing (auto side dish every day)",
  days: [
    { day:"Mon 9", dishes:[
      {name:"Mixed Green Salad สลัดผักรวม",cat:"Salad",score:9,verdict:"GREAT",protein:2,carb:5,fat:8,fiber:3,portion:"Unlimited. Load up. Eat this FIRST.",notes:"Ask for dressing on the side or use olive oil + lime instead of creamy dressing."},
      {name:"Creamy Sweet Corn & Bean Salad สลัดข้าวโพดหวาน",cat:"Salad",score:3,verdict:"SKIP",protein:5,carb:22,fat:12,fiber:3,portion:"Skip or max 2-3 spoonfuls.",notes:"Corn = high starch, creamy dressing = high calorie. The beans are OK but the corn and dressing spike glucose."},
      {name:"Dry Chili Roasted Chicken ไก่คั่วพริกแห้ง",cat:"Main",score:8,verdict:"GREAT",protein:30,carb:5,fat:10,fiber:1,portion:"1-2 pieces. Great protein source.",notes:"High protein, low carb. Spicy = boosts metabolism. Best main choice today."},
      {name:"Stir-Fried Seafood with Sweet Sauce ทะเลผัดซอสหวาน",cat:"Main",score:4,verdict:"CAUTION",protein:20,carb:15,fat:8,fiber:1,portion:"Small portion if chosen. Skip the sauce.",notes:"Seafood is great but SWEET SAUCE = hidden sugar. If eating this, avoid the sauce as much as possible."},
      {name:"Grilled Pork with Teriyaki Sauce หมูปิ้งราดซอสเทริยากิ",cat:"Main",score:5,verdict:"CAUTION",protein:25,carb:12,fat:12,fiber:0,portion:"1-2 pieces. Scrape off excess sauce.",notes:"Teriyaki = sugar + soy sauce. Pork itself is fine. Eat the meat, minimize the sauce."},
      {name:"Thai Sour Curry with Shrimp แกงเทโพกุ้ง",cat:"Soup",score:9,verdict:"GREAT",protein:15,carb:5,fat:4,fiber:2,portion:"1-2 bowls. Excellent choice.",notes:"Sour curry = low sugar. Shrimp = protein. Morning glory = fiber. One of the best things on the menu."},
      {name:"Stir-Fried King Oyster Mushroom with Egg เห็ดออรินจิผัดไข่",cat:"Side",score:9,verdict:"GREAT",protein:10,carb:3,fat:8,fiber:2,portion:"Unlimited. Perfect side.",notes:"Mushroom + egg = protein + fiber, very low carb. Excellent pairing with any main."},
      {name:"Steamed Brown Rice ข้าวกล้อง",cat:"Side",score:6,verdict:"OK",protein:3,carb:25,fat:1,fiber:2,portion:"MAX 1/4 cup (4 tbsp). Eat LAST.",notes:"Better than white rice but still spikes glucose. Small portion only, after protein and veggies."},
      {name:"Steamed Jasmine Rice ข้าวหอมมะลิ",cat:"Side",score:2,verdict:"SKIP",protein:2,carb:35,fat:0,fiber:0,portion:"Skip. Choose brown rice if you need rice.",notes:"White rice = pure glucose spike. Highest GI food on the menu."},
      {name:"Pad Thai Noodles with Egg and Tofu ผัดไทย",cat:"Side",score:3,verdict:"SKIP",protein:10,carb:40,fat:10,fiber:1,portion:"Skip or max 3-4 forkfuls.",notes:"Noodles = refined carbs + tamarind sauce has sugar. High carb, high spike."},
      {name:"Mixed Jam Roll แยมโรลไส้รวม",cat:"Dessert",score:1,verdict:"NO",protein:2,carb:30,fat:8,fiber:0,portion:"Do not eat. Day 1-30 = zero sugar.",notes:"Sponge cake + jam = pure sugar + refined flour. Worst item on the menu for glucose."},
      {name:"Stewed Banana in Coconut Milk กล้วยบวดชี",cat:"Dessert",score:1,verdict:"NO",protein:1,carb:35,fat:8,fiber:1,portion:"Do not eat. Day 1-30 = zero sugar.",notes:"Banana (high GI) + sugar + coconut milk. Triple spike. Avoid completely."},
    ]},
    { day:"Tue 10", dishes:[
      {name:"Mixed Green Salad สลัดผักรวม",cat:"Salad",score:9,verdict:"GREAT",protein:2,carb:5,fat:8,fiber:3,portion:"Unlimited. Eat this FIRST.",notes:"Always start with salad. Dressing on the side."},
      {name:"Stir-Fried Pork with Bell Pepper หมูผัดพริกหวาน",cat:"Main",score:8,verdict:"GREAT",protein:25,carb:6,fat:10,fiber:2,portion:"1-2 servings. Great choice.",notes:"Bell pepper = vitamin C + fiber. Pork = protein. Low sugar stir-fry. Excellent."},
      {name:"Minced Chicken Red Curry with Bamboo Shoot ผัดพริกแกงไก่สับใส่หน่อไม้",cat:"Main",score:8,verdict:"GREAT",protein:22,carb:5,fat:10,fiber:3,portion:"1-2 servings. Top pick today.",notes:"Bamboo shoot = high fiber, very low carb. Red curry paste is fine. Chicken = lean protein. Winner."},
      {name:"Seasoned Scrambled Egg ไข่คั่วทรงเครื่อง",cat:"Main",score:8,verdict:"GREAT",protein:14,carb:4,fat:12,fiber:1,portion:"1 serving. Good protein boost.",notes:"Eggs + tomato + herbs. Low carb, high protein. Great alongside other mains."},
      {name:"Clear Soup with Cabbage and Egg Tofu แกงจืดผักกาดขาวเต้าหู้ไข่",cat:"Soup",score:9,verdict:"GREAT",protein:8,carb:4,fat:3,fiber:2,portion:"1-2 bowls. Excellent choice.",notes:"Light, nutritious, low calorie. Tofu = protein. Cabbage = fiber. Fill up on this."},
      {name:"Blanched Vegetables with Oyster Sauce ผักลวกราดน้ำมันหอย",cat:"Side",score:7,verdict:"GREAT",protein:2,carb:6,fat:3,fiber:3,portion:"Unlimited veggies. Go easy on sauce.",notes:"Veggies are perfect. Oyster sauce has some sugar but small amount used. Mostly good."},
      {name:"Side Vegetables ผักเคียงก๋วยเตี๋ยว",cat:"Side",score:8,verdict:"GREAT",protein:1,carb:3,fat:1,fiber:3,portion:"Unlimited.",notes:"Fresh vegetables. Always yes."},
      {name:"Steamed Jasmine Rice ข้าวหอมมะลิ",cat:"Side",score:2,verdict:"SKIP",protein:2,carb:35,fat:0,fiber:0,portion:"Skip. No brown rice option today.",notes:"White rice = pure glucose spike. With her A1C at 9.4%, best to skip entirely or max 2 tbsp."},
      {name:"Chicken Bitter Melon Noodle Soup ก๋วยเตี๋ยวไก่มะระ",cat:"Side",score:5,verdict:"CAUTION",protein:15,carb:25,fat:4,fiber:2,portion:"Eat the chicken + bitter melon. Leave most noodles.",notes:"Bitter melon = actually lowers glucose (medicinal). Chicken = protein. But noodles = carbs. Pick out the good stuff."},
      {name:"Foi Thong Donut โดนัทฝอยทอง",cat:"Dessert",score:1,verdict:"NO",protein:3,carb:35,fat:12,fiber:0,portion:"Do not eat. Day 1-30 = zero sugar.",notes:"Donut + foi thong = sugar + refined flour + more sugar. Double no."},
      {name:"Sticky Rice with Egg Custard ข้าวเหนียวสังขยา",cat:"Dessert",score:1,verdict:"NO",protein:4,carb:40,fat:6,fiber:0,portion:"Do not eat. Day 1-30 = zero sugar.",notes:"Sticky rice (highest GI) + sweet custard. One of the worst desserts for glucose."},
      {name:"Cut Fruit ผลไม้",cat:"Featured",score:4,verdict:"CAUTION",protein:0,carb:15,fat:0,fiber:2,portion:"Only if guava or berries. Skip mango, watermelon, pineapple.",notes:"Depends on which fruit. Guava = OK. Most Thai fruits = high sugar. Ask what fruit it is first."},
    ]},
  ],
};

const verdictColors = {GREAT:"#16a34a",OK:"#a07830",CAUTION:"#d97706",SKIP:"#b44234",NO:"#991b1b"};


const foodCats = {
  "🥩 Protein": {
    eat:["Eggs, any style, 2-3 per meal","Fatty fish: salmon, ปลาทู, sardines, mackerel","Chicken breast or thigh","Pork tenderloin / lean cuts","Tofu (firm)","Greek yogurt (plain unsweetened)","Shrimp, squid"],
    avoid:["Processed meats: hotdog, ไส้กรอก, ham","Tocino, longganisa, bacon","Fried chicken with batter / KFC","Fish balls, meat balls (processed)"]
  },
  "🥬 Vegetables": {
    eat:["ผักบุ้ง morning glory","Bitter gourd มะระ (lowers glucose)","Spinach, kale, ผักคะน้า","Broccoli, cabbage, cauliflower","Mushrooms (all kinds)","Green papaya soup ต้มจืดมะละกอ","Kimchi / fermented veggies (with meals)","Cucumber, tomato, lettuce"],
    avoid:["Corn (high starch)","Potatoes / taro / มัน (high GI)","Canned vegetables with sugar"]
  },
  "🥑 Healthy Fats": {
    eat:["Olive oil (cooking + salad)","Coconut oil (cooking)","Avocado","Pumpkin seeds เมล็ดฟักทอง (30g max)","Almonds, walnuts (30g max)","Raw cacao / dark chocolate 85%+","Macadamia nuts"],
    avoid:["Soybean oil / canola oil / sunflower oil","Honey-roasted or flavored nuts","Margarine / trans fats","Fried street food in seed oils","Palm oil (excessive)"]
  },
  "🍈 Fruits": {
    eat:["Guava ฝรั่ง (lowest GI fruit)","Berries: strawberry, blueberry, raspberry","Green apple (1-2 per week max)"],
    avoid:["Mango มะม่วง","Longan ลำไย, lychee ลิ้นจี่","Durian ทุเรียน","Pineapple สับปะรด","Fruit juice (= sugar water)","Dried fruits (concentrated sugar)","Banana (high GI)","Grapes (high sugar)"]
  },
  "🍚 Carbs": {
    eat:["Konjac rice ข้าวบุก (zero carb, zero spike, unlimited)","Brown rice (¼ cup max, AFTER protein)","Sweet potato (small, occasional)","Glass noodles (small portion)"],
    avoid:["White rice as main dish","Instant noodles, mama","Bread, crackers, toast","Oat milk (starch water)","Pastries, cakes, ขนม","Sticky rice ข้าวเหนียว","Congee / โจ๊ก (high GI)"]
  },
  "☕ Drinks": {
    eat:["Water (8-10 glasses daily)","Green tea","Ginger tea","Chrysanthemum tea","Almond milk unsweetened","Unsweetened soy milk"],
    avoid:["ชาเย็น, ชานม (milk tea)","น้ำอัดลม soda, Coke, Pepsi","3-in-1 coffee / sweetened coffee","Rice milk","Sweetened almond milk","Fruit juice / น้ำผลไม้","Energy drinks","Alcohol"]
  },
  "🍫 Treats": {
    eat:["Dark chocolate 85%+ (2-3 squares/day)","Cacao drink: unsweetened cacao + hot water + stevia","Dark chocolate 70% (occasional, small piece)"],
    avoid:["Milk chocolate, white chocolate","Candy, ลูกอม","Pastries, cookies, donuts","Ice cream","Sweetened yogurt","น้ำตาลมะพร้าว coconut sugar treats"]
  },
  "🧂 Sweeteners": {
    eat:["Stevia หญ้าหวาน (best, no glucose/insulin spike)","Monk fruit หล่อฮั่นก๊วย (excellent, zero GI, no aftertaste)"],
    avoid:["Erythritol (linked to cardiovascular risk)","Xylitol (raises blood sugar in excess)","Honey, agave, maple syrup","น้ำตาลมะพร้าว coconut sugar","Regular sugar / น้ำตาลทราย","Sucralose / Splenda (gut health concerns)"]
  },
};

const supps = [
  { name:"Berberine", dose:"600mg × 2 w/ meals", trig:"-20–35%", hb:"-0.9–2%", icon:"🌿", p:"HIGHEST" },
  { name:"Fish Oil", dose:"3–4g EPA+DHA split", trig:"-20–50%", hb:"Min", icon:"🐟", p:"HIGHEST" },
  { name:"Magnesium", dose:"200mg+ bedtime", trig:"-5–15%", hb:"-0.3–0.5%", icon:"💎", p:"HIGHEST" },
  { name:"D3 + K2", dose:"2000–5000 IU + 100mcg MK-7 bedtime", trig:"Indirect", hb:"-0.3–0.5%", icon:"☀️", p:"HIGHEST" },
];

const actOpts = ["none","rest","walk","housework","stretch","cardio","weights"];
// Tracker rows matching Google Sheet structure exactly
const trackerRows = [
  {label:"🩸 Fasting Glucose",field:"glucFast",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🍽️ Post-meal Glucose",field:"glucPost",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🌙 Night Glucose",field:"glucNight",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"First meal",field:"m1t",type:"time",ph:"",section:"meals"},
  {label:"Last meal",field:"mLast",type:"time",ph:"",section:"meals"},
  {label:"IF ratio",field:"_ifRatio",type:"computed",section:"meals"},
  {label:"🚶 After meal move",field:"moveAfter",type:"select",ph:"",opts:["x1","x2","x3"],section:"activity"},
  {label:"🏋️ Exercise",field:"act",type:"select",ph:"",opts:["none","rest","walk","housework","stretch","cardio","weights"],section:"activity"},
  {label:"🌿 Berberine",field:"berb",type:"select",ph:"",opts:["0","x1","x2"],section:"supps"},
  {label:"🐟 Fish Oil",field:"fish",type:"select",ph:"",opts:["0","x1","x2","x3"],section:"supps"},
  {label:"💊 Magnesium",field:"mag",type:"select",ph:"",opts:["0","x1","x2","x3"],section:"supps"},
  {label:"☀️ D3 + K2",field:"d3k2",type:"select",ph:"",opts:["0","x1","x2"],section:"supps"},
  {label:"🥗 Fiber first, carb last",field:"fiberFirst",type:"check",section:"habits"},
  {label:"🚫 No sugar",field:"noSweet",type:"check",section:"habits"},
  {label:"💧 Water 2L",field:"water",type:"check",section:"habits"},
  {label:"🦠 Probiotics",field:"probio",type:"check",section:"habits"},
  {label:"🌱 Basil seeds",field:"basil",type:"check",section:"habits"},
  {label:"🥜 Brazil nuts x3",field:"brazil",type:"check",section:"habits"},
  {label:"😴 Sleep (>7h)",field:"sleep",type:"select",ph:"",opts:["<6","<7","7+","8+"],section:"sleep"},
  {label:"📝 Notes",field:"notes",type:"text",ph:"...",section:"notes"},
];
const keyHabitsForScore = ["berb","fish","mag","d3k2","probio","noSweet","fiberFirst","water","moveAfter","act","sleep"];
const bodyMeasRows = ["Waist (cm)","Hips (cm)","Chest (cm)","Upper Arm (cm)","Thigh (cm)","Neck (cm)","Waist-to-Hip Ratio","Body Fat % (est.)"];
const tabDefs = [{icon:"📊",label:"PROGRESS"},{icon:"🩸",label:"LABS"},{icon:"📋",label:"LIFESTYLE"},{icon:"🍽️",label:"FOOD & SUPPS"}];

const t = {
  bg:"#faf8f5", card:"#fffefa", cardBorder:"#e8e0d4",
  accent:"#9b6b3d", accentLight:"#fdf6ed", accentBg:"#faf3ea",
  danger:"#b44234", dangerBg:"#fdf2ef", dangerBorder:"#e8c8c0",
  warn:"#a07830", warnBg:"#fefaf0", warnBorder:"#e8d8b0",
  okBg:"#f2f5ee", okBorder:"#d0d8c4", ok:"#5c7a44",
  text:"#3d3228", textMuted:"#8a7d70", textLight:"#b0a698",
  radius:10, radiusSm:6, font:"'Roboto', sans-serif", sidebarBg:"#f3efe8",
};
const stC = { critical:{bg:t.dangerBg,bd:t.dangerBorder,tx:t.danger}, warning:{bg:t.warnBg,bd:t.warnBorder,tx:t.warn}, ok:{bg:t.okBg,bd:t.okBorder,tx:t.ok} };
const sc="#5c7a44";


export default function GoldenEra() {
  const [tab, setTab] = useState(0);
  const [sheetStatus, setSheetStatus] = useState("idle"); // idle | loading | synced | error
  const [expandedSupp, setExpandedSupp] = useState(null);
  const [joyOpen, setJoyOpen] = useState(false);
  const [scoreInfoOpen, setScoreInfoOpen] = useState(false);
  // scenario removed - using real data
  const trackerCleared = React.useRef(false);
  const bodyCleared = React.useRef(false);
  const [labChart, setLabChart] = useState("hb");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noteTab, setNoteTab] = useState("10 Mar (Day 9)");
  const [insightWeek, setInsightWeek] = useState(null); // null = auto-select latest
  const [labMeanTab, setLabMeanTab] = useState(null); // null = auto-select latest (26 Feb)
  const [expandedLab, setExpandedLab] = useState(null); // accordion for lab meanings
  
  const seedBodyMeas={};
const [bodyMeas, setBodyMeas] = useState(()=>{try{if(localStorage.getItem("ge_bodyMeas_cleared")==="1")return {};const s=localStorage.getItem("ge_bodyMeas");if(s){const parsed=JSON.parse(s);return {...seedBodyMeas,...parsed};}return {...seedBodyMeas};}catch{return {...seedBodyMeas};}});

  const [weekStart, setWeekStart] = useState(()=>{const d=new Date();const dy=d.getDay();const df=d.getDate()-dy+(dy===0?-6:1);return new Date(d.setDate(df)).toISOString().split("T")[0];});
  const getWD=(s)=>{const r=[];for(let i=0;i<7;i++){const d=new Date(s);d.setDate(d.getDate()+i);r.push(d.toISOString().split("T")[0]);}return r;};
  const weekDates=getWD(weekStart);
  const dn=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const shiftW=(dir)=>{const d=new Date(weekStart);d.setDate(d.getDate()+dir*7);setWeekStart(d.toISOString().split("T")[0]);};
  const emptyDay={glucFast:"",glucPost:"",m1t:"",m1f:"",m2t:"",m2f:"",m3t:"",m3f:"",act:""};
  const seedData={};
const [weekData,setWeekData]=useState(()=>{try{if(localStorage.getItem("ge_weekData_cleared")==="1")return {};const s=localStorage.getItem("ge_weekData");if(s){const parsed=JSON.parse(s);return {...seedData,...parsed};}return {...seedData};}catch{return {...seedData};}});
  const upWD=(date,f,v)=>setWeekData(p=>{
    trackerCleared.current=false;
    try{localStorage.removeItem("ge_weekData_cleared");}catch{};
    const updated={...p,[date]:{...(p[date]||{...emptyDay}),[f]:v}};
    // Queue save to Sheet
    queueSave(date, updated[date], "tracker");
    return updated;
  });
  const [habitData,setHabitData]=useState(()=>{try{const s=localStorage.getItem("ge_habitData");return s?JSON.parse(s):{};}catch{return {};}});
  const toggleH=(item,d)=>{const k=`${item}-${d}`;setHabitData(p=>({...p,[k]:!p[k]}));};
  const isH=(item,d)=>!!habitData[`${item}-${d}`];
  // Load from Google Sheet on mount
  React.useEffect(()=>{
    setSheetStatus("loading");
    fetch(SHEET_API+"?action=load")
      .then(r=>r.json())
      .then(d=>{
        console.log("Sheet data:", JSON.stringify(d));
        if(d.tracker&&Object.keys(d.tracker).length>0&&!trackerCleared.current){
          // Sheet wins over localStorage for tracker data
          setWeekData(p=>{
            const merged={...seedData,...p,...d.tracker};
            try{localStorage.setItem("ge_weekData",JSON.stringify(merged));}catch{}
            return merged;
          });
        }
        if(d.body&&Object.keys(d.body).length>0&&!bodyCleared.current){
          setBodyMeas(p=>{
            const merged={...seedBodyMeas,...p,...d.body};
            try{localStorage.setItem("ge_bodyMeas",JSON.stringify(merged));}catch{}
            return merged;
          });
        }
        setSheetStatus("synced");
      })
      .catch(err=>{console.log("Sheet load error:",err);setSheetStatus("error");});
  },[]);
  React.useEffect(()=>{try{localStorage.setItem("ge_weekData",JSON.stringify(weekData));}catch{}},[weekData]);
  React.useEffect(()=>{try{localStorage.setItem("ge_habitData",JSON.stringify(habitData));}catch{}},[habitData]);

  // Impact-weighted habit score (out of 100/day, skip empty days)
  // Meal window auto-calc replaces IF 14:10 checkbox
  // Impact-weighted habit score: 100 base + bonuses
  // Bonuses: weights +10, cardio/swim +5, meal≤8h +5, dance +4, meal≤9h +2, probiotics +2, brazil +2, basil +1
  const getDayScore=(wd)=>{
    if(!wd)return null;
    const hasData=wd.glucFast||wd.berb||wd.fish||wd.act||wd.moveAfter||wd.noSweet||wd.fiberFirst||wd.water||wd.sleep||wd.mag||wd.d3k2||wd.m1t||wd.mLast;
    if(!hasData)return null;
    let base=0,bonus=0;
    // No sugar (18)
    if(wd.noSweet)base+=18;
    // Berberine (15): x1=7, x2=15
    if(wd.berb==="x2")base+=15;else if(wd.berb==="x1")base+=7;
    // Sleep (14): 7+=14, <7=7, <6=0
    if(wd.sleep==="7+"||wd.sleep==="8+")base+=14;else if(wd.sleep==="<7")base+=7;
    // Fish Oil (10): x1=3, x2=6, x3=10
    if(wd.fish==="x3")base+=10;else if(wd.fish==="x2")base+=6;else if(wd.fish==="x1")base+=3;
    // Exercise (5 base): any non-none activity = 5. Bonus: weights +10, cardio +5
    if(wd.act&&wd.act!=="none"&&wd.act!=="0"){
      base+=5;
      if(wd.act==="weights")bonus+=10;
      else if(wd.act==="cardio")bonus+=5;
    }
    // After meal move (8): x1=3, x2=6, x3=8
    if(wd.moveAfter==="x3")base+=8;else if(wd.moveAfter==="x2")base+=6;else if(wd.moveAfter==="x1")base+=3;
    // Meal window (8 base): ≤10h=8, ≤11h=5, >11h=0. Bonus: ≤8h +5, ≤9h +2
    if(wd.m1t&&wd.mLast){
      const [h1,mn1]=(wd.m1t||"").split(":").map(Number);
      const [h2,mn2]=(wd.mLast||"").split(":").map(Number);
      if(!isNaN(h1)&&!isNaN(h2)){
        const mins=(h2*60+(mn2||0))-(h1*60+(mn1||0));
        if(mins>0&&mins<=480){base+=8;bonus+=5;}
        else if(mins<=540){base+=8;bonus+=2;}
        else if(mins<=600)base+=8;
        else if(mins<=660)base+=5;
      }
    }
    // Fiber first (7)
    if(wd.fiberFirst)base+=7;
    // Water 2L (5)
    if(wd.water)base+=5;
    // Magnesium (5)
    if(wd.mag&&wd.mag!=="0")base+=5;
    // D3+K2 (5)
    if(wd.d3k2&&wd.d3k2!=="0")base+=5;
    // Probiotics (+2 bonus)
    if(wd.probio)bonus+=2;
    // Brazil nuts (+2 bonus)
    if(wd.brazil)bonus+=2;
    // Basil seeds (+2 bonus)
    if(wd.basil)bonus+=2;
    return{base,bonus};
  };
  const getTrackerScore=()=>{
    let totalBase=0,totalBonus=0,trackedDays=0,glucDays=0;
    weekDates.forEach(d=>{
      const wd=weekData[d]||{};
      const ds=getDayScore(wd);
      if(ds!==null){totalBase+=ds.base;totalBonus+=ds.bonus;trackedDays++;}
      if(wd.glucFast)glucDays++;
    });
    const avgBase=trackedDays>0?Math.round(totalBase/trackedDays):0;
    const avgBonus=trackedDays>0?Math.round(totalBonus/trackedDays):0;
    return{score:avgBase,bonus:avgBonus,total:avgBase+avgBonus,trackedDays,gluc:glucDays};
  };
  const ts=getTrackerScore();
  const getTP=(marker)=>{const s=ts.score;if(s===0)return"—";const lk={"HbA1C":[8.4,6],"Fasting Glucose":[185,92],"Triglycerides":[485,135],"GGT":[125,32],"SGPT (ALT)":[40,22],"SGOT (AST)":[30,20],"Cholesterol":[215,187],"Uric Acid":[6.8,5.2],"HDL-C":[45,55],"LDL-C":[110,100],"Creatinine":[.52,.52],"eGFR":[130,128],"Weight":[70,62],"BMI":[25.1,21.9]};const[w,b]=lk[marker]||[0,0];if(w===b)return String(w);const p=w+((b-w)*s/100);return marker==="HbA1C"?`~${p.toFixed(1)}%`:marker==="Creatinine"?p.toFixed(2):`~${Math.round(p)}`;};

  const getInsights=()=>{const tips=[];let berb=0,move=0,sweet=0,sleep=0,fiber=0,mag=0,water=0;weekDates.forEach(d=>{const wd=weekData[d]||{};if(wd.berb&&wd.berb!=="0")berb++;if(wd.moveAfter||wd.act)move++;if(wd.noSweet)sweet++;if(wd.sleep==="7+"||wd.sleep==="8+")sleep++;if(wd.fiberFirst)fiber++;if(wd.mag&&wd.mag!=="0")mag++;if(wd.water)water++;});if(ts.score>0)tips.push({icon:"📊",title:`Score: ${ts.score}/100${ts.bonus?" (+"+ts.bonus+")":""}`,text:`Avg ${ts.score} pts across ${ts.trackedDays} days. ${ts.score>=80?"Full Send pace.":ts.score>=50?"Solid effort.":"Needs more consistency."}`});if(berb>0&&berb<5)tips.push({icon:"🌿",title:"Berberine",text:`${berb}/7 days. Aim for daily.`});if(berb>=5)tips.push({icon:"🌿",title:"Berberine strong",text:`${berb}/7 — excellent.`});if(move<5&&move>0)tips.push({icon:"🚶",title:"Move more",text:`${move}/7 days active. Even 10 min walks count.`});if(sweet>=5)tips.push({icon:"🚫",title:"Sugar-free",text:`${sweet}/7 days — biggest trig driver.`});if(sweet<5&&sweet>0)tips.push({icon:"⚠️",title:"Drinks",text:`${sweet}/7 sugar-free. Each ชาเย็น = +30-50 trig.`});if(sleep<5&&sleep>0)tips.push({icon:"😴",title:"Sleep",text:`${sleep}/7 nights 7+hrs. Poor sleep → glucose +15-30.`});if(mag===0)tips.push({icon:"💊",title:"Magnesium missing",text:"Start tonight. Helps sleep + lowers fasting glucose 5-15 pts."});if(tips.length===0){tips.push({icon:"📊",title:"Start tracking",text:"Fill in the table above to get personalized insights."});tips.push({icon:"💡",title:"Priorities",text:"Zero sweet drinks, berberine, movement, sleep 7+."});tips.push({icon:"🎯",title:"Glucose",text:"Track fasting glucose daily — best predictor of A1C."});}return tips;};

  const Pill=({active,children,onClick,color})=>(<button onClick={onClick} style={{padding:"5px 12px",borderRadius:t.radius,fontSize:12,border:`1px solid ${active?(color||t.accent):t.cardBorder}`,cursor:"pointer",background:active?(color||t.accent):t.card,color:active?"#fff":t.textMuted,fontWeight:active?700:500,fontFamily:t.font}}>{children}</button>);
  const Card=({children,style:s={}})=>(<div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:t.radius,padding:"14px 16px",marginBottom:10,...s}}>{children}</div>);
  const inp={padding:"6px 8px",borderRadius:8,border:`1px solid ${t.cardBorder}`,fontSize:12,fontFamily:t.font,boxSizing:"border-box",color:t.text,background:t.card,width:"100%"};

  const chD=chartData.strict;
  const cSets={hb:{data:chD.hb,label:"HbA1C",ref:5.7,refL:"<5.7%",dom:[4,10]},trig:{data:chD.trig,label:"Trig",ref:150,refL:"<150",dom:[0,750]},wt:{data:chD.wt,label:"Weight",ref:60,refL:"60kg",dom:[55,75]},ggt:{data:chD.ggt,label:"GGT",ref:39,refL:"<39",dom:[0,200]},chol:{data:chD.chol,label:"Chol",ref:200,refL:"<200",dom:[150,240]},gluc:{data:chD.gluc,label:"Glucose",ref:99,refL:"<99",dom:[50,230]},bmi:{data:chD.bmi,label:"BMI",ref:23,refL:"<23",dom:[18,28]}};
  const ch=cSets[labChart];
  

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:t.font,color:t.text,display:"flex"}}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />

      {/* SIDEBAR — responsive: top bar on mobile, side on desktop */}
      <div style={{width:sidebarOpen?180:48,minHeight:"100vh",background:t.sidebarBg,borderRight:`1px solid ${t.cardBorder}`,padding:sidebarOpen?"16px 12px":"16px 4px",display:"flex",flexDirection:"column",flexShrink:0,transition:"width 0.2s",overflow:"hidden"}}>
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"none",border:"none",color:t.textLight,fontSize:14,cursor:"pointer",alignSelf:sidebarOpen?"flex-end":"center",marginBottom:8}}>{sidebarOpen?"◁":"▷"}</button>
        {sidebarOpen&&<>
          <div style={{marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{fontSize:14,fontWeight:700,color:t.text,lineHeight:1.2}}>Golden Era</div>
              {sheetStatus==="synced"&&<span style={{fontSize:8,padding:"2px 5px",borderRadius:4,background:"#16a34a18",color:"#16a34a"}}>☁️</span>}
              {sheetStatus==="loading"&&<span style={{fontSize:8,padding:"2px 5px",borderRadius:4,background:"#d4850f18",color:"#d4850f"}}>⏳</span>}
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
            {tabDefs.map((td,i)=>(<button key={td.label} onClick={()=>setTab(i)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",borderRadius:t.radiusSm,border:"none",background:tab===i?t.accent:"transparent",color:tab===i?"#fff":t.textMuted,fontSize:12,fontWeight:tab===i?700:400,cursor:"pointer",fontFamily:t.font,textAlign:"left",letterSpacing:tab===i?1:0.5}}><span style={{fontSize:14}}>{td.icon}</span><span>{td.label}</span></button>))}
          </div>
        </>}
        {!sidebarOpen&&<div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>{tabDefs.map((td,i)=>(<button key={td.label} onClick={()=>setTab(i)} style={{width:34,height:34,borderRadius:t.radiusSm,border:"none",background:tab===i?t.accent:"transparent",color:tab===i?"#fff":t.textMuted,fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{td.icon}</button>))}</div>}
      </div>

      {/* CONTENT */}
      <div style={{flex:1,padding:"24px 28px",overflowY:"auto"}}>

        {/* ══ LABS ══ */}
        {tab===1&&(<div>
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Lab Results & Prediction</h2>
          <p style={{color:t.textMuted,fontSize:13,marginBottom:14}}>Confirmed data vs predicted trajectory (Full Send protocol)</p>

          <div style={{overflowX:"auto",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card}}>
            <table style={{width:"100%",borderCollapse:"collapse",minWidth:750}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{position:"sticky",left:0,zIndex:3,background:t.sidebarBg,padding:"10px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,borderRight:`1px solid ${t.cardBorder}`,fontWeight:600,minWidth:120}}>Marker</th>
                <th style={{position:"sticky",left:120,zIndex:3,background:t.sidebarBg,padding:"10px 8px",textAlign:"center",fontSize:11,color:t.textLight,borderBottom:`1px solid ${t.cardBorder}`,borderRight:`1px solid ${t.cardBorder}`,minWidth:60}}>Normal</th>
                <th style={{position:"sticky",left:180,zIndex:3,background:t.sidebarBg,padding:"10px 10px",textAlign:"center",fontSize:12,borderBottom:`1px solid ${t.cardBorder}`,borderRight:`1px solid ${t.cardBorder}`,fontWeight:700,color:t.text,minWidth:70}}>26 Feb<br/><span style={{fontSize:10,color:t.textLight,fontWeight:400}}>Confirmed</span></th>
                {["Day 30","Day 60","Day 90"].map(d=>(<th key={d} style={{padding:"10px 12px",textAlign:"center",fontSize:12,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:700,color:sc,minWidth:80}}>{d}<br/><span style={{fontSize:10,fontWeight:400,opacity:.7}}>Predicted</span></th>))}
              </tr></thead>
              <tbody>{labMarkers.map((r,ri)=>{const sc2=stC[r.status];const p30=r.s30;const p60=r.s60;const p90=r.s90;const bg=ri%2===0?t.card:t.bg;return(
                <tr key={r.marker} style={{background:bg}}>
                  <td style={{position:"sticky",left:0,zIndex:2,background:bg,padding:"8px 12px",fontSize:13,fontWeight:600,borderRight:`1px solid ${t.cardBorder}`}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:7,height:7,borderRadius:"50%",background:sc2.tx,flexShrink:0}}/>{r.marker}</div></td>
                  <td style={{position:"sticky",left:120,zIndex:2,background:bg,padding:"8px 8px",textAlign:"center",fontSize:11,color:t.textLight,borderRight:`1px solid ${t.cardBorder}`}}>{r.normal}</td>
                  <td style={{position:"sticky",left:180,zIndex:2,background:bg,padding:"8px 10px",textAlign:"center",fontSize:15,fontWeight:800,color:sc2.tx,borderRight:`1px solid ${t.cardBorder}`}}>{r.confirmed}</td>
                  <td style={{padding:"8px 12px",textAlign:"center",fontSize:13,fontWeight:600,color:sc,opacity:.8}}>{p30}</td>
                  <td style={{padding:"8px 12px",textAlign:"center",fontSize:13,fontWeight:600,color:sc,opacity:.9}}>{p60}</td>
                  <td style={{padding:"8px 12px",textAlign:"center",fontSize:14,fontWeight:700,color:sc}}>{p90}</td>
                </tr>);})}</tbody>
            </table>
          </div>

          {/* Charts */}
          <div style={{marginTop:16}}>
            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>{[["hb","HbA1C"],["trig","Trig"],["gluc","Glucose"],["ggt","GGT"],["chol","Chol"],["wt","Weight"]].map(([k,l])=>(<Pill key={k} active={labChart===k} onClick={()=>setLabChart(k)}>{l}</Pill>))}</div>
            <Card style={{padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:13,fontWeight:700,color:sc}}>{ch.label}</span>
                  <div style={{display:"flex",gap:10,fontSize:10}}>
                    <span style={{color:sc}}>● Confirmed</span>
                    <span style={{color:sc,opacity:0.4}}>○ Predicted</span>
                  </div>
                </div>
                {/* Line chart with SVG */}
                {(()=>{
                  const pts=ch.data.filter(p=>p.v!==null);
                  if(pts.length===0)return <div style={{fontSize:12,color:t.textMuted}}>No data yet</div>;
                  const W=400,H=120,PX=50,PY=15;
                  const minV=ch.dom[0],maxV=ch.dom[1],rangeV=maxV-minV;
                  const xStep=(W-PX*2)/(ch.data.length-1);
                  const toY=(v)=>PY+(H-PY*2)*(1-(v-minV)/rangeV);
                  const toX=(i)=>PX+i*xStep;
                  const allPts=ch.data.map((p,i)=>({...p,x:toX(i),y:p.v!==null?toY(p.v):null,i}));
                  const validPts=allPts.filter(p=>p.y!==null);
                  const confirmedPts=validPts.filter(p=>p.confirmed);
                  const predictedPts=validPts.filter(p=>!p.confirmed);
                  const lastConfirmed=confirmedPts[confirmedPts.length-1];
                  const refY=toY(ch.ref);
                  const linePath=validPts.map((p,i)=>`${i===0?"M":"L"}${p.x},${p.y}`).join(" ");
                  return(
                    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:140}}>
                      {/* Reference line */}
                      <line x1={PX} y1={refY} x2={W-PX} y2={refY} stroke={t.ok} strokeDasharray="4,3" strokeWidth={1} opacity={0.6}/>
                      <text x={W-PX+4} y={refY+3} fontSize={8} fill={t.ok}>{ch.refL}</text>
                      {/* Confirmed line (solid) */}
                      {confirmedPts.length>1&&<polyline points={confirmedPts.map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={sc} strokeWidth={2.5}/>}
                      {/* Predicted line (dashed) from last confirmed */}
                      {lastConfirmed&&predictedPts.length>0&&<polyline points={[lastConfirmed,...predictedPts].map(p=>`${p.x},${p.y}`).join(" ")} fill="none" stroke={sc} strokeWidth={1.5} strokeDasharray="5,4" opacity={0.5}/>}
                      {/* Data points */}
                      {validPts.map((p,i)=>(
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r={p.confirmed?5:4} fill={p.confirmed?sc:"#fff"} stroke={sc} strokeWidth={p.confirmed?0:1.5} opacity={p.confirmed?1:0.5}/>
                          <text x={p.x} y={p.y-10} textAnchor="middle" fontSize={9} fontWeight={p.confirmed?700:400} fill={p.confirmed?sc:t.textMuted}>{p.v}{p.confirmed?" ✓":""}</text>
                        </g>
                      ))}
                      {/* X-axis labels */}
                      {ch.data.map((p,i)=>(
                        <text key={i} x={toX(i)} y={H-2} textAnchor="middle" fontSize={8} fill={p.confirmed?sc:t.textMuted} fontWeight={p.confirmed?600:400}>{p.m}</text>
                      ))}
                    </svg>
                  );
                })()}
              </Card>
          </div>

          {/* ══ LAB MEANINGS ══ */}
          <h2 style={{fontSize:20,fontWeight:700,margin:"24px 0 4px"}}>Lab Insights</h2>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:12}}>Tap any marker to see what it means</p>
          {(()=>{
            const labTabs = [
              {key:"baseline",label:"26 Feb",sublabel:"Confirmed",type:"baseline"},
              {key:"d30",label:"Day 30",sublabel:"Predicted",type:"predict",pKey:"s30"},
              {key:"d60",label:"Day 60",sublabel:"Predicted",type:"predict",pKey:"s60"},
              {key:"d90",label:"Day 90",sublabel:"Predicted",type:"predict",pKey:"s90"},
            ];
            const activeLabIdx = labMeanTab !== null ? labMeanTab : 0;
            const activeTab = labTabs[activeLabIdx];

            const labMeanings = {
              "HbA1C":{what:"Average blood sugar over 3 months",why:"9.4% = uncontrolled diabetes. Above 6.5% = diabetic. Below 5.7% = normal.",risk:"Nerve damage, kidney disease, vision loss within 1-2 years if sustained above 8%.",fix:"Berberine, low-carb, walking after meals, sleep 7+"},
              "Fasting Glucose":{what:"Blood sugar after 8+ hours fasting",why:"211 = severely elevated. Normal is 70-99. Pre-diabetic 100-125.",risk:"Damages blood vessels, nerves. Dawn effect makes morning readings higher.",fix:"Berberine before meals, fiber first, zero sweet drinks, IF 14:10"},
              "Triglycerides":{what:"Fat in the blood from food and liver",why:"702 = 4x the upper limit (160). Above 500 = acute pancreatitis risk.",risk:"Pancreatitis (severe stomach pain, ER visit). Also causes fatty liver.",fix:"Fish oil 3-4g/day, zero sweet drinks (#1 driver), walking, low carbs"},
              "GGT":{what:"Liver enzyme, marker for liver damage and inflammation",why:"184 = 4.7x upper limit (39). Signals fatty liver disease (NAFLD).",risk:"Liver inflammation, scarring, cirrhosis if untreated.",fix:"Liver regenerates in 6-8 weeks. Remove sugar, alcohol, seed oils"},
              "SGPT (ALT)":{what:"Liver enzyme, more specific to liver cell damage",why:"50 = slightly above limit (35). Confirms liver stress alongside GGT.",risk:"Mild elevation. Will normalize as fatty liver resolves.",fix:"Same as GGT. ALT drops faster than GGT"},
              "SGOT (AST)":{what:"Enzyme found in liver, heart, and muscles",why:"31 = within normal (<32). Less liver-specific than ALT.",risk:"Currently OK. Monitor alongside ALT.",fix:"No action needed. Will improve with protocol"},
              "Cholesterol":{what:"Total cholesterol, sum of LDL + HDL + VLDL",why:"220 = mildly elevated (target <200). Driven mainly by high trig.",risk:"Moderate. Will drop as triglycerides normalize.",fix:"Fish oil, fiber, walking. Trig reduction = cholesterol reduction"},
              "Uric Acid":{what:"Waste product from breaking down purines",why:"7.2 = above limit (6.1). Linked to metabolic syndrome and gout risk.",risk:"Gout flares (joint pain). Kidney stones at sustained high levels.",fix:"Hydration 2L+, reduce organ meats, limit fructose"},
              "HDL-C":{what:"Good cholesterol, removes fat from arteries",why:"45 = just above minimum (44). Higher is better. Target 50+.",risk:"Low HDL = higher cardiovascular risk. Currently borderline.",fix:"Exercise, olive oil, nuts, weight training"},
              "LDL-C":{what:"Bad cholesterol, deposits fat in arteries",why:"109 = within normal (<130). Not a concern right now.",risk:"OK. Monitor if cholesterol stays elevated after trig drops.",fix:"No action needed. Focus on trig and glucose first"},
              "Creatinine":{what:"Waste product filtered by kidneys",why:"0.52 = perfect (0.5-0.9). Kidneys are healthy.",risk:"None. Kidneys working great.",fix:"Stay hydrated"},
              "eGFR":{what:"Estimated kidney filtration rate",why:"130 = excellent (>90 is normal). Kidneys filtering well.",risk:"None. Strong kidney function.",fix:"Maintain hydration"},
              "Weight":{what:"Body weight, tracks overall metabolic health",why:"73.6 kg = BMI 26.4 (overweight). Target 60-63 kg (BMI <23).",risk:"Visceral fat drives insulin resistance, fatty liver, and high trig.",fix:"Low-carb + walking + IF 14:10. 1-2 kg/month loss"},
              "BMI":{what:"Body Mass Index = weight / height². Asian cutoff for overweight is 23, not 25",why:"26.4 = overweight by Asian standards. Correlates with insulin resistance and fatty liver.",risk:"Every 1 point drop in BMI improves insulin sensitivity measurably.",fix:"Target 21-22. Will track down with weight loss from protocol"},
            };

            const tabSummaries = {
              baseline: "Triglycerides at 702 (4x the safe limit) and HbA1C 9.4% are the biggest concerns. Liver enzymes are elevated from fatty liver. The good news: kidneys and LDL are healthy, and every one of these markers can improve significantly with diet and lifestyle changes alone.",
              d30: "Trig predicted to drop to 350-400, still high but pancreatitis risk clearing. Glucose should hit 140-160 range (down from 211). Liver GGT starting recovery.",
              d60: "Trig should approach 200, near safe zone. Glucose 110-125 entering pre-diabetic range (out of diabetic). GGT 50-70 means liver healing well. HbA1C 7.0-7.5%, real progress but still diabetic.",
              d90: "Target: Trig 100-150 (safe), glucose 85-100 (normal), GGT 25-40 (normal), HbA1C 5.8-6.3% (near-normal). Full metabolic reset. Liver clean. Weight 60-63 kg.",
            };

            return(<div>
              {/* Tabs */}
              <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:14}}>
                {labTabs.map((lt,li)=>{
                  const isActive = li===activeLabIdx;
                  return(<button key={lt.key} onClick={()=>setLabMeanTab(li)} style={{padding:"7px 14px",borderRadius:t.radius,fontSize:12,border:`1px solid ${isActive?t.accent:t.cardBorder}`,cursor:"pointer",background:isActive?t.accent:t.card,color:isActive?"#fff":t.textMuted,fontWeight:isActive?700:500,fontFamily:t.font,display:"flex",flexDirection:"column",alignItems:"center",gap:1,minWidth:70}}>
                    <span>{lt.label}</span>
                    <span style={{fontSize:9,opacity:0.8,fontWeight:400}}>{lt.sublabel}</span>
                  </button>);
                })}
              </div>

              {/* Summary strip */}
              <div style={{padding:"12px 16px",background:t.bg,borderRadius:t.radius,marginBottom:12,fontSize:13,color:t.text,lineHeight:1.7}}>
                {tabSummaries[activeTab.key]}
              </div>

              {/* Accordion list */}
              <div style={{border:`0.5px solid ${t.cardBorder}`,borderRadius:t.radius,overflow:"hidden"}}>
                {labMarkers.map((r,ri)=>{
                  const meaning = labMeanings[r.marker];
                  if(!meaning) return null;
                  const sc2=stC[r.status];
                  const isOpen = expandedLab===ri;

                  // Values per tab
                  let leftLabel,leftVal,rightLabel,rightVal;
                  if(activeTab.type==="baseline"){
                    leftLabel="Confirmed"; leftVal=r.confirmed;
                    rightLabel="Normal"; rightVal=r.normal;
                  } else {
                    leftLabel="Predicted"; leftVal=r[activeTab.pKey]||"—";
                    rightLabel="Confirmed"; rightVal=null;
                  }

                  return(<div key={r.marker} style={{borderBottom:ri<labMarkers.length-1?`0.5px solid ${t.cardBorder}`:"none",background:isOpen?t.bg:t.card}}>
                    {/* Row header — always visible */}
                    <div onClick={()=>setExpandedLab(isOpen?null:ri)} style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",cursor:"pointer"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,flex:1}}>
                        <div style={{width:7,height:7,borderRadius:"50%",background:sc2.tx,flexShrink:0}}/>
                        <span style={{fontSize:13,fontWeight:600}}>{r.marker}</span>
                        <span style={{fontSize:10,padding:"2px 7px",borderRadius:t.radiusSm,background:sc2.bg,color:sc2.tx,fontWeight:600}}>{r.status}</span>
                      </div>
                      <div style={{display:"flex",gap:14}}>
                        <div style={{textAlign:"center"}}><div style={{fontSize:9,color:t.textLight,textTransform:"uppercase",letterSpacing:.5}}>{leftLabel}</div><div style={{fontSize:16,fontWeight:700,color:activeTab.type==="baseline"?sc2.tx:t.accent}}>{leftVal}</div></div>
                        <div style={{textAlign:"center"}}><div style={{fontSize:9,color:t.textLight,textTransform:"uppercase",letterSpacing:.5}}>{rightLabel}</div><div style={{fontSize:rightVal?14:12,fontWeight:rightVal?700:400,color:rightVal?t.ok:t.textLight,fontStyle:rightVal?"normal":"italic"}}>{rightVal||"Not yet"}</div></div>
                      </div>
                      <span style={{fontSize:11,color:t.textLight,marginLeft:4}}>{isOpen?"▲":"▼"}</span>
                    </div>
                    {/* Expanded meaning — stacked lines */}
                    {isOpen&&<div style={{padding:"0 14px 10px 29px",fontSize:12,lineHeight:1.7,color:t.text}}>
                      <div>{meaning.what}</div>
                      <div>{meaning.why}</div>
                      <div style={{color:t.danger}}>{meaning.risk}</div>
                      <div style={{color:t.ok}}>→ {meaning.fix}</div>
                    </div>}
                  </div>);
                })}
              </div>
            </div>);
          })()}


        </div>)}

        {/* ══ LIFESTYLE ══ */}
        {tab===2&&(<div>
          <div style={{marginBottom:12}}>
            <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Daily Habits</h2>
            <p style={{color:t.textMuted,fontSize:13,margin:0}}>3 meals in 10-hr window (7:00-17:00) · Fiber first · Move after · Sleep 7+</p>
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:24}}>
            {dailyHabits.map((h,i)=>(
              <div key={i} style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start"}}>
                <span style={{fontSize:18,flexShrink:0,marginTop:1}}>{h.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:t.text,fontWeight:600,lineHeight:1.3}}>{h.step}</div>
                  <div style={{fontSize:11,color:t.textMuted,marginTop:2,fontStyle:"italic"}}>{h.impact}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Hunger Toolkit - single table, two columns */}
          <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 4px"}}>If Hungry</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>What you can have without disrupting fat-burning or spiking insulin</p>
          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:16,overflow:"hidden"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
              {[hungerToolkit.between, hungerToolkit.after].map((col,ci)=>(
                <div key={ci} style={{padding:"12px 14px",borderRight:ci===0?`1px solid ${t.cardBorder}`:"none"}}>
                  <div style={{fontSize:12,fontWeight:700,color:t.accent,marginBottom:8}}>{col.title}</div>
                  {col.safe.map((item,ii)=>(
                    <div key={ii} style={{fontSize:12,color:t.text,padding:"3px 0",display:"flex",gap:6}}>
                      <span style={{color:t.okBorder}}>•</span>{item}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Why am I hungry - single table */}
          <div style={{fontSize:13,fontWeight:700,color:t.text,marginBottom:8}}>Why am I hungry? (check before eating)</div>
          <div style={{border:`1px solid ${t.accent}22`,borderRadius:t.radiusSm,background:t.accentBg,marginBottom:24,overflow:"hidden"}}>
            {hungerToolkit.tips.map((tip,i)=>(
              <div key={i} style={{padding:"10px 14px",display:"flex",gap:10,alignItems:"flex-start",borderBottom:i<hungerToolkit.tips.length-1?`1px solid ${t.accent}15`:"none"}}>
                <span style={{fontSize:18,flexShrink:0}}>{tip.icon}</span>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:700,color:t.accent}}>{tip.q}</div>
                  <div style={{fontSize:12,color:t.text,lineHeight:1.5,marginTop:2}}>{tip.a}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Ideas - 2 columns: Activities | Recovery */}
          <h3 style={{fontSize:16,fontWeight:700,margin:"0 0 10px"}}>Activity Ideas</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Sorted by glucose impact. Recovery is often underestimated.</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {/* Activities */}
            <div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:700,color:t.accent,marginBottom:8}}>🏃 Activities</div>
              {activityActivities.map((a,i)=>(
                <div key={i} style={{padding:"5px 0",borderBottom:i<activityActivities.length-1?`1px solid ${t.cardBorder}33`:"none",display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:14}}>{a.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:12,fontWeight:600}}>{a.name}</span>
                      <span style={{fontSize:10,color:t.ok,fontWeight:700}}>{a.pts}</span>
                    </div>
                    <div style={{fontSize:10,color:t.textMuted}}>{a.note}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Recovery */}
            <div style={{background:t.card,border:`1px solid ${t.accent}22`,borderRadius:t.radiusSm,padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:700,color:t.accent,marginBottom:4}}>🧘 Recovery</div>
              <div style={{fontSize:10,color:t.textMuted,marginBottom:8,fontStyle:"italic"}}>Recovery accelerates results more than people think. It lowers cortisol, improves insulin sensitivity, and helps the body repair.</div>
              {activityRecovery.map((a,i)=>(
                <div key={i} style={{padding:"6px 0",borderBottom:i<activityRecovery.length-1?`1px solid ${t.cardBorder}33`:"none",display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:14}}>{a.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:12,fontWeight:600}}>{a.name}</span>
                      <span style={{fontSize:10,color:t.accent,fontWeight:700}}>{a.pts}</span>
                    </div>
                    <div style={{fontSize:10,color:t.textMuted}}>{a.benefit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>)}

        {/* ══ FOOD & SUPPS ══ */}
        {tab===3&&(<div>
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Food & Supplements</h2>
          <p style={{color:t.textMuted,fontSize:13,marginBottom:14}}>What to eat, what to skip, and the supplement stack</p>

          {/* Nutrition Needs + Portion Guide merged */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 4px"}}>What Your Body Needs</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Updated Day 12: Weight ~71kg, fasting glucose 116, low-carb protocol</p>

          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:12,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Nutrient</th>
                <th style={{padding:"8px 12px",textAlign:"center",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Daily</th>
                <th style={{padding:"8px 12px",textAlign:"center",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Per Meal</th>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Portion Guide</th>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Why</th>
              </tr></thead>
              <tbody>
                {[
                  ["🌾 Fiber","25-35g","8-12g","1 cup broccoli + 1 tbsp basil seeds (เม็ดแมงลัก)","Eat FIRST. Slows sugar absorption, feeds gut bacteria, lowers trig",t.ok],
                  ["🥑 Healthy Fat","70-90g","23-30g","1 tbsp olive oil + 10 almonds, or ½ avocado, or handful macadamia","35-40% of calories. PRIMARY fuel source. Slows digestion, absorbs D3/K2",t.ok],
                  ["🥩 Protein","80-100g","27-33g","4 eggs, or 120g chicken thigh (with skin!), or 150g salmon","35-40% of calories. Preserves muscle, controls hunger. Don't overdo",t.ok],
                  ["🍚 Carbs","40-60g","13-20g","1 cup vegetables, or ¼ small sweet potato, or ½ cup berries","20-25% of calories. Always eat LAST. From veggies, berries only",t.warn],
                  ["💧 Water","2-2.5L","8-10 glasses","","Flushes toxins, prevents false hunger, helps kidneys",t.ok],
                ].map(([n,daily,meal,portion,why,color],i)=>(
                  <tr key={i} style={{background:i%2===0?t.card:t.bg}}>
                    <td style={{padding:"8px 12px",fontSize:13,fontWeight:700}}>{n}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:14,fontWeight:800,color}}>{daily}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:13,color:t.textMuted}}>{meal}</td>
                    <td style={{padding:"8px 12px",fontSize:11,color:t.text,lineHeight:1.4}}>{portion}</td>
                    <td style={{padding:"8px 12px",fontSize:11,color:t.textMuted,lineHeight:1.4}}>{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Supplements — table format */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 4px"}}>Supplements</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Berberine + fish oil WITH meals · Mg + D3/K2 BEDTIME</p>
          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:20,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Supplement</th>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Dose</th>
                <th style={{padding:"8px 12px",textAlign:"center",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Trig</th>
                <th style={{padding:"8px 12px",textAlign:"center",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>A1C</th>
              </tr></thead>
              <tbody>
                {supps.map((s,i)=>(
                  <tr key={s.name} style={{background:i%2===0?t.card:t.bg}}>
                    <td style={{padding:"8px 12px",fontSize:13,fontWeight:700}}>{s.icon} {s.name}</td>
                    <td style={{padding:"8px 12px",fontSize:12,color:t.textMuted}}>{s.dose}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:12,fontWeight:600,color:t.danger}}>{s.trig}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:12,fontWeight:600,color:t.ok}}>{s.hb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Rules — 2 column table */}
          <div style={{fontSize:13,fontWeight:700,color:t.accent,marginBottom:6,marginTop:14}}>📌 Quick Rules</div>
          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:20,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <tbody>
                {[
                  {tip:"🥗 Eating order matters", detail:"Fiber/veggies first, then protein, then fat, carbs LAST. Same food in different order = different spike."},
                  {tip:"🍲 Soup = secret weapon", detail:"ต้มจืด, แกงจืด, bone broth. Fills the stomach, very low calorie, triggers fullness fast."},
                  {tip:"🚫 Added sugar limit", detail:"Day 1-30: 0g · Day 31-60: max 10g (if glucose <100) · Day 61-90: max 15g (if trig <200)", isDanger:true},
                ].map((h,i)=>(
                  <tr key={i} style={{background:i%2===0?t.card:t.bg}}>
                    <td style={{padding:"10px 14px",fontSize:13,fontWeight:700,color:h.isDanger?t.danger:t.text,borderBottom:i<2?`1px solid ${t.cardBorder}`:"none",whiteSpace:"nowrap",verticalAlign:"top"}}>{h.tip}</td>
                    <td style={{padding:"10px 14px",fontSize:12,color:t.textMuted,lineHeight:1.5,borderBottom:i<2?`1px solid ${t.cardBorder}`:"none",verticalAlign:"top"}}>{h.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Carb Guide — 3 columns like fruit */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 4px"}}>🍚 Carb Guide (Glycemic Index)</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Always eat carbs LAST after protein and veggies · Max 25-33g per meal</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE</div>
              {[
                ["Konjac rice บุก","0"],
                ["Shirataki noodle","0"],
                ["Cauliflower rice","5"],
                ["Glass noodle วุ้นเส้น","39"],
                ["Oats ข้าวโอ๊ต","40"],
                ["Sweet potato มันหวาน","44"],
                ["Basmati rice","50"],
                ["Low GI rice","54"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<7?`1px solid ${t.okBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.ok,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {[
                ["Corn ข้าวโพด","52"],
                ["Taro เผือก","53"],
                ["Potato มันฝรั่ง","58"],
                ["Oat milk นมข้าวโอ๊ต","60"],
                ["Rice berry ข้าวไรซ์เบอร์รี่","62"],
                ["Pumpkin ฟักทอง","64"],
                ["Brown rice ข้าวกล้อง","68"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<6?`1px solid ${t.warnBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.warn,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {[
                ["Pastries/croissant","70"],
                ["Instant noodle มาม่า","73"],
                ["White bread ขนมปัง","75"],
                ["Boiled potato (mashed)","78"],
                ["Rice porridge โจ๊ก","83"],
                ["Sticky rice ข้าวเหนียว","87"],
                ["Jasmine rice ข้าวหอมมะลิ","89"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<6?`1px solid ${t.dangerBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.danger,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
          </div>

          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 4px"}}>🍎 Fruit Guide (Glycemic Index)</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Max 1 serving/day during Day 1-30 · Always eat AFTER protein, never alone · Never drink fruit juice</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            {/* SAFE */}
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE (GI &lt; 40)</div>
              {[
                ["Guava ฝรั่ง","12"],
                ["Cherries","22"],
                ["Plum","24"],
                ["Strawberries","25"],
                ["Blueberries","25"],
                ["Grapefruit","25"],
                ["Dried apricot","30"],
                ["Apple","36"],
                ["Pear","38"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<8?`1px solid ${t.okBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.ok,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            {/* MODERATE */}
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT (GI 40-59)</div>
              {[
                ["Peach","42"],
                ["Orange","43"],
                ["Grapes","46"],
                ["Dragon fruit แก้วมังกร","48"],
                ["Longan ลำไย","48"],
                ["Kiwi","50"],
                ["Mango มะม่วง","51"],
                ["Banana กล้วย","51"],
                ["Papaya มะละกอ","56"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<8?`1px solid ${t.warnBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.warn,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            {/* AVOID */}
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID (GI 60+)</div>
              {[
                ["Durian ทุเรียน","44*"],
                ["Lychee ลิ้นจี่","57"],
                ["Rambutan เงาะ","59"],
                ["Pineapple สับปะรด","66"],
                ["Ripe banana","70"],
                ["Watermelon แตงโม","72"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<5?`1px solid ${t.dangerBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.danger,fontWeight:700}}>GI {gi}</span>
              </div>))}
              <div style={{fontSize:10,color:t.danger,marginTop:6,fontStyle:"italic"}}>*Durian GI looks OK but GL 18 = sugar bomb. Lychee/longan/rambutan easy to overeat (10 pcs = 20g sugar)</div>
            </div>
          </div>


          {/* Food Guide — 3-column format per category */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 8px"}}>Food Guide</h3>
          {/* Protein */}
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:6}}>🥩 Protein</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE</div>
              {["Eggs (any style, 2-3/meal)","Salmon, ปลาทู, sardines","Chicken breast/thigh","Pork tenderloin","Firm tofu","Greek yogurt (plain)","Shrimp, squid"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<6?`1px solid ${t.okBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {["Fried chicken (no batter)","Pork belly (small)","Sausage (real, unprocessed)","Duck","Beef (lean cuts)"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<4?`1px solid ${t.warnBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {["Hotdog, ไส้กรอก","Processed ham, bacon","KFC / battered fried","Fish balls, meat balls","Tocino, longganisa","Canned meat"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<5?`1px solid ${t.dangerBorder}33`:"none"}}>{x}</div>))}
            </div>
          </div>

          {/* Vegetables */}
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:6}}>🥬 Vegetables</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE</div>
              {["ผักบุ้ง morning glory","Bitter gourd มะระ","Broccoli, cauliflower","Spinach, kale, ผักคะน้า","Mushrooms (all kinds)","Cucumber, tomato","Cabbage, lettuce","Kimchi / fermented"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<7?`1px solid ${t.okBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {["Carrots (cooked)","Peas","Bell pepper","Beetroot","Onion (caramelized)"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<4?`1px solid ${t.warnBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {["Corn ข้าวโพด (high starch)","Potato / taro / มัน","Canned vegs with sugar"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<2?`1px solid ${t.dangerBorder}33`:"none"}}>{x}</div>))}
            </div>
          </div>

          {/* Healthy Fats */}
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:6}}>🥑 Healthy Fats</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE</div>
              {["Olive oil","Coconut oil","Avocado","Almonds, walnuts (30g)","Pumpkin seeds (30g)","Macadamia nuts","Dark chocolate 85%+"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<6?`1px solid ${t.okBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {["Butter (small amounts)","Cheese (small)","Coconut cream","Dark chocolate 70%"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<3?`1px solid ${t.warnBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {["Soybean / canola oil","Sunflower oil","Margarine / trans fats","Honey-roasted nuts","Fried street food oils","Palm oil (excessive)"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<5?`1px solid ${t.dangerBorder}33`:"none"}}>{x}</div>))}
            </div>
          </div>

          {/* Drinks */}
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:6}}>☕ Drinks</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE</div>
              {["Water (8-10 glasses)","Green tea","Ginger tea","Black coffee","Unsweetened almond milk","Chrysanthemum tea"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<5?`1px solid ${t.okBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {["Unsweetened soy milk","Coconut water (small)","Sparkling water","Decaf coffee"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<3?`1px solid ${t.warnBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {["ชาเย็น milk tea","น้ำอัดลม soda","3-in-1 coffee","Rice milk, oat milk","Fruit juice น้ำผลไม้","Energy drinks","Alcohol"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<6?`1px solid ${t.dangerBorder}33`:"none"}}>{x}</div>))}
            </div>
          </div>

          {/* Treats & Sweeteners */}
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:6}}>🍫 Treats & Sweeteners</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            <div style={{border:`1px solid ${t.okBorder}`,borderRadius:t.radiusSm,background:t.okBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.ok,marginBottom:8,textAlign:"center"}}>✅ SAFE</div>
              {["Dark chocolate 85%+","Stevia หญ้าหวาน","Monk fruit หล่อฮั่นก๊วย","Unsweetened cacao drink","Sugar-free jelly"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<4?`1px solid ${t.okBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {["Dark chocolate 70%","Coconut cream dessert","Plain yogurt + berries"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<2?`1px solid ${t.warnBorder}33`:"none"}}>{x}</div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {["Milk/white chocolate","Candy, ลูกอม","Ice cream, sweetened yogurt","Erythritol (cardio risk)","Honey, agave, maple syrup","น้ำตาล coconut sugar","Regular sugar น้ำตาลทราย","Sucralose / Splenda"].map((x,i)=>(<div key={i} style={{fontSize:11,color:t.text,fontWeight:600,padding:"3px 0",borderBottom:i<7?`1px solid ${t.dangerBorder}33`:"none"}}>{x}</div>))}
            </div>
          </div>

          {/* Joy Without the Spike — collapsible */}
          <div onClick={()=>setJoyOpen(!joyOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 4px",padding:"10px 14px",background:t.card,border:`1px solid ${joyOpen?t.accent+"44":t.cardBorder}`,borderRadius:t.radiusSm}}>
            <div>
              <h3 style={{fontSize:16,fontWeight:700,margin:0}}>Joy Without the Spike</h3>
              <p style={{color:t.textMuted,fontSize:12,margin:"2px 0 0"}}>You don't have to give up delicious. Just swap smarter.</p>
            </div>
            <span style={{fontSize:14,color:t.textMuted}}>{joyOpen?"▼":"▶"}</span>
          </div>

          {joyOpen&&<div>
          <div style={{fontSize:14,fontWeight:700,color:t.accent,marginBottom:8,marginTop:8}}>Sweet Drinks (zero spike)</div>
          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:16,overflow:"hidden"}}>
            {[
              {name:"Cacao Latte", recipe:"1 tbsp raw cacao + 180ml warm almond milk + stevia", note:"Rich in magnesium, kills sugar cravings. Tastes like hot chocolate", icon:"🍫"},
              {name:"Matcha Latte", recipe:"1 tsp matcha + 180ml warm almond milk + stevia", note:"L-theanine calms the mind, antioxidants. Creamy and satisfying", icon:"🍵"},
              {name:"Thai Tea (safe version)", recipe:"Thai tea leaves brewed strong + almond milk + stevia + ice", note:"Same flavor, zero sugar. The tea itself has no sugar", icon:"🧋"},
              {name:"Butterfly Pea Lemon", recipe:"Brewed butterfly pea tea + lemon juice + stevia + ice", note:"Beautiful color change, refreshing, zero calories", icon:"💜"},
              {name:"Ginger Honey (not honey)", recipe:"Fresh ginger slices + hot water + stevia + lemon", note:"Warming, aids digestion, anti-inflammatory", icon:"🫚"},
              {name:"Iced Coconut Cacao", recipe:"1 tbsp cacao + coconut milk (2 tbsp) + water + ice + stevia", note:"Creamy, tropical, satisfying. Coconut fat keeps you full", icon:"🥥"},
            ].map((d,i)=>(
              <div key={i} style={{padding:"10px 14px",borderBottom:i<5?`1px solid ${t.cardBorder}`:"none",background:i%2===0?t.card:t.bg}}>
                <div style={{display:"flex",gap:8,alignItems:"center"}}><span style={{fontSize:16}}>{d.icon}</span><span style={{fontSize:13,fontWeight:700,color:t.text}}>{d.name}</span></div>
                <div style={{fontSize:12,color:t.accent,marginTop:3,marginLeft:24}}>{d.recipe}</div>
                <div style={{fontSize:11,color:t.textMuted,fontStyle:"italic",marginTop:2,marginLeft:24}}>{d.note}</div>
              </div>
            ))}
          </div>



          </div>}

        </div>)}

        {/* ══ MEAL PLAN ══ */}

        {/* ══ PROGRESS ══ */}
        {tab===0&&(<div>
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Habit Tracker</h2>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <button onClick={()=>shiftW(-1)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>◀</button>
            <span style={{fontSize:14,fontWeight:700,color:t.accent}}>{new Date(weekDates[0]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} — {new Date(weekDates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
            <button onClick={()=>shiftW(1)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>▶</button>
          </div>

          {/* Single unified table like the Google Sheet */}
          <div style={{overflowX:"auto",border:`0.5px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:20}}>
            <table style={{borderCollapse:"collapse",width:"100%",minWidth:7*70+130}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{position:"sticky",left:0,background:t.sidebarBg,zIndex:2,padding:"7px 8px",fontSize:11,color:t.textMuted,textAlign:"left",borderBottom:`1px solid ${t.cardBorder}`,borderRight:`0.5px solid ${t.cardBorder}`,minWidth:130}}></th>
                {weekDates.map((d,i)=>(<th key={d} style={{padding:"7px 3px",fontSize:11,color:t.accent,textAlign:"center",borderBottom:`1px solid ${t.cardBorder}`,borderRight:i<6?`0.5px solid ${t.cardBorder}22`:"none",minWidth:62,fontWeight:700}}><div>{dn[i]}</div><div style={{fontWeight:400,color:t.textLight,fontSize:10}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
              </tr></thead>
              <tbody>
                {trackerRows.map((row,ri)=>{
                  const prevSection = ri>0 ? trackerRows[ri-1].section : null;
                  const showDivider = row.section !== prevSection && ri > 0;
                  const wd = (d) => weekData[d]||{};
                  const rowBg = ri%2===0?t.card:t.bg;
                  return(<React.Fragment key={row.field}>
                    {showDivider && <tr><td colSpan={8} style={{height:1.5,background:t.accent+"33",padding:0}}></td></tr>}
                    <tr style={{background:rowBg}}>
                      <td style={{position:"sticky",left:0,background:rowBg,zIndex:1,padding:"5px 8px",fontSize:11,color:t.text,fontWeight:600,borderRight:`0.5px solid ${t.cardBorder}`,borderBottom:`0.5px solid ${t.cardBorder}`,whiteSpace:"nowrap"}}>{row.label}</td>
                      {weekDates.map((d,di)=>{
                        const val = wd(d)[row.field]||"";
                        const cellBorder = {borderBottom:`0.5px solid ${t.cardBorder}`,borderRight:di<6?`0.5px solid ${t.cardBorder}22`:"none"};
                        if(row.type==="computed"){
                          // IF ratio: auto-calc from first/last meal
                          const m1=wd(d).m1t||"";const mL=wd(d).mLast||"";
                          let display="—";let ifColor=t.textMuted;
                          if(m1&&mL){
                            const [h1,mn1]=m1.split(":").map(Number);
                            const [h2,mn2]=mL.split(":").map(Number);
                            if(!isNaN(h1)&&!isNaN(h2)){
                              const eatMins=(h2*60+(mn2||0))-(h1*60+(mn1||0));
                              const eating=Math.round(eatMins/60);
                              const fasting=24-eating;
                              display=`${fasting}:${eating}`;
                              ifColor=fasting>=16?"#2d5016":fasting>=14?t.ok:fasting>=12?"#d4850f":t.danger;
                            }
                          }
                          return(<td key={d} style={{padding:"5px 4px",textAlign:"center",fontSize:11,color:ifColor,...cellBorder}}>{display}</td>);
                        }
                        if(row.type==="check"){
                          const on = !!wd(d)[row.field];
                          return(<td key={d} onClick={()=>upWD(d,row.field,!on)} style={{padding:"3px",textAlign:"center",cursor:"pointer",...cellBorder}}>
                            <div style={{width:26,height:26,borderRadius:"50%",margin:"0 auto",background:on?"#5c7a44":t.sidebarBg,display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.15s"}}><span style={{fontSize:11,color:on?"#fff":t.textLight,fontWeight:on?700:400}}>{on?"✓":"·"}</span></div>
                          </td>);
                        }
                        if(row.type==="chips"){
                          const items=val?val.split(",").map(s=>s.trim()).filter(Boolean):[];
                          const chipColors={weights:"#2d5016",cardio:"#1a6b3c",swimming:"#1a6b3c",dance:"#1a6b3c",walk:"#6b7c5a",yoga:"#6b7c5a",stretch:"#6b7c5a",housework:"#6b7c5a",rest:"#9a8a6e",none:"#a0937d"};
                          return(<td key={d} style={{padding:"3px 2px",textAlign:"center",...cellBorder}}>
                            {items.length?<div style={{display:"flex",flexWrap:"wrap",gap:2,justifyContent:"center"}}>{items.map((item,ii)=>(
                              <span key={ii} style={{fontSize:9,padding:"2px 5px",borderRadius:10,background:(chipColors[item.toLowerCase()]||"#6b7c5a")+"22",color:chipColors[item.toLowerCase()]||"#6b7c5a",fontWeight:600,whiteSpace:"nowrap"}}>{item}</span>
                            ))}</div>:<span style={{fontSize:10,color:t.textLight}}>—</span>}
                          </td>);
                        }
                        if(row.type==="select"){
                          return(<td key={d} style={{padding:0,...cellBorder}}><select value={val} onChange={e=>upWD(d,row.field,e.target.value)} style={{padding:"5px 2px",border:"none",fontSize:10,width:"100%",minWidth:50,background:"transparent",color:val?t.text:t.textLight,fontFamily:t.font,outline:"none",cursor:"pointer",textAlign:"center"}}><option value="">—</option>{(row.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}</select></td>);
                        }
                        const isGluc = row.section==="glucose" && val;
                        const glucColor = isGluc ? (Number(val)<=99?t.ok:Number(val)<=140?"#d4850f":t.danger) : t.text;
                        return(<td key={d} style={{padding:0,...cellBorder}}><input type={row.type==="number"?"text":row.type} inputMode={row.type==="number"?"numeric":undefined} placeholder={row.ph||"—"} value={val} onChange={e=>upWD(d,row.field,e.target.value)} style={{padding:"5px 4px",border:"none",fontSize:11,width:"100%",minWidth:50,background:"transparent",color:isGluc?glucColor:t.text,fontWeight:isGluc?700:400,fontFamily:t.font,outline:"none",textAlign:"center",boxSizing:"border-box"}}/></td>);
                      })}
                    </tr>
                  </React.Fragment>);})}

                {/* Habit Score row */}
                <tr><td colSpan={8} style={{height:1.5,background:t.accent+"33",padding:0}}></td></tr>
                <tr style={{background:t.accentBg}}>
                  <td style={{position:"sticky",left:0,background:t.accentBg,zIndex:1,padding:"6px 8px",fontSize:12,color:t.accent,fontWeight:800,borderRight:`0.5px solid ${t.cardBorder}`}}>Score</td>
                  {weekDates.map(d=>{
                    const wd2=weekData[d]||{};
                    const ds=getDayScore(wd2);
                    const sc=ds===null?t.textLight:ds.base>=80?t.ok:ds.base>=50?"#d4850f":t.danger;
                    return(<td key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:13,fontWeight:800,color:sc}}>{ds!==null?`${ds.base}${ds.bonus?"+"+ds.bonus:""}`:"—"}</td>);
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Score Explanation Toggle */}
          <div onClick={()=>setScoreInfoOpen(!scoreInfoOpen)} style={{cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",margin:"8px 0",padding:"8px 12px"}}>
            <span style={{fontSize:12,fontWeight:700,color:t.accent}}>📊 How is the score calculated?</span>
            <span style={{fontSize:12,color:t.textMuted}}>{scoreInfoOpen?"▼":"▶"}</span>
          </div>
          {scoreInfoOpen&&<div style={{padding:"10px 12px",marginBottom:12,fontSize:11,lineHeight:1.8}}>
            <div style={{fontWeight:800,fontSize:12,color:t.text,marginBottom:6}}>Base Score /100</div>
            {[
              ["🚫 No sugar","18"],
              ["🌿 Berberine","15"],
              ["😴 Sleep","14"],
              ["🐟 Fish Oil","10"],
              ["🚶 After meal move","8"],
              ["⏳ Meal window","8"],
              ["🥗 Fiber first","7"],
              ["🏋️ Exercise","5"],
              ["💧 Water 2L","5"],
              ["💊 Magnesium","5"],
              ["☀️ D3+K2","5"],
            ].map(([name,pts],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
                <span style={{color:t.text}}>{name}</span>
                <span style={{color:t.accent,fontWeight:700}}>{pts}</span>
              </div>
            ))}
            <div style={{fontWeight:800,fontSize:12,color:t.text,marginTop:10,marginBottom:6}}>Bonus Points</div>
            {[
              ["🏋️ Weights","+10"],
              ["🏊 Cardio / swim / dance","+5"],
              ["⏳ Meal window ≤8h","+5"],
              ["⏳ Meal window ≤9h","+2"],
              ["🦠 Probiotics","+2"],
              ["🥜 Brazil nuts","+2"],
              ["🌱 Basil seeds","+2"],
            ].map(([name,pts],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 0"}}>
                <span style={{color:t.textMuted}}>{name}</span>
                <span style={{color:t.ok,fontWeight:700}}>{pts}</span>
              </div>
            ))}
            <div style={{marginTop:8,color:t.textMuted,fontSize:10}}>
              Daily score = <strong style={{color:t.text}}>base+bonus</strong> · Weekly avg skips empty days · Max 121
            </div>
          </div>}

          {/* Body Measurements — weekly date format matching tracker */}
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 8px"}}>Body Measurements</h2>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
            <button onClick={()=>shiftW(-1)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>◀</button>
            <span style={{fontSize:14,fontWeight:700,color:t.accent}}>{new Date(weekDates[0]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} — {new Date(weekDates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
            <button onClick={()=>shiftW(1)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>▶</button>
          </div>
          <div style={{overflowX:"auto",border:`0.5px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:10}}>
            <table style={{borderCollapse:"collapse",width:"100%",tableLayout:"fixed"}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{position:"sticky",left:0,background:t.sidebarBg,zIndex:2,padding:"7px 8px",fontSize:11,color:t.textMuted,textAlign:"left",borderBottom:`1px solid ${t.cardBorder}`,borderRight:`0.5px solid ${t.cardBorder}`,width:120}}></th>
                {weekDates.map((d,i)=>(<th key={d} style={{padding:"7px 3px",fontSize:11,color:t.accent,textAlign:"center",borderBottom:`1px solid ${t.cardBorder}`,borderRight:i<6?`0.5px solid ${t.cardBorder}22`:"none",fontWeight:700}}><div>{dn[i]}</div><div style={{fontWeight:400,color:t.textLight,fontSize:10}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
              </tr></thead>
              <tbody>{[
                {label:"⚖️ Weight",field:"weight",ph:"kg"},
                {label:"📏 Waist",field:"waist",ph:"cm"},
                {label:"📏 Belly",field:"belly",ph:"cm"},
                {label:"📏 Hip",field:"hip",ph:"cm"},
                {label:"📐 Waist:Hip",field:"whr",ph:"ratio"},
                {label:"💪 Upper Arm",field:"arm",ph:"cm"},
                {label:"🦵 Thigh",field:"thigh",ph:"cm"},
                {label:"🦶 Calve",field:"calve",ph:"cm"},
                {label:"📏 Chest",field:"chest",ph:"cm"},
                {label:"📏 Neck",field:"neck",ph:"cm"},
                {label:"📏 Shoulder",field:"shoulder",ph:"cm"},
              ].map((row,i)=>{
                const rowBg = i%2===0?t.card:t.bg;
                return(
                <tr key={row.field} style={{background:rowBg}}>
                  <td style={{position:"sticky",left:0,background:rowBg,zIndex:1,padding:"5px 8px",fontSize:11,color:t.text,fontWeight:600,borderRight:`0.5px solid ${t.cardBorder}`,borderBottom:`0.5px solid ${t.cardBorder}`,whiteSpace:"nowrap"}}>{row.label}</td>
                  {weekDates.map((d,di)=>(
                    <td key={d} style={{padding:0,borderBottom:`0.5px solid ${t.cardBorder}`,borderRight:di<6?`0.5px solid ${t.cardBorder}22`:"none"}}>
                      <input type="text" placeholder={row.ph} value={(bodyMeas[`${row.field}-${d}`])||""} onChange={e=>{const val=e.target.value;bodyCleared.current=false;try{localStorage.removeItem("ge_bodyMeas_cleared");}catch{};setBodyMeas(p=>{const n={...p,[`${row.field}-${d}`]:val};try{localStorage.setItem("ge_bodyMeas",JSON.stringify(n))}catch{};const bodyForDate={};Object.keys(n).forEach(k=>{if(k.endsWith("-"+d)){const field=k.split("-")[0];bodyForDate[field]=n[k];}});queueSave(d,bodyForDate,"body");return n;});}} style={{padding:"5px 4px",border:"none",fontSize:11,width:"100%",background:"transparent",color:t.text,fontFamily:t.font,outline:"none",textAlign:"center",boxSizing:"border-box"}}/>
                    </td>
                  ))}
                </tr>);
              })}</tbody>
            </table>
          </div>

          {/* ══ INSIGHT ══ */}
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 8px"}}>Insight</h2>
          {(()=>{
            // Build weeks: W0 = pre-protocol baseline, W1+ = protocol weeks
            const allWeeks = [];
            // W0: 26 Feb – 1 Mar (baseline week before protocol)
            const w0Dates = [];
            for(let i=0;i<4;i++){const dd=new Date("2026-02-26");dd.setDate(dd.getDate()+i);w0Dates.push(dd.toISOString().split("T")[0]);}
            allWeeks.push({num:0,label:"W0",sublabel:"Baseline",start:new Date("2026-02-26"),end:new Date("2026-03-01"),dates:w0Dates});
            // W1+: protocol weeks starting 2 Mar
            const startDate = new Date("2026-03-02");
            const today = new Date();
            let ws = new Date(startDate);
            let wNum = 1;
            while(ws <= today) {
              const we = new Date(ws); we.setDate(we.getDate()+6);
              const wDates = [];
              for(let i=0;i<7;i++){const dd=new Date(ws);dd.setDate(dd.getDate()+i);wDates.push(dd.toISOString().split("T")[0]);}
              allWeeks.push({num:wNum,label:`W${wNum}`,sublabel:`Day ${(wNum-1)*7+1}–${wNum*7}`,start:new Date(ws),end:we>today?today:we,dates:wDates});
              ws.setDate(ws.getDate()+7);
              wNum++;
            }
            // Default to latest week
            const activeIdx = insightWeek !== null ? insightWeek : allWeeks.length-1;
            const w = allWeeks[activeIdx];
            if(!w) return null;

            const wStart=w.start.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
            const wEnd=w.end.toLocaleDateString("en-GB",{day:"numeric",month:"short"});

            // Gather glucose data
            const glucVals=w.dates.map(d=>{const v=weekData[d]?.glucFast;return v?Number(v):null;}).filter(v=>v);
            const glucMin=glucVals.length?Math.min(...glucVals):null;
            const glucMax=glucVals.length?Math.max(...glucVals):null;
            const glucAvg=glucVals.length?Math.round(glucVals.reduce((a,b)=>a+b,0)/glucVals.length):null;

            // Post-meal glucose
            const postMealVals=w.dates.map(d=>{const v=weekData[d]?.glucPost;return v?Number(v):null;}).filter(v=>v);
            const postMealMin=postMealVals.length?Math.min(...postMealVals):null;
            const postMealMax=postMealVals.length?Math.max(...postMealVals):null;
            const postMealAvg=postMealVals.length?Math.round(postMealVals.reduce((a,b)=>a+b,0)/postMealVals.length):null;

            // Sleep trend
            let sleepGood=0,sleepTotal=0;
            w.dates.forEach(d=>{const s=weekData[d]?.sleep;if(s){sleepTotal++;if(s==="7+"||s==="8+")sleepGood++;}});

            // Sleep average hours (estimate from categories)
            const sleepHours=[];
            w.dates.forEach(d=>{const s=weekData[d]?.sleep;if(s){
              if(s==="8+")sleepHours.push(8.5);
              else if(s==="7+")sleepHours.push(7.5);
              else if(s==="<7")sleepHours.push(6.5);
              else if(s==="<6")sleepHours.push(5.5);
            }});
            const sleepAvg=sleepHours.length?Math.round(sleepHours.reduce((a,b)=>a+b,0)/sleepHours.length*10)/10:null;

            // Supplement tracking: calculate % of max doses taken this week
            // Max doses: berb x2, fish x3, mag x2, d3k2 x2
            let suppsDone=0,suppsMax=0;
            w.dates.forEach(d=>{
              const wd=weekData[d];
              if(!wd) return;
              // Only count days where at least one supp field exists
              const hasSupp = wd.berb||wd.fish||wd.mag||wd.d3k2;
              if(!hasSupp) return;
              const doseVal=(v,max)=>{if(!v||v==="0")return 0;const n=parseInt(v.replace("x",""));return isNaN(n)?0:Math.min(n,max);};
              suppsDone+=doseVal(wd.berb,2)+doseVal(wd.fish,3)+doseVal(wd.mag,2)+doseVal(wd.d3k2,2);
              suppsMax+=2+3+2+2; // 9 total max per day
            });
            const suppsPct=suppsMax>0?Math.round(suppsDone/suppsMax*100):0;

            // Count habits
            let habDone=0,habTotal=0;
            w.dates.forEach(d=>{const wd=weekData[d]||{};
              ["berb","fish","mag","d3k2"].forEach(f=>{habTotal++;if(wd[f]&&wd[f]!=="0")habDone++;});
              ["basil","brazil","probio","noSweet","fiberFirst","if14","water"].forEach(f=>{habTotal++;if(wd[f])habDone++;});
              habTotal++;if(wd.moveAfter)habDone++;
              habTotal++;if(wd.act)habDone++;
              habTotal++;if(wd.sleep==="7+"||wd.sleep==="8+")habDone++;
            });
            const habPct=habTotal>0?Math.round(habDone/habTotal*100):0;

            // Body measurements
            const bmFields=["weight","waist","hip","whr","belly","neck","chest"];
            const bm={};
            bmFields.forEach(f=>{
              for(let i=w.dates.length-1;i>=0;i--){
                const v=bodyMeas[`${f}-${w.dates[i]}`];
                if(v){bm[f]=v;break;}
              }
            });

            // Clinical notes for this week
            const weekNoteKeys=Object.keys(clinicalNotes).filter(k=>{
              const dateMatch=k.match(/(\d+)\s+(Mar|Feb)/i);
              if(dateMatch){
                const day=parseInt(dateMatch[1]);
                const mon=dateMatch[2].toLowerCase();
                const startDay=w.start.getDate();
                const endDay=w.end.getDate();
                const startMon=w.start.getMonth(); // 1=Feb, 2=Mar
                const noteMon=mon==="feb"?1:2;
                if(noteMon===startMon||(startMon===1&&noteMon===2&&endDay>=day)){
                  return day>=startDay&&day<=endDay;
                }
                if(startMon===1&&noteMon===1) return day>=startDay;
                if(startMon===1&&noteMon===2) return day<=endDay;
                return day>=startDay&&day<=endDay;
              }
              return false;
            });
            const wNotes=weekNoteKeys.flatMap(k=>clinicalNotes[k]||[]);

            return(<div>
              {/* Week navigation — date bar matching tracker */}
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <button onClick={()=>setInsightWeek(Math.max(0,(insightWeek!==null?insightWeek:allWeeks.length-1)-1))} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>◀</button>
                <span style={{fontSize:14,fontWeight:700,color:t.accent}}>{w.num===0?"Baseline":`W${w.num}`} · {wStart} – {wEnd}</span>
                <button onClick={()=>setInsightWeek(Math.min(allWeeks.length-1,(insightWeek!==null?insightWeek:allWeeks.length-1)+1))} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>▶</button>
              </div>

              {/* Week content */}
              <div style={{padding:"0 0 12px"}}>

                {/* ── 1. Week Score Ring + Weekly Summary ── */}
                {w.num>0&&(()=>{
                  // Calculate week score using impact-weighted system
                  let totalBase=0,totalBonus=0,trackedDays=0,weightDays=0;
                  w.dates.forEach(d=>{
                    const wd=weekData[d]||{};
                    const ds=getDayScore(wd);
                    if(ds!==null){totalBase+=ds.base;totalBonus+=ds.bonus;trackedDays++;}
                    if(wd.act==="weights")weightDays++;
                  });
                  const avgBase=trackedDays>0?Math.round(totalBase/trackedDays):null;
                  if(!avgBase) return null;
                  const avgBonus=trackedDays>0?Math.round(totalBonus/trackedDays):0;
                  const weightBonus=weightDays>=2?5:0;
                  const weekScore=avgBase;
                  const weekBonus=avgBonus+weightBonus;

                  // Prediction comparison
                  const dayNum=w.num*7;
                  const expectedGluc=dayNum>0?Math.round(211-(211-150)*(dayNum/30)):null;
                  const aheadOfPred=expectedGluc&&glucAvg?glucAvg<expectedGluc:false;
                  const predDiff=expectedGluc&&glucAvg?expectedGluc-glucAvg:0;

                  // Build narrative
                  const parts=[];
                  if(glucAvg){
                    let g=`Fasting glucose avg at ${glucAvg}`;
                    if(aheadOfPred) g+=`, beating the Day ${dayNum} prediction by ${predDiff} points`;
                    g+=".";
                    parts.push(g);
                  }
                  if(bm.weight){
                    const wd=Math.round((73.6-Number(bm.weight))*10)/10;
                    if(wd>0) parts.push(`Body weight trending down at ${bm.weight}kg (-${wd}).`);
                  }
                  if(sleepAvg&&sleepAvg<7) parts.push(`Sleep remains below target at ${sleepAvg}h average with ${sleepGood}/${sleepTotal} nights hitting 7+.`);
                  if(suppsPct<40) parts.push(`Supplement adherence critically low at ${suppsPct}%.`);
                  else if(suppsPct<80) parts.push(`Supplement adherence at ${suppsPct}%, needs improvement.`);

                  const ringColor=weekScore>=70?t.ok:weekScore>=40?"#d4850f":t.danger;
                  const circumference=2*Math.PI*30;
                  const offset=circumference-((weekScore/100)*circumference);

                  return(
                  <div style={{display:"flex",gap:14,marginBottom:14,alignItems:"center"}}>
                    <div style={{flexShrink:0,textAlign:"center"}}>
                      <svg width={72} height={72} viewBox="0 0 72 72">
                        <circle cx={36} cy={36} r={30} fill="none" stroke={t.cardBorder} strokeWidth={4.5}/>
                        <circle cx={36} cy={36} r={30} fill="none" stroke={ringColor} strokeWidth={4.5} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" transform="rotate(-90 36 36)"/>
                        <text x={36} y={33} textAnchor="middle" dominantBaseline="central" style={{fontSize:18,fontWeight:800,fill:t.text}}>{weekScore}</text>
                        <text x={36} y={48} textAnchor="middle" style={{fontSize:9,fill:t.textMuted}}>{weekBonus>0?`/100 +${weekBonus}`:"/100"}</text>
                      </svg>
                      <div style={{fontSize:9,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.3px",marginTop:2}}>Week score</div>
                    </div>
                    <div style={{flex:1,fontSize:12,color:t.text,lineHeight:1.7}}>
                      {parts.map((p,pi)=><span key={pi}>{pi>0?" ":""}{p}</span>)}
                    </div>
                  </div>);
                })()}

                {/* ── 2. Key Learnings (green) + Next Week Focus (blue) ── */}
                {w.num>0&&(()=>{
                  const learnings = [];
                  wNotes.forEach(n=>{
                    const tl = n.title.toLowerCase();
                    if(tl.includes("spike")||tl.includes("rice")||tl.includes("no spike")||tl.includes("no-carb")||tl.includes("salmon")||tl.includes("brain work")||tl.includes("exhausted")) {
                      learnings.push({text:n.title, color:n.sev==="excellent"?t.ok:n.sev==="grow"?t.danger:"#d4850f", sev:n.sev});
                    }
                  });
                  learnings.sort((a,b)=>(a.color===t.ok?0:1)-(b.color===t.ok?0:1));
                  const focus=[];
                  if(sleepAvg&&sleepAvg<7) focus.push({icon:"😴",text:`Sleep avg ${sleepAvg}h, aim for 7+ every night`});
                  if(suppsPct<80) focus.push({icon:"💊",text:`Supps at ${suppsPct}%, take all 4 daily`});
                  if(glucAvg&&glucAvg>130) focus.push({icon:"🩸",text:`Fasting still ${glucAvg}, keep berberine x2 + walks`});
                  if(postMealAvg&&postMealAvg>160) focus.push({icon:"🍚",text:`Post-meal avg ${postMealAvg}, try konjac rice`});
                  if(sleepAvg&&sleepAvg>=7&&suppsPct>=80&&glucAvg&&glucAvg<=130) focus.push({icon:"🔥",text:"Great momentum, maintain consistency"});
                  const hasRiceSpike = wNotes.some(n=>n.title.toLowerCase().includes("rice")&&n.sev==="grow");
                  if(hasRiceSpike) focus.push({icon:"🍚",text:"Rice still spikes, switch to konjac or skip"});
                  if(learnings.length===0&&focus.length===0) return null;
                  return(
                  <div style={{display:"flex",gap:10,marginBottom:14}}>
                    {learnings.length>0&&<div style={{flex:1,padding:"10px 14px",background:t.okBg,borderRadius:t.radiusSm}}>
                      <div style={{fontSize:10,fontWeight:700,color:t.ok,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Key Learnings</div>
                      {learnings.map((l,li)=>(
                        <div key={li} style={{fontSize:12,color:l.color,fontWeight:600,lineHeight:1.7}}>{l.color===t.ok?"✓":"⚠"} {l.text}</div>
                      ))}
                    </div>}
                    {focus.length>0&&<div style={{flex:1,padding:"10px 14px",background:"#dde8f5",borderRadius:t.radiusSm}}>
                      <div style={{fontSize:10,fontWeight:700,color:"#185fa5",textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:6}}>Next Week Focus</div>
                      {focus.slice(0,3).map((f,fi)=>(
                        <div key={fi} style={{fontSize:12,color:t.text,fontWeight:600,lineHeight:1.7}}>{f.icon} {f.text}</div>
                      ))}
                    </div>}
                  </div>);
                })()}

                {/* ── Key highlights in one row with | separators ── */}
                {(glucVals.length>0||postMealVals.length>0)&&(()=>{

                  // Prev week data for deltas
                  const prev = activeIdx>0?allWeeks[activeIdx-1]:null;
                  const pGluc=prev?prev.dates.map(d=>{const v=weekData[d]?.glucFast;return v?Number(v):null;}).filter(v=>v):[];
                  const pGlucAvg=pGluc.length?Math.round(pGluc.reduce((a,b)=>a+b,0)/pGluc.length):null;
                  const pPost=prev?prev.dates.map(d=>{const v=weekData[d]?.glucPost;return v?Number(v):null;}).filter(v=>v):[];
                  const pPostAvg=pPost.length?Math.round(pPost.reduce((a,b)=>a+b,0)/pPost.length):null;
                  const pSleepH=[];if(prev)prev.dates.forEach(d=>{const s=weekData[d]?.sleep;if(s){if(s==="8+")pSleepH.push(8.5);else if(s==="7+")pSleepH.push(7.5);else if(s==="<7")pSleepH.push(6.5);else if(s==="<6")pSleepH.push(5.5);}});
                  const pSleepAvg=pSleepH.length?Math.round(pSleepH.reduce((a,b)=>a+b,0)/pSleepH.length*10)/10:null;

                  // Prediction: interpolate toward Day 30 (baseline 211 → target ~150)
                  const dayNum=w.num*7;
                  const expectedGluc=dayNum>0?Math.round(211-(211-150)*(dayNum/30)):null;

                  // Spike range from night glucose
                  const nightVals=w.dates.map(d=>{const v=weekData[d]?.glucNight;return v?Number(v):null;}).filter(v=>v);
                  const spikeRange=postMealVals.length?`${postMealMin}–${postMealMax}`:null;

                  const metrics = [
                    glucAvg&&{label:"Fasting",val:glucAvg,range:`${glucMin}–${glucMax}`,color:glucAvg<=99?t.ok:glucAvg<=140?"#d4850f":t.danger,
                      delta:pGlucAvg&&w.num>0?glucAvg-pGlucAvg:null,deltaGood:pGlucAvg?glucAvg<pGlucAvg:false,
                      pred:expectedGluc&&w.num>0?`vs ~${expectedGluc} prediction`:null,predAhead:expectedGluc?glucAvg<expectedGluc:false},
                    postMealAvg&&{label:"Post-meal",val:postMealAvg,range:`spike ${postMealMin}–${postMealMax}`,color:postMealAvg<=140?t.ok:postMealAvg<=180?"#d4850f":t.danger,
                      delta:pPostAvg&&w.num>0?postMealAvg-pPostAvg:null,deltaGood:pPostAvg?postMealAvg<pPostAvg:false,
                      pred:null,predAhead:false},
                    sleepAvg&&{label:"Sleep avg",val:`${sleepAvg}h`,range:`${sleepGood}/${sleepTotal} nights 7+`,color:sleepAvg>=7?t.ok:sleepAvg>=6.5?"#d4850f":t.danger,
                      delta:pSleepAvg&&w.num>0?Math.round((sleepAvg-pSleepAvg)*10)/10:null,deltaGood:pSleepAvg?sleepAvg>pSleepAvg:false,deltaUnit:"h",
                      pred:null,predAhead:false},
                    {label:"Supps",val:`${suppsPct}%`,range:null,color:suppsPct>=80?t.ok:suppsPct>=40?"#d4850f":t.danger,
                      delta:null,pred:null},
                  ].filter(Boolean);
                  return(
                  <div style={{display:"flex",alignItems:"stretch",marginBottom:14,width:"100%"}}>
                    {metrics.map((m,mi)=>(
                      <React.Fragment key={mi}>
                        <div style={{textAlign:"center",padding:"0 8px",flex:1}}>
                          <div style={{fontSize:10,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.5px"}}>{m.label}</div>
                          <div style={{fontSize:22,fontWeight:800,color:m.color}}>{m.val}</div>
                          {m.range&&<div style={{fontSize:10,color:t.textMuted}}>{m.range}</div>}
                          {m.delta!=null&&<div style={{fontSize:9,color:m.deltaGood?t.ok:t.danger,fontWeight:700}}>{m.delta>0?"↑":"↓"}{Math.abs(m.delta)}{m.deltaUnit||""}</div>}
                          {m.pred&&<div style={{fontSize:9,color:m.predAhead?t.ok:"#d4850f",fontWeight:600}}>{m.pred}</div>}
                        </div>
                        <div style={{width:1,background:t.cardBorder,flexShrink:0}}/>
                      </React.Fragment>
                    ))}
                    {/* Body composition — same format as Fasting */}
                    {Object.keys(bm).length>0&&(
                      <React.Fragment>
                        <div style={{textAlign:"center",padding:"0 8px",flex:1}}>
                          <div style={{fontSize:10,color:t.textMuted,textTransform:"uppercase",letterSpacing:"0.5px"}}>Body</div>
                          <div style={{fontSize:22,fontWeight:800,color:t.text}}>{bm.weight?`${bm.weight}`:""}<span style={{fontSize:13,fontWeight:400,color:t.textMuted}}>kg</span></div>
                          <div style={{fontSize:10,color:t.textMuted}}>{[`BMI ${BMI}`,bm.waist&&`W${bm.waist}`,bm.belly&&`B${bm.belly}`].filter(Boolean).join(" · ")}</div>
                          {(()=>{const baseW=73.6;if(!bm.weight)return null;const d=Math.round((Number(bm.weight)-baseW)*10)/10;return d!==0?<div style={{fontSize:9,color:d<0?t.ok:t.danger,fontWeight:700}}>{d>0?"↑":"↓"}{Math.abs(d)}kg</div>:null;})()}
                        </div>
                      </React.Fragment>
                    )}
                  </div>);
                })()}

                {/* ── Notes with left-border accents ── */}
                {wNotes.length>0&&(()=>{
                  const excellent = wNotes.filter(n=>n.sev==="excellent");
                  const ontrack = wNotes.filter(n=>n.sev==="ontrack");
                  const grow = wNotes.filter(n=>n.sev==="grow");
                  const renderCol = (items, label, borderColor, textColor, key) => (
                    <div key={key} style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:10,fontWeight:700,color:textColor,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:8}}>{label} ({items.length})</div>
                      {items.map((n,ni)=>(
                        <div key={ni} style={{borderLeft:`3px solid ${borderColor}`,paddingLeft:10,fontSize:12,fontWeight:600,color:t.text,lineHeight:1.4,marginBottom:6,borderRadius:0}}>
                          {n.title}
                        </div>
                      ))}
                    </div>
                  );
                  const cols = [];
                  if(excellent.length>0) cols.push({items:excellent,label:"Excellent",borderColor:t.ok,textColor:t.ok});
                  if(ontrack.length>0) cols.push({items:ontrack,label:"Ok",borderColor:"#d4850f",textColor:"#d4850f"});
                  if(grow.length>0) cols.push({items:grow,label:"Needs Work",borderColor:t.danger,textColor:t.danger});
                  if(cols.length===0) return null;
                  return(
                  <div style={{display:"flex",gap:20}}>
                    {cols.map((c,ci)=>renderCol(c.items,c.label,c.borderColor,c.textColor,ci))}
                  </div>);
                })()}

                {/* Empty state */}
                {glucVals.length===0&&Object.keys(bm).length===0&&wNotes.length===0&&(
                  <div style={{fontSize:12,color:t.textMuted,fontStyle:"italic",padding:"8px 0"}}>No data recorded this week yet.</div>
                )}
              </div>
            </div>);
          })()}


        </div>)}

      </div>
    </div>
  );
}
