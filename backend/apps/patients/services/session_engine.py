from apps.patients.models import PatientCase
from apps.appointments.models import Appointment
from apps.billing.models import Invoice

class SessionEngine:
    @staticmethod
    def get_session_stats(patient_case: PatientCase, service=None) -> dict:
        """
        Return session allocation stats.
        If service is provided and is a package, its session_allocation overrides the case's approved_sessions.
        """
        # PatientCase is the authoritative source of truth for session limits
        effective_limit = patient_case.approved_sessions
        is_unlimited = patient_case.is_unlimited
        allocation_source = patient_case.session_source

        # Backward compatibility fallback for legacy package appointments on unconfigured cases
        if (effective_limit is None and not is_unlimited) and service and getattr(service, 'is_package', False):
            effective_limit = service.session_allocation
            is_unlimited = False
            allocation_source = 'PACKAGE'

        if is_unlimited or not effective_limit:
            return {
                'approved_sessions': None,
                'completed_sessions': patient_case.completed_sessions,
                'remaining_sessions': None,
                'progress_text': None,  # Hide indicator if 0 or None
                'allocation_status': 'UNLIMITED' if is_unlimited else 'ACTIVE',
                'is_unlimited': True,
                'allocation_source': allocation_source
            }
        
        remaining = max(0, effective_limit - patient_case.completed_sessions)
        return {
            'approved_sessions': effective_limit,
            'completed_sessions': patient_case.completed_sessions,
            'remaining_sessions': remaining,
            'progress_text': f"{patient_case.completed_sessions}/{effective_limit}",
            'allocation_status': 'EXHAUSTED' if remaining == 0 else 'ACTIVE',
            'is_unlimited': False,
            'allocation_source': allocation_source
        }
