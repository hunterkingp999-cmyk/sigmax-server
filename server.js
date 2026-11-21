const http=require('http'),fs=require('fs');
const DB='users.json';let U={};try{U=JSON.parse(fs.readFileSync(DB,'utf8'))}catch(_){}
const used=()=>new Set(Object.values(U).map(x=>x.uid));
function newUid(){const s=used();let u;do{u=String(1000000000+Math.floor(Math.random()*8999999999))}while(s.has(u));return u}
http.createServer((q,r)=>{
r.setHeader('Access-Control-Allow-Origin','*');r.setHeader('Access-Control-Allow-Headers','Content-Type');
if(q.method==='OPTIONS'){r.end();return}
if(q.method==='POST'&&q.url==='/login'){let b='';q.on('data',d=>{b+=d;if(b.length>2e3)q.destroy()});
q.on('end',()=>{try{const {name,device}=JSON.parse(b);const key=String(name||'').toLowerCase().slice(0,12)+'|'+String(device||'').slice(0,40);
if(!U[key])U[key]={uid:newUid(),name:String(name).slice(0,12),t:Date.now()};
try{fs.writeFileSync(DB,JSON.stringify(U))}catch(_){}
r.setHeader('Content-Type','application/json');r.end(JSON.stringify({uid:U[key].uid}))}catch(e){r.statusCode=400;r.end('{}')}});return}
r.statusCode=200;r.end('SIGMAX UID server OK');
}).listen(process.env.PORT||3000,()=>console.log('UID server ready'));
