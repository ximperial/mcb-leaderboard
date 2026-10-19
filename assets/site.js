/* Static GitHub Pages interactions: no API, database download, or server session. */
document.querySelectorAll('[data-season-nav]').forEach(select=>select.addEventListener('change',()=>{location.href=select.value;}));
document.querySelectorAll('[data-filter]').forEach(root=>{
  const parent=root.querySelector('[data-items]'),items=[...parent.querySelectorAll(':scope > [data-item]')];
  const search=root.querySelector('[data-search]'),sort=root.querySelector('[data-sort]'),minimum=root.querySelector('[data-min-games]'),combat=root.querySelector('[data-combat-filter]');
  const pager=root.querySelector('[data-pagination]'),empty=root.querySelector('[data-empty]'),count=root.querySelector('[data-count]');
  let page=0;const size=25;
  function draw(){
    const q=search.value.trim().toLowerCase(),key=sort.value;
    const visible=items.filter(item=>(item.dataset.searchValue||'').toLowerCase().includes(q)&&(!minimum||Number(item.dataset.games)>=Number(minimum.value))&&(!combat||!combat.value||combat.value===item.dataset.combat));
    visible.sort((a,b)=>Number(b.dataset[key]||0)-Number(a.dataset[key]||0));
    const pages=Math.ceil(visible.length/size);page=Math.min(page,Math.max(0,pages-1));
    items.forEach(item=>item.hidden=true);
    visible.forEach((item,i)=>{parent.appendChild(item);item.hidden=i<page*size||i>=(page+1)*size;});
    if(count)count.textContent=visible.length+' results';
    if(empty)empty.hidden=visible.length!==0;
    if(pager){
      pager.replaceChildren();
      if(pages>1){
        const prev=document.createElement('button'),next=document.createElement('button'),label=document.createElement('span');
        prev.textContent='← Previous';next.textContent='Next →';prev.type=next.type='button';prev.disabled=page===0;next.disabled=page===pages-1;
        label.textContent=` ${page+1} / ${pages} `;
        prev.addEventListener('click',()=>{page--;draw();root.scrollIntoView({block:'start'});});next.addEventListener('click',()=>{page++;draw();root.scrollIntoView({block:'start'});});
        pager.append(prev,label,next);
      }
    }
  }
  [search,sort,minimum,combat].filter(Boolean).forEach(control=>control.addEventListener(control===search?'input':'change',()=>{page=0;draw();}));draw();
});
document.querySelectorAll('[data-combat-view]').forEach(root=>{
  const players=JSON.parse(root.querySelector('[data-match-players]').textContent),select=root.querySelector('[data-player-select]');
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=(p,button=false)=>{const img=p.icon?`<img class="portrait" src="${esc(p.icon)}" alt="${esc(p.hero||'')}">`:'<span class="portrait empty-portrait"></span>';return button?`<button type="button" class="hero-button" aria-label="${esc(p.name)} · ${esc(p.hero||'Hero not recorded')}" aria-expanded="false">${img}<span class="tip" role="tooltip"><b>${esc(p.name)}</b><small>${esc(p.hero||'Hero not recorded')}</small></span></button>`:img;};
  const kill=(a,b)=>{const raw=a.kills[b.key.join('\x1f')];return typeof raw==='string'&&/^\d+$/.test(raw)?Number(raw):0;};
  function choose(value){
    const player=players.find(p=>p.id===Number(value));select.value=player.id;
    root.querySelector('[data-selected-player]').innerHTML=icon(player)+`<div><strong>${esc(player.name)}</strong><div class="sub">${esc(player.hero||'Hero not recorded')} · Team ${player.team+1}</div></div>`;
    const results=root.querySelector('[data-combat-results]');
    if(!player.tracked){results.innerHTML='<p class="empty">Kill matchups were not recorded for this player. Missing values are not counted as zero.</p>';return;}
    results.innerHTML=[false,true].map(incoming=>{
      const rows=players.filter(p=>p.team!==player.team).map(p=>({p,n:incoming?kill(p,player):kill(player,p)})).filter(r=>r.n>0).sort((a,b)=>b.n-a.n||a.p.name.localeCompare(b.p.name));
      const maximum=Math.max(1,...rows.map(r=>r.n));
      return `<div class="combat-panel ${incoming?'deaths':''}"><div class="combat-panel-header"><h3>${incoming?'KILLED BY':'KILLED'}</h3><span>Recorded matchups</span></div>${rows.map(({p,n})=>`<div class="opponent">${icon(p,true)}<div><strong>${esc(p.name)}</strong><div class="hero-name">${esc(p.hero||'Hero not recorded')}</div><div class="bar"><span style="width:${n/maximum*100}%"></span></div></div><div class="opponent-count">${n}</div></div>`).join('')||'<p class="empty">No credited kills reported in this direction.</p>'}</div>`;
    }).join('');
    results.querySelectorAll('.hero-button').forEach(button=>button.addEventListener('click',()=>{const open=button.classList.toggle('open');button.setAttribute('aria-expanded',String(open));}));
  }
  select.addEventListener('change',()=>choose(select.value));
  document.querySelectorAll('[data-player]').forEach(button=>button.addEventListener('click',()=>{choose(button.dataset.player);document.getElementById('combat').scrollIntoView({behavior:'smooth'});}));
  choose((players.find(p=>p.tracked)||players[0]).id);
});
