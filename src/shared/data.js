/* ═══════════════════════════════════════════════════════════════
   Golden Era - Shared Data
   Single source of truth. Update here, both apps reflect.
   ═══════════════════════════════════════════════════════════════ */

export const SHEET_API = "https://script.google.com/macros/s/AKfycbxWHehS2Drs5gXKPuNv1u173pLu7Mr8ZOJ7KX5pEOS4L5K-X7HOeHBN1Cw9pUt5Byf2Hw/exec";
export const DAY1 = new Date("2026-03-02");
export const HEIGHT_CM = 167;

export const TARGETS = {
  glucose: { s: 211, g: 85, u: "mg/dL", l: "Fasting Glucose" },
  trig: { s: 702, g: 100, u: "mg/dL", l: "Triglycerides" },
  weight: { s: 73.6, g: 60, u: "kg", l: "Weight" },
  bmi: { s: 26.4, g: 22, u: "", l: "BMI" },
  hba1c: { s: 9.4, g: 5.5, u: "%", l: "HbA1C" },
  ggt: { s: 184, g: 25, u: "U/L", l: "GGT" },
};

// ─── Clinical Notes (update this section with new days) ───
export const clinicalNotes = {
  "21 Mar (Day 20)": [
    { icon: "\uD83E\uDD27", sev: "ontrack", title: "Sick day 2 - fasting 88 again (2 days in normal!)", text: "Congested, exhausted, cold symptoms continue. But fasting held at 88 for the second day. Liver gap -11 (night 99 to fasting 88). The body's metabolic progress isn't lost to illness." },
    { icon: "\uD83C\uDF56", sev: "grow", title: "Comfort food test: BBQ + coke zero + candy + KOI milk tea", text: "Ate what the body craved while sick. Spiked 88 to 131 (+43) - a moderate spike, not a disaster. Walking continuously brought it back to ~110. Important: even on a bad food day, the spike was manageable." },
    { icon: "\uD83D\uDCA1", sev: "ontrack", title: "Late first meal 12:00 - natural IF while sick", text: "Slept in, no appetite in morning. Body chose rest over eating. Unintentional IF that let the liver keep processing. Sometimes illness aligns with the protocol." },
  ],
  "20 Mar (Day 19)": [
    { icon: "\u2B50", sev: "excellent", title: "Fasting 88 - back in normal range!", text: "Night 104 (Day 18) to fasting 88 = liver gap -16. After the panic bounce (101, 104), the system corrected itself. Down 123 from 211 (-58%)." },
    { icon: "\uD83E\uDD12", sev: "ontrack", title: "Sick but still consistent", text: "Fever, cold symptoms, runny nose. Took Vit C. Despite feeling unwell, maintained walks x3, berberine x2, fish oil x3, 16:8 IF. Discipline through discomfort." },
    { icon: "\uD83D\uDCC9", sev: "excellent", title: "Post-meal 109, night 99 - all in normal range", text: "Every reading today was under 110. First day where fasting, post-meal, AND night glucose were all in normal range. This is what recovery looks like." },
  ],
  "19 Mar (Day 18)": [
    { icon: "\uD83E\uDDD8", sev: "excellent", title: "Recalibrated after panic - fasting 104", text: "Reduced carbs, kept berberine x2 and fish oil x3. Numbers stabilized. Night glucose held at 104 - liver gap 0 (flat, stable)." },
    { icon: "\uD83E\uDDF9", sev: "ontrack", title: "Housework as exercise", text: "Light activity day but still moved. Post-meal walks x3 maintained. Not every day needs to be cardio - consistency matters more." },
    { icon: "\uD83E\uDDE0", sev: "excellent", title: "Mental reset complete", text: "Yesterday's panic taught a valuable lesson: the body was fine at 69 (no symptoms). Trust the protocol, don't feed the fear with sugar." },
  ],
  "18 Mar (Day 17)": [
    { icon: "\uD83D\uDE30", sev: "grow", title: "PANIC DAY - glucose dropped to 69", text: "After breakfast + spirulina/cacao/chia snacks, glucose dropped to 69. No hunger, felt fine and stable - but panicked at the number. Ate candy, spiked to 130. Then ate more carbs, spiked to 174. Had to walk extensively to bring down." },
    { icon: "\uD83D\uDCD6", sev: "ontrack", title: "Key learning: 69 was safe", text: "No shaking, no sweating, no confusion = not a hypo emergency. The body was switching to fat-burning. The panic response (eating sugar) did more damage than the low number itself." },
    { icon: "\uD83D\uDD04", sev: "grow", title: "Reactive eating triggered a cascade", text: "One candy became more carbs became 174. This is the insulin-impaired pattern: once you spike, the system struggles to recover. Walking was the only fix." },
  ],
  "17 Mar (Day 16)": [
    { icon: "\u2B50", sev: "excellent", title: "ALL-TIME LOW fasting 80 - first time in normal range", text: "Night 97 to fasting 80 = liver gap -17. Liver processed glucose beautifully overnight. Down 131 points from 211 (-62%)." },
    { icon: "\uD83D\uDE34", sev: "excellent", title: "Rest day, appetite naturally reduced", text: "Later breakfast, not hungry at lunch or dinner. Body regulating hunger signals - a sign that insulin is normalizing. Rest days are part of the protocol." },
    { icon: "\uD83D\uDCCA", sev: "excellent", title: "Triglycerides 231 - lab confirmed", text: "702 to 231 in 15 days (-67%). Pancreatitis risk eliminated. Fish oil x3 + sugar elimination + IF driving this." },
  ],
  "16 Mar (Day 15)": [
    { icon: "\uD83C\uDF89", sev: "excellent", title: "Fasting 95 - first time below 100", text: "Crossed into normal fasting range (<100). Down 116 from 211 (-55%) in 14 days. Night was 109 to fasting 95 = liver gap -14." },
    { icon: "\uD83C\uDF7D\uFE0F", sev: "excellent", title: "Breakfast: no spike. Protein meals confirmed safe", text: "Morning meal produced no glucose spike. Protein + fat meals are consistently the safest pattern." },
    { icon: "\uD83D\uDEB4", sev: "ontrack", title: "Duck boat cycling + park walk in heat", text: "Glucose spiked slightly despite movement in the heat. Heat itself can raise cortisol and glucose. Not all spikes are food-related." },
    { icon: "\uD83C\uDF6B", sev: "grow", title: "Mall dinner: cranberry soda + chocolate mousse = +37", text: "133 to 170 spike. Sugar hit even in dessert form. Walking the mall brought it back to 138. The pattern holds: sugar spikes, walking fixes." },
  ],
  "15 Mar (Day 14)": [
    { icon: "\uD83C\uDF89", sev: "excellent", title: "Fasting 108, liver gap -7", text: "Third consecutive negative liver gap. Night 115 to fasting 108. Liver is now reliably processing glucose overnight." },
    { icon: "\uD83C\uDFCA", sev: "excellent", title: "Post-swim glucose 92", text: "After cardio swim + 10 min stretching. First time approaching normal post-exercise range. Swimming remains the most powerful acute tool." },
    { icon: "\u23F0", sev: "excellent", title: "IF 18:6 achieved (10:30-16:30)", text: "Best IF ratio yet. Only 2 meals, protein-heavy, Greek yogurt. Bloating noted but glucose controlled." },
    { icon: "\uD83C\uDF75", sev: "excellent", title: "Stevia confirmed safe", text: "Thai tea + cola flavor with stevia: no glucose spike. Opens up drink variety without sugar damage." },
  ],
  "14 Mar (Day 13)": [
    { icon: "\uD83E\uDEC0", sev: "excellent", title: "Liver gap -2 (first negative in protocol)", text: "Night 120, fasting 118. Liver is now responding to insulin during sleep - a turning point in metabolic recovery." },
    { icon: "\uD83C\uDFCA", sev: "excellent", title: "Swimming: 131 to 101 (-30 pts)", text: "First reading approaching normal range through exercise alone. GLUT4 transporters bypassing insulin." },
    { icon: "\uD83C\uDF5A", sev: "grow", title: "3 spoons low GI rice: +46 spike (117 to 163)", text: "Pancreas isn't ready for rice yet. But potato handful only +20 (120 to 140). And chicken + veggies = negative delta (148 to 134). The carb threshold is very low right now." },
    { icon: "\u23F0", sev: "excellent", title: "IF 18:6 (10:30-16:30)", text: "Second consecutive 18:6 day. Extended fasting window giving liver maximum processing time." },
  ],
  "13 Mar (Day 12)": [
    { icon: "\uD83D\uDCC9", sev: "excellent", title: "Fasting 115 - new low, Score 105", text: "Down 96 from 211 (-45%). Below pre-diabetic threshold for the first time." },
    { icon: "\uD83C\uDFCA", sev: "excellent", title: "Swimming: 131 to 101", text: "Exercise-triggered GLUT4 glucose uptake. No insulin needed. The most powerful tool in the protocol." },
    { icon: "\uD83E\uDDE0", sev: "ontrack", title: "Brain work raised glucose", text: "Meeting concentration pushed glucose from 120 to 143 - not stress, but cognitive demand. Glucose fuels the brain. Came back down to 116 after berberine kicked in." },
  ],
};

// ─── Lab Markers with predictions ───
export const labMarkers = [
  { marker: "HbA1C", field: "lab_hba1c", confirmed: "9.4%", normal: "<5.7%", status: "critical", s30: "8.2-8.5%", s60: "7.0-7.5%", s90: "5.8-6.3%" },
  { marker: "Fasting Glucose", field: "lab_glucose", confirmed: "211", normal: "70-99", status: "critical", s30: "140-160", s60: "110-125", s90: "85-100" },
  { marker: "Triglycerides", field: "lab_trig", confirmed: "702", normal: "<160", status: "critical", s30: "160-180", s60: "120-140", s90: "90-110" },
  { marker: "GGT", field: "lab_ggt", confirmed: "184", normal: "9-39", status: "critical", s30: "100-130", s60: "50-70", s90: "25-40" },
  { marker: "SGPT (ALT)", field: "lab_alt", confirmed: "50", normal: "<35", status: "warning", s30: "35-40", s60: "25-30", s90: "18-25" },
  { marker: "SGOT (AST)", field: "lab_ast", confirmed: "31", normal: "<32", status: "ok", s30: "26-30", s60: "22-26", s90: "18-22" },
  { marker: "Cholesterol", field: "lab_chol", confirmed: "220", normal: "<200", status: "warning", s30: "200-210", s60: "190-200", s90: "180-195" },
  { marker: "Uric Acid", field: "lab_uric", confirmed: "7.2", normal: "2.3-6.1", status: "warning", s30: "6.2-6.5", s60: "5.5-6.0", s90: "5.0-5.5" },
  { marker: "HDL-C", field: "lab_hdl", confirmed: "45", normal: ">44", status: "ok", s30: "46-48", s60: "48-52", s90: "52-58" },
  { marker: "LDL-C", field: "lab_ldl", confirmed: "109", normal: "<130", status: "ok", s30: "105-110", s60: "100-108", s90: "95-105" },
  { marker: "Creatinine", field: "lab_creat", confirmed: "0.52", normal: "0.5-0.9", status: "ok", s30: "0.52", s60: "0.52", s90: "0.52" },
  { marker: "eGFR", field: "lab_egfr", confirmed: "130", normal: ">90", status: "ok", s30: "130", s60: "130", s90: "128" },
];

// ─── Lab Meanings (for expandable descriptions) ───
export const labMeanings = {
  "HbA1C": { what: "Average blood sugar over 3 months", why: "9.4% = uncontrolled diabetes.", risk: "Nerve/kidney/vision damage if above 8%.", fix: "Berberine, low-carb, walking, sleep 7+" },
  "Fasting Glucose": { what: "Blood sugar after 8+ hours fasting", why: "211 = severely elevated. Normal 70-99.", risk: "Damages blood vessels, nerves.", fix: "Berberine, fiber first, zero sweet drinks, IF 14:10" },
  "Triglycerides": { what: "Fat in blood from food and liver", why: "702 (4x limit). Day 15: 231 (-67%).", risk: "Pancreatitis risk cleared. Target <150.", fix: "Fish oil 3-4g/day, zero sweet drinks" },
  "GGT": { what: "Liver enzyme for damage/inflammation", why: "184 = 4.7x upper limit. Fatty liver.", risk: "Liver scarring if untreated.", fix: "Liver regenerates in 6-8 weeks. Remove sugar" },
  "SGPT (ALT)": { what: "Liver cell damage marker", why: "50 = slightly above 35 limit.", risk: "Mild. Will normalize with fatty liver resolution.", fix: "Same as GGT" },
  "SGOT (AST)": { what: "Enzyme in liver, heart, muscles", why: "31 = within normal (<32).", risk: "OK. Monitor alongside ALT.", fix: "No action needed" },
  "Cholesterol": { what: "Total LDL + HDL + VLDL", why: "220 = mildly elevated.", risk: "Will drop as trig normalizes.", fix: "Fish oil, fiber, walking" },
  "Uric Acid": { what: "Waste from breaking down purines", why: "7.2 = above 6.1 limit.", risk: "Gout flares, kidney stones.", fix: "Hydration 2L+, reduce organ meats" },
  "HDL-C": { what: "Good cholesterol", why: "45 = borderline (min 44). Target 50+.", risk: "Low HDL = higher cardio risk.", fix: "Exercise, olive oil, nuts" },
  "LDL-C": { what: "Bad cholesterol", why: "109 = within normal (<130).", risk: "OK for now.", fix: "Focus on trig and glucose first" },
  "Creatinine": { what: "Kidney waste product", why: "0.52 = perfect.", risk: "None. Kidneys healthy.", fix: "Stay hydrated" },
  "eGFR": { what: "Kidney filtration rate", why: "130 = excellent (>90 normal).", risk: "None.", fix: "Maintain hydration" },
};

// ─── Journey progress data ───
export const journeyData = [
  { label: "Fasting glucose", baseline: 211, current: 104, d30: 150, d60: 118, d90: 93, goal: 85, unit: "mg/dL", dec: 0, note: "Hit normal range Day 15 (95), Day 16 (80)" },
  { label: "Weight", baseline: 73.6, current: 70.9, d30: 69.5, d60: 66, d90: 61.5, goal: 60, unit: "kg", dec: 1, note: "5% threshold at 69.9 kg" },
  { label: "BMI", baseline: 26.4, current: 25.4, d30: 24.9, d60: 23.7, d90: 22.1, goal: 22, unit: "", dec: 1 },
  { label: "Triglycerides", baseline: 702, current: 231, d30: 170, d60: 125, d90: 95, goal: 100, unit: "mg/dL", dec: 0, note: "Day 15: 231 (-67%)" },
  { label: "HbA1C", baseline: 9.4, current: null, d30: 8.4, d60: 7.3, d90: 6.1, goal: 5.5, unit: "%", dec: 1, note: "Awaiting Day 30 lab" },
  { label: "GGT", baseline: 184, current: null, d30: 115, d60: 60, d90: 33, goal: 25, unit: "U/L", dec: 0, note: "Awaiting Day 30 lab" },
];

// ─── Chart data for prediction curves ───
export const chartData = {
  gluc: [
    { m: "26 Feb", v: 211, c: true }, { m: "2 Mar", v: 180, c: true }, { m: "3 Mar", v: 170, c: true },
    { m: "4 Mar", v: 160, c: true }, { m: "5 Mar", v: 142, c: true }, { m: "6 Mar", v: 140, c: true },
    { m: "7 Mar", v: 147, c: true }, { m: "8 Mar", v: 150, c: true }, { m: "9 Mar", v: 150, c: true },
    { m: "10 Mar", v: 123, c: true }, { m: "11 Mar", v: 120, c: true }, { m: "12 Mar", v: 123, c: true },
    { m: "13 Mar", v: 115, c: true }, { m: "14 Mar", v: 118, c: true }, { m: "15 Mar", v: 108, c: true },
    { m: "16 Mar", v: 95, c: true }, { m: "17 Mar", v: 80, c: true }, { m: "18 Mar", v: 101, c: true },
    { m: "19 Mar", v: 104, c: true }, { m: "20 Mar", v: 88, c: true }, { m: "21 Mar", v: 88, c: true },
    { m: "D30", v: 85 }, { m: "D60", v: 80 }, { m: "D90", v: 75 },
  ],
  hb: [{ m: "26 Feb", v: 9.4, c: true }, { m: "D30", v: 7.8 }, { m: "D60", v: 6.5 }, { m: "D90", v: 5.7 }],
  trig: [{ m: "26 Feb", v: 702, c: true }, { m: "16 Mar", v: 231, c: true }, { m: "D30", v: 170 }, { m: "D60", v: 125 }, { m: "D90", v: 95 }],
  wt: [{ m: "26 Feb", v: 73.6, c: true }, { m: "8 Mar", v: 71.8, c: true }, { m: "15 Mar", v: 70.9, c: true }, { m: "D30", v: 69 }, { m: "D60", v: 65 }, { m: "D90", v: 62 }],
  ggt: [{ m: "26 Feb", v: 184, c: true }, { m: "D30", v: 110 }, { m: "D60", v: 55 }, { m: "D90", v: 30 }],
  chol: [{ m: "26 Feb", v: 220, c: true }, { m: "D30", v: 205 }, { m: "D60", v: 195 }, { m: "D90", v: 187 }],
  bmi: [{ m: "26 Feb", v: 26.4, c: true }, { m: "8 Mar", v: 25.7, c: true }, { m: "15 Mar", v: 25.4, c: true }, { m: "D30", v: 24.7 }, { m: "D60", v: 23.3 }, { m: "D90", v: 22.2 }],
};

// ─── Trend data (daily tracking for charts) ───
export const trendData = {
  labels: ["D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12","D13","D14","D15","D16","D17","D18","D19","D20"],
  fasting: [180,170,160,142,140,147,150,150,123,120,123,115,118,108,95,80,101,104,88,88],
  postMeal: [null,null,null,null,null,180,217,150,160,143,150,163,140,170,148,174,127,135,109,131],
  night: [null,null,null,null,null,null,140,137,131,127,137,120,115,109,97,107,104,104,99,null],
  scores: [33,40,60,67,73,67,61,85,89,93,91,105,106,96,null,null,null,null,null,null],
  weight: { labels: ["Base","D7","D14"], data: [73.6,71.8,70.9] },
  ifHours: [14,12,14,15,15,15,12,15,15,15,14,15,18,18,17,16,16,15,16,null],
};

// ─── Helper: get latest insight (for mobile teaser) ───
export function getLatestInsight() {
  const keys = Object.keys(clinicalNotes).sort((a, b) => {
    const dA = parseInt(a.match(/Day (\d+)/)?.[1] || "0");
    const dB = parseInt(b.match(/Day (\d+)/)?.[1] || "0");
    return dB - dA;
  });
  if (keys.length === 0) return null;
  const latestKey = keys[0];
  const notes = clinicalNotes[latestKey];
  return { date: latestKey, notes };
}
