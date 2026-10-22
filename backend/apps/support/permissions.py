from rest_framework.permissions import BasePermission

# Roles that may see and manage ALL support feedback. Intentionally empty: the check this replaces
# compared against the codes OWNER and MANAGER, which no user held at the time, so nobody ever matched. The
# 2026-10-22 Owner / Branch Manager rename keeps that behavior; enabling it needs a clinic filter
# first (UserFeedback has no per-clinic scoping, so 'all' would span every clinic).
FEEDBACK_ADMIN_ROLES = ()


def has_feedback_admin_access(user):
    return any(role in FEEDBACK_ADMIN_ROLES for role in user.get_effective_roles())


class IsOwnerOrAdmin(BasePermission):
    """
    Normal users can only see and edit their own feedback.
    Roles in FEEDBACK_ADMIN_ROLES (currently none) can see and manage all feedback.
    """

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if has_feedback_admin_access(request.user):
            return True
            
        # For attachments/comments, check the parent feedback object
        if hasattr(obj, 'feedback'):
            return obj.feedback.submitted_by == request.user
            
        return obj.submitted_by == request.user
