package com.example.e_kantin.data

import android.content.Context
import android.content.SharedPreferences
import com.example.e_kantin.model.ChatMessage
import com.example.e_kantin.model.MenuItem
import com.example.e_kantin.model.Order
import com.example.e_kantin.model.StandKantin
import com.example.e_kantin.model.UserSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class KantinRepository(private val context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("e_kantin_storage", Context.MODE_PRIVATE)

    val stands = listOf(
        StandKantin(1, "Kantin 1 (Makanan Berat)", "Aneka Nasi, Ayam Geprek, Mie Ayam & Makanan Mengenyangkan"),
        StandKantin(2, "Kantin 2 (Minuman & Snaking)", "Es Teh Manis Jumbo, Jus Buah Asli & Sosis Bakar"),
        StandKantin(3, "Kantin 3 (Aneka Jajan)", "Cireng Bumbu Rujak, Dimsum Kukus & Roti Bakar")
    )

    private val _currentUser = MutableStateFlow<UserSession?>(null)
    val currentUser: StateFlow<UserSession?> = _currentUser.asStateFlow()

    private val _menuList = MutableStateFlow<List<MenuItem>>(emptyList())
    val menuList: StateFlow<List<MenuItem>> = _menuList.asStateFlow()

    private val _orderList = MutableStateFlow<List<Order>>(emptyList())
    val orderList: StateFlow<List<Order>> = _orderList.asStateFlow()

    private val registeredStudents = mutableMapOf<String, String>()

    init {
        loadRegisteredStudents()
        loadMenu()
        loadOrders()
        restoreSession()
    }

    private fun loadRegisteredStudents() {
        val jsonStr = prefs.getString("registered_students", null)
        if (!jsonStr.isNullOrEmpty()) {
            try {
                val json = JSONObject(jsonStr)
                json.keys().forEach { key ->
                    registeredStudents[key] = json.getString(key)
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun saveRegisteredStudents() {
        val json = JSONObject()
        registeredStudents.forEach { (k, v) -> json.put(k, v) }
        prefs.edit().putString("registered_students", json.toString()).apply()
    }

    private fun restoreSession() {
        val role = prefs.getString("session_role", null)
        if (role == "murid") {
            val nama = prefs.getString("session_nama", "") ?: ""
            val kelas = prefs.getString("session_kelas", "") ?: ""
            val kode = prefs.getString("session_kode", "") ?: ""
            val userKey = prefs.getString("session_userkey", "") ?: ""
            if (nama.isNotEmpty() && kelas.isNotEmpty()) {
                _currentUser.value = UserSession.MuridSession(nama, kelas, kode, userKey)
            }
        } else if (role == "kantin") {
            val kantinId = prefs.getInt("session_kantin_id", 1)
            val namaKantin = stands.find { it.id == kantinId }?.nama ?: "Kantin $kantinId"
            _currentUser.value = UserSession.KantinSession(kantinId, namaKantin)
        }
    }

    fun loginMurid(nama: String, kelas: String, kodeUnik: String): Result<UserSession.MuridSession> {
        val cleanNama = nama.trim()
        val cleanKelas = kelas.trim()
        val cleanKode = kodeUnik.trim()

        if (cleanNama.isEmpty() || cleanKelas.isEmpty() || cleanKode.isEmpty()) {
            return Result.failure(IllegalArgumentException("Harap lengkapi Nama, Kelas, dan Kode Unik!"))
        }

        if (cleanKode.length != 4 || !cleanKode.all { it.isDigit() }) {
            return Result.failure(IllegalArgumentException("Kode unik harus berupa 4 digit angka!"))
        }

        val userKey = "${cleanNama.lowercase(Locale.ROOT)}_${cleanKelas.lowercase(Locale.ROOT)}"
        val existingKode = registeredStudents[userKey]

        if (existingKode != null && existingKode != cleanKode) {
            return Result.failure(IllegalArgumentException("Kode Unik tidak cocok dengan akun murid terdaftar!"))
        }

        registeredStudents[userKey] = cleanKode
        saveRegisteredStudents()

        val session = UserSession.MuridSession(cleanNama, cleanKelas, cleanKode, userKey)
        _currentUser.value = session

        prefs.edit()
            .putString("session_role", "murid")
            .putString("session_nama", cleanNama)
            .putString("session_kelas", cleanKelas)
            .putString("session_kode", cleanKode)
            .putString("session_userkey", userKey)
            .apply()

        return Result.success(session)
    }

    fun loginKantin(kantinId: Int, passwordInput: String): Result<UserSession.KantinSession> {
        if (passwordInput != "kantin123") {
            return Result.failure(IllegalArgumentException("Password salah! (Gunakan 'kantin123')"))
        }

        val stand = stands.find { it.id == kantinId } ?: stands.first()
        val session = UserSession.KantinSession(stand.id, stand.nama)
        _currentUser.value = session

        prefs.edit()
            .putString("session_role", "kantin")
            .putInt("session_kantin_id", stand.id)
            .apply()

        return Result.success(session)
    }

    fun logout() {
        _currentUser.value = null
        prefs.edit()
            .remove("session_role")
            .remove("session_nama")
            .remove("session_kelas")
            .remove("session_kode")
            .remove("session_userkey")
            .remove("session_kantin_id")
            .apply()
    }

    private fun loadMenu() {
        val jsonStr = prefs.getString("menu_items", null)
        if (!jsonStr.isNullOrEmpty()) {
            try {
                val list = mutableListOf<MenuItem>()
                val jsonArr = JSONArray(jsonStr)
                for (i in 0 until jsonArr.length()) {
                    val obj = jsonArr.getJSONObject(i)
                    val varianArr = obj.getJSONArray("varian_list")
                    val varianList = mutableListOf<String>()
                    for (j in 0 until varianArr.length()) {
                        varianList.add(varianArr.getString(j))
                    }
                    list.add(
                        MenuItem(
                            id = obj.getLong("id"),
                            kantinId = obj.getInt("kantin_id"),
                            namaKantin = obj.getString("nama_kantin"),
                            nama = obj.getString("nama"),
                            kategori = obj.getString("kategori"),
                            desc = obj.optString("description", ""),
                            harga = obj.getInt("harga"),
                            stok = obj.getInt("stok"),
                            foto = obj.optString("foto", ""),
                            varianList = if (varianList.isNotEmpty()) varianList else listOf("Original")
                        )
                    )
                }
                _menuList.value = list
                return
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        // Default initial items
        val defaultMenus = listOf(
            MenuItem(
                id = 101L,
                kantinId = 1,
                namaKantin = "Kantin 1 (Makanan Berat)",
                nama = "Ayam Geprek Sambal Bawang",
                kategori = "Makanan",
                desc = "Ayam goreng crispy tepung renyah dengan sambal bawang segar pedas mantap + nasi putih hangat.",
                harga = 13000,
                stok = 20,
                foto = "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400",
                varianList = listOf("Level 1 (Sedang)", "Level 2 (Pedas)", "Level 3 (Super Pedas)", "Tanpa Sambal")
            ),
            MenuItem(
                id = 102L,
                kantinId = 1,
                namaKantin = "Kantin 1 (Makanan Berat)",
                nama = "Nasi Goreng Spesial Kantin",
                kategori = "Makanan",
                desc = "Nasi goreng bumbu gurih khas kantin sekolah dengan telur ceplok mata sapi, suwiran ayam, dan kerupuk.",
                harga = 12000,
                stok = 25,
                foto = "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400",
                varianList = listOf("Pedas Sedang", "Ekstra Pedas", "Tidak Pedas", "Telur Dadar")
            ),
            MenuItem(
                id = 103L,
                kantinId = 1,
                namaKantin = "Kantin 1 (Makanan Berat)",
                nama = "Mie Ayam Bakso Komplit",
                kategori = "Makanan",
                desc = "Mie kenyal dengan potongan daging ayam bumbu semur manis gurih, sawi hijau segar dan 2 bakso sapi.",
                harga = 14000,
                stok = 15,
                foto = "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
                varianList = listOf("Kuah Dipisah", "Kuah Dicampur", "Yamin Manis", "Yamin Asin")
            ),
            MenuItem(
                id = 201L,
                kantinId = 2,
                namaKantin = "Kantin 2 (Minuman & Snaking)",
                nama = "Es Teh Manis Solo Jumbo",
                kategori = "Minuman",
                desc = "Es teh manis wangi melati khas Solo racikan segar ukuran jumbo pelepas dahaga istirahat sekolah.",
                harga = 4000,
                stok = 50,
                foto = "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
                varianList = listOf("Normal Ice", "Less Ice", "Ekstra Manis", "Hangat")
            ),
            MenuItem(
                id = 202L,
                kantinId = 2,
                namaKantin = "Kantin 2 (Minuman & Snaking)",
                nama = "Jus Alpukat Kocok Cokelat",
                kategori = "Minuman",
                desc = "Alpukat segar dikocok kental dengan lumuran susu kental manis cokelat dan es batu serut.",
                harga = 10000,
                stok = 20,
                foto = "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400",
                varianList = listOf("Ekstra Susu Cokelat", "Sedang", "Less Sugar")
            ),
            MenuItem(
                id = 203L,
                kantinId = 2,
                namaKantin = "Kantin 2 (Minuman & Snaking)",
                nama = "Sosis Bakar Jumbo BBQ",
                kategori = "Camilan",
                desc = "Sosis sapi ukuran jumbo dibakar dengan bumbu barbecue aromatik dan disajikan dengan saus mayones.",
                harga = 8000,
                stok = 30,
                foto = "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400",
                varianList = listOf("Saus BBQ Manis", "Saus BBQ Pedas", "Mix Mayonaise Gurih")
            ),
            MenuItem(
                id = 301L,
                kantinId = 3,
                namaKantin = "Kantin 3 (Aneka Jajan)",
                nama = "Cireng Krispi Bumbu Rujak",
                kategori = "Camilan",
                desc = "Cireng aci goreng renyah kriuk di luar kenyal lembut di dalam dengan cocolan sambal rujak asam manis pedas.",
                harga = 6000,
                stok = 35,
                foto = "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400",
                varianList = listOf("Pedas Nampol", "Pedas Manis", "Bumbu Tabur Keju")
            ),
            MenuItem(
                id = 302L,
                kantinId = 3,
                namaKantin = "Kantin 3 (Aneka Jajan)",
                nama = "Dimsum Ayam Udang (Isi 4)",
                kategori = "Camilan",
                desc = "Dimsum kukus premium olahan daging ayam dan udang empuk disajikan hangat dengan chili oil gurih pedas.",
                harga = 12000,
                stok = 20,
                foto = "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400",
                varianList = listOf("Chili Oil Pedas", "Saus Sambal Manis", "Campur Keduanya")
            ),
            MenuItem(
                id = 303L,
                kantinId = 3,
                namaKantin = "Kantin 3 (Aneka Jajan)",
                nama = "Roti Bakar Keju Cokelat",
                kategori = "Camilan",
                desc = "Roti tawar tebal dipanggang dengan olesan mentega, isian cokelat meses lumer dan limpahan keju parut.",
                harga = 9000,
                stok = 25,
                foto = "https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?w=400",
                varianList = listOf("Cokelat Keju", "Keju Susu", "Ekstra Cokelat Lumer")
            )
        )
        _menuList.value = defaultMenus
        saveMenu(defaultMenus)
    }

    private fun saveMenu(list: List<MenuItem>) {
        val jsonArr = JSONArray()
        list.forEach { item ->
            val obj = JSONObject().apply {
                put("id", item.id)
                put("kantin_id", item.kantinId)
                put("nama_kantin", item.namaKantin)
                put("nama", item.nama)
                put("kategori", item.kategori)
                put("description", item.desc)
                put("harga", item.harga)
                put("stok", item.stok)
                put("foto", item.foto)
                val varianArr = JSONArray()
                item.varianList.forEach { varianArr.put(it) }
                put("varian_list", varianArr)
            }
            jsonArr.put(obj)
        }
        prefs.edit().putString("menu_items", jsonArr.toString()).apply()
    }

    private fun loadOrders() {
        val jsonStr = prefs.getString("orders_kantin", null)
        if (!jsonStr.isNullOrEmpty()) {
            try {
                val list = mutableListOf<Order>()
                val jsonArr = JSONArray(jsonStr)
                for (i in 0 until jsonArr.length()) {
                    val obj = jsonArr.getJSONObject(i)
                    val chatsArr = obj.optJSONArray("chats")
                    val chatsList = mutableListOf<ChatMessage>()
                    if (chatsArr != null) {
                        for (j in 0 until chatsArr.length()) {
                            val c = chatsArr.getJSONObject(j)
                            chatsList.add(
                                ChatMessage(
                                    sender = c.getString("sender"),
                                    text = c.getString("text"),
                                    waktu = c.getString("waktu")
                                )
                            )
                        }
                    }
                    list.add(
                        Order(
                            id = obj.getLong("id"),
                            kantinId = obj.getInt("kantin_id"),
                            namaPemesan = obj.getString("nama_pemesan"),
                            infoPemesan = obj.getString("info_pemesan"),
                            kodeUnikPemesan = obj.optString("kode_unik_pemesan", ""),
                            userKey = obj.getString("user_key"),
                            metode = obj.optString("metode", "Take Away (Bayar di Kantin)"),
                            namaMenu = obj.getString("nama_menu"),
                            qty = obj.getInt("qty"),
                            varian = obj.getString("varian"),
                            harga = obj.getInt("harga"),
                            catatan = obj.optString("catatan", ""),
                            waktu = obj.getString("waktu"),
                            status = obj.getString("status"),
                            chats = chatsList,
                            createdAt = obj.optLong("created_at", System.currentTimeMillis())
                        )
                    )
                }
                _orderList.value = list
                return
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
        _orderList.value = emptyList()
    }

    private fun saveOrders(list: List<Order>) {
        val jsonArr = JSONArray()
        list.forEach { o ->
            val obj = JSONObject().apply {
                put("id", o.id)
                put("kantin_id", o.kantinId)
                put("nama_pemesan", o.namaPemesan)
                put("info_pemesan", o.infoPemesan)
                put("kode_unik_pemesan", o.kodeUnikPemesan)
                put("user_key", o.userKey)
                put("metode", o.metode)
                put("nama_menu", o.namaMenu)
                put("qty", o.qty)
                put("varian", o.varian)
                put("harga", o.harga)
                put("catatan", o.catatan)
                put("waktu", o.waktu)
                put("status", o.status)
                put("created_at", o.createdAt)
                val cArr = JSONArray()
                o.chats.forEach { chat ->
                    cArr.put(JSONObject().apply {
                        put("sender", chat.sender)
                        put("text", chat.text)
                        put("waktu", chat.waktu)
                    })
                }
                put("chats", cArr)
            }
            jsonArr.put(obj)
        }
        prefs.edit().putString("orders_kantin", jsonArr.toString()).apply()
    }

    fun createOrder(
        item: MenuItem,
        varian: String,
        qty: Int,
        catatan: String
    ): Result<Order> {
        val currentSession = _currentUser.value
        if (currentSession !is UserSession.MuridSession) {
            return Result.failure(IllegalStateException("Hanya murid yang dapat memesan menu!"))
        }

        if (item.stok < qty) {
            return Result.failure(IllegalStateException("Stok tidak mencukupi! Sisa stok: ${item.stok}"))
        }

        // Deduct stock
        val updatedMenus = _menuList.value.map {
            if (it.id == item.id) it.copy(stok = it.stok - qty) else it
        }
        _menuList.value = updatedMenus
        saveMenu(updatedMenus)

        val timeFormat = SimpleDateFormat("HH:mm", Locale("id", "ID"))
        val orderTime = timeFormat.format(Date())

        val newOrder = Order(
            id = System.currentTimeMillis(),
            kantinId = item.kantinId,
            namaPemesan = currentSession.nama,
            infoPemesan = currentSession.kelas,
            kodeUnikPemesan = currentSession.kodeUnik,
            userKey = currentSession.userKey,
            metode = "Take Away (Bayar di Kantin)",
            namaMenu = item.nama,
            qty = qty,
            varian = varian,
            harga = item.harga * qty,
            catatan = if (catatan.isNotBlank()) catatan else "Tanpa catatan.",
            waktu = orderTime,
            status = "Menunggu",
            chats = emptyList(),
            createdAt = System.currentTimeMillis()
        )

        val updatedOrders = listOf(newOrder) + _orderList.value
        _orderList.value = updatedOrders
        saveOrders(updatedOrders)

        return Result.success(newOrder)
    }

    fun updateOrderStatus(orderId: Long, newStatus: String) {
        val updated = _orderList.value.map { order ->
            if (order.id == orderId) order.copy(status = newStatus) else order
        }
        _orderList.value = updated
        saveOrders(updated)
    }

    fun sendChatMessage(orderId: Long, sender: String, text: String) {
        if (text.isBlank()) return
        val timeFormat = SimpleDateFormat("HH:mm", Locale("id", "ID"))
        val nowTime = timeFormat.format(Date())
        val newChat = ChatMessage(sender = sender, text = text.trim(), waktu = nowTime)

        val updated = _orderList.value.map { order ->
            if (order.id == orderId) {
                order.copy(chats = order.chats + newChat)
            } else {
                order
            }
        }
        _orderList.value = updated
        saveOrders(updated)
    }

    fun updateMenuItemStock(menuId: Long, newStock: Int) {
        val safeStock = if (newStock < 0) 0 else newStock
        val updated = _menuList.value.map { item ->
            if (item.id == menuId) item.copy(stok = safeStock) else item
        }
        _menuList.value = updated
        saveMenu(updated)
    }

    fun addMenuItem(
        kantinId: Int,
        nama: String,
        kategori: String,
        varianList: List<String>,
        harga: Int,
        stok: Int,
        desc: String,
        fotoUrl: String
    ) {
        val standName = stands.find { it.id == kantinId }?.nama ?: "Kantin $kantinId"
        val fallbackFoto = if (fotoUrl.isNotBlank()) {
            fotoUrl
        } else {
            when (kategori) {
                "Makanan" -> "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=400"
                "Minuman" -> "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400"
                else -> "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400"
            }
        }

        val newItem = MenuItem(
            id = System.currentTimeMillis(),
            kantinId = kantinId,
            namaKantin = standName,
            nama = nama.trim(),
            kategori = kategori,
            desc = desc.trim(),
            harga = harga,
            stok = stok,
            foto = fallbackFoto,
            varianList = if (varianList.isNotEmpty()) varianList else listOf("Original")
        )

        val updated = _menuList.value + newItem
        _menuList.value = updated
        saveMenu(updated)
    }

    fun deleteMenuItem(menuId: Long) {
        val updated = _menuList.value.filterNot { it.id == menuId }
        _menuList.value = updated
        saveMenu(updated)
    }
}
