const categories={
 animals:["ГУРБА","САГ","ШЕР","ПАЛАНГ","ФИЛ","ХАРГӮШ","ГОВ","АСП","ГУРГ","МОР","БУЗ","ГУСФАНД"],
 fruits:["СЕБ","НОК","АНГУР","АНОР","ЗАРДОЛУ","ШАФТОЛУ","ТУТ","БАНАН","ЛИМУ","ОЛУ"],
 technology:["КОМПЮТЕР","ТЕЛЕФОН","ИНТЕРНЕТ","РОБОТ","БАРНОМА","МОНИТОР","КОД","МУШ","ЭКРАН","ПЛАНШЕТ"],
 sports:["ФУТБОЛ","ВОЛЕЙБОЛ","БАСКЕТБОЛ","ТЕННИС","БОКС","ШОҲМОТ","ДАВИДАН","ШИНОВАРӢ"],
 nature:["ОФТОБ","БАРФ","БОД","БОРОН","ДАРЁ","КӮҲ","БОРИШ","БАҲОР","ТОБИСТОН","ТИРАМОҲ","ЗИМИСТОН"]
};
const allWords=Object.values(categories).flat();
const palette=["#2878d0","#168768","#a34bc5","#c47b20","#c34c72","#168e9a","#6e7cce","#648d32","#bd5c32","#7954b5"];
const $=id=>document.getElementById(id);
const gridElement=$("grid");
let mission=Math.max(1,Math.min(100,Number(localStorage.getItem("kalimaMission"))||1));
let hints=Math.max(0,Number(localStorage.getItem("kalimaHints")??3));
let record=Number(localStorage.getItem("kalimaRecord"))||0;
let size=10,board=[],words=[],foundWords=[],placements={},score=0,seconds=120,paused=false,finished=false,soundEnabled=true;
let startCell=null,currentSelection=[],audioContext=null;
$("record").textContent=record;

function sound(type="good"){
 if(!soundEnabled)return;
 try{
  audioContext ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audioContext.state==="suspended")audioContext.resume();
  const notes=type==="good"?[660,880,1100]:type==="bad"?[220,165]:type==="hint"?[520,720]:type==="win"?[523,659,784,1046]:[330,260];
  notes.forEach((freq,i)=>{
   const osc=audioContext.createOscillator(),gain=audioContext.createGain();
   osc.type="sine";osc.frequency.value=freq;osc.connect(gain);gain.connect(audioContext.destination);
   const start=audioContext.currentTime+i*.105;
   gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.12,start+.015);gain.gain.exponentialRampToValueAtTime(.0001,start+.16);
   osc.start(start);osc.stop(start+.17);
  });
 }catch(e){console.info("Audio unavailable",e)}
}
function formatTime(n){return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")}
function updateHUD(){
 $("mission").textContent=mission+" / 100";$("missionNumber").textContent=mission;
 $("hintsLeft").textContent=hints;$("hintBtn").textContent="💡 Ёрӣ ("+hints+")";
 $("score").textContent=score;$("timer").textContent=formatTime(seconds);
 $("record").textContent=record;
}
function shuffle(a){const x=[...a];for(let i=x.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}
function randomItem(a){return a[Math.floor(Math.random()*a.length)]}
function makeMissionWords(){
 const count=Math.min(5+Math.floor((mission-1)/12),9);
 const pool=shuffle(allWords.filter(w=>w.length<=size));
 return pool.slice(0,count).sort((a,b)=>b.length-a.length);
}
function emptyBoard(){board=Array.from({length:size},()=>Array(size).fill(""));placements={}}
const directions=[[0,1],[0,-1],[1,0],[-1,0]];
function canPlace(word,row,col,dr,dc){
 for(let i=0;i<word.length;i++){const r=row+dr*i,c=col+dc*i;if(r<0||r>=size||c<0||c>=size)return false;if(board[r][c]&&board[r][c]!==word[i])return false}
 return true;
}
function placeWord(word){
 for(let tries=0;tries<1200;tries++){
  const [dr,dc]=randomItem(directions),row=Math.floor(Math.random()*size),col=Math.floor(Math.random()*size);
  if(!canPlace(word,row,col,dr,dc))continue;
  const cells=[];for(let i=0;i<word.length;i++){const r=row+dr*i,c=col+dc*i;board[r][c]=word[i];cells.push({r,c})}
  placements[word]=cells;return true;
 }
 return false;
}
function fillBoard(){
 const letters="АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЧШЪЭЮЯӢӮҒҚҶ";
 for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!board[r][c])board[r][c]=randomItem([...letters]);
}
function startGame(){
 paused=false;finished=false;startCell=null;currentSelection=[];score=0;
 seconds=Math.max(90,150-Math.floor((mission-1)/10)*5);
 $("pauseBtn").textContent="⏸ Таваққуф";$("winModal").classList.remove("show");$("nextMissionBtn").style.display="none";
 $("message").textContent="Калимаҳои миссияро пайдо кун!";
 size=mission<20?10:mission<60?11:12;
 emptyBoard();words=makeMissionWords();foundWords=[];
 for(const w of words)if(!placeWord(w)){/* retry not needed; grid has spare room */}
 words=words.filter(w=>placements[w]);
 fillBoard();gridElement.style.setProperty("--size",size);renderBoard();renderWords();updateProgress();updateHUD();
}
function renderBoard(){
 gridElement.innerHTML="";
 for(let r=0;r<size;r++)for(let c=0;c<size;c++){
  const cell=document.createElement("div");cell.className="cell";cell.textContent=board[r][c];cell.dataset.row=r;cell.dataset.col=c;gridElement.appendChild(cell);
 }
}
function renderWords(){
 $("wordList").innerHTML="";
 words.forEach(w=>{const el=document.createElement("span");el.className="word-item";el.textContent=w;if(foundWords.includes(w)){el.classList.add("found");el.style.background=wordColors[w];el.style.borderColor=wordColors[w]}$("wordList").appendChild(el)});
}
function updateProgress(){
 $("progress").textContent=foundWords.length+" / "+words.length;
 $("progressBar").style.width=(foundWords.length/Math.max(1,words.length)*100)+"%";
}
function getCell(x,y){
 const el=document.elementFromPoint(x,y),cell=el?.closest(".cell");
 return cell&&gridElement.contains(cell)?{r:Number(cell.dataset.row),c:Number(cell.dataset.col)}:null;
}
function lineBetween(a,b){
 const dr=b.r-a.r,dc=b.c-a.c;
 if(dr!==0&&dc!==0)return [];
 if(dr===0&&dc===0)return [a];
 const length=Math.max(Math.abs(dr),Math.abs(dc)),sr=Math.sign(dr),sc=Math.sign(dc),out=[];
 for(let i=0;i<=length;i++)out.push({r:a.r+sr*i,c:a.c+sc*i});
 return out;
}
function paintSelection(cells){
 gridElement.querySelectorAll(".cell.selected").forEach(el=>el.classList.remove("selected"));
 cells.forEach(p=>gridElement.querySelector('[data-row="'+p.r+'"][data-col="'+p.c+'"]')?.classList.add("selected"));
}
gridElement.addEventListener("pointerdown",e=>{
 if(paused||finished)return;const p=getCell(e.clientX,e.clientY);if(!p)return;
 e.preventDefault();startCell=p;currentSelection=[p];gridElement.setPointerCapture?.(e.pointerId);paintSelection(currentSelection);
});
gridElement.addEventListener("pointermove",e=>{
 if(!startCell||paused||finished)return;const p=getCell(e.clientX,e.clientY);if(!p)return;
 const line=lineBetween(startCell,p);if(!line.length)return;currentSelection=line;paintSelection(line);
});
function endSelection(){
 if(!startCell)return;
 if(currentSelection.length)checkSelection(currentSelection);
 startCell=null;currentSelection=[];gridElement.querySelectorAll(".cell.selected").forEach(el=>el.classList.remove("selected"));
}
gridElement.addEventListener("pointerup",endSelection);gridElement.addEventListener("pointercancel",endSelection);
let wordColors={};
function checkSelection(cells){
 const value=cells.map(p=>board[p.r][p.c]).join("");
 const reverse=[...value].reverse().join("");
 const found=words.find(w=>(w===value||w===reverse)&&!foundWords.includes(w));
 if(!found){$("message").textContent="❌ Калима дуруст нест. Калимаро рост ё чап/боло ё поён интихоб кун.";sound("bad");return}
 foundWords.push(found);wordColors[found]=palette[(foundWords.length-1)%palette.length];
 score+=10+Math.max(0,15-found.length);$("message").textContent="✅ Офарин! "+found+" ёфт шуд!";
 sound("good");
 const actual=placements[found];actual.forEach(p=>{const el=gridElement.querySelector('[data-row="'+p.r+'"][data-col="'+p.c+'"]');if(el){el.classList.add("found");el.style.background=wordColors[found];el.style.borderColor=wordColors[found]}});
 renderWords();updateProgress();updateHUD();if(foundWords.length===words.length)completeMission();
}
function completeMission(){
 finished=true;const bonus=Math.max(0,Math.floor(seconds/2));score+=bonus;
 if(score>record){record=score;localStorage.setItem("kalimaRecord",record)}
 hints++;localStorage.setItem("kalimaHints",hints);
 $("finalScore").textContent=score+" хол";$("winModal").classList.add("show");
 $("nextMissionBtn").style.display=mission>=100?"none":"block";
 $("message").textContent=mission===100?"🏆 Ҳамаи 100 миссия анҷом ёфт!":"🎉 Миссия гузашт! 1 ёрии нав гирифтӣ.";
 sound("win");updateHUD();
}
function useHint(){
 if(paused||finished)return;
 if(hints<=0){$("message").textContent="Ёрӣ тамом шуд. Барои гузаштани миссия 1 ёрии нав мегирӣ.";sound("bad");return}
 const word=randomItem(words.filter(w=>!foundWords.includes(w)));if(!word)return;
 hints--;localStorage.setItem("kalimaHints",hints);updateHUD();
 const first=placements[word][0],el=gridElement.querySelector('[data-row="'+first.r+'"][data-col="'+first.c+'"]');
 el?.classList.add("hint-cell");$("message").textContent="💡 Калима бо ҳарфи «"+board[first.r][first.c]+"» сар мешавад.";
 sound("hint");setTimeout(()=>el?.classList.remove("hint-cell"),1800);
}
$("hintBtn").addEventListener("click",useHint);
$("pauseBtn").addEventListener("click",()=>{
 if(finished)return;paused=!paused;$("pauseBtn").textContent=paused?"▶ Давом додан":"⏸ Таваққуф";
 $("message").textContent=paused?"⏸ Бозӣ таваққуф шуд.":"▶ Бозӣ идома дорад.";if(!paused)sound("hint");
});
$("restartBtn").addEventListener("click",startGame);
$("playAgainBtn").addEventListener("click",()=>{$("winModal").classList.remove("show");startGame()});
$("nextMissionBtn").addEventListener("click",()=>{
 if(mission>=100)return;mission++;localStorage.setItem("kalimaMission",mission);$("winModal").classList.remove("show");startGame();
});
$("soundBtn").addEventListener("click",()=>{soundEnabled=!soundEnabled;$("soundBtn").textContent=soundEnabled?"🔊":"🔇";if(soundEnabled)sound("good")});
setInterval(()=>{
 if(paused||finished)return;
 seconds=Math.max(0,seconds-1);$("timer").textContent=formatTime(seconds);
 if(seconds===30)sound("tick");
 if(seconds===10)sound("tick");
 if(seconds===0){finished=true;$("message").textContent="⏰ Вақт тамом шуд! Аз нав кӯшиш кун.";sound("timeout");$("playAgainBtn").textContent="Боз кӯшиш кун";$("winModal").classList.add("show");$("nextMissionBtn").style.display="none";$("finalScore").textContent=score+" хол";}
},1000);

const levelSelect=$("levelSelect");
for(let n=1;n<=100;n++){const opt=document.createElement("option");opt.value=n;opt.textContent="Миссия "+n;levelSelect.appendChild(opt);}
const savedName=localStorage.getItem("kalimaPlayerName")||"";
const savedAvatar=localStorage.getItem("kalimaPlayerAvatar")||"🧑‍🎓";
$("profileName").value=savedName;$("avatarSelect").value=savedAvatar;$("avatarPreview").textContent=savedAvatar;
$("homeRecord").textContent=record;levelSelect.value=String(mission);
$("record").textContent=record;
$("avatarSelect").addEventListener("change",()=>{$("avatarPreview").textContent=$("avatarSelect").value;localStorage.setItem("kalimaPlayerAvatar",$("avatarSelect").value);});
$("startGameBtn").addEventListener("click",()=>{
 const name=$("profileName").value.trim()||"Бозигар";
 localStorage.setItem("kalimaPlayerName",name);
 localStorage.setItem("kalimaPlayerAvatar",$("avatarSelect").value);
 mission=Number(levelSelect.value)||1;localStorage.setItem("kalimaMission",mission);
 $("welcomeName").textContent=name;
 $("homeScreen").hidden=true;$("gameScreen").hidden=false;$("backToHome").hidden=false;
 startGame();window.scrollTo({top:0,behavior:"smooth"});
});
function goHome(){
 paused=true;$("gameScreen").hidden=true;$("homeScreen").hidden=false;$("backToHome").hidden=true;$("winModal").classList.remove("show");
 $("homeRecord").textContent=record;levelSelect.value=String(mission);window.scrollTo({top:0,behavior:"smooth"});
}
$("backToHome").addEventListener("click",goHome);$("homeFromWin").addEventListener("click",goHome);
updateHUD();
