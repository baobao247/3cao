/* ============================================================
   SOUND
============================================================ */
const Sound = {
  ctx: null,
  enabled: true,
  init(){ if(!this.ctx){ try{ this.ctx = new(window.AudioContext||window.webkitAudioContext)(); }catch(e){} } },
  _play(freq, dur, type = 'sine', vol = 0.15, startAt = null){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    const t = startAt ?? this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.linearRampToValueAtTime(0.01, t + dur);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + dur);
  },
  playCard(){ this._play(480, 0.08, 'sine', 0.2); },
  playChip(){ this._play(1350, 0.06, 'triangle', 0.18); },
  playWin(){ [523.25,659.25,783.99,1046.50].forEach((f,i)=> this._play(f, 0.22, 'sine', 0.2, this.ctx ? this.ctx.currentTime + i*0.1 : null)); },
  playShake(){ this._play(60, 0.15, 'sawtooth', 0.15); },
  playAngry(){ this._play(200, 0.2, 'square', 0.15); },
  playHappy(){ [523,659,784].forEach((f,i)=> this._play(f, 0.12, 'sine', 0.15, this.ctx ? this.ctx.currentTime + i*0.08 : null)); },
  playBaCao(){ [523,659,784,1047,784,659].forEach((f,i)=> this._play(f, 0.15, 'sine', 0.2, this.ctx ? this.ctx.currentTime + i*0.1 : null)); },
  playCharge(){
    if(!this.enabled) return;
    this.init();
    if(!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.3);
    g.gain.setValueAtTime(0.1, t);
    g.gain.linearRampToValueAtTime(0.01, t + 0.3);
    osc.connect(g); g.connect(this.ctx.destination);
    osc.start(t); osc.stop(t + 0.3);
  }
};

/* Sound resume on user click (fix Chrome autoplay) */
document.addEventListener('click', () => {
  if(Sound.ctx && Sound.ctx.state === 'suspended') Sound.ctx.resume();
});

