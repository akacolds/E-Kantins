// ==========================================
// 1. KONFIGURASI SUPABASE
// ==========================================
const SUPABASE_URL = 'https://cysvldwwutctnxqxpvmq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Y1SynvbrTYcicUNEV_iYJQ_EEuNFjHz';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ==========================================
// 2. STATE APLIKASI
// ==========================================
let canteens = [];
let products = [];
let messages = [];
let currentRole = 'siswa';
let activeCanteen = 1;
let currentStudent = { name: '', class: '' };
let selectedOrderProduct = null;
let activeOwnerChatStudent = null; // Nama siswa yang sedang dibuka oleh penjual

const $ = (id) => document.getElementById(id);

function escapeHTML(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================
// 3. LOGIN & IDENTITAS SISWA
// ==========================================
async function handleAuthSubmit(e) {
  e.preventDefault();

  const username = $('auth-username').value.trim();
  const password = $('auth-password').value;
  const btn = $('btn-login-submit');

  btn.disabled = true;
  btn.textContent = 'Memverifikasi...';

  const { data: user, error } = await supabaseClient
    .from('users')
    .select('*')
    .eq('username', username)
    .eq('password', password)
    .maybeSingle();

  btn.disabled = false;
  btn.textContent = 'Masuk sebagai Pengelola';

  if (error || !user) {
    alert('Username atau Password salah!');
    return;
  }

  $('auth-form').reset();
  enterApp(user.role);
}

function openStudentModal() {
  $('modal-student').classList.remove('hidden');$('student-name').focus();
}

function closeStudentModal() {
  $('modal-student').classList.add('hidden');
}

function handleStudentSubmit(e) {
  e.preventDefault();
  const name = $('student-name').value.trim();
  const studentClass = $('student-class').value.trim();

  if (!name || !studentClass) {
    alert('Nama dan kelas wajib diisi!');
    return;
  }

  // Format pengenal siswa: "Nama (Kelas)"
  currentStudent = { name: `${name} (${studentClass})`, class: studentClass };
  closeStudentModal();
  enterApp('siswa');
}

function enterApp(role) {
  $('login-portal').classList.add('hidden');$('main-app').classList.remove('hidden');
  changeRole(role);
}

function logout() {
  currentRole = 'siswa';
  currentStudent = { name: '', class: '' };
  $('main-app').classList.add('hidden');
  $('login-portal').classList.remove('hidden');$('student-chat-modal').classList.add('hidden');
}

function changeRole(role) {
  currentRole = role;

  if (role === 'siswa') {
    $('role-display').textContent = `SISWA: ${currentStudent.name}`;
    $('btn-open-student-chat-direct').classList.remove('hidden');
  } else {
    $('role-display').textContent = `Role: ${role.toUpperCase()}`;
    $('btn-open-student-chat-direct').classList.add('hidden');$('student-chat-modal').classList.add('hidden');
  }

  const adminPage = $('page-admin');
  const ownerPage = $('page-owner');

  adminPage.classList.add('hidden');
  ownerPage.classList.add('hidden');

  if (role === 'admin') {
    adminPage.classList.remove('hidden');
    renderAdminStats();
  } else if (role.startsWith('kantin')) {
    const canteenNum = parseInt(role.replace('kantin', ''));
    ownerPage.classList.remove('hidden');
    $('owner-title').textContent = `Manajemen Menu (Kantin ${canteenNum})`;
    selectCanteen(canteenNum);
    renderOwnerChatList();
  } else {
    selectCanteen(activeCanteen);
  }

  renderCanteen(activeCanteen);
}

// ==========================================
// 4. FETCH DATA
// ==========================================
async function fetchCanteens() {
  const { data, error } = await supabaseClient
    .from('canteens')
    .select('*')
    .order('id', { ascending: true });

  if (error || !data || data.length === 0) {
    canteens = [1, 2, 3, 4, 5, 6].map(i => ({ id: i, name: `Kantin ${i}` }));
  } else {
    canteens = data;
  }

  renderTabs();
}

async function fetchProducts() {
  const list = $('product-list');
  list.innerHTML = `
    <p class="text-slate-400 col-span-full italic text-center py-8">
      Memuat menu makanan...
    </p>
  `;

  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    list.innerHTML = `<p class="text-rose-500 text-center col-span-full">Gagal memuat menu.</p>`;
    return;
  }

  products = (data || []).map(item => ({
    id: item.id,
    canteenId: Number(item.canteen_id),
    name: item.name,
    price: Number(item.price),
    img: item.img || ''
  }));

  renderCanteen(activeCanteen);
  renderAdminStats();
}

async function fetchMessages() {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('*')
    .order('id', { ascending: true });

  if (!error && data) {
    messages = data;
    if (currentRole === 'siswa') {
      renderStudentChatMessages();
    } else if (currentRole.startsWith('kantin')) {
      renderOwnerChatList();
      if (activeOwnerChatStudent) {
        renderOwnerChatMessages(activeOwnerChatStudent);
      }
    }
  }
}

// Tambah produk
async function handleAddProduct(e) {
  e.preventDefault();

  if (!currentRole.startsWith('kantin')) return;
  const canteenNum = parseInt(currentRole.replace('kantin', ''));
  const name = $('prod-name').value.trim();
  const price = parseInt($('prod-price').value);
  const img = $('prod-img').value.trim();

  if (!name || isNaN(price) || price < 0) return;

  const { error } = await supabaseClient
    .from('products')
    .insert([{
      canteen_id: canteenNum,
      name: name,
      price: price,
      img: img || null
    }]);

  if (error) {
    alert('Gagal menambah menu!');
    return;
  }

  $('add-product-form').reset();
  await fetchProducts();
}

// Hapus produk
async function deleteProduct(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  if (currentRole !== 'admin' && currentRole !== `kantin${product.canteenId}`) return;
  if (!confirm(`Hapus menu "${product.name}"?`)) return;

  await supabaseClient.from('products').delete().eq('id', id);
  await fetchProducts();
}

// ==========================================
// 5. SISTEM CHAT REALTIME
// ==========================================
function initRealtime() {
  supabaseClient
    .channel('realtime:messages')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        const newMsg = payload.new;
        messages.push(newMsg);

        // Jika siswa sedang chat dengan kantin ini
        if (
          currentRole === 'siswa' &&
          newMsg.student_name === currentStudent.name &&
          Number(newMsg.canteen_id) === Number(activeCanteen)
        ) {
          appendMessageToStudentBox(newMsg);
        }

        // Jika pengelola kantin sedang online
        if (currentRole.startsWith('kantin')) {
          const canteenNum = parseInt(currentRole.replace('kantin', ''));
          if (Number(newMsg.canteen_id) === canteenNum) {
            renderOwnerChatList();
            if (activeOwnerChatStudent === newMsg.student_name) {
              appendMessageToOwnerBox(newMsg);
            }
          }
        }
      }
    )
    .subscribe();
}

// --- LOGIKA CHAT SISWA ---
function openStudentChatModal(canteenId) {
  activeCanteen = Number(canteenId);
  $('student-chat-title').textContent = `Chat Kantin ${activeCanteen}`;
  $('student-chat-modal').classList.remove('hidden');
  renderStudentChatMessages();
}

function closeStudentChatModal() {
  $('student-chat-modal').classList.add('hidden');
}

function renderStudentChatMessages() {
  const box = $('student-chat-box');
  const filtered = messages.filter(
    m => Number(m.canteen_id) === Number(activeCanteen) && m.student_name === currentStudent.name
  );

  if (filtered.length === 0) {
    box.innerHTML = `<p class="text-slate-400 text-center italic py-10">Mulai kirim pesan ke Kantin ${activeCanteen}...</p>`;
    return;
  }

  box.innerHTML = '';
  filtered.forEach(m => appendMessageToStudentBox(m));
  box.scrollTop = box.scrollHeight;
}

function appendMessageToStudentBox(msg) {
  const box = $('student-chat-box');
  const isMe = msg.sender_type === 'siswa';

  const wrapper = document.createElement('div');
  wrapper.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
    isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
  }`;
  bubble.innerHTML = escapeHTML(msg.message).replace(/\n/g, '<br>');

  const time = document.createElement('span');
  time.className = 'text-[9px] text-slate-400 mt-0.5 px-1';
  time.textContent = isMe ? 'Kamu' : `Kantin ${msg.canteen_id}`;

  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
}

async function handleStudentSendMessage(e) {
  e.preventDefault();
  const input = $('student-chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  await supabaseClient.from('messages').insert([{
    canteen_id: activeCanteen,
    student_name: currentStudent.name,
    sender_type: 'siswa',
    message: text
  }]);
}

// Buka Modal Pesan Menu
function openOrderModal(productId) {
  const prod = products.find(p => p.id === productId);
  if (!prod) return;

  selectedOrderProduct = prod;
  $('order-item-name').textContent = prod.name;
  $('order-item-price').textContent = `Rp ${prod.price.toLocaleString('id-ID')} / porsi`;
  $('order-qty').value = 1;
  $('order-note').value = '';

  $('modal-order').classList.remove('hidden');
}

function closeOrderModal() {
  $('modal-order').classList.add('hidden');
  selectedOrderProduct = null;
}

// Kirim Order Langsung ke Chat Web Realtime
async function handleSendOrder(e) {
  e.preventDefault();
  if (!selectedOrderProduct) return;

  const qty = parseInt($('order-qty').value) || 1;
  const note = $('order-note').value.trim();
  const totalPrice = selectedOrderProduct.price * qty;

  let orderText = `PESANAN BARU:\n`;
  orderText += `• ${selectedOrderProduct.name} x${qty}\n`;
  orderText += `• Total: Rp ${totalPrice.toLocaleString('id-ID')}\n`;
  if (note) orderText += `• Catatan: ${note}\n`;
  orderText += `(Mohon diproses ya kak!)`;

  closeOrderModal();

  // Kirim ke database realtime
  await supabaseClient.from('messages').insert([{
    canteen_id: selectedOrderProduct.canteenId,
    student_name: currentStudent.name,
    sender_type: 'siswa',
    message: orderText
  }]);

  // Otomatis buka chat box kantin tersebut
  openStudentChatModal(selectedOrderProduct.canteenId);
}

// --- LOGIKA CHAT PENGELOLA KANTIN ---
function renderOwnerChatList() {
  const list = $('owner-student-list');
  const canteenNum = parseInt(currentRole.replace('kantin', ''));

  // Ambil nama-nama siswa unik yang pernah chat ke kantin ini
  const canteenMessages = messages.filter(m => Number(m.canteen_id) === canteenNum);
  const students = [...new Set(canteenMessages.map(m => m.student_name))];

  if (students.length === 0) {
    list.innerHTML = `<p class="text-slate-400 text-xs p-4 text-center italic">Belum ada chat masuk.</p>`;
    return;
  }

  list.innerHTML = '';
  students.forEach(student => {
    const lastMsg = canteenMessages.filter(m => m.student_name === student).slice(-1)[0];
    const item = document.createElement('button');
    item.type = 'button';
    item.className = `w-full text-left p-3 hover:bg-slate-50 transition border-b border-slate-100 flex flex-col ${
      activeOwnerChatStudent === student ? 'bg-indigo-50 border-indigo-200' : ''
    }`;

    item.innerHTML = `
      <div class="flex justify-between items-center mb-0.5">
        <span class="font-bold text-xs text-slate-800">${escapeHTML(student)}</span>
      </div>
      <p class="text-[11px] text-slate-500 truncate">${escapeHTML(lastMsg ? lastMsg.message : '')}</p>
    `;

    item.addEventListener('click', () => {
      activeOwnerChatStudent = student;
      renderOwnerChatList();
      renderOwnerChatMessages(student);
    });

    list.appendChild(item);
  });
}

function renderOwnerChatMessages(student) {
  const canteenNum = parseInt(currentRole.replace('kantin', ''));
  const header = $('owner-chat-header');
  const box = $('owner-chat-box');
  const input = $('owner-chat-input');
  const btn = $('owner-chat-btn');

  header.innerHTML = `<span>Sedang chat dengan: <strong>${escapeHTML(student)}</strong></span>`;
  input.disabled = false;
  btn.disabled = false;

  const chatHistory = messages.filter(
    m => Number(m.canteen_id) === canteenNum && m.student_name === student
  );

  box.innerHTML = '';
  chatHistory.forEach(m => appendMessageToOwnerBox(m));
  box.scrollTop = box.scrollHeight;
}

function appendMessageToOwnerBox(msg) {
  const box = $('owner-chat-box');
  const isMe = msg.sender_type === 'kantin';

  const wrapper = document.createElement('div');
  wrapper.className = `flex flex-col ${isMe ? 'items-end' : 'items-start'}`;

  const bubble = document.createElement('div');
  bubble.className = `max-w-[80%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
    isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
  }`;
  bubble.innerHTML = escapeHTML(msg.message).replace(/\n/g, '<br>');

  const time = document.createElement('span');
  time.className = 'text-[9px] text-slate-400 mt-0.5 px-1';
  time.textContent = isMe ? 'Anda (Kantin)' : msg.student_name;

  wrapper.appendChild(bubble);
  wrapper.appendChild(time);
  box.appendChild(wrapper);
  box.scrollTop = box.scrollHeight;
}

async function handleOwnerSendMessage(e) {
  e.preventDefault();
  if (!activeOwnerChatStudent) return;

  const canteenNum = parseInt(currentRole.replace('kantin', ''));
  const input = $('owner-chat-input');
  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  await supabaseClient.from('messages').insert([{
    canteen_id: canteenNum,
    student_name: activeOwnerChatStudent,
    sender_type: 'kantin',
    message: text
  }]);
}

// ==========================================
// 6. RENDER KATALOG & STATS
// ==========================================
function renderTabs() {
  const tabs = $('kantin-tabs');
  tabs.innerHTML = '';

  canteens.forEach(c => {
    const active = activeCanteen === c.id;
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = c.name;
    button.className = `
      px-4 py-2 font-semibold text-xs rounded-xl transition-all whitespace-nowrap
      ${active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}
    `;
    button.addEventListener('click', () => selectCanteen(c.id));
    tabs.appendChild(button);
  });
}

function selectCanteen(id) {
  activeCanteen = Number(id);
  renderTabs();
  renderCanteen(activeCanteen);
}

function renderCanteen(id) {
  const canteenData = canteens.find(c => c.id === id);
  $('canteen-name').textContent = canteenData ? canteenData.name : `Kantin ${id}`;

  const list = $('product-list');
  const filtered = products.filter(p => Number(p.canteenId) === Number(id));

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="col-span-full text-center py-10">
        <i class="ri-restaurant-line text-4xl text-slate-300"></i>
        <p class="text-slate-400 italic mt-2">Belum ada menu yang dijual di Kantin ${id}.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = '';
  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-xl border border-slate-200 overflow-hidden canteen-card flex flex-col justify-between';

    const top = document.createElement('div');
    const image = document.createElement('img');
    image.className = 'product-image';
    image.alt = p.name;
    image.src = p.img || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
    image.onerror = function () {
      this.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500';
    };

    const content = document.createElement('div');
    content.className = 'p-4';
    content.innerHTML = `
      <h4 class="font-bold text-slate-800 text-base mb-1">${escapeHTML(p.name)}</h4>
      <p class="text-emerald-600 font-extrabold text-sm">Rp ${Number(p.price).toLocaleString('id-ID')}</p>
    `;

    top.appendChild(image);
    top.appendChild(content);
    card.appendChild(top);

    const footer = document.createElement('div');
    footer.className = 'p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between';

    if (currentRole === 'siswa') {
      footer.innerHTML = `
        <button
          type="button"
          onclick="openOrderModal(${p.id})"
          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
        >
          <i class="ri-chat-1-line text-sm"></i>
          <span>Pesan via Chat Web</span>
        </button>
      `;
    } else if (currentRole === 'admin' || currentRole === `kantin${id}`) {
      footer.innerHTML = `
        <span></span>
        <button
          type="button"
          onclick="deleteProduct(${p.id})"
          class="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1"
        >
          <i class="ri-delete-bin-line"></i>
          <span>Hapus</span>
        </button>
      `;
    }

    card.appendChild(footer);
    list.appendChild(card);
  });
}

function renderAdminStats() {
  const stats = $('admin-stats');
  if (!stats) return;

  stats.innerHTML = '';
  canteens.forEach(c => {
    const count = products.filter(p => Number(p.canteenId) === c.id).length;
    stats.innerHTML += `
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
        <div class="font-bold text-slate-800 text-sm">${c.name}</div>
        <div class="text-xs text-slate-500 font-medium mt-0.5">${count} Menu</div>
      </div>
    `;
  });
}

// Inisialisasi Event Listener
document.addEventListener('DOMContentLoaded', async () => {
  $('auth-form').addEventListener('submit', handleAuthSubmit);$('btn-open-student-modal').addEventListener('click', openStudentModal);
  $('btn-close-student-modal').addEventListener('click', closeStudentModal);$('student-form').addEventListener('submit', handleStudentSubmit);
  $('logout-btn').addEventListener('click', logout);$('add-product-form').addEventListener('submit', handleAddProduct);

  $('btn-close-order-modal').addEventListener('click', closeOrderModal);$('order-form').addEventListener('submit', handleSendOrder);

  // Chat Siswa
  $('btn-open-student-chat-direct').addEventListener('click', () => openStudentChatModal(activeCanteen));
  $('btn-close-student-chat').addEventListener('click', closeStudentChatModal);$('student-chat-form').addEventListener('submit', handleStudentSendMessage);

  // Chat Penjual
  $('owner-chat-form').addEventListener('submit', handleOwnerSendMessage);

  initRealtime();
  await fetchCanteens();
  await fetchProducts();
  await fetchMessages();
});
