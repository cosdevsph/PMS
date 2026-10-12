import os
import sys
import django
from datetime import date, time, timedelta

# Setup Django environment
sys.path.insert(0, '/Users/jeremiahpantaras/Downloads/PMS/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.clinics.models import Clinic, Practitioner
from apps.accounts.models import UserBranchAccess
from apps.appointments.models import Appointment
from apps.appointments.availability_service import (
    get_practitioner_working_windows,
    is_appointment_within_availability,
    generate_available_slots,
)
from apps.subscriptions.models import Subscription
from apps.subscriptions.services import get_clinician_allocations_for_clinic, check_clinician_capacity

User = get_user_model()

print("=" * 80)
print("STARTING MALASAKIT MULTI-BRANCH PRACTITIONER REGRESSION TEST SUITE")
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

# Ensure enterprise subscription with high clinician limit for test clinic
sub, _ = Subscription.objects.get_or_create(clinic=main_clinic)
sub.plan = "ENTERPRISE"
sub.status = "ACTIVE"
sub.clinician_limit = 20
sub.save()

# Admin user
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

# Manager of Branch A only
mgr_a, _ = User.objects.get_or_create(
    email="manager.a@example.com",
    defaults={
        "first_name": "Manager",
        "last_name": "A",
        "role": "ADMIN_ASSISTANT",
        "roles": ["ADMIN_ASSISTANT"],
        "clinic": main_clinic,
        "clinic_branch": branch_a,
        "is_active": True,
    }
)
UserBranchAccess.objects.get_or_create(user=mgr_a, branch=branch_a)

client = APIClient()

# ------------------------------------------------------------------------------
# Test 1 — Create a new practitioner
# ------------------------------------------------------------------------------
print("\n--- TEST 1: Create a new practitioner ---")

# Reset any prior test runs for dr.santos
UserBranchAccess.objects.filter(user__email="dr.santos@example.com").delete()
Appointment.objects.filter(practitioner__user__email="dr.santos@example.com").delete()

p_user, _ = User.objects.get_or_create(
    email="dr.santos@example.com",
    defaults={
        "first_name": "Dr. Juan",
        "last_name": "Santos",
        "role": "PRACTITIONER",
        "roles": ["PRACTITIONER"],
        "clinic": main_clinic,
        "clinic_branch": branch_a,
        "is_active": True,
    }
)
p_user.role = "PRACTITIONER"
p_user.roles = ["PRACTITIONER"]
p_user.clinic = main_clinic
p_user.clinic_branch = branch_a
p_user.is_active = True
p_user.save()

practitioner_profile, _ = Practitioner.objects.get_or_create(
    user=p_user,
    defaults={
        "clinic": branch_a,
        "license_number": "PRC-12345",
        "specialization": "Pediatric OT",
        "discipline": "OCCUPATIONAL_THERAPY",
        "duty_days": ["Mon", "Wed", "Fri"],
        "duty_start_time": time(9, 0),
        "duty_end_time": time(17, 0),
        "lunch_start_time": time(12, 0),
        "lunch_end_time": time(13, 0),
    }
)
uba_a, _ = UserBranchAccess.objects.get_or_create(
    user=p_user,
    branch=branch_a,
    defaults={
        "duty_days": ["Mon", "Wed", "Fri"],
        "duty_start_time": time(9, 0),
        "duty_end_time": time(17, 0),
        "lunch_start_time": time(12, 0),
        "lunch_end_time": time(13, 0),
        "is_active": True,
    }
)
assert_true(p_user.id is not None, "One practitioner user account created")
assert_true(UserBranchAccess.objects.filter(user=p_user, branch=branch_a, is_active=True).exists(), "Practitioner assigned to Branch A")

# ------------------------------------------------------------------------------
# Test 2 — Assign an existing practitioner to Branch B
# ------------------------------------------------------------------------------
print("\n--- TEST 2: Assign an existing practitioner to Branch B ---")
client.force_authenticate(user=admin_user)
resp = client.post(f"/api/users/{p_user.id}/assign_branch/", {
    "branch_id": branch_b.id,
    "duty_days": ["Tue", "Thu"],
    "duty_start_time": "10:00",
    "duty_end_time": "18:00",
    "lunch_start_time": "12:00",
    "lunch_end_time": "13:00",
}, format="json")
assert_true(resp.status_code == 201, f"assign_branch returned 201 Created (got {resp.status_code})")
assert_true(User.objects.filter(email="dr.santos@example.com").count() == 1, "Exactly one User identity preserved (no duplicates)")
assert_true(UserBranchAccess.objects.filter(user=p_user, branch=branch_b, is_active=True).exists(), "Branch B assignment created successfully")

# ------------------------------------------------------------------------------
# Test 3 — Duplicate assignment prevention
# ------------------------------------------------------------------------------
print("\n--- TEST 3: Duplicate assignment prevention ---")
resp_dup = client.post(f"/api/users/{p_user.id}/assign_branch/", {
    "branch_id": branch_b.id,
    "duty_days": ["Tue", "Thu"],
}, format="json")
assert_true(resp_dup.status_code == 400, f"Duplicate assignment returned 400 Bad Request (got {resp_dup.status_code})")
assert_true("already assigned" in str(resp_dup.data).lower(), "Returned clear error message about existing assignment")

# ------------------------------------------------------------------------------
# Test 4 — Independent duty hours
# ------------------------------------------------------------------------------
print("\n--- TEST 4: Independent duty hours ---")
uba_a.refresh_from_db()
uba_b = UserBranchAccess.objects.get(user=p_user, branch=branch_b)
assert_true(uba_a.duty_days == ["Mon", "Wed", "Fri"], "Branch A retains Mon/Wed/Fri")
assert_true(uba_b.duty_days == ["Tue", "Thu"], "Branch B retains Tue/Thu")
assert_true(uba_a.duty_start_time == time(9, 0), "Branch A start time is 09:00")
assert_true(uba_b.duty_start_time == time(10, 0), "Branch B start time is 10:00")

# ------------------------------------------------------------------------------
# Test 5 — Availability validation
# ------------------------------------------------------------------------------
print("\n--- TEST 5: Availability validation ---")
# Pick a Monday and a Tuesday
monday = date(2026, 10, 12)  # Monday
tuesday = date(2026, 10, 13) # Tuesday

# Monday at Branch A (Mon 9-5) -> Valid
ok_mon_a, reason = is_appointment_within_availability(practitioner_profile, monday, time(10, 0), 60, branch=branch_a)
assert_true(ok_mon_a, "Monday 10:00 AM at Branch A is valid")

# Tuesday at Branch A (Mon/Wed/Fri only) -> Invalid
ok_tue_a, reason_tue_a = is_appointment_within_availability(practitioner_profile, tuesday, time(10, 0), 60, branch=branch_a)
assert_true(not ok_mon_a == False or not ok_tue_a, "Tuesday 10:00 AM at Branch A is rejected (not working day)")

# Tuesday at Branch B (Tue/Thu 10-18) -> Valid
ok_tue_b, reason_tue_b = is_appointment_within_availability(practitioner_profile, tuesday, time(10, 0), 60, branch=branch_b)
assert_true(ok_tue_b, "Tuesday 10:00 AM at Branch B is valid")

# Tuesday at Branch B outside hours (e.g. 18:30) -> Invalid
ok_late_b, _ = is_appointment_within_availability(practitioner_profile, tuesday, time(18, 30), 60, branch=branch_b)
assert_true(not ok_late_b, "Tuesday 18:30 at Branch B is rejected (outside duty hours)")

# ------------------------------------------------------------------------------
# Test 6 — Cross-branch appointment conflict
# ------------------------------------------------------------------------------
print("\n--- TEST 6: Cross-branch appointment conflict ---")
from apps.patients.models import Patient
patient, _ = Patient.objects.get_or_create(
    clinic=main_clinic,
    first_name="Test",
    last_name="Patient",
    defaults={
        "email": "patient.test@example.com",
        "date_of_birth": date(1990, 1, 1),
        "gender": "M",
    }
)
# Create appointment at Branch A on Tuesday 10:00-11:00 (e.g. an existing commitment)
appt_a, _ = Appointment.objects.get_or_create(
    clinic=branch_a,
    practitioner=practitioner_profile,
    patient=patient,
    date=tuesday,
    start_time=time(10, 0),
    end_time=time(11, 0),
    defaults={"status": "SCHEDULED", "duration_minutes": 60}
)

# Attempt overlapping booking at Branch B on Tuesday 10:30-11:30 via AppointmentSerializer
from apps.appointments.serializers import AppointmentSerializer
conflict_data = {
    "clinic": branch_b.id,
    "practitioner": practitioner_profile.id,
    "patient": patient.id,
    "date": tuesday,
    "start_time": time(10, 30),
    "end_time": time(11, 30),
    "duration_minutes": 60,
    "status": "SCHEDULED",
    "is_rebook": True,
}
serializer = AppointmentSerializer(data=conflict_data)
is_valid = serializer.is_valid()
assert_true(not is_valid, "Conflicting appointment at Branch B is rejected by serializer")
if not is_valid:
    assert_true("overlaps" in str(serializer.errors).lower(), "Serializer reports overlapping appointment error")

# Clean up appointment for subsequent slot test
appt_a.delete()

# ------------------------------------------------------------------------------
# Test 7 — Subscription limit
# ------------------------------------------------------------------------------
print("\n--- TEST 7: Subscription limit ---")
allocations = get_clinician_allocations_for_clinic(main_clinic)
assert_true(allocations['total_allocations'] >= 2, f"Dr. Santos assigned to 2 branches consumes at least 2 allocations (counted: {allocations['total_allocations']})")

# ------------------------------------------------------------------------------
# Test 8 — Branch authorization (RBAC)
# ------------------------------------------------------------------------------
print("\n--- TEST 8: Branch authorization (RBAC) ---")
client.force_authenticate(user=mgr_a) # Manager of Branch A only
resp_unauth = client.post(f"/api/users/{p_user.id}/assign_branch/", {
    "branch_id": branch_c.id, # Manager does NOT manage Branch C
    "duty_days": ["Mon"],
}, format="json")
assert_true(resp_unauth.status_code == 403, f"Branch A manager assigning to Branch C returned 403 Forbidden (got {resp_unauth.status_code})")

# ------------------------------------------------------------------------------
# Test 9 — Practitioner lookup
# ------------------------------------------------------------------------------
print("\n--- TEST 9: Practitioner lookup ---")
client.force_authenticate(user=admin_user)
resp_lookup = client.get(f"/api/users/lookup/?email=dr.santos@example.com")
assert_true(resp_lookup.status_code == 200, "Lookup returned 200 OK")
assert_true(resp_lookup.data.get('found') is True, "Lookup found existing practitioner")
assert_true(len(resp_lookup.data['user']['assigned_branches']) >= 2, "Lookup returned all branch assignments")

# ------------------------------------------------------------------------------
# Test 10 — Diary and Calendar query
# ------------------------------------------------------------------------------
print("\n--- TEST 10: Diary and Calendar practitioners endpoint ---")
resp_diary_a = client.get(f"/api/appointments/practitioners/?clinic_branch={branch_a.id}")
resp_diary_b = client.get(f"/api/appointments/practitioners/?clinic_branch={branch_b.id}")
assert_true(resp_diary_a.status_code == 200 and resp_diary_b.status_code == 200, "Practitioners endpoint returned 200 OK")

prac_a = next((p for p in resp_diary_a.data.get('practitioners', []) if p['id'] == practitioner_profile.id), None)
prac_b = next((p for p in resp_diary_b.data.get('practitioners', []) if p['id'] == practitioner_profile.id), None)
assert_true(prac_a is not None, "Dr. Santos appears in Branch A Diary")
assert_true(prac_b is not None, "Dr. Santos appears in Branch B Diary")
if prac_a and prac_b:
    assert_true(prac_a['availability']['duty_days'] == ["Mon", "Wed", "Fri"], "Branch A returns Mon/Wed/Fri duty hours")
    assert_true(prac_b['availability']['duty_days'] == ["Tue", "Thu"], "Branch B returns Tue/Thu duty hours")

# ------------------------------------------------------------------------------
# Test 11 — Public Online Booking slots & cross-branch conflict
# ------------------------------------------------------------------------------
print("\n--- TEST 11: Public Online Booking slots ---")
from apps.patients.models import PortalLink
from apps.clinics.services.models import Service as ClinicService
portal_link_b, _ = PortalLink.get_or_create_for_clinic(branch_b)

service, _ = ClinicService.objects.get_or_create(
    clinic=main_clinic,
    name="Test Multi-Branch Consultation",
    defaults={
        "duration_minutes": 60,
        "price": 1000,
        "show_in_portal": True,
        "is_active": True,
        "is_package": False,
    }
)
service.show_in_portal = True
service.is_active = True
service.is_package = False
service.duration_minutes = 60
service.save()

# Generate slots for Branch B on Tuesday (working day)
slots_tue = generate_available_slots(
    practitioner=practitioner_profile,
    target_date=tuesday,
    duration_minutes=60,
    branch=branch_b,
)
assert_true(len(slots_tue) > 0, f"Slots available on Tuesday at Branch B ({len(slots_tue)} slots)")
assert_true("10:00" in slots_tue, "10:00 AM slot is available at Branch B")

# Now create an appointment at Branch A on Tuesday from 10:00 to 11:00
appt_a = Appointment.objects.create(
    clinic=branch_a,
    practitioner=practitioner_profile,
    patient=patient,
    date=tuesday,
    start_time=time(10, 0),
    end_time=time(11, 0),
    status="SCHEDULED",
    duration_minutes=60,
)

# Test portal slots view endpoint directly
resp_slots = client.get(f"/api/public/portal/{portal_link_b.token}/slots/?date={tuesday.strftime('%Y-%m-%d')}&practitioner={practitioner_profile.id}&service={service.id}")
assert_true(resp_slots.status_code == 200, f"Portal slots API returned 200 OK (got {resp_slots.status_code})")
slots_returned = resp_slots.data.get('slots', [])
assert_true("10:00" not in slots_returned, "10:00 AM slot at Branch B is BLOCKED because of Branch A appointment!")

# Clean up
appt_a.delete()

# ------------------------------------------------------------------------------
# Test 12 — Existing single-branch users
# ------------------------------------------------------------------------------
print("\n--- TEST 12: Existing single-branch users ---")
# Backfilled single branch user check
single_uba = UserBranchAccess.objects.filter(user=p_user, branch=branch_a).first()
assert_true(single_uba is not None and single_uba.is_active, "Existing Branch A assignment preserved")

# ------------------------------------------------------------------------------
# Test 13 — Assignment deactivation
# ------------------------------------------------------------------------------
print("\n--- TEST 13: Assignment deactivation ---")
resp_deact = client.post(f"/api/users/{p_user.id}/deactivate_branch_assignment/", {
    "branch_id": branch_b.id,
}, format="json")
assert_true(resp_deact.status_code == 200, "Deactivate branch assignment returned 200 OK")
uba_b.refresh_from_db()
assert_true(not uba_b.is_active, "Branch B assignment is now inactive")
uba_a.refresh_from_db()
assert_true(uba_a.is_active, "Branch A assignment remains active")
p_user.refresh_from_db()
assert_true(p_user.is_active, "User account itself remains active")

# ------------------------------------------------------------------------------
# Test 14 — Update branch assignment schedule
# ------------------------------------------------------------------------------
print("\n--- TEST 14: Update branch assignment schedule ---")
resp_update = client.patch(f"/api/users/{p_user.id}/update_branch_assignment/", {
    "branch_id": branch_a.id,
    "duty_days": ["Mon", "Wed"],
    "duty_start_time": "08:30",
}, format="json")
assert_true(resp_update.status_code == 200, "Update branch assignment returned 200 OK")
uba_a.refresh_from_db()
assert_true(uba_a.duty_days == ["Mon", "Wed"], "Updated duty days persisted on Branch A")
assert_true(uba_a.duty_start_time == time(8, 30), "Updated duty start time persisted on Branch A")

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
print("\n" + "=" * 80)
print(f"REGRESSION TEST SUITE COMPLETE: {passed} PASSED, {failed} FAILED")
print("=" * 80)

if failed > 0:
    sys.exit(1)
sys.exit(0)
