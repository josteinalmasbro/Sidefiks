(() => {
  const trigger=document.querySelector('#menu-toggle');
  const menu=document.createElement('dialog');menu.id='puck-menu';menu.setAttribute('aria-label','Velg din sone');
  const choices=[['Alt utstyr','#butikk'],['Skøyter','#kategori/skoyter'],['Køller','#kategori/koller'],['Beskyttelse','#kategori/beskyttelse'],['Tilbehør','#kategori/tilbehor']];
  menu.innerHTML=`<div class="menu-top"><strong><small>TRONDHEIM HOCKEY SHOP</small>VELG DIN SONE.</strong><button class="menu-close" aria-label="Lukk menyen">×</button></div><nav class="puck-grid" aria-label="Mobilmeny">${choices.map(([label,href])=>`<a href="${href}" class="nav-puck ${label.length>9?'long':''}"><span class="puck-brand">THS / 26</span><span>${label}</span><small>HOCKEY COLLECTION</small></a>`).join('')}</nav><div class="menu-note">DITT SPILL. DITT UTSTYR.</div><div class="shot-player" aria-hidden="true"><svg viewBox="0 0 180 165"><g stroke="#090f13" stroke-width="5" stroke-linejoin="round"><path d="m66 93-21 25-27 16 11 10 36-15 23-25Z" fill="#26323b"/><path d="m90 96 21 23-6 31 17 3 11-39-21-28Z" fill="#222f39"/><path d="m19 132-12 7 7 12 28-3-8-11m70 10-5 10 33 2-4-10" fill="#fff"/><path d="M15 155h28m59 9h34" stroke="#b6cdd9" stroke-width="3"/><path d="m68 40-18 23 6 34 49 11 17-39-23-24Z" fill="#ffd21a"/><path d="m57 84 50 11" stroke="#f8f8ed" stroke-width="7"/><path d="m84 42 5-17 18-2 6 17-15 14Z" fill="#deb995"/><path d="M84 32q-8-25 15-28 25 0 24 24l-16 5Z" fill="#1e2b34"/><path d="m111 24 14 8-12 16-12-10Z" fill="none" stroke="#d0e0e6" stroke-width="2"/><path d="m57 55-12 21 30 14 9-12-23-13m43-9 21 12-6 15-24-13" fill="#ffd21a"/><path d="m77 77 16 4-2 14-16-2m40-21 15 6-6 13-15-8" fill="#27343b"/></g><text x="76" y="70" font-family="Arial" font-size="17" font-weight="900" fill="#172329">26</text><g class="shot-stick"><path d="m89 85 61 60 23-1" fill="none" stroke="#fff" stroke-width="6"/><path d="m90 85 59 56" fill="none" stroke="#222e36" stroke-width="4"/></g></svg></div>`;
  document.body.append(menu);
  const pucks=[...menu.querySelectorAll('.nav-puck')],player=menu.querySelector('.shot-player'),stick=menu.querySelector('.shot-stick');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let busy=false,animations=[],generation=0,locked=false,scrollY=0;
  function lock(){if(locked)return;locked=true;scrollY=window.scrollY;document.body.style.position='fixed';document.body.style.top=`-${scrollY}px`;document.body.style.width='100%';}
  function unlock(){if(!locked)return;locked=false;document.body.style.position='';document.body.style.top='';document.body.style.width='';window.scrollTo(0,scrollY);}
  function cancel(){generation++;animations.forEach(a=>a.cancel());animations=[];busy=false;player.style.opacity='0';pucks.forEach(p=>{p.style.pointerEvents='';p.removeAttribute('aria-disabled')});}
  function close(){cancel();menu.close();trigger.setAttribute('aria-expanded','false');unlock();}
  function animate(el,frames,options){const a=el.animate(frames,options);animations.push(a);return a;}
  trigger.addEventListener('click',()=>{
    const origin=trigger.getBoundingClientRect();cancel();lock();menu.showModal();trigger.setAttribute('aria-expanded','true');
    if(!reduced.matches)pucks.forEach((p,i)=>{const r=p.getBoundingClientRect();animate(p,[{transform:`translate(${origin.x+origin.width/2-r.x-r.width/2}px,${origin.y+origin.height/2-r.y-r.height/2}px) scale(.18) rotate(100deg)`,opacity:0},{transform:'translate(0,0) scale(1) rotate(-12deg)',opacity:1}],{duration:260,delay:i*28,easing:'cubic-bezier(.2,.75,.2,1)',fill:'backwards'})});
  });
  menu.querySelector('.menu-close').onclick=close;
  menu.addEventListener('cancel',e=>{e.preventDefault();close()});
  menu.addEventListener('close',()=>{if(locked){cancel();trigger.setAttribute('aria-expanded','false');unlock()}});
  pucks.forEach(p=>p.addEventListener('click',async e=>{
    e.preventDefault();if(busy)return;busy=true;const token=++generation;const dest=p.getAttribute('href');
    const finish=()=>{if(token!==generation)return;close();if(location.hash===dest){window.scrollTo(0,0)}else location.hash=dest;};
    if(reduced.matches){finish();return}
    pucks.forEach(x=>{x.style.pointerEvents='none';x.setAttribute('aria-disabled','true')});
    const r=p.getBoundingClientRect(),px=r.left-145,py=r.top+r.height/2-126;player.style.left=`${px}px`;player.style.top=`${py}px`;player.style.opacity='1';
    animate(player,[{transform:`translateX(${-px-190}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:360,easing:'cubic-bezier(.15,.65,.25,1)',fill:'forwards'});
    animate(stick,[{transform:'rotate(-32deg)'},{transform:'rotate(16deg)'}],{duration:200,delay:280,easing:'ease-in',fill:'forwards'});
    const shot=animate(p,[{transform:'translateX(0) rotate(-12deg)',opacity:1},{transform:`translateX(${innerWidth+130}px) translateY(-25px) rotate(440deg)`,opacity:0}],{duration:240,delay:430,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
    try{
      await shot.finished;
      if(token!==generation)return;
      animate(player,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(18px)'}],{duration:220,easing:'ease-out',fill:'forwards'});
      const fade=animate(menu,[{opacity:1},{opacity:0}],{duration:260,delay:80,easing:'ease-in-out',fill:'forwards'});
      await fade.finished;
      finish();
    }catch{/* Closing or resizing cancels the shot and fade safely. */}
  }));
  window.addEventListener('hashchange',()=>{if(menu.open)close()});
  window.addEventListener('resize',()=>{if(menu.open)close()});
  const cart=document.querySelector('#cart-dialog');new MutationObserver(()=>{if(cart.open)lock();else if(!menu.open)unlock()}).observe(cart,{attributes:true,attributeFilter:['open']});
})();
