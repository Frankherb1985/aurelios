/* ===== AureliOS — Full App Logic (Frank) ===== */
const SKEY = "AURELIOS_STATE_V3";

const state = {
  cash: 10000,
  positions: [], // {symbol, qty, avg}
  trades: [],    // {time, symbol, side, qty, price, pnl}
  notes: "",
  policy: { risk: 200, daily: 500, maxPos: 5000 },
  prices: { AAPL: 177.18, TSLA: 236.75, NVDA: 917.23, MSFT: 402.54 },
  changes: { AAPL: 0.0112, TSLA: -0.0198, NVDA: 0.0085, MSFT: 0.0020 }
};

/* ---------- persistence ---------- */
function load() {
  try { Object.assign(state, JSON.parse(localStorage.getItem(SKEY)) || {}); } catch(e){}
}
function save() {
  localStorage.setItem(SKEY, JSON.stringify(state));
}

/* ---------- utils ---------- */
const $ = (sel, ctx=document) => ctx.querySelector(sel);
const $$ = (sel, ctx=document) => [...ctx.querySelectorAll(sel)];
const fmt = n => (n ?? 0).toLocaleString(undefined,{style:"currency",currency:"USD"});
const pct = n => (n>=0?"+":"") + (n*100).toFixed(2) + "%";
function equity() {
  let posVal = state.positions.reduce((a,p)=>a + (state.prices[p.symbol]||0)*p.qty,0);
  return state.cash + posVal;
}

/* ---------- dashboard render ---------- */
function renderHeader() {
  $("[data-role='equity']").textContent = fmt(equity());
  $("[data-role='cash']").textContent = fmt(state.cash);
  $("#build-time").textContent = new Date().toISOString().slice(0,16).replace("T"," ");
}

function renderWatchlist() {
  const wl = $("#watchlist");
  wl.innerHTML = "";
  const order = ["AAPL","TSLA","NVDA","MSFT"];
  order.forEach(sym=>{
    const price = state.prices[sym];
    const ch = state.changes[sym];
    const row = document.createElement("div");
    row.className = "ticker-grid";
    row.innerHTML = `
      <div class="ticker"><span class="badge">${sym[0]}</span>${sym}</div>
      <div class="price">${price.toFixed(2)}</div>
      <div class="change ${ch>=0?"pos":"neg"}">${pct(ch)}</div>
    `;
    row.classList.add("watchlist-row");
    wl.appendChild(row);
  });
}

function renderTrades() {
  const body = document.querySelector("[data-role='recent-trades'] tbody");
  body.innerHTML = "";
  state.trades.slice(-20).reverse().forEach(t=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${new Date(t.time).toLocaleTimeString()}</td>
      <td>${t.symbol}</td>
      <td>${t.side}</td>
      <td>${t.qty}</td>
      <td>${t.price.toFixed(2)}</td>
      <td>${fmt(positionValue(t.symbol))}</td>
      <td style="color:${t.pnl>=0?"#4cd964":"#ff5a5a"}">${fmt(t.pnl)}</td>
    `;
    body.appendChild(tr);
  });
}

function renderStats() {
  // daily PnL = sum of trade PnL today
  const start = new Date(); start.setHours(0,0,0,0);
  const pnl = state.trades.filter(t=>t.time>=start.getTime()).reduce((a,t)=>a+t.pnl,0);
  const wins = state.trades.filter(t=>t.pnl>0).length;
  const wr = state.trades.length ? (wins/state.trades.length)*100 : 0;
  // streak: last consecutive wins (+) or losses (-)
  let streak = 0;
  for(let i=state.trades.length-1;i>=0;i--){
    const w = state.trades[i].pnl>0;
    if(i===state.trades.length-1) streak = w?1:-1;
    else {
      if((streak>0 && w) || (streak<0 && !w)) streak += (streak>0?1:-1);
      else break;
    }
  }
  $("[data-role='pnl']").textContent = fmt(pnl);
  $("[data-role='wr']").textContent = Math.round(wr) + "%";
  $("[data-role='streak']").textContent = streak;
}

function renderRisk() {
  // simplistic risk: largest position value / policy.maxPos
  const maxPosVal = Math.max(0,...state.positions.map(p=>Math.abs(p.qty*(state.prices[p.symbol]||0))));
  const ratio = state.policy.maxPos ? (maxPosVal/state.policy.maxPos) : 0;
  $("[data-role='risk']").textContent = Math.min(100,Math.round(ratio*100)) + "%";
}

function renderAll(){
  renderHeader();
  renderWatchlist();
  renderTrades();
  renderStats();
  renderRisk();
}

/* ---------- positions & pricing ---------- */
function findPos(sym){ return state.positions.find(p=>p.symbol===sym); }
function positionValue(sym){
  const p = findPos(sym);
  return p ? p.qty * (state.prices[sym]||0) : 0;
}

/* ---------- trade handling ---------- */
function submitTrade({symbol, qty, price, side}){
  symbol = symbol.toUpperCase().trim();
  qty = Number(qty||0);
  price = Number(price||0);
  if(!symbol || !qty || !price) return;

  const cost = qty*price;
  let pnl = 0;

  if(side==="Buy"){
    if(state.cash < cost) return alert("Not enough cash.");
    state.cash -= cost;
    let p = findPos(symbol);
    if(!p) { p = {symbol, qty:0, avg:0}; state.positions.push(p); }
    p.avg = (p.avg*p.qty + price*qty)/(p.qty+qty);
    p.qty += qty;
  }else{
    const p = findPos(symbol);
    if(!p || p.qty < qty) return alert("Not enough shares.");
    state.cash += cost;
    pnl = (price - p.avg) * qty;
    p.qty -= qty;
    if(p.qty===0){ state.positions = state.positions.filter(x=>x!==p); }
  }

  state.prices[symbol] = Number(state.prices[symbol]||price);
  state.trades.push({time:Date.now(), symbol, side, qty, price, pnl});
  save(); renderAll();
}

/* ---------- notes & policy ---------- */
function hydrateForms(){
  $("[data-role='notes-text']").value = state.notes||"";
  $("[data-role='pol-risk']").value = state.policy.risk;
  $("[data-role='pol-daily']").value = state.policy.daily;
  $("[data-role='pol-position']").value = state.policy.maxPos;
}

/* ---------- tabs & events ---------- */
function wireUI(){
  $$(".tabbar button").forEach(btn=>{
    btn.onclick=()=>{
      $$(".tabbar button").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      $$(".view").forEach(v=>v.classList.remove("active"));
      document.querySelector(`#view-${btn.dataset.tab}`).classList.add("active");
    };
  });

  document.querySelector("[data-role='trade-form']").onsubmit=(e)=>{
    e.preventDefault();
    const f = new FormData(e.target);
    submitTrade({
      symbol:f.get("symbol"),
      qty:f.get("qty"),
      price:f.get("price"),
      side:f.get("action")
    });
    e.target.reset();
  };

  $("[data-role='notes-save']").onclick=()=>{
    state.notes = $("[data-role='notes-text']").value;
    save(); alert("Notes saved.");
  };

  $("[data-role='save-policy']").onclick=()=>{
    state.policy.risk = Number($("[data-role='pol-risk']").value||0);
    state.policy.daily = Number($("[data-role='pol-daily']").value||0);
    state.policy.maxPos = Number($("[data-role='pol-position']").value||0);
    save(); renderRisk(); alert("Policy saved.");
  };

  $("[data-role='reset-cash']").onclick=()=>{
    if(confirm("Reset cash to $10,000 and clear positions/trades?")){
      state.cash = 10000; state.positions=[]; state.trades=[];
      save(); renderAll();
    }
  };
}

/* ---------- playful price motion (demo) ---------- */
function tick(){
  // drift prices slightly for visual life
  Object.keys(state.prices).forEach(sym=>{
    const p = state.prices[sym];
    const noise = (Math.random()-0.5) * 0.6; // small drift
    const np = Math.max(1, p + noise);
    state.prices[sym] = np;
    state.changes[sym] = (np - p)/p;
  });
  renderWatchlist();
  renderRisk();
}
let driftTimer=null;

/* ---------- PWA ---------- */
function registerSW(){
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('service-worker.js?ver=20251013')
      .catch(()=>{});
  }
}

/* ---------- boot ---------- */
document.addEventListener("DOMContentLoaded", ()=>{
  load(); renderAll(); hydrateForms(); wireUI(); registerSW();
  driftTimer = setInterval(tick, 2500);
});
