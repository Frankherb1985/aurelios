/* AureliOS – Cinematic Build (all-in-one) */
(() => {
  const SKEY = "AURELIOS_STATE_V2";
  const nowStr = () => new Date().toISOString().replace('T',' ').slice(0,16);

  // ----- State
  const state = {
    cash: 10000,
    positions: [],       // {symbol, qty, avg, last}
    trades: [],          // {t, sym, side, qty, price, posValue, pnl}
    notes: "",
    policy: { risk: 200, daily: 500, position: 5000 },
    watch: [
      { sym:"AAPL", last:177.18, change:+1.12 },
      { sym:"TSLA", last:236.75, change:-1.99 },
      { sym:"NVDA", last:917.23, change:+0.85 },
      { sym:"MSFT", last:402.54, change:+0.20 }
    ],
    streak: 0, wins: 0, total: 0
  };

  function load(){
    try{
      const s = JSON.parse(localStorage.getItem(SKEY)||"{}");
      Object.assign(state, s);
      // fill missing
      state.policy = Object.assign({ risk:200, daily:500, position:5000 }, state.policy||{});
      state.watch = state.watch && state.watch.length ? state.watch : state.watch;
    }catch(e){}
  }
  function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); }

  // ----- Utils
  const $ = sel => document.querySelector(sel);
  const fmt = n => Number(n).toLocaleString(undefined,{style:'currency',currency:'USD'});
  const pct = n => (n>=0?'+':'') + n.toFixed(2) + '%';
  const bySym = s => state.positions.find(p=>p.symbol===s);

  // ----- Elements
  const elBuild = $('[data-role="build"]');
  const elEq = $('[data-role="equity"]');
  const elCash = $('[data-role="cash"]');
  const elGoldbar = $('[data-role="goldbar"]');
  const elRiskVal = $('[data-role="riskVal"]');
  const elRiskSvg = $('[data-role="riskSvg"] .risk-ring');
  const elTrades = $('[data-role="recent-trades"] tbody');
  const elMsg = $('[data-role="msg"]');
  const elWR = $('[data-role="wr"]');
  const elPnL = $('[data-role="pnl"]');
  const elStreak = $('[data-role="streak"]');
  const elNotes = $('[data-role="notes-text"]');

  // ----- Render
  function equity(){
    const posv = state.positions.reduce((a,p)=> a + (p.last||0)*p.qty, 0);
    return state.cash + posv;
  }
  function riskPct(){
    const posv = state.positions.reduce((a,p)=> a + (p.last||0)*p.qty, 0);
    if(state.policy.position<=0) return 0;
    return Math.min(100, (posv/state.policy.position)*100);
  }

  function renderHeader(){
    elBuild.textContent = `Build: ${nowStr()}`;
    elEq.textContent = fmt(equity());
    elCash.textContent = fmt(state.cash);
  }

  function renderRisk(){
    const r = riskPct();
    elRiskVal.textContent = `${r.toFixed(0)}%`;
    const full = 2*Math.PI*46; // dasharray 290 from CSS; keep in sync
    const dash = full * (1 - r/100);
    elRiskSvg.style.strokeDashoffset = dash.toFixed(2);
  }

  function renderWatch(){
    const host = $('#watchlist');
    host.innerHTML = '';
    state.watch.forEach(w=>{
      // company “colors”
      const c = (w.sym==='TSLA')? 'neg' : (w.change>=0?'pos':'neg');
      const row = document.createElement('div');
      row.className = 'w-row';
      row.innerHTML = `
        <div class="w-left">
          <div class="badge">${w.sym[0]}</div>
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
    elTrades.innerHTML = state.trades.slice(-20).reverse().map(tr=>{
      const cls = tr.pnl>=0?'pos':'neg';
      return `<tr>
        <td>${tr.t.slice(5)}</td>
        <td>${tr.sym}</td>
        <td>${tr.side}</td>
        <td>${tr.qty}</td>
        <td>${tr.price.toFixed(2)}</td>
        <td>${fmt(tr.posValue)}</td>
        <td class="${cls}">${fmt(tr.pnl)}</td>
      </tr>`;
    }).join('');
  }

  function renderKPIs(){
    const todayPnL = state.trades.filter(t=>t.t.slice(0,10)===new Date().toISOString().slice(0,10))
      .reduce((a,t)=>a+t.pnl,0);
    elPnL.textContent = fmt(todayPnL);
    const wr = state.total? (100*state.wins/state.total):0;
    elWR.textContent = `${wr.toFixed(0)}%`;
    elStreak.textContent = String(state.streak);
  }

  function renderNotes(){ elNotes.value = state.notes||''; }

  function renderAll(){
    renderHeader();
    renderRisk();
    renderWatch();
    renderTrades();
    renderKPIs();
    renderNotes();
  }

  // ----- Actions
  function trade(side, sym, qty, price){
    if(!sym || !qty || !price){ elMsg.textContent = "Missing fields."; return; }
    qty = Number(qty); price = Number(price);
    let p = bySym(sym);
    if(side==='Update Price'){
      if(!p){ p = {symbol:sym, qty:0, avg:0, last:price}; state.positions.push(p); }
      p.last = price;
      state.watch = state.watch.map(w=> w.sym===sym? {...w,last:price}: w);
      elMsg.textContent = `Updated ${sym} price.`;
      save(); renderAll(); return;
    }

    if(side==='Buy'){
      const cost = qty*price;
      if(cost>state.cash){ elMsg.textContent="Insufficient cash"; return; }
      if(!p){ p = {symbol:sym, qty:0, avg:0, last:price}; state.positions.push(p); }
      p.avg = (p.avg*p.qty + cost)/(p.qty+qty);
      p.qty += qty; p.last = price;
      state.cash -= cost;
    }else if(side==='Sell'){
      if(!p || p.qty<qty){ elMsg.textContent="Not enough shares"; return; }
      const proceeds = qty*price;
      state.cash += proceeds;
      p.qty -= qty; p.last = price;
      if(p.qty===0){ p.avg = 0; }
    }

    const posValue = (p.last||0)*p.qty;
    const pnl = (p.last - p.avg) * p.qty;
    const t = {t: nowStr(), sym, side, qty, price, posValue, pnl};
    state.trades.push(t);

    // win/loss tracking on sell
    if(side==='Sell'){
      state.total += 1;
      if(price >= p.avg){ state.wins += 1; state.streak = state.streak>=0 ? state.streak+1 : 1; }
      else { state.streak = state.streak<=0 ? state.streak-1 : -1; }
    }

    save(); renderAll();
    elMsg.textContent = `${side} ${qty} ${sym} @ ${price.toFixed(2)} — OK`;
  }

  // ----- Events
  (function initEvents(){
    // Tabs
    const tabs = document.querySelectorAll('.dock-btn');
    const ind = document.querySelector('[data-role="dock-ind"]');
    const setActive = (idx)=>{
      tabs.forEach((b,i)=> b.classList.toggle('active', i===idx));
      ind.style.left = (idx*33.33+3) + '%';
    };
    tabs.forEach((b,i)=> b.addEventListener('click', ()=> setActive(i)));
    setActive(0);

    // Trade form
    const form = document.querySelector('[data-role="trade-form"]');
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      trade(fd.get('action'), fd.get('symbol').toUpperCase().trim(), fd.get('qty'), fd.get('price'));
    });

    // Notes
    document.querySelector('[data-role="notes-save"]').onclick = ()=>{
      state.notes = elNotes.value||''; save(); elMsg.textContent = "Notes saved.";
    };

    // Policy
    $('[data-role="save-policy"]').onclick = ()=>{
      state.policy.risk = Number($('[data-role="pol-risk"]').value||200);
      state.policy.daily = Number($('[data-role="pol-daily"]').value||500);
      state.policy.position = Number($('[data-role="pol-position"]').value||5000);
      save(); renderAll(); elMsg.textContent = "Policy saved.";
    };
    $('[data-role="reset-cash"]').onclick = ()=>{
      state.cash = 10000; save(); renderAll(); elMsg.textContent = "Cash reset.";
    };
  })();

  // ----- Animations (cinematic)
  function animate(){
    // breathing gold bar
    const t = (Date.now()%4000)/4000;
    elGoldbar.style.width = (18 + Math.sin(t*2*Math.PI)*12 + 40) + '%';
  }
  setInterval(animate, 32); // ~30fps visual-only

  // light price drift to feel alive (client-side only)
  function tickPrices(){
    state.watch = state.watch.map(w=>{
      const drift = (Math.random() - 0.5) * 0.12; // +/- 0.12%
      const change = drift;
      const last = Math.max(0.01, w.last * (1 + change/100));
      return {...w, last, change};
    });
    // update positions last
    state.watch.forEach(w=>{
      const p = bySym(w.sym); if(p) p.last = w.last;
    });
    renderWatch(); renderHeader(); renderRisk(); save();
  }
  setInterval(tickPrices, 2000);

  // ----- Boot
  function boot(){
    load();
    // restore policy inputs
    $('[data-role="pol-risk"]').value = state.policy.risk;
    $('[data-role="pol-daily"]').value = state.policy.daily;
    $('[data-role="pol-position"]').value = state.policy.position;
    renderAll();
  }
  boot();

})();
