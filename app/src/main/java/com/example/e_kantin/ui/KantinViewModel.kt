package com.example.e_kantin.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.example.e_kantin.data.KantinRepository
import com.example.e_kantin.model.MenuItem
import com.example.e_kantin.model.Order
import com.example.e_kantin.model.StandKantin
import com.example.e_kantin.model.UserSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

enum class MuridTab {
    MENU,
    PESANAN_SAYA
}

enum class KantinTab {
    PESANAN_MASUK,
    KELOLA_MENU,
    RIWAYAT_SELESAI
}

class KantinViewModel(private val repository: KantinRepository) : ViewModel() {

    val stands: List<StandKantin> = repository.stands
    val currentUser: StateFlow<UserSession?> = repository.currentUser
    val allOrders: StateFlow<List<Order>> = repository.orderList
    val allMenus: StateFlow<List<MenuItem>> = repository.menuList

    // Login Form State
    private val _loginRole = MutableStateFlow("murid") // "murid" or "kantin"
    val loginRole: StateFlow<String> = _loginRole.asStateFlow()

    private val _muridNama = MutableStateFlow("")
    val muridNama: StateFlow<String> = _muridNama.asStateFlow()

    private val _muridKelas = MutableStateFlow("")
    val muridKelas: StateFlow<String> = _muridKelas.asStateFlow()

    private val _muridKode = MutableStateFlow("")
    val muridKode: StateFlow<String> = _muridKode.asStateFlow()

    private val _selectedKantinId = MutableStateFlow(1)
    val selectedKantinId: StateFlow<Int> = _selectedKantinId.asStateFlow()

    private val _kantinPassword = MutableStateFlow("")
    val kantinPassword: StateFlow<String> = _kantinPassword.asStateFlow()

    private val _loginErrorMessage = MutableStateFlow<String?>(null)
    val loginErrorMessage: StateFlow<String?> = _loginErrorMessage.asStateFlow()

    // Navigation Tabs
    private val _currentMuridTab = MutableStateFlow(MuridTab.MENU)
    val currentMuridTab: StateFlow<MuridTab> = _currentMuridTab.asStateFlow()

    private val _currentKantinTab = MutableStateFlow(KantinTab.PESANAN_MASUK)
    val currentKantinTab: StateFlow<KantinTab> = _currentKantinTab.asStateFlow()

    // Filters for Menu Catalog
    private val _filterStandId = MutableStateFlow<Int?>(null) // null = Semua Stand
    val filterStandId: StateFlow<Int?> = _filterStandId.asStateFlow()

    private val _filterCategory = MutableStateFlow("Semua") // "Semua", "Makanan", "Minuman", "Camilan"
    val filterCategory: StateFlow<String> = _filterCategory.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    // Filtered menu list for students
    val filteredMenuItems: StateFlow<List<MenuItem>> = combine(
        allMenus,
        _filterStandId,
        _filterCategory,
        _searchQuery
    ) { menus, standId, category, query ->
        menus.filter { item ->
            val matchStand = (standId == null || item.kantinId == standId)
            val matchCategory = (category == "Semua" || item.kategori.equals(category, ignoreCase = true))
            val matchQuery = (query.isBlank() || item.nama.contains(query, ignoreCase = true) || item.desc.contains(query, ignoreCase = true))
            matchStand && matchCategory && matchQuery
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Order Modal State
    private val _selectedItemForOrder = MutableStateFlow<MenuItem?>(null)
    val selectedItemForOrder: StateFlow<MenuItem?> = _selectedItemForOrder.asStateFlow()

    private val _orderVarian = MutableStateFlow("")
    val orderVarian: StateFlow<String> = _orderVarian.asStateFlow()

    private val _orderQty = MutableStateFlow(1)
    val orderQty: StateFlow<Int> = _orderQty.asStateFlow()

    private val _orderCatatan = MutableStateFlow("")
    val orderCatatan: StateFlow<String> = _orderCatatan.asStateFlow()

    private val _snackbarMessage = MutableStateFlow<String?>(null)
    val snackbarMessage: StateFlow<String?> = _snackbarMessage.asStateFlow()

    // Add Menu Modal State
    private val _showAddMenuDialog = MutableStateFlow(false)
    val showAddMenuDialog: StateFlow<Boolean> = _showAddMenuDialog.asStateFlow()

    // Chat text inputs per order
    private val _chatInputs = MutableStateFlow<Map<Long, String>>(emptyMap())
    val chatInputs: StateFlow<Map<Long, String>> = _chatInputs.asStateFlow()

    fun setLoginRole(role: String) {
        _loginRole.value = role
        _loginErrorMessage.value = null
    }

    fun onMuridNamaChange(v: String) { _muridNama.value = v }
    fun onMuridKelasChange(v: String) { _muridKelas.value = v }
    fun onMuridKodeChange(v: String) {
        if (v.length <= 4 && v.all { it.isDigit() }) {
            _muridKode.value = v
        }
    }
    fun onSelectedKantinIdChange(id: Int) { _selectedKantinId.value = id }
    fun onKantinPasswordChange(v: String) { _kantinPassword.value = v }

    fun loginMurid() {
        val res = repository.loginMurid(_muridNama.value, _muridKelas.value, _muridKode.value)
        res.onSuccess {
            _loginErrorMessage.value = null
        }.onFailure {
            _loginErrorMessage.value = it.message
        }
    }

    fun loginKantin() {
        val res = repository.loginKantin(_selectedKantinId.value, _kantinPassword.value)
        res.onSuccess {
            _loginErrorMessage.value = null
        }.onFailure {
            _loginErrorMessage.value = it.message
        }
    }

    fun loginDemoMurid() {
        _muridNama.value = "Zul Javanese"
        _muridKelas.value = "XII RPL B"
        _muridKode.value = "1234"
        loginMurid()
    }

    fun loginDemoKantin(standId: Int) {
        _selectedKantinId.value = standId
        _kantinPassword.value = "kantin123"
        loginKantin()
    }

    fun logout() {
        repository.logout()
        _loginErrorMessage.value = null
        _selectedItemForOrder.value = null
        _showAddMenuDialog.value = false
    }

    fun setMuridTab(tab: MuridTab) {
        _currentMuridTab.value = tab
    }

    fun setKantinTab(tab: KantinTab) {
        _currentKantinTab.value = tab
    }

    fun setFilterStandId(id: Int?) {
        _filterStandId.value = id
    }

    fun setFilterCategory(cat: String) {
        _filterCategory.value = cat
    }

    fun setSearchQuery(q: String) {
        _searchQuery.value = q
    }

    fun openOrderDialog(item: MenuItem) {
        if (item.stok <= 0) return
        _selectedItemForOrder.value = item
        _orderVarian.value = item.varianList.firstOrNull() ?: "Original"
        _orderQty.value = 1
        _orderCatatan.value = ""
    }

    fun closeOrderDialog() {
        _selectedItemForOrder.value = null
    }

    fun setOrderVarian(v: String) {
        _orderVarian.value = v
    }

    fun incrementOrderQty() {
        val item = _selectedItemForOrder.value ?: return
        if (_orderQty.value < item.stok) {
            _orderQty.value += 1
        }
    }

    fun decrementOrderQty() {
        if (_orderQty.value > 1) {
            _orderQty.value -= 1
        }
    }

    fun setOrderCatatan(note: String) {
        _orderCatatan.value = note
    }

    fun confirmOrder() {
        val item = _selectedItemForOrder.value ?: return
        val result = repository.createOrder(item, _orderVarian.value, _orderQty.value, _orderCatatan.value)
        result.onSuccess {
            _snackbarMessage.value = "Pesanan ${item.nama} berhasil dikirim ke ${item.namaKantin}!"
            closeOrderDialog()
        }.onFailure {
            _snackbarMessage.value = "Gagal memesan: ${it.message}"
        }
    }

    fun updateOrderStatus(orderId: Long, newStatus: String) {
        repository.updateOrderStatus(orderId, newStatus)
        _snackbarMessage.value = "Status pesanan diubah menjadi: $newStatus"
    }

    fun onChatInputChange(orderId: Long, text: String) {
        val current = _chatInputs.value.toMutableMap()
        current[orderId] = text
        _chatInputs.value = current
    }

    fun sendChatMessage(orderId: Long, sender: String) {
        val text = _chatInputs.value[orderId] ?: return
        if (text.isNotBlank()) {
            repository.sendChatMessage(orderId, sender, text)
            val current = _chatInputs.value.toMutableMap()
            current[orderId] = ""
            _chatInputs.value = current
        }
    }

    fun updateStock(menuId: Long, newStock: Int) {
        repository.updateMenuItemStock(menuId, newStock)
    }

    fun openAddMenuDialog() {
        _showAddMenuDialog.value = true
    }

    fun closeAddMenuDialog() {
        _showAddMenuDialog.value = false
    }

    fun addNewMenuItem(
        nama: String,
        kategori: String,
        varianStr: String,
        harga: Int,
        stok: Int,
        desc: String,
        fotoUrl: String
    ) {
        val session = currentUser.value
        if (session is UserSession.KantinSession) {
            val varianList = varianStr.split(",").map { it.trim() }.filter { it.isNotEmpty() }
            repository.addMenuItem(
                kantinId = session.kantinId,
                nama = nama,
                kategori = kategori,
                varianList = if (varianList.isNotEmpty()) varianList else listOf("Original"),
                harga = harga,
                stok = stok,
                desc = desc,
                fotoUrl = fotoUrl
            )
            _showAddMenuDialog.value = false
            _snackbarMessage.value = "Menu '$nama' berhasil ditambahkan!"
        }
    }

    fun deleteMenuItem(menuId: Long) {
        repository.deleteMenuItem(menuId)
        _snackbarMessage.value = "Menu berhasil dihapus."
    }

    fun clearSnackbar() {
        _snackbarMessage.value = null
    }

    companion object {
        fun provideFactory(repository: KantinRepository): ViewModelProvider.Factory =
            object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST")
                override fun <T : ViewModel> create(modelClass: Class<T>): T {
                    return KantinViewModel(repository) as T
                }
            }
    }
}
