(() => {
'use strict';
let lang = 'nb', filter = 'all', current = 0, submitted = false, expanded = false, page = 0;
const mobile = matchMedia('(max-width:720px)');
try { if (localStorage.getItem('miljo-language') === 'en') lang = 'en'; } catch {}
const $ = id => document.getElementById(id);
const t = () => window.SITE_CONTENT[lang];
const flag = english => english ? '<img src="./assets/flag-uk.svg" alt="" aria-hidden="true">' : '<svg viewBox="0 0 60 36" aria-hidden="true"><path fill="#ba0c2f" d="M0 0h60v36H0z"/><path fill="#fff" d="M15 0h12v36H15zM0 12h60v12H0z"/><path fill="#00205b" d="M18 0h6v36h-6zM0 15h60v6H0z"/></svg>';
function node(tag, text, cls) { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
function renderProjects() {
  $('filters').hidden=!expanded; $('show-projects').textContent=expanded?t().showLess:t().showAll; $('show-projects').setAttribute('aria-expanded',String(expanded));
  $('filters').replaceChildren(); $('filters').setAttribute('aria-label',t().filterLabel);
  ['all','garden','ground','concrete'].forEach(key => {const b=node('button',t()[key]); b.type='button';b.setAttribute('aria-pressed',String(filter===key));b.onclick=()=>{filter=key;page=0;renderProjects();[...$('filters').children].find(x=>x.textContent===t()[key]).focus();};$('filters').append(b);});
  $('project-grid').replaceChildren();
  const selected=window.SITE_PROJECTS.map((p,i)=>({p,i})).filter(({p,i})=>(expanded||i<3)&&(filter==='all'||p.category===filter));
  const size=mobile.matches?1:3, total=Math.max(1,Math.ceil(selected.length/size));page=Math.min(page,total-1);
  $('page-previous').textContent=t().previous;$('page-next').textContent=t().next;$('page-previous').disabled=page===0;$('page-next').disabled=page===total-1;$('page-count').textContent=t().page+' '+(page+1)+' '+t().pageOf+' '+total;
  selected.slice(page*size,(page+1)*size).forEach(({p,i})=> {const b=node('button',null,'project-card');b.type='button';b.setAttribute('aria-label',t().viewProject+': '+p[lang].title);const wrap=node('div',null,'project-image');const img=node('img');img.src=p.image;img.alt=p[lang].alt;img.loading='lazy';img.style.objectPosition=p.position;wrap.append(img);if(p.demo)wrap.append(node('span',t().demoProject));b.append(wrap,node('h3',p[lang].title),node('p',p[lang].summary+' ↗'));b.onclick=()=>{current=i;renderDialog();$('project-dialog').showModal();};$('project-grid').append(b);});
}
function renderDialog(){const p=window.SITE_PROJECTS[current];$('dialog-title').textContent=p[lang].title;$('dialog-text').textContent=p[lang].description;$('dialog-image').src=p.image;$('dialog-image').alt=p[lang].alt;$('dialog-image').style.objectPosition=p.position;$('counter').textContent=`${t().gallery} ${current+1} / ${window.SITE_PROJECTS.length}`;$('close-dialog').textContent=t().close;$('previous').textContent=t().previous;$('next').textContent=t().next;$('project-dialog').querySelector('[data-t="demoProject"]').hidden=!p.demo;$('project-dialog').querySelector('[data-t="projectDisclaimer"]').hidden=!p.demo;}
function render(){document.documentElement.lang=lang;document.title=(lang==='nb'?'Nettsidedemo':'Website demo')+' | Miljø og Landskapsentreprenørene AS';document.querySelector('meta[name="description"]').content=t().heroText;document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t()[el.dataset.t];});$('navigation').setAttribute('aria-label',lang==='nb'?'Hovedmeny':'Main navigation');$('language').innerHTML=flag(lang==='nb')+'<span>'+(lang==='nb'?'EN':'NO')+'</span>';$('language').setAttribute('aria-label',lang==='nb'?'Switch to English':'Bytt til norsk');$('language').lang=lang==='nb'?'en':'nb';$('service-grid').replaceChildren();t().serviceItems.forEach((s,i)=>{const card=node('article',null,'service-card');const link=node('a',t().learnMore);link.href='#kontakt';const icon=node('span',null,'service-icon');icon.setAttribute('aria-hidden','true');icon.innerHTML='<svg viewBox="0 0 64 56">'+["<path d=\"M31 44V27M31 34C15 35 11 23 12 16c14 0 21 6 19 18Zm0-7C30 13 41 8 49 9c1 13-5 20-18 18Z\"/>","<path d=\"M9 42h36v7H9zM20 40V27h15v13M25 27V17h11v10M35 18l9-8 11 23-5 2-9-17-5 5M48 34h10v7H47z\"/><circle cx=\"17\" cy=\"46\" r=\"5\"/><circle cx=\"38\" cy=\"46\" r=\"5\"/>","<path d=\"M8 35h36v9H8zM43 27h9l7 10v7H43zM16 13l20 1 6 17-15 5-14-9z\"/><circle cx=\"17\" cy=\"46\" r=\"5\"/><circle cx=\"49\" cy=\"46\" r=\"5\"/>","<path d=\"M10 36h12v10H10zM25 36h12v10H25zM10 23h12v10H10zM25 23h12v10H25zM38 11l7-5 13 17-7 5zM44 23l-9 14-4-3 10-14z\"/>"][i]+'</svg>';card.append(icon,node('h3',s[0]),node('p',s[1]),link);$('service-grid').append(card);});renderProjects();if($('project-dialog').open)renderDialog();$('form-status').textContent=submitted?t().formSuccess:'';$('name').setCustomValidity('');$('message').setCustomValidity('');}
$('show-projects').onclick=()=>{expanded=!expanded;filter='all';page=0;renderProjects();};
$('language').onclick=()=>{lang=lang==='nb'?'en':'nb';try{localStorage.setItem('miljo-language',lang);}catch{}render();};
$('menu').onclick=()=>{const open=$('menu').getAttribute('aria-expanded')!=='true';$('menu').setAttribute('aria-expanded',String(open));$('navigation').classList.toggle('open',open);};
function closeMenu(){$('navigation').classList.remove('open');$('menu').setAttribute('aria-expanded','false');}
$('navigation').querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
$('close-dialog').onclick=()=>$('project-dialog').close();$('previous').onclick=()=>{current=(current-1+window.SITE_PROJECTS.length)%window.SITE_PROJECTS.length;renderDialog();};$('next').onclick=()=>{current=(current+1)%window.SITE_PROJECTS.length;renderDialog();};
$('project-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')$('previous').click();if(e.key==='ArrowRight')$('next').click();});
$('contact-form').addEventListener('submit',e=>{e.preventDefault();for(const [id,key] of [['name','invalidName'],['message','invalidMessage']]){$(id).setCustomValidity($(id).value.trim()?'':t()[key]);}if(!$('contact-form').reportValidity())return;submitted=true;$('form-status').textContent=t().formSuccess;});
['name','email','message'].forEach(id=>$(id).addEventListener('input',()=>{$(id).setCustomValidity('');submitted=false;$('form-status').textContent='';}));

const routes=['hjem','tjenester','prosjekter','om-oss','kontakt'];
function route(focus=false){
 const id=routes.includes(location.hash.slice(1))?location.hash.slice(1):'hjem';
 document.querySelectorAll('main > section').forEach(el=>{el.hidden=el.id!==id;});
 $('navigation').querySelectorAll('a').forEach(a=>{if(a.getAttribute('href')==='#'+id)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 if(focus){const title=$(id).querySelector('h1,h2');title.tabIndex=-1;title.focus({preventScroll:true});}
}
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const id=a.getAttribute('href').slice(1);if(id==='main'){e.preventDefault();$('main').focus();return;}if(!routes.includes(id))return;e.preventDefault();history.pushState(null,'',location.pathname+location.search+'#'+id);route(true);});
window.addEventListener('popstate',()=>route());window.addEventListener('hashchange',()=>route());
$('page-previous').onclick=()=>{page--;renderProjects();};$('page-next').onclick=()=>{page++;renderProjects();};
mobile.addEventListener('change',()=>{page=0;renderProjects();});
render();route();
$('contact-form').querySelector('[type=submit]').disabled=false;
})();
