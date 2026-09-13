package com.malasakit.clinic.data.local.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface SMSDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(sms: SMSEntity): Long

    @Insert(onConflict = OnConflictStrategy.IGNORE)
    suspend fun insertAll(messages: List<SMSEntity>): List<Long>

    @Update
    suspend fun update(sms: SMSEntity)

    @Query("SELECT * FROM sms_messages WHERE local_id = :localId LIMIT 1")
    suspend fun getById(localId: Long): SMSEntity?

    @Query("SELECT * FROM sms_messages WHERE remote_message_id = :remoteId LIMIT 1")
    suspend fun getByRemoteId(remoteId: String): SMSEntity?

    @Query("""
        SELECT * FROM sms_messages 
        WHERE direction = 'OUTBOUND' 
          AND status = 'QUEUED' 
          AND (next_attempt_at IS NULL OR next_attempt_at <= :nowMs) 
        ORDER BY priority DESC, created_at ASC
    """)
    suspend fun getPendingOutbound(nowMs: Long = System.currentTimeMillis()): List<SMSEntity>

    @Query("SELECT * FROM sms_messages WHERE status IN ('DELIVERED', 'FAILED') AND reported_to_server = 0 AND remote_message_id IS NOT NULL")
    suspend fun getUnreportedDeliveries(): List<SMSEntity>

    @Query("SELECT * FROM sms_messages WHERE direction = 'INBOUND' AND reported_to_server = 0")
    suspend fun getUnreportedInbound(): List<SMSEntity>

    @Query("SELECT * FROM sms_messages ORDER BY created_at DESC LIMIT :limit")
    fun getRecentLogs(limit: Int = 100): Flow<List<SMSEntity>>

    @Query("SELECT COUNT(*) FROM sms_messages WHERE direction = 'OUTBOUND' AND status = 'QUEUED'")
    fun observePendingCount(): Flow<Int>

    @Query("SELECT COUNT(*) FROM sms_messages WHERE direction = 'OUTBOUND' AND status IN ('SENT', 'DELIVERED') AND created_at >= :startOfDayMs")
    fun observeSentTodayCount(startOfDayMs: Long): Flow<Int>

    @Query("SELECT COUNT(*) FROM sms_messages WHERE direction = 'OUTBOUND' AND status = 'FAILED' AND created_at >= :startOfDayMs")
    fun observeFailedTodayCount(startOfDayMs: Long): Flow<Int>

    @Query("""
        UPDATE sms_messages 
        SET status = 'QUEUED', 
            retry_count = :newRetryCount, 
            next_attempt_at = :nextAttemptMs, 
            error_message = :errorMessage,
            carrier_error_code = :carrierCode
        WHERE local_id = :localId
    """)
    suspend fun scheduleRetry(
        localId: Long,
        newRetryCount: Int,
        nextAttemptMs: Long,
        errorMessage: String,
        carrierCode: String?
    )

    @Query("DELETE FROM sms_messages WHERE created_at < :olderThanMs")
    suspend fun purgeOlderThan(olderThanMs: Long): Int

    @Query("DELETE FROM sms_messages")
    suspend fun clearAll()
}
