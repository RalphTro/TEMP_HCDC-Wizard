async function loadModel(url){ const res = await fetch(url); if(!res.ok) throw new Error('JSON load failed'); return res.json(); }
function i18nHelper(model){ let locale = model.i18n?.defaultLocale || 'en'; const t=(k)=> (model.i18n?.strings?.[locale]?.[k] ?? k); return { t, get locale(){return locale;}, setLocale(l){ if(model.i18n?.strings?.[l]) locale=l; } }; }

function runWizard(model){
  const i18n = i18nHelper(model);
  const state = { current: (model.nodes.find(n=>n.type==='start')?.id ?? 'start'), history: [] };

  const root = document.getElementById('app');
  const titleEl = document.getElementById('title');
  titleEl.textContent = model.title + ' – ' + model.version;

  function goto(nextId, label){
    state.history.push({ from: state.current, to: nextId, label });
    state.current = nextId;
    render();
  }

  function render(){
    const node = model.nodes.find(n=>n.id===state.current);
    if(!node){ root.innerHTML = '<p>End.</p>'; return; }

    if(node.type==='start'){
      root.innerHTML = `
        <div class="card">
          <div class="badge step">Start</div>
          <h2>${i18n.t(node.text)}</h2>
          <div class="buttons"><button id="next">${i18n.t('btn_continue')||'Continue'}</button></div>
          <hr/><div class="small code">Node: ${node.id}</div>
        </div>`;
      document.getElementById('next').addEventListener('click', ()=>goto(node.next, 'start'));
      return;
    }

    if(node.type==='process'){
      root.innerHTML = `
        <div class="card">
          <div class="badge step">Step</div>
          <h2>${i18n.t(node.text)}</h2>
          ${node.ui?.note ? `<div class="note">${node.ui.note}</div>` : ''}
          <div class="buttons"><button id="next">${i18n.t('btn_continue')||'Continue'}</button></div>
          <hr/><div class="small code">Node: ${node.id}</div>
        </div>`;
      document.getElementById('next').addEventListener('click', ()=>goto(node.next, 'continue'));
      return;
    }

    if(node.type==='decision'){
      const outcomes = node.outcomes || [];
      root.innerHTML = `
        <div class="card">
          <div class="badge decision">Decision</div>
          <h2>${i18n.t(node.text)}</h2>
          ${node.ui?.note ? `<div class="note">${node.ui.note}</div>` : ''}
          <div class="buttons">${outcomes.map((o,i)=>`<button data-i="${i}">${i18n.t(o.label)}</button>`).join('')}</div>
          <hr/><div class="small code">Node: ${node.id}</div>
        </div>`;
      root.querySelectorAll('button').forEach(btn=>{
        btn.addEventListener('click', ()=>{
          const o = outcomes[Number(btn.dataset.i)];
          goto(o.next, o.label);
        });
      });
      return;
    }

    if(node.type==='result'){
      root.innerHTML = `
        <div class="card">
          <div class="badge result">Result</div>
          <h2>${i18n.t(node.text)}</h2>
          <div class="buttons" style="margin-top:24px"><button id="restart">${i18n.t('btn_restart')||'Restart'}</button></div>
          <hr/><div class="small code">Node: ${node.id}</div>
        </div>`;
      document.getElementById('restart').addEventListener('click', ()=>{ state.current='start'; state.history=[]; render(); });
      return;
    }

    root.innerHTML = `<pre>${JSON.stringify(node,null,2)}</pre>`;
  }

  // Locale selector
  const localeSel = document.getElementById('locale');
  const locales = Object.keys(model.i18n?.strings || {en:{}});
  localeSel.innerHTML = locales.map(l=>`<option value="${l}">${l}</option>`).join('');
  localeSel.value = model.i18n?.defaultLocale || 'en';
  localeSel.addEventListener('change', ()=>{ i18n.setLocale(localeSel.value); render(); });

  render();
}

(async function(){
  const model = await loadModel('./diagram.json');
  window.__wizardModel = model;
  runWizard(model);
})();
