package com.example.e_kantin.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = DarkPrimary,
    onPrimary = Color(0xFF0F172A),
    secondary = Color(0xFF94A3B8),
    tertiary = Color(0xFFFDBA74),
    background = DarkBackground,
    surface = DarkSurface,
    surfaceVariant = DarkSurfaceVariant,
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC)
)

private val LightColorScheme = lightColorScheme(
    primary = KantinBluePrimary,
    onPrimary = Color.White,
    primaryContainer = KantinBlueContainer,
    onPrimaryContainer = KantinOnBlueContainer,
    secondary = KantinNavy,
    onSecondary = Color.White,
    tertiary = KantinOrange,
    onTertiary = Color.White,
    tertiaryContainer = KantinOrangeContainer,
    onTertiaryContainer = KantinOnOrangeContainer,
    background = KantinBackground,
    onBackground = KantinTextPrimary,
    surface = KantinSurface,
    onSurface = KantinTextPrimary,
    surfaceVariant = KantinSurfaceVariant,
    outline = KantinBorder
)

@Composable
fun EKantinTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
