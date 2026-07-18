from apps.patients.models import PatientCase
from apps.appointments.models import Appointment

class SessionEngine:
    @staticmethod
    def get_session_stats(patient_case: PatientCase) -> dict:
        """
        Calculate the approved, completed, remaining sessions, and progress.
        Sessions are consumed only when an Appointment linked to this case is COMPLETED.
        """
        # Count completed appointments directly linked to this case
        completed = Appointment.objects.filter(
            patient_case=patient_case,
            status='COMPLETED'
        ).count()
        
        # Include completed appointments that are linked via ClinicalNote (for backward compatibility)
        # Old appointments might only have the case assigned via their ClinicalNote.
        legacy_completed = Appointment.objects.filter(
            clinical_notes_v2__patient_case=patient_case,
            status='COMPLETED'
        ).exclude(patient_case=patient_case).count()
        
        total_completed = completed + legacy_completed
        approved = patient_case.approved_sessions
        
        if approved is None:
            return {
                'approved_sessions': None,
                'completed_sessions': total_completed,
                'remaining_sessions': None,
                'progress_text': f"{total_completed} Sessions (Unlimited)"
            }
        
        remaining = max(0, approved - total_completed)
        
        return {
            'approved_sessions': approved,
            'completed_sessions': total_completed,
            'remaining_sessions': remaining,
            'progress_text': f"{total_completed} of {approved} Sessions Used"
        }
