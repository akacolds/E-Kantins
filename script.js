// ==========================================
// 1. KONFIGURASI SUPABASE (Isi dengan link Vercel/Supabase mu)
// ==========================================
const SUPABASE_URL = 'https://bxwvagtuyerqjmqkkmta.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4d3ZhZ3R1eWVycWptcWtrbXRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4MjIxMTAsImV4cCI6MjEwNDM5ODExMH0.jkJAEQ9Hvj-_LgF8g0XYEOs7ScVySlG8aYqT1K-UC1A';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null; // Menyimpan data user login saat ini

// ==========================================
// 2. NAVIGASI / AUTHENTICATION
// ==========================================
async function login() {
    const role = document.getElementById('login-role').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) return alert("Isi email dan password");

    // LOGIC ASLI SUPABASE (Uncomment jika supabase sudah diatur):
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    // if (error) return alert(error.message);
    // currentUser = data.user;
    
    // MOCKUP LOGIN untuk visual:
    currentUser = { id: '123', role: role, email: email };

    // Sembunyikan login
    document.getElementById('login-section').classList.add('hidden');

    // Tampilkan dashboard sesuai role
    if (role === 'murid') {
        document.getElementById('murid-section').classList.remove('hidden');
    } else if (role === 'kantin') {
        document.getElementById('kantin-section').classList.remove('hidden');
    } else if (role === 'admin') {
        document.getElementById('admin-section').classList.remove('hidden');
    }
}

function logout() {
    // supabase.auth.signOut();
    currentUser = null;
    document.querySelectorAll('.container').forEach(el => el.classList.add('hidden'));
    document.getElementById('login-section').classList.remove('hidden');
}

// ==========================================
// 3. FITUR KANTIN: TAMBAH MENU & STOK
// ==========================================
async function tambahMenu() {
    const nama = document.getElementById('menu-nama').value;
    const harga = document.getElementById('menu-harga').value;
    const varianText = document.getElementById('menu-varian').value; // Cth: Pedas, Manis
    const stok = document.getElementById('menu-stok').value;

    const varianArray = varianText.split(',').map(v => v.trim()); 

    if (!nama || !harga || !stok) return alert("Lengkapi data menu!");

    // SUPABASE DB INSERT:
    /*
    const { error } = await supabase.from('menu').insert([
        { kantin_id: currentUser.id, nama: nama, harga: harga, varian: varianArray.join(','), stok: stok }
    ]);
    if (error) alert("Gagal tambah menu");
    else alert("Menu berhasil ditambah!");
    */
    alert(`Menu ${nama} berhasil ditambahkan dengan varian: ${varianArray.join(', ')}`);
}

async function ubahStok(menuId, jumlah) {
    const stokSpan = document.getElementById(`stok-${menuId}`);
    let stokSkrg = parseInt(stokSpan.innerText);
    stokSkrg += jumlah;
    if (stokSkrg < 0) stokSkrg = 0;
    
    stokSpan.innerText = stokSkrg;

    // SUPABASE UPDATE:
    // await supabase.from('menu').update({ stok: stokSkrg }).eq('id', menuId);
}

// ==========================================
// 4. UPLOAD GAMBAR (PFP & BANNER)
// ==========================================
async function updatePFP(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Menampilkan preview di HTML lokal
    const urlLokal = URL.createObjectURL(file);
    document.getElementById('murid-pfp').src = urlLokal;

    // SUPABASE STORAGE UPLOAD:
    /*
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}.${fileExt}`;
    await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
    */
    alert("Profile Picture Berhasil diubah!");
}

async function updateBanner(event) {
    const file = event.target.files[0];
    if (!file) return;

    const urlLokal = URL.createObjectURL(file);
    document.getElementById('kantin-banner').style.backgroundImage = `url('${urlLokal}')`;

    // SUPABASE STORAGE UPLOAD BANNER:
    /*
    const fileName = `banner_${currentUser.id}.jpg`;
    await supabase.storage.from('banners').upload(fileName, file, { upsert: true });
    */
    alert("Banner Kantin Berhasil diubah!");
}

// ==========================================
// 5. FITUR MURID: PESAN & CHAT
// ==========================================
function pesanMakanan() {
    // SUPABASE INSERT KE TABEL 'pesanan' dgn kolom catatan
    alert("Pesanan berhasil dikirim ke kantin! Catatan kamu sudah disertakan.");
}

function bukaChat() { document.getElementById('chat-modal').classList.remove('hidden'); }
function tutupChat() { document.getElementById('chat-modal').classList.add('hidden'); }

function kirimChat() {
    const text = document.getElementById('chat-text').value;
    if (!text) return;

    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML += `<div class="chat-msg me">${text}</div>`;
    document.getElementById('chat-text').value = '';
    chatBox.scrollTop = chatBox.scrollHeight;

    // SUPABASE REALTIME CHAT INSERT:
    // await supabase.from('chat').insert([{ pengirim_id: currentUser.id, penerima_id: 'KANTIN_ID', pesan: text }]);
}
