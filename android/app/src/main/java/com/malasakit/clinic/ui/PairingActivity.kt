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
import com.google.zxing.BarcodeFormat
import com.google.zxing.DecodeHintType
import com.google.zxing.client.android.BeepManager
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.BarcodeResult
import com.journeyapps.barcodescanner.DefaultDecoderFactory
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
    private var lastInvalidScanToastTime = 0L

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

        // Auto-format pairing code (force uppercase, auto-insert hyphen after "MAL", ensure cursor is placed after the hyphen)
        binding.etPairingCode.addTextChangedListener(object : TextWatcher {
            private var isUpdating = false
            private var isDeleting = false

            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
                isDeleting = count > after
            }

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {}

            override fun afterTextChanged(s: Editable?) {
                if (isUpdating || s == null) return

                val raw = s.toString().uppercase()

                // If user is deleting and backspaced from MAL- to MAL, delete 'L' as well so user is at MA and not trapped
                if (isDeleting) {
                    if (raw == "MAL") {
                        isUpdating = true
                        s.replace(0, s.length, "MA")
                        binding.etPairingCode.setSelection(2)
                        isUpdating = false
                        return
                    }
                    if (raw != s.toString()) {
                        isUpdating = true
                        val sel = binding.etPairingCode.selectionStart
                        s.replace(0, s.length, raw)
                        binding.etPairingCode.setSelection(sel.coerceIn(0, s.length))
                        isUpdating = false
                    }
                    return
                }

                // Strip any characters that are not letters or digits
                val clean = raw.filter { it.isLetterOrDigit() }

                // Format pairing code
                val formatted = when {
                    clean.length < 3 -> clean
                    clean.startsWith("MAL") -> {
                        val suffix = clean.substring(3).take(4) // Max 4 alphanumeric chars after MAL-
                        "MAL-$suffix"
                    }
                    else -> clean.take(8)
                }

                if (formatted != s.toString()) {
                    isUpdating = true
                    s.replace(0, s.length, formatted)
                    // Place cursor immediately after the dash or newly typed character
                    binding.etPairingCode.setSelection(formatted.length)
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
                binding.etServerUrl.setText(preferences.serverUrl)
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
        // Restrict scanning to QR_CODE with TRY_HARDER, UTF-8, and both normal/inverted mode
        val hints = mapOf<DecodeHintType, Any>(
            DecodeHintType.TRY_HARDER to java.lang.Boolean.TRUE,
            DecodeHintType.POSSIBLE_FORMATS to listOf(BarcodeFormat.QR_CODE),
            DecodeHintType.CHARACTER_SET to "UTF-8"
        )
        binding.barcodeScannerView.barcodeView.decoderFactory = DefaultDecoderFactory(
            listOf(BarcodeFormat.QR_CODE),
            hints,
            "UTF-8",
            0 // Scan both normal and inverted QR codes
        )

        // Enable continuous camera autofocus for scanning laptop/desktop LCD screens
        binding.barcodeScannerView.cameraSettings.apply {
            isAutoFocusEnabled = true
            isContinuousFocusEnabled = true
        }

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

        val trimmed = rawText.trim()

        // 1. Attempt parsing standard JSON QR format from Web Dashboard
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
            try {
                val payload = gson.fromJson(trimmed, QRPairingPayload::class.java)
                val token = payload.getEffectiveToken()

                if (!token.isNullOrBlank() && (payload.type == "malasakit_sms_pairing" || payload.code != null || payload.token != null)) {
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
                // Not a valid JSON payload
            }
        }

        // 2. Check if raw string is strictly a manual pairing code (e.g. MAL-AB12)
        val pairingCodeRegex = Regex("^MAL-[A-Z0-9]{4}$", RegexOption.IGNORE_CASE)
        if (pairingCodeRegex.matches(trimmed)) {
            beepManager.playBeepSoundAndVibrate()
            isPairingInProgress = true
            binding.barcodeScannerView.pause()

            runOnUiThread {
                val upperCode = trimmed.uppercase()
                binding.etPairingCode.setText(upperCode)
                val deviceName = binding.etDeviceName.text?.toString()?.trim()
                executePairing(upperCode, deviceName)
            }
            return
        }

        // 3. If scanning failed or was not a valid Malasakit pairing payload:
        // Do NOT auto-fill the pairing code with random numbers; leave it completely blank.
        // Keep scanner running so user can align the valid QR code.
        val now = System.currentTimeMillis()
        if (now - lastInvalidScanToastTime > 3000) {
            lastInvalidScanToastTime = now
            runOnUiThread {
                Toast.makeText(
                    this,
                    "Not a Malasakit pairing QR code. Please scan the QR code from the Web Dashboard.",
                    Toast.LENGTH_SHORT
                ).show()
            }
        }
    }

    private fun extractBaseUrl(endpoint: String): String {
        var ep = endpoint
        if (ep.contains("malasakit.webservice.onrender.com")) {
            ep = ep.replace("malasakit.webservice.onrender.com", "malasakit-webservice.onrender.com")
        }
        val marker = "/gateway/"
        val index = ep.indexOf(marker)
        var base = if (index != -1) {
            ep.substring(0, index + 1) // e.g. "https://malasakit-webservice.onrender.com/api/"
        } else {
            ep
        }
        val isLocal = base.contains("10.0.2.2") ||
                base.contains("127.0.0.1") ||
                base.contains("localhost") ||
                base.contains("192.168.")
        if (base.startsWith("http://") && !isLocal) {
            base = "https://" + base.removePrefix("http://")
        } else if (!base.startsWith("http://") && !base.startsWith("https://")) {
            base = if (isLocal) "http://$base" else "https://$base"
        }
        if (!base.endsWith("/")) {
            base = "$base/"
        }
        return base
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
