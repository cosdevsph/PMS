package com.malasakit.clinic.data.api

import android.content.Context
import android.os.Build
import com.malasakit.clinic.data.local.AppPreferences
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

/**
 * Singleton networking manager providing authenticated Retrofit instance for Malasakit Gateway.
 */
object NetworkClient {

    @Volatile
    private var apiService: GatewayApiService? = null

    @Volatile
    private var currentBaseUrl: String? = null

    fun getApiService(context: Context): GatewayApiService {
        val prefs = AppPreferences(context)
        val targetUrl = prefs.serverUrl

        val existing = apiService
        if (existing != null && currentBaseUrl == targetUrl) {
            return existing
        }

        return synchronized(this) {
            if (apiService != null && currentBaseUrl == targetUrl) {
                apiService!!
            } else {
                currentBaseUrl = targetUrl
                val client = buildOkHttpClient(prefs)
                val retrofit = Retrofit.Builder()
                    .baseUrl(targetUrl)
                    .client(client)
                    .addConverterFactory(GsonConverterFactory.create())
                    .build()

                val newService = retrofit.create(GatewayApiService::class.java)
                apiService = newService
                newService
            }
        }
    }

    /**
     * Rebuilds the Retrofit client if the base URL changed via QR code or manual input.
     */
    fun resetClient() {
        synchronized(this) {
            apiService = null
            currentBaseUrl = null
        }
    }

    private fun buildOkHttpClient(prefs: AppPreferences): OkHttpClient {
        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = HttpLoggingInterceptor.Level.BODY
        }

        val authInterceptor = Interceptor { chain ->
            val original = chain.request()
            val requestBuilder = original.newBuilder()
                .header("User-Agent", "MalasakitClinicApp/1.0 (Android ${Build.VERSION.RELEASE}; SDK ${Build.VERSION.SDK_INT}; ${Build.MANUFACTURER} ${Build.MODEL})")
                .header("Accept", "application/json")

            val token = prefs.deviceToken
            if (!token.isNullOrBlank()) {
                requestBuilder.header("Authorization", "Bearer $token")
            }

            chain.proceed(requestBuilder.build())
        }

        return OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .retryOnConnectionFailure(true)
            .build()
    }
}
