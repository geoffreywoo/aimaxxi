// No inputs, query strings, fragments, or submission contents enter telemetry.
const day = () => new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function admissible(control, cohort, now = new Date()) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const expiry=Date.parse(control?.expiresAt);
 return control?.day===today && [1,.1].includes(control.sampleRate) && cohort>=0 && cohort<control.sampleRate && expiry>now.getTime() && expiry<=now.getTime()+90*60000;
}
export function cleanURL(value){const u=new URL(value);return u.origin+u.pathname;}
if(typeof window!=='undefined' && ['aimaxxi.com','www.aimaxxi.com'].includes(location.hostname)) {
 let control=null, injected=false, busy=false, cohortDay='',cohort=1; const sent=new Set();
 function sample(){if(cohortDay!==day()){cohortDay=day();cohort=Math.random();try{const k='aimaxxi:sample:'+cohortDay,v=sessionStorage.getItem(k);if(v!==null&&Number(v)>=0&&Number(v)<1)cohort=Number(v);else sessionStorage.setItem(k,String(cohort));}catch{}}return cohort;}
 const season=location.pathname.startsWith('/life-after-scarcity');
 const campaign=season?'life-after-scarcity':'aimaxxi-movement';
 const episode=season?'writers-room':'make-the-future-tangible';
 function send(name){if(!injected||!admissible(control,sample()))return;const k=`aimaxxi:${day()}:${episode}:${name}`;if(sent.has(k))return;try{if(sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1');}catch{}sent.add(k);window.va('event',{name,data:{campaign,episode}});}
 async function refresh(){if(busy)return;busy=true;try{const r=await fetch('https://www.clawfable.com/api/public/antihunter/analytics-control',{credentials:'omit',signal:AbortSignal.timeout(4000)});control=r.ok?await r.json():null;}catch{control=null;}finally{busy=false;}
 if(!admissible(control,sample()))return;
 if(!injected){window.va=window.va||function(...args){(window.vaq=window.vaq||[]).push(args)};window.va('beforeSend',event=>admissible(control,sample())?{...event,url:cleanURL(event.url)}:null);const script=document.createElement('script');script.defer=true;script.src='/_vercel/insights/script.js';document.head.appendChild(script);injected=true;}
 if(season||location.pathname.startsWith('/missions/make-the-future-tangible'))send('experience_view');}
 document.addEventListener('click',event=>{const a=event.target instanceof Element?event.target.closest('a'):null;if(!a)return;const kind=a.dataset.movementEvent||(a.hasAttribute('download')?'kit_download_intent':a.href.includes('/issues/new')?'submission_intent':a.href.includes('/intent/post')?'share_intent':a.dataset.tokenLink?'token_info_view':null);if(['kit_download_intent','submission_intent','share_intent','token_info_view'].includes(kind))send(kind);});
 void refresh();setInterval(()=>{if(!document.hidden)void refresh()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)void refresh()});
}
