'use strict';
// Public-site reader: bounded HTTPS requests, public IPv4 DNS pinned per request.
const https = require('node:https');
const dns = require('node:dns').promises;
const net = require('node:net');
function publicIP(ip) {
  if (net.isIP(ip) !== 4) return false;
  const [a,b] = ip.split('.').map(Number);
  return !(a===0||a===10||a===127||a>=224||(a===100&&b>=64&&b<=127)||(a===169&&b===254)||(a===172&&b>=16&&b<=31)||(a===192&&(b===168||b===0||b===2))||(a===198&&(b===18||b===19||b===51))||(a===203&&b===0));
}
function siteURL(value, base) {
  const u = new URL(value, base);
  if(u.protocol!=='https:'||u.username||u.password||(u.port&&u.port!=='443')||u.hostname.endsWith('.local')||u.href.length>2048)throw Error('Bruk en offentlig HTTPS-nettside.');
  u.hash=''; return u;
}
async function readURL(input, budget, redirects=0) {
  const url=siteURL(input);
  if(Date.now()>budget.until||budget.bytes<=0||budget.requests--<=0)throw Error('Nettsiden tok for lang tid å lese.');
  const records=await Promise.race([dns.lookup(url.hostname,{all:true,family:4}),new Promise((_,reject)=>{const t=setTimeout(()=>reject(Error('Oppslag tok for lang tid.')),3000);t.unref()})]);
  if(!records.length||records.some(r=>!publicIP(r.address)))throw Error('Adressen kan ikke leses.');
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{agent:false,headers:{'User-Agent':'BookingDesignPreview/1.0','Accept':'text/html,text/css,image/png,image/jpeg,image/webp;q=0.9','Accept-Encoding':'identity'},lookup:(_h,options,cb)=>options.all?cb(null,[records[0]]):cb(null,records[0].address,4)},res=>{
      if([301,302,303,307,308].includes(res.statusCode)){
        res.resume();if(redirects>=3||!res.headers.location)return reject(Error('For mange videresendinger.'));
        return Promise.resolve().then(()=>readURL(siteURL(res.headers.location,url).href,budget,redirects+1)).then(resolve,reject);
      }
      if(res.statusCode!==200){res.resume();return reject(Error('Nettsiden tillot ikke henting.'))}
      const chunks=[];let size=0;
      res.on('data',chunk=>{size+=chunk.length;budget.bytes-=chunk.length;if(size>1500000||budget.bytes<0){req.destroy(Error('Innholdet er for stort.'));return}chunks.push(chunk)});
      res.on('end',()=>resolve({url:url.href,type:String(res.headers['content-type']||'').split(';')[0].toLowerCase(),data:Buffer.concat(chunks)}));res.on('error',reject);
    });
    const timer=setTimeout(()=>req.destroy(Error('Nettsiden svarte ikke i tide.')),Math.max(1,Math.min(6000,budget.until-Date.now())));
    req.on('close',()=>clearTimeout(timer));req.on('error',reject);
  });
}
const unescapeHTML=s=>String(s).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#0*39;/g,"'");
function attrs(tag){const out={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))out[m[1].toLowerCase()]=unescapeHTML(m[2]??m[3]);return out}
function hex(value){if(!value)return null;const v=value.trim();if(/^#[0-9a-f]{6}$/i.test(v))return v.toLowerCase();if(/^#[0-9a-f]{3}$/i.test(v))return '#'+v.slice(1).split('').map(x=>x+x).join('');return null}
function colors(css){
  const accent=hex(css.match(/--(?:e-global-color-primary|primary-color|color-primary|brand-color|accent-color)\s*:\s*(#[\da-f]{3,6})\b/i)?.[1]);
  const bg=hex(css.match(/(?:body|:root)\s*\{[^}]*?(?:background-color|background)\s*:\s*(#[\da-f]{3,6})\b/i)?.[1]);
  const counts=new Map();for(const m of css.matchAll(/#[\da-f]{6}\b|#[\da-f]{3}\b/gi)){const c=hex(m[0]),rgb=c.slice(1).match(/../g).map(x=>parseInt(x,16));if(Math.max(...rgb)-Math.min(...rgb)>45)counts.set(c,(counts.get(c)||0)+1)}
  return {accent:accent||[...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||null,primary:bg||null};
}
function rasterType(data){if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';if(data[0]===255&&data[1]===216&&data[2]===255)return 'image/jpeg';if(data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WEBP')return 'image/webp';return null}
async function extract(input) {
  const budget={bytes:4500000,requests:10,until:Date.now()+21000};
  const page=await readURL(siteURL(/^https?:\/\//i.test(input)?input:'https://'+input).href,budget);
  if(!['text/html','application/xhtml+xml'].includes(page.type))throw Error('Adressen må peke på en nettside.');
  const html=page.data.toString('utf8'),base=page.url;
  const links=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>attrs(m[0])).filter(a=>a.rel?.includes('stylesheet')&&a.href).map(a=>{try{return siteURL(a.href,base).href}catch{return null}}).filter(Boolean);
  const cssLinks=[...new Set(links)].filter(u=>new URL(u).hostname===new URL(base).hostname).sort((a,b)=>Number(/post-6\.|global|custom|style\.css/i.test(b))-Number(/post-6\.|global|custom|style\.css/i.test(a))).slice(0,4);
  let css=[...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(m=>m[1]).join('\n');
  for(const url of cssLinks){try{const r=await readURL(url,budget);if(r.type==='text/css')css+='\n'+r.data.toString('utf8')}catch{}}
  const palette=colors(css),candidates=[];
  for(const m of html.matchAll(/<img\b[^>]*>/gi)){const a=attrs(m[0]);const src=a['data-lazy-src']||a['data-src']||a.src;const identity=[a.class,a.alt,src?.split('/').pop()].join(' ');const siteName=new URL(base).hostname.replace(/^www\./,'').split('.')[0];if(src&&(/logo|brand/i.test(identity)||(Number(a.width)/Number(a.height)>=2.5&&identity.toLowerCase().includes(siteName))))candidates.push(src)}
  for(const m of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){try{const walk=(v,depth=0)=>{if(depth>12||!v||typeof v!=='object')return;if(v.logo){const l=typeof v.logo==='string'?v.logo:v.logo.url||v.logo.contentUrl;if(l)candidates.push(l)}for(const x of Object.values(v))walk(x,depth+1)};walk(JSON.parse(m[1]))}catch{}}
  const urls=[...new Set(candidates.map(v=>{try{return siteURL(v,base).href}catch{return null}}).filter(Boolean))].slice(0,3),logos=[];
  for(const url of urls){try{const r=await readURL(url,budget),type=rasterType(r.data);if(type&&r.data.length<=800000)logos.push({data:'data:'+type+';base64,'+r.data.toString('base64'),label:/hvit|white/i.test(url)?'Lys logo':'Logo '+(logos.length+1)})}catch{}}
  return {source:base,...palette,logos,note:'Forslag fra tilgjengelige farger og logofiler. Kontroller resultatet før du bruker det.'};
}
const rates=new Map();
async function handler(req,res){
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST')return res.status(405).json({error:'Bruk henteknappen i designvinduet.'});
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Åpne designvinduet på denne nettsiden.'})}catch{return res.status(403).json({error:'Ugyldig forespørsel.'})}}
  const ip=req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown',now=Date.now(),v=rates.get(ip);
  if(v&&now-v.time<60000&&v.count>=6)return res.status(429).json({error:'Vent et minutt før du prøver igjen.'});
  if(rates.size>1000)rates.clear();rates.set(ip,{time:v&&now-v.time<60000?v.time:now,count:v&&now-v.time<60000?v.count+1:1});
  try{const body=typeof req.body==='string'?JSON.parse(req.body):req.body;if(typeof body?.url!=='string'||body.url.length>2048)throw Error('Skriv inn nettadressen.');return res.status(200).json(await extract(body.url.trim()))}catch(e){return res.status(400).json({error:/[æøå]|HTTPS/.test(e.message)?e.message:'Kunne ikke hente design. Prøv en annen adresse, eller velg farger og logo selv.'})}
}
module.exports=handler;
module.exports._test={publicIP,siteURL,colors,extract,rasterType};



