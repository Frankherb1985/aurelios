/* ========= helpers ========= */
const $ = (q, el=document) => el.querySelector(q);
const $$ = (q, el=document) => [...el.querySelectorAll(q)];
const money = n => n.toLocaleString(undefined,{style:'currency',currency:'USD'});
const pct   = n => `${(n>=0?'+':'')}${(n*100).toFixed(2)}%`;

/* ========= state / storage ========= */
const SKEY = 'AURELIOS_CINEMATIC_V1';
const state = {
  cash: 10000,
  positions: [],         // {sym, qty, avg}
  watch: [
    {sym:'AAPL', last:177.18, change:+0.0112},
    {sym:'TSLA', last:236.75, change:-0.0198},
    {sym:'NVDA', last:917.23, change:+0.0085},
    {sym:'MSFT', last:402.54, change:+0.0020},
  ],
  trades: [],            // recent trades: {t,sym,side,qty,price,pnl}
  policy: { risk:200, daily:500, position:5000 },
  streak: 0, wins: 0, losses: 0,
};
const load = () => { try{ Object.assign(state, JSON.parse(localStorage.getItem(SKEY)) || {});}catch{} };
const save = () => localStorage.setItem(SKEY, JSON.stringify(state));

/* ========= DOM refs ========= */
const el = {
  equity: $('[data-role="equity"]'),
  cash: $('[data-role="cash"]'),
  pnl: $('[data-role="pnl"]'),
  wr: $('[data-role="wr"]'),
  streak: $('[data-role="streak"]'),
  trades: $('[data-role="recent-trades"] tbody'),
  goldbar: $('[data-role="goldbar"]'),
  riskArc: $('[data-role="riskArc"]'),
  riskVal: $('[data-role="riskVal"]'),
  build: $('[data-role="build"]'),
  form: $('[data-role="trade-form"]'),
  msg: $('[data-role="msg"]'),
  notes: $('[data-role="notes-text"]'),
  saveNotes: $('[data-role="notes-save"]'),
  polRisk: $('[data-role="pol-risk"]'),
  polDaily: $('[data-role="pol-daily"]'),
  polPos: $('[data-role="pol-position"]'),
  savePol: $('[data-role="save-policy"]'),
  resetCash: $('[data-role="reset-cash"]'),
  dockInd: $('[data-role="dock-ind"]')
};

/* ========= derived ========= */
const equity = () => state.cash + state.positions.reduce((a,p)=>a + p.qty * priceOf(p.sym), 0);

/* ========= prices & simulation ========= */
const priceOf = sym => (state.watch.find(w=>w.sym===sym) || {last:0}).last;

function tickPrices(){
  state.watch.forEach(w=>{
    const drift = 1 + (Math.random()*0.002 - 0.001);  // tiny random walk
    const prev = w.last;
    w.last = +(w.last * drift).toFixed(2);
    w.change = (w.last - prev)/prev;
  });
  renderWatch();
  renderGoldbar();
  save();
}

/* ========= renders ========= */
function renderHeader(){
  el.equity.textContent = money(equity());
  el.cash.textContent = money(state.cash);
  el.build.textContent = 'Build: ' + new Date().toISOString().replace('T',' ').slice(0,16);
}

function renderWatch(){
  const host = $('#watchlist');
  host.innerHTML = '';
  state.watch.forEach(w=>{
    const c = w.change>=0?'pos':'neg';
    const iconId = w.sym==='AAPL'?'ico-aapl':
                   w.sym==='TSLA'?'ico-tsla':
                   w.sym==='NVDA'?'ico-nvda':
                   w.sym==='MSFT'?'ico-msft':null;

    const row = document.createElement('div');
    row.className = 'w-row';
    row.innerHTML = `
      <div class="w-left">
        <div class="badge">${iconId?`<svg><use href="#${iconId}"></use></svg>`:w.sym[0]}</div>
        <div class="sym">${w.sym}</div>
      </div>
      <div class="w-right">
        <div class="price">${w.last.toFixed(2)}</div>
        <div class="change ${c}">${pct(w.change)}</div>
      </div>`;
    host.appendChild(row);
  });
}

function renderTrades(){
  el.trades.innerHTML = '';
  state.trades.slice(-25).reverse().forEach(tr=>{
    const trEl = document.createElement('tr');
    trEl.innerHTML = `
      <td>${new Date(tr.t).toLocaleTimeString()}</td>
      <td>${tr.sym}</td>
      <td>${tr.side}</td>
      <td>${tr.qty}</td>
      <td>${tr.price.toFixed(2)}</td>
      <td>${money(tr.qty*tr.price)}</td>
      <td style="color:${tr.pnl>=0?'#43d17a':'#ff625d'}">${money(tr.pnl)}</td>`;
    el.trades.appendChild(trEl);
  });
  el.pnl.textContent = money(state.trades.reduce((a,t)=>a+t.pnl,0));
  const total = state.wins + state.losses;
  el.wr.textContent = total? Math.round(state.wins/total*100)+'%':'0%';
  el.streak.textContent = state.streak;
}

function renderGoldbar(){
  const posVal = equity() - state.cash;
  const pct = Math.max(5, Math.min(95, (posVal/Math.max(1,state.policy.position))*50 + 45)); // keep it visible
  el.goldbar.style.width = pct + '%';
}

function renderRisk(){
  // risk = max(|positions value| / policy.position, |daily pnl| / policy.daily)
  const posVal = Math.abs( state.positions.reduce((a,p)=>a + p.qty*priceOf(p.sym), 0) );
  const daily = Math.abs( state.trades.reduce((a,t)=>a+t.pnl,0) );
  const r = Math.min(1, Math.max(posVal/Math.max(1,state.policy.position), daily/Math.max(1,state.policy.daily)));
  const perc = Math.round(r*100);
  const C = 2*Math.PI*46; // circumference
  el.riskVal.textContent = perc + '%';
  el.riskArc.style.strokeDasharray = C;
  el.riskArc.style.strokeDashoffset = (1-r)*C;
}

/* ========= actions ========= */
function handleTrade(e){
  e.preventDefault();
  const fd = new FormData(el.form);
  const sym = (fd.get('symbol')||'').toUpperCase().trim();
  const action = fd.get('action');
  const qty = +fd.get('qty')||0;
  const price = +fd.get('price')||priceOf(sym);

  if(!sym){ el.msg.textContent='Enter a symbol'; return; }
  if((action==='Buy'||action==='Sell') && qty<=0){ el.msg.textContent='Enter quantity'; return; }

  let pnl = 0;

  if(action==='Buy'){
    // add/update position
    let p = state.positions.find(p=>p.sym===sym);
    if(!p){ p = {sym, qty:0, avg:0}; state.positions.push(p); }
    p.avg = (p.avg*p.qty + price*qty)/(p.qty+qty);
    p.qty += qty;
    state.cash -= price*qty;
  }else if(action==='Sell'){
    let p = state.positions.find(p=>p.sym===sym);
    if(!p || p.qty<qty){ el.msg.textContent='Not enough shares'; return; }
    pnl = (price - p.avg)*qty;
    p.qty -= qty;
    state.cash += price*qty;
    if(p.qty===0) state.positions = state.positions.filter(x=>x.qty>0);
    // win/loss tracking
    if(pnl>0){ state.wins++; state.streak = state.streak>=0 ? state.streak+1 : 1; }
    else if(pnl<0){ state.losses++; state.streak = state.streak<=0 ? state.streak-1 : -1; }
  }else if(action==='Update Price'){
    const w = state.watch.find(w=>w.sym===sym);
    if(w){ w.last = price; w.change = 0; }
  }

  state.trades.push({t:Date.now(), sym, side:action, qty, price, pnl});
  el.msg.textContent = 'Done.';
  renderHeader(); renderTrades(); renderWatch(); renderGoldbar(); renderRisk();
  save();
}

function savePolicy(){
  state.policy.risk = +el.polRisk.value || state.policy.risk;
  state.policy.daily = +el.polDaily.value || state.policy.daily;
  state.policy.position = +el.polPos.value || state.policy.position;
  save(); el.msg.textContent='Policy saved.';
  renderRisk();
}

function resetCash(){
  state.cash = 10000; save(); renderHeader(); el.msg.textContent='Cash reset.';
}

/* ========= tabs ========= */
$$('.dock-btn').forEach((b,i)=>{
  b.addEventListener('click', ()=>{
    $$('.dock-btn').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    el.dockInd.style.left = (3.5 + i*33) + '%';
    // scroll to section (“Star-Trek” snappy)
    const target = i===0? document.body :
                   i===1? $('[data-role="trade-form"]').closest('.card'):
                          $('[data-role="save-policy"]').closest('.card');
    target.scrollIntoView({behavior:'smooth', block:'start'});
  });
});

/* ========= initialization ========= */
function init(){
  load();
  // hydrate policy inputs
  el.polRisk.value = state.policy.risk;
  el.polDaily.value = state.policy.daily;
  el.polPos.value   = state.policy.position;

  renderHeader(); renderWatch(); renderTrades(); renderGoldbar(); renderRisk();

  el.form.addEventListener('submit', handleTrade);
  el.saveNotes.addEventListener('click', ()=>{ localStorage.setItem('AURELIOS_NOTES', el.notes.value||''); el.msg.textContent='Notes saved.'; });
  el.notes.value = localStorage.getItem('AURELIOS_NOTES')||'';
  el.savePol.addEventListener('click', savePolicy);
  el.resetCash.addEventListener('click', resetCash);

  // live price simulation & subtle ring pulse
  setInterval(tickPrices, 2200);
  setInterval(()=>{ el.riskArc.style.filter = 'drop-shadow(0 0 8px rgba(255,208,68,.35))'; setTimeout(()=>el.riskArc.style.filter='', 500); }, 2600);

  // PWA
  if('serviceWorker' in navigator){ navigator.serviceWorker.register('service-worker.js'); }
}

document.addEventListener('DOMContentLoaded', init);
