// ================= INISIALISASI SUPABASE =================
const SUPABASE_URL = 'https://bxwvagtuyerqjmqkkmta.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4mDuRGKRn_va09DOIe4wiQ_RIgO-1sd';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ================= STATE MANAGEMENT =================
let menuData = [];
let orderData = [];
let currentUser = JSON.parse(localStorage.getItem('kantin_user_session')) || null;
let itemDipilih = null;

// Helper: Cek apakah pesanan 'Siap Diambil' sudah lewat dari 1 menit (60.000 ms)
function isSudahSelesaiSatuMenit(order) {
    if (order.status !== "Siap Diambil") return false;
    const waktuBuat = Number(order.id);
    return (Date.now() - waktuBuat) > (1 * 60 * 1000);
}

// Ambil Data Menu
async function loadMenu() {
    const { data, error } = await _supabase.from('menu_kantin').select('*');
    if (error || !data) return [];
    return data.map(m => ({
        id: m.id,
        kantinId: m.kantin_id,
        namaKantin: m.nama_kantin,
        nama: m.nama,
        kategori: m.kategori,
        desc: m.description,
        harga: m.harga,
        stok: m.stok,
        foto: m.foto,
        varianList: m.varian_list || ["Original"]
    }));
}

// Ambil Data Pesanan
async function loadOrders() {
    const { data, error } = await _supabase.from('orders_kantin').select('*').order('id', { ascending: false });
    if (error || !data) return [];
    return data.map(o => ({
        id: o.id,
        kantinId: o.kantin_id,
        namaPemesan: o.nama_pemesan,
        infoPemesan: o.info_pemesan,
        kodeUnikPemesan: o.kode_unik_pemesan,
        userKey: o.user_key,
        metode: o.metode,
        namaMenu: o.nama_menu,
        qty: o.qty,
        varian: o.varian,
        harga: o.harga,
        catatan: o.catatan,
        waktu: o.waktu,
        status: o.status,
        chats: o.chats || []
    }));
}

async function initAppData() {
    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
    menuData = await loadMenu();
    orderData = await loadOrders();
    cekSesi();
}

function saveToStorage() {
    localStorage.setItem('kantin_user_session', JSON.stringify(currentUser));
}

function formatRupiah(num) {
    return "Rp " + (num || 0).toLocaleString('id-ID');
}

// ================= REALTIME SUBSCRIPTION =================
_supabase
  .channel('public:e-kantin-realtime')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_kantin' }, async (payload) => {
      const newOrder = payload.new;

      if (currentUser && currentUser.role === 'kantin' && parseInt(currentUser.kantinId, 10) === parseInt(newOrder.kantin_id, 10)) {
          const sound = document.getElementById('sound-notif');
          if (sound) sound.play().catch(() => {});

          if ("Notification" in window && Notification.permission === "granted") {
              new Notification("🔔 Pesanan Baru Masuk!", {
                  body: `${newOrder.nama_pemesan} memesan: ${newOrder.nama_menu} (${newOrder.qty} Porsi)`
              });
          }
      }

      orderData = await loadOrders();
      refreshUI();
  })
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_kantin' }, async () => {
      orderData = await loadOrders();
      refreshUI();
  })
  .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_kantin' }, async () => {
      menuData = await loadMenu();
      refreshUI();
  })
  .subscribe();

function refreshUI() {
    if (!currentUser) return;
    if (currentUser.role === 'kantin') {
        renderPesananKantin();
        renderMenuKantin();
        renderPesananSelesaiKantin();
    } else {
        renderKatalogPembeli();
        renderPesananPembeli();
    }
}

// ================= SISTEM LOGIN =================
function gantiTabLogin(tab) {
    document.getElementById('tab-btn-murid').classList.toggle('active', tab === 'murid');
    document.getElementById('tab-btn-kantin').classList.toggle('active', tab === 'kantin');
    document.getElementById('form-login-murid').classList.toggle('hidden', tab !== 'murid');
    document.getElementById('form-login-kantin').classList.toggle('hidden', tab !== 'kantin');
}

async function loginMurid(e) {
    e.preventDefault();
    const nama = document.getElementById('input-nama-murid').value.trim();
    const kelas = document.getElementById('input-kelas-murid').value.trim();
    const kodeUnik = document.getElementById('input-kode-murid').value.trim();

    if (!nama || !kelas || !kodeUnik) {
        alert("Harap lengkapi Nama, Kelas, dan Kode Unik!");
        return;
    }

    const userKey = nama.toLowerCase() + "_" + kelas.toLowerCase();
    const registered = JSON.parse(localStorage.getItem('kantin_registered_students')) || {};

    if (registered[userKey] && registered[userKey] !== kodeUnik) {
        alert(`Gagal Masuk! Kode Unik tidak cocok.`);
        return;
    }

    registered[userKey] = kodeUnik;
    localStorage.setItem('kantin_registered_students', JSON.stringify(registered));

    currentUser = { role: "murid", nama: nama, kelas: kelas, kodeUnik: kodeUnik, userKey: userKey };
    saveToStorage();
    cekSesi();
}

async function loginKantin(e) {
    e.preventDefault();
    const kId = parseInt(document.getElementById('select-kantin-login').value, 10);
    const passInput = document.getElementById('input-pass-kantin').value;

    const { data, error } = await _supabase.from('kantin_users').select('*').eq('kantin_id', kId).single();

    if (error || !data || passInput !== data.password) {
        alert("Password salah atau akun tidak ditemukan!");
        return;
    }

    currentUser = { role: "kantin", kantinId: data.kantin_id, nama: data.nama_kantin };
    saveToStorage();
    cekSesi();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kantin_user_session');
    cekSesi();
}

async function cekSesi() {
    menuData = await loadMenu();
    orderData = await loadOrders();

    const vLogin = document.getElementById('view-login');
    const vPembeli = document.getElementById('view-pembeli');
    const vKantin = document.getElementById('view-kantin');
    const userBar = document.getElementById('user-session-bar');
    const userText = document.getElementById('session-user-text');

    vLogin.classList.add('hidden');
    vPembeli.classList.add('hidden');
    vKantin.classList.add('hidden');
    userBar.classList.add('hidden');

    if (!currentUser) {
        vLogin.classList.remove('hidden');
        return;
    }

    userBar.classList.remove('hidden');

    if (currentUser.role === 'kantin') {
        userText.innerText = `Pemilik: ${currentUser.nama}`;
        vKantin.classList.remove('hidden');
        document.getElementById('label-kantin-pesanan').innerText = `Pesanan Masuk - ${currentUser.nama}`;
        document.getElementById('label-kantin-menu').innerText = `Kelola Menu & Stok - ${currentUser.nama}`;
        switchKantinView('pesanan');
    } else {
        userText.innerText = `🎓 Siswa: ${currentUser.nama} (${currentUser.kelas}) • Kode: ${currentUser.kodeUnik}`;
        vPembeli.classList.remove('hidden');
        switchPembeliView('menu');
    }
}

// ================= DASHBOARD MURID =================
function switchPembeliView(view) {
    document.getElementById('btn-tab-pembeli-menu').classList.toggle('active', view === 'menu');
    document.getElementById('btn-tab-pembeli-pesanan').classList.toggle('active', view === 'pesanan');
    document.getElementById('pembeli-view-menu').classList.toggle('hidden', view !== 'menu');
    document.getElementById('pembeli-view-pesanan').classList.toggle('hidden', view !== 'pesanan');

    if (view === 'menu') renderKatalogPembeli();
    else renderPesananPembeli();
}

function renderKatalogPembeli() {
    const grid = document.getElementById('grid-menu-pembeli');
    const filter = document.getElementById('filter-kantin').value;
    grid.innerHTML = "";

    const items = menuData.filter(m => filter === "all" || String(m.kantinId) === filter);

    if (items.length === 0) {
        grid.innerHTML = `<p class="text-muted">Belum ada menu tersedia.</p>`;
        return;
    }

    items.forEach(item => {
        const habis = item.stok <= 0;
        const card = document.createElement('div');
        card.className = "menu-card";
        card.innerHTML = `
            <div class="img-box"><img src="${item.foto}" alt="${item.nama}"></div>
            <div class="menu-content">
                <span class="tag-kantin">${item.namaKantin} • [${item.kategori}]</span>
                <h4 class="menu-title">${item.nama}</h4>
                <p class="menu-desc">${item.desc}</p>
                <p class="menu-price">${formatRupiah(item.harga)}</p>
                <p class="menu-stock">${habis ? '<span style="color:#dc2626;font-weight:bold;">Stok Habis</span>' : 'Sisa Stok: <strong>' + item.stok + '</strong>'}</p>
                <button type="button" class="btn btn-primary" ${habis ? 'disabled' : ''} onclick="bukaModalPesan(${item.id})">
                    ${habis ? 'Stok Habis' : 'Pesan Sekarang'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function bukaModalPesan(itemId) {
    itemDipilih = menuData.find(m => m.id === itemId);
    if (!itemDipilih || itemDipilih.stok <= 0) return;

    document.getElementById('modal-nama-menu').innerText = `Pesan: ${itemDipilih.nama}`;
    document.getElementById('modal-kantin-menu').innerText = `${itemDipilih.namaKantin} • Sistem Take Away`;
    document.getElementById('input-catatan-pesan').value = "";
    document.getElementById('input-jumlah-porsi').value = 1;
    document.getElementById('input-jumlah-porsi').max = itemDipilih.stok;

    const selectVarian = document.getElementById('select-varian-item');
    selectVarian.innerHTML = "";
    let varianArray = itemDipilih.varianList || ["Original"];
    if (typeof varianArray === 'string') varianArray = varianArray.split(',').map(v => v.trim());

    varianArray.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v; opt.innerText = v;
        selectVarian.appendChild(opt);
    });

    document.getElementById('modal-harga-menu').dataset.hargaDasar = itemDipilih.harga;
    updateTotalHargaPesan();
    document.getElementById('modal-pesan').classList.remove('hidden');
}

function updateTotalHargaPesan() {
    const qtyInput = document.getElementById('input-jumlah-porsi');
    let qty = parseInt(qtyInput.value, 10);
    if (qty < 1 || isNaN(qty)) { qty = 1; qtyInput.value = 1; }
    if (qty > itemDipilih.stok) { qty = itemDipilih.stok; qtyInput.value = itemDipilih.stok; }

    const hargaDasar = parseInt(document.getElementById('modal-harga-menu').dataset.hargaDasar, 10);
    const totalHarga = hargaDasar * qty;
    document.getElementById('modal-harga-menu').innerText = `Total: ${formatRupiah(totalHarga)}`;
    document.getElementById('modal-harga-menu').dataset.currentTotal = totalHarga;
}

function tutupModalPesan() {
    itemDipilih = null;
    document.getElementById('modal-pesan').classList.add('hidden');
}

async function konfirmasiKirimPesanan() {
    if (!itemDipilih || itemDipilih.stok <= 0) return;

    const catatan = document.getElementById('input-catatan-pesan').value.trim();
    const varian = document.getElementById('select-varian-item').value;
    const qty = parseInt(document.getElementById('input-jumlah-porsi').value, 10);
    const totalHarga = parseInt(document.getElementById('modal-harga-menu').dataset.currentTotal, 10);

    const orderBaru = {
        id: Date.now(),
        kantin_id: parseInt(itemDipilih.kantinId, 10),
        nama_pemesan: currentUser.nama,
        info_pemesan: currentUser.kelas,
        kode_unik_pemesan: currentUser.kodeUnik,
        user_key: currentUser.userKey,
        metode: "Take Away",
        nama_menu: itemDipilih.nama,
        qty: qty,
        varian: varian,
        harga: totalHarga,
        catatan: catatan || "Tanpa catatan.",
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: "Menunggu",
        chats: []
    };

    await _supabase.from('orders_kantin').insert([orderBaru]);
    await _supabase.from('menu_kantin').update({ stok: itemDipilih.stok - qty }).eq('id', itemDipilih.id);

    tutupModalPesan();
    menuData = await loadMenu();
    orderData = await loadOrders();
    renderKatalogPembeli();
    renderPesananPembeli();
    alert(`Pesanan berhasil dikirim ke ${itemDipilih.namaKantin}!`);
}

async function renderPesananPembeli() {
    const list = document.getElementById('list-pesanan-pembeli');
    list.innerHTML = "";
    orderData = await loadOrders();

    const myOrders = orderData.filter(p => p.userKey === currentUser.userKey);

    if (myOrders.length === 0) {
        list.innerHTML = `<p class="text-muted">Belum ada riwayat pesanan.</p>`;
        return;
    }

    myOrders.forEach(o => {
        const card = document.createElement('div');
        card.className = "order-card";
        let badgeClass = o.status === "Sedang Dimasak" ? "badge-proses" : (o.status === "Siap Diambil" ? "badge-selesai" : "badge-menunggu");

        let chatHTML = (o.chats && o.chats.length > 0) ? o.chats.map(c => `
            <div class="chat-bubble ${c.sender === 'murid' ? 'chat-self' : 'chat-other'}">
                <div class="chat-sender-label">${c.sender === 'murid' ? 'Saya' : 'Penjual'}:</div>
                <div>${c.text}</div>
            </div>`).join('') : `<span class="text-muted" style="font-size:11px;">Belum ada pesan.</span>`;

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <strong>${o.namaMenu} (${o.qty} Porsi)</strong> - ${formatRupiah(o.harga)}<br>
                    <small class="text-muted">Kantin: ${getNamaKantinById(o.kantinId)} • Waktu: ${o.waktu}</small><br>
                    <span class="order-varian-box">Varian: ${o.varian}</span><br>
                    <span class="order-note-box">Catatan: "${o.catatan}"</span>
                </div>
                <div><span class="badge-status ${badgeClass}">${o.status}</span></div>
            </div>
            <div class="chat-section">
                <div class="chat-toggle-title">💬 Fitur Chat / Obrolan</div>
                <div class="chat-history">${chatHTML}</div>
                <div class="chat-form">
                    <input type="text" id="input-chat-murid-${o.id}" placeholder="Ketik pesan...">
                    <button type="button" class="btn btn-primary btn-sm" onclick="kirimPesanMurid(${o.id})">Kirim</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function kirimPesanMurid(orderId) {
    const input = document.getElementById(`input-chat-murid-${orderId}`);
    if (!input || !input.value.trim()) return;

    const order = orderData.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    if (!order.chats) order.chats = [];
    order.chats.push({ sender: "murid", text: input.value.trim(), waktu: new Date().toLocaleTimeString('id-ID') });

    await _supabase.from('orders_kantin').update({ chats: order.chats }).eq('id', orderId);
    input.value = "";
    orderData = await loadOrders();
    renderPesananPembeli();
}

// ================= DASHBOARD PENJUAL KANTIN =================
function switchKantinView(view) {
    document.getElementById('btn-tab-kantin-pesanan').classList.toggle('active', view === 'pesanan');
    document.getElementById('btn-tab-kantin-menu').classList.toggle('active', view === 'menu');
    document.getElementById('btn-tab-kantin-selesai').classList.toggle('active', view === 'selesai');

    document.getElementById('kantin-view-pesanan').classList.toggle('hidden', view !== 'pesanan');
    document.getElementById('kantin-view-menu').classList.toggle('hidden', view !== 'menu');
    document.getElementById('kantin-view-selesai').classList.toggle('hidden', view !== 'selesai');

    if (view === 'pesanan') renderPesananKantin();
    else if (view === 'menu') renderMenuKantin();
    else if (view === 'selesai') renderPesananSelesaiKantin();
}

async function renderPesananKantin() {
    const list = document.getElementById('list-pesanan-masuk');
    list.innerHTML = "";
    orderData = await loadOrders();

    const targetKantinId = parseInt(currentUser.kantinId, 10);

    const masuk = orderData.filter(o => 
        parseInt(o.kantinId, 10) === targetKantinId && 
        !isSudahSelesaiSatuMenit(o)
    );

    const countMenunggu = masuk.filter(o => o.status !== 'Siap Diambil').length;
    const badge = document.getElementById('badge-pesanan-kantin');
    if (badge) {
        if (countMenunggu > 0) { badge.innerText = countMenunggu; badge.classList.remove('hidden'); }
        else badge.classList.add('hidden');
    }

    if (masuk.length === 0) {
        list.innerHTML = `<p class="text-muted">Belum ada pesanan masuk.</p>`;
        return;
    }

    masuk.forEach(o => {
        const card = document.createElement('div');
        card.className = "order-card";
        let badgeClass = o.status === "Sedang Dimasak" ? "badge-proses" : (o.status === "Siap Diambil" ? "badge-selesai" : "badge-menunggu");

        let chatHTML = (o.chats && o.chats.length > 0) ? o.chats.map(c => `
            <div class="chat-bubble ${c.sender === 'kantin' ? 'chat-self' : 'chat-other'}">
                <div class="chat-sender-label">${c.sender === 'kantin' ? 'Saya' : o.namaPemesan}:</div>
                <div>${c.text}</div>
            </div>`).join('') : `<span class="text-muted" style="font-size:11px;">Belum ada obrolan.</span>`;

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <span class="badge-status badge-menunggu">Siswa: ${o.infoPemesan} (Kode: ${o.kodeUnikPemesan || '-'})</span>
                    <h4 style="margin-top:5px;">${o.namaMenu} (${o.qty} Porsi) - ${formatRupiah(o.harga)}</h4>
                    <p style="font-size:13px;">Pemesan: <strong>${o.namaPemesan}</strong></p>
                    <span class="order-varian-box">Varian: ${o.varian}</span><br>
                    <span class="order-note-box">Catatan: "${o.catatan}"</span>
                </div>
                <div>
                    <span class="badge-status ${badgeClass}">${o.status}</span>
                    <div class="status-actions">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="ubahStatusPesanan(${o.id}, 'Sedang Dimasak')">🍳 Dimasak</button>
                        <button type="button" class="btn btn-sm btn-success" onclick="ubahStatusPesanan(${o.id}, 'Siap Diambil')">🔔 Siap</button>
                    </div>
                </div>
            </div>
            <div class="chat-section">
                <div class="chat-toggle-title">💬 Fitur Chat / Obrolan</div>
                <div class="chat-history">${chatHTML}</div>
                <div class="chat-form">
                    <input type="text" id="input-chat-kantin-${o.id}" placeholder="Balas chat...">
                    <button type="button" class="btn btn-primary btn-sm" onclick="kirimPesanKantin(${o.id})">Kirim</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function renderPesananSelesaiKantin() {
    const list = document.getElementById('list-pesanan-selesai');
    if (!list) return;
    list.innerHTML = "";
    orderData = await loadOrders();

    const targetKantinId = parseInt(currentUser.kantinId, 10);

    const selesai = orderData.filter(o => 
        parseInt(o.kantinId, 10) === targetKantinId && 
        isSudahSelesaiSatuMenit(o)
    );

    if (selesai.length === 0) {
        list.innerHTML = `<p class="text-muted">Belum ada pesanan yang selesai lebih dari 1 menit.</p>`;
        return;
    }

    selesai.forEach(o => {
        const card = document.createElement('div');
        card.className = "order-card";
        card.style.opacity = "0.85";

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <span class="badge-status badge-selesai">Siswa: ${o.infoPemesan} (Kode: ${o.kodeUnikPemesan || '-'})</span>
                    <h4 style="margin-top:5px;">${o.namaMenu} (${o.qty} Porsi) - ${formatRupiah(o.harga)}</h4>
                    <p style="font-size:13px;">Pemesan: <strong>${o.namaPemesan}</strong></p>
                    <span class="order-varian-box">Varian: ${o.varian}</span><br>
                    <span class="order-note-box">Catatan: "${o.catatan}"</span>
                </div>
                <div>
                    <span class="badge-status badge-selesai">✅ Selesai</span>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function ubahStatusPesanan(orderId, statusBaru) {
    await _supabase.from('orders_kantin').update({ status: statusBaru }).eq('id', orderId);
    orderData = await loadOrders();
    renderPesananKantin();
}

async function kirimPesanKantin(orderId) {
    const input = document.getElementById(`input-chat-kantin-${orderId}`);
    if (!input || !input.value.trim()) return;

    const order = orderData.find(o => Number(o.id) === Number(orderId));
    if (!order) return;

    if (!order.chats) order.chats = [];
    order.chats.push({ sender: "kantin", text: input.value.trim(), waktu: new Date().toLocaleTimeString('id-ID') });

    await _supabase.from('orders_kantin').update({ chats: order.chats }).eq('id', orderId);
    input.value = "";
    orderData = await loadOrders();
    renderPesananKantin();
}

function renderMenuKantin() {
    const grid = document.getElementById('grid-menu-kantin');
    grid.innerHTML = "";

    const targetKantinId = parseInt(currentUser.kantinId, 10);
    const myMenu = menuData.filter(m => parseInt(m.kantinId, 10) === targetKantinId);

    if (myMenu.length === 0) {
        grid.innerHTML = `<p class="text-muted">Belum ada menu.</p>`;
        return;
    }

    myMenu.forEach(item => {
        const card = document.createElement('div');
        card.className = "menu-card";

        card.innerHTML = `
            <div class="img-box"><img src="${item.foto}" alt="${item.nama}"></div>
            <div class="menu-content">
                <span class="tag-kantin">[${item.kategori}]</span>
                <h4 class="menu-title">${item.nama}</h4>
                <p class="menu-desc">${item.desc}</p>
                <p class="menu-price">${formatRupiah(item.harga)}</p>
            </div>
            <div class="kantin-edit-panel">
                <div class="stock-control-row">
                    <label style="font-size:12px; font-weight:600;">Stok:</label>
                    <input type="number" class="stock-input" value="${item.stok}" onchange="setStokManual(${item.id}, this.value)">
                </div>
                <button type="button" class="btn-delete-menu" onclick="hapusMenu(${item.id})">Hapus Menu</button>
            </div>
        `;
        grid.appendChild(card);
    });
}

async function setStokManual(itemId, val) {
    const stokBaru = Math.max(0, parseInt(val, 10) || 0);
    await _supabase.from('menu_kantin').update({ stok: stokBaru }).eq('id', itemId);
    menuData = await loadMenu();
    renderMenuKantin();
}

async function hapusMenu(itemId) {
    if (confirm("Hapus menu ini?")) {
        await _supabase.from('menu_kantin').delete().eq('id', itemId);
        menuData = await loadMenu();
        renderMenuKantin();
    }
}

function bukaModalTambahMenu() {
    document.getElementById('modal-tambah-menu').classList.remove('hidden');
}

function tutupModalTambahMenu() {
    document.getElementById('modal-tambah-menu').classList.add('hidden');
}

async function simpanMenuBaru(e) {
    e.preventDefault();
    const nama = document.getElementById('new-menu-nama').value.trim();
    const kategori = document.getElementById('new-menu-kategori').value;
    const varianStr = document.getElementById('new-menu-varian').value;
    const harga = parseInt(document.getElementById('new-menu-harga').value, 10) || 0;
    const stok = parseInt(document.getElementById('new-menu-stok').value, 10) || 0;
    const desc = document.getElementById('new-menu-desc').value.trim();
    const fotoLink = document.getElementById('new-menu-foto-link').value.trim();

    const arrVarian = varianStr.split(',').map(v => v.trim()).filter(v => v !== "");

    const newItem = {
        id: Date.now(),
        kantin_id: parseInt(currentUser.kantinId, 10),
        nama_kantin: currentUser.nama,
        nama: nama,
        kategori: kategori,
        description: desc,
        harga: harga,
        stok: stok,
        foto: fotoLink || "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400",
        varian_list: arrVarian.length > 0 ? arrVarian : ["Original"]
    };

    await _supabase.from('menu_kantin').insert([newItem]);
    tutupModalTambahMenu();
    menuData = await loadMenu();
    renderMenuKantin();
}

function getNamaKantinById(id) {
    return `Kantin ${id}`;
}

setInterval(() => {
    if (currentUser && currentUser.role === 'kantin') {
        renderPesananKantin();
        const viewSelesai = document.getElementById('kantin-view-selesai');
        if (viewSelesai && !viewSelesai.classList.contains('hidden')) {
            renderPesananSelesaiKantin();
        }
    }
}, 10000);

window.addEventListener('DOMContentLoaded', () => {
    initAppData();
});
