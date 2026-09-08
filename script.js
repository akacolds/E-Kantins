// ================= DATA TEMPLATE STANDAR =================
const DEFAULT_MENU_TEMPLATE = [
    {
        id: 1,
        kantinId: 1,
        namaKantin: "Kantin 1 (Bu Siti)",
        nama: "Aneka Olahan Mie",
        kategori: "Mie",
        desc: "Pilihan: Aceh, Geprek, Rendang, Kuah Soto",
        harga: 7000,
        stok: 20,
        foto: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=400",
        varianList: ["Aceh", "Geprek", "Rendang", "Kuah Soto", "Goreng Original"]
    },
    {
        id: 2,
        kantinId: 1,
        namaKantin: "Kantin 1 (Bu Siti)",
        nama: "Aneka Minuman Segar",
        kategori: "Minuman",
        desc: "Pilihan minuman dingin menyegarkan",
        harga: 3000,
        stok: 30,
        foto: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
        varianList: ["Es Teh Manis", "Nutrisari Jeruk", "Kopi Susu Dingin"]
    },
    {
        id: 3,
        kantinId: 2,
        namaKantin: "Kantin 2 (Pak Joko)",
        nama: "Aneka Nasi & Ayam",
        kategori: "Nasi",
        desc: "Ayam Geprek, Nasi Campur Sayur",
        harga: 12000,
        stok: 15,
        foto: "https://images.unsplash.com/photo-1562967914-608f82629710?w=400",
        varianList: ["Nasi Ayam Geprek", "Nasi Campur Sayur", "Nasi Uduk"]
    }
];

// ================= DATA PESANAN DUMMY =================
const DUMMY_ORDERS = [
    {
        id: "101",
        kantinId: 1,
        namaPemesan: "Renold",
        infoPemesan: "10 RPL C",
        kodeUnikPemesan: "1234",
        userKey: "renold_10 rpl c",
        metode: "Take Away (Ambil di Kantin)",
        namaMenu: "Aneka Olahan Mie",
        varian: "Aceh",
        qty: 1,
        harga: 7000,
        catatan: "Telur dadar ya bu, jangan terlalu pedas.",
        waktu: "09:45",
        status: "Sedang Dimasak",
        chats: [
            { sender: "kantin", text: "Siap Renold, segera dimasak", waktu: "09:46" }
        ]
    }
];

// ================= STATE MANAGEMENT =================
let menuData = loadMenu();
let orderData = loadOrders();
let currentUser = JSON.parse(localStorage.getItem('kantin_user_session')) || null;
let itemDipilih = null;

function loadMenu() {
    const raw = localStorage.getItem('kantin_menu_store');
    if (!raw) return DEFAULT_MENU_TEMPLATE;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_MENU_TEMPLATE;
    } catch {
        return DEFAULT_MENU_TEMPLATE;
    }
}

function loadOrders() {
    const raw = localStorage.getItem('kantin_orders_store');
    if (!raw) return DUMMY_ORDERS;
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DUMMY_ORDERS;
    } catch {
        return DUMMY_ORDERS;
    }
}

function saveToStorage() {
    localStorage.setItem('kantin_menu_store', JSON.stringify(menuData));
    localStorage.setItem('kantin_orders_store', JSON.stringify(orderData));
    localStorage.setItem('kantin_user_session', JSON.stringify(currentUser));
}

function muatUlangDataDummy() {
    if (confirm("Reset ulang semua data menu dan pesanan ke data awal pengujian?")) {
        localStorage.removeItem('kantin_menu_store');
        localStorage.removeItem('kantin_orders_store');
        localStorage.removeItem('kantin_user_session');
        localStorage.removeItem('kantin_registered_students');
        menuData = DEFAULT_MENU_TEMPLATE;
        orderData = DUMMY_ORDERS;
        currentUser = null;
        saveToStorage();
        cekSesi();
        alert("Data berhasil di-reset ke kondisi awal!");
    }
}

function formatRupiah(num) {
    return "Rp " + (num || 0).toLocaleString('id-ID');
}

// Sinkronisasi otomatis antar-tab secara real-time
window.addEventListener('storage', (e) => {
    if (e.key === 'kantin_orders_store' || e.key === 'kantin_menu_store') {
        menuData = loadMenu();
        orderData = loadOrders();
        if (currentUser) {
            if (currentUser.role === 'kantin') {
                renderPesananKantin();
                renderMenuKantin();
            } else {
                renderKatalogPembeli();
                renderPesananPembeli();
            }
        }
    }
});

// ================= SISTEM LOGIN DENGAN KODE UNIK SISWA =================
function gantiTabLogin(tab) {
    document.getElementById('tab-btn-murid').classList.toggle('active', tab === 'murid');
    document.getElementById('tab-btn-kantin').classList.toggle('active', tab === 'kantin');

    document.getElementById('form-login-murid').classList.toggle('hidden', tab !== 'murid');
    document.getElementById('form-login-kantin').classList.toggle('hidden', tab !== 'kantin');
}

function loginMurid(e) {
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

    if (registered[userKey]) {
        if (registered[userKey] !== kodeUnik) {
            alert(`Kode unik salah untuk siswa "${nama}" (${kelas})!\nMasukkan kode unik yang Anda buat saat pertama kali mendaftar agar akun tidak tertukar.`);
            return;
        }
    } else {
        registered[userKey] = kodeUnik;
        localStorage.setItem('kantin_registered_students', JSON.stringify(registered));
    }

    currentUser = {
        role: "murid",
        nama: nama,
        kelas: kelas,
        kodeUnik: kodeUnik,
        userKey: userKey
    };

    saveToStorage();
    cekSesi();
}

function loginKantin(e) {
    e.preventDefault();
    const kId = parseInt(document.getElementById('select-kantin-login').value, 10);
    const pass = document.getElementById('input-pass-kantin').value;

    if (pass !== "kantin123") {
        alert("Password salah! (Default: kantin123)");
        return;
    }

    const mapNama = {
        1: "Kantin 1 (Bu Siti)",
        2: "Kantin 2 (Pak Joko)",
        3: "Kantin 3 (Mbak Rini)",
        4: "Kantin 4 (Barokah)",
        5: "Kantin 5 (Mas Budi)",
        6: "Kantin 6 (Berkah)"
    };

    currentUser = { role: "kantin", kantinId: kId, nama: mapNama[kId] };
    saveToStorage();
    cekSesi();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kantin_user_session');
    cekSesi();
}

function cekSesi() {
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

    if (view === 'menu') {
        renderKatalogPembeli();
    } else {
        renderPesananPembeli();
    }
}

function renderKatalogPembeli() {
    const grid = document.getElementById('grid-menu-pembeli');
    const filter = document.getElementById('filter-kantin').value;
    grid.innerHTML = "";

    menuData = loadMenu();
    const items = menuData.filter(m => filter === "all" || String(m.kantinId) === filter);

    items.forEach(item => {
        const habis = item.stok <= 0;
        const card = document.createElement('div');
        card.className = "menu-card";
        card.innerHTML = `
            <div class="img-box">
                <img src="${item.foto}" alt="${item.nama}">
            </div>
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

// ================= MODAL PEMESANAN (HARGA TETAP) =================
function bukaModalPesan(itemId) {
    menuData = loadMenu();
    itemDipilih = menuData.find(m => m.id === itemId);
    if (!itemDipilih || itemDipilih.stok <= 0) return;

    document.getElementById('modal-nama-menu').innerText = `Pesan: ${itemDipilih.nama}`;
    document.getElementById('modal-kantin-menu').innerText = `${itemDipilih.namaKantin} • Sistem Take Away`;
    document.getElementById('input-catatan-pesan').value = "";
    document.getElementById('input-jumlah-porsi').value = 1;
    document.getElementById('input-jumlah-porsi').max = itemDipilih.stok;

    // Load Varian ke dalam select box tunggal
    const selectVarian = document.getElementById('select-varian-item');
    selectVarian.innerHTML = "";
    
    let varianArray = itemDipilih.varianList || ["Original"];
    if (typeof varianArray === 'string') {
        varianArray = varianArray.split(',').map(v => v.trim());
    }

    varianArray.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v;
        opt.innerText = v;
        selectVarian.appendChild(opt);
    });

    document.getElementById('modal-harga-menu').dataset.hargaDasar = itemDipilih.harga;
    updateTotalHargaPesan();
    
    document.getElementById('modal-pesan').classList.remove('hidden');
}

function updateTotalHargaPesan() {
    const qtyInput = document.getElementById('input-jumlah-porsi');
    let qty = parseInt(qtyInput.value, 10);
    
    if (qty < 1 || isNaN(qty)) {
        qty = 1;
        qtyInput.value = 1;
    }
    if (qty > itemDipilih.stok) {
        qty = itemDipilih.stok;
        qtyInput.value = itemDipilih.stok;
        alert(`Maksimal pesanan adalah sisa stok: ${itemDipilih.stok}`);
    }

    const hargaDasar = parseInt(document.getElementById('modal-harga-menu').dataset.hargaDasar, 10);
    const totalHarga = hargaDasar * qty;
    
    document.getElementById('modal-harga-menu').innerText = `Total: ${formatRupiah(totalHarga)}`;
    document.getElementById('modal-harga-menu').dataset.currentTotal = totalHarga;
}

function tutupModalPesan() {
    itemDipilih = null;
    document.getElementById('modal-pesan').classList.add('hidden');
}

function konfirmasiKirimPesanan() {
    if (!itemDipilih || itemDipilih.stok <= 0) return;

    const catatan = document.getElementById('input-catatan-pesan').value.trim();
    const varian = document.getElementById('select-varian-item').value;
    const qty = parseInt(document.getElementById('input-jumlah-porsi').value, 10);
    const totalHarga = parseInt(document.getElementById('modal-harga-menu').dataset.currentTotal, 10) || (itemDipilih.harga * qty);

    itemDipilih.stok -= qty;

    const orderBaru = {
        id: String(Date.now()),
        kantinId: parseInt(itemDipilih.kantinId, 10),
        namaPemesan: currentUser.nama,
        infoPemesan: currentUser.kelas,
        kodeUnikPemesan: currentUser.kodeUnik,
        userKey: currentUser.userKey,
        metode: "Take Away (Ambil di Kantin)",
        namaMenu: `${itemDipilih.nama}`,
        qty: qty,
        varian: varian,
        harga: totalHarga,
        catatan: catatan || "Tanpa catatan tambahan.",
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        status: "Menunggu",
        chats: []
    };

    orderData = loadOrders();
    orderData.unshift(orderBaru);
    saveToStorage();
    tutupModalPesan();
    renderKatalogPembeli();
    alert(`Pesanan Take Away untuk "${itemDipilih.nama}" berhasil dikirim ke ${itemDipilih.namaKantin}!`);
}

function renderPesananPembeli() {
    const list = document.getElementById('list-pesanan-pembeli');
    list.innerHTML = "";

    orderData = loadOrders();
    
    const myOrders = orderData.filter(p => {
        if (p.userKey && currentUser.userKey) {
            return p.userKey === currentUser.userKey;
        }
        return (p.namaPemesan || "").trim().toLowerCase() === (currentUser.nama || "").trim().toLowerCase();
    });

    if (myOrders.length === 0) {
        list.innerHTML = `<p class="text-muted">Belum ada riwayat pesanan untuk akun Anda (${currentUser.nama} - ${currentUser.kelas}).</p>`;
        return;
    }

    myOrders.forEach(o => {
        const card = document.createElement('div');
        card.className = "order-card";

        let badgeClass = "badge-menunggu";
        if (o.status === "Sedang Dimasak") badgeClass = "badge-proses";
        if (o.status === "Siap Diambil") badgeClass = "badge-selesai";

        let chatHTML = "";
        if (o.chats && o.chats.length > 0) {
            chatHTML = o.chats.map(c => {
                const isSelf = (c.sender === 'murid');
                return `
                    <div class="chat-bubble ${isSelf ? 'chat-self' : 'chat-other'}">
                        <div class="chat-sender-label">${isSelf ? 'Saya (Anda)' : 'Penjual ' + getNamaKantinById(o.kantinId)}:</div>
                        <div>${c.text}</div>
                        <div class="chat-time">${c.waktu}</div>
                    </div>
                `;
            }).join('');
        } else {
            chatHTML = `<span class="text-muted" style="font-size:11px;">Belum ada pesan dengan kantin. Ketik di bawah jika ingin bertanya ke penjual.</span>`;
        }

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <strong>${o.namaMenu} (${o.qty} Porsi)</strong> - ${formatRupiah(o.harga)}<br>
                    <small class="text-muted">Kantin: ${getNamaKantinById(o.kantinId)} • Waktu: ${o.waktu}</small><br>
                    <span class="order-varian-box">Varian: ${o.varian}</span><br>
                    <span class="order-note-box">Catatan: "${o.catatan}"</span><br>
                    <span class="takeaway-tag">📦 ${o.metode}</span>
                </div>
                <div>
                    <span class="badge-status ${badgeClass}">${o.status}</span>
                </div>
            </div>

            <div class="chat-section">
                <div class="chat-toggle-title">💬 Chat dengan Penjual Kantin:</div>
                <div class="chat-history" id="chat-box-murid-${o.id}">${chatHTML}</div>
                <div class="chat-form">
                    <input type="text" id="input-chat-murid-${o.id}" placeholder="Ketik pesan untuk penjual..." onkeydown="if(event.key==='Enter') kirimPesanMurid('${o.id}')">
                    <button type="button" class="btn btn-primary btn-sm" onclick="kirimPesanMurid('${o.id}')">Kirim Pesan</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function kirimPesanMurid(orderId) {
    const input = document.getElementById(`input-chat-murid-${orderId}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    orderData = loadOrders();
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) {
        alert("Pesanan tidak ditemukan!");
        return;
    }

    if (!order.chats) order.chats = [];

    order.chats.push({
        sender: "murid",
        text: text,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

    saveToStorage();
    input.value = "";
    renderPesananPembeli();

    const box = document.getElementById(`chat-box-murid-${orderId}`);
    if (box) box.scrollTop = box.scrollHeight;
}

// ================= DASHBOARD PENJUAL KANTIN =================
function switchKantinView(view) {
    document.getElementById('btn-tab-kantin-pesanan').classList.toggle('active', view === 'pesanan');
    document.getElementById('btn-tab-kantin-menu').classList.toggle('active', view === 'menu');
    document.getElementById('kantin-view-pesanan').classList.toggle('hidden', view !== 'pesanan');
    document.getElementById('kantin-view-menu').classList.toggle('hidden', view !== 'menu');

    if (view === 'pesanan') {
        renderPesananKantin();
    } else {
        renderMenuKantin();
    }
}

function renderPesananKantin() {
    const list = document.getElementById('list-pesanan-masuk');
    const filterStatusEl = document.getElementById('filter-status-pesanan');
    const filterStatus = filterStatusEl ? filterStatusEl.value : 'all';
    list.innerHTML = "";

    orderData = loadOrders();

    const targetKantinId = parseInt(currentUser.kantinId, 10);
    const masuk = orderData.filter(o => {
        const cocokKantin = parseInt(o.kantinId, 10) === targetKantinId;
        const cocokStatus = filterStatus === 'all' || o.status === filterStatus;
        return cocokKantin && cocokStatus;
    });

    const countMenunggu = orderData.filter(o => parseInt(o.kantinId, 10) === targetKantinId && o.status !== 'Siap Diambil').length;
    const badge = document.getElementById('badge-pesanan-kantin');
    if (badge) {
        if (countMenunggu > 0) {
            badge.innerText = countMenunggu;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (masuk.length === 0) {
        list.innerHTML = `<p class="text-muted">Belum ada pesanan masuk untuk kantin Anda.</p>`;
        return;
    }

    masuk.forEach(o => {
        const card = document.createElement('div');
        card.className = "order-card";

        let badgeClass = "badge-menunggu";
        if (o.status === "Sedang Dimasak") badgeClass = "badge-proses";
        if (o.status === "Siap Diambil") badgeClass = "badge-selesai";

        let chatHTML = "";
        if (o.chats && o.chats.length > 0) {
            chatHTML = o.chats.map(c => {
                const isSelf = (c.sender === 'kantin');
                return `
                    <div class="chat-bubble ${isSelf ? 'chat-self' : 'chat-other'}">
                        <div class="chat-sender-label">${isSelf ? 'Saya (Penjual)' : o.namaPemesan + ' (' + o.infoPemesan + ')'}:</div>
                        <div>${c.text}</div>
                        <div class="chat-time">${c.waktu}</div>
                    </div>
                `;
            }).join('');
        } else {
            chatHTML = `<span class="text-muted" style="font-size:11px;">Belum ada obrolan. Balas di bawah untuk memberi info stok / konfirmasi.</span>`;
        }

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <span class="badge-status badge-menunggu">Siswa: ${o.infoPemesan} (Kode: ${o.kodeUnikPemesan || '-'})</span>
                    <h4 style="margin-top:5px;">${o.namaMenu} (${o.qty} Porsi) - ${formatRupiah(o.harga)}</h4>
                    <p style="font-size:13px;">Pemesan: <strong>${o.namaPemesan}</strong> • Waktu: ${o.waktu}</p>
                    <span class="order-varian-box">Varian: ${o.varian}</span><br>
                    <span class="order-note-box">Catatan: "${o.catatan}"</span><br>
                    <span class="takeaway-tag">📦 ${o.metode}</span>
                </div>
                <div>
                    <span class="badge-status ${badgeClass}">Status: ${o.status}</span>
                    <div class="status-actions">
                        <button type="button" class="btn btn-sm btn-secondary" onclick="ubahStatusPesanan('${o.id}', 'Sedang Dimasak')">🍳 Dimasak</button>
                        <button type="button" class="btn btn-sm btn-success" onclick="ubahStatusPesanan('${o.id}', 'Siap Diambil')">🔔 Siap Diambil</button>
                    </div>
                </div>
            </div>

            <div class="chat-section">
                <div class="chat-toggle-title">💬 Balas Pesanan / Chat Murid:</div>
                <div class="chat-history" id="chat-box-kantin-${o.id}">${chatHTML}</div>
                <div class="chat-form">
                    <input type="text" id="input-chat-kantin-${o.id}" placeholder="Ketik balasan untuk murid..." onkeydown="if(event.key==='Enter') kirimPesanKantin('${o.id}')">
                    <button type="button" class="btn btn-primary btn-sm" onclick="kirimPesanKantin('${o.id}')">Kirim Balasan</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

function ubahStatusPesanan(orderId, statusBaru) {
    orderData = loadOrders();
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (order) {
        order.status = statusBaru;
        saveToStorage();
        renderPesananKantin();
    }
}

function kirimPesanKantin(orderId) {
    const input = document.getElementById(`input-chat-kantin-${orderId}`);
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    orderData = loadOrders();
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) return;

    if (!order.chats) order.chats = [];

    order.chats.push({
        sender: "kantin",
        text: text,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

    saveToStorage();
    input.value = "";
    renderPesananKantin();

    const box = document.getElementById(`chat-box-kantin-${orderId}`);
    if (box) box.scrollTop = box.scrollHeight;
}

// ================= FITUR TAMBAH & KELOLA MENU (VARIAN KOMA) =================
function renderMenuKantin() {
    const grid = document.getElementById('grid-menu-kantin');
    grid.innerHTML = "";

    menuData = loadMenu();
    const targetKantinId = parseInt(currentUser.kantinId, 10);
    const myMenu = menuData.filter(m => parseInt(m.kantinId, 10) === targetKantinId);

    if (myMenu.length === 0) {
        grid.innerHTML = `<p class="text-muted">Belum ada menu di kantin Anda. Klik "Tambah Menu Baru" di atas untuk menambahkan.</p>`;
        return;
    }

    myMenu.forEach(item => {
        const card = document.createElement('div');
        card.className = "menu-card";
        
        // Pastikan array selalu valid
        let listStr = "Original";
        if (Array.isArray(item.varianList)) {
            listStr = item.varianList.join(", ");
        } else if (typeof item.varianList === 'string') {
            listStr = item.varianList;
        }

        card.innerHTML = `
            <div class="img-box">
                <img src="${item.foto}" alt="${item.nama}">
            </div>
            <div class="menu-content">
                <span class="tag-kantin">[${item.kategori}]</span>
                <h4 class="menu-title">${item.nama}</h4>
                <p class="menu-desc">${item.desc}</p>
                <p class="menu-price">Harga Dasar: ${formatRupiah(item.harga)}</p>
                
                <div class="kantin-edit-panel">
                    <label>Ubah Harga Dasar (Rp):</label>
                    <input type="number" class="input-harga-edit" value="${item.harga}" onchange="updateHargaMenu(${item.id}, this.value)">

                    <label>Varian (Pisahkan dgn koma):</label>
                    <input type="text" class="input-harga-edit" value="${listStr}" onchange="updateVarianMenu(${item.id}, this.value)">

                    <label>Atur Jumlah Stok:</label>
                    <div class="stock-control-row">
                        <button type="button" class="btn-stock" onclick="updateStokMenu(${item.id}, -1)">- 1</button>
                        <input type="number" class="stock-input" value="${item.stok}" onchange="setStokManual(${item.id}, this.value)">
                        <button type="button" class="btn-stock" onclick="updateStokMenu(${item.id}, 1)">+ 1</button>
                        <button type="button" class="btn-stock" onclick="updateStokMenu(${item.id}, 5)">+ 5</button>
                    </div>

                    <label>Ganti Foto Thumbnail:</label>
                    <input type="file" class="file-input" accept="image/*" onchange="uploadFotoMenu(${item.id}, this)">

                    <button type="button" class="btn-delete-menu" onclick="hapusMenu(${item.id})">🗑️ Hapus Menu Ini</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function updateVarianMenu(itemId, varianStr) {
    menuData = loadMenu();
    const item = menuData.find(m => m.id === itemId);
    if (item) {
        const arr = varianStr.split(',').map(v => v.trim()).filter(v => v !== "");
        item.varianList = arr.length > 0 ? arr : ["Original"];
        saveToStorage();
    }
}

function updateHargaMenu(itemId, hargaBaru) {
    menuData = loadMenu();
    const item = menuData.find(m => m.id === itemId);
    if (item) {
        item.harga = Math.max(0, parseInt(hargaBaru, 10) || 0);
        saveToStorage();
    }
}

function updateStokMenu(itemId, delta) {
    menuData = loadMenu();
    const item = menuData.find(m => m.id === itemId);
    if (item) {
        if (item.stok + delta < 0) {
            alert("Stok tidak boleh minus!");
            return;
        }
        item.stok += delta;
        saveToStorage();
        renderMenuKantin();
    }
}

function setStokManual(itemId, val) {
    menuData = loadMenu();
    const item = menuData.find(m => m.id === itemId);
    if (item) {
        item.stok = Math.max(0, parseInt(val, 10) || 0);
        saveToStorage();
        renderMenuKantin();
    }
}

function uploadFotoMenu(itemId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        menuData = loadMenu();
        const item = menuData.find(m => m.id === itemId);
        if (item) {
            item.foto = e.target.result;
            saveToStorage();
            renderMenuKantin();
        }
    };
    reader.readAsDataURL(file);
}

function hapusMenu(itemId) {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini dari dagangan?")) {
        menuData = loadMenu();
        menuData = menuData.filter(m => m.id !== itemId);
        saveToStorage();
        renderMenuKantin();
    }
}

function bukaModalTambahMenu() {
    document.getElementById('new-menu-nama').value = "";
    document.getElementById('new-menu-varian').value = "";
    document.getElementById('new-menu-harga').value = "";
    document.getElementById('new-menu-stok').value = "";
    document.getElementById('new-menu-desc').value = "";
    document.getElementById('new-menu-foto').value = "";
    document.getElementById('modal-tambah-menu').classList.remove('hidden');
}

function tutupModalTambahMenu() {
    document.getElementById('modal-tambah-menu').classList.add('hidden');
}

function simpanMenuBaru(e) {
    e.preventDefault();
    const nama = document.getElementById('new-menu-nama').value.trim();
    const kategori = document.getElementById('new-menu-kategori').value;
    const varianStr = document.getElementById('new-menu-varian').value;
    const hargaDasar = parseInt(document.getElementById('new-menu-harga').value, 10) || 0;
    const stok = parseInt(document.getElementById('new-menu-stok').value, 10) || 0;
    const desc = document.getElementById('new-menu-desc').value.trim();
    const fotoFile = document.getElementById('new-menu-foto').files[0];

    const arrVarian = varianStr.split(',').map(v => v.trim()).filter(v => v !== "");
    const finalVarian = arrVarian.length > 0 ? arrVarian : ["Original"];
    const defaultFoto = "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400";

    function proceedAdd(fotoUrl) {
        menuData = loadMenu();
        const newId = Date.now();
        const newItem = {
            id: newId,
            kantinId: parseInt(currentUser.kantinId, 10),
            namaKantin: currentUser.nama,
            nama: nama,
            kategori: kategori,
            desc: desc,
            harga: hargaDasar,
            stok: stok,
            foto: fotoUrl,
            varianList: finalVarian
        };
        menuData.push(newItem);
        saveToStorage();
        tutupModalTambahMenu();
        renderMenuKantin();
        alert(`Menu baru "${nama}" berhasil ditambahkan!`);
    }

    if (fotoFile) {
        const reader = new FileReader();
        reader.onload = function(evt) {
            proceedAdd(evt.target.result);
        };
        reader.readAsDataURL(fotoFile);
    } else {
        proceedAdd(defaultFoto);
    }
}

function getNamaKantinById(id) {
    const map = {
        1: "Kantin 1 (Bu Siti)",
        2: "Kantin 2 (Pak Joko)",
        3: "Kantin 3 (Mbak Rini)",
        4: "Kantin 4 (Barokah)",
        5: "Kantin 5 (Mas Budi)",
        6: "Kantin 6 (Berkah)"
    };
    return map[id] || `Kantin ${id}`;
}

window.addEventListener('DOMContentLoaded', () => {
    cekSesi();
});