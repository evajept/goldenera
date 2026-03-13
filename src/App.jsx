import React, { useState } from "react";

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
];

// Clinical notes per checkup date
const clinicalNotes = {
  "26 Feb": [
    { icon:"🚨", sev:"critical", title:"Pancreatitis Risk", text:"Trig 702 (4x limit). Above 500 = acute pancreatitis risk. If severe stomach pain radiating to back, nausea, vomiting → ER immediately." },
    { icon:"🫁", sev:"critical", title:"Fatty Liver (NAFLD)", text:"GGT 184 + ALT 50 confirms fatty liver. Reversible. Liver regenerates in 6-8 weeks once triggers removed." },
    { icon:"🩸", sev:"critical", title:"Uncontrolled Diabetes", text:"HbA1C 9.4% + Glucose 211. Without intervention, nerve/kidney/vision damage risk increases within 1-2 years." },
    { icon:"💊", sev:"warning", title:"Lipemic Blood (3+)", text:"Blood visibly fatty. Fat in blood = triglycerides so high they're visible. Fish oil + zero sweet drinks = fastest fix." },
    { icon:"⚡", sev:"warning", title:"Metabolic Syndrome", text:"High glucose + high trig + uric acid + fatty liver = full metabolic syndrome. All respond to same interventions." },
    { icon:"✅", sev:"ok", title:"Kidneys Normal", text:"Creatinine 0.52, eGFR 130. Kidneys healthy. Safe for all supplements." },
  ],
  "7 Mar (Day 5)": [
    { icon:"🎉", sev:"ok", title:"Fasting glucose 211 → 142 (Day 5)", text:"Dropped 69 points (-33%) in 5 days of protocol. Ahead of predictions. Protocol is working." },
    { icon:"⚖️", sev:"ok", title:"Weight 73.6 → 71.2 kg", text:"Lost 2.4 kg by Day 5. First 1-2 kg is water/inflammation. Real fat loss starting." },
    { icon:"🌅", sev:"warning", title:"Dawn effect present", text:"Evening 128 → morning 142 (+14). Normal for insulin resistance. Last thing to normalize. Berberine + Mg at night helping." },
    { icon:"🍚", sev:"warning", title:"Post-meal spike 208", text:"4 spoons rice berry + potato + pumpkin = ~50g carbs. Too much for current insulin resistance. Target <30g carbs/meal. Drop potato, try konjac rice." },
    { icon:"📊", sev:"ok", title:"Tracking faster than predicted", text:"At this pace, fasting glucose could hit 120s soon and sub-100 by Day 60. Keep going." },
  ],
  "10 Mar (Day 9)": [
    { icon:"🎉", sev:"ok", title:"Fasting glucose 211 → 123 (Day 9)", text:"Dropped 88 points (-42%) in 9 days of protocol. Now only 24 points above normal range (70-99). Beating Full Send predictions again." },
    { icon:"🍚", sev:"ok", title:"Low GI rice test passed", text:"Post-meal 160 after low GI rice (spike +37). Compare: jasmine rice spike was +97 (to 217). Low GI rice works for her." },
    { icon:"📉", sev:"ok", title:"Post-meal 150 (no carb meal)", text:"Salmon-style meals still producing drops, not spikes. Her metabolism is recovering." },
    { icon:"😴", sev:"critical", title:"Sleep still <7 every night", text:"Every single day shows <7 hours. This alone costs 15-30 pts on fasting glucose. 123 could be 100-110 with proper sleep." },
    { icon:"💊", sev:"warning", title:"Magnesium + D3/K2 still zero", text:"9 days without these supplements. Magnesium improves sleep AND lowers fasting glucose. Start tonight." },
    { icon:"⚖️", sev:"ok", title:"Weight 73.6 → 71.8 kg", text:"Lost 1.8 kg by Day 7 of tracking. Real fat loss now starting. Predicted 67-69 kg by end of month." },
    { icon:"🏃", sev:"ok", title:"Walking daily + berberine x2", text:"Perfect compliance on the two highest-impact habits. This is why numbers are dropping so fast." },
    { icon:"🔮", sev:"ok", title:"Day 30 prediction updated", text:"Fasting glucose 95-110. Could hit normal range by end of month. Retest trig + glucose at Day 30." },
    { icon:"📐", sev:"ok", title:"Body: Hip 103 → 99 cm (-4)", text:"Fat mobilizing from hip area. Waist 89→88 (-1). Neck 42→39 (-3) signals insulin resistance improving. Chest 105→101 (-4)." },
    { icon:"📏", sev:"warning", title:"Waist:Hip ratio 0.89", text:"Target <0.80 for healthy range. Currently elevated = metabolic risk zone. Will improve as visceral fat drops with trig reduction." },
  ],
  "8 Mar (Day 7)": [
    { icon:"⚖️", sev:"ok", title:"Weight 73.6 → 71.8 kg (-1.8)", text:"Lost 1.8 kg in first week of tracking. First 1-2 kg is water/inflammation. Sustainable pace." },
    { icon:"📐", sev:"ok", title:"Hip 103 → 99 cm (-4 cm)", text:"Biggest single measurement drop. Fat is mobilizing. Great response to protocol." },
    { icon:"📏", sev:"ok", title:"Neck 42 → 39 cm (-3 cm)", text:"Neck circumference tracks insulin resistance closely. 3 cm drop is a strong signal the body is responding." },
    { icon:"📏", sev:"ok", title:"Chest 105 → 101 cm (-4 cm)", text:"Inflammation and fluid retention reducing. Upper body responding well." },
    { icon:"📏", sev:"warning", title:"Waist only -1 cm (89→88)", text:"Waist is often last to shrink (visceral fat is stubborn). Will accelerate as liver fat clears and trig drops." },
    { icon:"📐", sev:"warning", title:"Waist:Hip 0.89 (elevated)", text:"Target <0.80. This ratio is the #1 predictor of metabolic disease risk. It will track down with trig reduction." },
    { icon:"💪", sev:"ok", title:"New baselines recorded", text:"Belly 96, Thigh 55, Calve 37, Shoulder 47. Now we can track changes going forward." },
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
  { name:"Berberine", dose:"600mg × 2 w/ meals", trig:"-20–35%", hb:"-0.9–2%", notes:"Wk1: 1×. Wk2+: 2×. Always WITH food. Never empty stomach.", icon:"🌿", p:"HIGHEST" },
  { name:"Fish Oil", dose:"3–4g EPA+DHA split", trig:"-20–50%", hb:"Min", notes:"With fattiest meal. Split across meals. Freeze caps to prevent burps.", icon:"🐟", p:"HIGHEST" },
  { name:"Magnesium", dose:"200mg+ bedtime", trig:"-5–15%", hb:"-0.3–0.5%", notes:"Glycinate or citrate form. Glycine = liver protective. Calms nerves, improves sleep.", icon:"💎", p:"HIGHEST" },
  { name:"D3 + K2", dose:"2000–5000 IU + 100mcg MK-7 bedtime", trig:"Indirect", hb:"-0.3–0.5%", notes:"Take WITH magnesium (Mg activates D3). Most Thais deficient. K2 directs calcium to bones not arteries.", icon:"☀️", p:"HIGHEST" },
  { name:"Basil Seeds", dose:"1 tbsp soaked 15 min before meals", trig:"-10–20%", hb:"-0.3–0.8%", notes:"เม็ดแมงลัก. Soak in water until gel forms. Same fiber barrier as psyllium. NOT with fish oil.", icon:"🌾", p:"HIGH" },
  { name:"ACV", dose:"1 tsp in water before meals", trig:"Indirect", hb:"-0.2–0.3%", notes:"Dilute always. Use straw to protect teeth. Optional. Start when ready.", icon:"🍎", p:"OPT" },
];

const actOpts = ["Walk","Heel raises","Weight training","Long walk 30+","Swimming","Yoga","Sauna/steam","Stretching","Rest day","Housework","Other"];
// Tracker rows matching Google Sheet structure exactly
const trackerRows = [
  {label:"🩸 Fasting Glucose",field:"glucFast",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🍽️ Post-meal Glucose",field:"glucPost",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"🌙 Night Glucose",field:"glucNight",type:"number",ph:"mg/dL",section:"glucose"},
  {label:"⏰ First meal",field:"m1t",type:"time",ph:"",section:"meals"},
  {label:"⏰ Last meal",field:"mLast",type:"time",ph:"",section:"meals"},
  {label:"🚶 After meal move",field:"moveAfter",type:"select",ph:"",opts:["x1","x2","x3"],section:"activity"},
  {label:"🏃 Activity",field:"act",type:"text",ph:"walk, yoga...",section:"activity"},
  {label:"🌿 Berberine",field:"berb",type:"select",ph:"",opts:["0","x1","x2"],section:"supps"},
  {label:"🐟 Fish Oil",field:"fish",type:"select",ph:"",opts:["0","x1","x2","x3"],section:"supps"},
  {label:"💊 Magnesium",field:"mag",type:"select",ph:"",opts:["0","x1","x2","x3"],section:"supps"},
  {label:"☀️ D3 + K2",field:"d3k2",type:"select",ph:"",opts:["0","x1","x2"],section:"supps"},
  {label:"🌱 Basil seeds",field:"basil",type:"check",section:"supps"},
  {label:"🥜 Brazil nuts x3",field:"brazil",type:"check",section:"supps"},
  {label:"🦠 Probiotics",field:"probio",type:"check",section:"habits"},
  {label:"🚫 No sweet drink",field:"noSweet",type:"check",section:"habits"},
  {label:"🥗 Fiber first",field:"fiberFirst",type:"check",section:"habits"},
  {label:"⏳ IF 14:10",field:"if14",type:"check",section:"habits"},
  {label:"💧 Water 2L",field:"water",type:"check",section:"habits"},
  {label:"😴 Sleep (>7h)",field:"sleep",type:"select",ph:"",opts:["<6","<7","7+","8+"],section:"habits"},
  {label:"📝 Notes",field:"notes",type:"text",ph:"...",section:"notes"},
];
const keyHabitsForScore = ["berb","fish","mag","d3k2","basil","brazil","probio","noSweet","fiberFirst","if14","water","moveAfter","act"];
const bodyMeasRows = ["Waist (cm)","Hips (cm)","Chest (cm)","Upper Arm (cm)","Thigh (cm)","Neck (cm)","Waist-to-Hip Ratio","Body Fat % (est.)"];
const tabDefs = [{icon:"📊",label:"PROGRESS"},{icon:"🩸",label:"LABS"},{icon:"📋",label:"LIFESTYLE"},{icon:"🍽️",label:"FOOD & SUPPS"}];

const t = {
  bg:"#faf8f5", card:"#fffefa", cardBorder:"#e8e0d4",
  accent:"#9b6b3d", accentLight:"#fdf6ed", accentBg:"#faf3ea",
  danger:"#b44234", dangerBg:"#fdf2ef", dangerBorder:"#e8c8c0",
  warn:"#a07830", warnBg:"#fefaf0", warnBorder:"#e8d8b0",
  okBg:"#f2f5ee", okBorder:"#d0d8c4", ok:"#5c7a44",
  text:"#3d3228", textMuted:"#8a7d70", textLight:"#b0a698",
  radius:10, radiusSm:6, font:"'Source Serif 4', Georgia, serif", sidebarBg:"#f3efe8",
};
const stC = { critical:{bg:t.dangerBg,bd:t.dangerBorder,tx:t.danger}, warning:{bg:t.warnBg,bd:t.warnBorder,tx:t.warn}, ok:{bg:t.okBg,bd:t.okBorder,tx:t.ok} };
const sc="#5c7a44";


export default function GoldenEra() {
  const [tab, setTab] = useState(0);
  const [sheetStatus, setSheetStatus] = useState("idle"); // idle | loading | synced | error
  const [expandedSupp, setExpandedSupp] = useState(null);
  const [joyOpen, setJoyOpen] = useState(false);
  // scenario removed - using real data
  const [labChart, setLabChart] = useState("hb");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noteTab, setNoteTab] = useState("10 Mar (Day 9)");
  
  const seedBodyMeas={
  "weight-2026-02-26":"73.6","waist-2026-02-26":"89","hip-2026-02-26":"103",
  "arm-2026-02-26":"31","chest-2026-02-26":"105","neck-2026-02-26":"42","shoulder-2026-02-26":"49",
  "weight-2026-03-08":"71.8","waist-2026-03-08":"88","belly-2026-03-08":"96","hip-2026-03-08":"99",
  "whr-2026-03-08":"0.89","arm-2026-03-08":"34","thigh-2026-03-08":"55","calve-2026-03-08":"37",
  "chest-2026-03-08":"101","neck-2026-03-08":"39","shoulder-2026-03-08":"47",
};
const [bodyMeas, setBodyMeas] = useState(()=>{try{const s=localStorage.getItem("ge_bodyMeas");if(s){const parsed=JSON.parse(s);return {...seedBodyMeas,...parsed};}return {...seedBodyMeas};}catch{return {...seedBodyMeas};}});

  const [weekStart, setWeekStart] = useState(()=>{const d=new Date();const dy=d.getDay();const df=d.getDate()-dy+(dy===0?-6:1);return new Date(d.setDate(df)).toISOString().split("T")[0];});
  const getWD=(s)=>{const r=[];for(let i=0;i<7;i++){const d=new Date(s);d.setDate(d.getDate()+i);r.push(d.toISOString().split("T")[0]);}return r;};
  const weekDates=getWD(weekStart);
  const dn=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const shiftW=(dir)=>{const d=new Date(weekStart);d.setDate(d.getDate()+dir*7);setWeekStart(d.toISOString().split("T")[0]);};
  const emptyDay={glucFast:"",glucPost:"",m1t:"",m1f:"",m2t:"",m2f:"",m3t:"",m3f:"",act:""};
  const seedData={
  "2026-02-26":{glucFast:"211",sleep:"<7"},
  "2026-02-27":{sleep:"<7"},
  "2026-02-28":{sleep:"<7"},
  "2026-03-01":{sleep:"<7"},
  "2026-03-02":{glucFast:"180",mLast:"17:00",moveAfter:"x2",act:"walk",berb:"0",fish:"0",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,if14:true,water:true,sleep:"<7"},
  "2026-03-03":{glucFast:"170",mLast:"19:00",moveAfter:"x1",act:"walk",berb:"0",fish:"0",mag:false,d3k2:false,probio:true,sleep:"<7"},
  "2026-03-04":{glucFast:"160",mLast:"17:00",moveAfter:"x1",act:"walk",berb:"x1",fish:"x1",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,if14:true,sleep:"<7"},
  "2026-03-05":{glucFast:"142",mLast:"16:00",moveAfter:"x1",act:"walk",berb:"x1",fish:"x1",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,sleep:"<7"},
  "2026-03-06":{glucFast:"140",mLast:"16:00",moveAfter:"x1",act:"walk",berb:"x2",fish:"x2",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,if14:true,water:true,sleep:"<7"},
  "2026-03-07":{glucFast:"147",mLast:"16:00",moveAfter:"x1",act:"walk",berb:"x1",fish:"x1",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,if14:true,water:true,sleep:"<7"},
  "2026-03-08":{glucFast:"150",glucNight:"140",mLast:"18:30",moveAfter:"x2",act:"walk",berb:"x2",fish:"x1",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,water:true,sleep:"<6",notes:"No spike at lunch cos no carbs. Salmon + Broccoli"},
  "2026-03-09":{glucFast:"150",glucPost:"150",glucNight:"137",mLast:"16:00",moveAfter:"x2",act:"walk",berb:"x2",fish:"x3",mag:false,d3k2:false,probio:true,fiberFirst:true,noSweet:true,sleep:"<7"},
  "2026-03-10":{glucFast:"123",glucPost:"160",glucNight:"131",mLast:"16:00",moveAfter:"x1",act:"walk",berb:"x2",fish:"x3",probio:true,fiberFirst:true,noSweet:true,sleep:"7+",notes:"Sugar spikes to 217 after eating white boiled rice with Tom yum, spicy noodle glass salad"},
};
const [weekData,setWeekData]=useState(()=>{try{const s=localStorage.getItem("ge_weekData");if(s){const parsed=JSON.parse(s);return {...seedData,...parsed};}return {...seedData};}catch{return {...seedData};}});
  const upWD=(date,f,v)=>setWeekData(p=>{
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
        if(d.tracker&&Object.keys(d.tracker).length>0){
          // Sheet wins over localStorage for tracker data
          setWeekData(p=>{
            const merged={...seedData,...p,...d.tracker};
            try{localStorage.setItem("ge_weekData",JSON.stringify(merged));}catch{}
            return merged;
          });
        }
        if(d.body&&Object.keys(d.body).length>0){
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

  const getTrackerScore=()=>{let total=0,possible=0;weekDates.forEach(d=>{const wd=weekData[d]||{};
    // Check supplements taken (not "0" and not empty)
    ["berb","fish"].forEach(f=>{possible+=1;if(wd[f]&&wd[f]!=="0")total++;});
    // Check checkboxes
    ["mag","d3k2","basil","brazil","probio","noSweet","fiberFirst","if14","water"].forEach(f=>{possible+=1;if(wd[f])total++;});
    // Movement
    possible+=1;if(wd.moveAfter)total++;
    possible+=1;if(wd.act)total++;
    // Sleep
    possible+=1;if(wd.sleep==="7+"||wd.sleep==="8+")total++;
  });let gluc=0;weekDates.forEach(d=>{if((weekData[d]||{}).glucFast)gluc++;});return{score:possible>0?Math.round((total/possible)*100):0,total,possible,gluc};};
  const ts=getTrackerScore();
  const getTP=(marker)=>{const s=ts.score;if(s===0)return"—";const lk={"HbA1C":[8.4,6],"Fasting Glucose":[185,92],"Triglycerides":[485,135],"GGT":[125,32],"SGPT (ALT)":[40,22],"SGOT (AST)":[30,20],"Cholesterol":[215,187],"Uric Acid":[6.8,5.2],"HDL-C":[45,55],"LDL-C":[110,100],"Creatinine":[.52,.52],"eGFR":[130,128],"Weight":[70,62]};const[w,b]=lk[marker]||[0,0];if(w===b)return String(w);const p=w+((b-w)*s/100);return marker==="HbA1C"?`~${p.toFixed(1)}%`:marker==="Creatinine"?p.toFixed(2):`~${Math.round(p)}`;};

  const getInsights=()=>{const tips=[];let berb=0,move=0,sweet=0,sleep=0,fiber=0,ifW=0,mag=0,water=0;weekDates.forEach(d=>{const wd=weekData[d]||{};if(wd.berb&&wd.berb!=="0")berb++;if(wd.moveAfter||wd.act)move++;if(wd.noSweet)sweet++;if(wd.sleep==="7+"||wd.sleep==="8+")sleep++;if(wd.fiberFirst)fiber++;if(wd.if14)ifW++;if(wd.mag)mag++;if(wd.water)water++;});if(ts.score>0)tips.push({icon:"📊",title:`Score: ${ts.score}%`,text:`${ts.total}/${ts.possible} habits. ${ts.score>=80?"Full Send pace.":ts.score>=50?"70% effort pace.":"Needs more consistency."}`});if(berb>0&&berb<5)tips.push({icon:"🌿",title:"Berberine",text:`${berb}/7 days. Aim for daily.`});if(berb>=5)tips.push({icon:"🌿",title:"Berberine strong",text:`${berb}/7 — excellent.`});if(move<5&&move>0)tips.push({icon:"🚶",title:"Move more",text:`${move}/7 days active. Even 10 min walks count.`});if(sweet>=5)tips.push({icon:"🚫",title:"Sugar-free",text:`${sweet}/7 days — biggest trig driver.`});if(sweet<5&&sweet>0)tips.push({icon:"⚠️",title:"Drinks",text:`${sweet}/7 sugar-free. Each ชาเย็น = +30-50 trig.`});if(sleep<5&&sleep>0)tips.push({icon:"😴",title:"Sleep",text:`${sleep}/7 nights 7+hrs. Poor sleep → glucose +15-30.`});if(mag===0)tips.push({icon:"💊",title:"Magnesium missing",text:"Start tonight. Helps sleep + lowers fasting glucose 5-15 pts."});if(tips.length===0){tips.push({icon:"📊",title:"Start tracking",text:"Fill in the table above to get personalized insights."});tips.push({icon:"💡",title:"Priorities",text:"Zero sweet drinks, berberine, movement, sleep 7+."});tips.push({icon:"🎯",title:"Glucose",text:"Track fasting glucose daily — best predictor of A1C."});}return tips;};

  const Pill=({active,children,onClick,color})=>(<button onClick={onClick} style={{padding:"5px 12px",borderRadius:t.radius,fontSize:12,border:`1px solid ${active?(color||t.accent):t.cardBorder}`,cursor:"pointer",background:active?(color||t.accent):t.card,color:active?"#fff":t.textMuted,fontWeight:active?700:500,fontFamily:t.font}}>{children}</button>);
  const Card=({children,style:s={}})=>(<div style={{background:t.card,border:`1px solid ${t.cardBorder}`,borderRadius:t.radius,padding:"14px 16px",marginBottom:10,...s}}>{children}</div>);
  const inp={padding:"6px 8px",borderRadius:8,border:`1px solid ${t.cardBorder}`,fontSize:12,fontFamily:t.font,boxSizing:"border-box",color:t.text,background:t.card,width:"100%"};

  const chD=chartData.strict;
  const cSets={hb:{data:chD.hb,label:"HbA1C",ref:5.7,refL:"<5.7%",dom:[4,10]},trig:{data:chD.trig,label:"Trig",ref:150,refL:"<150",dom:[0,750]},wt:{data:chD.wt,label:"Weight",ref:60,refL:"60kg",dom:[55,75]},ggt:{data:chD.ggt,label:"GGT",ref:39,refL:"<39",dom:[0,200]},chol:{data:chD.chol,label:"Chol",ref:200,refL:"<200",dom:[150,240]},gluc:{data:chD.gluc,label:"Glucose",ref:99,refL:"<99",dom:[50,230]}};
  const ch=cSets[labChart];
  

  return (
    <div style={{minHeight:"100vh",background:t.bg,fontFamily:t.font,color:t.text,display:"flex"}}>
      <link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />

      {/* SIDEBAR */}
      <div style={{width:sidebarOpen?200:52,minHeight:"100vh",background:t.sidebarBg,borderRight:`1px solid ${t.cardBorder}`,padding:sidebarOpen?"20px 16px":"20px 6px",display:"flex",flexDirection:"column",flexShrink:0,transition:"width 0.2s",overflow:"hidden"}}>
        <button onClick={()=>setSidebarOpen(!sidebarOpen)} style={{background:"none",border:"none",color:t.textLight,fontSize:14,cursor:"pointer",alignSelf:sidebarOpen?"flex-end":"center",marginBottom:10}}>{sidebarOpen?"◁":"▷"}</button>
        {sidebarOpen&&<>
          <div style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <div style={{fontSize:9,letterSpacing:3,color:t.accent,textTransform:"uppercase",fontWeight:600}}>Road to Golden Era</div>
              <span style={{fontSize:8,padding:"2px 5px",borderRadius:4,background:sheetStatus==="synced"?"#16a34a18":sheetStatus==="loading"?"#d4850f18":sheetStatus==="error"?"#b4423418":"transparent",color:sheetStatus==="synced"?"#16a34a":sheetStatus==="loading"?"#d4850f":sheetStatus==="error"?"#b44234":t.textMuted}}>{sheetStatus==="synced"?"☁️ Synced":sheetStatus==="loading"?"⏳":"📱"}</span>
            </div>
            <div style={{fontSize:16,fontWeight:700,color:t.text,lineHeight:1.2,marginTop:2}}>From Moodeng<br/>to Model</div>
          </div>
          <div style={{marginBottom:20}}>
            {[["Weight",`${WEIGHT} kg`],["Height",`${HEIGHT_CM} cm`],["BMI",BMI],["HbA1C","9.4%"],["Trig","702"],["Glucose","211"],["GGT","184"]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:`1px solid ${t.cardBorder}`}}>
                <span style={{fontSize:11,color:t.textLight}}>{l}</span>
                <span style={{fontSize:11,color:t.textMuted,fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:2,flex:1}}>
            {tabDefs.map((td,i)=>(<button key={td.label} onClick={()=>setTab(i)} style={{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:t.radiusSm,border:"none",background:tab===i?t.accent:"transparent",color:tab===i?"#fff":t.textMuted,fontSize:12,fontWeight:tab===i?700:400,cursor:"pointer",fontFamily:t.font,textAlign:"left",letterSpacing:tab===i?1:0.5}}><span style={{fontSize:15}}>{td.icon}</span><span>{td.label}</span></button>))}
          </div>
        </>}
        {!sidebarOpen&&<div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"center"}}>{tabDefs.map((td,i)=>(<button key={td.label} onClick={()=>setTab(i)} style={{width:34,height:34,borderRadius:t.radiusSm,border:"none",background:tab===i?t.accent:"transparent",color:tab===i?"#fff":t.textMuted,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{td.icon}</button>))}</div>}
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

          {/* Nutrition Needs */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 4px"}}>What Your Body Needs</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Updated Day 12: Weight ~71kg, fasting glucose 116, low-carb protocol</p>

          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:8,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Nutrient</th>
                <th style={{padding:"8px 12px",textAlign:"center",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Daily Target</th>
                <th style={{padding:"8px 12px",textAlign:"center",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Per Meal (~3)</th>
                <th style={{padding:"8px 12px",textAlign:"left",fontSize:12,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600}}>Why</th>
              </tr></thead>
              <tbody>
                {[
                  ["🥩 Protein","80-100g","27-33g","35-40% of calories. Preserves muscle, controls hunger. Don't overdo — excess converts to glucose (gluconeogenesis) and raises uric acid.",t.ok],
                  ["🥑 Healthy Fat","70-90g","23-30g","35-40% of calories. PRIMARY fuel source on low-carb. Slows digestion, absorbs D3/K2. Eat MORE fat not less — chicken skin, salmon, nuts, avocado, olive oil.",t.ok],
                  ["🍚 Carbs","40-60g","13-20g","20-25% of calories. From vegetables, berries, small sweet potato only. Always eat LAST.",t.warn],
                  ["🌾 Fiber","25-35g","8-12g","Slows sugar absorption, feeds gut bacteria, lowers trig",t.ok],
                  ["💧 Water","2-2.5L","8-10 glasses","Flushes toxins, prevents false hunger, helps kidneys. Extra important on low-carb.",t.ok],
                ].map(([n,daily,meal,why,color],i)=>(
                  <tr key={i} style={{background:i%2===0?t.card:t.bg}}>
                    <td style={{padding:"8px 12px",fontSize:13,fontWeight:700}}>{n}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:14,fontWeight:800,color}}>{daily}</td>
                    <td style={{padding:"8px 12px",textAlign:"center",fontSize:13,color:t.textMuted}}>{meal}</td>
                    <td style={{padding:"8px 12px",fontSize:11,color:t.textMuted,lineHeight:1.4}}>{why}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick portion guide - separated by nutrient */}
          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,padding:"10px 14px",marginBottom:12}}>
            <div style={{fontSize:12,fontWeight:700,color:t.text,marginBottom:6}}>Quick portion guide (per meal)</div>
            {[
              ["🥩","30g protein","4 eggs, or 120g chicken thigh (with skin!), or 150g salmon, or 200g tofu"],
              ["🥑","25g fat","1 tbsp olive/coconut oil + 10 almonds, or 1/2 avocado, or handful macadamia"],
              ["🍚","15g carbs","1 cup vegetables, or 1/4 small sweet potato, or 1/2 cup berries"],
              ["🌾","10g fiber","1 cup broccoli + 1 tbsp basil seeds (เม็ดแมงลัก)"],
            ].map(([icon,label,detail],i)=>(
              <div key={i} style={{display:"flex",gap:8,padding:"4px 0",borderBottom:i<3?`1px solid ${t.cardBorder}33`:"none"}}>
                <span style={{fontSize:13}}>{icon}</span>
                <span style={{fontSize:12,fontWeight:700,color:t.accent,minWidth:85}}>{label}</span>
                <span style={{fontSize:12,color:t.textMuted}}>{detail}</span>
              </div>
            ))}
          </div>

          {/* Sugar journey - title outside, rows */}
          <div style={{fontSize:13,fontWeight:700,color:t.danger,marginBottom:6}}>🚫 Added Sugar Limit</div>
          <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,marginBottom:20,overflow:"hidden"}}>
            {[
              ["Day 1-30","0g","Zero added sugar. Reset phase. Trig and glucose drop fastest here."],
              ["Day 31-60","max 10g","Only if fasting glucose < 100 and trig < 300. That's 2 tsp or 2 squares dark chocolate."],
              ["Day 61-90","max 15g","Only if trig < 200 and glucose < 95. Use stevia for drinks."],
            ].map(([phase,amt,note],i)=>(
              <div key={i} style={{padding:"10px 14px",display:"flex",gap:12,alignItems:"center",borderBottom:i<2?`1px solid ${t.dangerBorder}`:"none"}}>
                <div style={{fontSize:12,fontWeight:700,color:t.danger,minWidth:75}}>{phase}</div>
                <div style={{fontSize:18,fontWeight:800,color:t.danger,minWidth:55}}>{amt}</div>
                <div style={{fontSize:12,color:t.text,lineHeight:1.4,flex:1}}>{note}</div>
              </div>
            ))}
          </div>

          {/* Food Hacks */}
          <div style={{fontSize:13,fontWeight:700,color:t.accent,marginBottom:6,marginTop:14}}>💡 Food Hacks</div>
          <div style={{border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:20,overflow:"hidden"}}>
            {[
              {tip:"🥗 Eating order matters", detail:"Fiber/veggies first → protein → fat → carbs LAST. This alone can reduce glucose spike up to 40%. The same food in different order = different spike."},
              {tip:"🍫 Snack plate for cravings", detail:"85% dark chocolate squares + almonds + berries + cucumber slices. Looks beautiful, feels like a treat, low spike."},
              {tip:"🍲 Soup = secret weapon", detail:"ต้มจืด, แกงจืด, bone broth with veggies. Warm soup fills the stomach, very low calorie, and triggers fullness hormones fast."},
            ].map((h,i)=>(
              <div key={i} style={{padding:"10px 14px",borderBottom:i<2?`1px solid ${t.cardBorder}`:"none",background:i%2===0?t.card:t.bg}}>
                <div style={{fontSize:13,fontWeight:700,color:t.text}}>{h.tip}</div>
                <div style={{fontSize:12,color:t.textMuted,marginTop:3,lineHeight:1.5}}>{h.detail}</div>
              </div>
            ))}
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
                ["Sweet potato มันหวาน","44"],
                ["Oats ข้าวโอ๊ต","40"],
                ["Low GI rice","54"],
                ["Basmati rice","50"],
                ["Glass noodle วุ้นเส้น","39"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<7?`1px solid ${t.okBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.ok,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT</div>
              {[
                ["Rice berry ข้าวไรซ์เบอร์รี่","62"],
                ["Brown rice ข้าวกล้อง","68"],
                ["Corn ข้าวโพด","52"],
                ["Pumpkin ฟักทอง","64"],
                ["Taro เผือก","53"],
                ["Potato มันฝรั่ง","58"],
                ["Oat milk นมข้าวโอ๊ต","60"],
              ].map(([name,gi],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<6?`1px solid ${t.warnBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.warn,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID</div>
              {[
                ["Jasmine rice ข้าวหอมมะลิ","89"],
                ["Sticky rice ข้าวเหนียว","87"],
                ["White bread ขนมปัง","75"],
                ["Pastries/croissant","70"],
                ["Instant noodle มาม่า","73"],
                ["Boiled potato (mashed)","78"],
                ["Rice porridge โจ๊ก","83"],
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
                ["Guava ฝรั่ง","12","1"],
                ["Cherries","22","3"],
                ["Strawberries","25","1"],
                ["Blueberries","25","4"],
                ["Plum","24","2"],
                ["Grapefruit","25","3"],
                ["Dried apricot","30","8"],
                ["Apple","36","5"],
                ["Pear","38","4"],
              ].map(([name,gi,gl],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<8?`1px solid ${t.okBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.ok,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            {/* MODERATE */}
            <div style={{border:`1px solid ${t.warnBorder}`,borderRadius:t.radiusSm,background:t.warnBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.warn,marginBottom:8,textAlign:"center"}}>⚠️ LIMIT (GI 40-59)</div>
              {[
                ["Orange","43","5"],
                ["Peach","42","5"],
                ["Dragon fruit แก้วมังกร","48","7"],
                ["Kiwi","50","5"],
                ["Mango มะม่วง","51","8"],
                ["Banana กล้วย","51","13"],
                ["Grapes","46","8"],
                ["Longan ลำไย","48","10"],
                ["Papaya มะละกอ","56","8"],
              ].map(([name,gi,gl],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<8?`1px solid ${t.warnBorder}33`:"none"}}>
                <span style={{fontSize:11,color:t.text,fontWeight:600}}>{name}</span>
                <span style={{fontSize:10,color:t.warn,fontWeight:700}}>GI {gi}</span>
              </div>))}
            </div>
            {/* AVOID */}
            <div style={{border:`1px solid ${t.dangerBorder}`,borderRadius:t.radiusSm,background:t.dangerBg,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:800,color:t.danger,marginBottom:8,textAlign:"center"}}>🚫 AVOID (GI 60+)</div>
              {[
                ["Pineapple สับปะรด","66","12"],
                ["Watermelon แตงโม","72","5"],
                ["Ripe banana","70","16"],
                ["Lychee ลิ้นจี่","57","12"],
                ["Rambutan เงาะ","59","12"],
                ["Durian ทุเรียน","44*","18"],
              ].map(([name,gi,gl],i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",borderBottom:i<5?`1px solid ${t.dangerBorder}33`:"none"}}>
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

          {/* Supplements — single column with priority colors */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 4px"}}>Supplements</h3>
          <p style={{color:t.textMuted,fontSize:12,marginBottom:10}}>Berberine + fish oil WITH meals · Basil seeds BEFORE · Mg + D3/K2 BEDTIME</p>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {supps.map((s,i)=>{const isO=expandedSupp===i;const pc=prioColors[s.p]||t.accent;return(<div key={s.name} onClick={()=>setExpandedSupp(isO?null:i)} style={{background:t.card,border:`1px solid ${isO?pc+"44":t.cardBorder}`,borderRadius:t.radiusSm,padding:"12px 14px",cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:22}}>{s.icon}</span>
                <div style={{flex:1}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{fontWeight:700,fontSize:15}}>{s.name}</span>
                    <span style={{fontSize:10,padding:"2px 7px",borderRadius:t.radiusSm,background:pc+"18",color:pc,fontWeight:700,border:`1px solid ${pc}33`}}>{s.p}</span>
                  </div>
                  <div style={{fontSize:13,color:t.textMuted}}>{s.dose}</div>
                </div>
                <div style={{textAlign:"right",fontSize:12}}>
                  <div style={{color:t.danger}}>Trig: {s.trig}</div>
                  <div style={{color:t.ok}}>A1C: {s.hb}</div>
                </div>
              </div>
              {isO&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${t.cardBorder}`,fontSize:13,color:t.text,lineHeight:1.5}}>{s.notes}</div>}
            </div>);})}
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
          <h2 style={{fontSize:20,fontWeight:700,margin:"0 0 4px"}}>Weekly Tracker</h2>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <button onClick={()=>shiftW(-1)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>◀</button>
            <span style={{fontSize:14,fontWeight:700,color:t.accent}}>{new Date(weekDates[0]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})} — {new Date(weekDates[6]).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</span>
            <button onClick={()=>shiftW(1)} style={{background:"none",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,padding:"4px 10px",cursor:"pointer",fontSize:14,color:t.text}}>▶</button>
          </div>

          {/* Single unified table like the Google Sheet */}
          <div style={{overflowX:"auto",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:20}}>
            <table style={{borderCollapse:"collapse",width:"100%",minWidth:7*70+130}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{position:"sticky",left:0,background:t.sidebarBg,zIndex:2,padding:"7px 8px",fontSize:11,color:t.textMuted,textAlign:"left",borderBottom:`1px solid ${t.cardBorder}`,borderRight:`1px solid ${t.cardBorder}`,minWidth:130}}></th>
                {weekDates.map((d,i)=>(<th key={d} style={{padding:"7px 3px",fontSize:11,color:t.accent,textAlign:"center",borderBottom:`1px solid ${t.cardBorder}`,minWidth:62,fontWeight:700}}><div>{dn[i]}</div><div style={{fontWeight:400,color:t.textLight,fontSize:10}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
              </tr></thead>
              <tbody>
                {trackerRows.map((row,ri)=>{
                  const prevSection = ri>0 ? trackerRows[ri-1].section : null;
                  const showDivider = row.section !== prevSection && ri > 0;
                  const wd = (d) => weekData[d]||{};
                  return(<React.Fragment key={row.field}>
                    {showDivider && <tr><td colSpan={8} style={{height:2,background:t.accent+"33",padding:0}}></td></tr>}
                    <tr style={{background:ri%2===0?t.card:t.bg}}>
                      <td style={{position:"sticky",left:0,background:ri%2===0?t.card:t.bg,zIndex:1,padding:"4px 8px",fontSize:11,color:t.text,fontWeight:600,borderRight:`1px solid ${t.cardBorder}`,whiteSpace:"nowrap"}}>{row.label}</td>
                      {weekDates.map(d=>{
                        const val = wd(d)[row.field]||"";
                        if(row.type==="check"){
                          const on = !!wd(d)[row.field];
                          return(<td key={d} onClick={()=>upWD(d,row.field,!on)} style={{padding:"3px",textAlign:"center",cursor:"pointer"}}>
                            <div style={{width:22,height:22,borderRadius:4,margin:"0 auto",background:on?t.accent:"transparent",border:on?"none":`1px solid ${t.cardBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>{on&&<span style={{fontSize:12,color:"#fff"}}>✓</span>}</div>
                          </td>);
                        }
                        if(row.type==="select"){
                          return(<td key={d} style={{padding:"2px 2px"}}><select value={val} onChange={e=>upWD(d,row.field,e.target.value)} style={{...inp,padding:"3px 2px",fontSize:10,width:"100%",minWidth:50}}><option value="">—</option>{(row.opts||[]).map(o=><option key={o} value={o}>{o}</option>)}</select></td>);
                        }
                        const isGluc = row.section==="glucose" && val;
                        const glucColor = isGluc ? (Number(val)<=99?t.ok:Number(val)<=140?"#d4850f":t.danger) : t.text;
                        return(<td key={d} style={{padding:"2px 2px"}}><input type={row.type==="number"?"text":row.type} inputMode={row.type==="number"?"numeric":undefined} placeholder={row.ph} value={val} onChange={e=>upWD(d,row.field,e.target.value)} style={{...inp,padding:"3px 4px",fontSize:11,width:"100%",minWidth:50,color:isGluc?glucColor:t.text,fontWeight:isGluc?700:400}}/></td>);
                      })}
                    </tr>
                  </React.Fragment>);
                })}
                {/* Habit Score row */}
                <tr><td colSpan={8} style={{height:2,background:t.accent+"33",padding:0}}></td></tr>
                <tr style={{background:t.accentBg}}>
                  <td style={{position:"sticky",left:0,background:t.accentBg,zIndex:1,padding:"6px 8px",fontSize:12,color:t.accent,fontWeight:800,borderRight:`1px solid ${t.cardBorder}`}}>Score</td>
                  {weekDates.map(d=>{
                    const wd2=weekData[d]||{};
                    let day_t=0,day_p=0;
                    ["berb","fish","mag","d3k2"].forEach(f=>{day_p++;if(wd2[f]&&wd2[f]!=="0")day_t++;});
                    ["basil","brazil","probio","noSweet","fiberFirst","if14","water"].forEach(f=>{day_p++;if(wd2[f])day_t++;});
                    day_p++;if(wd2.moveAfter)day_t++;
                    day_p++;if(wd2.act)day_t++;
                    day_p++;if(wd2.sleep==="7+"||wd2.sleep==="8+")day_t++;
                    const pct=day_p>0?Math.round((day_t/day_p)*100):0;
                    const sc=pct>=80?t.ok:pct>=50?"#d4850f":pct>0?t.danger:t.textLight;
                    return(<td key={d} style={{padding:"6px 4px",textAlign:"center",fontSize:13,fontWeight:800,color:sc}}>{pct>0?`${pct}%`:"—"}</td>);
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Body Measurements — weekly date format matching tracker */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 8px"}}>Body Measurements</h3>
          <p style={{color:t.textMuted,fontSize:11,marginBottom:8}}>Measure morning before eating. Tape at widest point.</p>
          <div style={{overflowX:"auto",border:`1px solid ${t.cardBorder}`,borderRadius:t.radiusSm,background:t.card,marginBottom:10}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr style={{background:t.sidebarBg}}>
                <th style={{padding:"6px 10px",textAlign:"left",fontSize:11,color:t.textMuted,borderBottom:`1px solid ${t.cardBorder}`,minWidth:110}}></th>
                {weekDates.map((d,i)=>(<th key={d} style={{padding:"6px 3px",textAlign:"center",fontSize:10,color:t.accent,borderBottom:`1px solid ${t.cardBorder}`,fontWeight:600,minWidth:55}}><div style={{fontWeight:700}}>{dn[i]}</div><div style={{fontWeight:400,color:t.textLight,fontSize:9}}>{new Date(d).toLocaleDateString("en-GB",{day:"numeric",month:"short"})}</div></th>))}
              </tr></thead>
              <tbody>{[
                {label:"⚖️ Weight (kg)",field:"weight"},
                {label:"📏 Waist (cm)",field:"waist"},
                {label:"📏 Belly (cm)",field:"belly"},
                {label:"📏 Hip (cm)",field:"hip"},
                {label:"📐 Waist:Hip",field:"whr"},
                {label:"💪 Upper Arm",field:"arm"},
                {label:"🦵 Thigh (cm)",field:"thigh"},
                {label:"🦶 Calve (cm)",field:"calve"},
                {label:"📏 Chest (cm)",field:"chest"},
                {label:"📏 Neck (cm)",field:"neck"},
                {label:"📏 Shoulder",field:"shoulder"},
              ].map((row,i)=>(
                <tr key={row.field} style={{background:i%2===0?t.card:t.bg}}>
                  <td style={{padding:"4px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>{row.label}</td>
                  {weekDates.map(d=>(
                    <td key={d} style={{padding:"2px 2px"}}>
                      <input type="text" value={(bodyMeas[`${row.field}-${d}`])||""} onChange={e=>{const val=e.target.value;setBodyMeas(p=>{const n={...p,[`${row.field}-${d}`]:val};try{localStorage.setItem("ge_bodyMeas",JSON.stringify(n))}catch{};const bodyForDate={};Object.keys(n).forEach(k=>{if(k.endsWith("-"+d)){const field=k.split("-")[0];bodyForDate[field]=n[k];}});queueSave(d,bodyForDate,"body");return n;});}} style={{...inp,textAlign:"center",padding:"4px 2px",background:"transparent",border:`1px solid ${t.cardBorder}44`,borderRadius:6,fontSize:11,width:"100%"}}/>
                    </td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* ══ WEEKLY INSIGHT ══ */}
          <h3 style={{fontSize:15,fontWeight:700,margin:"0 0 8px"}}>Weekly Insight</h3>
          {(()=>{
            // Build week-by-week data from protocol start
            const startDate = new Date("2026-03-02"); // Day 1
            const today = new Date();
            const weeks = [];
            let ws = new Date(startDate);
            let wNum = 1;
            while(ws <= today) {
              const we = new Date(ws); we.setDate(we.getDate()+6);
              const wDates = [];
              for(let i=0;i<7;i++){const dd=new Date(ws);dd.setDate(dd.getDate()+i);wDates.push(dd.toISOString().split("T")[0]);}
              weeks.push({num:wNum,start:new Date(ws),end:we>today?today:we,dates:wDates});
              ws.setDate(ws.getDate()+7);
              wNum++;
            }
            // Current week = last in list
            return weeks.reverse().map(w=>{
              const wStart=w.start.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
              const wEnd=w.end.toLocaleDateString("en-GB",{day:"numeric",month:"short"});
              // Gather glucose data for this week
              const glucVals=w.dates.map(d=>{const v=weekData[d]?.glucFast;return v?Number(v):null;}).filter(v=>v);
              const glucMin=glucVals.length?Math.min(...glucVals):null;
              const glucMax=glucVals.length?Math.max(...glucVals):null;
              const glucAvg=glucVals.length?Math.round(glucVals.reduce((a,b)=>a+b,0)/glucVals.length):null;
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
              // Get body measurements for this week
              const bmFields=["weight","waist","hip","whr","belly","neck","chest"];
              const bm={};
              bmFields.forEach(f=>{
                for(let i=w.dates.length-1;i>=0;i--){
                  const v=bodyMeas[`${f}-${w.dates[i]}`];
                  if(v){bm[f]=v;break;}
                }
              });
              // Get clinical notes for this week
              const weekNoteKeys=Object.keys(clinicalNotes).filter(k=>{
                // Match note keys that fall in this week's date range
                const dateMatch=k.match(/(\d+)\s+(Mar|Feb)/i);
                if(dateMatch){
                  const day=parseInt(dateMatch[1]);
                  const startDay=w.start.getDate();
                  const endDay=w.end.getDate();
                  return day>=startDay&&day<=endDay;
                }
                return false;
              });
              const wNotes=weekNoteKeys.flatMap(k=>clinicalNotes[k]||[]);
              
              return(
              <Card key={w.num} style={{marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                  <div style={{fontSize:14,fontWeight:700,color:t.accent}}>W{w.num} <span style={{fontWeight:400,fontSize:12,color:t.textMuted}}>{wStart} – {wEnd}</span></div>
                  <div style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:habPct>=80?t.okBg:habPct>=50?t.warnBg:t.dangerBg,color:habPct>=80?t.ok:habPct>=50?t.warn:t.danger,fontWeight:700}}>{habPct>0?`${habPct}% habits`:"—"}</div>
                </div>
                
                {/* Glucose summary */}
                {glucVals.length>0&&(
                  <div style={{display:"flex",gap:12,marginBottom:8,flexWrap:"wrap"}}>
                    <div style={{fontSize:11}}><span style={{color:t.textMuted}}>Fasting avg:</span> <span style={{fontWeight:700,color:glucAvg<=99?t.ok:glucAvg<=140?"#d4850f":t.danger}}>{glucAvg}</span></div>
                    <div style={{fontSize:11}}><span style={{color:t.textMuted}}>Range:</span> <span style={{fontWeight:600}}>{glucMin}–{glucMax}</span></div>
                    <div style={{fontSize:11}}><span style={{color:t.textMuted}}>Days tracked:</span> <span style={{fontWeight:600}}>{glucVals.length}/7</span></div>
                  </div>
                )}

                {/* Body measurements if available */}
                {Object.keys(bm).length>0&&(
                  <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                    {bm.weight&&<span style={{fontSize:11,padding:"2px 6px",background:t.bg,borderRadius:4,border:`1px solid ${t.cardBorder}`}}>⚖️ {bm.weight}kg (BMI {(bm.weight/((167/100)**2)).toFixed(1)})</span>}
                    {bm.waist&&<span style={{fontSize:11,padding:"2px 6px",background:t.bg,borderRadius:4,border:`1px solid ${t.cardBorder}`}}>📏 Waist {bm.waist}</span>}
                    {bm.hip&&<span style={{fontSize:11,padding:"2px 6px",background:t.bg,borderRadius:4,border:`1px solid ${t.cardBorder}`}}>📏 Hip {bm.hip}</span>}
                    {bm.whr&&<span style={{fontSize:11,padding:"2px 6px",background:(parseFloat(bm.whr)>0.85?"#b4423415":parseFloat(bm.whr)>0.80?"#d4850f15":"#16a34a15"),borderRadius:4,border:`1px solid ${parseFloat(bm.whr)>0.85?"#b4423433":parseFloat(bm.whr)>0.80?"#d4850f33":"#16a34a33"}`}}>📐 WHR {bm.whr}</span>}
                    {bm.neck&&<span style={{fontSize:11,padding:"2px 6px",background:t.bg,borderRadius:4,border:`1px solid ${t.cardBorder}`}}>Neck {bm.neck}</span>}
                  </div>
                )}

                {/* Notes from clinical notes */}
                {wNotes.length>0&&(
                  <div style={{display:"flex",flexDirection:"column",gap:4}}>
                    {wNotes.slice(0,4).map((n,ni)=>{const tx2=n.sev==="critical"?t.danger:n.sev==="warning"?t.warn:t.ok;return(
                      <div key={ni} style={{fontSize:11,color:t.text,lineHeight:1.4,display:"flex",gap:6,alignItems:"flex-start"}}>
                        <span style={{fontSize:13,flexShrink:0}}>{n.icon}</span>
                        <div><span style={{fontWeight:700,color:tx2}}>{n.title}:</span> {n.text}</div>
                      </div>
                    );})}
                  </div>
                )}

                {/* Insights for this week */}
                {glucVals.length===0&&Object.keys(bm).length===0&&wNotes.length===0&&(
                  <div style={{fontSize:11,color:t.textMuted,fontStyle:"italic"}}>No data recorded this week yet.</div>
                )}
              </Card>
              );
            });
          })()}


        </div>)}

      </div>
    </div>
  );
}
