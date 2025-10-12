// AureliOS design-only micro-interactions (no trading logic touched)

// Press ripple & subtle “haptic” feel (CSS driven)
function attachPressEffects() {
  document.querySelectorAll('[data-ux="press"], .btn').forEach(el => {
    el.addEventListener('pointerdown', e => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--rx', `${e.clientX - rect.left}px`);
      el.style.setProperty('--ry', `${e.clientY - rect.top}px`);
      el.classList.add('is-pressed');
    }, {passive:true});
    ['pointerup','pointerleave','pointercancel'].forEach(type =>
      el.addEventListener(type, () => el.classList.remove('is-pressed'), {passive:true})
    );
  });
}

// Risk gauge demo hook (optional: update deg based on your policy calc)
function setRiskPercent(pct0to100){
  const deg = Math.round(2.7 * pct0to100); // ~270° arc
  document.querySelectorAll('.risk-gauge').forEach(g => g.style.setProperty('--risk-deg', `${deg}deg`));
}

// Initialize once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  attachPressEffects();
  // Example: seed gauge to 62%. Replace with real value later.
  setRiskPercent(62);
});
