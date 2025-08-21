// ===== Utilities =====
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

// ===== Smooth nav & pager =====
$$('.nav-btn, .dot').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-target');
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Next/Prev arrows
$$('[data-next]').forEach(b=>b.addEventListener('click',()=>jump(+1)));
$$('[data-prev]').forEach(b=>b.addEventListener('click',()=>jump(-1)));
function jump(dir){
  const panels = $$('.panel');
  const top = window.scrollY + 2;
  const idx = panels.findIndex(p => p.offsetTop >= top - 10);
  const next = Math.min(Math.max(idx + (dir>0?1:-1), 0), panels.length-1);
  panels[next].scrollIntoView({behavior:'smooth', block:'start'});
}

// Active pager dot
function updateDots(){
  const panels = $$('.panel');
  const scrollPos = window.scrollY + window.innerHeight*0.35;
  let active = 0;
  panels.forEach((p,i)=>{ if (scrollPos >= p.offsetTop) active = i; });
  $$('.dot').forEach((d,i)=>d.classList.toggle('active', i===active));
}
window.addEventListener('scroll', updateDots);
updateDots();

// ===== Reveal on view =====
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  });
},{ threshold: .15 });
$$('.reveal').forEach(el=>io.observe(el));

// ===== Typing effect =====
(function typeEffect(){
  const el = $('.typed');
  if(!el) return;
  const texts = JSON.parse(el.getAttribute('data-text'));
  let i=0, j=0, forward=true;
  function tick(){
    const word = texts[i];
    j += forward ? 1 : -1;
    el.textContent = word.slice(0, j);
    if (forward && j === word.length){
      forward = false; setTimeout(tick, 1200); return;
    }
    if (!forward && j === 0){
      forward = true; i = (i+1)%texts.length;
    }
    setTimeout(tick, forward ? 60 : 35);
  }
  tick();
})();

// ===== Animated background (cursor-reactive particles) =====
(function particles(){
  const canvas = $('#bg-canvas');
  const ctx = canvas.getContext('2d');
  let W=canvas.width=innerWidth, H=canvas.height=innerHeight;
  const DPR = Math.min(2, window.devicePixelRatio||1);
  canvas.width = W*DPR; canvas.height = H*DPR; ctx.scale(DPR,DPR);

  const N = Math.round((W*H)/28000);
  const parts = Array.from({length:N}).map(()=> ({
    x: Math.random()*W, y: Math.random()*H,
    vx: (Math.random()-.5)*.6, vy:(Math.random()-.5)*.6,
    r: 1.2 + Math.random()*2
  }));
  const mouse = {x: W/2, y: H/2};

  window.addEventListener('resize',()=>{
    W=canvas.width=innerWidth; H=canvas.height=innerHeight;
    canvas.width = W*DPR; canvas.height = H*DPR; ctx.scale(DPR,DPR);
  });
  window.addEventListener('mousemove', e=>{ mouse.x=e.clientX; mouse.y=e.clientY; });

  function step(){
    ctx.clearRect(0,0,W,H);
    // subtle gradient
    const g = ctx.createRadialGradient(mouse.x, mouse.y, 10, mouse.x, mouse.y, 240);
    g.addColorStop(0, 'rgba(96,165,250,0.10)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    parts.forEach(p=>{
      const dx = mouse.x - p.x, dy = mouse.y - p.y;
      const d2 = Math.max(60, dx*dx + dy*dy);
      p.vx += dx / d2 * 2.0;
      p.vy += dy / d2 * 2.0;
      p.vx *= 0.96; p.vy *= 0.96;
      p.x += p.vx; p.y += p.vy;
      if(p.x<0||p.x>W) p.vx*=-1;
      if(p.y<0||p.y>H) p.vy*=-1;
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.fill();
    });

    // connecting lines
    for (let i=0;i<parts.length;i++){
      for (let j=i+1;j<parts.length;j++){
        const a=parts[i], b=parts[j];
        const dx=a.x-b.x, dy=a.y-b.y, d=dx*dx+dy*dy;
        if (d<9000){
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle = 'rgba(148,163,184,'+(1 - d/9000)+')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(step);
  }
  step();
})();

// ===== File uploads (Profile, Certs, Resume) =====
function loadImageTo(imgEl, file){
  const reader = new FileReader();
  reader.onload = e => { imgEl.src = e.target.result; };
  reader.readAsDataURL(file);
}

$('#profileUpload')?.addEventListener('change', (e)=>{
  const f = e.target.files?.[0];
  if (f) loadImageTo($('#profileImg'), f);
});

$('#resumeUpload')?.addEventListener('change', (e)=>{
  const f = e.target.files?.[0];
  if (f) {
    loadImageTo($('#resumeImg'), f);
    $('#downloadResume').href = URL.createObjectURL(f);
    $('#downloadResume').download = f.name || 'resume.png';
  }
});

$('#certUpload')?.addEventListener('change', (e)=>{
  const files = Array.from(e.target.files || []);
  const gal = $('#certGallery');
  gal.innerHTML = '';
  files.forEach(f=>{
    const img = document.createElement('img');
    img.alt = 'Certification image';
    gal.appendChild(img);
    loadImageTo(img, f);
  });
});

// ===== Contact form (no back-end: simulate send) =====
$('#contactForm')?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target).entries());
  const msg = `Thanks, ${data.name}! Your message has been saved locally.`;
  // Save to localStorage for demo
  const all = JSON.parse(localStorage.getItem('messages')||'[]');
  all.push({...data, ts: Date.now()});
  localStorage.setItem('messages', JSON.stringify(all));
  $('#formMsg').textContent = msg;
  e.target.reset();
});

// ===== Theme Toggle =====
$('#themeToggle')?.addEventListener('click', ()=>{
  const root = document.documentElement;
  const isLight = root.classList.toggle('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
});
(function initTheme(){
  const t = localStorage.getItem('theme');
  if (t==='light') document.documentElement.classList.add('light');
})();

// Year
$('#year').textContent = new Date().getFullYear();
