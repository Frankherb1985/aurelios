// ===================================================
// AureliOS DayTrade App.js — Frank Herbert Edition
// Black • Chrome • Gold Interface
// Streamlined, animated, mobile-ready
// ===================================================

// ===== Helpers =====
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const ref = id => document.getElementById(id);
const setText = (el,val)=>{ if(el) el.textContent = val; };

// ===== State =====
let state = {
  equity: 10000,
  cash: 10000,
  trades: [],
  policy: { risk: 150, daily: 400, position: 3000 }
};

// ===== UI / Styling =====
const BRAND = {
  AAPL:'#0A84FF', TSLA:'#CC0000', NVDA:'#76B900', MSFT:'#737373',
  META:'#0866FF', AMZN:'#FF9900', GOOG:'#4285F4'
};
const brandColor = sym => BRAND[(sym||'').toUpperCase()] || '#B3B3B3';

// ===== Core Functions =====
function updateBalances(){
  setText($('[data-role="equity"]'), `$${state.equity.toFixed(2)}`);
  setText($('[data-role="cash"]'), `$${state.cash.toFixed(2)}`);
}

function addTrade(symbol, side, qty, price){
  const pos = qty * price * (side==="Buy" ? -1 : 1);
  state.trades.push({
    time: new Date().toLocaleTimeString(),
    symbol, side, qty, price, pos, pnl: (Math.random()-0.5)*50
  });
  renderTrades();
  renderWatchlist(buildWatchlistFromRecent());
  updateHUD();
}

function renderTrades(){
  const tbody = $('[data-role="recent-trades"] tbody');
  if(!tbody) return;
  tbody.innerHTML = state.trades.slice(-5).reverse().map(t => `
    <tr>
      <td>${t.time}</td>
      <td>${t.symbol}</td>
      <td>${t.side}</td>
      <td>${t.qty}</td>
      <td>${t.price.toFixed(2)}</td>
      <td>$${t.pos.toFixed(2)}</td>
      <td class="${t.pnl>=0?'text-pos':'text-neg'}">
        ${t.pnl>=0?'+':''}${t.pnl.toFixed(2)}
      </td>
    </tr>
  `).join('');
}

// ===== Risk Dial & HUD =====
function setRisk(pct){
  setText(ref('riskVal'), `${pct|0}%`);
}

function updateHUD(){
  const pnl = state.trades.reduce((a,b)=>a+b.pnl,0);
  const wr  = state.trades.length ? 
    (state.trades.filter(t=>t.pnl>0).length/state.trades.length*100).toFixed(0) : 0;
  const streak = Math.floor(Math.random()*5);
  setText(ref('hudPnl'), `Δ ${pnl>=0?'+':''}${pnl.toFixed(2)}`);
  ref('hudPnl').style.color = pnl>=0 ? '#30E07B' : '#FF5A66';
  setText(ref('hudWr'), `WR ${wr}%`);
  setText(ref('hudStreak'), `Streak ${streak}`);
}

// ===== Watchlist =====
function renderWatchlist(rows){
  const el = ref('watchlist');
  if(!el) return;
  el.innerHTML = (rows||[]).map(r=>{
    const pos = r.changePct >= 0;
    return `
      <div class="row" style="--brand:${brandColor(r.sym)}">
        <div class="brand-dot"></div>
        <div class="ticker" style="min-width:56px">${r.sym}</div>
        <div class="right" style="text-align:right">
          <div class="last">${r.last.toFixed(2)}</div>
          <div class="${pos?'text-pos':'text-neg'} small">
            ${pos?'+':''}${r.changePct.toFixed(2)}%
          </div>
        </div>
      </div>`;
  }).join('');
}

function buildWatchlistFromRecent(max=5){
  const seen = new Set(), out = [];
  [...state.trades].reverse().forEach(tr=>{
    if(out.length>=max) return;
    if(!seen.has(tr.symbol)){
      seen.add(tr.symbol);
      out.push({ sym: tr.symbol, last: tr.price, changePct:(Math.random()*2-1)*3 });
    }
  });
  return out;
}

// ===== Tabs =====
$$('[data-tab]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    $$('.tabbar button').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const view = btn.dataset.tab;
    $$('.view').forEach(v=>v.classList.remove('active'));
    $(`#view-${view}`).classList.add('active');
  });
});

// ===== Event Delegation =====
document.addEventListener('click', (e)=>{
  const a = e.target.closest('[data-action], .btn.primary');
  if(!a) return;
  const action = a.dataset.action || '';

  if(action === 'notes-save'){
    const txt = $('[data-role="notes-text"]').value;
    localStorage.setItem('AURELIOS_NOTES', txt);
  }

  if(action === 'save-policy'){
    state.policy = {
      risk: +$('[data-role="pol-risk"]').value || 150,
      daily:+$('[data-role="pol-daily"]').value || 400,
      position:+$('[data-role="pol-position"]').value || 3000
    };
    localStorage.setItem('AURELIOS_POLICY', JSON.stringify(state.policy));
  }

  if(action === 'reset-cash'){
    state.cash = 10000; state.trades = [];
    updateBalances(); renderTrades(); renderWatchlist([]);
  }
});

// ===== Trade Form =====
$('[data-role="trade-form"]').addEventListener('submit', e=>{
  e.preventDefault();
  const f = e.target;
  const symbol = f.symbol.value.toUpperCase();
  const qty = +f.qty.value || 0;
  const price = +f.price.value || 0;
  const side = f.action.value;
  if(!symbol || !qty || !price) return;
  addTrade(symbol, side, qty, price);
  f.reset();
});

// ===== Init =====
function init(){
  updateBalances();
  renderTrades();
  renderWatchlist(buildWatchlistFromRecent());
  setRisk(0);
  updateHUD();
}
init();

// ===== Animation Loop (Star-Trek style motion) =====
let phase = 0;
function animate(){
  phase += 0.03;
  document.documentElement.style.setProperty('--shimmer', Math.sin(phase).toFixed(3));
  requestAnimationFrame(animate);
}
animate();

// ===== End of AureliOS App.js =====
