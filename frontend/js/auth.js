// Electric Particle Background Animation
const canvas = document.getElementById('energyCanvas');
const ctx = canvas.getContext('2d');

let particles = [];
const particleCount = 45;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class ElectricParticle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.6;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.speedY = (Math.random() - 0.5) * 0.8;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.color = Math.random() > 0.3 ? '0, 240, 255' : '0, 255, 136'; // Cyan or Emerald
  }

  update() {
    this.x += this.speedX;
    this.y += this.speedY;

    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
    ctx.shadowBlur = 10;
    ctx.shadowColor = `rgb(${this.color})`;
    ctx.fill();
  }
}

for (let i = 0; i < particleCount; i++) {
  particles.push(new ElectricParticle());
}

function connectNodes() {
  const maxDistance = 140;
  for (let a = 0; a < particles.length; a++) {
    for (let b = a + 1; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < maxDistance) {
        const alpha = (1 - dist / maxDistance) * 0.2;
        ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
  }
}

// Electric Lightning Arc Discharge Generator
let lightningBranches = [];

function createLightning(x1, y1, x2, y2, displacement, iteration) {
  if (iteration === 0) {
    lightningBranches.push({ x1, y1, x2, y2 });
    return;
  }
  const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * displacement;
  const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * displacement;
  createLightning(x1, y1, midX, midY, displacement / 1.8, iteration - 1);
  createLightning(midX, midY, x2, y2, displacement / 1.8, iteration - 1);
}

function triggerLightningPulse() {
  lightningBranches = [];
  const startX = Math.random() * canvas.width;
  const startY = Math.random() * (canvas.height * 0.35);
  const endX = startX + (Math.random() - 0.5) * 350;
  const endY = startY + Math.random() * 250 + 80;
  createLightning(startX, startY, endX, endY, 50, 4);
  setTimeout(() => { lightningBranches = []; }, 150);
}

// Trigger periodic atmospheric lightning across the electric city skyline
setInterval(() => {
  if (Math.random() > 0.4) {
    triggerLightningPulse();
  }
}, 4500);

function drawLightning() {
  if (lightningBranches.length === 0) return;
  ctx.save();
  ctx.shadowBlur = 18;
  ctx.shadowColor = '#00f0ff';
  ctx.strokeStyle = '#e0faff';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  lightningBranches.forEach(branch => {
    ctx.moveTo(branch.x1, branch.y1);
    ctx.lineTo(branch.x2, branch.y2);
  });
  ctx.stroke();
  ctx.restore();
}

function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  connectNodes();
  drawLightning();
  requestAnimationFrame(animate);
}
animate();

// Password Visibility Toggle
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePasswordBtn && passwordInput) {
  togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    
    // Toggle Eye Icon
    togglePasswordBtn.innerHTML = type === 'password' 
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  });
}

// Modal Handlers (Forgot Password & Register)
const forgotModal = document.getElementById('forgotModal');
const registerModal = document.getElementById('registerModal');
const forgotLink = document.getElementById('forgotPasswordLink');
const registerLink = document.getElementById('registerLink');

forgotLink.addEventListener('click', (e) => {
  e.preventDefault();
  forgotModal.classList.add('active');
});

registerLink.addEventListener('click', (e) => {
  e.preventDefault();
  registerModal.classList.add('active');
});

document.querySelectorAll('.modal-close').forEach(btn => {
  btn.addEventListener('click', () => {
    forgotModal.classList.remove('active');
    registerModal.classList.remove('active');
  });
});

window.addEventListener('click', (e) => {
  if (e.target === forgotModal) forgotModal.classList.remove('active');
  if (e.target === registerModal) registerModal.classList.remove('active');
});

// Auto-fill Demo Simulated User Credentials
const btnAutoFillDemo = document.getElementById('btnAutoFillDemo');
if (btnAutoFillDemo) {
  btnAutoFillDemo.addEventListener('click', () => {
    const consumerInput = document.getElementById('consumerId');
    const passwordInput = document.getElementById('password');
    if (consumerInput) consumerInput.value = 'CNS-849201';
    if (passwordInput) passwordInput.value = 'pass123';
    btnAutoFillDemo.textContent = 'Filled ✓';
    setTimeout(() => { btnAutoFillDemo.textContent = 'Auto Fill ⚡'; }, 2000);
  });
}

// Form Submission Handler
const loginForm = document.getElementById('loginForm');
const submitBtn = document.getElementById('submitBtn');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const consumerId = document.getElementById('consumerId').value.trim();
  const password = document.getElementById('password').value;

  if (!consumerId || !password) {
    alert('Please enter both your Consumer ID and Password.');
    return;
  }

  // Visual feedback on sign in
  submitBtn.disabled = true;
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = `
    <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)"></circle>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor"></path>
    </svg>
    Connecting to Grid...
  `;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consumer_id: consumerId, password: password })
    });
    const data = await res.json();

    if (data.success) {
      submitBtn.innerHTML = `⚡ Access Granted! Redirecting...`;
      setTimeout(() => {
        window.location.href = data.redirect_url || `/consumption?consumer_id=${encodeURIComponent(consumerId)}`;
      }, 600);
    } else {
      alert(data.message || 'Authentication failed. Please check credentials.');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  } catch (err) {
    console.error('Login error:', err);
    // Fallback direct redirection if offline
    window.location.href = `/consumption?consumer_id=${encodeURIComponent(consumerId)}`;
  }
});

// Keyframe for spinner
const style = document.createElement('style');
style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
document.head.appendChild(style);
