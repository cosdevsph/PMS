# Proguard rules for Malasakit Clinic App
-keepattributes Signature
-keepattributes *Annotation*
-keep class com.malasakit.clinic.data.api.models.** { *; }
-keep class com.malasakit.clinic.data.local.db.** { *; }
