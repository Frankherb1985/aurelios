// AureliOS — Single Page logic (Dashboard / Trade / Settings)

const DEFAULT_POLICY = {
  maxRiskPerTradeUSD: 150,
  maxDailyLossUSD: 400,
  maxPositionUSD: 3000
};
const STARTING_CASH = 10000;

// ------- LocalStorage Keys -------
const LS_TRADES = "aurelios_trades_v1";
const LS_NOTES  = "aurelios_notes_v1";
const LS_CASH   = "aurelios_cash_v1";
const LS_POL    = "aurelios_policy_v1";

// ------- Storage Helpers -------
const loadJSON = (k, d) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; }
};
const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const loadTrades = () => loadJSON(LS_TRADES, []);
const saveTrades = (t) => saveJSON(LS_TRADES, t);
const loadPolicy = () => loadJSON(LS_POL, DEFAULT_POLICY);
const savePolicy = (p) => saveJSON(LS_POL, p);
const loadCash = () => {
  const v = Number(localStorage.getItem(LS_CASH));
  return Number.isFinite(v) ? v : STARTING_CASH;
};
const saveCash = (n) => localStorage.setItem(LS_CASH, String(n));
const todayStr = () => new Date().toISOString().slice(0,10);

// ------- UI Helpers -------
const $ = (sel) => document.querySelector(sel);
function currency(n){ return `$${Number(n).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}`; }

function refreshHeader(){
  const cash = loadCash();
  const equity = cash;
  const eqEl = document.querySelector('[data-role="equity"]');
  const cashEl = document.querySelector('[data-role="cash"]');
  if (eqEl) eqEl.textContent = currency(equity);
  if (cashEl) cashEl.textContent = currency(cash);
}

function renderRecent(limit=10){
  const tbody = document.querySelector('[data-role="recent-trades"] tbody');
  if (!tbody) return;
  tbody.innerHTML = "";
  const trades = loadTrades().slice(-limit).reverse();
  for (const t of trades){
    const tr = document.createElement('tr');
    const cells = [
      t.date.replace('T',' ').slice(0,19),
      t.symbol, t.action, t.qty,
      currency(t.price),
      currency(t.positionUSD),
      currency(t.pnl)
    ];
    cells.forEach(v=>{ const td=document.createElement('td'); td.textContent=v; tr.appendChild(td); });
    tbody.appendChild(tr);
  }
}

function dailyLossSum(trades){
  return trades
    .filter(t => t.date.startsWith(todayStr()))
    .reduce((sum, t) => sum + (t.pnl < 0 ? -t.pnl : 0), 0);
}

function wireTradeForm(){
  const form = document.querySelector('[data-role="trade-form"]');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const policy = loadPolicy();

    const symbol = (form.querySelector('[name="symbol"]').value || "").trim().toUpperCase();
    const qty    = Number(form.querySelector('[name="qty"]').value || 0);
    const price  = Number(form.querySelector('[name="price"]').value || 0);
    const action = (form.querySelector('[name="action"]').value || "Buy").toUpperCase();

    if (!symbol || qty <= 0 || price <= 0){
      alert("Enter symbol, qty > 0, price > 0.");
      return;
    }

    const positionUSD = qty * price;
    if (positionUSD > policy.maxPositionUSD){
      alert(`❌ Blocked: position ${currency(positionUSD)} exceeds max ${currency(policy.maxPositionUSD)}`);
      return;
    }
    const trades = loadTrades();
    const dLoss = dailyLossSum(trades);
    if (dLoss >= policy.maxDailyLossUSD){
      alert(`❌ Blocked: daily loss limit reached (${currency(policy.maxDailyLossUSD)})`);
      return;
    }

    let cash = loadCash();
    if (action === "BUY")   cash -= positionUSD;
    if (action === "SELL")  cash += positionUSD;
    saveCash(cash);

    const rec = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      symbol, qty, price, action,
      positionUSD, pnl: 0, noteTag: ""
    };
    trades.push(rec);
    saveTrades(trades);

    alert(`✅ ${action} ${qty} ${symbol} @ ${currency(price)} logged`);
    refreshHeader();
    renderRecent(10);
    form.reset();
  });
}

function wireNotes(){
  const notesArea = document.querySelector('[data-role="notes-text"]');
  const saveBtn   = document.querySelector('[data-role="notes-save"]');
  if (!notesArea || !saveBtn) return;
  notesArea.value = localStorage.getItem(LS_NOTES) || "";
  saveBtn.addEventListener('click', () => {
    localStorage.setItem(LS_NOTES, notesArea.value || "");
    alert("📝 Notes saved");
  });
}

function wireSettings(){
  const pol = loadPolicy();
  const r = document.querySelector('[data-role="pol-risk"]');
  const d = document.querySelector('[data-role="pol-daily"]');
  const p = document.querySelector('[data-role="pol-position"]');
  const save = document.querySelector('[data-role="save-policy"]');
  const reset = document.querySelector('[data-role="reset-cash"]');
  if (r) r.value = pol.maxRiskPerTradeUSD;
  if (d) d.value = pol.maxDailyLossUSD;
  if (p) p.value = pol.maxPositionUSD;

  save?.addEventListener('click', () => {
    const np = {
      maxRiskPerTradeUSD: Number(r.value || 0),
      maxDailyLossUSD: Number(d.value || 0),
      maxPositionUSD: Number(p.value || 0)
    };
    savePolicy(np);
    alert("✅ Policy saved");
  });

  reset?.addEventListener('click', () => {
    if (confirm("Reset cash to starting balance?")) {
      saveCash(STARTING_CASH);
      refreshHeader();
      alert("💰 Cash reset");
    }
  });
}

function wireTabs(){
  const buttons = document.querySelectorAll('nav.tabbar [data-tab]');
  const views = {
    dashboard: document.getElementById('view-dashboard'),
    trade: document.getElementById('view-trade'),
    settings: document.getElementById('view-settings')
  };
  const show = (key) => {
    Object.values(views).forEach(v => v.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));
    views[key]?.classList.add('active');
    document.querySelector(`nav [data-tab="${key}"]`)?.classList.add('active');
    if (key === 'dashboard') renderRecent(10);
  };
  buttons.forEach(btn => btn.addEventListener('click', () => show(btn.dataset.tab)));
  show('dashboard');
}

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem(LS_CASH) === null) saveCash(STARTING_CASH);
  if (localStorage.getItem(LS_POL)  === null) savePolicy(DEFAULT_POLICY);
  refreshHeader();
  renderRecent(10);
  wireTradeForm();
  wireNotes();
  wireSettings();
  wireTabs();
});
