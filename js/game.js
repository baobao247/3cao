/* ============================================================
   APP VERSION
============================================================ */
const APP_VERSION = '150926.01';
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('app-version').textContent = APP_VERSION;
});



/* ============================================================
   HELPERS
============================================================ */
const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function fmt(n){
  if(n >= 1e6) return (n/1e6).toFixed(1).replace('.0','') + 'M 🪙';
  if(n >= 1e3) return (n/1e3).toFixed(1).replace('.0','') + 'K 🪙';
  return Math.floor(n) + ' 🪙';
}
function shuffleArray(arr){
  const a = [...arr];
  for(let i = a.length-1; i > 0; i--){
    const j = Math.floor(Math.random() * (i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}
function getRankName(r){
  const names = {1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K'};
  return names[r] || r;
}
function getRandomBotStack(){ return Math.floor(Math.random() * 151 + 50) * 10; }

/* Haptic */
function vibrate(pattern){
  try{ if(navigator.vibrate) navigator.vibrate(pattern); }catch(e){}
}

/* Confetti */
function createConfetti(count = 50){
  const colors = ['#fbbf24','#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#ec4899','#f472b6'];
  for(let i = 0; i < count; i++){
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.left = (Math.random()*100) + 'vw';
    el.style.animationDelay = (Math.random()*0.6) + 's';
    el.style.animationDuration = (1.8 + Math.random()*1.6) + 's';
    if(Math.random() > 0.5) el.style.borderRadius = '50%';
    if(Math.random() > 0.6) el.style.width = '8px';
    if(Math.random() > 0.6) el.style.height = '8px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

/* ============================================================
   BOT QUOTES
============================================================ */
const BOT_QUOTES = {
  deal: ['Chia đi!', 'Nhanh lên!', 'Bài tới đi!', 'Chơi thôi!', 'Tới luôn!', 'Ván này tao thắng!'],
  win:  ['Thắng rồi! 🎉', 'Hên quá!', 'Chuẩn luôn!', 'Biết ngay mà!', 'Dễ ợt!', 'Cảm ơn nhé!'],
  lose: ['Chia lại đi!', 'Hên thôi!', 'Ván sau nha!', 'Hụt rồi!', 'Đen thật!', 'Không phục!'],
  bacao:['BA CÀO! 🎉', 'Thấy chưa!', 'Đỉnh chưa!', 'Bất bại!', 'Số 1!'],
  bluff:['Bài tao mạnh lắm!', 'All-in đi!', 'Tao có Ba Cào!', 'Không đỡ được đâu!']
};

function botSpeak(pIdx, type){
  const p = players[pIdx];
  if(!p || p.isHuman) return;
  const quotes = BOT_QUOTES[type];
  if(!quotes) return;
  const q = quotes[Math.floor(Math.random()*quotes.length)];
  setTimeout(() => showSpeech(pIdx, q), Math.random() * 300);
}

/* ============================================================
   PERSISTENT STATE
============================================================ */
const LS_KEY = 'baicao_rix_pro_v3';

const defaultPersist = {
  humanChips: 1000,
  stats: {
    gamesPlayed: 0, wins: 0, losses: 0, draws: 0,
    totalEarned: 0, totalLost: 0, biggestWin: 0,
    streak: 0, bestStreak: 0,
    baCaoCount: 0, nineNutCount: 0, comebacks: 0,
    peakChips: 1000,
    botWins: {},
    history: []
  },
  achievements: {},
  settings: {
    sound: true,
    lastBet: 10,
    lastMode: 'turtle',
    lastDaily: ''
  }
};

function loadPersist(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return JSON.parse(JSON.stringify(defaultPersist));
    const parsed = JSON.parse(raw);
    const merged = { ...JSON.parse(JSON.stringify(defaultPersist)), ...parsed };
    merged.stats = { ...defaultPersist.stats, ...(parsed.stats || {}) };
    merged.stats.botWins = merged.stats.botWins || {};
    merged.settings = { ...defaultPersist.settings, ...(parsed.settings || {}) };
    return merged;
  } catch(e){
    return JSON.parse(JSON.stringify(defaultPersist));
  }
}
let persist = loadPersist();
function savePersist(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(persist)); }catch(e){}
}

/* ============================================================
   ACHIEVEMENTS
============================================================ */
const ACHIEVEMENTS = [
  { id:'first_win',    icon:'🥇', name:'Ván đầu thắng',    check:s => s.wins >= 1 },
  { id:'first_bacao',  icon:'🎉', name:'Ba Cào đầu tiên',   check:s => s.baCaoCount >= 1 },
  { id:'streak3',      icon:'🔥', name:'Chuỗi 3 thắng',     check:s => s.bestStreak >= 3 },
  { id:'streak5',      icon:'💥', name:'Chuỗi 5 thắng',     check:s => s.bestStreak >= 5 },
  { id:'games10',      icon:'🎲', name:'Chơi 10 ván',       check:s => s.gamesPlayed >= 10 },
  { id:'games50',      icon:'🎯', name:'Chơi 50 ván',       check:s => s.gamesPlayed >= 50 },
  { id:'rich',         icon:'💎', name:'Triệu phú',         check:s => s.peakChips >= 100000 },
  { id:'bacao_master', icon:'👑', name:'Ba Cào 5 lần',      check:s => s.baCaoCount >= 5 },
  { id:'comeback',     icon:'🦅', name:'Hồi sinh từ 0',     check:s => s.comebacks >= 1 }
];

function checkAchievements(){
  let newUnlock = null;
  ACHIEVEMENTS.forEach(a => {
    if(!persist.achievements[a.id] && a.check(persist.stats)){
      persist.achievements[a.id] = Date.now();
      if(!newUnlock) newUnlock = a;
    }
  });
  if(newUnlock){
    showToast(`${newUnlock.icon} Mở khóa: ${newUnlock.name}`, 'win');
    log(`🏆 THÀNH TỰU MỚI: ${newUnlock.name}`, 'achievement');
    Sound.playHappy();
    vibrate([50, 30, 50, 30, 100]);
    createConfetti(40);
    savePersist();
    updateAchBadge();
  }
}
function updateAchBadge(){
  const total = ACHIEVEMENTS.length;
  const unlocked = Object.keys(persist.achievements).length;
  const badge = $('ach-badge');
  badge.style.display = unlocked < total ? 'block' : 'none';
}

/* ============================================================
   TOAST
============================================================ */
function showToast(msg, type = ''){
  const wrap = $('toast-wrap');
  const el = document.createElement('div');
  el.className = 'toast' + (type ? ' ' + type : '');
  el.innerHTML = `<span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => {
    el.style.animation = 'toastIn .3s reverse forwards';
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

/* ============================================================
   MODAL
============================================================ */
function openModal(id){ $(id).classList.add('open'); }
function closeModal(id){ $(id).classList.remove('open'); }
document.querySelectorAll('.modal-backdrop').forEach(m => {
  m.addEventListener('click', e => { if(e.target === m) m.classList.remove('open'); });
});

/* ============================================================
   CELEB POOL
============================================================ */
const CELEB_POOL = [
  {name:"Sơn Tùng M-TP",style:"aggressive"},{name:"Đen Vâu",style:"smart"},
  {name:"Hồ Ngọc Hà",style:"tight"},{name:"Noo Phước Thịnh",style:"aggressive"},
  {name:"Bích Phương",style:"smart"},{name:"Hương Giang",style:"wild"},
  {name:"Chi Pu",style:"tight"},{name:"Trấn Thành",style:"wild"},
  {name:"Hoài Linh",style:"smart"},{name:"Việt Hương",style:"tight"},
  {name:"Miu Lê",style:"aggressive"},{name:"Isaac",style:"smart"},
  {name:"Lương Bích Hữu",style:"tight"},{name:"Phan Đinh Tùng",style:"aggressive"},
  {name:"Uyên Linh",style:"smart"},{name:"Phương Ly",style:"wild"},
  {name:"Ngô Kiến Huy",style:"tight"},{name:"Jun Phạm",style:"aggressive"},
  {name:"Ali Hoàng Dương",style:"smart"},{name:"K-ICM",style:"wild"},
  {name:"JACK",style:"aggressive"},{name:"RPT MCK",style:"smart"},
  {name:"Đạt G",style:"tight"},{name:"Karik",style:"wild"},
  {name:"Binz",style:"aggressive"},{name:"JustaTee",style:"smart"},
  {name:"Lynk Lee",style:"tight"},{name:"Lâm Vỹ Dạ",style:"wild"},
  {name:"Cường Seven",style:"aggressive"},{name:"Thùy Chi",style:"smart"}
];
let shuffledCelebs = shuffleArray(CELEB_POOL);
let activeCelebs = shuffledCelebs.slice(0,3);
let benchPool = shuffledCelebs.slice(3);

/* ============================================================
   GAME STATE
============================================================ */
const INITIAL_CHIPS = 1000;
const REVIVE_CHIPS = 100;

let gameMode = 'turtle';
let players = [];
let deck = [];
let pot = 0;
let allBets = [];
let dealerIndex = -1;
let gameState = 'IDLE';
let myCardsRevealed = false;
let roundWinners = [];
let isNanning = false;
let nanningPhase = 0;
let expectedRanks = [];
let expectedType = 'none';
let expectedName = '';
let cardsFlippedManually = false;
let playerCardElements = [];

const betInput = $('bet-amount');
const statusBar = $('status-bar');
const chargeEffect = $('charge-effect');

/* ============================================================
   UI FUNCTIONS
============================================================ */
function log(msg, type = ''){
  const box = $('log-box');
  const line = document.createElement('div');
  line.className = `log-line ${type}`;
  line.innerHTML = msg;
  box.insertBefore(line, box.firstChild);
  while(box.children.length > 60) box.removeChild(box.lastChild);
}
function showSpeech(pIdx, text){
  const b = $(`bubble-${pIdx}`);
  if(!b) return;
  b.innerText = text;
  b.classList.add('show');
  setTimeout(() => b.classList.remove('show'), 1800);
}
function setStatus(msg){ statusBar.innerText = msg; }
function adjustBet(d){
  let v = parseInt(betInput.value) || 10;
  v = Math.max(5, v + d);
  betInput.value = v;
  persist.settings.lastBet = v;
  savePersist();
}
function setBetPreset(type){
  const chips = players[0].chips;
  let val = parseInt(betInput.value) || 10;
  if(type === 'min') val = 5;
  else if(type === 'half') val = Math.max(5, Math.floor(chips/2));
  else if(type === 'x2') val = Math.max(5, val * 2);
  else if(type === 'max') val = Math.max(5, chips);
  else if(type === 'allin') val = chips;
  if(val > chips) val = chips;
  betInput.value = val;
  persist.settings.lastBet = val;
  savePersist();
  Sound.playChip();
  vibrate(15);
}
function chipFly(fromIdx){
  const from = $(`seat-${fromIdx}`);
  if(!from) return;
  const fromRect = from.getBoundingClientRect();
  const potRect = $('pot-display').getBoundingClientRect();
  const chip = document.createElement('div');
  chip.className = 'flying-chip';
  chip.textContent = '$';
  chip.style.left = (fromRect.left + fromRect.width/2 - 11) + 'px';
  chip.style.top = (fromRect.top + fromRect.height/2 - 11) + 'px';
  document.body.appendChild(chip);
  requestAnimationFrame(() => {
    chip.style.left = (potRect.left + potRect.width/2 - 11) + 'px';
    chip.style.top = (potRect.top + potRect.height/2 - 11) + 'px';
    chip.style.transform = 'rotate(720deg)';
  });
  setTimeout(() => chip.remove(), 550);
}



/* ============================================================
   INIT PLAYERS
============================================================ */
function initPlayers(){
  const botNames = activeCelebs.map(c => c.name);
  const botStyles = activeCelebs.map(c => c.style);
  players = [
    {id:0,name:"Bạn",chips:persist.humanChips,hand:[],isHuman:true,bet:0,style:'smart'},
    {id:1,name:botNames[0],chips:getRandomBotStack(),hand:[],isHuman:false,bet:0,style:botStyles[0]},
    {id:2,name:botNames[1],chips:getRandomBotStack(),hand:[],isHuman:false,bet:0,style:botStyles[1]},
    {id:3,name:botNames[2],chips:getRandomBotStack(),hand:[],isHuman:false,bet:0,style:botStyles[2]}
  ];
  players.forEach((p, i) => { $(`name-${i}`).innerText = p.name; });
}

function resetRound(){
  players.forEach(p => { p.hand = []; p.bet = 0; });
  pot = 0; allBets = []; myCardsRevealed = false; roundWinners = [];
  isNanning = false; nanningPhase = 0;
  expectedRanks = []; expectedType = 'none'; expectedName = '';
  cardsFlippedManually = false; playerCardElements = [];
  gameState = 'IDLE';
  // Reset thinking indicator + winner
  document.querySelectorAll('.seat').forEach(s => s.classList.remove('winner','thinking','dealer'));
  chargeEffect.classList.remove('active');
  delete chargeEffect.dataset.charged;
  setStatus('🎯 Đặt cược và chia bài!');
  updateUI();
}



/* ============================================================
   BOT AI
============================================================ */
function botBetStrategy(playerIdx){
  const p = players[playerIdx];
  if(!p || p.isHuman) return 0;
  const score = calcScore(p.hand);
  const style = p.style || 'smart';

  let maxRatio = 0.4;
  if(style === 'aggressive') maxRatio = 0.65;
  else if(style === 'wild') maxRatio = 0.55;
  else if(style === 'tight') maxRatio = 0.25;
  else if(style === 'smart') maxRatio = 0.45;

  let base = 0;
  if(score.isBaCao) base = 0.8;
  else if(score.score >= 8) base = 0.7;
  else if(score.score >= 6) base = 0.5;
  else if(score.score >= 4) base = 0.35;
  else base = 0.15;

  if(!p.hand || p.hand.length === 0){
    if(style === 'wild') base = 0.3 + Math.random() * 0.3;
    else if(style === 'aggressive') base = 0.25 + Math.random() * 0.25;
    else base = 0.15 + Math.random() * 0.15;
  } else if(score.score <= 3 && Math.random() < 0.15){
    base = 0.4 + Math.random() * 0.2;
    // Bluff chat
    setTimeout(() => botSpeak(playerIdx, 'bluff'), 100);
  }

  let maxBet = Math.floor(p.chips * maxRatio);
  let minBet = Math.max(5, Math.floor(p.chips * 0.05));
  let target = Math.floor(maxBet * base);
  if(target < minBet) target = minBet;
  if(target > maxBet) target = maxBet;
  if(target > p.chips) target = p.chips;
  return target;
}

async function botPlaceBet(i){
  const seat = $(`seat-${i}`);
  seat.classList.add('thinking');
  await sleep(280 + Math.random() * 350);
  seat.classList.remove('thinking');

  const bot = players[i];
  let botBet = botBetStrategy(i);
  if(botBet > bot.chips) botBet = bot.chips;
  if(botBet < 5 && bot.chips >= 5) botBet = 5;
  if(botBet <= 0) return;

  bot.chips -= botBet;
  bot.bet = botBet;
  pot += botBet;
  allBets[i] = botBet;

  chipFly(i);
  Sound.playChip();
  updatePot(true);
  updateUI();
}

/* ============================================================
   POTENTIAL EVALUATION
============================================================ */
function evaluatePotential(two){
  if(two.length !== 2) return {expectedRanks:[],type:'none',expectedName:''};
  const allFace = two.every(c => c.rank >= 11 && c.rank <= 13);
  if(allFace) return {expectedRanks:[],type:'ba_cao',expectedName:'Tây (J/Q/K)'};
  let sum = 0;
  two.forEach(c => {
    if(c.rank === 1) sum += 1;
    else if(c.rank >= 11) sum += 10;
    else sum += c.rank;
  });
  let candidates = [];
  for(let r = 1; r <= 13; r++){
    let v = r === 1 ? 1 : (r >= 11 ? 10 : r);
    if((sum + v) % 10 === 9) candidates.push(r);
  }
  if(!candidates.length) return {expectedRanks:[],type:'none',expectedName:''};
  let displayName = '';
  const hasTen = candidates.includes(10);
  const hasTay = candidates.some(r => r >= 11);
  if(hasTen && hasTay) displayName = '10 hoặc Tây (J/Q/K)';
  else if(hasTen) displayName = '10';
  else if(hasTay){
    const tayRanks = candidates.filter(r => r >= 11).map(r => getRankName(r));
    displayName = tayRanks.join('/');
  } else displayName = getRankName(candidates[0]);
  return {expectedRanks: candidates, type:'nut9', expectedName: displayName};
}

/* ============================================================
   PLACE BET
============================================================ */
async function placeBet(){
  if(gameState === 'SHOWDOWN'){
    log('Ván đã kết thúc, bấm "Ván tiếp".', 'alert');
    return;
  }
  const human = players[0];
  let amount = parseInt(betInput.value) || 10;
  if(amount < 5) amount = 5;

  if(gameMode === 'turtle'){
    if(amount > human.chips){
      log(`Bạn chỉ có ${fmt(human.chips)}, không đủ cược!`, 'alert');
      return;
    }
    human.chips -= amount;
    human.bet = amount;
    pot += amount;
    allBets[0] = amount;
    chipFly(0);
    Sound.playChip();
    updatePot(true);

    for(let i = 1; i < players.length; i++){
      await botPlaceBet(i);
    }
    log(`🐢 Cào rùa: bạn cược ${fmt(amount)}. Tổng pot: ${fmt(pot)}`, 'gold');
    setStatus(`Đã cược! Tổng pot ${fmt(pot)}. Chia bài nào!`);
    gameState = 'BETTING';
  } else if(gameMode === 'dealer'){
    if(dealerIndex === -1) selectDealer(0);
    const isHumanDealer = dealerIndex === 0;

    if(isHumanDealer){
      human.bet = 0; allBets[0] = 0;
      log('🧑 Bạn là nhà cái, không cần đặt cược.', 'gold');
      setStatus('Bạn là cái, không cược. Bấm "Chia bài" để bắt đầu.');
    } else {
      if(amount > human.chips){
        log(`Bạn chỉ có ${fmt(human.chips)}, không đủ cược!`, 'alert');
        return;
      }
      human.chips -= amount;
      human.bet = amount;
      pot += amount;
      allBets[0] = amount;
      chipFly(0);
      Sound.playChip();
      updatePot(true);
      log(`Bạn đặt cược ${fmt(amount)}`, 'gold');
    }

    for(let i = 1; i < players.length; i++){
      if(i === dealerIndex) continue;
      await botPlaceBet(i);
    }
    players[dealerIndex].bet = 0;
    allBets[dealerIndex] = 0;

    log(`🏦 Cào cái: ${isHumanDealer ? 'bạn là cái' : `bạn cược ${fmt(amount)}`}. Tổng pot: ${fmt(pot)}`, 'gold');
    setStatus(`Đã cược! Tổng pot ${fmt(pot)}. Chia bài nào!`);
    gameState = 'BETTING';
  }
  updateUI();
  $('btn-bet').disabled = true;
  $('btn-deal').disabled = false;
}

/* ============================================================
   DEAL CARDS
============================================================ */
async function dealCards(){
  if(gameState !== 'BETTING'){
    log('Hãy đặt cược trước!', 'alert');
    return;
  }
  if(deck.length < 12) createDeck();
  gameState = 'DEALING';
  $('btn-deal').disabled = true;
  setStatus('🃏 Đang chia bài...');
  log('🃏 Đang chia bài...', 'gold');

  const order = [0,1,2,3];
  let sourceIdx = dealerIndex >= 0 ? dealerIndex : 0;
  for(let round = 0; round < 3; round++){
    for(let i = 0; i < order.length; i++){
      const pIdx = order[i];
      const card = deck.pop();
      players[pIdx].hand.push(card);
      await animateDealCard(`cards-${pIdx}`, sourceIdx);
      renderAllCards(false);
      await sleep(60);
    }
  }
  myCardsRevealed = false;
  isNanning = false; nanningPhase = 0;
  expectedRanks = []; expectedType = 'none'; expectedName = '';
  cardsFlippedManually = false; playerCardElements = [];
  renderAllCards(false);
  updateUI();

  // Bot chat after deal
  const botIdx = 1 + Math.floor(Math.random() * 3);
  botSpeak(botIdx, 'deal');

  log('✅ Chia bài xong! Bấm "Nặn bài" để nặn từng lá.', 'gold');
  setStatus('👀 Bấm "Nặn bài" để lật từng lá, hoặc "Lật bài"!');
  $('btn-peek').disabled = false;
  $('btn-flip-all').disabled = false;
  $('btn-showdown').disabled = true;
}

async function animateDealCard(targetId, fromIdx = 0){
  Sound.playCard();
  const source = $(`seat-${fromIdx}`);
  const target = $(targetId);
  if(!source || !target) return;
  const sR = source.getBoundingClientRect();
  const tR = target.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.className = 'flying-card';
  flyer.style.left = (sR.left + sR.width/2 - 16) + 'px';
  flyer.style.top = (sR.top + sR.height/2 - 22) + 'px';
  document.body.appendChild(flyer);
  await sleep(20);
  flyer.style.left = (tR.left + tR.width/2 - 16) + 'px';
  flyer.style.top = (tR.top + tR.height/2 - 22) + 'px';
  flyer.style.transform = 'scale(1.02) rotate(360deg)';
  await sleep(280);
  if(flyer.parentNode) flyer.parentNode.removeChild(flyer);
}

/* ============================================================
   NẶN BÀI
============================================================ */
async function nanCardStep(){
  if(gameState !== 'DEALING' || isNanning) return;
  if(players[0].hand.length !== 3){ log('Chưa có bài!', 'alert'); return; }
  if(nanningPhase >= 3){ log('Đã nặn hết 3 lá!', 'gold'); return; }
  if(cardsFlippedManually){ log('Bạn đã lật toàn bộ.', 'gold'); return; }

  isNanning = true;
  $('btn-peek').disabled = true;
  $('btn-flip-all').disabled = true;
  $('btn-showdown').disabled = true;

  const idx = nanningPhase;
  const cardEl = playerCardElements[0] && playerCardElements[0][idx];
  if(!cardEl){ isNanning = false; updateUI(); return; }

  // Lá thứ 3: Mở modal nặn bài kéo trượt tương tác thực tế
  if(idx === 2){
    openInteractiveNan(players[0].hand[2], cardEl);
    return;
  }

  cardEl.classList.add('nan-card','nanning');
  await sleep(180);
  cardEl.classList.remove('nanning');
  cardEl.classList.add('flipped');
  Sound.playCard();
  vibrate(20);
  nanningPhase = idx + 1;

  if(nanningPhase === 1){
    showSpeech(0, 'Lá đầu...');
    setStatus('Lá thứ 1 đã lật.');
  } else if(nanningPhase === 2){
    const firstTwo = players[0].hand.slice(0, 2);
    const potential = evaluatePotential(firstTwo);
    if(potential.expectedRanks.length > 0 || potential.type === 'ba_cao'){
      expectedRanks = potential.expectedRanks;
      expectedType = potential.type;
      expectedName = potential.expectedName;
      chargeEffect.classList.add('active');
      Sound.playCharge();
      vibrate([30, 20, 30, 20, 60]);
      if(potential.type === 'ba_cao'){
        showSpeech(0, '🔥 Cần Tây nữa!');
        log('🔥 Cần lá Tây nữa là BA CÀO!', 'special');
        setStatus('⚡ Tụ lực cho BA CÀO!');
      } else if(potential.type === 'nut9'){
        showSpeech(0, `🔥 Cần ${potential.expectedName}!`);
        log(`🔥 Cần ${potential.expectedName} nữa là 9 NÚT!`, 'special');
        setStatus('⚡ Tụ lực cho 9 NÚT!');
      }
      $('poker-table').classList.add('shake');
      setTimeout(() => $('poker-table').classList.remove('shake'), 300);
    } else {
      showSpeech(0, '😐 Không có gì đặc biệt.');
      setStatus('Không có tiềm năng đặc biệt.');
    }
  }

  if(nanningPhase < 3) $('btn-peek').disabled = false;
  isNanning = false;
  updateUI();
}



/* ============================================================
   FLIP ALL
============================================================ */
async function flipAllCards(){
  if(gameState !== 'DEALING' || isNanning) return;
  if(nanningPhase >= 3 && !cardsFlippedManually){ log('Đã nặn hết 3 lá!', 'gold'); return; }
  if(cardsFlippedManually){ log('Bài đã được lật!', 'gold'); return; }

  cardsFlippedManually = true;
  $('btn-flip-all').disabled = true;
  $('btn-peek').disabled = true;

  const allCards = playerCardElements[0] || [];
  for(let i = nanningPhase; i < 3; i++){
    const el = allCards[i];
    if(!el) continue;
    el.classList.add('nan-card','nanning');
    await sleep(120);
    el.classList.remove('nanning');
    el.classList.add('flipped');
    Sound.playCard();
  }
  nanningPhase = 3;
  myCardsRevealed = true;

  const score = calcScore(players[0].hand);
  let msg = '', glow = '';
  if(score.isBaCao){ msg='🎉 BA CÀO!'; glow='glow-rainbow'; Sound.playBaCao(); vibrate([100,50,100,50,200]); createFireworks(0); createConfetti(60); persist.stats.baCaoCount++; }
  else if(score.score >= 9){ msg='🔥 9 NÚT!'; glow='glow-gold'; Sound.playWin(); vibrate([60,40,60]); createFireworks(0); createConfetti(40); persist.stats.nineNutCount++; }
  else if(score.score >= 8){ msg='✨ 8 NÚT!'; glow='glow-gold'; Sound.playHappy(); vibrate(50); createFireworks(0); }
  else if(score.score >= 6){ msg=`👍 ${score.score} NÚT`; glow='glow-blue'; Sound.playCard(); }
  else if(score.score >= 4){ msg=`😐 ${score.score} NÚT`; glow='glow-blue'; Sound.playCard(); }
  else { msg=`😢 ${score.score} NÚT`; glow='glow-red'; Sound.playAngry(); vibrate([100,50,100]); }
  allCards.forEach(el => el.classList.add(glow));
  showSpeech(0, msg);
  setStatus(`📋 Đã lật: ${msg}`);
  log(`📋 Lật nhanh: ${msg}`, 'gold');
  $('btn-showdown').disabled = false;
  updateUI();
}

/* ============================================================
   SHOWDOWN
============================================================ */
function showdown(){
  if(gameState !== 'DEALING'){ log('Chưa thể kết thúc ván!', 'alert'); return; }
  if(isNanning) return;
  if(nanningPhase < 3 && !cardsFlippedManually){
    log('Cần nặn hết 3 lá hoặc "Lật bài" trước!', 'alert'); return;
  }
  gameState = 'SHOWDOWN';
  $('btn-showdown').disabled = true;
  $('btn-peek').disabled = true;
  $('btn-flip-all').disabled = true;
  setStatus('🏆 Công bố kết quả...');
  myCardsRevealed = true;
  renderAllCards(true);

  let results = players.map((p, idx) => ({index: idx, player: p, score: calcScore(p.hand)}));
  let humanResult = 'draw';
  let humanProfit = 0;

  // Bot Ba Cào chat
  results.forEach(r => {
    if(!r.player.isHuman && r.score.isBaCao){
      setTimeout(() => botSpeak(r.index, 'bacao'), 200 + Math.random() * 400);
    }
  });

  if(gameMode === 'turtle'){
    let maxScore = -1, maxIsBaCao = false;
    results.forEach(r => {
      if(r.score.isBaCao && !maxIsBaCao){ maxIsBaCao = true; maxScore = 10; }
      else if(!r.score.isBaCao && !maxIsBaCao && r.score.score > maxScore) maxScore = r.score.score;
    });
    roundWinners = results.filter(r => {
      if(maxIsBaCao) return r.score.isBaCao;
      return !r.score.isBaCao && r.score.score === maxScore;
    });

    const humanWon = roundWinners.some(w => w.index === 0);
    const humanTied = roundWinners.length > 1 && humanWon;

    if(roundWinners.length > 0){
      const share = Math.floor(pot / roundWinners.length);
      let remainder = pot - share * roundWinners.length;
      roundWinners.forEach((w, idx) => {
        let add = share;
        if(idx === 0) add += remainder;
        w.player.chips += add;
        const handName = w.score.isBaCao ? 'BA CÀO' : `${w.score.score} NÚT`;
        log(`🏆 ${w.player.name} THẮNG ${fmt(add)} với [${handName}]!`, 'winner');
        $(`seat-${w.index}`).classList.add('winner');
        Sound.playWin();
        createFireworks(w.index);
        // Bot chat
        if(!w.player.isHuman) botSpeak(w.index, 'win');
        // Bot wins tracking
        if(!w.player.isHuman){
          persist.stats.botWins[w.player.name] = (persist.stats.botWins[w.player.name] || 0) + 1;
        }
      });
      if(roundWinners.length > 1) log(`🤝 Hòa: ${roundWinners.map(w=>w.player.name).join(', ')}`, 'gold');

      if(humanWon && humanTied) humanResult = 'draw';
      else if(humanWon) humanResult = 'win';
      else humanResult = 'loss';
      if(humanWon){
        humanProfit = Math.floor(pot / roundWinners.length) - players[0].bet;
        if(humanProfit > persist.stats.biggestWin) persist.stats.biggestWin = humanProfit;
      } else humanProfit = -players[0].bet;

      // Bot losers chat
      results.forEach(r => {
        if(!r.player.isHuman && !roundWinners.some(w => w.index === r.index)){
          botSpeak(r.index, 'lose');
        }
      });

      pot = 0;
    } else {
      log('Không có người thắng (lỗi).', 'alert');
    }
  } else {
    // Cào cái
    const dealer = players[dealerIndex];
    dealer.chips += pot;
    const totalPool = pot;
    pot = 0;

    let hasWinner = false, hasDraw = false;

    for(let i = 0; i < players.length; i++){
      if(i === dealerIndex) continue;
      const p = players[i];
      const comp = compareHands(p.hand, dealer.hand);
      if(comp === 1){
        hasWinner = true;
        const win = p.bet * 2;
        const take = Math.min(win, dealer.chips);
        p.chips += take;
        dealer.chips -= take;
        const profit = take - p.bet;
        const handName = calcScore(p.hand).isBaCao ? 'BA CÀO' : `${calcScore(p.hand).score} NÚT`;
        log(`💰 ${p.name} thắng cái, nhận ${fmt(take)} (lời ${fmt(profit)}) [${handName}]!`, 'winner');
        $(`seat-${i}`).classList.add('winner');
        Sound.playWin();
        createFireworks(i);
        if(!p.isHuman) botSpeak(i, 'win');
        if(i === 0) humanProfit = profit;
      } else if(comp === -1){
        log(`❌ ${p.name} thua cái, mất ${fmt(p.bet)}`, 'alert');
        if(!p.isHuman) botSpeak(i, 'lose');
        if(i === 0) humanProfit = -p.bet;
      } else {
        hasDraw = true;
        p.chips += p.bet;
        dealer.chips -= p.bet;
        log(`↩️ ${p.name} hòa cái, nhận lại ${fmt(p.bet)}`, 'gold');
        if(i === 0) humanProfit = 0;
      }
    }

    if(!hasWinner && !hasDraw){
      $(`seat-${dealerIndex}`).classList.add('winner');
      const handName = calcScore(dealer.hand).isBaCao ? 'BA CÀO' : `${calcScore(dealer.hand).score} NÚT`;
      log(`🏦 Cái thắng tất cả với [${handName}]!`, 'winner');
      Sound.playWin();
      createFireworks(dealerIndex);
      if(!dealer.isHuman) botSpeak(dealerIndex, 'win');
      else createConfetti(40);
      // Bot wins tracking
      if(!dealer.isHuman){
        persist.stats.botWins[dealer.name] = (persist.stats.botWins[dealer.name] || 0) + 1;
      }
    }

    // Human result
    if(dealerIndex === 0){
      const anyBotWon = players.some((p,i) => i !== 0 && compareHands(p.hand, dealer.hand) === 1);
      humanResult = anyBotWon ? 'loss' : 'win';
    } else {
      if(humanProfit > 0) humanResult = 'win';
      else if(humanProfit < 0) humanResult = 'loss';
      else humanResult = 'draw';
      if(humanProfit > persist.stats.biggestWin) persist.stats.biggestWin = humanProfit;
    }
  }

  // Update stats
  persist.stats.gamesPlayed++;
  if(humanResult === 'win'){
    persist.stats.wins++;
    persist.stats.streak++;
    if(persist.stats.streak > persist.stats.bestStreak) persist.stats.bestStreak = persist.stats.streak;
    vibrate([40, 60, 40]);
  } else if(humanResult === 'loss'){
    persist.stats.losses++;
    persist.stats.streak = 0;
    vibrate([100]);
  } else {
    persist.stats.draws++;
    vibrate([60, 40, 60]);
  }
  if(players[0].chips > persist.stats.peakChips) persist.stats.peakChips = players[0].chips;
  persist.stats.history.unshift({
    mode: gameMode,
    result: humanResult,
    chips: players[0].chips,
    time: Date.now()
  });
  if(persist.stats.history.length > 10) persist.stats.history.length = 10;

  persist.humanChips = players[0].chips;
  savePersist();

  if(players[0].chips > 0 && persist.stats.lastZeroChips){
    persist.stats.comebacks++;
    delete persist.stats.lastZeroChips;
  }

  players.forEach(p => p.hand = []);
  gameState = 'SHOWDOWN';
  updateUI();
  $('btn-next').style.display = 'block';
  setStatus('🏁 Ván kết thúc! Bấm "Ván tiếp".');
  $('poker-table').classList.add('shake');
  Sound.playShake();
  setTimeout(() => $('poker-table').classList.remove('shake'), 400);

  if(humanResult === 'win'){
    showToast(`🎉 Bạn thắng ván này!`, 'win');
    createConfetti(50);
  } else if(humanResult === 'loss'){
    showToast(`😢 Thua rồi, cố ván sau!`, 'info');
  } else showToast(`🤝 Hòa ván này.`, 'info');

  checkAchievements();
  updateAchBadge();
}

/* ============================================================
   NEXT ROUND
============================================================ */
function resetForNextRound(){
  players.forEach((p, idx) => {
    if(!p.isHuman && p.chips <= 0){
      if(benchPool.length > 0){
        const newCeleb = benchPool.shift();
        benchPool.push({name: p.name, style: p.style});
        p.name = newCeleb.name;
        p.style = newCeleb.style;
        p.chips = getRandomBotStack();
        $(`name-${idx}`).innerText = p.name;
        log(`✨ ${newCeleb.name} tham gia bàn với ${fmt(p.chips)}!`, 'gold');
      } else p.chips = getRandomBotStack();
    }
  });
  if(players[0].chips <= 0){
    players[0].chips = REVIVE_CHIPS;
    persist.stats.lastZeroChips = true;
    log(`💰 Bạn hết tiền! Được cấp lại ${fmt(REVIVE_CHIPS)}.`, 'gold');
    showToast(`💰 Hồi sinh với ${fmt(REVIVE_CHIPS)}`, 'info');
  }
  persist.humanChips = players[0].chips;
  savePersist();
  resetRound();
  $('btn-bet').disabled = false;
  $('btn-deal').disabled = true;
  $('btn-peek').disabled = true;
  $('btn-flip-all').disabled = true;
  $('btn-showdown').disabled = true;
  $('btn-next').style.display = 'none';
  if(gameMode === 'dealer' && dealerIndex === -1) selectDealer(0);
  updateUI();
  setStatus('🔄 Ván mới! Đặt cược và chia bài.');
  log('🔄 Ván mới sẵn sàng!', 'gold');
}

/* ============================================================
   MODE & DEALER
============================================================ */
function setGameMode(mode){
  if(gameState !== 'IDLE' && gameState !== 'SHOWDOWN'){
    log('Đang trong ván, không thể đổi mode!', 'alert'); return;
  }
  gameMode = mode;
  persist.settings.lastMode = mode;
  savePersist();
  document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
  if(mode === 'turtle'){
    $('mode-turtle').classList.add('active');
    dealerIndex = -1;
    $('dealer-select-human').classList.remove('active-dealer');
    $('dealer-select-bot').classList.remove('active-dealer');
    log('🐢 Cào Rùa: nhất ăn tất.', 'gold');
    setStatus('🐢 Cào Rùa – mỗi người cược khác nhau.');
  } else {
    $('mode-dealer').classList.add('active');
    selectDealer(0);
    log('🏦 Cào Cái.', 'gold');
    setStatus('🏦 Cào Cái – chọn cái và đặt cược.');
  }
  resetRound();
  updateUI();
}
function selectDealer(choice){
  if(gameMode !== 'dealer'){ log('Chỉ áp dụng cho Cào Cái!', 'alert'); return; }
  if(gameState !== 'IDLE' && gameState !== 'SHOWDOWN'){
    log('Không thể đổi cái giữa ván!', 'alert'); return;
  }
  if(choice === 0){
    dealerIndex = 0;
    $('dealer-select-human').classList.add('active-dealer');
    $('dealer-select-bot').classList.remove('active-dealer');
    log('🧑 Bạn là nhà cái.', 'gold');
    setStatus('🧑 Bạn là cái. Đặt cược và chia bài.');
  } else {
    const bots = [1,2,3];
    dealerIndex = bots[Math.floor(Math.random() * bots.length)];
    $('dealer-select-bot').classList.add('active-dealer');
    $('dealer-select-human').classList.remove('active-dealer');
    log(`🤖 Nhà cái là ${players[dealerIndex].name}.`, 'gold');
    setStatus(`🤖 Cái: ${players[dealerIndex].name}. Đặt cược đi!`);
  }
  updateUI();
}

/* ============================================================
   FIREWORKS
============================================================ */
function createFireworks(seatId){
  const seat = $(`seat-${seatId}`);
  if(!seat) return;
  const r = seat.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  const colors = ['#fbbf24','#f59e0b','#ef4444','#3b82f6','#10b981','#8b5cf6','#ec4899','#f472b6'];
  for(let i = 0; i < 18; i++){
    const el = document.createElement('div');
    el.className = 'firework';
    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 60;
    el.style.setProperty('--tx', Math.cos(angle) * dist + 'px');
    el.style.setProperty('--ty', Math.sin(angle) * dist + 'px');
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    const sz = (4 + Math.random() * 8) + 'px';
    el.style.width = sz; el.style.height = sz;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }
}

/* ============================================================
   STATS MODAL
============================================================ */
function showStats(){
  const s = persist.stats;
  const winRate = s.gamesPlayed ? ((s.wins / s.gamesPlayed) * 100).toFixed(1) : '0.0';

  // Bot leaderboard
  const botEntries = Object.entries(s.botWins || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const html = `
    <div class="stats-grid">
      <div class="stat-card"><div class="v">${s.gamesPlayed}</div><div class="l">Ván đã chơi</div></div>
      <div class="stat-card win"><div class="v">${s.wins}</div><div class="l">Thắng</div></div>
      <div class="stat-card loss"><div class="v">${s.losses}</div><div class="l">Thua</div></div>
      <div class="stat-card draw"><div class="v">${s.draws}</div><div class="l">Hòa</div></div>
      <div class="stat-card"><div class="v">${winRate}%</div><div class="l">Tỉ lệ thắng</div></div>
      <div class="stat-card"><div class="v">${s.streak}${s.bestStreak > 0 ? ' / ' + s.bestStreak : ''}</div><div class="l">Streak / Best</div></div>
      <div class="stat-card"><div class="v">${s.baCaoCount}</div><div class="l">Ba Cào</div></div>
      <div class="stat-card"><div class="v">${s.nineNutCount}</div><div class="l">9 Nút</div></div>
    </div>
    <div class="modal-section">
      <h4>💎 Kỷ lục</h4>
      <p style="font-size:.8rem;color:#cbd5e1">Chips cao nhất: <strong style="color:var(--gold)">${fmt(s.peakChips)}</strong></p>
      <p style="font-size:.8rem;color:#cbd5e1">Thắng lớn nhất: <strong style="color:#4ade80">${fmt(s.biggestWin)}</strong></p>
      <p style="font-size:.8rem;color:#cbd5e1">Hiện có: <strong style="color:var(--gold)">${fmt(persist.humanChips)}</strong></p>
    </div>
    ${botEntries.length ? `
      <div class="modal-section">
        <h4>🤖 BXH Bot thắng nhiều</h4>
        <div class="leaderboard">
          ${botEntries.map((e, i) => `
            <div class="lb-item ${i === 0 ? 'gold' : ''}">
              <span class="lb-rank">#${i+1}</span>
              <span class="lb-name">${e[0]}</span>
              <span class="lb-wins">${e[1]} 🏆</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
    ${s.history.length ? `
      <div class="modal-section">
        <h4>📜 10 ván gần đây</h4>
        <div class="history-list-mini">
          ${s.history.map(h => {
            const icon = h.result === 'win' ? '🏆' : h.result === 'loss' ? '💔' : '🤝';
            const label = h.result === 'win' ? 'Thắng' : h.result === 'loss' ? 'Thua' : 'Hòa';
            const mode = h.mode === 'turtle' ? '🐢' : '🏦';
            const time = new Date(h.time).toLocaleTimeString('vi-VN', {hour:'2-digit',minute:'2-digit'});
            return `<div class="history-item-mini ${h.result}">
              <span>${icon} ${mode} ${label} <span style="color:#94a3b8;font-size:.7rem">${time}</span></span>
              <span class="result">${fmt(h.chips)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>
    ` : ''}
    <div class="modal-section">
      <button class="btn btn-danger" style="width:100%" onclick="resetStats()">🗑️ Xóa thống kê</button>
    </div>
  `;
  $('stats-content').innerHTML = html;
  openModal('modal-stats');
}
function resetStats(){
  if(!confirm('Xóa toàn bộ thống kê? Không thể hoàn tác.')) return;
  persist.stats = JSON.parse(JSON.stringify(defaultPersist.stats));
  persist.achievements = {};
  savePersist();
  showStats();
  showToast('Đã xóa thống kê', 'info');
  updateAchBadge();
}

/* ============================================================
   ACHIEVEMENTS MODAL
============================================================ */
function showAchievements(){
  const html = ACHIEVEMENTS.map(a => {
    const unlocked = !!persist.achievements[a.id];
    return `<div class="ach-card ${unlocked ? 'unlocked' : 'locked'}">
      <div class="ach-icon">${a.icon}</div>
      <div class="ach-name">${a.name}</div>
    </div>`;
  }).join('');
  $('achievements-grid').innerHTML = html;
  openModal('modal-ach');
}

/* ============================================================
   DAILY REWARD
============================================================ */
function checkDaily(){
  const today = new Date().toDateString();
  if(persist.settings.lastDaily === today) return;

  const reward = 200 + Math.floor(Math.random() * 301);
  players[0].chips += reward;
  persist.humanChips = players[0].chips;
  persist.settings.lastDaily = today;
  savePersist();

  setTimeout(() => {
    showToast(`🎁 Quà hàng ngày: +${fmt(reward)}`, 'win');
    log(`🎁 Quà hàng ngày: +${fmt(reward)}!`, 'achievement');
    Sound.playWin();
    vibrate([60, 40, 60]);
    createConfetti(60);
    updateUI();
  }, 600);
}

/* ============================================================
   SOUND TOGGLE
============================================================ */
function toggleSound(){
  Sound.enabled = !Sound.enabled;
  persist.settings.sound = Sound.enabled;
  savePersist();
  const btn = $('btn-sound');
  btn.innerHTML = Sound.enabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
  btn.classList.toggle('muted', !Sound.enabled);
  showToast(Sound.enabled ? 'Bật âm thanh' : 'Tắt âm thanh', 'info');
  if(Sound.enabled) Sound.playChip();
}

/* ============================================================
   RESET ALL
============================================================ */
function resetAll(){
  if(!confirm('Chơi lại từ đầu? Toàn bộ chips và thống kê sẽ reset.')) return;
  localStorage.removeItem(LS_KEY);
  persist = loadPersist();
  shuffledCelebs = shuffleArray(CELEB_POOL);
  activeCelebs = shuffledCelebs.slice(0,3);
  benchPool = shuffledCelebs.slice(3);
  initPlayers();
  resetRound();
  updateUI();
  showToast('Đã reset toàn bộ!', 'info');
  log('🔄 Đã reset toàn bộ. Chúc may mắn!', 'gold');
}

/* ============================================================
   INIT
============================================================ */
function init(){
  Sound.enabled = persist.settings.sound !== false;
  $('btn-sound').innerHTML = Sound.enabled ? '<i class="fas fa-volume-high"></i>' : '<i class="fas fa-volume-xmark"></i>';
  $('btn-sound').classList.toggle('muted', !Sound.enabled);
  $('btn-sound').addEventListener('click', toggleSound);

  // Table Themes Toggle
  const THEMES = ['', 'theme-macau', 'theme-cyber', 'theme-ocean'];
  let currentThemeIdx = 0;
  if($('btn-theme')){
    $('btn-theme').addEventListener('click', () => {
      currentThemeIdx = (currentThemeIdx + 1) % THEMES.length;
      const table = $('poker-table');
      table.className = 'poker-table ' + THEMES[currentThemeIdx];
      const names = ['Xanh Casino', 'Macau Vàng Kim', 'Cyberpunk Tím', 'Đại Dương Xanh'];
      showToast(`Bàn đấu: ${names[currentThemeIdx]} 🎨`, 'info');
    });
  }

  // Bankrupt relief
  function checkBankrupt(){
    const bar = $('bankrupt-bar');
    if(!bar) return;
    if(players[0] && players[0].chips < 5 && gameState === 'IDLE'){
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }
  window.checkBankrupt = checkBankrupt;

  if($('btn-relief')){
    $('btn-relief').addEventListener('click', () => {
      players[0].chips += 500;
      persist.stats.comebacks = (persist.stats.comebacks || 0) + 1;
      savePersist();
      updateUI();
      checkBankrupt();
      showToast('🎁 Bạn đã nhận 500🪙 cứu trợ! Chúc may mắn!', 'win');
      Sound.playWin();
    });
  }

  $('btn-stats').addEventListener('click', showStats);
  $('btn-ach').addEventListener('click', showAchievements);
  $('btn-help').addEventListener('click', () => openModal('modal-help'));
  $('btn-reset').addEventListener('click', resetAll);

  betInput.value = persist.settings.lastBet || 10;

  createDeck();
  initPlayers();
  resetRound();

  if(persist.settings.lastMode === 'dealer'){
    gameMode = 'dealer';
    $('mode-turtle').classList.remove('active');
    $('mode-dealer').classList.add('active');
    selectDealer(0);
  } else {
    gameMode = 'turtle';
    $('mode-turtle').classList.add('active');
    dealerIndex = -1;
  }

  log('🃏 Chào mừng đến với Bài Cào Rix Pro!', 'gold');
  log('🐢 Cào Rùa: nhất ăn tất. 🏦 Cào Cái: so với cái.', 'gold');
  log('👀 Bấm "Nặn bài" để lật từng lá!', 'special');
  setStatus('🎯 Chọn mode, đặt cược và chia bài!');
  updateUI();
  updateAchBadge();

  // Daily reward check
  checkDaily();
}
init();