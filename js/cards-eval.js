/* ============================================================
   DECK
============================================================ */
function createDeck(){
  const suits = ['♠','♥','♦','♣'];
  const rankNames = {1:'A',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',10:'10',11:'J',12:'Q',13:'K'};
  deck = [];
  for(const s of suits) for(let r = 1; r <= 13; r++) deck.push({suit:s, rank:r, name:rankNames[r]});
  deck = shuffleArray(deck);
}
function create3DCardElement(card, isFaceUp = false, glow = ''){
  const c = document.createElement('div');
  c.className = `card-container ${isFaceUp ? 'flipped' : ''}`;
  if(glow) c.classList.add(glow);
  const isRed = card.suit === '♥' || card.suit === '♦';
  c.innerHTML = `
    <div class="card-inner">
      <div class="card-back"></div>
      <div class="card-front ${isRed ? 'red' : 'black'}">
        <div>${card.name}</div>
        <div class="suit">${card.suit}</div>
      </div>
    </div>`;
  return c;
}
function renderAllCards(forceReveal = false){
  players.forEach((p, i) => {
    const cc = $(`cards-${i}`);
    cc.innerHTML = '';
    if(p.hand && p.hand.length > 0){
      const isHuman = p.isHuman;
      const showAll = forceReveal || gameState === 'SHOWDOWN' || (isHuman && myCardsRevealed) || (isHuman && cardsFlippedManually);
      p.hand.forEach((c, idx) => {
        let isFlipped = showAll;
        if(isNanning && isHuman && gameState === 'DEALING' && !cardsFlippedManually){
          isFlipped = idx < nanningPhase;
        }
        const el = create3DCardElement(c, isFlipped);
        if(isNanning && isHuman && gameState === 'DEALING'){
          el.classList.add('nan-card');
          el.style.transitionDelay = (idx * 0.15) + 's';
          if(idx === nanningPhase) el.classList.add('nanning');
        }
        cc.appendChild(el);
        if(isHuman){
          if(!playerCardElements[i]) playerCardElements[i] = [];
          playerCardElements[i][idx] = el;
        }
      });
    }
    const seat = $(`seat-${i}`);
    seat.classList.remove('winner','dealer');
    if(roundWinners.some(w => w.index === i)) seat.classList.add('winner');
    if(dealerIndex === i) seat.classList.add('dealer');
  });
}
function updatePot(animate = false){
  const el = $('pot-display');
  el.innerHTML = `🪙 TIỀN GIỮA: ${fmt(pot)}`;
  if(animate){
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
}
function updateUI(){
  updatePot(false);
  const totalChips = players.reduce((s, p) => s + p.chips, 0) || 1;
  players.forEach((p, i) => {
    $(`name-${i}`).innerText = p.name;
    $(`chips-${i}`).innerText = fmt(p.chips);
    const bar = $(`chipbar-${i}`);
    if(bar){
      const pct = Math.min(100, Math.max(3, (p.chips / totalChips) * 100));
      bar.style.width = pct + '%';
    }
  });
  const isIdle = gameState === 'IDLE';
  const isBetting = gameState === 'BETTING';
  const isDealing = gameState === 'DEALING';
  const isShowdown = gameState === 'SHOWDOWN';
  const canNan = isDealing && !isShowdown && !isNanning && nanningPhase < 3 && !cardsFlippedManually;
  const canFlipAll = isDealing && !isShowdown && !isNanning && !cardsFlippedManually && nanningPhase < 3;
  const canShowdown = isDealing && !isNanning && (nanningPhase >= 3 || cardsFlippedManually);

  $('btn-bet').disabled = !(isIdle || isBetting);
  if(gameMode === 'dealer' && dealerIndex === 0){
    $('btn-bet').textContent = 'Mở cược (Nhà cái)';
  } else {
    $('btn-bet').textContent = 'Đặt cược';
  }
  checkBankrupt();
  $('btn-deal').disabled = !isBetting;
  $('btn-peek').disabled = !canNan;
  $('btn-flip-all').disabled = !canFlipAll;
  $('btn-showdown').disabled = !canShowdown;
  $('btn-next').style.display = isShowdown ? 'block' : 'none';

  if(isDealing && nanningPhase === 2 && (expectedRanks.length > 0 || expectedType === 'ba_cao') && !cardsFlippedManually){
    chargeEffect.classList.add('active');
    if(!chargeEffect.dataset.charged){
      Sound.playCharge();
      chargeEffect.dataset.charged = 'true';
    }
  } else {
    chargeEffect.classList.remove('active');
    delete chargeEffect.dataset.charged;
  }
}



/* ============================================================
   SCORING
============================================================ */
function calcScore(hand){
  if(!hand || hand.length !== 3) return {score:0,isBaCao:false};
  const allFace = hand.every(c => c.rank >= 11 && c.rank <= 13);
  if(allFace) return {score:10,isBaCao:true};
  let total = 0;
  hand.forEach(c => {
    if(c.rank === 1) total += 1;
    else if(c.rank >= 11) total += 10;
    else total += c.rank;
  });
  return {score: total % 10, isBaCao:false};
}
function compareHands(hA, hB){
  const a = calcScore(hA), b = calcScore(hB);
  if(a.isBaCao && b.isBaCao) return 0;
  if(a.isBaCao) return 1;
  if(b.isBaCao) return -1;
  if(a.score > b.score) return 1;
  if(a.score < b.score) return -1;
  return 0;
}

