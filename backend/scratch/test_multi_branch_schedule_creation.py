import os
import sys
import django

# Setup Django environment
sys.path.insert(0, '/Users/jeremiahpantaras/Downloads/PMS/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.clinics.models import Clinic, Practitioner
from apps.accounts.models import UserBranchAccess
from apps.subscriptions.models import Subscription
from apps.subscriptions.services import get_clinician_allocations_for_clinic

User = get_user_model()

print("=" * 80)
print("TESTING MULTI-BRANCH PRACTITIONER SCHEDULE CREATION & UPDATES")
print("=" * 80)

passed = 0
failed = 0

def assert_true(cond, msg):
    global passed, failed
    if cond:
        print(f"  [PASS] {msg}")
        passed += 1
    else:
        print(f"  [FAIL] {msg}")
        failed += 1

# Setup test fixtures
main_clinic, _ = Clinic.objects.get_or_create(
    name="Test Multi-Branch Main Clinic",
    defaults={"is_main_branch": True, "slug": "test-mb-main"}
)
branch_a, _ = Clinic.objects.get_or_create(
    name="Test Clinic Branch A",
    parent_clinic=main_clinic,
    defaults={"is_main_branch": False, "slug": "test-branch-a"}
)
branch_b, _ = Clinic.objects.get_or_create(
    name="Test Clinic Branch B",
    parent_clinic=main_clinic,
    defaults={"is_main_branch": False, "slug": "test-branch-b"}
)
branch_c, _ = Clinic.objects.get_or_create(
    name="Test Clinic Branch C",
    parent_clinic=main_clinic,
    defaults={"is_main_branch": False, "slug": "test-branch-c"}
)

sub, _ = Subscription.objects.get_or_create(clinic=main_clinic)
sub.plan = "ENTERPRISE"
sub.status = "ACTIVE"
sub.clinician_limit = 20
sub.save()

admin_user, _ = User.objects.get_or_create(
    email="admin.mb@example.com",
    defaults={
        "first_name": "Admin",
        "last_name": "Test",
        "role": "ADMIN",
        "roles": ["ADMIN"],
        "clinic": main_clinic,
        "is_active": True,
    }
)
admin_user.set_password("AdminPass123!")
admin_user.save()

client = APIClient()
client.force_authenticate(user=admin_user)

# Clean up previous test users if any
User.objects.filter(email__in=["dr.reyes@example.com", "dr.conflict@example.com"]).delete()

print("\n--- TEST 1: Overlap Validation Across Branches with 12-Hour Formatted Error ---")
overlap_payload = {
    "first_name": "Conflict",
    "last_name": "Tester",
    "email": "dr.conflict@example.com",
    "roles": ["PRACTITIONER"],
    "clinic_branch": branch_a.id,
    "duty_days": ["Mon"],
    "duty_schedule": {
        "Mon": [
            {"start": "08:00", "end": "12:00", "branch_id": branch_a.id},
            {"start": "11:00", "end": "15:00", "branch_id": branch_b.id}, # overlaps 11:00-12:00
        ]
    }
}
resp_overlap = client.post("/api/users/", overlap_payload, format="json")
assert_true(resp_overlap.status_code == 400, f"Overlapping shifts rejected with 400 (got {resp_overlap.status_code})")
error_str = str(resp_overlap.data)
assert_true("Working periods overlap" in error_str, f"Error contains 'Working periods overlap': {error_str}")
assert_true("8:00 AM" in error_str and "12:00 PM" in error_str, f"Error contains 12-hour formatted time: {error_str}")
assert_true(branch_a.name in error_str, f"Error mentions Branch A: {error_str}")
assert_true(branch_b.name in error_str, f"Error mentions Branch B: {error_str}")

print("\n--- TEST 2: Create Practitioner with Multi-Branch Schedule ---")
create_payload = {
    "first_name": "Elena",
    "last_name": "Reyes",
    "email": "dr.reyes@example.com",
    "roles": ["PRACTITIONER"],
    "clinic_branch": branch_a.id,
    "duty_days": ["Mon", "Tue"],
    "lunch_start_time": "12:00",
    "lunch_end_time": "13:00",
    "duty_schedule": {
        "Mon": [
            {"start": "08:00", "end": "12:00", "branch_id": branch_a.id},
            {"start": "13:00", "end": "17:00", "branch_id": branch_b.id},
        ],
        "Tue": [
            {"start": "09:00", "end": "12:00", "branch_id": branch_b.id},
            {"start": "13:00", "end": "17:00", "branch_id": branch_b.id},
        ]
    }
}
resp_create = client.post("/api/users/", create_payload, format="json")
assert_true(resp_create.status_code == 201, f"Practitioner created with 201 (got {resp_create.status_code})")

reyes_user = User.objects.get(email="dr.reyes@example.com")
assert_true(User.objects.filter(email="dr.reyes@example.com").count() == 1, "Exactly 1 User account created")
assert_true(Practitioner.objects.filter(user=reyes_user).count() == 1, "Exactly 1 Practitioner profile created")

# Verify UserBranchAccess rows
uba_a = UserBranchAccess.objects.filter(user=reyes_user, branch=branch_a, is_active=True).first()
uba_b = UserBranchAccess.objects.filter(user=reyes_user, branch=branch_b, is_active=True).first()
assert_true(uba_a is not None, "Active UserBranchAccess created for Branch A")
assert_true(uba_b is not None, "Active UserBranchAccess created for Branch B")

# Check sliced schedules
sched_a = uba_a.duty_schedule or {}
sched_b = uba_b.duty_schedule or {}
assert_true("Mon" in sched_a and len(sched_a["Mon"]) == 1, f"Branch A only has Mon (1 shift): {sched_a}")
assert_true("Tue" not in sched_a, f"Branch A has no Tue shifts: {sched_a}")
assert_true("Mon" in sched_b and len(sched_b["Mon"]) == 1, f"Branch B has Mon (1 shift): {sched_b.get('Mon')}")
assert_true("Tue" in sched_b and len(sched_b["Tue"]) == 2, f"Branch B has Tue (2 shifts): {sched_b.get('Tue')}")

# Verify clinician allocations count
# 2 unique branches -> consumes 2 clinician seats, NOT 4
active_ubas = UserBranchAccess.objects.filter(user=reyes_user, is_active=True).count()
assert_true(active_ubas == 2, f"Dr. Reyes has exactly 2 active branch access rows (got {active_ubas})")

print("\n--- TEST 3: Update Practitioner Schedule (Add Branch C, Remove Branch A) ---")
update_payload = {
    "duty_days": ["Mon", "Wed"],
    "duty_schedule": {
        "Mon": [
            {"start": "09:00", "end": "17:00", "branch_id": branch_b.id},
        ],
        "Wed": [
            {"start": "08:00", "end": "16:00", "branch_id": branch_c.id},
        ]
    }
}
resp_update = client.patch(f"/api/users/{reyes_user.id}/", update_payload, format="json")
assert_true(resp_update.status_code == 200, f"Practitioner updated with 200 (got {resp_update.status_code})")

# Verify Branch A is soft-deactivated (is_active=False)
uba_a_after = UserBranchAccess.objects.filter(user=reyes_user, branch=branch_a).first()
assert_true(uba_a_after and not uba_a_after.is_active, "Branch A assignment soft-deactivated (is_active=False)")

# Verify Branch B remains active with updated Mon shift
uba_b_after = UserBranchAccess.objects.filter(user=reyes_user, branch=branch_b, is_active=True).first()
assert_true(uba_b_after is not None, "Branch B remains active")
assert_true("Wed" not in (uba_b_after.duty_schedule or {}), "Branch B does not have Wed shifts")

# Verify Branch C is now active
uba_c_after = UserBranchAccess.objects.filter(user=reyes_user, branch=branch_c, is_active=True).first()
assert_true(uba_c_after is not None, "Branch C assignment created and active")
assert_true("Wed" in (uba_c_after.duty_schedule or {}), "Branch C has Wed shift")

print("\n--- TEST 4: Single Identity Verification ---")
assert_true(User.objects.filter(email="dr.reyes@example.com").count() == 1, "Only 1 User account exists after schedule update")
assert_true(Practitioner.objects.filter(user=reyes_user).count() == 1, "Only 1 Practitioner record exists after schedule update")

print("=" * 80)
print(f"RESULTS: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
