package com.example.e_kantin

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import com.example.e_kantin.data.KantinRepository
import com.example.e_kantin.theme.EKantinTheme
import com.example.e_kantin.ui.KantinViewModel
import com.example.e_kantin.ui.main.MainScreen

class MainActivity : ComponentActivity() {

    private val viewModel: KantinViewModel by viewModels {
        val repository = KantinRepository(applicationContext)
        KantinViewModel.provideFactory(repository)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            EKantinTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    MainScreen(viewModel = viewModel)
                }
            }
        }
    }
}
