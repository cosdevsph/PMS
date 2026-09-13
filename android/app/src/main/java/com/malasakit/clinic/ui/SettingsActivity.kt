package com.malasakit.clinic.ui

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.malasakit.clinic.MalasakitApp
import com.malasakit.clinic.R
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.repository.GatewayRepository
import com.malasakit.clinic.databinding.ActivitySettingsBinding
import com.malasakit.clinic.util.DeviceHardwareHelper
import kotlinx.coroutines.launch

class SettingsActivity : AppCompatActivity() {

    private lateinit var binding: ActivitySettingsBinding
    private lateinit var preferences: AppPreferences
    private lateinit var repository: GatewayRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySettingsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        preferences = (application as MalasakitApp).preferences
        repository = GatewayRepository(this, preferences, (application as MalasakitApp).database)

        setupToolbar()
        loadPreferences()
        setupListeners()
    }

    private fun setupToolbar() {
        binding.toolbarSettings.setNavigationOnClickListener {
            finish()
        }
    }

    private fun loadPreferences() {
        // SIM slot selection
        val sims = DeviceHardwareHelper.detectSimCards(this)
        if (sims.isNotEmpty()) {
            binding.rbSimSlot1.text = "SIM 1 (${sims[0].carrierName})"
            if (sims.size > 1) {
                binding.rbSimSlot2.text = "SIM 2 (${sims[1].carrierName})"
                binding.rbSimSlot2.isEnabled = true
            } else {
                binding.rbSimSlot2.text = "SIM 2 (Not Detected)"
                binding.rbSimSlot2.isEnabled = false
            }
        }

        if (preferences.preferredSimSlot == 1 && sims.size > 1) {
            binding.rbSimSlot2.isChecked = true
        } else {
            binding.rbSimSlot1.isChecked = true
        }

        // Auto boot toggle
        binding.switchAutoBoot.isChecked = preferences.autoStartOnBoot
    }

    private fun setupListeners() {
        binding.rgSimSlot.setOnCheckedChangeListener { _, checkedId ->
            val slot = if (checkedId == R.id.rbSimSlot2) 1 else 0
            preferences.preferredSimSlot = slot
        }

        binding.switchAutoBoot.setOnCheckedChangeListener { _, isChecked ->
            preferences.autoStartOnBoot = isChecked
        }

        binding.btnTestHeartbeat.setOnClickListener {
            testConnection()
        }
    }

    private fun testConnection() {
        if (!preferences.isPaired) {
            binding.tvDiagnosticStatus.text = "Device is not paired to any clinic."
            return
        }

        binding.tvDiagnosticStatus.text = "Testing connection..."
        binding.btnTestHeartbeat.isEnabled = false

        lifecycleScope.launch {
            val result = repository.sendHeartbeat()
            binding.btnTestHeartbeat.isEnabled = true

            result.onSuccess { response ->
                binding.tvDiagnosticStatus.text = "Heartbeat Success! Device is ${response.deviceStatus ?: "ACTIVE"}. Queued in backend: ${response.queueCount}"
            }.onFailure { error ->
                binding.tvDiagnosticStatus.text = "Heartbeat Failed: ${error.localizedMessage}"
            }
        }
    }
}
