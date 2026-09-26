package com.example.e_kantin.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Fastfood
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.FilterChip
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.example.e_kantin.model.MenuItem
import com.example.e_kantin.model.Order
import com.example.e_kantin.model.UserSession
import com.example.e_kantin.model.formatRupiah
import com.example.e_kantin.theme.KantinBluePrimary
import com.example.e_kantin.theme.KantinNavy
import com.example.e_kantin.ui.KantinViewModel
import com.example.e_kantin.ui.MuridTab
import com.example.e_kantin.ui.components.OrderChatBox
import com.example.e_kantin.ui.components.OrderStatusBadge
import com.example.e_kantin.ui.components.UserSessionBar

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun StudentDashboardScreen(
    session: UserSession.MuridSession,
    viewModel: KantinViewModel,
    modifier: Modifier = Modifier
) {
    val currentTab by viewModel.currentMuridTab.collectAsState()
    val menuItems by viewModel.filteredMenuItems.collectAsState()
    val allOrders by viewModel.allOrders.collectAsState()
    val filterStandId by viewModel.filterStandId.collectAsState()
    val filterCategory by viewModel.filterCategory.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedItemForOrder by viewModel.selectedItemForOrder.collectAsState()
    val chatInputs by viewModel.chatInputs.collectAsState()

    // Filter orders belonging to this student
    val myOrders = allOrders.filter { it.userKey == session.userKey }
    val activeOrdersCount = myOrders.count { it.status != "Siap Diambil" }

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
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Tab Katalog Menu
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (currentTab == MuridTab.MENU) KantinBluePrimary else Color(0xFFF1F5F9))
                        .clickable { viewModel.setMuridTab(MuridTab.MENU) }
                        .padding(vertical = 10.dp)
                        .testTag("tab_student_menu"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.Fastfood,
                            contentDescription = null,
                            tint = if (currentTab == MuridTab.MENU) Color.White else Color(0xFF475569),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Katalog Menu",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (currentTab == MuridTab.MENU) Color.White else Color(0xFF475569)
                        )
                    }
                }

                // Tab Pesanan Saya
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (currentTab == MuridTab.PESANAN_SAYA) KantinBluePrimary else Color(0xFFF1F5F9))
                        .clickable { viewModel.setMuridTab(MuridTab.PESANAN_SAYA) }
                        .padding(vertical = 10.dp)
                        .testTag("tab_student_orders"),
                    contentAlignment = Alignment.Center
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Default.ShoppingBag,
                            contentDescription = null,
                            tint = if (currentTab == MuridTab.PESANAN_SAYA) Color.White else Color(0xFF475569),
                            modifier = Modifier.size(16.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Pesanan Saya",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = if (currentTab == MuridTab.PESANAN_SAYA) Color.White else Color(0xFF475569)
                        )
                        if (activeOrdersCount > 0) {
                            Spacer(modifier = Modifier.width(6.dp))
                            Box(
                                modifier = Modifier
                                    .clip(CircleShape)
                                    .background(Color(0xFFEF4444))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            ) {
                                Text(
                                    text = "$activeOrdersCount",
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }

        // Tab Content
        when (currentTab) {
            MuridTab.MENU -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    // Search Bar
                    item {
                        OutlinedTextField(
                            value = searchQuery,
                            onValueChange = viewModel::setSearchQuery,
                            placeholder = { Text("Cari makanan, minuman, jajanan...", fontSize = 13.sp) },
                            leadingIcon = {
                                Icon(Icons.Default.Search, contentDescription = "Cari", modifier = Modifier.size(18.dp))
                            },
                            singleLine = true,
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier
                                .fillMaxWidth()
                                .testTag("search_menu_input")
                        )
                    }

                    // Stand Filter Chips
                    item {
                        Column {
                            Text(
                                text = "Filter Stand Kantin:",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.SemiBold,
                                color = Color(0xFF64748B),
                                modifier = Modifier.padding(bottom = 6.dp)
                            )
                            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                item {
                                    FilterChip(
                                        selected = filterStandId == null,
                                        onClick = { viewModel.setFilterStandId(null) },
                                        label = { Text("Semua Stand", fontSize = 12.sp) }
                                    )
                                }
                                items(viewModel.stands) { stand ->
                                    FilterChip(
                                        selected = filterStandId == stand.id,
                                        onClick = { viewModel.setFilterStandId(stand.id) },
                                        label = { Text("Kantin ${stand.id}", fontSize = 12.sp) }
                                    )
                                }
                            }
                        }
                    }

                    // Category Filter Chips
                    item {
                        val categories = listOf("Semua", "Makanan", "Minuman", "Camilan")
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            items(categories) { cat ->
                                FilterChip(
                                    selected = filterCategory == cat,
                                    onClick = { viewModel.setFilterCategory(cat) },
                                    label = { Text(cat, fontSize = 12.sp) }
                                )
                            }
                        }
                    }

                    // Menu Item Cards
                    if (menuItems.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "Belum ada menu yang cocok dengan filter.",
                                    color = Color.Gray,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    } else {
                        items(menuItems, key = { it.id }) { item ->
                            StudentMenuItemCard(
                                item = item,
                                onOrderClick = { viewModel.openOrderDialog(item) }
                            )
                        }
                    }
                }
            }

            MuridTab.PESANAN_SAYA -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Text(
                            text = "Status & Riwayat Pesanan Saya",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = KantinNavy
                        )
                    }

                    if (myOrders.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 60.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(
                                        imageVector = Icons.Default.ShoppingBag,
                                        contentDescription = null,
                                        tint = Color.LightGray,
                                        modifier = Modifier.size(48.dp)
                                    )
                                    Spacer(modifier = Modifier.height(10.dp))
                                    Text(
                                        text = "Belum ada riwayat pesanan.",
                                        fontSize = 14.sp,
                                        color = Color.Gray
                                    )
                                }
                            }
                        }
                    } else {
                        items(myOrders, key = { it.id }) { order ->
                            StudentOrderCard(
                                order = order,
                                chatInput = chatInputs[order.id] ?: "",
                                onChatInputChange = { viewModel.onChatInputChange(order.id, it) },
                                onSendChat = { viewModel.sendChatMessage(order.id, "murid") }
                            )
                        }
                    }
                }
            }
        }

        // Order Dialog
        if (selectedItemForOrder != null) {
            OrderPlacementDialog(
                item = selectedItemForOrder!!,
                viewModel = viewModel,
                onDismiss = viewModel::closeOrderDialog
            )
        }
    }
}

@Composable
fun StudentMenuItemCard(
    item: MenuItem,
    onOrderClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isOutOfStock = item.stok <= 0

    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("menu_card_${item.id}"),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column {
            // Food Image Box
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp)
                    .background(Color(0xFFE2E8F0))
            ) {
                AsyncImage(
                    model = item.foto,
                    contentDescription = item.nama,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )

                // Stand Badge Tag on Image
                Box(
                    modifier = Modifier
                        .padding(8.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(KantinNavy.copy(alpha = 0.85f))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "${item.namaKantin} • [${item.kategori}]",
                        color = Color.White,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            }

            Column(modifier = Modifier.padding(14.dp)) {
                Text(
                    text = item.nama,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = item.desc,
                    fontSize = 12.sp,
                    color = Color(0xFF64748B),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.padding(top = 4.dp, bottom = 8.dp)
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = formatRupiah(item.harga),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 16.sp,
                            color = KantinBluePrimary
                        )
                        Text(
                            text = if (isOutOfStock) "Stok Habis" else "Sisa Stok: ${item.stok}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (isOutOfStock) Color(0xFFDC2626) else Color(0xFF16A34A)
                        )
                    }

                    Button(
                        onClick = onOrderClick,
                        enabled = !isOutOfStock,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = KantinBluePrimary,
                            disabledContainerColor = Color(0xFFCBD5E1)
                        ),
                        shape = RoundedCornerShape(8.dp),
                        modifier = Modifier.testTag("btn_pesan_${item.id}")
                    ) {
                        Text(
                            text = if (isOutOfStock) "Stok Habis" else "Pesan Sekarang",
                            fontWeight = FontWeight.Bold,
                            fontSize = 12.sp
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun StudentOrderCard(
    order: Order,
    chatInput: String,
    onChatInputChange: (String) -> Unit,
    onSendChat: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .testTag("student_order_card_${order.id}"),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Top,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${order.namaMenu} (${order.qty} Porsi)",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = formatRupiah(order.harga),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = KantinBluePrimary
                    )
                    Text(
                        text = "Stand: Kantin ${order.kantinId} • Waktu: ${order.waktu}",
                        fontSize = 12.sp,
                        color = Color(0xFF64748B),
                        modifier = Modifier.padding(top = 2.dp)
                    )
                    Text(
                        text = "Varian: ${order.varian}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium,
                        color = Color(0xFF334155),
                        modifier = Modifier.padding(top = 2.dp)
                    )
                    Text(
                        text = "Catatan: \"${order.catatan}\"",
                        fontSize = 11.sp,
                        color = Color(0xFF64748B),
                        modifier = Modifier.padding(top = 2.dp)
                    )
                }

                OrderStatusBadge(status = order.status)
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Two-way interactive Chat
            OrderChatBox(
                chats = order.chats,
                currentSenderRole = "murid",
                inputText = chatInput,
                onInputChange = onChatInputChange,
                onSend = onSendChat
            )
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun OrderPlacementDialog(
    item: MenuItem,
    viewModel: KantinViewModel,
    onDismiss: () -> Unit
) {
    val selectedVarian by viewModel.orderVarian.collectAsState()
    val qty by viewModel.orderQty.collectAsState()
    val catatan by viewModel.orderCatatan.collectAsState()

    val totalHarga = item.harga * qty

    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Column {
                Text(text = "Pesan: ${item.nama}", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                Text(
                    text = "${item.namaKantin} • Bayar Langsung di Kantin",
                    fontSize = 12.sp,
                    color = Color(0xFF64748B)
                )
            }
        },
        text = {
            Column(modifier = Modifier.fillMaxWidth()) {
                // Varian Chips
                Text(
                    text = "Pilih Varian:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    modifier = Modifier.padding(bottom = 6.dp)
                )
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    item.varianList.forEach { v ->
                        FilterChip(
                            selected = selectedVarian == v,
                            onClick = { viewModel.setOrderVarian(v) },
                            label = { Text(v, fontSize = 11.sp) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Quantity Stepper
                Text(
                    text = "Jumlah Porsi:",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(6.dp))
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    IconButton(
                        onClick = viewModel::decrementOrderQty,
                        enabled = qty > 1,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(if (qty > 1) Color(0xFFE2E8F0) else Color(0xFFF1F5F9))
                    ) {
                        Icon(Icons.Default.Remove, contentDescription = "Kurang", modifier = Modifier.size(16.dp))
                    }

                    Text(
                        text = "$qty Porsi",
                        fontWeight = FontWeight.Bold,
                        fontSize = 15.sp
                    )

                    IconButton(
                        onClick = viewModel::incrementOrderQty,
                        enabled = qty < item.stok,
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(if (qty < item.stok) Color(0xFFE2E8F0) else Color(0xFFF1F5F9))
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Tambah", modifier = Modifier.size(16.dp))
                    }

                    Spacer(modifier = Modifier.weight(1f))
                    Text(
                        text = "Maks: ${item.stok}",
                        fontSize = 11.sp,
                        color = Color.Gray
                    )
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Catatan Field
                Text(
                    text = "Catatan Tambahan (Opsional):",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(4.dp))
                OutlinedTextField(
                    value = catatan,
                    onValueChange = viewModel::setOrderCatatan,
                    placeholder = { Text("Misal: Tanpa pedas, saus dipisah", fontSize = 12.sp) },
                    singleLine = true,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(14.dp))

                // Total Price Highlight Box
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(8.dp))
                        .background(Color(0xFFEFF6FF))
                        .padding(12.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "Total: ${formatRupiah(totalHarga)}",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 16.sp,
                        color = KantinBluePrimary
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = viewModel::confirmOrder,
                colors = ButtonDefaults.buttonColors(containerColor = KantinBluePrimary),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.testTag("btn_confirm_order")
            ) {
                Text("Kirim Pesanan", fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Batal")
            }
        }
    )
}
