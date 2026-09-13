package com.malasakit.clinic.ui

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.malasakit.clinic.MalasakitApp
import com.malasakit.clinic.R
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.repository.GatewayRepository
import com.malasakit.clinic.databinding.ActivityMainBinding
import com.malasakit.clinic.service.SMSGatewayService
import com.malasakit.clinic.util.DeviceHardwareHelper
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private lateinit var preferences: AppPreferences
    private lateinit var repository: GatewayRepository

    private val requiredPermissions = buildList {
        add(Manifest.permission.SEND_SMS)
        add(Manifest.permission.RECEIVE_SMS)
        add(Manifest.permission.READ_PHONE_STATE)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { results ->
        val allGranted = results.all { it.value }
        if (allGranted) {
            updateTelemetryDisplay()
        } else {
            Toast.makeText(this, "Permissions are required to send clinic SMS", Toast.LENGTH_LONG).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        preferences = (application as MalasakitApp).preferences
        repository = GatewayRepository(this, preferences, (application as MalasakitApp).database)

        setupUI()
        observeDatabaseState()
        checkPermissions()
    }

    override fun onResume() {
        super.onResume()
        updateDeviceStateUI()
        updateTelemetryDisplay()
    }

    private fun setupUI() {
        binding.btnScanQR.setOnClickListener {
            val intent = Intent(this, PairingActivity::class.java)
            startActivity(intent)
        }

        binding.btnSettings.setOnClickListener {
            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }

        binding.btnToggleService.setOnClickListener {
            toggleGatewayService()
        }

        binding.btnDisconnect.setOnClickListener {
            confirmDisconnect()
        }
    }

    private fun checkPermissions() {
        val missing = requiredPermissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        }
    }

    private fun updateDeviceStateUI() {
        val isPaired = preferences.isPaired
        val isRunning = preferences.isServiceRunning

        if (isPaired) {
            binding.tvClinicStatus.text = "Linked & Ready"
            binding.tvClinicName.text = preferences.clinicName ?: "Malasakit Clinic"
            binding.tvServerEndpoint.text = "Server: ${preferences.serverUrl}"
            binding.tvServerEndpoint.visibility = View.VISIBLE

            binding.layoutUnpairedActions.visibility = View.GONE
            binding.layoutPairedActions.visibility = View.VISIBLE

            val dotColor = if (isRunning) Color.parseColor("#10B981") else Color.parseColor("#F59E0B")
            setStatusDotColor(dotColor)

            if (isRunning) {
                binding.btnToggleService.text = "Stop Gateway"
                binding.btnToggleService.backgroundTintList = ContextCompat.getColorStateList(this, android.R.color.darker_gray)
            } else {
                binding.btnToggleService.text = "Start Gateway"
                binding.btnToggleService.backgroundTintList = ContextCompat.getColorStateList(this, R.color.teal_700)
            }
        } else {
            binding.tvClinicStatus.text = getString(R.string.status_unpaired)
            binding.tvClinicName.text = "Pair this phone with your Malasakit Web Dashboard to send patient appointment reminders."
            binding.tvServerEndpoint.visibility = View.GONE

            binding.layoutUnpairedActions.visibility = View.VISIBLE
            binding.layoutPairedActions.visibility = View.GONE

            setStatusDotColor(Color.parseColor("#94A3B8"))
        }
    }

    private fun setStatusDotColor(colorInt: Int) {
        val drawable = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(colorInt)
        }
        binding.viewStatusIndicator.background = drawable
    }

    private fun updateTelemetryDisplay() {
        // Battery
        val batteryLevel = DeviceHardwareHelper.getBatteryLevel(this)
        val isCharging = DeviceHardwareHelper.isDeviceCharging(this)
        binding.tvBatteryStatus.text = if (isCharging) "$batteryLevel% (Charging)" else "$batteryLevel%"

        // SIM Carrier
        val sims = DeviceHardwareHelper.detectSimCards(this)
        if (sims.isNotEmpty()) {
            val carrierNames = sims.joinToString(" / ") { it.carrierName }
            binding.tvSimCarrier.text = carrierNames
        } else {
            binding.tvSimCarrier.text = "No SIM Detected"
        }
    }

    private fun observeDatabaseState() {
        lifecycleScope.launch {
            repository.observePendingCount().collectLatest { count ->
                binding.tvPendingCount.text = count.toString()
            }
        }

        lifecycleScope.launch {
            repository.observeSentTodayCount().collectLatest { count ->
                binding.tvSentCount.text = count.toString()
            }
        }
    }

    private fun toggleGatewayService() {
        if (!preferences.isPaired) {
            Toast.makeText(this, "Pair device first", Toast.LENGTH_SHORT).show()
            return
        }

        if (preferences.isServiceRunning) {
            SMSGatewayService.stopService(this)
            preferences.isServiceRunning = false
            Toast.makeText(this, "SMS Gateway stopped", Toast.LENGTH_SHORT).show()
        } else {
            SMSGatewayService.startService(this)
            preferences.isServiceRunning = true
            Toast.makeText(this, "SMS Gateway started", Toast.LENGTH_SHORT).show()
        }
        updateDeviceStateUI()
    }

    private fun confirmDisconnect() {
        AlertDialog.Builder(this)
            .setTitle("Unlink Device?")
            .setMessage("This phone will stop sending SMS messages for ${preferences.clinicName ?: "the clinic"}. You can re-pair at any time.")
            .setPositiveButton("Unlink") { _, _ ->
                lifecycleScope.launch {
                    SMSGatewayService.stopService(this@MainActivity)
                    preferences.isServiceRunning = false
                    repository.disconnectDevice()
                    updateDeviceStateUI()
                    Toast.makeText(this@MainActivity, "Device unlinked", Toast.LENGTH_SHORT).show()
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
