package com.example.e_kantin.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Fastfood
import androidx.compose.material.icons.filled.Inbox
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Restaurant
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.e_kantin.model.MenuItem
import com.example.e_kantin.model.Order
import com.example.e_kantin.model.UserSession
import com.example.e_kantin.model.formatRupiah
import com.example.e_kantin.theme.KantinBlueDark
import com.example.e_kantin.theme.KantinBluePrimary
import com.example.e_kantin.theme.KantinGreen
import com.example.e_kantin.theme.KantinNavy
import com.example.e_kantin.theme.KantinOrange
import com.example.e_kantin.ui.KantinTab
import com.example.e_kantin.ui.KantinViewModel
import com.example.e_kantin.ui.components.OrderChatBox
import com.example.e_kantin.ui.components.OrderStatusBadge
import com.example.e_kantin.ui.components.UserSessionBar

@Composable
fun CanteenDashboardScreen(
    session: UserSession.KantinSession,
    viewModel: KantinViewModel,
    modifier: Modifier = Modifier
) {
    val currentTab by viewModel.currentKantinTab.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()
    val allMenus by viewModel.allMenus.collectAsState()
    val showAddMenuDialog by viewModel.showAddMenuDialog.collectAsState()
    val chatInputs by viewModel.chatInputs.collectAsState()

    // Filter orders for this canteen stand
    val myStandOrders = allOrders.filter { it.kantinId == session.kantinId }
    val incomingOrders = myStandOrders.filter { it.status != "Siap Diambil" }
    val completedOrders = myStandOrders.filter { it.status == "Siap Diambil" }

    // Filter menu items belonging to this stand
    val myMenuItems = allMenus.filter { it.kantinId == session.kantinId }

    Column(modifier = modifier.fillMaxSize()) {
        // Session Header Bar
        UserSessionBar(
            session = session,
            onLogout = viewModel::logout
        )

        // Sub-Navigation Tabs
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shadowElevation = 1.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(8.dp),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                // Tab Pesanan Masuk
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (currentTab == KantinTab.PESANAN_MASUK) KantinBluePrimary else Color(0xFFF1F5F9))
                        .clickable { viewModel.setKantinTab(KantinTab.PESANAN_MASUK) }
                        .padding(vertical = 10.dp)
                        .testTag("tab_kantin_incoming"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Inbox,
                            contentDescription = null,
                            tint = if (currentTab == KantinTab.PESANAN_MASUK) Color.White else Color(0xFF475569),
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Pesanan",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (currentTab == KantinTab.PESANAN_MASUK) Color.White else Color(0xFF475569)
                        )
                        if (incomingOrders.isNotEmpty()) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF4444))
                                    .padding(horizontal = 5.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "${incomingOrders.size}",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }

                // Tab Kelola Menu
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (currentTab == KantinTab.KELOLA_MENU) KantinBluePrimary else Color(0xFFF1F5F9))
                        .clickable { viewModel.setKantinTab(KantinTab.KELOLA_MENU) }
                        .padding(vertical = 10.dp)
                        .testTag("tab_kantin_manage_menu"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Fastfood,
                            contentDescription = null,
                            tint = if (currentTab == KantinTab.KELOLA_MENU) Color.White else Color(0xFF475569),
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Menu & Stok",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (currentTab == KantinTab.KELOLA_MENU) Color.White else Color(0xFF475569)
                        )
                    }
                }

                // Tab Riwayat Selesai
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (currentTab == KantinTab.RIWAYAT_SELESAI) KantinBluePrimary else Color(0xFFF1F5F9))
                        .clickable { viewModel.setKantinTab(KantinTab.RIWAYAT_SELESAI) }
                        .padding(vertical = 10.dp)
                        .testTag("tab_kantin_history"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.CheckCircle,
                            contentDescription = null,
                            tint = if (currentTab == KantinTab.RIWAYAT_SELESAI) Color.White else Color(0xFF475569),
                            modifier = Modifier.size(15.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Selesai",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp,
                            color = if (currentTab == KantinTab.RIWAYAT_SELESAI) Color.White else Color(0xFF475569)
                        )
                    }
                }
            }
        }

        // Tab Content
        when (currentTab) {
            KantinTab.PESANAN_MASUK -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "Pesanan Masuk - ${session.namaKantin}",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = KantinNavy
                        )
                    }

                    if (incomingOrders.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 60.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = Icons.Default.Inbox,
                                        contentDescription = null,
                                        tint = Color.LightGray,
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = "Belum ada pesanan masuk saat ini.",
                                        fontSize = 14.sp,
                                        color = Color.Gray
                                    )
                                }
                            }
                        }
                    } else {
                        items(incomingOrders, key = { it.id }) { order ->
                            CanteenIncomingOrderCard(
                                order = order,
                                onUpdateStatus = { newStatus -> viewModel.updateOrderStatus(order.id, newStatus) },
                                chatInput = chatInputs[order.id] ?: "",
                                onChatInputChange = { viewModel.onChatInputChange(order.id, it) },
                                onSendChat = { viewModel.sendChatMessage(order.id, "kantin") }
                            )
                        }
                    }
                }
            }

            KantinTab.KELOLA_MENU -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Kelola Menu & Stok",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = KantinNavy
                            )

                            Button(
                                onClick = viewModel::openAddMenuDialog,
                                colors = ButtonDefaults.buttonColors(containerColor = KantinBluePrimary),
                                shape = RoundedCornerShape(8.dp),
                                modifier = Modifier.testTag("btn_tambah_menu_baru")
                            ) {
                                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Tambah Menu", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }

                    if (myMenuItems.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 60.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Belum ada menu di stand ini. Klik 'Tambah Menu' untuk menambahkan.",
                                    color = Color.Gray,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    } else {
                        items(myMenuItems, key = { it.id }) { item ->
                            CanteenMenuItemManagementCard(
                                item = item,
                                onStockChange = { newStock -> viewModel.updateStock(item.id, newStock) },
                                onDelete = { viewModel.deleteMenuItem(item.id) }
                            )
                        }
                    }
                }
            }

            KantinTab.RIWAYAT_SELESAI -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "Riwayat Pesanan Selesai",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = KantinNavy
                        )
                    }

                    if (completedOrders.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 60.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Belum ada pesanan yang selesai.",
                                    color = Color.Gray,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    } else {
                        items(completedOrders, key = { it.id }) { order ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                            ) {
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(14.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column {
                                        Text(
                                            text = "${order.namaMenu} (${order.qty} Porsi)",
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 14.sp
                                        )
                                        Text(
                                            text = "Pemesan: ${order.namaPemesan} (${order.infoPemesan}) • Kode: ${order.kodeUnikPemesan}",
                                            fontSize = 12.sp,
                                            color = Color(0xFF64748B)
                                        )
                                        Text(
                                            text = "Total: ${formatRupiah(order.harga)} • ${order.waktu}",
                                            fontSize = 12.sp,
                                            color = KantinBluePrimary,
                                            fontWeight = FontWeight.SemiBold
                                        )
                                    }

                                    OrderStatusBadge(status = "Siap Diambil")
                                }
                            }
                        }
                    }
                }
            }
        }

        // Add Menu Dialog
        if (showAddMenuDialog) {
            AddMenuDialog(
                onDismiss = viewModel::closeAddMenuDialog,
                onSave = viewModel::addNewMenuItem
            )
        }
    }
}

@Composable
fun CanteenIncomingOrderCard(
    order: Order,
    onUpdateStatus: (String) -> Unit,
    chatInput: String,
    onChatInputChange: (String) -> Unit,
    onSendChat: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("canteen_order_card_${order.id}"),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            // Customer Badge Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(6.dp))
                    .background(Color(0xFFFEF3C7))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "🎓 Siswa: ${order.infoPemesan} (Kode: ${order.kodeUnikPemesan})",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF92400E)
                )
                Text(
                    text = order.waktu,
                    fontSize = 11.sp,
                    color = Color(0xFF92400E)
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${order.namaMenu} (${order.qty} Porsi)",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    Text(
                        text = "Pemesan: ${order.namaPemesan}",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF334155)
                    )
                    Text(
                        text = "Total: ${formatRupiah(order.harga)}",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = KantinBluePrimary
                    )
                    Text(
                        text = "Varian: ${order.varian}",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                    Text(
                        text = "Catatan: \"${order.catatan}\"",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B)
                    )
                }

                OrderStatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Status Buttons
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = { onUpdateStatus("Sedang Dimasak") },
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = KantinOrange
                    ),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Restaurant, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("🍳 Dimasak", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { onUpdateStatus("Siap Diambil") },
                    colors = ButtonDefaults.buttonColors(containerColor = KantinGreen),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("🔔 Siap", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Interactive Chat Section
            OrderChatBox(
                chats = order.chats,
                currentSenderRole = "kantin",
                inputText = chatInput,
                onInputChange = onChatInputChange,
                onSend = onSendChat
            )
        }
    }
}

@Composable
fun CanteenMenuItemManagementCard(
    item: MenuItem,
    onStockChange: (Int) -> Unit,
    onDelete: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column {
            Row(modifier = Modifier.padding(12.dp)) {
                // Image
                Box(
                    modifier = Modifier
                        .size(76.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFE2E8F0))
                ) {
                    AsyncImage(
                        model = item.foto,
                        contentDescription = item.nama,
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize()
                    )
                }

                Spacer(modifier = Modifier.width(12.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "[${item.kategori}]",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = KantinBluePrimary
                    )
                    Text(
                        text = item.nama,
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = item.desc,
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = formatRupiah(item.harga),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = KantinNavy,
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }
            }

            // Stock Controls Row
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color(0xFFF8FAFC))
                    .padding(horizontal = 14.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = "Stok: ",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                    IconButton(
                        onClick = { onStockChange(maxOf(0, item.stok - 1)) },
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFE2E8F0))
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Kurang", modifier = Modifier.size(14.dp))
                    }

                    Text(
                        text = " ${item.stok} ",
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(horizontal = 6.dp)
                    )

                    IconButton(
                        onClick = { onStockChange(item.stok + 1) },
                        modifier = Modifier
                            .size(30.dp)
                            .clip(CircleShape)
                            .background(Color(0xFFE2E8F0))
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Tambah", modifier = Modifier.size(14.dp))
                    }
                }

                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(32.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Hapus",
                        tint = Color(0xFFEF4444),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun AddMenuDialog(
    onDismiss: () -> Unit,
    onSave: (nama: String, kategori: String, varian: String, harga: Int, stok: Int, desc: String, foto: String) -> Unit
) {
    var nama by remember { mutableStateOf("") }
    var kategori by remember { mutableStateOf("Makanan") }
    var varian by remember { mutableStateOf("Original") }
    var hargaText by remember { mutableStateOf("10000") }
    var stokText by remember { mutableStateOf("20") }
    var desc by remember { mutableStateOf("") }
    var fotoUrl by remember { mutableStateOf("") }
    var kategoriExpanded by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(text = "Tambah Menu Baru", fontWeight = FontWeight.Bold, fontSize = 17.sp)
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                OutlinedTextField(
                    value = nama,
                    onValueChange = { nama = it },
                    label = { Text("Nama Makanan / Minuman") },
                    placeholder = { Text("Contoh: Ayam Geprek") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                Box(modifier = Modifier.fillMaxWidth()) {
                    OutlinedTextField(
                        value = kategori,
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Kategori") },
                        trailingIcon = {
                            Icon(
                                Icons.Default.ArrowDropDown,
                                contentDescription = null,
                                modifier = Modifier.clickable { kategoriExpanded = true }
                            )
                        },
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { kategoriExpanded = true }
                    )

                    DropdownMenu(
                        expanded = kategoriExpanded,
                        onDismissRequest = { kategoriExpanded = false }
                    ) {
                        listOf("Makanan", "Minuman", "Camilan").forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat) },
                                onClick = {
                                    kategori = cat
                                    kategoriExpanded = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = varian,
                    onValueChange = { varian = it },
                    label = { Text("Varian (Pisahkan koma)") },
                    placeholder = { Text("Contoh: Level 1, Level 2") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedTextField(
                        value = hargaText,
                        onValueChange = { if (it.all { c -> c.isDigit() }) hargaText = it },
                        label = { Text("Harga (Rp)") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )

                    OutlinedTextField(
                        value = stokText,
                        onValueChange = { if (it.all { c -> c.isDigit() }) stokText = it },
                        label = { Text("Stok Awal") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.weight(1f)
                    )
                }

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = desc,
                    onValueChange = { desc = it },
                    label = { Text("Deskripsi Singkat") },
                    placeholder = { Text("Penjelasan menu...") },
                    maxLines = 2,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val harga = hargaText.toIntOrNull() ?: 0
                    val stok = stokText.toIntOrNull() ?: 0
                    if (nama.isNotBlank() && harga > 0) {
                        onSave(nama, kategori, varian, harga, stok, desc, fotoUrl)
                    }
                },
                enabled = nama.isNotBlank(),
                colors = ButtonDefaults.buttonColors(containerColor = KantinBluePrimary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text("Simpan Menu")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
