const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
const overlay=document.getElementById("overlay"),controls=document.getElementById("controls");
const playerLabel=document.getElementById("playerLabel"),coinLabel=document.getElementById("coinLabel"),scoreLabel=document.getElementById("scoreLabel");
let W,H,DPR,profileName="Guest",state="menu",paused=false,last=0,score=0,level=1,combo=0,damage=0,freeze=0,mode=null;
let basket={x:0,y:0,w:100,h:20,color:"#00ffff"},fruits=[],obstacles=[],powers=[],particles=[];
const colors=["#ff007f","#f3e600","#39ff14","#ff8a00"];
const store={GOLD:["#ffd700",50],PLASMA:["#b026ff",100],RUBY:["#e0115f",250],DIAMOND:["#b9f2ff",500],GALAXY:["#4b0082",750]};
let profiles=JSON.parse(localStorage.getItem("neonProfiles")||"{}");
function save(){if(!profileName)return;profiles[profileName]??={coins:0,unlocked:[],color:"#00ffff",speed:null,size:5,ghost:false,best:0};localStorage.setItem("neonProfiles",JSON.stringify(profiles))}
function p(){profiles[profileName]??={coins:0,unlocked:[],color:"#00ffff",speed:null,size:5,ghost:false,best:0};return profiles[profileName]}
function resize(){DPR=devicePixelRatio||1;W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;ctx.setTransform(DPR,0,0,DPR,0,0);basket.y=H-105}addEventListener("resize",resize);resize();
function button(text,action,color="#00ffff"){return `<button class="btn" style="--c:${color}" onclick="${action}">${text}</button>`}
function menu(){
 state="menu";controls.style.display="none";overlay.innerHTML=`<div class="panel"><div class="title">NEON CATCHER</div><div class="subtitle">⚡ SYNTHWAVE ARCADE ⚡</div>
 <div class="small">USER: ${profileName} | 🪙 ${p().coins} FC COINS</div>
 ${button("▶ PLAY GAME","showModes()","#39ff14")}
 ${button("⚙ SETTINGS","showSettings()")}
 ${button("🏪 FC STORE","showStore()","#ffd700")}
 ${button("⚡ UPGRADES","showUpgrades()","#ff007f")}
 ${button("🏆 LEADERBOARD","showBoard()","#b026ff")}
 ${button("ⓘ INSTALL: Safari → Share → Add to Home Screen","installInfo()","#ff8a00")}
 <div class="small">Offline game • Progress saved on this iPhone</div></div>`;
}
function signIn(){overlay.innerHTML=`<div class="panel"><div class="title">NEON CATCHER</div><div class="subtitle">SIGN IN</div><input id="nameInput" class="input" maxlength="12" placeholder="Enter profile name"><br>${button("ENTER GAME","confirmSignIn()","#39ff14")}<div class="small">Your profile is saved locally and works offline.</div></div>`}
function confirmSignIn(){let n=document.getElementById("nameInput").value.trim();profileName=n||"Guest";save();menu()}
function showModes(){overlay.innerHTML=`<div class="panel"><div class="title">SELECT MODE</div>
${button("1. CASUAL [SLOW]","startGame(6,25,50,7,'CASUAL')","#39ff14")}
${button("2. STANDARD [NORMAL]","startGame(10,20,40,5,'STANDARD')","#f3e600")}
${button("3. OVERDRIVE [FAST]","startGame(15,15,30,4,'OVERDRIVE')","#ff8a00")}
${button("4. INSANE [VERY FAST]","startGame(20,10,20,3,'INSANE')","#ff003c")}
${button("5. GOD TIER [EXTREME]","startGame(25,8,15,2,'GOD TIER')","#9d00ff")}
${button("6. HACKER [CHAOS]","startGame(35,5,10,1.2,'HACKER')","#ffffff")}
${button("← BACK","menu()")}</div>`}
function showSettings(){overlay.innerHTML=`<div class="panel"><div class="title">SETTINGS</div>${button("SWITCH PROFILE","signIn()")}${button("RESET PROGRESS","resetProgress()","#ff003c")}${button("← BACK","menu()")}</div>`}
function resetProgress(){if(confirm("Reset all progress for "+profileName+"?")){profiles[profileName]={coins:0,unlocked:[],color:"#00ffff",speed:null,size:5,ghost:false,best:0};save()}showSettings()}
function showStore(){let html=`<div class="panel"><div class="title">FC STORE</div><div class="subtitle">🪙 BALANCE: ${p().coins}</div>`;for(let k in store){let [c,cost]=store[k],owned=p().unlocked.includes(c);html+=button((owned?"EQUIP ":"BUY ")+k+" ("+cost+" FC)",`buyItem('${k}')`,c)}html+=button("← BACK","menu()");overlay.innerHTML=html+"</div>"}
function buyItem(k){let [c,cost]=store[k];if(p().unlocked.includes(c))p().color=c;else if(p().coins>=cost){p().coins-=cost;p().unlocked.push(c);p().color=c}else{alert("INSUFFICIENT FC COINS!");return}save();showStore()}
function showUpgrades(){overlay.innerHTML=`<div class="panel"><div class="title">POWER UPGRADES</div>
${button("CUSTOM SPEED (${p().speed||"DEFAULT"})","upgradeSpeed()")}
${button("CUSTOM BASKET SIZE (x${p().size})","upgradeSize()")}
${button("GHOST OBSTACLES: ${p().ghost?"ON":"OFF"}","upgradeGhost()","#ff007f")}
<div class="small">Speed: 1000 FC • Size: 5000 FC • Ghost: 10000 FC</div>${button("← BACK","menu()")}</div>`}
function upgradeSpeed(){if(p().coins<1000)return alert("Need 1000 FC");let v=prompt("Speed 1–50",p().speed||10);if(v&&v>=1&&v<=50){p().speed=+v;save()}showUpgrades()}
function upgradeSize(){if(p().coins<5000)return alert("Need 5000 FC");let v=prompt("Basket size 1–20",p().size||5);if(v&&v>=1&&v<=20){p().size=+v;save()}showUpgrades()}
function upgradeGhost(){if(p().coins<10000)return alert("Need 10000 FC");p().ghost=!p().ghost;save();showUpgrades()}
function showBoard(){let arr=Object.entries(profiles).map(([name,v])=>({name,best:v.best||0})).sort((a,b)=>b.best-a.best).slice(0,5);overlay.innerHTML=`<div class="panel"><div class="title">HIGH SCORES</div>${arr.length?arr.map((e,i)=>`<div class="item">0${i+1} // ${e.name} ... ${e.best} pts</div>`).join(""):"<div class='small'>DATABASE EMPTY</div>"}${button("← BACK","menu()")}</div>`}
function installInfo(){alert("To install free: open this game in Safari, tap Share, then Add to Home Screen. After the first load, it works offline.")}
function startGame(speed,fruitRate,obsRate,size,name){mode={speed:p().speed||speed,fruitRate,obsRate,name};score=0;level=1;combo=0;damage=0;freeze=0;fruits=[];obstacles=[];powers=[];particles=[];basket.w=(p().size||size)*20;basket.color=p().color;state="playing";paused=false;overlay.innerHTML="";controls.style.display="flex"}
function spawnFruit(){fruits.push({x:40+Math.random()*(W-80),y:-25,r:18,c:colors[Math.floor(Math.random()*4)]})}
function spawnObstacle(){if(!p().ghost)obstacles.push({x:40+Math.random()*(W-80),y:-25,r:20})}
function spawnPower(type){powers.push({x:40+Math.random()*(W-80),y:-25,r:16,type})}
function hit(a){return Math.abs(a.x-basket.x)<basket.w/2+a.r&&Math.abs(a.y-basket.y)<35}
function addParticles(x,y,c){for(let i=0;i<8;i++)particles.push({x,y,vx:(Math.random()-.5)*180,vy:-Math.random()*180,life:.45,c})}
function update(dt){if(state!=="playing"||paused)return;let sp=mode.speed+(level-1)*2;if(freeze>0){freeze-=dt;sp/=3}
if(Math.random()<dt*60/mode.fruitRate)spawnFruit();if(Math.random()<dt*60/mode.obsRate)spawnObstacle();if(Math.random()<dt*.15)spawnPower("freeze");if(Math.random()<dt*.1)spawnPower("star");
for(let list of [fruits,obstacles,powers])for(let a of list)a.y+=sp*dt*60;
for(let i=fruits.length-1;i>=0;i--){let a=fruits[i];if(hit(a)){combo++;let mult=1+Math.floor(combo/10);score+=mult;p().coins+=mult;addParticles(a.x,a.y,a.c);fruits.splice(i,1);save()}else if(a.y>H+30){combo=0;fruits.splice(i,1)}}
for(let i=obstacles.length-1;i>=0;i--){let a=obstacles[i];if(hit(a)){damage++;score--;combo=0;addParticles(a.x,a.y,"#ff003c");obstacles.splice(i,1)}else if(a.y>H+30)obstacles.splice(i,1)}
for(let i=powers.length-1;i>=0;i--){let a=powers[i];if(hit(a)){if(a.type==="freeze")freeze=3;else{score+=50;p().coins+=25}powers.splice(i,1);save()}else if(a.y>H+30)powers.splice(i,1)}
for(let i=particles.length-1;i>=0;i--){let a=particles[i];a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt;if(a.life<=0)particles.splice(i,1)}
if(score>=level*10){level++;fruits=[];obstacles=[];powers=[];basket.x=W/2}
p().best=Math.max(p().best||0,score);save();
}
function neon(text,x,y,size,color){ctx.font=`bold ${size}px monospace`;ctx.textAlign="center";ctx.shadowBlur=12;ctx.shadowColor=color;ctx.fillStyle=color;ctx.fillText(text,x,y);ctx.shadowBlur=0}
function draw(){ctx.fillStyle="#050510";ctx.fillRect(0,0,W,H);let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#100022");g.addColorStop(1,"#050510");ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
ctx.strokeStyle="#ff007f";ctx.globalAlpha=.55;for(let y=H*.52;y<H;y+=Math.max(14,(y-H*.52)*.09+14)){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}ctx.globalAlpha=1;
ctx.fillStyle="#ff007f";ctx.shadowBlur=30;ctx.shadowColor="#ff007f";ctx.beginPath();ctx.arc(W/2,H*.26,Math.min(W,H)*.14,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
if(state==="playing"){for(let a of fruits){ctx.fillStyle=a.c;ctx.shadowBlur=18;ctx.shadowColor=a.c;ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill()}for(let a of obstacles){ctx.fillStyle="#ff003c";ctx.beginPath();ctx.moveTo(a.x,a.y-a.r);ctx.lineTo(a.x-a.r,a.y+a.r);ctx.lineTo(a.x+a.r,a.y+a.r);ctx.closePath();ctx.fill()}for(let a of powers){ctx.fillStyle=a.type==="freeze"?"#00ffff":"#ffd700";ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,Math.PI*2);ctx.fill()}for(let a of particles){ctx.globalAlpha=Math.max(0,a.life*2);ctx.fillStyle=a.c;ctx.fillRect(a.x,a.y,5,5)}ctx.globalAlpha=1;ctx.fillStyle=basket.color;ctx.shadowBlur=20;ctx.shadowColor=basket.color;ctx.fillRect(basket.x-basket.w/2,basket.y-10,basket.w,20);ctx.shadowBlur=0;
playerLabel.textContent="ID: "+profileName;coinLabel.textContent="🪙 "+p().coins+" FC";scoreLabel.textContent=`${mode.name} | LVL:${level} | SCR:${score} | DMG:${damage}${combo>=5?" | 🔥 "+combo+" COMBO":""}${freeze>0?" | ❄ FREEZE":""}`;}
requestAnimationFrame(loop)}
function loop(t){let dt=Math.min(.05,(t-last)/1000||0);last=t;update(dt);draw()}
function move(dir){if(state==="playing"&&!paused){basket.x=Math.max(basket.w/2,Math.min(W-basket.w/2,basket.x+dir*65))}}
document.getElementById("leftBtn").onclick=()=>move(-1);document.getElementById("rightBtn").onclick=()=>move(1);document.getElementById("pauseBtn").onclick=()=>{paused=!paused};
canvas.addEventListener("pointerdown",e=>{if(state==="playing"){let x=e.clientX;if(x<W*.35)move(-1);else if(x>W*.65)move(1)}});canvas.addEventListener("pointermove",e=>{if(state==="playing"&&e.buttons){basket.x=Math.max(basket.w/2,Math.min(W-basket.w/2,e.clientX))}});
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
profileName=localStorage.getItem("neonLastProfile")||"";if(profileName&&profiles[profileName])menu();else signIn();
const oldConfirm=confirmSignIn;confirmSignIn=function(){oldConfirm();localStorage.setItem("neonLastProfile",profileName)}
requestAnimationFrame(loop);