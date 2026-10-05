const ADDRESS='5cQReyzgJQbtbGLvkm1vN9GDGFBWzcAC6TDprBwzVVjL';
const SOURCE='https://usepaid.app/token/'+ADDRESS;
let cache, fetched=0, pending;
export function parseMetrics(html){
 if(!html.includes(ADDRESS))throw new Error('Token mismatch');
 const parts=html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]+>/g,'\n').split('\n').map(x=>x.trim()).filter(Boolean);
 const sent=parts[parts.indexOf('Sent')-1],i=parts.indexOf('This token contributes');
 if(i<0||parts[i+2]!=='/')throw new Error('Source layout changed');
 const token=parts[i+1],total=parts[i+3],status=parts[i+4],numeric=/^\$?\d[\d,]*(?:\.\d+)?$/;
 if(![sent,token,total].every(x=>typeof x==='string'&&numeric.test(x)))throw new Error('Invalid values');
 if(!['24h cap reached','Payments paused','Waiting for next payout'].includes(status))throw new Error('Unrecognized status');
 const usd=x=>'$'+x.replace(/^\$/,'');
 return {address:ADDRESS,sent:usd(sent),tokenPending:usd(token),recipientPending:usd(total),status,source:SOURCE,fetchedAt:new Date().toISOString(),stale:false};
}
export async function getMetrics(){
 if(cache&&Date.now()-fetched<45000)return cache;
 if(pending)return pending;
 pending=(async()=>{try{const response=await fetch(SOURCE,{signal:AbortSignal.timeout(12000)});if(!response.ok)throw new Error('Source unavailable');const data=parseMetrics(await response.text());cache=data;fetched=Date.now();return data;}catch(error){if(cache)return {...cache,stale:true};throw error;}finally{pending=null;}})();
 return pending;
}
