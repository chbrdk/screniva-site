import { ScrenivaSite } from './config.js';

for (const id of ['download-mac', 'download-mac-footer']) {
  document.getElementById(id).href = ScrenivaSite.downloadMac;
}
document.getElementById('year').textContent = new Date().getFullYear();

const play = document.getElementById('play');
const seek = document.getElementById('seek');
const stage = document.querySelector('.preview-stage');
const demoWindow = document.querySelector('.demo-window');
const caption = document.getElementById('demo-caption');
const zoomBadge = document.getElementById('zoom-badge');
const scenes = [...document.querySelectorAll('[data-scene]')];
const content = [
  { title: 'Hello,<br /><em>momentum.</em>', description: 'Ein guter Tag beginnt mit einer klaren Idee.', caption: 'Aus einer guten Idee wird eine klare Geschichte.' },
  { title: 'Deine Idee.<br /><em>Im Fokus.</em>', description: 'Alles Wichtige. Genau dort, wo du es brauchst.', caption: 'Zeig das Detail, das den Unterschied macht.' },
  { title: 'Let’s<br /><em>make it.</em>', description: 'Der nächste Schritt gehört dir.', caption: 'Und jetzt: Bühne frei für deine Geschichte.' },
];
let playing = false;
let position = 0;
let lastFrame = 0;
let frame;
let activeScene = -1;
let zoomEnabled = true;

function render() {
  seek.value = position;
  const selected = Math.min(2, Math.floor(position / 8));
  if (activeScene !== selected) {
    activeScene = selected;
    document.getElementById('demo-title').innerHTML = content[selected].title;
    document.getElementById('demo-description').textContent = content[selected].description;
    caption.textContent = content[selected].caption;
    scenes.forEach((button, index) => {
      button.classList.toggle('selected', index === selected);
      button.setAttribute('aria-pressed', String(index === selected));
    });
  }
  const tracks = document.querySelector('.tracks');
  const offset = document.querySelector('.clip-track').offsetLeft;
  document.getElementById('playhead').style.left = `${offset + (tracks.clientWidth - offset) * position / 24}px`;
  document.getElementById('timecode').innerHTML = `00:${String(Math.floor(position)).padStart(2, '0')} <span class="muted">/ 00:24</span>`;
  demoWindow.style.transform = zoomEnabled && selected === 1 ? 'scale(1.12)' : 'scale(1)';
}
function stop() {
  playing = false;
  cancelAnimationFrame(frame);
  play.setAttribute('aria-label', 'Produktvorschau abspielen');
  document.getElementById('play-icon').textContent = '▶';
}
function tick(now) {
  if (!playing) return;
  if (lastFrame) position = Math.min(24, position + (now - lastFrame) / 1000);
  lastFrame = now;
  render();
  if (position >= 24) stop();
  else frame = requestAnimationFrame(tick);
}
play.addEventListener('click', () => {
  if (playing) return stop();
  if (position >= 24) position = 0;
  playing = true;
  lastFrame = 0;
  play.setAttribute('aria-label', 'Produktvorschau pausieren');
  document.getElementById('play-icon').textContent = 'Ⅱ';
  frame = requestAnimationFrame(tick);
});
seek.addEventListener('input', () => { position = Number(seek.value); render(); });
scenes.forEach(button => button.addEventListener('click', () => { position = Number(button.dataset.scene) * 8; render(); }));
document.querySelectorAll('[data-look]').forEach(button => button.addEventListener('click', () => {
  const backgrounds = { blue: 'linear-gradient(125deg,#126cfa,#373ac8 57%,#b757b0)', pink: 'linear-gradient(125deg,#f9468d,#7934bd)', ink: '#0b1026' };
  stage.style.background = backgrounds[button.dataset.look];
  document.querySelectorAll('[data-look]').forEach(swatch => {
    const active = swatch === button;
    swatch.classList.toggle('active', active);
    swatch.setAttribute('aria-pressed', String(active));
  });
}));
document.getElementById('frame-space').addEventListener('input', event => {
  stage.style.padding = `${event.target.value}px`;
  document.getElementById('space-value').textContent = event.target.value;
});
for (const id of ['zoom-toggle', 'caption-toggle']) {
  document.getElementById(id).addEventListener('click', event => {
    const button = event.currentTarget;
    const enabled = button.getAttribute('aria-checked') !== 'true';
    button.setAttribute('aria-checked', String(enabled));
    button.classList.toggle('on', enabled);
    if (id === 'caption-toggle') caption.hidden = !enabled;
    else { zoomEnabled = enabled; zoomBadge.hidden = !enabled; render(); }
  });
}
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
window.addEventListener('resize', render);
render();

// Product illustration only: no camera permissions or user media needed.
const pipCanvas = document.getElementById('pip-canvas');
const pipPerson = document.getElementById('pip-person');
const pipSize = document.getElementById('pip-size');
let pipPosition = 'br';
function renderPip() {
  const size = Number(pipSize.value);
  const heightPercent = size * pipCanvas.clientWidth / pipCanvas.clientHeight;
  pipPerson.style.width = `${size}%`;
  pipPerson.style.left = `${pipPosition.endsWith('r') ? 96 - size : 4}%`;
  pipPerson.style.top = `${pipPosition.startsWith('b') ? 94 - heightPercent : 6}%`;
  document.getElementById('pip-size-value').textContent = `${size} %`;
}
document.querySelectorAll('[data-pip-position]').forEach(button => {
  button.addEventListener('click', () => {
    pipPosition = button.dataset.pipPosition;
    document.querySelectorAll('[data-pip-position]').forEach(option => option.setAttribute('aria-pressed', String(option === button)));
    renderPip();
  });
});
pipSize.addEventListener('input', renderPip);
document.getElementById('pip-round').addEventListener('click', event => {
  const rounded = pipPerson.classList.toggle('round');
  event.currentTarget.setAttribute('aria-pressed', String(rounded));
});
window.addEventListener('resize', renderPip);
renderPip();

// A direct language switch shows the result of an SRT translation round-trip.
// These are prepared example translations, not live machine translation.
const subtitleSamples = {
  de: ['Alles beginnt mit einer Idee.', 'Mach daraus deinen nächsten großen Schritt.', 'Und zeig der Welt, was du vorhast.'],
  en: ['Everything starts with an idea.', 'Turn it into your next big step.', 'And show the world what you have in mind.'],
  fr: ['Tout commence par une idée.', 'Fais-en ta prochaine grande étape.', 'Et montre au monde ce que tu prépares.'],
};
const sub = id => document.getElementById(`subtitle-${id}`);
let subtitlePosition = 0, subtitlePlaying = false, subtitleFrame, subtitleLastFrame = 0;
let subtitleLocale = 'de';
const subtitleSlideCopy = [
  ['01 / DIE IDEE', 'Alles beginnt\nmit einer Idee.', 'Gib ihr einen Ort, an dem sie wachsen kann.'],
  ['02 / DER NÄCHSTE SCHRITT', 'Aus Gedanken\nwird ein Plan.', 'Ein Schritt nach dem anderen. In deinem Tempo.'],
  ['03 / DEIN MOMENT', 'Bereit, etwas\nzu bewegen.', 'Deine Geschichte wartet auf ihr Publikum.'],
];
function subtitleClock(seconds) {
  const value = Math.floor(seconds);
  return `${value >= 3600 ? `${Math.floor(value / 3600)}:` : ''}${String(Math.floor(value / 60) % 60).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}
function renderSubtitles() {
  const index = Math.min(2, Math.floor(subtitlePosition / 4));
  sub('seek').value = subtitlePosition;
  sub('time').textContent = `${subtitleClock(subtitlePosition)} / 00:12`;
  sub('overlay').textContent = subtitleSamples[subtitleLocale][index];
  sub('slide-kicker').textContent = subtitleSlideCopy[index][0];
  sub('slide-title').textContent = subtitleSlideCopy[index][1];
  sub('slide-detail').textContent = subtitleSlideCopy[index][2];
  sub('language').textContent = `${subtitleLocale.toUpperCase()} · UNTERTITEL`;
  sub('cues').querySelectorAll('button').forEach((button,i) => {
    button.setAttribute('aria-current', String(index === i));
    button.querySelector('.subtitle-cue-text').textContent = subtitleSamples[subtitleLocale][i];
  });
}
for (let i=0; i<3; i++) {
  const button = document.createElement('button');
  button.type='button';button.className='subtitle-cue';
  const time = document.createElement('time');time.textContent=`${subtitleClock(i*4)} – ${subtitleClock((i+1)*4)}`;
  const text = document.createElement('span');text.className='subtitle-cue-text';
  button.append(time,text);
  button.addEventListener('click',()=>{subtitlePosition=i*4;renderSubtitles();});
  sub('cues').append(button);
}
document.querySelectorAll('[data-subtitle-language]').forEach(button=>button.addEventListener('click',()=>{
  subtitleLocale=button.dataset.subtitleLanguage;
  document.querySelectorAll('[data-subtitle-language]').forEach(option=>option.setAttribute('aria-pressed',String(option===button)));
  sub('overlay').lang=subtitleLocale;sub('cues').lang=subtitleLocale;
  renderSubtitles();
}));
function stopSubtitles(){subtitlePlaying=false;cancelAnimationFrame(subtitleFrame);sub('play').textContent='▶';sub('play').setAttribute('aria-label','Untertitel-Vorschau abspielen');}
function subtitleTick(now){if(!subtitlePlaying)return;if(subtitleLastFrame)subtitlePosition=Math.min(12,subtitlePosition+(now-subtitleLastFrame)/1000);subtitleLastFrame=now;renderSubtitles();if(subtitlePosition>=12)stopSubtitles();else subtitleFrame=requestAnimationFrame(subtitleTick);}
sub('play').addEventListener('click',()=>{if(subtitlePlaying)return stopSubtitles();if(subtitlePosition>=12)subtitlePosition=0;subtitlePlaying=true;subtitleLastFrame=0;sub('play').textContent='Ⅱ';sub('play').setAttribute('aria-label','Untertitel-Vorschau pausieren');subtitleFrame=requestAnimationFrame(subtitleTick);});
sub('seek').addEventListener('input',()=>{subtitlePosition=Number(sub('seek').value);renderSubtitles();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopSubtitles();});
renderSubtitles();

// A self-playing chapter-to-export story, suspended outside the viewport.
const el = id => document.getElementById(id);
const story = el('story-loop');
const storyMotion = matchMedia('(prefers-reduced-motion: reduce)');
let storyPaused = storyMotion.matches;
let storyVisible = false;
let storyElapsed = storyPaused ? 11500 : 0;
let storyFrame = 0, storyLast = 0;
const storyTitles = ['Die Idee.', 'So geht’s.', 'Dein nächster Schritt.'];
const storyCopies = ['Jede Geschichte braucht einen Anfang.', 'Zeig den Moment, auf den es ankommt.', 'Gib deinem Publikum einen klaren nächsten Schritt.'];
function renderStory() {
  const seconds = storyElapsed / 1000;
  const count = seconds < 2 ? 0 : seconds < 4.2 ? 1 : seconds < 6.4 ? 2 : 3;
  const exporting = seconds >= 8.8;
  story.dataset.phase = exporting ? 'export' : count ? 'chapters' : 'start';
  document.querySelectorAll('[data-story-marker]').forEach((item,index)=>item.classList.toggle('visible',index<count));
  document.querySelectorAll('[data-story-row]').forEach((item,index)=>item.classList.toggle('visible',index<count));
  el('story-marker-count').textContent=`${count} / 3`;
  el('story-export').classList.toggle('ready',exporting);
  const index=Math.max(0,count-1);
  el('story-film-kicker').textContent=count?`KAPITEL ${String(count).padStart(2,'0')}`:'DEINE PRODUKTDEMO';
  el('story-film-title').textContent=count?storyTitles[index]:'Eine Idee.\nEine Geschichte.';
  el('story-film-copy').textContent=count?storyCopies[index]:'Vom ersten Gedanken bis zum nächsten Schritt.';
  const playhead = seconds < 2 ? 0 : seconds < 4.2 ? (seconds-2)/2.2*26.667 : seconds < 6.4 ? 26.667+(seconds-4.2)/2.2*53.333 : Math.min(100,80+(seconds-6.4)/2.4*20);
  el('story-playhead').style.left=`${playhead}%`;
  el('story-loop-progress').style.transform=`scaleX(${storyElapsed/15000})`;
  const step=exporting?2:count===3?1:0;
  document.querySelectorAll('[data-story-step]').forEach((item,index)=>item.classList.toggle('active',index===step));
  el('story-loop-caption').textContent=exporting?'Video + Kapiteltext. Alles bereit.':count===3?'Die Struktur steht.':count?`Kapitel ${count} bekommt seinen Platz.`:'Eine Geschichte beginnt.';
}
function storyTick(now){
  if(storyPaused||!storyVisible||document.hidden){storyLast=0;return;}
  if(storyLast)storyElapsed=(storyElapsed+now-storyLast)%15000;
  storyLast=now;renderStory();storyFrame=requestAnimationFrame(storyTick);
}
function scheduleStory(){cancelAnimationFrame(storyFrame);storyLast=0;if(!storyPaused&&storyVisible&&!document.hidden)storyFrame=requestAnimationFrame(storyTick);}
function storyPauseLabel(){el('story-loop-pause').setAttribute('aria-label',storyPaused?'Kapitel-Animation abspielen':'Kapitel-Animation pausieren');el('story-loop-pause').textContent=storyPaused?'▶ Abspielen':'Ⅱ Pause';}
el('story-loop-pause').addEventListener('click',()=>{storyPaused=!storyPaused;storyPauseLabel();scheduleStory();});
new IntersectionObserver(entries=>{storyVisible=entries[0].isIntersecting;scheduleStory();},{threshold:0.12}).observe(story);
document.addEventListener('visibilitychange',scheduleStory);
storyMotion.addEventListener('change',event=>{storyPaused=event.matches;if(event.matches)storyElapsed=11500;renderStory();storyPauseLabel();scheduleStory();});
renderStory();storyPauseLabel();

// Repeating feature studies; direct switches pause at the chosen state.
function createFeatureLoop({surface,toggle,pause,label,duration,activeFrom,activeUntil,render}) {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let paused=motion.matches, visible=false, elapsed=motion.matches?activeFrom+500:0;
  let frame=0,last=0,lastDraw=-Infinity,active=motion.matches;
  function draw(){
    render(active,elapsed,!paused);
    el(toggle).setAttribute('aria-pressed',String(active));
  }
  function pauseLabel(){el(pause).textContent=paused?'▶ Abspielen':'Ⅱ Pause';el(pause).setAttribute('aria-label',`${label}-Animation ${paused?'abspielen':'pausieren'}`);}
  function tick(now){
    if(paused||!visible||document.hidden){last=0;return;}
    if(last)elapsed=(elapsed+now-last)%duration;
    last=now;
    if(now-lastDraw>80){active=elapsed>=activeFrom&&elapsed<activeUntil;draw();lastDraw=now;}
    frame=requestAnimationFrame(tick);
  }
  function schedule(){cancelAnimationFrame(frame);last=0;lastDraw=-Infinity;if(!paused&&visible&&!document.hidden)frame=requestAnimationFrame(tick);}
  el(pause).addEventListener('click',()=>{paused=!paused;pauseLabel();schedule();});
  el(toggle).addEventListener('click',()=>{active=!active;elapsed=active?activeFrom+500:0;paused=true;draw();pauseLabel();schedule();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.25}).observe(el(surface));
  document.addEventListener('visibilitychange',schedule);
  motion.addEventListener('change',event=>{paused=event.matches;if(paused){elapsed=activeFrom+500;active=true;draw();}pauseLabel();schedule();});
  draw();pauseLabel();
}
const duckVoiceBars=[...document.querySelectorAll('.duck-voice i')];
const duckMusicBars=[...document.querySelectorAll('.duck-music i')];
createFeatureLoop({surface:'duck-demo',toggle:'duck-toggle',pause:'duck-pause',label:'Ducking',duration:7200,activeFrom:1700,activeUntil:5400,render(active,elapsed,moving){
  el('duck-demo').classList.toggle('duck-on',active);
  el('duck-toggle').querySelector('span').textContent=active?'Stimme da · Musik wird leiser':'Sprechpause · Musik kommt zurück';
  const time=moving?elapsed/240:3;
  duckVoiceBars.forEach((bar,index)=>{bar.style.height=`${active?10+Math.abs(Math.sin(time+index*1.7))*26:3}px`;});
  duckMusicBars.forEach((bar,index)=>{bar.style.height=`${(active?4:18)+Math.abs(Math.sin(time*.65+index*1.2))*(active?4:16)}px`;});
}});
createFeatureLoop({surface:'privacy-value',toggle:'privacy-toggle',pause:'privacy-pause',label:'Blur',duration:6600,activeFrom:1600,activeUntil:4900,render(active){
  el('privacy-value').classList.toggle('concealed',active);
  el('privacy-value').closest('.privacy-example').classList.toggle('blur-active',active);
  el('privacy-toggle').querySelector('span').textContent=active?'Blur aktiv · Bereich verdeckt':'Original · Bereich sichtbar';
}});

// Three complete visual treatments, with optional direct selection.
const designMotion = matchMedia('(prefers-reduced-motion: reduce)');
let designIndex = 0, designElapsed = 0, designLast = 0, designFrame = 0;
let designPaused = designMotion.matches, designVisible = false;
function showDesign(index) {
  designIndex=index;
  document.querySelectorAll('[data-design-sample]').forEach((sample,i)=>{sample.classList.toggle('active',i===index);sample.setAttribute('aria-hidden',String(i!==index));});
  document.querySelectorAll('[data-design-select]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
}
function designTick(now){
  if(designPaused||!designVisible||document.hidden){designLast=0;return;}
  if(designLast)designElapsed+=now-designLast;
  designLast=now;
  if(designElapsed>=4500){designElapsed%=4500;showDesign((designIndex+1)%3);}
  el('design-progress').style.transform=`scaleX(${designElapsed/4500})`;
  designFrame=requestAnimationFrame(designTick);
}
function scheduleDesign(){cancelAnimationFrame(designFrame);designLast=0;if(!designPaused&&designVisible&&!document.hidden)designFrame=requestAnimationFrame(designTick);}
function designPauseLabel(){el('design-pause').textContent=designPaused?'▶ Abspielen':'Ⅱ Pause';el('design-pause').setAttribute('aria-label',designPaused?'Design-Animation abspielen':'Design-Animation pausieren');}
document.querySelectorAll('[data-design-select]').forEach(button=>button.addEventListener('click',()=>{showDesign(Number(button.dataset.designSelect));designElapsed=0;el('design-progress').style.transform='scaleX(0)';scheduleDesign();}));
el('design-pause').addEventListener('click',()=>{designPaused=!designPaused;designPauseLabel();scheduleDesign();});
new IntersectionObserver(entries=>{designVisible=entries[0].isIntersecting;scheduleDesign();},{threshold:.25}).observe(el('design-preview'));
designMotion.addEventListener('change',event=>{designPaused=event.matches;designPauseLabel();scheduleDesign();});
document.addEventListener('visibilitychange',scheduleDesign);
showDesign(0);designPauseLabel();

const finishGallery=el('finish-gallery');
function galleryNav(){const max=finishGallery.scrollWidth-finishGallery.clientWidth;el('finish-prev').disabled=finishGallery.scrollLeft<4;el('finish-next').disabled=finishGallery.scrollLeft>=max-4;}
for(const [id,direction] of [['finish-prev',-1],['finish-next',1]])el(id).addEventListener('click',()=>{finishGallery.scrollBy({left:direction*(finishGallery.querySelector('.finish-card').getBoundingClientRect().width+14),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});});
finishGallery.addEventListener('scroll',galleryNav,{passive:true});window.addEventListener('resize',galleryNav);galleryNav();

// Premiere handoff: the finished Screniva cut becomes an editable sequence.
const premiereDemo=el('premiere-demo');
if(premiereDemo){
  const premiereMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const premiereDuration=13000;
  let premiereElapsed=premiereMotion.matches?11500:0;
  let premiereLast=0;
  let premiereFrame=0;
  let premiereVisible=false;
  let premierePaused=premiereMotion.matches;
  let premierePhase='';

  function setPremierePhase(phase){
    if(phase===premierePhase)return;
    premierePhase=phase;
    premiereDemo.dataset.phase=phase;
    const labels={screniva:'Projekt bereit',export:'Premiere-Paket wird erstellt',import:'Sequenz wird aufgebaut',done:'Bereit zum Weiterarbeiten'};
    el('premiere-status').textContent=labels[phase];
  }
  function drawPremiere(){
    const point=premiereElapsed/premiereDuration;
    setPremierePhase(point<.2?'screniva':point<.43?'export':point<.72?'import':'done');
    premiereDemo.querySelector('.premiere-progress i').style.transform=`scaleX(${point})`;
  }
  function premiereTick(now){
    if(premierePaused||!premiereVisible||document.hidden){premiereLast=0;return;}
    if(premiereLast)premiereElapsed+=now-premiereLast;
    premiereLast=now;
    if(premiereElapsed>=premiereDuration)premiereElapsed%=premiereDuration;
    drawPremiere();
    premiereFrame=requestAnimationFrame(premiereTick);
  }
  function schedulePremiere(){
    cancelAnimationFrame(premiereFrame);
    premiereLast=0;
    if(!premierePaused&&premiereVisible&&!document.hidden)premiereFrame=requestAnimationFrame(premiereTick);
  }
  function updatePremierePause(){
    const button=el('premiere-pause');
    button.setAttribute('aria-pressed',String(premierePaused));
    button.setAttribute('aria-label',premierePaused?'Animation abspielen':'Animation pausieren');
  }
  el('premiere-pause').addEventListener('click',()=>{premierePaused=!premierePaused;updatePremierePause();schedulePremiere();});
  new IntersectionObserver(entries=>{premiereVisible=entries[0].isIntersecting;schedulePremiere();},{threshold:.18}).observe(premiereDemo);
  premiereMotion.addEventListener('change',event=>{premierePaused=event.matches;if(event.matches)premiereElapsed=11500;updatePremierePause();drawPremiere();schedulePremiere();});
  document.addEventListener('visibilitychange',schedulePremiere);
  drawPremiere();
  updatePremierePause();
}

// Responsive section menu with a scroll-aware active state.
const siteHeader=el('site-header');
const navToggle=el('nav-toggle');
const primaryNav=el('primary-nav');
if(siteHeader&&navToggle&&primaryNav){
  const navLinks=[...primaryNav.querySelectorAll('[data-nav-link]')];
  const navSections=navLinks.map(link=>document.querySelector(link.getAttribute('href'))).filter(Boolean);
  function closeNavigation(){
    siteHeader.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded','false');
    navToggle.setAttribute('aria-label','Menü öffnen');
  }
  navToggle.addEventListener('click',()=>{
    const open=!siteHeader.classList.contains('nav-open');
    siteHeader.classList.toggle('nav-open',open);
    navToggle.setAttribute('aria-expanded',String(open));
    navToggle.setAttribute('aria-label',open?'Menü schließen':'Menü öffnen');
  });
  primaryNav.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const hash=link.getAttribute('href');
    const target=document.querySelector(hash);
    if(target){
      event.preventDefault();
      const farAway=Math.abs(target.getBoundingClientRect().top)>innerHeight*2;
      target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches||farAway?'instant':'smooth',block:'start'});
      if(location.hash!==hash)history.pushState(null,'',hash);
    }
    closeNavigation();
  }));
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeNavigation();});
  document.addEventListener('click',event=>{if(!siteHeader.contains(event.target))closeNavigation();});
  matchMedia('(min-width: 1021px)').addEventListener('change',event=>{if(event.matches)closeNavigation();});
  const sectionObserver=new IntersectionObserver(entries=>{
    const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if(!visible)return;
    navLinks.forEach(link=>link.setAttribute('aria-current',String(link.getAttribute('href')===`#${visible.target.id}`)));
  },{rootMargin:'-20% 0px -58% 0px',threshold:[0,.15,.35,.6]});
  navSections.forEach(section=>sectionObserver.observe(section));
}
