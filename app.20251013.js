/* AureliOS – complete app (watchlist, trades, notes, risk, PWA register) */
(() => {
  const $ = (q, root=document) => root.querySelector(q);
  const $$ = (q, root=document) => [...root.querySelectorAll(q)];
  const money = n => Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});

  const SKEY = 'AURELIOS_STATE_V2';
  const COMPANY_COLORS = { AAPL:'#0a84ff', TSLA:'#cc0000', NVDA:'#76b900', MSFT:'#888' };

  const state = {
    cash: 10000,
    equity: 10000,
    riskPolicy: { maxRisk:200, maxDailyLoss:600, maxPosition:5000 },
    notes: '',
    trades: [],
    watch: {
      AAPL:{price:175.22, prev:175.22},
      TSLA:{price:236.75, prev:236.75},
      NVDA:{price:917.23, prev:917.23},
      MSFT:{price:402.54, prev:402.54}
    }
  };

  function load(){ try{ Object.assign(state, JSON.parse(localStorage.getItem(SKEY))||{}); }catch{} }
  function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }

  function renderBalances(){
    $('#uiCash').textContent = money(state.cash);
    $('#uiEquity').textContent = money(state.equity);
  }

  function renderWatchlist(){
    const host = $('#watchlist'); host.innerHTML = '';
    for(const sym of Object.keys(state.watch)){
      const w = state.watch[sym];
      const chg = ((w.price - w.prev) / (w.prev||w.price)) * 100;
      const row = document.createElement('div');
      row.className = 'ticker';
      row.innerHTML = `
        <div class="sym" style="color:${COMPANY_COLORS[sym]||'#fff'}">${sym}</div>
        <div class="price">${w.price.toFixed(2)}</div>
        <div class="chg ${chg>=0?'pos':'neg'}">${chg>=0?'+':''}${chg.toFixed(2)}%</div>
      `;
      if (w.price > w.prev) row.classList.add('flash-up');
      else if (w.price < w.prev) row.classList.add('flash-down');
      host.appendChild(row);
    }
  }

  function renderTrades(){
    const host = $('#trades'); host.innerHTML = '';
    state.trades.slice(0,25).forEach(t=>{
      const row = document.createElement('div');
      row.className = 'ticker';
      row.innerHTML = `
        <div>${new Date(t.ts).toLocaleTimeString()}</div>
        <div>${t.sym}</div>
        <div>${t.side}</div>
        <div>${t.qty}</div>
        <div>${t.price.toFixed(2)}</div>
        <div class="chg ${t.pnl>=0?'pos':'neg'}">${t.pnl>=0?'+':''}${t.pnl.toFixed(2)}</div>
      `;
      host.appendChild(row);
    });
  }

  function renderRisk(){
    const risk = Math.min(100, Math.round((state.riskPolicy.maxRisk / Math.max(1, state.equity)) * 100));
    $('#uiRisk').textContent = `Risk ${risk}%`;
  }

  function renderPolicy(){
    $('#polRisk').value = state.riskPolicy.maxRisk;
    $('#polDaily').value = state.riskPolicy.maxDailyLoss;
    $('#polPos').value = state.riskPolicy.maxPosition;
  }

  function renderNotes(){ $('#notes').value = state.notes || ''; }

  function renderAll(){ renderBalances(); renderWatchlist(); renderTrades(); renderRisk(); renderPolicy(); renderNotes(); }

  function tickPrices(){
    for(const sym of Object.keys(state.watch)){
      const w = state.watch[sym];
      w.prev = w.price;
      const drift = (Math.random() - 0.5) * 0.8;
      const revert = (100 - w.price % 100) * 0.0002;
      w.price = Math.max(1, w.price + drift + revert);
    }
    renderWatchlist(); save();
  }

  function placeTrade({sym, qty, price, side}){
    qty = Number(qty); price = Number(price);
    if(!sym || !qty || !price) return;

    const notional = qty * price;
    if (notional > state.riskPolicy.maxPosition) { alert('Exceeds max position.'); return; }

    let pnl = 0;
    if (side === 'Sell') pnl = (price - (state.watch[sym]?.price || price)) * qty;

    state.cash += (side === 'Sell' ? notional : -notional);
    state.equity = state.cash; // paper demo
    state.trades.unshift({ ts: Date.now(), sym, qty, price, side, pnl });

    renderBalances(); renderTrades(); save();
  }

  function wire(){
    $('#buildStamp').textContent = new Date().toISOString().slice(0,16).replace('T',' ');

    // tabs
    $$('.tabbar button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.tabbar button').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const id = 'view-' + btn.dataset.tab;
        $$('.view').forEach(v=>v.classList.remove('active'));
        $('#'+id).classList.add('active');
        window.scrollTo({top:0,behavior:'smooth'});
      });
    });

    // trade
    $('#tradeForm').addEventListener('submit', (e)=>{
      e.preventDefault();
      placeTrade({
        sym: $('#symbol').value.trim().toUpperCase(),
        qty: $('#qty').value,
        price: $('#price').value,
        side: $('#action').value
      });
      const btn = e.submitter; btn.classList.add('glow'); setTimeout(()=>btn.classList.remove('glow'), 400);
    });

    // notes
    $('#saveNotes').addEventListener('click', ()=>{
      state.notes = $('#notes').value; save();
      const b = $('#saveNotes'); b.textContent = 'Saved ✓'; setTimeout(()=>b.textContent='Save', 1400);
    });

    // policy
    $('#savePolicy').addEventListener('click', ()=>{
      state.riskPolicy.maxRisk = Number($('#polRisk').value||0);
      state.riskPolicy.maxDailyLoss = Number($('#polDaily').value||0);
      state.riskPolicy.maxPosition = Number($('#polPos').value||0);
      renderRisk(); save();
    });

    $('#resetCash').addEventListener('click', ()=>{
      if(!confirm('Reset paper cash to $10,000?')) return;
      state.cash = 10000; state.equity = 10000; save(); renderBalances();
    });

    // PWA
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('service-worker.js').catch(()=>{});
    }
  }

  load(); renderAll(); wire();
  setInterval(tickPrices, 3000);
})();
