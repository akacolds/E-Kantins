package com.example.e_kantin.ui.main

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import com.example.e_kantin.model.UserSession
import com.example.e_kantin.ui.KantinTab
import com.example.e_kantin.ui.KantinViewModel
import com.example.e_kantin.ui.MuridTab
import com.example.e_kantin.ui.screens.CanteenDashboardScreen
import com.example.e_kantin.ui.screens.LoginScreen
import com.example.e_kantin.ui.screens.StudentDashboardScreen

@Composable
fun MainScreen(
    viewModel: KantinViewModel,
    modifier: Modifier = Modifier
) {
    val currentUser by viewModel.currentUser.collectAsState()
    val currentMuridTab by viewModel.currentMuridTab.collectAsState()
    val currentKantinTab by viewModel.currentKantinTab.collectAsState()
    val snackbarMsg by viewModel.snackbarMessage.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(snackbarMsg) {
        if (!snackbarMsg.isNullOrBlank()) {
            snackbarHostState.showSnackbar(snackbarMsg!!)
            viewModel.clearSnackbar()
        }
    }

    // BackHandler support
    BackHandler(enabled = currentUser != null) {
        when (currentUser) {
            is UserSession.MuridSession -> {
                if (currentMuridTab != MuridTab.MENU) {
                    viewModel.setMuridTab(MuridTab.MENU)
                } else {
                    viewModel.logout()
                }
            }
            is UserSession.KantinSession -> {
                if (currentKantinTab != KantinTab.PESANAN_MASUK) {
                    viewModel.setKantinTab(KantinTab.PESANAN_MASUK)
                } else {
                    viewModel.logout()
                }
            }
            null -> {}
        }
    }

    Scaffold(
        modifier = modifier.fillMaxSize(),
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (val user = currentUser) {
                null -> {
                    LoginScreen(viewModel = viewModel)
                }
                is UserSession.MuridSession -> {
                    StudentDashboardScreen(
                        session = user,
                        viewModel = viewModel
                    )
                }
                is UserSession.KantinSession -> {
                    CanteenDashboardScreen(
                        session = user,
                        viewModel = viewModel
                    )
                }
            }
        }
    }
}
