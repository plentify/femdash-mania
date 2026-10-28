
const $=s=>document.querySelector(s);try{document.fonts.load('800 30px "Exo 2"');document.fonts.load('italic 800 30px "Exo 2"');document.fonts.load('700 16px "Exo 2"')}catch(e){}
const AC=new(window.AudioContext||window.webkitAudioContext)();
const master=AC.createGain();master.connect(AC.destination);
const sfxG=AC.createGain();sfxG.connect(master);sfxG.gain.value=.49;
function tone(f,t0,d,type,g,f2){const o=AC.createOscillator(),v=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t0);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t0+d);v.gain.setValueAtTime(g,t0);v.gain.exponentialRampToValueAtTime(.0001,t0+d);o.connect(v);v.connect(sfxG);o.start(t0);o.stop(t0+d+.02)}
function noise(t0,d,g,hp){const n=AC.sampleRate*d|0,b=AC.createBuffer(1,n,AC.sampleRate),a=b.getChannelData(0);for(let i=0;i<n;i++)a[i]=Math.random()*2-1;const s=AC.createBufferSource(),f=AC.createBiquadFilter(),v=AC.createGain();s.buffer=b;f.type='highpass';f.frequency.value=hp;v.gain.setValueAtTime(g,t0);v.gain.exponentialRampToValueAtTime(.0001,t0+d);s.connect(f);f.connect(v);v.connect(sfxG);s.start(t0)}
const SFX={
 hit(q){const t=AC.currentTime,f={Perfect:1900,Great:1500,Good:1100}[q];tone(f,t,.05,'triangle',.5,f*.6);noise(t,.03,q==='Good'?.2:.35,3000)},
 miss(){tone(150,AC.currentTime,.16,'sine',.5,60)},
 tick(){tone(900,AC.currentTime,.04,'sine',.3)},
 ok(){const t=AC.currentTime;tone(660,t,.08,'sine',.35);tone(990,t+.07,.12,'sine',.35)},
 back(){const t=AC.currentTime;tone(660,t,.07,'sine',.3);tone(440,t+.06,.1,'sine',.3)},
 count(go){tone(go?1320:880,AC.currentTime,go?.25:.1,'sine',.4)},
 combo(){const t=AC.currentTime;tone(1047,t,.12,'sine',.3);tone(1568,t+.08,.2,'sine',.3)},
 rank(g){const t=AC.currentTime;(g==='D'?[392,330,262]:g==='C'?[392,440]:[523,659,784,1047]).forEach((f,i)=>tone(f,t+i*.11,.25,'triangle',.35))}};
function sfx(n,a){try{SFX[n](a)}catch(e){}}

const cv=$('#cv'),g=cv.getContext('2d');
const COL=['#ff7ac0','#4fd6ff','#4fd6ff','#ff7ac0'],FD='"Exo 2",system-ui,sans-serif',KEYS=['A','S','K','L'],KM={a:0,s:1,k:2,l:3};
let BIND=['a','s','k','l'];
const KNAME={' ':'Space',arrowleft:'←',arrowright:'→',arrowup:'↑',arrowdown:'↓'};
const klabel=k=>KNAME[k]||(k.length===1?k.toUpperCase():k[0].toUpperCase()+k.slice(1));
function applyBind(){for(const k in KM)delete KM[k];KEYS.length=0;BIND.forEach((k,i)=>{KM[k]=i;KEYS.push(klabel(k))});document.querySelectorAll('.kb').forEach((b,i)=>{b.textContent=KEYS[i]})}
const WIN=[[.07,'Perfect',300],[.12,'Great',200],[.17,'Good',100]];
let songs=[],catalog=[],lib=new Set(),sel=-1,diff='normal',st=null,raf=0,W=0,H=0;

function resize(){const d=devicePixelRatio||1;W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0)}
addEventListener('resize',resize);

function renderList(){
  const l=$('#list');l.innerHTML='';
  songs.forEach((s,i)=>{const d=document.createElement('div');d.className='card'+(i===sel?' on':'');d.tabIndex=0;
    d.innerHTML='<div class="th"></div><div><b></b><small></small></div>';
    if(s.cover)d.firstChild.style.backgroundImage='url('+s.cover+')';
    d.querySelector('b').textContent=s.name;d.querySelector('small').textContent=s.artist||'Your mp3';
    d.onclick=()=>{sel=i;sfx('tick');renderList()};d.onkeydown=e=>{if(e.key==='Enter'){sel=i;renderList()}};l.appendChild(d)});
  $('#go').disabled=sel<0;setInfo()}

const LIBKEY='fdm_lib';
function fmtSize(n){return n?(n>=1e6?(n/1e6).toFixed(1)+' MB':Math.round(n/1e3)+' KB'):''}
function initLib(){let a=null;try{a=JSON.parse(localStorage.getItem(LIBKEY))}catch(e){}
  lib=new Set(Array.isArray(a)?a:catalog.filter(c=>c.starter).map(c=>c.name));
  if(!lib.size&&!Array.isArray(a))catalog.forEach(c=>lib.add(c.name));
  applyLib(null)}
function saveLib(){try{localStorage.setItem(LIBKEY,JSON.stringify([...lib]))}catch(e){}}
function applyLib(keep){songs.length=0;catalog.forEach(c=>{if(lib.has(c.name))songs.push(c)});const i=songs.indexOf(keep);sel=songs.length?(i>=0?i:0):-1}
async function install(c){
  if(c.installing)return;c.installing=true;renderMaps();
  try{if(c.audio&&!c.b64&&window.caches){const cc=await caches.open('fdm-maps');await cc.add(c.audio)}lib.add(c.name);saveLib()}
  catch(e){$('#mmsg').textContent='Couldn’t download '+c.name+'. Try again.'}
  c.installing=false;applyLib(songs[sel]);renderList();renderMaps()}
async function uninstall(c){
  lib.delete(c.name);saveLib();c.buf=null;
  try{if(window.caches&&c.audio&&!c.b64){const cc=await caches.open('fdm-maps');await cc.delete(c.audio)}}catch(e){}
  applyLib(songs[sel]);renderList();renderMaps()}
function mk(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!==undefined)e.textContent=txt;return e}
function renderMaps(){
  const q=$('#msearch').value.trim().toLowerCase(),sort=$('#msort').value,hold=$('#mhold').checked,L=$('#mlist');
  const a=catalog.filter(c=>(!q||(c.name+' '+(c.artist||'')).toLowerCase().includes(q))&&(!hold||c.chart.notes.some(n=>n.length>2)));
  const bpm=c=>c.chart.disp||c.chart.bpm;
  a.sort((x,y)=>sort==='bpm'?bpm(x)-bpm(y):sort==='len'?(x.duration||0)-(y.duration||0):x.name.localeCompare(y.name));
  L.innerHTML='';
  for(const c of a){
    const d=mk('div','mcard'),th=mk('div','mth'),mi=mk('div','mi'),act=mk('div','mact');
    if(c.cover)th.style.backgroundImage='url('+c.cover+')';
    const chips=mk('div','chips'),dd=Math.round(c.duration||0),m=[];
    if(dd)m.push(Math.floor(dd/60)+':'+String(dd%60).padStart(2,'0'));
    m.push(Math.round(bpm(c))+' BPM',c.chart.notes.length+' notes');
    if(c.chart.notes.some(n=>n.length>2))m.push('Hold notes');
    if(c.size)m.push(fmtSize(c.size));
    m.forEach(x=>chips.appendChild(mk('span','',x)));
    mi.append(mk('b','',c.name),mk('small','',c.artist||''),chips,mk('p','',c.description||''));
    if(c.installing){const b=mk('button','btn','Downloading…');b.disabled=true;act.appendChild(b)}
    else if(lib.has(c.name)){const b=mk('button','btn done','Downloaded');b.disabled=true;const r=mk('button','btn mini ghost','Remove');r.onclick=()=>{sfx('back');uninstall(c)};act.append(b,r)}
    else{const b=mk('button','btn dl','Download');b.onclick=()=>{sfx('ok');install(c)};act.appendChild(b)}
    d.append(th,mi,act);L.appendChild(d)}
  if(!a.length)L.appendChild(mk('div','mempty','No maps match that.'));
  $('#mcount').textContent=lib.size+' of '+catalog.length+' downloaded'}
function openMaps(){stopPreview();pvIdx=-1;$('#maps').hidden=false;$('#menu').classList.add('maps-open');$('#mapsbtn').classList.add('on');$('#tabsongs').classList.remove('on');$('#mmsg').textContent='';renderMaps();rpc({details:'Browsing maps',state:'Maps'})}
function closeMaps(){$('#maps').hidden=true;$('#menu').classList.remove('maps-open');$('#mapsbtn').classList.remove('on');$('#tabsongs').classList.add('on');renderList();rpcMenu()}
$('#mapsbtn').onclick=()=>{sfx('tick');if($('#maps').hidden)openMaps()};
$('#tabsongs').onclick=()=>{if(!$('#maps').hidden){sfx('tick');closeMaps()}};
['#msearch','#msort','#mhold'].forEach(s=>$(s).addEventListener('input',renderMaps));
$('#mall').onclick=async()=>{sfx('ok');for(const c of catalog.filter(c=>!lib.has(c.name)))await install(c)};
function rpc(a){try{window.FDRPC&&FDRPC.set(a)}catch(e){}}
function rpcMenu(){const s=songs[sel];rpc({details:'Browsing songs',state:s?'Looking at '+s.name:'Song select'})}
function rpcPlay(){rpc({details:'Playing '+st.s.name,state:diff+' · '+acc()+'% · '+st.combo+'x combo',start:Date.now()-Math.max(0,now()*1000)})}
setInterval(()=>{if(st&&!st.over&&!st.paused&&cv.style.display==='block')rpcPlay()},15000);
let pv=null,pvIdx=-1,pvTok=0;
const LRU=[];
function getBuf(s){
  if(s.buf){const i=LRU.indexOf(s);if(i>=0)LRU.splice(i,1);LRU.push(s);return Promise.resolve(s.buf)}
  if(!s.loading)s.loading=(async()=>{
    let ab;
    if(s.b64){const bin=atob(s.b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);ab=u.buffer}
    else{let hit=null;try{hit=window.caches?await caches.match(s.audio):null}catch(e){}ab=await (hit||await fetch(s.audio)).arrayBuffer()}
    const buf=await AC.decodeAudioData(ab);
    s.buf=buf;s.loading=null;LRU.push(s);
    while(LRU.length>3){const o=LRU.find(x=>x!==s&&!(st&&st.s===x));if(!o)break;LRU.splice(LRU.indexOf(o),1);o.buf=null}
    return buf})().catch(e=>{s.loading=null;throw e});
  return s.loading}

function stopPreview(){pvTok++;if(!pv)return;const p=pv;pv=null;try{const t=AC.currentTime;p.g.gain.cancelScheduledValues(t);p.g.gain.setTargetAtTime(0,t,.05);p.s.stop(t+.3)}catch(e){}}
async function playPreview(){
  stopPreview();const s=songs[sel];if(!s||!menuReady)return;pvIdx=sel;const tok=++pvTok;
  let buf;try{buf=await getBuf(s)}catch(e){return}
  if(tok!==pvTok||songs[sel]!==s||!menuReady||pv)return;
  const a0=Math.min(s.preview||0,Math.max(0,buf.duration-16)),len=Math.min(15,buf.duration-a0),src=AC.createBufferSource(),gn=AC.createGain();
  src.buffer=buf;src.loop=true;src.loopStart=a0;src.loopEnd=a0+len;src.connect(gn);gn.connect(master);
  const t=AC.currentTime+.05;gn.gain.setValueAtTime(0,t);
  for(let c=0;c<16;c++){const a=t+c*len;gn.gain.linearRampToValueAtTime(.8,a+.6);gn.gain.setValueAtTime(.8,a+len-.8);gn.gain.linearRampToValueAtTime(0,a+len)}
  src.start(t,a0);pv={s:src,g:gn}}
function setInfo(){
  const s=songs[sel],c=$('#cov');
  $('#ti').textContent=s?s.name:'No song loaded';$('#ar').textContent=s?(s.artist||'Your mp3'):'';
  c.hidden=!(s&&s.cover);if(s&&s.cover)c.src=s.cover;
  $('#bg').style.backgroundImage=s&&s.cover?'url('+s.cover+')':'none';
  const m=[];if(s){const d=Math.round(s.duration||(s.buf&&s.buf.duration)||0);m.push(Math.floor(d/60)+':'+String(d%60).padStart(2,'0'));if(s.chart)m.push(Math.round(s.chart.disp||s.chart.bpm)+' BPM',s.chart.notes.length+' notes');if(s.chart&&s.chart.notes.some(n=>n.length>2))m.push('Hold notes')}
  $('#desc').textContent=s&&s.description?s.description:'';$('#chips').innerHTML=m.map(x=>'<span>'+x+'</span>').join('');if(menuReady)rpcMenu();if(sel!==pvIdx||!pv)playPreview()}
$('#diff').onclick=e=>{const d=e.target.dataset.d;if(!d)return;sfx('tick');diff=d;[...$('#diff').querySelectorAll('button')].forEach(b=>b.classList.toggle('on',b.dataset.d===d))};

// Chart generator: onset detection (energy flux), lane picked by brightness
function makeChart(buf,d){
  const ch=buf.getChannelData(0),sr=buf.sampleRate,HOP=512,N=Math.floor(ch.length/HOP);
  const e=new Float32Array(N),z=new Float32Array(N),f=new Float32Array(N);
  for(let i=0;i<N;i++){let s=0,c=0,p=0;for(let j=0;j<HOP;j++){const v=ch[i*HOP+j],df=v-p;s+=df*df*.5+v*v;if((v>0)!==(p>0))c++;p=v}e[i]=Math.sqrt(s/HOP);z[i]=c/HOP}
  for(let i=1;i<N;i++)f[i]=Math.max(0,e[i]-e[i-1]);
  const gap={easy:.6,normal:.36,hard:.24}[d],k={easy:2.6,normal:2,hard:1.6}[d],R=43;
  const on=[];let last=-9,sum=0;
  for(let i=0;i<Math.min(R,N);i++)sum+=f[i];
  for(let i=2;i<N-2;i++){
    const a=i+R<N?f[i+R]:0,b=i-R-1>=0?f[i-R-1]:0;sum+=a-b;
    const mean=sum/(2*R+1);
    if(f[i]>mean*k+1e-4&&f[i]>=f[i-1]&&f[i]>=f[i+1]){
      const t=i*HOP/sr;if(t>1.2&&t-last>=gap){on.push({t,z:z[i],p:f[i]/(mean+1e-6)});last=t}}}
  const zs=on.map(o=>o.z).sort((a,b)=>a-b),q=n=>zs[Math.floor(zs.length*n)]||0;
  const qs=[q(.25),q(.5),q(.75)];
  let seed=buf.length%9973+7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
  const notes=[];let l1=-1,l2=-1;
  for(const o of on){
    let l=o.z<qs[0]?0:o.z<qs[1]?1:o.z<qs[2]?2:3;
    const r=rnd();if(r<.25)l=Math.max(0,Math.min(3,l+(r<.12?-1:1)));
    if(l===l1&&l===l2)l=(l+1+Math.floor(rnd()*3))%4;
    notes.push({t:o.t,l,done:0});
    if(d==='hard'&&o.p>5&&rnd()<.6){let l3=(l+2)%4;notes.push({t:o.t,l:l3,done:0})}
    l2=l1;l1=l}
  return notes}

function start(){
  if(sel<0||$('#go').disabled)return;AC.resume();stopPreview();sfx('ok');
  const s=songs[sel],btn=$('#go');btn.textContent='Loading…';btn.disabled=true;
  getBuf(s).then(()=>{
    const notes=s.chart?fromChart(s,diff):makeChart(s.buf,diff);btn.textContent='Play';btn.disabled=sel<0;
    if(!notes.length){$('#msg').textContent='Couldn’t find any beats in that track.';return}
    run(s,notes)}).catch(()=>{btn.textContent='Play';btn.disabled=sel<0;$('#msg').textContent='Couldn’t load that song.'})}
function fromChart(s,d){
  const bs=60/s.chart.bpm,off=s.chart.offset,base=s.chart.notes.map(n=>({t:n[0],l:n[1],d:n[2]||0,done:0}));
  const thin=(a,gap)=>{const o=[];let last=-9;for(const n of a)if(n.t-last>=gap){o.push(n);last=n.t}return o};
  if(d==='easy')return thin(base.filter(n=>{const x=(n.t-off)/bs;return Math.abs(x-Math.round(x))<.05}),bs*1.4);
  if(d==='normal')return thin(base,bs*.9);
  return base}
function run(s,notes){
  stop();
  const src=AC.createBufferSource();src.buffer=s.buf;src.connect(master);
  const t0=AC.currentTime+2.5;src.start(t0);
  st={s,notes,src,t0,score:0,combo:0,max:0,j:{Perfect:0,Great:0,Good:0,Miss:0},fx:[],pt:[],errs:[],bump:0,hold:[null,null,null,null],down:[0,0,0,0],ptr:{},press:[0,0,0,0],flash:null,paused:false,speed:+$('#spd').value,off:+$('#off').value,dur:s.buf.duration,over:false};
  resize();loadBg(s);rpc({details:'Playing '+s.name,state:diff+' · '+(s.artist||''),start:Date.now()+2500});$('#menu').style.display='none';$('#res').style.display='none';showGame(true);$('#pause').hidden=true;
  raf=requestAnimationFrame(loop)}
function loadBg(s){st.bg=null;if(!s.cover)return;const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=c.height=64;c.getContext('2d').drawImage(im,0,0,64,64);st.bg=c};im.src=s.cover}
function stop(){cancelAnimationFrame(raf);if(st&&st.src){try{st.src.stop()}catch(e){}}}
const now=()=>AC.currentTime-st.t0-st.off/1000;
function geo(){const fw=Math.min(W*.96,620),lw=fw/4;return{fw,lw,x0:(W-fw)/2,hy:H-Math.min(130,H*.2)}}
function judge(name,l,e){
  st.j[name]++;const P=performance.now();
  if(name==='Miss'){st.combo=0;sfx('miss')}else{sfx('hit',name);st.combo++;if(st.combo%50===0)sfx('combo');st.max=Math.max(st.max,st.combo);st.bump=P;
    const b=WIN.find(w=>w[1]===name)[2];st.score+=Math.round(b*(1+Math.min(st.combo,100)/50));
    st.errs.push({e,n:name,t:P});if(st.errs.length>40)st.errs.shift()}
  st.flash={name,t:P,e:e||0};
  if(l>=0&&name!=='Miss'){st.fx.push({l,t:P});const G=geo();for(let i=0;i<8;i++){const a=Math.random()*6.28,v=80+Math.random()*180;st.pt.push({x:G.x0+(l+.5)*G.lw,y:G.hy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-120,t:P,l})}}}
function hit(l){
  if(!st||st.paused||st.over)return;st.press[l]=performance.now();
  const n=now();let best=null;
  for(const o of st.notes){if(o.done||o.holding||o.l!==l)continue;if(o.t>n+.18)break;
    if(Math.abs(o.t-n)<=.17){best=o;break}}
  if(!best)return;
  const d=Math.abs(best.t-n),w=WIN.find(w=>d<=w[0]);
  if(best.d){best.holding=true;st.hold[l]=best}else best.done=1;
  judge(w[1],l,n-best.t)}
function endHold(o,n){
  o.holding=false;st.hold[o.l]=null;const e=n-(o.t+o.d);
  if(e>=-.15){o.done=1;judge(Math.abs(e)<=.07?'Perfect':'Great',o.l,e)}
  else{o.done=2;judge('Miss',o.l)}}
function release(l){if(!st||st.paused||st.over)return;const o=st.hold[l];if(o)endHold(o,now())}
addEventListener('keydown',e=>{
  if(!st||$('#res').style.display==='flex'||cv.style.display==='none')return;
  if(e.key==='Escape'){e.preventDefault();togglePause();return}
  const l=KM[e.key.toLowerCase()];if(l!==undefined&&!e.repeat){e.preventDefault();st.down[l]=1;hit(l)}});
addEventListener('keyup',e=>{const l=KM[e.key.toLowerCase()];if(l!==undefined&&st){st.down[l]=0;release(l)}});
cv.addEventListener('pointerdown',e=>{
  if(st&&st.paused){togglePause();return}
  const{x0,lw}=geo(),l=Math.floor((e.clientX-x0)/lw);if(st&&l>=0&&l<4){st.ptr[e.pointerId]=l;st.down[l]=1;hit(l)}});
const pup=e=>{if(!st)return;const l=st.ptr[e.pointerId];if(l===undefined)return;delete st.ptr[e.pointerId];st.down[l]=0;release(l)};
cv.addEventListener('pointerup',pup);cv.addEventListener('pointercancel',pup);
function showGame(on){cv.style.display=on?'block':'none';$('#pbtn').style.display=on?'block':'none'}
function togglePause(){
  if(!st||st.over)return;st.paused=!st.paused;$('#pause').hidden=!st.paused;
  if(st.paused)rpc({details:'Paused',state:st.s.name+' ['+diff+']'});else{rpcPlay();for(let i=0;i<4;i++)if(st.hold[i]&&!st.down[i])endHold(st.hold[i],now())}
  if(st.paused){AC.suspend();$('#presume').focus()}else AC.resume()}

function rr(x,y,w,h,r){g.beginPath();g.roundRect(x,y,w,h,r);g.fill()}
function loop(){
  raf=requestAnimationFrame(loop);
  const{fw,lw,x0,hy}=geo(),n=now(),sp=520*st.speed,P=performance.now();
  // misses
  if(!st.paused)for(const o of st.notes){if(o.holding){if(n>=o.t+o.d)endHold(o,n);continue}if(o.done)continue;if(o.t<n-.17){o.done=2;judge('Miss',o.l);if(o.d)st.j.Miss++}else if(o.t>n)break}
  {const c=n<0?Math.ceil(-n):0;if(!st.paused&&c!==st.cd){st.cd=c;sfx('count',c===0)}}
  // draw
  const cx=W/2,hor=H*.07,K=1.5*st.speed,sT=.32,sB=1.2,Y=s=>hor+(hy-hor)*s,Q=(e,s)=>cx+(e-2)*lw*s,yT=Y(sT),yB=Y(sB);
  g.fillStyle='#0d0a18';g.fillRect(0,0,W,H);
  if(st.bg){const k=Math.max(W,H)/st.bg.width;g.drawImage(st.bg,(W-st.bg.width*k)/2,(H-st.bg.height*k)/2,st.bg.width*k,st.bg.height*k);g.fillStyle='#0a0818c4';g.fillRect(0,0,W,H)}
  else{const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#1d1233');bg.addColorStop(1,'#0d0a18');g.fillStyle=bg;g.fillRect(0,0,W,H)}
  const quad=(a,b)=>{g.beginPath();g.moveTo(Q(a,sT),yT);g.lineTo(Q(b,sT),yT);g.lineTo(Q(b,sB),yB);g.lineTo(Q(a,sB),yB);g.closePath()};
  quad(0,4);g.fillStyle='#070514a0';g.fill();
  for(let i=0;i<4;i++){const a=st.hold[i]?1:Math.max(0,1-(P-st.press[i])/160);if(a>0){const gg=g.createLinearGradient(0,hy+10,0,yT);gg.addColorStop(0,COL[i]);gg.addColorStop(1,COL[i]+'00');g.globalAlpha=a*.6;g.fillStyle=gg;quad(i,i+1);g.fill();g.globalAlpha=1}}
  for(let e=0;e<=4;e++){g.strokeStyle=e%4?'#ffffff33':'#ffffffaa';g.lineWidth=e%4?1.5:3;g.beginPath();g.moveTo(Q(e,sT),yT);g.lineTo(Q(e,sB),yB);g.stroke()}
  const ch=st.s.chart;
  if(ch){const bs=60/ch.bpm;for(let k=Math.ceil((n-.1-ch.offset)/bs);;k++){const z=ch.offset+k*bs-n;if(z>2.2/K)break;const s=1/(1+z*K);if(s<sT)break;const m=k%4===0,y=Y(s);g.strokeStyle=m?'#ffffff55':'#ffffff1f';g.lineWidth=m?2:1;g.beginPath();g.moveTo(Q(0,s),y);g.lineTo(Q(4,s),y);g.stroke()}}
  g.save();g.shadowColor='#7fe9ff';g.shadowBlur=16;g.fillStyle='#fff';g.fillRect(Q(0,1)-4,hy-3,lw*4+8,6);g.restore();
  g.textAlign='center';g.font='800 20px '+FD;
  for(let i=0;i<4;i++){const dn=P-st.press[i]<110||st.down[i],x=Q(i,1)+5,w=lw-10,y=hy+18;g.fillStyle=dn?COL[i]:'#ffffff1f';g.strokeStyle=COL[i];g.lineWidth=2;g.beginPath();g.roundRect(x,y,w,46,12);g.fill();g.stroke();g.fillStyle=dn?'#1a1030':'#ffffffdd';g.fillText(KEYS[i],x+w/2,y+31)}
  let pv=null;
  for(const o of st.notes){
    if(o.done===1)continue;const z=o.t-n;if(z>2.2/K)break;if(o.t+(o.d||0)-n<-.4)continue;
    const zh=o.holding?0:Math.max(z,-.25),s=1/(1+zh*K),y=Y(s),w=lw*s-6*s,h=24*s+6,x=Q(o.l+.5,s)-w/2;
    if(o.d){const zt=Math.min(o.t+o.d-n,2.2/K);if(zt>zh){const s2=1/(1+zt*K),y2=Y(s2),w1=lw*s*.5,w2=lw*s2*.5,c1=Q(o.l+.5,s),c2=Q(o.l+.5,s2);
      g.globalAlpha=o.done===2?.25:(o.holding?.95:.6);g.fillStyle=COL[o.l];g.beginPath();g.moveTo(c1-w1/2,y);g.lineTo(c1+w1/2,y);g.lineTo(c2+w2/2,y2);g.lineTo(c2-w2/2,y2);g.closePath();g.fill();
      g.strokeStyle='#fff';g.lineWidth=Math.max(1,2*s);g.globalAlpha*=.8;g.stroke();
      if(o.t+o.d-n<2.2/K){g.globalAlpha=o.done===2?.25:1;const th=10*s2+3;g.fillStyle='#fff';g.beginPath();g.roundRect(c2-w2*.6,y2-th/2,w2*1.2,th,th/2);g.fill()}}}
    g.globalAlpha=o.done===2?.3:1;
    if(pv&&pv.t===o.t){const x1=Q(Math.min(pv.l,o.l)+.5,s)+w/2,x2=Q(Math.max(pv.l,o.l)+.5,s)-w/2;g.fillStyle='#ffffffcc';g.fillRect(x1,y-2.5*s-1,x2-x1,5*s+2)}
    g.beginPath();g.roundRect(x,y-h/2,w,h,h/2);g.fillStyle=COL[o.l];g.fill();
    g.fillStyle='#ffffff59';g.beginPath();g.roundRect(x+w*.08,y-h/2+h*.1,w*.84,h*.38,h/4);g.fill();
    g.strokeStyle='#fff';g.lineWidth=Math.max(1.5,3*s);g.beginPath();g.roundRect(x,y-h/2,w,h,h/2);g.stroke();g.globalAlpha=1;pv=o}
  for(let i=0;i<4;i++)if(st.hold[i]&&Math.random()<.5)st.pt.push({x:Q(i+.5,1),y:hy,vx:(Math.random()-.5)*140,vy:-80-Math.random()*140,t:P,l:i});
  st.fx=st.fx.filter(f=>P-f.t<320);
  for(const f of st.fx){const a=(P-f.t)/320,r=lw*(.3+.55*a);g.globalAlpha=1-a;g.strokeStyle='#fff';g.lineWidth=5*(1-a)+1;g.beginPath();g.ellipse(Q(f.l+.5,1),hy,r,r*.4,0,0,7);g.stroke();g.globalAlpha=1}
  st.pt=st.pt.filter(p=>P-p.t<420);
  for(const p of st.pt){const a=(P-p.t)/1000,b=(P-p.t)/420;g.globalAlpha=1-b;g.fillStyle=b<.5?'#fff':COL[p.l];g.beginPath();g.arc(p.x+p.vx*a,p.y+p.vy*a+900*a*a,3*(1-b)+1,0,7);g.fill();g.globalAlpha=1}
  const pg=Math.min(1,Math.max(0,n/st.dur));g.fillStyle='#ffffff22';g.fillRect(0,0,W,4);g.fillStyle='#ff66aa';g.fillRect(0,0,W*pg,4);
  g.textAlign='left';g.font='700 15px '+FD;g.fillStyle='#ffffffcc';g.fillText(st.s.name+' ['+diff+']',16,30);
  g.textAlign='right';g.font='800 34px '+FD;g.fillStyle='#fff';g.fillText(String(st.score).padStart(7,'0'),W-16,40);g.font='700 16px '+FD;g.fillStyle='#ffffffaa';g.fillText(acc()+'%',W-16,62);
  g.textAlign='center';g.lineJoin='round';
  if(st.combo>1){const bm=1+.22*Math.max(0,1-(P-st.bump)/140);g.save();g.translate(cx,H*.4);g.scale(bm,bm);g.font='800 68px '+FD;g.lineWidth=9;g.strokeStyle='#27327a';g.strokeText(st.combo,0,0);g.fillStyle='#fff';g.fillText(st.combo,0,0);g.font='800 15px '+FD;g.lineWidth=5;g.strokeText('COMBO',0,24);g.fillText('COMBO',0,24);g.restore()}
  if(st.flash&&P-st.flash.t<500){const f=st.flash,age=P-f.t,sc=1+.3*Math.max(0,1-age/120),T=f.name.toUpperCase();
    g.save();g.globalAlpha=age<350?1:1-(age-350)/150;g.translate(cx,hy-110);g.scale(sc,sc);g.font='italic 800 32px '+FD;g.lineWidth=7;g.strokeStyle='#27327a';
    const gd=g.createLinearGradient(-90,0,90,0),cs={Perfect:['#ff7ac0','#fff36b','#4fd6ff'],Great:['#ff7ac0','#ffc2e4','#ff7ac0'],Good:['#4fd6ff','#b8ecff','#4fd6ff'],Miss:['#9a96bd','#c4c0e0','#9a96bd']}[f.name];
    gd.addColorStop(0,cs[0]);gd.addColorStop(.5,cs[1]);gd.addColorStop(1,cs[2]);
    g.strokeText(T,0,0);g.fillStyle=gd;g.fillText(T,0,0);
    if(f.name==='Great'||f.name==='Good'){const L=f.e<0?'FAST':'LATE';g.font='italic 800 15px '+FD;g.lineWidth=4;g.strokeText(L,0,22);g.fillStyle=f.e<0?'#6fd0ff':'#ff8fa0';g.fillText(L,0,22)}
    g.restore()}
  const by=H-14,pm=120/170;
  g.fillStyle='#4fd6ff55';g.fillRect(cx-120,by-3,240,6);g.fillStyle='#7aff9a77';g.fillRect(cx-120*pm,by-3,240*pm,6);g.fillStyle='#ffe66bbb';g.fillRect(cx-70*pm,by-3,140*pm,6);
  for(const t of st.errs){const age=P-t.t;if(age>5000)continue;g.globalAlpha=1-age/5000;g.fillStyle={Perfect:'#ffe66b',Great:'#7aff9a',Good:'#4fd6ff'}[t.n];g.fillRect(cx+t.e*1000*pm-1,by-9,2,18)}
  g.globalAlpha=1;g.fillStyle='#fff';g.fillRect(cx-1,by-10,2,20);
  if(n<0){g.font='800 84px '+FD;g.lineWidth=10;g.strokeStyle='#27327a';g.strokeText(Math.ceil(-n),cx,H*.42);g.fillStyle='#fff';g.fillText(Math.ceil(-n),cx,H*.42)}
  if(!st.over&&n>st.dur+.8)finish()}
function acc(){const t=st.j.Perfect+st.j.Great+st.j.Good+st.j.Miss;return t?((st.j.Perfect*300+st.j.Great*200+st.j.Good*100)/(t*300)*100).toFixed(1):'100.0'}
function finish(){
  st.over=true;cancelAnimationFrame(raf);showGame(false);
  const a=+acc(),gr=a>=95?'S':a>=90?'A':a>=80?'B':a>=70?'C':'D',gc={S:'#ffd54a',A:'#7aff9a',B:'#4fd6ff',C:'#c9a0ff',D:'#ff7a8a'}[gr];
  const ge=$('#grade');ge.textContent=gr;ge.style.color=gc;
  sfx('rank',gr);rpc({details:'Finished '+st.s.name,state:'Rank '+gr+' · '+a+'%'});$('#rname').textContent=st.s.name+' ['+diff+']';$('#rscore').textContent=String(st.score).padStart(7,'0');
  $('#tiles').innerHTML=[['Perfect','#ffe66b'],['Great','#7aff9a'],['Good','#4fd6ff'],['Miss','#ff7a8a']].map(t=>'<div class="t" style="--c:'+t[1]+'"><b>'+st.j[t[0]]+'</b><span>'+t[0]+'</span></div>').join('');
  $('#rmeta').innerHTML='<div><span>Max combo</span><b>'+st.max+'x</b></div><div><span>Accuracy</span><b>'+a+'%</b></div>';
  $('#res').style.display='flex'}
$('#go').onclick=start;$('#off').oninput=e=>{$('#ov').textContent=e.target.value+' ms';save()};
$('#retry').onclick=()=>{$('#res').style.display='none';start()};
$('#back').onclick=()=>{sfx('back');stop();$('#res').style.display='none';showGame(false);$('#menu').style.display='grid';playPreview();rpcMenu()}
$('#pbtn').onclick=togglePause;$('#presume').onclick=togglePause;
$('#prestart').onclick=()=>{$('#pause').hidden=true;stop();AC.resume();start()};
$('#pquit').onclick=()=>{$('#pause').hidden=true;AC.resume();$('#back').onclick()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&st&&!st.paused&&!st.over&&cv.style.display==='block')togglePause()});;

const splash=$('#splash');let began=0,menuReady=false;
function begin(){if(began)return;began=1;AC.resume();removeEventListener('keydown',begin);
  const m=$('#menu');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){splash.style.display='none';m.classList.remove('pre');menuReady=true;playPreview();return}
  splash.classList.add('out');
  setTimeout(()=>{m.classList.remove('pre');m.classList.add('enter');splash.classList.add('fade')},520);
  setTimeout(()=>{splash.style.display='none';menuReady=true;playPreview()},1050)}
splash.onclick=begin;addEventListener('keydown',begin);
function setDiff(d){diff=d;[...$('#diff').querySelectorAll('button')].forEach(b=>b.classList.toggle('on',b.dataset.d===d))}
addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('#settings').hidden){openSet(false);return}
  if(!$('#maps').hidden&&$('#settings').hidden){if(e.key==='Escape'){e.preventDefault();closeMaps()}return}
  if(!menuReady||!$('#settings').hidden||cv.style.display==='block'||$('#res').style.display==='flex'||$('#menu').style.display==='none')return;
  const k=e.key;
  if((k==='ArrowDown'||k==='ArrowUp')&&songs.length){e.preventDefault();sel=(sel+(k==='ArrowDown'?1:-1)+songs.length)%songs.length;sfx('tick');renderList();const o=document.querySelector('#list .on');if(o)o.scrollIntoView({block:'nearest',behavior:'smooth'})}
  else if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();const D=['easy','normal','hard'],i=Math.max(0,Math.min(2,D.indexOf(diff)+(k==='ArrowRight'?1:-1)));setDiff(D[i]);sfx('tick')}
  else if(k==='Enter'&&!/BUTTON|INPUT/.test(e.target.tagName)&&sel>=0){e.preventDefault();start()}});

const stg=$('#settings');function openSet(o){stg.hidden=!o;if(!o)stopCap()}
function save(){try{localStorage.setItem('fdm',JSON.stringify({s:$('#spd').value,o:$('#off').value,v:$('#vol').value,x:$('#sfxv').value,k:BIND}))}catch(e){}}

let capIdx=-1;
const BADKEYS=['escape','enter','tab','shift','control','alt','meta','capslock','contextmenu','dead','unidentified'];
function stopCap(){if(capIdx>=0){document.querySelectorAll('.kb')[capIdx].classList.remove('listen');capIdx=-1;applyBind()}}
document.querySelectorAll('.kb').forEach((b,i)=>{b.onclick=()=>{stopCap();capIdx=i;b.classList.add('listen');b.textContent='Press a key'}});
addEventListener('keydown',e=>{
  if(capIdx<0)return;
  e.preventDefault();e.stopImmediatePropagation();
  const k=e.key.toLowerCase();
  if(k==='escape'){stopCap();return}
  if(BADKEYS.includes(k)||/^f\d+$/.test(k))return;
  const j=BIND.indexOf(k);if(j>=0&&j!==capIdx)BIND[j]=BIND[capIdx];
  BIND[capIdx]=k;stopCap();save();sfx('tick')},true);
$('#kreset').onclick=()=>{stopCap();BIND=['a','s','k','l'];applyBind();save();sfx('tick')};
try{const v=JSON.parse(localStorage.getItem('fdm')||'{}');if(Array.isArray(v.k)&&v.k.length===4&&v.k.every(x=>typeof x==='string')&&new Set(v.k).size===4)BIND=v.k}catch(e){}
applyBind();
$('#setbtn').onclick=()=>{sfx('tick');openSet(true)};$('#sdone').onclick=()=>{sfx('back');openSet(false)};stg.onclick=e=>{if(e.target===stg)openSet(false)};
$('#spd').oninput=e=>{$('#sv').textContent=(+e.target.value).toFixed(1)+'x';save()};
function setVol(v){master.gain.setTargetAtTime((v/100)**2,AC.currentTime,.02);$('#vv').textContent=Math.round(v)+'%'}
$('#vol').oninput=e=>{setVol(+e.target.value);save()};
function setSfx(v){sfxG.gain.setTargetAtTime((v/100)**2,AC.currentTime,.02);$('#xv').textContent=Math.round(v)+'%'}
$('#sfxv').oninput=e=>{setSfx(+e.target.value);save();sfx('hit','Perfect')};
try{const v=JSON.parse(localStorage.getItem('fdm')||'{}');if(v.s){$('#spd').value=v.s;$('#sv').textContent=(+v.s).toFixed(1)+'x'}if(v.o){$('#off').value=v.o;$('#ov').textContent=v.o+' ms'}if(v.v!==undefined){$('#vol').value=v.v;setVol(+v.v)}if(v.x!==undefined){$('#sfxv').value=v.x;setSfx(+v.x)}}catch(e){}
setInfo();
(async()=>{
  $('#msg').textContent='Loading songs…';
  try{
    const list=await (await fetch('songs.json')).json();
    for(const m of list)catalog.push({name:m.name,artist:m.artist,cover:m.cover,chart:m.chart,preview:m.preview,description:m.description,audio:m.audio,duration:m.duration,b64:m.b64,size:m.size,starter:m.starter});
    initLib();
    $('#msg').textContent='';
  }catch(e){$('#msg').textContent='Couldn’t load the built-in songs. Open this folder with VS Code Live Server instead of double-clicking index.html.'}
  if(sel<0&&songs.length)sel=0;renderList()
})();
