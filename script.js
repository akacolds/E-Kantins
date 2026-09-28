// ==========================================
// INISIALISASI & TEMA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Load saved theme
    const savedColor = localStorage.getItem('ekantin_theme');
    if (savedColor) {
        document.documentElement.style.setProperty('--primary', savedColor);
        document.getElementById('theme-color').value = savedColor;
    }
});

function changeTheme(event) {
    const color = event.target.value;
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('ekantin_theme', color);
}

// ==========================================
// SUPABASE KOSONGAN
// ponytail: Karena request "ga pakai email, lgsg user login", kita akan memalsukan email
// di belakang layar (cth: andi@kantin.local) agar Supabase Auth tetap jalan tanpa user tau.
// ==========================================
const SUPABASE_URL = 'https://bxwvagtuyerqjmqkkmta.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4d3ZhZ3R1eWVycWptcWtrbXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjIxMTAsImV4cCI6MjEwNDM5ODExMH0.jkJAEQ9Hvj-_LgF8g0XYEOs7ScVySlG8aYqT1K-UC1A';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// ==========================================
// LOGIC LOGIN SUPER SIMPEL (Otomatis Role)
// ==========================================
async function login() {
    let username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;

    if (!username || !password) return alert("Isi Username dan Password!");

    // Tentukan Role Otomatis dari kata kunci di Username
    let role = 'pembeli';
    if (username === 'admin') role = 'admin';
    else if (username.includes('kantin')) role = 'kantin';

    // Fake Email generator untuk konek ke Supabase
    const fakeEmail = `${username}@ekantin.local`;

    // MOCKUP LOGIN SEKARANG (Tanpa koneksi asli)
    currentUser = { id: Date.now().toString(), username: username, role: role };

    /* 
    // CARA ASLI JIKA SUPABASE SUDAH AKTIF:
    let { data, error } = await supabase.auth.signInWithPassword({ email: fakeEmail, password });
    
    // Jika tidak ada akun (error), otomatis daftar (Sign Up) sesuai request "akun baru lgsg kesimpan"
    if (error && error.message.includes('Invalid login')) {
        const res = await supabase.auth.signUp({ email: fakeEmail, password });
        if(!res.error) {
            alert('Akun baru dibuat otomatis!');
            data = res.data;
        } else return alert(res.error.message);
    }
    currentUser = { ...data.user, role: role }; 
    */

    // Navigasi UI
    document.getElementById('login-section').classList.add('hidden');
    
    if (role === 'pembeli') {
        document.getElementById('murid-name').innerText = `Halo, ${username}!`;
        document.getElementById('murid-pfp').src = `https://ui-avatars.com/api/?name=${username}&background=random`;
        document.getElementById('murid-section').classList.remove('hidden');
    } else if (role === 'kantin') {
        document.getElementById('kantin-name').innerText = `Dashboard ${username}`;
        document.getElementById('kantin-section').classList.remove('hidden');
    } else if (role === 'admin') {
        document.getElementById('admin-section').classList.remove('hidden');
    }
}

function logout() {
    currentUser = null;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    document.getElementById('login-section').classList.remove('hidden');
}

// ==========================================
// FITUR KANTIN
// ==========================================
function tambahMenu() {
    const nama = document.getElementById('menu-nama').value;
    const harga = document.getElementById('menu-harga').value;
    const varian = document.getElementById('menu-varian').value.split(',').map(v => v.trim());
    if (!nama) return alert("Nama wajib diisi");
    
    alert(`Menu disimpan!\nNama: ${nama}\nVarian: ${varian.join(' | ')}`);
    // insert ke supabase...
}

function ubahStok(id, jumlah) {
    const stokEl = document.getElementById(`stok-${id}`);
    let stok = parseInt(stokEl.innerText) + jumlah;
    if(stok < 0) stok = 0;
    stokEl.innerText = stok;
    // update supabase...
}

function updateBanner(event) {
    if(!event.target.files[0]) return;
    const url = URL.createObjectURL(event.target.files[0]);
    document.getElementById('kantin-banner').style.backgroundImage = `url('${url}')`;
}

// ==========================================
// FITUR PEMBELI
// ==========================================
function updatePFP(event) {
    if(!event.target.files[0]) return;
    const url = URL.createObjectURL(event.target.files[0]);
    document.getElementById('murid-pfp').src = url;
}

function pesanMakanan() {
    alert("Pesanan masuk! Kantin sedang menyiapkan makananmu.");
}

function bukaChat() { document.getElementById('chat-modal').classList.remove('hidden'); }
function tutupChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function kirimChat() {
    const input = document.getElementById('chat-text');
    if (!input.value.trim()) return;

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div class="chat-msg me">${input.value}</div>`;
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
}
