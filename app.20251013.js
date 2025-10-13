// ===== Build tag (lets you confirm fresh JS loaded) =====
document.getElementById('buildTag').textContent = '2025-10-13 12:15';

// ===== State =====
const SKEY = 'AURELIOS_STATE_V3';
const state = {
  cash: 10000,
  positions: [],  // {symbol, qty, avg}
  trades: [],     // {t, symbol, side, qty, price, pos, pnl}
  policy: { risk: 100, daily: 500, maxpos: 2500 },
  notes: ''
};

// ===== Load / Save =====
function load(){
  try { Object.assign(state, JSON.parse(localStorage.getItem(SKEY)) || {}); }
  catch(e){}
}
function save(){
  localStorage.setItem(SKEY, JSON.stringify(state));
  render();
}
load();

// ===== Utils =====
const fmt = n => Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});
const now = () => new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
const findPos = s => state.positions.find(p => p.symbol === s.toUpperCase());

// ===== Render =====
function render(){
  document.querySelector('[data-role="cash"]').textContent = fmt(state.cash);
  const eq = state.positions.reduce((a,p)=>a + p.qty*p.avg, 0) + state.cash;
  document.querySelector('[data-role="equity"]').textContent = fmt(eq);

  // policy inputs
  document.querySelector('[data-role="pol-risk"]').value = state.policy.risk ?? '';
  document.querySelector('[data-role="pol-daily"]').value = state.policy.daily ?? '';
  document.querySelector('[data-role="pol-position"]').value = state.policy.maxpos ?? '';

  // notes
  document.querySelector('[data-role="notes-text"]').value = state.notes || '';

  // trades table
  const tbody = document.querySelector('[data-role="recent-trades"] tbody');
  tbody.innerHTML = '';
  state.trades.slice(-15).reverse().forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.t}</td><td>${r.symbol}</td><td>${r.side}</td>
                    <td>${r.qty}</td><td>${fmt(r.price)}</td>
                    <td>${fmt(r.pos)}</td><td>${fmt(r.pnl)}</td>`;
    tbody.appendChild(tr);
  });

  // risk badge (toy calc: open exposure / maxpos)
  const exposure = state.positions.reduce((a,p)=>a + Math.abs(p.qty*p.avg), 0);
  const pct = Math.min(100, Math.round((exposure / Math.max(1, state.policy.maxpos||2500))*100));
  document.getElementById('riskBadge').textContent = `Risk ${pct}%`;
}
render();

// ===== Handlers =====
document.querySelector('[data-role="notes-save"]').onclick = () => {
  state.notes = document.querySelector('[data-role="notes-text"]').value.trim();
  save();
  const el = document.getElementById('notesSaved');
  el.textContent = 'Saved';
  setTimeout(()=> el.textContent = '', 1200);
};

document.querySelector('[data-role="save-policy"]').onclick = () => {
  state.policy.risk = Number(document.querySelector('[data-role="pol-risk"]').value||0);
  state.policy.daily = Number(document.querySelector('[data-role="pol-daily"]').value||0);
  state.policy.maxpos = Number(document.querySelector('[data-role="pol-position"]').value||0);
  save();
};

document.querySelector('[data-role="reset-cash"]').onclick = () => {
  state.cash = 10000;
  state.positions = [];
  state.trades = [];
  save();
};

document.querySelector('[data-role="trade-form"]').onsubmit = (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const symbol = (f.get('symbol')||'').toString().trim().toUpperCase();
  const qty = Number(f.get('qty')||0);
  const price = Number(f.get('price')||0);
  const side = (f.get('action')||'Buy').toString();

  const msg = document.getElementById('formMsg');
  if(!symbol || qty<=0 || price<=0){ msg.textContent = 'Enter symbol, qty, and price'; return; }

  const cost = qty*price;
  let pos = findPos(symbol);
  if(!pos){ pos = {symbol, qty:0, avg:0}; state.positions.push(pos); }

  if(side === 'Buy'){
    if(state.cash < cost){ msg.textContent = 'Insufficient cash'; return; }
    const newQty = pos.qty + qty;
    pos.avg = (pos.avg*pos.qty + cost)/newQty;
    pos.qty = newQty;
    state.cash -= cost;
  }else{
    if(pos.qty < qty){ msg.textContent = 'Not enough shares'; return; }
    pos.qty -= qty;
    state.cash += cost;
    if(pos.qty === 0) pos.avg = 0;
  }

  const pnl = side==='Sell' ? (price - pos.avg) * qty : 0;
  state.trades.push({ t: now(), symbol, side, qty, price, pos: pos.qty*pos.avg, pnl });
  msg.textContent = 'Recorded ✓';
  setTimeout(()=> msg.textContent='', 1000);
  save();
};

// ===== Service worker (register) =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js?ver=20251013-7').catch(()=>{});
}
