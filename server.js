const http=require('http'),fs=require('fs');
const DB='users.json';let U={};try{U=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(_){}
const used=()=>new Set(Object.values(U).map(x=>x.uid));
function newUid(){const s=used();let u;do{u=String(1000000000+Math.floor(Math.random()*8999999999))}while(s.has(u));return u}
const byUid=()=>{const m={};for(const k in U)m[U[k].uid]=U[k];return m};
const nameOf=u=>(byUid()[u]||{name:'Player'}).name;
let inv={},teamOf={},teams={};
const members=u=>teamOf[u]?teams[teamOf[u]]:[u];
function leave(u){const t=teamOf[u];if(!t)return;teams[t]=teams[t].filter(x=>x!==u);delete teamOf[u];
if(teams[t].length<2){teams[t].forEach(x=>delete teamOf[x]);delete teams[t]}}
const save=()=>{try{fs.writeFileSync(DB,JSON.stringify(U))}catch(_){}};
function send(r,o,c){r.statusCode=c||200;r.setHeader('Content-Type','application/json');r.end(JSON.stringify(o))}
http.createServer((q,r)=>{
r.setHeader('Access-Control-Allow-Origin','*');r.setHeader('Access-Control-Allow-Headers','Content-Type');
r.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
if(q.method==='OPTIONS'){r.end();return}
const url=new URL(q.url,'http://x');
if(q.method==='GET'&&url.pathname==='/sync'){
const uid=url.searchParams.get('uid')||'';const now=Date.now();
inv[uid]=(inv[uid]||[]).filter(i=>now-i.t<600000);
return send(r,{invites:inv[uid].map(i=>({from:i.from,name:nameOf(i.from)})),team:members(uid).map(u=>({uid:u,name:nameOf(u)}))});
}
if(q.method!=='POST'){r.statusCode=200;r.end('SIGMAX server OK');return}
let b='';q.on('data',d=>{b+=d;if(b.length>2e3)q.destroy()});
q.on('end',()=>{let j={};try{j=JSON.parse(b||'{}')}catch(_){return send(r,{ok:false,err:'bad json'},400)}
const p=url.pathname,M=byUid();
if(p==='/login'){const name=String(j.name||'Player').slice(0,12);const key=name.toLowerCase()+'|'+String(j.device||'').slice(0,40);
if(!U[key])U[key]={uid:newUid(),name,t:Date.now()};U[key].name=name;save();return send(r,{uid:U[key].uid})}
const uid=String(j.uid||j.from||'');
if(p==='/invite'){const from=String(j.from||''),to=String(j.to||'');
if(!M[from])return send(r,{ok:false,err:'Login again'});
if(!/^\d{10}$/.test(to)||!M[to])return send(r,{ok:false,err:'UID not found'});
if(to===from)return send(r,{ok:false,err:'That is your own UID'});
const mm=members(from);if(mm.includes(to))return send(r,{ok:false,err:'Already in your team'});
if(mm.length>=4)return send(r,{ok:false,err:'Team is full'});
inv[to]=(inv[to]||[]).filter(i=>i.from!==from);inv[to].push({from,t:Date.now()});
return send(r,{ok:true,name:M[to].name})}
if(p==='/accept'){const from=String(j.from||'');const list=inv[uid]||[];
if(!list.some(i=>i.from===from))return send(r,{ok:false,err:'Invite expired'});
if(members(from).length>=4)return send(r,{ok:false,err:'Team is full'});
leave(uid);let t=teamOf[from];if(!t){t='t'+Date.now()+Math.random().toString(36).slice(2,6);teams[t]=[from];teamOf[from]=t}
teams[t].push(uid);teamOf[uid]=t;inv[uid]=list.filter(i=>i.from!==from);return send(r,{ok:true})}
if(p==='/decline'){inv[uid]=(inv[uid]||[]).filter(i=>i.from!==String(j.from||''));return send(r,{ok:true})}
if(p==='/leave'){leave(uid);return send(r,{ok:true})}
send(r,{ok:false,err:'not found'},404)});
}).listen(process.env.PORT||3000,()=>console.log('SIGMAX server ready'));
