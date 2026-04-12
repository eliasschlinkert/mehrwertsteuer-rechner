function shake(el) {
  el.classList.remove("shake");
  void el.offsetWidth;
  el.classList.add("shake");
  el.addEventListener("animationend", () => el.classList.remove("shake"), { once: true });
}

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

let rate = null;
let mode = null;

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
  modeLabel.textContent = "";
}

function parseEuroInput(s) {
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
  customRateInput.value = "";
  customRateInput.classList.remove("active");
  updateModeLabel();
  calcVat();
}

const modeLabel = document.getElementById("modeLabel");

function updateModeLabel() {
  if (mode === null) { modeLabel.textContent = ""; return; }
  const verb = mode === "add" ? "hinzugefügt" : "abgezogen";
  const isCustom = customRateInput.value !== "" &&
                   !r7.classList.contains("active") &&
                   !r19.classList.contains("active");
  modeLabel.textContent = isCustom
    ? Math.round(rate * 100) + "% " + verb
    : "MwSt. " + verb;
}

function setMode(newMode, activeBtn, inactiveBtn) {
  mode = newMode;
  activeBtn.classList.add("active");
  activeBtn.setAttribute("aria-pressed", "true");
  inactiveBtn.classList.remove("active");
  inactiveBtn.setAttribute("aria-pressed", "false");
  updateModeLabel();
  calcVat();
}

priceIn.addEventListener("input", () => {
  if (countDigits(priceIn.value) < MAX_DIGITS) hidePriceError();
  calcVat();
});

priceIn.addEventListener("beforeinput", (e) => {
  if (!e.data) return;

  if (e.data === ".") {
    e.preventDefault();
    const s = priceIn.selectionStart ?? priceIn.value.length;
    const f = priceIn.selectionEnd   ?? priceIn.value.length;
    if (countDigits(priceIn.value.substring(0, s)) === 0) { shake(priceIn); return; }
    if (priceIn.value.includes(",")) { shake(priceIn); return; }
    priceIn.value = priceIn.value.substring(0, s) + "," + priceIn.value.substring(f);
    priceIn.setSelectionRange(s + 1, s + 1);
    if (countDigits(priceIn.value) < MAX_DIGITS) hidePriceError();
    calcVat();
    return;
  }

  if (!/^[0-9,]+$/.test(e.data)) { e.preventDefault(); shake(priceIn); return; }

  if (e.data === ",") {
    const cursorPos = priceIn.selectionStart ?? priceIn.value.length;
    if (countDigits(priceIn.value.substring(0, cursorPos)) === 0) { e.preventDefault(); shake(priceIn); return; }
  }

  if (e.data === "," && priceIn.value.includes(",")) { e.preventDefault(); shake(priceIn); return; }

  if (e.data === "0") {
    const cursorPos = priceIn.selectionStart ?? priceIn.value.length;
    if (countDigits(priceIn.value.substring(0, cursorPos)) === 0) {
      e.preventDefault();
      shake(priceIn);
      return;
    }
  }

  if (/^[0-9]$/.test(e.data)) {
    const val      = priceIn.value;
    const selStart = priceIn.selectionStart ?? val.length;
    const selEnd   = priceIn.selectionEnd   ?? val.length;
    const commaIdx = val.indexOf(",");
    if (commaIdx !== -1 && selStart > commaIdx) {
      const afterCommaDigits = (val.substring(commaIdx + 1).match(/[0-9]/g) || []).length;
      const selDigits        = (val.substring(selStart, selEnd).match(/[0-9]/g) || []).length;
      if (afterCommaDigits - selDigits + 1 > 2) { e.preventDefault(); shake(priceIn); return; }
    }
  }
});

priceIn.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Dead") { e.preventDefault(); shake(priceIn); return; }
  if (e.key.length > 1) return;
  if (!/^[0-9,.]$/.test(e.key)) {
    e.preventDefault();
    shake(priceIn);
    return;
  }
  if (e.key === "." || e.key === ",") {
    if (countDigits(priceIn.value.substring(0, priceIn.selectionStart)) === 0) {
      e.preventDefault(); shake(priceIn); return;
    }
    return;
  }
  if (/^[0-9]$/.test(e.key)) {
    const val      = priceIn.value;
    const selStart = priceIn.selectionStart;
    const selEnd   = priceIn.selectionEnd;
    const textBeforeCursor = val.substring(0, selStart);
    if (e.key === "0" && countDigits(textBeforeCursor) === 0) {
      e.preventDefault();
      shake(priceIn);
      return;
    }
    const selText   = val.substring(selStart, selEnd);
    const netDigits = countDigits(val) - countDigits(selText) + 1;
    if (netDigits > MAX_DIGITS) {
      e.preventDefault();
      showPriceError();
      return;
    }
    const commaIdx = val.indexOf(",");
    if (commaIdx !== -1 && selStart > commaIdx) {
      const afterCommaDigits = (val.substring(commaIdx + 1).match(/[0-9]/g) || []).length;
      const selDigits        = (selText.match(/[0-9]/g) || []).length;
      if (afterCommaDigits - selDigits + 1 > 2) {
        e.preventDefault();
        shake(priceIn);
        return;
      }
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
  if (e.data && !/^[0-9]+$/.test(e.data)) { e.preventDefault(); shake(customRateWrap); return; }
  if (e.data === "0") {
    const cursorPos = customRateInput.selectionStart ?? customRateInput.value.length;
    if (customRateInput.value.substring(0, cursorPos).length === 0) {
      e.preventDefault();
      shake(customRateWrap);
    }
  }
});

customRateInput.addEventListener("keydown", (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Dead") { e.preventDefault(); shake(customRateWrap); return; }
  if (e.key.length > 1) return;
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
    shake(customRateWrap);
    return;
  }
  const selLen = customRateInput.selectionEnd - customRateInput.selectionStart;
  if (e.key === "0" && customRateInput.value.length - selLen === 0) {
    e.preventDefault();
    shake(customRateWrap);
    return;
  }
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
    rate = null;
    updateModeLabel();
    calcVat();
    return;
  }
  if (val >= 1 && val <= 999) {
    rate = val / 100;
    customRateInput.classList.add("active");
    r7.classList.remove("active");  r7.setAttribute("aria-pressed", "false");
    r19.classList.remove("active"); r19.setAttribute("aria-pressed", "false");
    updateModeLabel();
    calcVat();
  }
});

addBtn.addEventListener("click",    () => setMode("add",    addBtn, removeBtn));
removeBtn.addEventListener("click", () => setMode("remove", removeBtn, addBtn));

clearAll.addEventListener("click", () => {
  resetAll();
  priceIn.focus();
});

const copyBtn   = document.getElementById("copyBtn");
const copyToast = document.getElementById("copyToast");
let copyTimeout = null;

copyBtn.addEventListener("click", () => {
  const raw = result.textContent.replace(/\./g, "").replace(/[€\s]/g, "");
  if (raw === "0" || raw === "") return;

  if (!navigator.clipboard) return;
  navigator.clipboard.writeText(raw).then(() => {
    copyBtn.classList.add("copied");
    clearTimeout(copyTimeout);
    copyTimeout = setTimeout(() => copyBtn.classList.remove("copied"), 1500);

    copyToast.classList.remove("show");
    void copyToast.offsetWidth;
    copyToast.classList.add("show");
  }).catch(() => {});
});

const overlay   = document.getElementById("overlay");
const display   = document.getElementById("calcDisplay");
const calcEl    = document.querySelector(".calc");
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
  return s.replace(/[^0-9+\-*/().]/g, "");
}

function lastNumberChunk() {
  const m = expr.match(/(\d+(\.\d*)?)$/);
  return m ? m[0] : "";
}

function appendDecimal() {
  const chunk = lastNumberChunk();
  if (chunk.includes(".")) return;
  if (chunk === "") expr += "0";
  expr += ".";
}

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

  if (key === "0" && expr === "") {
    shake(display);
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

openCalc.addEventListener("click", openCalculator);

overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeCalculator();
});

insertBtn.addEventListener("click", insertResultIntoVat);

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
    if (k.length === 1) { e.preventDefault(); shake(calcEl); }
    return;
  }

  if (e.key === "Escape") {
    e.preventDefault();
    resetAll();
    priceIn.focus();
  }
});

resetAll();
priceIn.focus();

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
