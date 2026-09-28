// ================= KONFIGURASI SUPABASE =================
const SUPABASE_URL = 'https://bxwvagtuyerqjmqkkmta.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_4mDuRGKRn_va09DOIe4wiQ_RIgO-1sd';

// Inisialisasi klien Supabase
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// ================= STATE MANAGEMENT =================
let menuData = [];
let orderData = [];
let currentUser = JSON.parse(localStorage.getItem('kantin_user_session')) || null;
let itemDipilih = null;

// Mengambil data menu dari Supabase
async function loadMenu() {
    try {
        const { data, error } = await _supabase
            .from('menu_kantin')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        menuData = data && data.length > 0 ? data : [];
        return menuData;
    } catch (err) {
        console.error('Gagal memuat menu dari Supabase:', err.message);
        return [];
    }
}

// Mengambil data pesanan dari Supabase
async function loadOrders() {
    try {
        const { data, error } = await _supabase
            .from('pesanan_kantin')
            .select('*')
            .order('id', { ascending: false });

        if (error) throw error;
        orderData = data || [];
        return orderData;
    } catch (err) {
        console.error('Gagal memuat pesanan dari Supabase:', err.message);
        return [];
    }
}

function saveUserSession() {
    localStorage.setItem('kantin_user_session', JSON.stringify(currentUser));
}

async function muatUlangDataDummy() {
    if (confirm("Reset ulang sesi akun dan sinkronisasi data?")) {
        localStorage.removeItem('kantin_user_session');
        currentUser = null;
        cekSesi();
        await loadMenu();
        await loadOrders();
        alert("Sesi berhasil di-reset!");
    }
}

function formatRupiah(num) {
    return "Rp " + (num || 0).toLocaleString('id-ID');
}

// ================= SISTEM LOGIN DENGAN KODE UNIK SISWA =================
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

    try {
        const { data: existing, error: fetchErr } = await _supabase
            .from('registered_students')
            .select('*')
            .eq('user_key', userKey)
            .maybeSingle();

        if (fetchErr) throw fetchErr;

        if (existing) {
            if (existing.kode_unik !== kodeUnik) {
                alert(`Kode unik salah untuk siswa "${nama}" (${kelas})!\nMasukkan kode unik yang benar.`);
                return;
            }
        } else {
            await _supabase.from('registered_students').insert([{
                user_key: userKey,
                nama: nama,
                kelas: kelas,
                kode_unik: kodeUnik
            }]);
        }
    } catch (err) {
        console.error('Error validasi siswa:', err.message);
    }

    currentUser = {
        role: "murid",
        nama: nama,
        kelas: kelas,
        kodeUnik: kodeUnik,
        userKey: userKey
    };

    saveUserSession();
    await cekSesi();
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
    saveUserSession();
    cekSesi();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('kantin_user_session');
    cekSesi();
}

async function cekSesi() {
    const vLogin = document.getElementById('view-login');
    const vPembeli = document.getElementById('view-pembeli');
    const vKantin = document.getElementById('view-kantin');
    const userBar = document.getElementById('user-session-bar');
    const userText = document.getElementById('session-user-text');

    if (!vLogin || !vPembeli || !vKantin) return;

    vLogin.classList.add('hidden');
    vPembeli.classList.add('hidden');
    vKantin.classList.add('hidden');
    if (userBar) userBar.classList.add('hidden');

    if (!currentUser) {
        vLogin.classList.remove('hidden');
        return;
    }

    if (userBar) userBar.classList.remove('hidden');

    await loadMenu();
    await loadOrders();

    if (currentUser.role === 'kantin') {
        if (userText) userText.innerText = `Pemilik: ${currentUser.nama}`;
        vKantin.classList.remove('hidden');
        const lblPesanan = document.getElementById('label-kantin-pesanan');
        const lblMenu = document.getElementById('label-kantin-menu');
        if (lblPesanan) lblPesanan.innerText = `Pesanan Masuk - ${currentUser.nama}`;
        if (lblMenu) lblMenu.innerText = `Kelola Menu & Stok - ${currentUser.nama}`;
        switchKantinView('pesanan');
    } else {
        if (userText) userText.innerText = `🎓 Siswa: ${currentUser.nama} (${currentUser.kelas}) • Kode: ${currentUser.kodeUnik}`;
        vPembeli.classList.remove('hidden');
        switchPembeliView('menu');
    }
}

// ================= DASHBOARD MURID =================
async function switchPembeliView(view) {
    const btnMenu = document.getElementById('btn-tab-pembeli-menu');
    const btnPesanan = document.getElementById('btn-tab-pembeli-pesanan');
    const viewMenu = document.getElementById('pembeli-view-menu');
    const viewPesanan = document.getElementById('pembeli-view-pesanan');

    if (btnMenu) btnMenu.classList.toggle('active', view === 'menu');
    if (btnPesanan) btnPesanan.classList.toggle('active', view === 'pesanan');
    if (viewMenu) viewMenu.classList.toggle('hidden', view !== 'menu');
    if (viewPesanan) viewPesanan.classList.toggle('hidden', view !== 'pesanan');

    if (view === 'menu') {
        await renderKatalogPembeli();
    } else {
        await renderPesananPembeli();
    }
}

async function renderKatalogPembeli() {
    const grid = document.getElementById('grid-menu-pembeli');
    const filterEl = document.getElementById('filter-kantin');
    if (!grid) return;

    const filter = filterEl ? filterEl.value : "all";
    grid.innerHTML = "Memuat menu...";

    await loadMenu();
    const items = menuData.filter(m => filter === "all" || String(m.kantinId || m.kantin_id) === filter);
    grid.innerHTML = "";

    if (items.length === 0) {
        grid.innerHTML = `<p class="text-muted">Belum ada menu tersedia.</p>`;
        return;
    }

    items.forEach(item => {
        const habis = item.stok <= 0;
        const card = document.createElement('div');
        card.className = "menu-card";
        card.innerHTML = `
            <div class="img-box">
                <img src="${item.foto}" alt="${item.nama}">
            </div>
            <div class="menu-content">
                <span class="tag-kantin">${item.namaKantin || item.nama_kantin} • [${item.kategori}]</span>
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
    document.getElementById('modal-kantin-menu').innerText = `${itemDipilih.namaKantin || itemDipilih.nama_kantin} • Sistem Take Away`;
    document.getElementById('input-catatan-pesan').value = "";
    document.getElementById('input-jumlah-porsi').value = 1;
    document.getElementById('input-jumlah-porsi').max = itemDipilih.stok;

    const selectVarian = document.getElementById('select-varian-item');
    selectVarian.innerHTML = "";
    
    let varianArray = itemDipilih.varianList || item.varian_list || ["Original"];
    if (typeof varianArray === 'string') {
        try { varianArray = JSON.parse(varianArray); } catch { varianArray = varianArray.split(',').map(v => v.trim()); }
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
    const totalHarga = parseInt(document.getElementById('modal-harga-menu').dataset.currentTotal, 10) || (itemDipilih.harga * qty);

    const stokBaru = itemDipilih.stok - qty;

    try {
        const { error: errUpdate } = await _supabase
            .from('menu_kantin')
            .update({ stok: stokBaru })
            .eq('id', itemDipilih.id);

        if (errUpdate) throw errUpdate;

        const orderBaru = {
            kantin_id: parseInt(itemDipilih.kantinId || itemDipilih.kantin_id, 10),
            nama_pemesan: currentUser.nama,
            info_pemesan: currentUser.kelas,
            kode_unik_pemesan: currentUser.kodeUnik,
            user_key: currentUser.userKey,
            metode: "Take Away (Ambil di Kantin)",
            nama_menu: `${itemDipilih.nama}`,
            qty: qty,
            varian: varian,
            harga: totalHarga,
            catatan: catatan || "Tanpa catatan tambahan.",
            waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            status: "Menunggu",
            chats: []
        };

        const { error: errOrder } = await _supabase
            .from('pesanan_kantin')
            .insert([orderBaru]);

        if (errOrder) throw errOrder;

        tutupModalPesan();
        await renderKatalogPembeli();
        alert(`Pesanan Take Away untuk "${itemDipilih.nama}" berhasil dikirim!`);
    } catch (err) {
        console.error('Gagal mengirim pesanan:', err.message);
        alert('Terjadi kesalahan saat memproses pesanan.');
    }
}

async function renderPesananPembeli() {
    const list = document.getElementById('list-pesanan-pembeli');
    if (!list) return;
    list.innerHTML = "Memuat pesanan...";

    await loadOrders();
    const myOrders = orderData.filter(p => {
        const uKey = p.user_key || p.userKey;
        if (uKey && currentUser.userKey) return uKey === currentUser.userKey;
        return (p.nama_pemesan || p.namaPemesan || "").trim().toLowerCase() === (currentUser.nama || "").trim().toLowerCase();
    });

    list.innerHTML = "";
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
        let chatsArr = o.chats || [];
        if (typeof chatsArr === 'string') { try { chatsArr = JSON.parse(chatsArr); } catch { chatsArr = []; } }

        if (chatsArr.length > 0) {
            chatHTML = chatsArr.map(c => {
                const isSelf = (c.sender === 'murid');
                return `
                    <div class="chat-bubble ${isSelf ? 'chat-self' : 'chat-other'}">
                        <div class="chat-sender-label">${isSelf ? 'Saya (Anda)' : 'Penjual ' + getNamaKantinById(o.kantin_id || o.kantinId)}:</div>
                        <div>${c.text}</div>
                        <div class="chat-time">${c.waktu}</div>
                    </div>
                `;
            }).join('');
        } else {
            chatHTML = `<span class="text-muted" style="font-size:11px;">Belum ada pesan dengan kantin.</span>`;
        }

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <strong>${o.nama_menu || o.namaMenu} (${o.qty} Porsi)</strong> - ${formatRupiah(o.harga)}<br>
                    <small class="text-muted">Kantin: ${getNamaKantinById(o.kantin_id || o.kantinId)} • Waktu: ${o.waktu}</small><br>
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
                    <input type="text" id="input-chat-murid-${o.id}" placeholder="Ketik pesan..." onkeydown="if(event.key==='Enter') kirimPesanMurid('${o.id}')">
                    <button type="button" class="btn btn-primary btn-sm" onclick="kirimPesanMurid('${o.id}')">Kirim</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function kirimPesanMurid(orderId) {
    const input = document.getElementById(`input-chat-murid-${orderId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    await loadOrders();
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) return;

    let chatsArr = order.chats || [];
    if (typeof chatsArr === 'string') { try { chatsArr = JSON.parse(chatsArr); } catch { chatsArr = []; } }

    chatsArr.push({
        sender: "murid",
        text: text,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

    try {
        await _supabase.from('pesanan_kantin').update({ chats: chatsArr }).eq('id', orderId);
        input.value = "";
        await renderPesananPembeli();
    } catch (err) {
        console.error('Gagal kirim pesan:', err.message);
    }
}

// ================= DASHBOARD PENJUAL KANTIN =================
async function switchKantinView(view) {
    const btnPesanan = document.getElementById('btn-tab-kantin-pesanan');
    const btnMenu = document.getElementById('btn-tab-kantin-menu');
    const viewPesanan = document.getElementById('kantin-view-pesanan');
    const viewMenu = document.getElementById('kantin-view-menu');

    if (btnPesanan) btnPesanan.classList.toggle('active', view === 'pesanan');
    if (btnMenu) btnMenu.classList.toggle('active', view === 'menu');
    if (viewPesanan) viewPesanan.classList.toggle('hidden', view !== 'pesanan');
    if (viewMenu) viewMenu.classList.toggle('hidden', view !== 'menu');

    if (view === 'pesanan') {
        await renderPesananKantin();
    } else {
        await renderMenuKantin();
    }
}

async function renderPesananKantin() {
    const list = document.getElementById('list-pesanan-masuk');
    const filterStatusEl = document.getElementById('filter-status-pesanan');
    if (!list) return;

    const filterStatus = filterStatusEl ? filterStatusEl.value : 'all';
    list.innerHTML = "Memuat pesanan...";

    await loadOrders();
    const targetKantinId = parseInt(currentUser.kantinId, 10);
    const masuk = orderData.filter(o => {
        const kId = parseInt(o.kantin_id || o.kantinId, 10);
        const cocokKantin = kId === targetKantinId;
        const cocokStatus = filterStatus === 'all' || o.status === filterStatus;
        return cocokKantin && cocokStatus;
    });

    list.innerHTML = "";
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
        let chatsArr = o.chats || [];
        if (typeof chatsArr === 'string') { try { chatsArr = JSON.parse(chatsArr); } catch { chatsArr = []; } }

        if (chatsArr.length > 0) {
            chatHTML = chatsArr.map(c => {
                const isSelf = (c.sender === 'kantin');
                return `
                    <div class="chat-bubble ${isSelf ? 'chat-self' : 'chat-other'}">
                        <div class="chat-sender-label">${isSelf ? 'Saya (Penjual)' : (o.nama_pemesan || o.namaPemesan) + ' (' + (o.info_pemesan || o.infoPemesan) + ')'}:</div>
                        <div>${c.text}</div>
                        <div class="chat-time">${c.waktu}</div>
                    </div>
                `;
            }).join('');
        } else {
            chatHTML = `<span class="text-muted" style="font-size:11px;">Belum ada obrolan.</span>`;
        }

        card.innerHTML = `
            <div class="order-top">
                <div>
                    <span class="badge-status badge-menunggu">Siswa: ${o.info_pemesan || o.infoPemesan} (Kode: ${o.kode_unik_pemesan || o.kodeUnikPemesan || '-'})</span>
                    <h4 style="margin-top:5px;">${o.nama_menu || o.namaMenu} (${o.qty} Porsi) - ${formatRupiah(o.harga)}</h4>
                    <p style="font-size:13px;">Pemesan: <strong>${o.nama_pemesan || o.namaPemesan}</strong> • Waktu: ${o.waktu}</p>
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
                    <input type="text" id="input-chat-kantin-${o.id}" placeholder="Balas pesan..." onkeydown="if(event.key==='Enter') kirimPesanKantin('${o.id}')">
                    <button type="button" class="btn btn-primary btn-sm" onclick="kirimPesanKantin('${o.id}')">Kirim</button>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

async function ubahStatusPesanan(orderId, statusBaru) {
    try {
        await _supabase.from('pesanan_kantin').update({ status: statusBaru }).eq('id', orderId);
        await renderPesananKantin();
    } catch (err) {
        console.error('Gagal update status:', err.message);
    }
}

async function kirimPesanKantin(orderId) {
    const input = document.getElementById(`input-chat-kantin-${orderId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    await loadOrders();
    const order = orderData.find(o => String(o.id) === String(orderId));
    if (!order) return;

    let chatsArr = order.chats || [];
    if (typeof chatsArr === 'string') { try { chatsArr = JSON.parse(chatsArr); } catch { chatsArr = []; } }

    chatsArr.push({
        sender: "kantin",
        text: text,
        waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    });

    try {
        await _supabase.from('pesanan_kantin').update({ chats: chatsArr }).eq('id', orderId);
        input.value = "";
        await renderPesananKantin();
    } catch (err) {
        console.error('Gagal kirim pesan kantin:', err.message);
    }
}

// ================= KELOLA MENU KANTIN =================
async function renderMenuKantin() {
    const grid = document.getElementById('grid-menu-kantin');
    if (!grid) return;
    grid.innerHTML = "Memuat menu kantin...";

    await loadMenu();
    const targetKantinId = parseInt(currentUser.kantinId, 10);
    const myMenu = menuData.filter(m => parseInt(m.kantinId || m.kantin_id, 10) === targetKantinId);

    grid.innerHTML = "";
    if (myMenu.length === 0) {
        grid.innerHTML = `<p class="text-muted">Belum ada menu di kantin Anda.</p>`;
        return;
    }

    myMenu.forEach(item => {
        const card = document.createElement('div');
        card.className = "menu-card";
        
        let listStr = "Original";
        let vList = item.varianList || item.varian_list;
        if (Array.isArray(vList)) {
            listStr = vList.join(", ");
        } else if (typeof vList === 'string') {
            listStr = vList;
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

async function updateVarianMenu(itemId, varianStr) {
    const arr = varianStr.split(',').map(v => v.trim()).filter(v => v !== "");
    const finalVarian = arr.length > 0 ? arr : ["Original"];
    try {
        await _supabase.from('menu_kantin').update({ varianList: finalVarian }).eq('id', itemId);
    } catch (err) {
        console.error('Gagal update varian:', err.message);
    }
}

async function updateHargaMenu(itemId, hargaBaru) {
    const val = Math.max(0, parseInt(hargaBaru, 10) || 0);
    try {
        await _supabase.from('menu_kantin').update({ harga: val }).eq('id', itemId);
    } catch (err) {
        console.error('Gagal update harga:', err.message);
    }
}

async function updateStokMenu(itemId, delta) {
    const item = menuData.find(m => m.id === itemId);
    if (!item) return;
    const stokBaru = item.stok + delta;
    if (stokBaru < 0) { alert("Stok tidak boleh minus!"); return; }
    
    try {
        await _supabase.from('menu_kantin').update({ stok: stokBaru }).eq('id', itemId);
        await renderMenuKantin();
    } catch (err) {
        console.error('Gagal update stok:', err.message);
    }
}

async function setStokManual(itemId, val) {
    const stokBaru = Math.max(0, parseInt(val, 10) || 0);
    try {
        await _supabase.from('menu_kantin').update({ stok: stokBaru }).eq('id', itemId);
        await renderMenuKantin();
    } catch (err) {
        console.error('Gagal set stok manual:', err.message);
    }
}

async function uploadFotoMenu(itemId, fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            await _supabase.from('menu_kantin').update({ foto: e.target.result }).eq('id', itemId);
            await renderMenuKantin();
        } catch (err) {
            console.error('Gagal upload foto:', err.message);
        }
    };
    reader.readAsDataURL(file);
}

async function hapusMenu(itemId) {
    if (confirm("Apakah Anda yakin ingin menghapus menu ini dari dagangan?")) {
        try {
            await _supabase.from('menu_kantin').delete().eq('id', itemId);
            await renderMenuKantin();
        } catch (err) {
            console.error('Gagal hapus menu:', err.message);
        }
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

async function simpanMenuBaru(e) {
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

    async function proceedAdd(fotoUrl) {
        try {
            const newItem = {
                kantin_id: parseInt(currentUser.kantinId, 10),
                nama_kantin: currentUser.nama,
                nama: nama,
                kategori: kategori,
                desc: desc,
                harga: hargaDasar,
                stok: stok,
                foto: fotoUrl,
                varianList: finalVarian
            };

            const { error } = await _supabase.from('menu_kantin').insert([newItem]);
            if (error) throw error;

            tutupModalTambahMenu();
            await renderMenuKantin();
            alert(`Menu baru "${nama}" berhasil ditambahkan!`);
        } catch (err) {
            console.error('Gagal menambah menu:', err.message);
            alert('Gagal menyimpan menu baru.');
        }
    }

    if (fotoFile) {
        const reader = new FileReader();
        reader.onload = async function(evt) {
            await proceedAdd(evt.target.result);
        };
        reader.readAsDataURL(fotoFile);
    } else {
        await proceedAdd(defaultFoto);
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

window.addEventListener('DOMContentLoaded', async () => {
    await cekSesi();
});
