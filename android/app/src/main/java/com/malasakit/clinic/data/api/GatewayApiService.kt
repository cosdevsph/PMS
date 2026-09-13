package com.malasakit.clinic.data.api

import com.malasakit.clinic.data.api.models.DeliveryReportRequest
import com.malasakit.clinic.data.api.models.GenericApiResponse
import com.malasakit.clinic.data.api.models.HeartbeatRequest
import com.malasakit.clinic.data.api.models.HeartbeatResponse
import com.malasakit.clinic.data.api.models.InboundSMSReportRequest
import com.malasakit.clinic.data.api.models.PairingRequest
import com.malasakit.clinic.data.api.models.PairingResponse
import com.malasakit.clinic.data.api.models.QueueClaimResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Query

/**
 * Retrofit interface for Malasakit Gateway backend communication.
 */
interface GatewayApiService {

    /**
     * Complete device registration & pairing using 10-minute one-time pairing token.
     */
    @POST("gateway/devices/pair/")
    suspend fun pairDevice(
        @Body request: PairingRequest
    ): Response<PairingResponse>

    /**
     * Periodic telemetry heartbeat reporting battery, connectivity, and active SIMs.
     */
    @POST("gateway/devices/heartbeat/")
    suspend fun sendHeartbeat(
        @Body request: HeartbeatRequest
    ): Response<HeartbeatResponse>

    /**
     * Atomically claim pending queued outbound SMS messages for this clinic.
     */
    @GET("gateway/queue/")
    suspend fun fetchQueue(
        @Query("limit") limit: Int = 10
    ): Response<QueueClaimResponse>

    /**
     * Report carrier delivery receipt or dispatch failure for a sent SMS.
     */
    @POST("gateway/webhooks/delivery/")
    suspend fun reportDelivery(
        @Body report: DeliveryReportRequest
    ): Response<GenericApiResponse>

    /**
     * Forward incoming patient reply SMS received on the clinic SIM card.
     */
    @POST("gateway/webhooks/inbound/")
    suspend fun reportInboundSMS(
        @Body inbound: InboundSMSReportRequest
    ): Response<GenericApiResponse>

    /**
     * Explicitly disconnect this device from the clinic.
     */
    @POST("gateway/devices/disconnect/")
    suspend fun disconnectDevice(): Response<GenericApiResponse>
}
