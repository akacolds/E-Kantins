package com.example.e_kantin.model

import java.text.NumberFormat
import java.util.Locale

sealed interface UserSession {
    data class MuridSession(
        val nama: String,
        val kelas: String,
        val kodeUnik: String,
        val userKey: String
    ) : UserSession

    data class KantinSession(
        val kantinId: Int,
        val namaKantin: String
    ) : UserSession
}

data class StandKantin(
    val id: Int,
    val nama: String,
    val deskripsi: String
)

data class MenuItem(
    val id: Long,
    val kantinId: Int,
    val namaKantin: String,
    val nama: String,
    val kategori: String, // "Makanan", "Minuman", "Camilan"
    val desc: String,
    val harga: Int,
    val stok: Int,
    val foto: String,
    val varianList: List<String>
)

data class ChatMessage(
    val sender: String, // "murid" or "kantin"
    val text: String,
    val waktu: String
)

data class Order(
    val id: Long,
    val kantinId: Int,
    val namaPemesan: String,
    val infoPemesan: String,
    val kodeUnikPemesan: String,
    val userKey: String,
    val metode: String = "Take Away (Bayar di Kantin)",
    val namaMenu: String,
    val qty: Int,
    val varian: String,
    val harga: Int, // total harga
    val catatan: String,
    val waktu: String,
    val status: String, // "Menunggu", "Sedang Dimasak", "Siap Diambil"
    val chats: List<ChatMessage> = emptyList(),
    val createdAt: Long = System.currentTimeMillis()
)

fun formatRupiah(amount: Int): String {
    val formatter = NumberFormat.getCurrencyInstance(Locale("id", "ID"))
    return formatter.format(amount).replace("Rp", "Rp ").replace(",00", "")
}
