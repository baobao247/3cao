/* ============================================================
   INTERACTIVE DRAG SQUEEZE (NẶN BÀI THẬT)
============================================================ */
function openInteractiveNan(card, cardEl){
  const modal = $('modal-nan');
  const cover = $('nan-cover');
  const face = $('nan-face');
  const rankTop = $('nan-rank-top');
  const suitMid = $('nan-suit-mid');
  const rankBot = $('nan-rank-bot');

  const rankStr = getRankName(card.rank);
  rankTop.textContent = rankStr;
  rankBot.textContent = rankStr;
  suitMid.textContent = card.suit.symbol;
  face.className = 'nan-face ' + (card.suit.color === 'red' ? 'red' : 'black');

  cover.style.transform = 'translate(0px, 0px)';
  modal.classList.add('open');

  let startX = 0, startY = 0, currentX = 0, currentY = 0, isDragging = false;

  const onPointerDown = e => {
    isDragging = true;
    startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    cover.style.transition = 'none';
  };

  const onPointerMove = e => {
    if(!isDragging) return;
    const clientX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    currentX = clientX - startX;
    currentY = clientY - startY;
    cover.style.transform = `translate(${currentX}px, ${currentY}px)`;
    const dist = Math.hypot(currentX, currentY);
    if(dist > 140){
      finishNan();
    }
  };

  const onPointerUp = () => {
    if(!isDragging) return;
    isDragging = false;
    const dist = Math.hypot(currentX, currentY);
    if(dist > 115){
      finishNan();
    } else {
      cover.style.transition = 'transform 0.22s ease-out';
      cover.style.transform = 'translate(0px, 0px)';
      currentX = 0; currentY = 0;
    }
  };

  const finishNan = async () => {
    isDragging = false;
    cover.removeEventListener('mousedown', onPointerDown);
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    cover.removeEventListener('touchstart', onPointerDown);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
    cover.removeEventListener('touchstart', onPointerDown);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
    $('btn-quick-nan').onclick = null;

    modal.classList.remove('open');
    cardEl.classList.remove('nanning');
    cardEl.classList.add('flipped');
    Sound.playCard();
    vibrate(30);
    nanningPhase = 3;
    evaluateThirdCard();
  };

  cover.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);
  cover.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);
  $('btn-quick-nan').onclick = finishNan;
}

function evaluateThirdCard(){
  chargeEffect.classList.remove('active');
  delete chargeEffect.dataset.charged;
  const score = calcScore(players[0].hand);
  const allCards = playerCardElements[0] || [];

  let isHit = false;
  if(score.isBaCao) isHit = true;
  else if(expectedType === 'nut9' && score.score === 9) isHit = true;

  if(score.isBaCao){
    Sound.playBaCao();
    vibrate([100, 50, 100, 50, 200]);
    setStatus('🎉 BA CÀO! BẤT BẠI!');
    log('🎉 BA CÀO! BẠN CÓ BA CÀO!', 'winner');
    showSpeech(0, '🎉 BA CÀO!');
    allCards.forEach(el => el.classList.add('glow-rainbow'));
    createFireworks(0);
    createConfetti(60);
    $('poker-table').classList.add('shake');
    Sound.playShake();
    setTimeout(() => $('poker-table').classList.remove('shake'), 400);
    persist.stats.baCaoCount++;
  } else if(isHit && score.score === 9){
    Sound.playWin();
    vibrate([60, 40, 60]);
    setStatus('🔥 9 NÚT! SIÊU ĐỈNH!');
    log('🔥 9 NÚT! CỰC MẠNH!', 'winner');
    showSpeech(0, '🔥 9 NÚT!');
    allCards.forEach(el => el.classList.add('glow-gold'));
    createFireworks(0);
    createConfetti(40);
    persist.stats.nineNutCount++;
  } else if(score.score >= 8){
    Sound.playHappy();
    vibrate(50);
    setStatus(`✨ ${score.score} NÚT! RẤT TỐT!`);
    log(`✨ Bạn có ${score.score} nút!`, 'gold');
    showSpeech(0, `✨ ${score.score} NÚT`);
    allCards.forEach(el => el.classList.add('glow-gold'));
    createFireworks(0);
  } else if(score.score >= 6){
    Sound.playCard();
    setStatus(`👍 ${score.score} NÚT.`);
    showSpeech(0, `👍 ${score.score} NÚT`);
    allCards.forEach(el => el.classList.add('glow-blue'));
  } else if(score.score >= 4){
    Sound.playCard();
    setStatus(`😐 ${score.score} NÚT.`);
    showSpeech(0, `😐 ${score.score} NÚT`);
    allCards.forEach(el => el.classList.add('glow-blue'));
  } else {
    Sound.playAngry();
    vibrate([100, 50, 100]);
    setStatus(`😢 ${score.score} NÚT!`);
    log(`😢 Bạn có ${score.score} nút.`, 'alert');
    showSpeech(0, `😢 ${score.score} NÚT`);
    allCards.forEach(el => el.classList.add('glow-red'));
    $('poker-table').classList.add('shake');
    setTimeout(() => $('poker-table').classList.remove('shake'), 300);
  }
  myCardsRevealed = true;
  isNanning = false;
  $('btn-peek').disabled = true;
  $('btn-flip-all').disabled = true;
  $('btn-showdown').disabled = false;
  updateUI();
}

