
// State & storage
const SKEY = "AURELIOS_STATE_V1"
const state = {
  cash: 10000,
  maxRisk: 0.02,
  notes: "",
  positions: [],   // {symbol, qty, avg, last}
  prices: {}       // {symbol: [numbers...]}
};
function load(){ try{ Object.assign(state, JSON.parse(localStorage.getItem(SKEY))||{}) }catch(e){} }
function save(){ localStorage.setItem(SKEY, JSON.stringify(state)); render() }
function drawSpark(canvasId, arr){
  const c = document.getElementById(canvasId);
  if(!c || !arr || arr.length < 2) return;
  const ctx = c.getContext('2d');
  const w = c.width, h = c.height;
  ctx.clearRect(0,0,w,h);

  const min = Math.min(...arr), max = Math.max(...arr);
  const range = max - min || 1;
  const step = w / (arr.length - 1);

  // line
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#F3C63F';
  ctx.beginPath();
  arr.forEach((v,i) => {
    const x = i * step;
    const y = h - ((v - min) / range) * (h - 2) - 1;
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.stroke();

  // last dot
  const lastX = (arr.length - 1) * step;
  const lastY = h - ((arr[arr.length-1] - min) / range) * (h - 2) - 1;
  ctx.fillStyle = '#F3C63F';
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2.5, 0, Math.PI*2);
  ctx.fill();
}

function sma(arr, n){
  if(arr.length < n) return [];
  const out = [];
  let sum = 0;
  for(let i=0;i<arr.length;i++){
    sum += arr[i];
    if(i >= n) sum -= arr[i-n];
    if(i >= n-1) out.push(sum/n);
  }
  return out;
}

function smaSignal(series, shortN, longN){
  if(!series || series.length < Math.max(shortN, longN)) return null;
  const s = sma(series, shortN);
  const l = sma(series, longN);
  // align ends
  const offset = s.length - l.length;
  const sLast = s[s.length-1];
  const lLast = l[l.length-1 - Math.max(0, offset)];
  if(sLast > lLast) return 'BULLISH';
  if(sLast < lLast) return 'BEARISH';
  return 'NEUTRAL';
}
// Utils
const fmt = n => n.toLocaleString(undefined,{style:'currency',currency:'USD'})
const pct = n => (n>=0?'+':'') + n.toFixed(2) + '%'
const equity = () => state.cash + state.positions.reduce((a,p)=>a + p.last*p.qty, 0)

// Tabs
document.querySelectorAll('.tabs button').forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'))
  document.querySelectorAll('.tab').forEach(s=>s.classList.remove('active'))
  btn.classList.add('active'); document.getElementById(btn.dataset.tab).classList.add('active')
})
document.getElementById('importSeries').onclick = () => {
  const sym = (document.getElementById('seriesSym').value || '').trim().toUpperCase();
  const raw = (document.getElementById('seriesData').value || '').trim();
  if(!sym || !raw){ elMsg.textContent = "Enter symbol and prices."; elMsg.style.color='#ea3a49'; return; }
  const lines = raw.split(/\r?\n/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n));
  if(lines.length < 2){ elMsg.textContent = "Need at least 2 prices."; elMsg.style.color='#ea3a49'; return; }
  state.prices[sym] = lines;
  // If there’s an open position, update its last to the last price (optional)
  const i = state.positions.findIndex(p => p.symbol === sym);
  if(i>=0){ state.positions[i].last = lines[lines.length-1]; }
  elMsg.textContent = `Imported ${lines.length} prices for ${sym}.`;
  elMsg.style.color = '#3adf82';
  save();
};
const elEquity = document.getElementById('equity')
const elCash = document.getElementById('cash')
const elPos = document.getElementById('positions')
const elEmpty = document.getElementById('emptyState')
const elMsg = document.getElementById('msg')
const elRisk = document.getElementById('risk')
const elRiskLabel = document.getElementById('riskLabel')
const elNotes = document.getElementById('notes')

function renderHeader(){ elEquity.textContent = `Equity — ${fmt(equity())}`; elCash.textContent = `Cash — ${fmt(state.cash)}` }
function renderPositions(){
  elPos.innerHTML = '';
  if(state.positions.length === 0){
    elEmpty.style.display = 'block';
    return;
  }
  elEmpty.style.display = 'none';

  state.positions.forEach(p => {
    const pnlAbs = (p.last - p.avg) * p.qty;
    const pnlPct = p.avg ? ((p.last / p.avg - 1) * 100) : 0;

    // Build row
    const row = document.createElement('div');
    row.className = 'pos';
    row.innerHTML = `
      <div>
        <div class="sym">${p.symbol}</div>
        <div class="meta">Qty ${p.qty} @ ${fmt(p.avg)}</div>
        <div class="meta" id="sig-${p.symbol}"></div>
      </div>
      <div style="text-align:right">
        <div>${fmt(p.last)}</div>
        <div class="${pnlAbs>=0?'pnlG':'pnlR'}">${pnlAbs.toFixed(2)} (${(pnlPct>=0?'+':'')+pnlPct.toFixed(2)}%)</div>
        <canvas class="spark" id="spark-${p.symbol}" width="120" height="28" style="margin-top:6px;"></canvas>
      </div>
    `;
    elPos.appendChild(row);

    // Draw sparkline if we have prices
    const series = state.prices[p.symbol] || [];
    drawSpark(`spark-${p.symbol}`, series);

    // Show quick signal (5 vs 20 SMA)
    const sig = smaSignal(series, 5, 20);
    const sigEl = document.getElementById(`sig-${p.symbol}`);
    if (sig) {
      const color = sig === 'BULLISH' ? '#3adf82' : (sig === 'BEARISH' ? '#ea3a49' : '#bdbdbd');
      sigEl.textContent = `Signal: ${sig}`;
      sigEl.style.color = color;
    } else {
      sigEl.textContent = `Signal: —`;
      sigEl.style.color = '#9b9b9b';
    }
  });
}
document.getElementById('importSeries').onclick = () => {
  const sym = (document.getElementById('seriesSym').value || '').trim().toUpperCase();
  const raw = (document.getElementById('seriesData').value || '').trim();
  if(!sym || !raw) { elMsg.textContent = "Enter symbol + prices"; return }

  const lines = raw.split(/\r?\n/).map(s=>+s).filter(n=>!isNaN(n));
  if(lines.length < 2) { elMsg.textContent = "Need 2+ numbers"; return }

  state.prices[sym] = lines;

  // If there's an existing position, update last price
  const i = state.positions.findIndex(p => p.symbol === sym);
  if(i >= 0) state.positions[i].last = lines[lines.length-1];

  save();
  render();
};
function render(){
  elRisk.value = Math.round(state.maxRisk*100)
  elRiskLabel.textContent = `${Math.round(state.maxRisk*100)}%`
  elNotes.value = state.notes||""
  renderHeader(); renderPositions()
}

// Trade actions
document.getElementById('submit').onclick=()=>{
  const sym=(document.getElementById('sym').value||'').trim().toUpperCase()
  const qty=parseFloat(document.getElementById('qty').value)
  const price=parseFloat(document.getElementById('price').value)
  const mode=document.getElementById('mode').value
  if(!sym||!(qty>0)||!(price>0)){ elMsg.textContent="Invalid inputs."; elMsg.style.color='#ea3a49'; return }

  if(mode==='buy'){
    const notional=qty*price, budget=equity()*state.maxRisk
    if(notional>budget){ elMsg.textContent=`Blocked: exceeds risk limit (${Math.round(state.maxRisk*100)}%).`; elMsg.style.color='#ea3a49'; return }
    if(state.cash<notional){ elMsg.textContent="Insufficient cash."; elMsg.style.color='#ea3a49'; return }
    state.cash-=notional
    const i=state.positions.findIndex(p=>p.symbol===sym)
    if(i>=0){
      const p=state.positions[i], totalCost=p.avg*p.qty+notional, totalQty=p.qty+qty
      state.positions[i]={symbol:sym, qty:totalQty, avg:totalCost/totalQty, last:price}
    }else{ state.positions.push({symbol:sym, qty, avg:price, last:price}) }
    elMsg.textContent="Added."; elMsg.style.color='#3adf82'
  }else if(mode==='sell'){
    const i=state.positions.findIndex(p=>p.symbol===sym)
    if(i<0){ elMsg.textContent="No position."; elMsg.style.color='#ea3a49'; return }
    if(qty>state.positions[i].qty){ elMsg.textContent="Too many shares."; elMsg.style.color='#ea3a49'; return }
    state.cash+=qty*price; state.positions[i].qty-=qty; state.positions[i].last=price
    if(state.positions[i].qty<=0){ state.positions.splice(i,1) }
    elMsg.textContent="Sold."; elMsg.style.color='#3adf82'
  }else{
    const i=state.positions.findIndex(p=>p.symbol===sym)
    if(i<0){ elMsg.textContent="No position."; elMsg.style.color='#ea3a49'; return }
    state.positions[i].last=price; elMsg.textContent="Updated."; elMsg.style.color='#3adf82'
  }
  save()
}

document.getElementById('saveNotes').onclick=()=>{ state.notes=elNotes.value||""; save(); elMsg.textContent="Notes saved."; elMsg.style.color='#3adf82' }
document.getElementById('risk').oninput=(e)=>{ state.maxRisk = (parseFloat(e.target.value)||2)/100; elRiskLabel.textContent=`${Math.round(state.maxRisk*100)}%` }
document.getElementById('save').onclick=()=> save()

// Export
document.getElementById('export').onclick=()=>{
  const lines=[]; lines.push(`# AureliOS Summary — ${new Date().toLocaleString()}`)
  lines.push(`Equity: ${fmt(equity())}`); lines.push(`Cash: ${fmt(state.cash)}`); lines.push(`Max Risk: ${Math.round(state.maxRisk*100)}%`); lines.push('')
  if(state.positions.length===0){ lines.push('No positions.') }
  else{ lines.push('Symbol,Qty,Avg,Last,PNL,PNL%'); state.positions.forEach(p=>{
    const pnlAbs=(p.last-p.avg)*p.qty, pnlPct=p.avg?((p.last/p.avg-1)*100):0
    lines.push([p.symbol,p.qty,p.avg.toFixed(2),p.last.toFixed(2),pnlAbs.toFixed(2),pnlPct.toFixed(2)].join(','))
  }) }
  const blob=new Blob([lines.join('\n')],{type:'text/plain'}), url=URL.createObjectURL(blob)
  const a=document.createElement('a'); a.href=url; a.download='AureliOS_Summary.txt'; a.click(); URL.revokeObjectURL(url)
}

// SW
if('serviceWorker' in navigator){ window.addEventListener('load', ()=> navigator.serviceWorker.register('./service-worker.js')) }

load(); render();
