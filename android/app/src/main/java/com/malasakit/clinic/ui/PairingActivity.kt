package com.malasakit.clinic.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.google.android.material.snackbar.Snackbar
import com.google.gson.Gson
import com.google.zxing.client.android.BeepManager
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.malasakit.clinic.MalasakitApp
import com.malasakit.clinic.data.api.NetworkClient
import com.malasakit.clinic.data.api.models.QRPairingPayload
import com.malasakit.clinic.data.local.AppPreferences
import com.malasakit.clinic.data.repository.GatewayRepository
import com.malasakit.clinic.databinding.ActivityPairingBinding
import com.malasakit.clinic.service.SMSGatewayService
import com.malasakit.clinic.util.DeviceHardwareHelper
import kotlinx.coroutines.launch

class PairingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPairingBinding
    private lateinit var preferences: AppPreferences
    private lateinit var repository: GatewayRepository
    private lateinit var beepManager: BeepManager
    private val gson = Gson()

    private var isPairingInProgress = false
    private var isTorchOn = false

    private val cameraPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted ->
        if (isGranted) {
            startCameraScanner()
        } else {
            Snackbar.make(
                binding.root,
                "Camera permission is needed to scan QR code. You can also type the code manually below.",
                Snackbar.LENGTH_LONG
            ).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPairingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        preferences = (application as MalasakitApp).preferences
        repository = GatewayRepository(this, preferences, (application as MalasakitApp).database)
        beepManager = BeepManager(this)

        setupToolbar()
        displayDetectedSims()
        setupInputs()
        setupTorch()
        setupScanner()
    }

    private fun setupToolbar() {
        binding.toolbarPairing.setNavigationOnClickListener {
            finish()
        }
    }

    private fun displayDetectedSims() {
        val sims = DeviceHardwareHelper.detectSimCards(this)
        if (sims.isNotEmpty()) {
            val details = sims.joinToString(", ") { "${it.carrierName} (Slot ${it.slotIndex + 1})" }
            binding.tvDetectedSims.text = details
        } else {
            binding.tvDetectedSims.text = "No SIM card detected"
        }
    }

    private fun setupInputs() {
        binding.etServerUrl.setText(preferences.serverUrl)
        binding.etDeviceName.setText("${Build.MANUFACTURER} ${Build.MODEL}")

        // Auto-format pairing code (force uppercase, auto-insert hyphen)
        binding.etPairingCode.addTextChangedListener(object : TextWatcher {
            private var isUpdating = false

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (isUpdating || s == null) return

                val upper = s.toString().uppercase()
                if (upper != s.toString()) {
                    isUpdating = true
                    s.replace(0, s.length, upper)
                    isUpdating = false
                }

                // If user typed 3 chars starting with MAL without hyphen, insert hyphen
                if (upper.length == 3 && upper.equals("MAL", ignoreCase = true)) {
                    isUpdating = true
                    s.append("-")
                    isUpdating = false
                }
            }
        })

        binding.btnSubmitPairing.setOnClickListener {
            val code = binding.etPairingCode.text?.toString()?.trim()
            val url = binding.etServerUrl.text?.toString()?.trim()
            val name = binding.etDeviceName.text?.toString()?.trim()

            if (code.isNullOrBlank()) {
                binding.tilPairingCode.error = "Please enter a valid pairing code (e.g. MAL-AB12)"
                return@setOnClickListener
            }
            binding.tilPairingCode.error = null

            if (!url.isNullOrBlank()) {
                preferences.serverUrl = url
                NetworkClient.resetClient()
            }

            executePairing(code, name)
        }
    }

    private fun setupTorch() {
        binding.btnToggleTorch.setOnClickListener {
            isTorchOn = !isTorchOn
            if (isTorchOn) {
                binding.barcodeScannerView.setTorchOn()
            } else {
                binding.barcodeScannerView.setTorchOff()
            }
        }
    }

    private fun setupScanner() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            startCameraScanner()
        } else {
            cameraPermissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    private fun startCameraScanner() {
        binding.barcodeScannerView.decodeContinuous(object : BarcodeCallback {
            override fun barcodeResult(result: BarcodeResult?) {
                result?.text?.let { rawPayload ->
                    handleScannedData(rawPayload)
                }
            }
        })
    }

    private fun handleScannedData(rawText: String) {
        if (isPairingInProgress) return

        try {
            // Attempt parsing standard JSON QR format
            val payload = gson.fromJson(rawText, QRPairingPayload::class.java)
            val token = payload.getEffectiveToken()

            if (!token.isNullOrBlank()) {
                beepManager.playBeepSoundAndVibrate()

                // Expiration safeguard check
                val expiresAt = payload.expiresAtTimestamp
                if (expiresAt != null && expiresAt > 0) {
                    val currentSec = System.currentTimeMillis() / 1000
                    if (expiresAt < currentSec) {
                        showExpiredDialog()
                        return
                    }
                }

                isPairingInProgress = true
                binding.barcodeScannerView.pause()

                runOnUiThread {
                    binding.etPairingCode.setText(payload.code ?: token)
                    // If endpoint provided, extract base URL (remove /gateway/devices/pair/)
                    val endpoint = payload.endpoint ?: payload.apiLegacy
                    if (!endpoint.isNullOrBlank()) {
                        val baseUrl = extractBaseUrl(endpoint)
                        binding.etServerUrl.setText(baseUrl)
                        preferences.serverUrl = baseUrl
                        NetworkClient.resetClient()
                    }

                    val deviceName = binding.etDeviceName.text?.toString()?.trim()
                    executePairing(token, deviceName)
                }
                return
            }
        } catch (ignored: Exception) {
            // Check if raw string is just the 8-char code (e.g. MAL-XXXX)
            val trimmed = rawText.trim()
            if (trimmed.startsWith("MAL-", ignoreCase = true) || trimmed.length in 6..12) {
                beepManager.playBeepSoundAndVibrate()
                isPairingInProgress = true
                binding.barcodeScannerView.pause()

                runOnUiThread {
                    binding.etPairingCode.setText(trimmed)
                    val deviceName = binding.etDeviceName.text?.toString()?.trim()
                    executePairing(trimmed, deviceName)
                }
            }
        }
    }

    private fun extractBaseUrl(endpoint: String): String {
        val marker = "/gateway/"
        val index = endpoint.indexOf(marker)
        return if (index != -1) {
            endpoint.substring(0, index + 1) // e.g. "http://10.0.2.2:8000/api/"
        } else {
            endpoint
        }
    }

    private fun showExpiredDialog() {
        AlertDialog.Builder(this)
            .setTitle("QR Code Expired")
            .setMessage("This pairing session has expired (10-minute limit). Please refresh or click 'Pair Device' again on your computer screen to generate a new QR code.")
            .setPositiveButton("OK") { _, _ ->
                isPairingInProgress = false
                binding.barcodeScannerView.resume()
            }
            .show()
    }

    private fun executePairing(tokenOrCode: String, deviceCustomName: String?) {
        isPairingInProgress = true
        setLoadingState(true)
        binding.tvPairingError.visibility = View.GONE

        lifecycleScope.launch {
            val result = repository.pairWithToken(tokenOrCode, deviceCustomName)
            setLoadingState(false)

            result.onSuccess { response ->
                Toast.makeText(
                    this@PairingActivity,
                    "Paired successfully to ${response.clinicName ?: "Clinic"}!",
                    Toast.LENGTH_LONG
                ).show()

                // Immediately start the background SMS Gateway Foreground Service & Watchdog
                SMSGatewayService.startService(this@PairingActivity)
                com.malasakit.clinic.service.HeartbeatWorker.schedule(this@PairingActivity)
                preferences.isServiceRunning = true

                setResult(RESULT_OK)
                finish()
            }.onFailure { error ->
                isPairingInProgress = false
                binding.barcodeScannerView.resume()
                val msg = error.localizedMessage ?: "Connection failed"
                binding.tvPairingError.text = "Pairing failed: $msg"
                binding.tvPairingError.visibility = View.VISIBLE

                Toast.makeText(
                    this@PairingActivity,
                    "Pairing failed: $msg",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    private fun setLoadingState(loading: Boolean) {
        binding.layoutLoading.visibility = if (loading) View.VISIBLE else View.GONE
        binding.btnSubmitPairing.isEnabled = !loading
        binding.etPairingCode.isEnabled = !loading
        binding.etServerUrl.isEnabled = !loading
        binding.etDeviceName.isEnabled = !loading
    }

    override fun onResume() {
        super.onResume()
        if (!isPairingInProgress) {
            binding.barcodeScannerView.resume()
        }
    }

    override fun onPause() {
        super.onPause()
        binding.barcodeScannerView.pause()
        if (isTorchOn) {
            binding.barcodeScannerView.setTorchOff()
            isTorchOn = false
        }
    }
}
