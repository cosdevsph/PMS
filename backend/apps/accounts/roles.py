"""
Role codes and their legacy aliases.

Vocabulary (since 2026-10-22): the clinic owner is the **Owner** and the branch-level role is the
**Branch Manager**. Never "Admin", "Administrator", "Admin Assistant" or "Manager" for these roles.

The old codes (ADMIN, ADMIN_ASSISTANT, and the MANAGER permission-group template) are kept only as
*input* aliases for a transition period, so a browser tab or script that still sends them keeps
working. They are converted on the way in and never returned. Remove the aliases in a later release.
"""

ROLE_OWNER = 'OWNER'
ROLE_BRANCH_MANAGER = 'BRANCH_MANAGER'
ROLE_PRACTITIONER = 'PRACTITIONER'
ROLE_STAFF = 'STAFF'
ROLE_FINANCE = 'FINANCE'
ROLE_READ_ONLY = 'READ_ONLY'

# Highest priority first: decides the user's primary `role` when they hold several.
ROLE_PRIORITY = [
    ROLE_OWNER, ROLE_BRANCH_MANAGER, ROLE_PRACTITIONER, ROLE_STAFF, ROLE_FINANCE, ROLE_READ_ONLY,
]

# Legacy role codes -> current codes (input only).
LEGACY_ROLE_ALIASES = {
    'ADMIN': ROLE_OWNER,
    'ADMIN_ASSISTANT': ROLE_BRANCH_MANAGER,
}

# Legacy permission-group template codes -> current codes (input only). The old MANAGER and
# ADMIN_ASSISTANT templates had identical defaults and are merged into BRANCH_MANAGER.
LEGACY_TEMPLATE_ALIASES = {
    'MANAGER': ROLE_BRANCH_MANAGER,
    'ADMIN_ASSISTANT': ROLE_BRANCH_MANAGER,
}


def normalize_role(value):
    """Map a legacy role code to the current one; anything else is returned unchanged."""
    return LEGACY_ROLE_ALIASES.get(value, value)


def normalize_roles(values):
    """
    Map legacy codes in a list of roles, drop duplicates and keep the first occurrence's position.
    Non-list input is returned unchanged so callers can still validate it.
    """
    if not isinstance(values, (list, tuple)):
        return values
    seen, result = set(), []
    for value in values:
        value = normalize_role(value)
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def normalize_template(value):
    """Map a legacy permission-group template code to the current one."""
    return LEGACY_TEMPLATE_ALIASES.get(value, value)


def normalize_role_payload(data):
    """
    Return a copy of a request payload with legacy `role`, `roles` and `role_template` codes
    converted. Works for JSON dicts and (multipart) QueryDicts; other input is returned unchanged.
    """
    if not hasattr(data, 'get') or not hasattr(data, 'copy'):
        return data
    data = data.copy()
    if 'role' in data:
        data['role'] = normalize_role(data.get('role'))
    if 'roles' in data:
        if hasattr(data, 'getlist') and hasattr(data, 'setlist'):
            data.setlist('roles', normalize_roles(data.getlist('roles')))
        else:
            data['roles'] = normalize_roles(data['roles'])
    if 'role_template' in data:
        data['role_template'] = normalize_template(data.get('role_template'))
    return data
