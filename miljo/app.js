(() => {
'use strict';
let lang = 'nb', filter = 'all', current = 0, submitted = false;
try { if (localStorage.getItem('miljo-language') === 'en') lang = 'en'; } catch {}
const $ = id => document.getElementById(id);
const t = () => window.SITE_CONTENT[lang];
const flag = english => english ? '<svg viewBox="0 0 60 36" aria-hidden="true"><path fill="#fff" d="M0 0h60v36H0z"/><path fill="#c8102e" d="M25 0h10v36H25zM0 13h60v10H0z"/></svg>' : '<svg viewBox="0 0 60 36" aria-hidden="true"><path fill="#ba0c2f" d="M0 0h60v36H0z"/><path fill="#fff" d="M15 0h12v36H15zM0 12h60v12H0z"/><path fill="#00205b" d="M18 0h6v36h-6zM0 15h60v6H0z"/></svg>';
function node(tag, text, cls) { const n = document.createElement(tag); if (text) n.textContent = text; if (cls) n.className = cls; return n; }
function renderProjects() {
  $('filters').replaceChildren(); $('filters').setAttribute('aria-label',t().filterLabel);
  ['all','garden','ground','concrete'].forEach(key => {const b=node('button',t()[key]); b.type='button';b.setAttribute('aria-pressed',String(filter===key));b.onclick=()=>{filter=key;renderProjects();[...$('filters').children].find(x=>x.textContent===t()[key]).focus();};$('filters').append(b);});
  $('project-grid').replaceChildren();
  window.SITE_PROJECTS.forEach((p,i)=> {if(filter!=='all'&&p.category!==filter)return;const b=node('button',null,'project-card');b.type='button';b.setAttribute('aria-label',t().viewProject+': '+p[lang].title);const wrap=node('div',null,'project-image');const img=node('img');img.src=p.image;img.alt=p[lang].alt;img.loading='lazy';img.style.objectPosition=p.position;wrap.append(img);if(p.demo)wrap.append(node('span',t().demoProject));b.append(wrap,node('h3',p[lang].title),node('p',p[lang].summary+' ↗'));b.onclick=()=>{current=i;renderDialog();$('project-dialog').showModal();};$('project-grid').append(b);});
}
function renderDialog(){const p=window.SITE_PROJECTS[current];$('dialog-title').textContent=p[lang].title;$('dialog-text').textContent=p[lang].description;$('dialog-image').src=p.image;$('dialog-image').alt=p[lang].alt;$('dialog-image').style.objectPosition=p.position;$('counter').textContent=`${t().gallery} ${current+1} / ${window.SITE_PROJECTS.length}`;$('close-dialog').textContent=t().close;$('previous').textContent=t().previous;$('next').textContent=t().next;$('project-dialog').querySelector('[data-t="demoProject"]').hidden=!p.demo;$('project-dialog').querySelector('[data-t="projectDisclaimer"]').hidden=!p.demo;}
function render(){document.documentElement.lang=lang;document.title=(lang==='nb'?'Nettsidedemo':'Website demo')+' | Miljø og Landskapsentreprenørene AS';document.querySelector('meta[name="description"]').content=t().heroText;document.querySelectorAll('[data-t]').forEach(el=>{el.textContent=t()[el.dataset.t];});$('navigation').setAttribute('aria-label',lang==='nb'?'Hovedmeny':'Main navigation');$('language').innerHTML=flag(lang==='nb')+'<span>'+(lang==='nb'?'EN':'NO')+'</span>';$('language').setAttribute('aria-label',lang==='nb'?'Switch to English':'Bytt til norsk');$('language').lang=lang==='nb'?'en':'nb';$('service-grid').replaceChildren();t().serviceItems.forEach((s,i)=>{const card=node('article',null,'service-card');const link=node('a',t().learnMore);link.href='#kontakt';card.append(node('span','0'+(i+1),'number'),node('h3',s[0]),node('p',s[1]),link);$('service-grid').append(card);});renderProjects();if($('project-dialog').open)renderDialog();$('form-status').textContent=submitted?t().formSuccess:'';$('name').setCustomValidity('');$('message').setCustomValidity('');}
$('language').onclick=()=>{lang=lang==='nb'?'en':'nb';try{localStorage.setItem('miljo-language',lang);}catch{}render();};
$('menu').onclick=()=>{const open=$('menu').getAttribute('aria-expanded')!=='true';$('menu').setAttribute('aria-expanded',String(open));$('navigation').classList.toggle('open',open);};
function closeMenu(){$('navigation').classList.remove('open');$('menu').setAttribute('aria-expanded','false');}
$('navigation').querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
$('close-dialog').onclick=()=>$('project-dialog').close();$('previous').onclick=()=>{current=(current-1+window.SITE_PROJECTS.length)%window.SITE_PROJECTS.length;renderDialog();};$('next').onclick=()=>{current=(current+1)%window.SITE_PROJECTS.length;renderDialog();};
$('project-dialog').addEventListener('keydown',e=>{if(e.key==='ArrowLeft')$('previous').click();if(e.key==='ArrowRight')$('next').click();});
$('contact-form').addEventListener('submit',e=>{e.preventDefault();for(const [id,key] of [['name','invalidName'],['message','invalidMessage']]){$(id).setCustomValidity($(id).value.trim()?'':t()[key]);}if(!$('contact-form').reportValidity())return;submitted=true;$('form-status').textContent=t().formSuccess;});
['name','email','message'].forEach(id=>$(id).addEventListener('input',()=>{$(id).setCustomValidity('');submitted=false;$('form-status').textContent='';}));
render();
})();
