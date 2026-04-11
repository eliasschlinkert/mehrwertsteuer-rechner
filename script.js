// ---------- Hilfsfunktionen ----------
function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth; // Reflow erzwingt Neustart der Animation
  el.classList.add("shake");
  el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
}

// ---------- MwSt ----------
const priceIn        = document.getElementById("priceIn");
const priceError     = document.getElementById("priceError");
const result         = document.getElementById("result");
const vat            = document.getElementById("vat");
const clearAll       = document.getElementById("clearAll");
const r7             = document.getElementById("r7");
const r19            = document.getElementById("r19");
const addBtn         = document.getElementById("add");
const removeBtn      = document.getElementById("remove");
const customRateInput = document.getElementById("customRate");
const customRateWrap  = customRateInput.parentElement;

let rate = null;  // kein Satz vorausgewählt
let mode = null;  // kein Modus vorausgewählt

const nf = new Intl.NumberFormat("de-DE", { style:"currency", currency:"EUR" });

const MAX_DIGITS = 6;

function countDigits(s) {
  return (s.match(/[0-9]/g) || []).length;
}

function showPriceError() {
  priceError.classList.add("visible");
  shake(priceError);
}

function hidePriceError() {
  priceError.classList.remove("visible");
}

function resetAll() {
  priceIn.value = "";
  hidePriceError();
  result.textContent = "0 €";
  vat.textContent = "0 €";
}

function parseEuroInput(s) {
  // erlaubt 1.234,56 | 1234,56 | 1234.56
  const cleaned = (s || "")
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const v = Number(cleaned);
  return Number.isFinite(v) ? v : NaN;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function calcVat() {
  // Kein Steuersatz oder kein Modus gewählt oder leere Eingabe → Standardzustand
  if (rate === null || mode === null || priceIn.value.trim() === "") {
    result.textContent = "0 €";
    vat.textContent = "0 €";
    return;
  }

  const v = parseEuroInput(priceIn.value);
  if (!Number.isFinite(v)) {
    result.textContent = "0 €";
    vat.textContent = "0 €";
    return;
  }

  let out, mw;
  if (mode === "add") {
    out = v * (1 + rate);
    mw  = out - v;
  } else {
    out = v / (1 + rate);
    mw  = v - out;
  }

  out = round2(out);
  mw  = round2(mw);

  result.textContent = nf.format(out).replace(/\s/g, "");
  vat.textContent    = nf.format(mw).replace(/\s/g, "");
}

function setRate(newRate, activeBtn, inactiveBtn) {
  rate = newRate;
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-pressed", "true");
  inactiveBtn.classList.remove("active");
  inactiveBtn.setAttribute("aria-pressed", "false");
  // Custom-Feld leeren und deaktivieren
  customRateInput.value = "";
  customRateInput.classList.remove("active");
  calcVat();
}

const modeLabel = document.getElementById("modeLabel");

function setMode(newMode, activeBtn, inactiveBtn) {
  mode = newMode;
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-pressed", "true");
  inactiveBtn.classList.remove("active");
  inactiveBtn.setAttribute("aria-pressed", "false");
  modeLabel.textContent = newMode === "add" ? "MwSt. hinzugefügt" : "MwSt. abgezogen";
  calcVat();
}

priceIn.addEventListener("input", () => {
  if (countDigits(priceIn.value) < MAX_DIGITS) hidePriceError();
  calcVat();
});

// Preisfeld: nur Ziffern, Komma und Punkt; max. 6 Ziffern
priceIn.addEventListener("beforeinput", (e) => {
  if (e.data && !/^[0-9,.]+$/.test(e.data)) { e.preventDefault(); shake(priceIn); }
});

// e.key.length > 1 → Sonder-/Steuertaste (Shift, Enter, Backspace, F1 …) → ignorieren
priceIn.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Dead") { e.preventDefault(); shake(priceIn); return; }
  if (e.key.length > 1) return;
  if (!/^[0-9,.]$/.test(e.key)) {
    e.preventDefault();
    shake(priceIn);
    return;
  }
  if (/^[0-9]$/.test(e.key)) {
    const selText    = priceIn.value.substring(priceIn.selectionStart, priceIn.selectionEnd);
    const netDigits  = countDigits(priceIn.value) - countDigits(selText) + 1;
    if (netDigits > MAX_DIGITS) {
      e.preventDefault();
      showPriceError();
    }
  }
});
priceIn.addEventListener("paste", (e) => {
  const text = (e.clipboardData || window.clipboardData).getData("text");
  if (!/^[0-9,.]*$/.test(text)) {
    e.preventDefault();
    shake(priceIn);
    return;
  }
  const selText   = priceIn.value.substring(priceIn.selectionStart, priceIn.selectionEnd);
  const newVal    = priceIn.value.substring(0, priceIn.selectionStart) + text + priceIn.value.substring(priceIn.selectionEnd);
  if (countDigits(newVal) > MAX_DIGITS) {
    e.preventDefault();
    showPriceError();
  }
});

r7.addEventListener("click",  () => setRate(0.07, r7,  r19));
r19.addEventListener("click", () => setRate(0.19, r19, r7));

customRateInput.addEventListener("beforeinput", (e) => {
  if (e.data && !/^[0-9]+$/.test(e.data)) { e.preventDefault(); shake(customRateWrap); }
});

// Custom-Steuersatz: nur Ziffern, max 3 Zeichen
customRateInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Dead") { e.preventDefault(); shake(customRateWrap); return; }
  if (e.key.length > 1) return;
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    shake(customRateWrap);
    return;
  }
  // Würde 4. Stelle entstehen? (Selektion berücksichtigen)
  const selLen = customRateInput.selectionEnd - customRateInput.selectionStart;
  if (customRateInput.value.length - selLen >= 3) {
    e.preventDefault();
    shake(customRateWrap);
  }
});
customRateInput.addEventListener("paste", (e) => {
  e.preventDefault();
  shake(customRateWrap);
});
customRateInput.addEventListener("input", () => {
  const val = parseInt(customRateInput.value, 10);
  if (!customRateInput.value) {
    customRateInput.classList.remove("active");
    return;
  }
  if (val >= 1 && val <= 999) {
    rate = val / 100;
    customRateInput.classList.add("active");
    r7.classList.remove("active");  r7.setAttribute("aria-pressed", "false");
    r19.classList.remove("active"); r19.setAttribute("aria-pressed", "false");
    calcVat();
  }
});

addBtn.addEventListener("click",    () => setMode("add",    addBtn, removeBtn));
removeBtn.addEventListener("click", () => setMode("remove", removeBtn, addBtn));

clearAll.addEventListener("click", () => {
  resetAll();
  priceIn.focus();
});

// Copy-Button: kopiert Ergebnis ohne Punkte und €-Zeichen, nur Komma bleibt
const copyBtn = document.getElementById("copyBtn");
let copyTimeout = null;

copyBtn.addEventListener("click", () => {
  // Punkte (Tausendertrennzeichen) und €-Zeichen entfernen, Komma behalten
  const raw = result.textContent.replace(/\./g, "").replace(/[€\s]/g, "");
  if (raw === "0" || raw === "") return;

  navigator.clipboard.writeText(raw).then(() => {
    copyBtn.classList.add("copied");
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => copyBtn.classList.remove("copied"), 1500);
  });
});

// ---------- Taschenrechner ----------
const overlay   = document.getElementById("overlay");
const display   = document.getElementById("calcDisplay");
const openCalc  = document.getElementById("openCalc");
const insertBtn = document.getElementById("insert");

let expr = "";
let lastWasEquals = false;

function isCalcOpen() {
  return overlay.classList.contains("open");
}

function openCalculator() {
  overlay.classList.add("open");
  updateCalcDisplay();
}

function closeCalculator() {
  overlay.classList.remove("open");
}

function sanitize(s) {
  // nur Mathezeichen erlaubt — verhindert Code-Injection
  return s.replace(/[^0-9+\-*/().]/g, "");
}

function lastNumberChunk() {
  const m = expr.match(/(\d+(\.\d*)?)$/);
  return m ? m[0] : "";
}

function appendDecimal() {
  const chunk = lastNumberChunk();
  if (chunk.includes(".")) return; // schon ein Dezimalpunkt in dieser Zahl
  if (chunk === "") expr += "0";
  expr += ".";
}

// Sicherer mathematischer Ausdruck-Evaluator ohne eval() / Function()
// Implementiert als rekursiver Abstiegs-Parser (Operator-Vorrang: *, / vor +, -)
function safeEval(expression) {
  const cleaned = sanitize(expression).replace(/[+\-*/.]$/, "");
  if (!cleaned) return 0;

  let pos = 0;
  const len = cleaned.length;

  function peek() { return pos < len ? cleaned[pos] : ""; }

  function parseNumber() {
    let s = "";
    while (pos < len && /[0-9.]/.test(cleaned[pos])) s += cleaned[pos++];
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function parseFactor() {
    if (peek() === "(") { pos++; const v = parseExpr(); if (peek() === ")") pos++; return v; }
    if (peek() === "-") { pos++; return -parseFactor(); }
    if (peek() === "+") { pos++; return parseFactor(); }
    return parseNumber();
  }

  function parseTerm() {
    let left = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = cleaned[pos++];
      const right = parseFactor();
      left = op === "*" ? left * right : (right !== 0 ? left / right : 0);
    }
    return left;
  }

  function parseExpr() {
    let left = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = cleaned[pos++];
      left = op === "+" ? left + parseTerm() : left - parseTerm();
    }
    return left;
  }

  try {
    const r = parseExpr();
    return Number.isFinite(r) ? r : 0;
  } catch (e) {
    return 0;
  }
}

function updateCalcDisplay() {
  display.textContent = (expr || "0").replace(/\./g, ",");
}

function insertResultIntoVat() {
  const val = safeEval(expr);
  const out = round2(val);
  priceIn.value = String(out).replace(".", ",");
  closeCalculator();
  calcVat();
  priceIn.focus();
}

function calcPress(key) {
  if (key === "C") {
    expr = "";
    lastWasEquals = false;
    updateCalcDisplay();
    return;
  }

  if (key === "=") {
    // zweites "=" nach Berechnung → Ergebnis in MwSt-Rechner übernehmen
    if (lastWasEquals) { insertResultIntoVat(); return; }
    expr = String(round2(safeEval(expr)));
    lastWasEquals = true;
    updateCalcDisplay();
    return;
  }

  if (key === ",") {
    appendDecimal();
    expr = sanitize(expr);
    lastWasEquals = false;
    updateCalcDisplay();
    return;
  }

  expr += key;
  expr = sanitize(expr);
  lastWasEquals = false;
  updateCalcDisplay();
}

document.querySelectorAll(".key").forEach(btn => {
  btn.addEventListener("click", () => calcPress(btn.dataset.key));
});

// <button> behandelt Enter/Space nativ — kein eigener keydown-Handler nötig
openCalc.addEventListener("click", openCalculator);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeCalculator();
});

insertBtn.addEventListener("click", insertResultIntoVat);

// ---------- Keyboard / Numpad / ESC / Backspace ----------
window.addEventListener("keydown", (e) => {
  if (isCalcOpen()) {
    const k = e.key;

    if (k === "Escape")    { e.preventDefault(); closeCalculator(); return; }
    if (k === "Backspace") {
      e.preventDefault();
      expr = expr.slice(0, -1);
      if (!expr) lastWasEquals = false;
      updateCalcDisplay();
      return;
    }
    if (k === "Enter")            { e.preventDefault(); calcPress("="); return; }
    if (/^[0-9]$/.test(k))       { e.preventDefault(); calcPress(k); return; }
    if ("+-*/".includes(k))       { e.preventDefault(); calcPress(k); return; }
    if (k === "," || k === ".")   { e.preventDefault(); calcPress(","); return; }
    if (k === "(" || k === ")")   { e.preventDefault(); calcPress(k); return; }
    return;
  }

  // Rechner ist NICHT offen: ESC löscht alles
  if (e.key === "Escape") {
    e.preventDefault();
    resetAll();
    priceIn.focus();
  }
});

resetAll();
priceIn.focus();

// ---------- Credit ----------
const credit      = document.getElementById("credit");
const creditHeart = document.getElementById("creditHeart");

creditHeart.addEventListener("animationend", () => {
  creditHeart.classList.remove("beating");
});

const isTouchDevice = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  creditHeart.addEventListener("click", (e) => {
    e.stopPropagation();
    const opening = !credit.classList.contains("expanded");
    credit.classList.toggle("expanded");
    if (opening) {
      creditHeart.classList.remove("beating");
      void creditHeart.offsetWidth;
      creditHeart.classList.add("beating");
    }
  });

  document.addEventListener("click", (e) => {
    if (!credit.contains(e.target)) {
      credit.classList.remove("expanded");
    }
  });
} else {
  credit.addEventListener("mouseenter", () => {
    creditHeart.classList.remove("beating");
    void creditHeart.offsetWidth;
    creditHeart.classList.add("beating");
  });
}
