// ==========================================
// 1. KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://bxwvagtuyerqjmqkkmta.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4d3ZhZ3R1eWVycWptcWtrbXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjIxMTAsImV4cCI6MjEwNDM5ODExMH0.jkJAEQ9Hvj-_LgF8g0XYEOs7ScVySlG8aYqT1K-UC1A'; 

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==========================================
// 2. DATA KANTIN & STATE APLIKASI
// ==========================================
const canteenLayouts = {
  1: { name: "Kantin 1 - Spesialis Nasi & Berat", desc: "Menyediakan aneka nasi olahan segar dan lauk pauk." },
  2: { name: "Kantin 2 - Bebakaran & Mie", desc: "Spesialis Mie Goreng, Rebus, dan Bakaran Pedas." },
  3: { name: "Kantin 3 - Snack & Cold Drink", desc: "Tempat nongkrong dengan es boba, kopi, dan camilan renyah." },
  4: { name: "Kantin 4 - Masakan Rumahan", desc: "Menu prasmanan sehat dan hemat kantong mahasiswa/siswa." },
  5: { name: "Kantin 5 - Western & Fast Food", desc: "Burger, Dimsum, Kentang Goreng, dan Milkshake." },
  6: { name: "Kantin 6 - Jus & Buah Segar", desc: "Jus buah murni, es buah, dan salad sehat." }
};

let products = [];
let currentRole = 'guest';
let activeCanteen = 1;

// ==========================================
// 3. TOGGLE TAB LOGIN & REGISTER
// ==========================================
function switchAuthTab(tab) {
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');
  const loginBtn = document.getElementById('tab-login-btn');
  const registerBtn = document.getElementById('tab-register-btn');

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    loginBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-white text-indigo-600 shadow-sm transition";
    registerBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition";
  } else {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
    registerBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-white text-emerald-600 shadow-sm transition";
    loginBtn.className = "flex-1 py-2 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-800 transition";
  }
}

// ==========================================
// 4. LOGIKA AUTHENTICATION (SIGN UP & SIGN IN)
// ==========================================

// --- PROSES SIGN UP (DAFTAR AKUN SISWA) ---
async function handleSignUp(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const studentClass = document.getElementById('reg-class').value;
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  const submitBtn = document.getElementById('btn-register-submit');

  submitBtn.innerText = 'Memproses...';
  submitBtn.disabled = true;

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        full_name: name,
        username: username,
        student_class: studentClass,
        role: 'siswa'
      }
    }
  });

  submitBtn.innerText = 'Daftar Akun Siswa';
  submitBtn.disabled = false;

  if (error) {
    alert(`Gagal Mendaftar: ${error.message}`);
    return;
  }

  document.getElementById('form-register').reset();
  
  // Cek apakah butuh verifikasi OTP (Jika Confirm Email aktif di Supabase)
  if (data.user && !data.session) {
    alert(`Pendaftaran Berhasil! Silakan cek email kamu untuk melihat kode OTP.`);
    showOtpForm(email);
  } else {
    alert(`Pendaftaran Berhasil! Selamat datang ${name} (${studentClass}).`);
    enterApp(`Siswa: ${username} (${studentClass})`);
  }
}

// --- MODIFIKASI SAAT SIGN UP BERHASIL (FORM OTP) ---
function showOtpForm(email) {
    document.getElementById('form-register').classList.add('hidden');
    const otpPortal = document.getElementById('otp-portal');
    if (otpPortal) {
        otpPortal.classList.remove('hidden');
        document.getElementById('otp-email').value = email;
    }
}

// --- PROSES VERIFIKASI KODE OTP ---
async function handleVerifyOtp() {
    const email = document.getElementById('otp-email').value.trim();
    const token = document.getElementById('otp-code').value.trim();
    const submitBtn = document.getElementById('btn-verify-otp');

    if (!token || token.length !== 6) {
        alert("Masukkan 6 digit kode OTP yang valid!");
        return;
    }

    submitBtn.innerText = 'Memverifikasi...';
    submitBtn.disabled = true;

    const { data, error } = await supabaseClient.auth.verifyOtp({
        email: email,
        token: token,
        type: 'signup'
    });

    submitBtn.innerText = 'Verifikasi Kode';
    submitBtn.disabled = false;

    if (error) {
        alert(`Gagal Verifikasi: ${error.message}`);
    } else {
        alert("Verifikasi Berhasil! Kamu sekarang sudah masuk.");
        document.getElementById('otp-portal').classList.add('hidden');
        enterApp(`Siswa: ${email}`);
    }
}

// --- PROSES SIGN IN ---
async function handleSignIn(e) {
  e.preventDefault();
  const userInput = document.getElementById('login-email').value.trim();
  const passwordInput = document.getElementById('login-password').value.trim();
  const submitBtn = document.getElementById('btn-login-submit');

  submitBtn.innerText = 'Memeriksa...';
  submitBtn.disabled = true;

  try {
    // 1. Cek ke tabel `kantin_users` (Admin & Pemilik Kantin)
    const { data: userAccount, error: dbError } = await supabaseClient
      .from('kantin_users')
      .select('*')
      .eq('username', userInput)
      .eq('password', passwordInput)
      .maybeSingle();

    if (userAccount) {
      document.getElementById('form-login').reset();
      submitBtn.innerText = 'Masuk ke System';
      submitBtn.disabled = false;
      
      enterApp(userAccount.role);
      return;
    }

    // 2. Cek Login via Supabase Auth (Siswa)
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: userInput,
      password: passwordInput,
    });

    submitBtn.innerText = 'Masuk ke System';
    submitBtn.disabled = false;

    if (authError) {
      alert("Username/Email atau Password salah!");
    } else {
      document.getElementById('form-login').reset();
      const meta = authData.user.user_metadata;
      const displayName = meta?.username || meta?.full_name || authData.user.email;
      const displayClass = meta?.student_class ? ` - ${meta.student_class}` : '';
      
      enterApp(`Siswa: ${displayName}${displayClass}`);
    }

  } catch (err) {
    console.error("Error saat login:", err);
    alert("Terjadi kesalahan sistem saat melakukan login.");
    submitBtn.innerText = 'Masuk ke System';
    submitBtn.disabled = false;
  }
}

function loginGuest() {
  enterApp('guest');
}

function enterApp(role) {
  document.getElementById('login-portal').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  changeRole(role);
}

async function logout() {
  await supabaseClient.auth.signOut();
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('login-portal').classList.remove('hidden');
}

// ==========================================
// 5. DATABASE & UI RENDER (SUPABASE CRUD)
// ==========================================
async function fetchProducts() {
  const list = document.getElementById('product-list');
  if (!list) return;
  
  list.innerHTML = `<p class="text-slate-400 col-span-full italic text-center py-8">Memuat data menu...</p>`;

  const { data, error } = await supabaseClient
    .from('products')
    .select('*');

  if (error) {
    console.error('Gagal mengambil data:', error);
    list.innerHTML = `<p class="text-rose-500 col-span-full font-semibold text-center py-8">Gagal memuat data dari Supabase.</p>`;
    return;
  }

  products = data.map(item => ({
    id: item.id,
    canteenId: item.canteen_id,
    name: item.name,
    price: item.price,
    img: item.img
  }));

  renderCanteen(activeCanteen);
  if (currentRole === 'admin') renderAdminStats();
}

async function handleAddProduct(e) {
  e.preventDefault();
  const canteenNum = parseInt(currentRole.replace('kantin', ''));
  const name = document.getElementById('prod-name').value;
  const price = parseInt(document.getElementById('prod-price').value);
  const img = document.getElementById('prod-img').value;

  const { error } = await supabaseClient
    .from('products')
    .insert([{ canteen_id: canteenNum, name: name, price: price, img: img }]);

  if (error) {
    console.error('Gagal menambah menu:', error);
    alert('Gagal menambah menu!');
  } else {
    document.getElementById('add-product-form').reset();
    await fetchProducts();
  }
}

async function deleteProduct(id) {
  if (!confirm("Apakah Anda yakin ingin menghapus menu ini?")) return;

  const { error } = await supabaseClient
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Gagal menghapus menu:', error);
    alert('Gagal menghapus menu!');
  } else {
    await fetchProducts();
  }
}

function renderTabs() {
  const tabs = document.getElementById('kantin-tabs');
  if (!tabs) return;
  
  tabs.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const active = activeCanteen === i;
    tabs.innerHTML += `
      <button type="button" onclick="selectCanteen(${i})" class="px-4 py-2 font-semibold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ${active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}">
        Kantin ${i}
      </button>
    `;
  }
}

function selectCanteen(id) {
  activeCanteen = id;
  renderTabs();
  renderCanteen(id);
}

function renderCanteen(id) {
  const layout = canteenLayouts[id];
  const canteenNameEl = document.getElementById('canteen-name');
  const canteenDescEl = document.getElementById('canteen-desc');
  if (canteenNameEl) canteenNameEl.innerText = layout.name;
  if (canteenDescEl) canteenDescEl.innerText = layout.desc;

  const list = document.getElementById('product-list');
  if (!list) return;

  const filtered = products.filter(p => p.canteenId === id);

  if (filtered.length === 0) {
    list.innerHTML = `<p class="text-slate-400 col-span-full italic py-8 text-center">Belum ada menu yang dijual di kantin ini.</p>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden canteen-card flex flex-col justify-between">
      <div>
        <img src="${p.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500'}" class="h-44 w-full object-cover" alt="${p.name}">
        <div class="p-4">
          <h4 class="font-bold text-slate-800 text-base mb-1">${p.name}</h4>
          <p class="text-emerald-600 font-extrabold text-sm">Rp ${p.price.toLocaleString('id-ID')}</p>
        </div>
      </div>
      ${(currentRole === `kantin${id}` || currentRole === 'admin') ? `
        <div class="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button type="button" onclick="deleteProduct(${p.id})" class="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center space-x-1 cursor-pointer">
            <i class="ri-delete-bin-line"></i>
            <span>Hapus</span>
          </button>
        </div>
      ` : ''}
    </div>
  `).join('');
}

function changeRole(role) {
  currentRole = role;
  const roleDisplay = document.getElementById('role-display');
  if (roleDisplay) roleDisplay.innerText = `Role: ${role.toUpperCase()}`;

  const adminPage = document.getElementById('page-admin');
  const ownerPage = document.getElementById('page-owner');

  if (adminPage) adminPage.classList.add('hidden');
  if (ownerPage) ownerPage.classList.add('hidden');

  if (role === 'admin') {
    if (adminPage) adminPage.classList.remove('hidden');
    renderAdminStats();
  } else if (role.startsWith('kantin')) {
    const canteenNum = parseInt(role.replace('kantin', ''));
    if (ownerPage) ownerPage.classList.remove('hidden');
    const ownerTitle = document.getElementById('owner-title');
    if (ownerTitle) ownerTitle.innerText = `Manajemen Menu (Kantin ${canteenNum})`;
    selectCanteen(canteenNum);
  }

  renderCanteen(activeCanteen);
}

function renderAdminStats() {
  const stats = document.getElementById('admin-stats');
  if (!stats) return;
  
  stats.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const count = products.filter(p => p.canteenId === i).length;
    stats.innerHTML += `
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div class="font-bold text-slate-800 text-sm">Kantin ${i}</div>
        <div class="text-xs text-slate-500 font-medium mt-0.5">${count} Menu</div>
      </div>
    `;
  }
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
  renderTabs();
  fetchProducts();
});
