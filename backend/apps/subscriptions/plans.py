"""
Centralized source of truth for Malasakit PMS subscription plans, entitlements, and pricing.

Public names (internal plan codes in brackets; codes never change, so stored subscriptions stay valid):
  - Starter    [STARTER]:      up to 4 clinicians  | ₱3,999/mo | ₱43,189.20/yr
  - Growth     [GROWTH]:       up to 8 clinicians  | ₱6,999/mo | ₱75,589.20/yr
  - Enterprise [PROFESSIONAL]: up to 12 clinicians | ₱9,999/mo | ₱107,989.20/yr
  - Custom     [ENTERPRISE]:   custom clinicians, custom branches, custom pricing (contact sales)

Pricing rules:
  - Annual billing = monthly x 12 x 0.90 (exactly 10% off).
  - 1 branch is included in every plan. Each additional branch costs ₱2,000/mo or ₱21,600/yr
    (10% off) on ALL tiers.
  - The clinician limit is shared across all branches of a clinic. A clinician who works at several
    branches counts once. A clinic only moves to the next tier when its total clinician count exceeds
    the plan limit.
  - Standard plans include 100% full feature access and unlimited Owner, Branch Manager and staff accounts.
  - Minimum commitment: 12 months, paid monthly or annually.
  - All amounts in centavos (PHP 1.00 = 100 centavos) for PayMongo integration.
"""
from decimal import Decimal
from typing import Any, Dict, List, Optional

# ── Plan Identifiers ──────────────────────────────────────────────────────────
PLAN_TRIAL = 'TRIAL'
PLAN_STARTER = 'STARTER'
PLAN_GROWTH = 'GROWTH'
PLAN_PROFESSIONAL = 'PROFESSIONAL'
PLAN_ENTERPRISE = 'ENTERPRISE'

PLAN_CHOICES = (
    (PLAN_TRIAL, 'Free Trial'),
    (PLAN_STARTER, 'Starter'),
    (PLAN_GROWTH, 'Growth'),
    (PLAN_PROFESSIONAL, 'Enterprise'),
    (PLAN_ENTERPRISE, 'Custom'),
)

# ── Billing Cycles ────────────────────────────────────────────────────────────
CYCLE_MONTHLY = 'MONTHLY'
CYCLE_ANNUAL = 'ANNUAL'

BILLING_CYCLE_CHOICES = (
    (CYCLE_MONTHLY, 'Monthly'),
    (CYCLE_ANNUAL, 'Annual'),
)

# ── Minimum Commitment ────────────────────────────────────────────────────────
MINIMUM_COMMITMENT_MONTHS = 12

# ── Annual discount and branch add-on (single source of truth) ─────────────────
ANNUAL_DISCOUNT_PERCENT = 10
ADDITIONAL_BRANCH_MONTHLY_CENTAVOS = 200000    # ₱2,000.00 for every tier
ADDITIONAL_BRANCH_ANNUAL_CENTAVOS = 2160000    # ₱21,600.00 (₱2,000 x 12, 10% off)

# ── Master Plan Catalog ───────────────────────────────────────────────────────
PLAN_CATALOG: Dict[str, Dict[str, Any]] = {
    PLAN_TRIAL: {
        'id': PLAN_TRIAL,
        'name': 'Free Trial',
        'badge': '14-Day Free Trial',
        'description': 'Full access to evaluate Malasakit PMS for your practice.',
        'clinician_limit': 4,
        'included_branches': 1,
        'monthly_price_centavos': 0,
        'annual_price_centavos': 0,
        'additional_branch_monthly_centavos': 0,
        'additional_branch_annual_centavos': 0,
        'trial_days': 14,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': False,
    },
    PLAN_STARTER: {
        'id': PLAN_STARTER,
        'name': 'Starter',
        'badge': 'Essential Practice',
        'description': 'Ideal for emerging private practices and boutique healthcare clinics.',
        'clinician_limit': 4,
        'included_branches': 1,
        'monthly_price_centavos': 399900,            # ₱3,999.00
        'annual_price_centavos': 4318920,            # ₱43,189.20 (10% off ₱47,988; save ₱4,798.80/yr)
        'additional_branch_monthly_centavos': ADDITIONAL_BRANCH_MONTHLY_CENTAVOS,
        'additional_branch_annual_centavos': ADDITIONAL_BRANCH_ANNUAL_CENTAVOS,
        'trial_days': 0,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': True,
    },
    PLAN_GROWTH: {
        'id': PLAN_GROWTH,
        'name': 'Growth',
        'badge': 'Most Popular',
        'description': 'Designed for growing multi-disciplinary teams expanding clinical services.',
        'clinician_limit': 8,
        'included_branches': 1,
        'monthly_price_centavos': 699900,            # ₱6,999.00
        'annual_price_centavos': 7558920,            # ₱75,589.20 (10% off ₱83,988; save ₱8,398.80/yr)
        'additional_branch_monthly_centavos': ADDITIONAL_BRANCH_MONTHLY_CENTAVOS,
        'additional_branch_annual_centavos': ADDITIONAL_BRANCH_ANNUAL_CENTAVOS,
        'trial_days': 0,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': True,
    },
    PLAN_PROFESSIONAL: {
        'id': PLAN_PROFESSIONAL,
        'name': 'Enterprise',
        'badge': 'Advanced Operations',
        'description': 'Complete clinical infrastructure for high-volume practices and medical centers.',
        'clinician_limit': 12,
        'included_branches': 1,
        'monthly_price_centavos': 999900,            # ₱9,999.00
        'annual_price_centavos': 10798920,           # ₱107,989.20 (10% off ₱119,988; save ₱11,998.80/yr)
        'additional_branch_monthly_centavos': ADDITIONAL_BRANCH_MONTHLY_CENTAVOS,
        'additional_branch_annual_centavos': ADDITIONAL_BRANCH_ANNUAL_CENTAVOS,
        'trial_days': 0,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': True,
    },
    PLAN_ENTERPRISE: {
        'id': PLAN_ENTERPRISE,
        'name': 'Custom',
        'badge': 'Custom Scale',
        'description': 'Tailored capacity, custom branch networks, and dedicated enterprise support.',
        'clinician_limit': None,  # Custom configurable per subscription
        'included_branches': None, # Custom configurable per subscription
        'monthly_price_centavos': None,
        'annual_price_centavos': None,
        'additional_branch_monthly_centavos': None,
        'additional_branch_annual_centavos': None,
        'trial_days': 0,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': True,
    },
}


def get_plan_metadata(plan_code: str) -> Dict[str, Any]:
    """
    Return metadata for the given plan code.
    Raises ValueError if plan_code is invalid.
    """
    plan = PLAN_CATALOG.get(plan_code.upper())
    if not plan:
        valid_codes = ', '.join(PLAN_CATALOG.keys())
        raise ValueError(f"Invalid plan code: '{plan_code}'. Must be one of: {valid_codes}")
    return plan.copy()


def calculate_subscription_amount(
    plan_code: str,
    billing_cycle: str,
    additional_branches: int = 0,
    custom_amount_centavos: Optional[int] = None,
) -> Dict[str, Any]:
    """
    Authoritative backend calculation of subscription price in centavos and pesos.

    Parameters:
      - plan_code: 'STARTER', 'GROWTH', 'PROFESSIONAL', 'ENTERPRISE', 'TRIAL'
      - billing_cycle: 'MONTHLY' or 'ANNUAL'
      - additional_branches: non-negative integer of additional branches
      - custom_amount_centavos: for ENTERPRISE custom plans

    Returns a dictionary breakdown:
      {
        'total_centavos': int,
        'total_pesos': Decimal,
        'base_plan_centavos': int,
        'base_plan_pesos': Decimal,
        'additional_branch_centavos': int,
        'additional_branch_pesos': Decimal,
        'additional_branches': int,
        'currency': 'PHP',
        'plan_code': str,
        'billing_cycle': str,
      }
    """
    plan = get_plan_metadata(plan_code)
    cycle = billing_cycle.upper()
    if cycle not in (CYCLE_MONTHLY, CYCLE_ANNUAL):
        raise ValueError(f"Invalid billing cycle: '{billing_cycle}'. Must be '{CYCLE_MONTHLY}' or '{CYCLE_ANNUAL}'.")

    if additional_branches < 0:
        raise ValueError("additional_branches cannot be negative.")

    if plan_code.upper() == PLAN_ENTERPRISE:
        if custom_amount_centavos is None or custom_amount_centavos < 0:
            raise ValueError("Enterprise plans require an explicit custom_amount_centavos.")
        total_centavos = custom_amount_centavos
        base_centavos = custom_amount_centavos
        branch_centavos = 0
    else:
        if cycle == CYCLE_MONTHLY:
            base_centavos = plan['monthly_price_centavos']
            branch_rate = plan['additional_branch_monthly_centavos']
        else:
            base_centavos = plan['annual_price_centavos']
            branch_rate = plan['additional_branch_annual_centavos']

        branch_centavos = branch_rate * additional_branches
        total_centavos = base_centavos + branch_centavos

    return {
        'total_centavos': total_centavos,
        'total_pesos': (Decimal(total_centavos) / Decimal(100)).quantize(Decimal('0.01')),
        'base_plan_centavos': base_centavos,
        'base_plan_pesos': (Decimal(base_centavos) / Decimal(100)).quantize(Decimal('0.01')),
        'additional_branch_centavos': branch_centavos,
        'additional_branch_pesos': (Decimal(branch_centavos) / Decimal(100)).quantize(Decimal('0.01')),
        'additional_branches': additional_branches,
        'currency': 'PHP',
        'plan_code': plan['id'],
        'billing_cycle': cycle,
        'plan_name': plan['name'],
        'commitment_months': MINIMUM_COMMITMENT_MONTHS,
    }


def get_all_plans_summary() -> List[Dict[str, Any]]:
    """
    Return customer-facing summary of all public plans for the subscription UI.
    """
    summary = []
    for code, p in PLAN_CATALOG.items():
        if not p.get('is_public'):
            continue
        annual_savings = None
        if p['monthly_price_centavos'] and p['annual_price_centavos']:
            monthly_x12 = p['monthly_price_centavos'] * 12
            diff = monthly_x12 - p['annual_price_centavos']
            if diff > 0:
                annual_savings = (Decimal(diff) / Decimal(100)).quantize(Decimal('0.01'))

        summary.append({
            'id': p['id'],
            'name': p['name'],
            'badge': p['badge'],
            'description': p['description'],
            'clinician_limit': p['clinician_limit'],
            'included_branches': p['included_branches'],
            'monthly_price_pesos': (Decimal(p['monthly_price_centavos']) / Decimal(100)) if p['monthly_price_centavos'] is not None else None,
            'annual_price_pesos': (Decimal(p['annual_price_centavos']) / Decimal(100)) if p['annual_price_centavos'] is not None else None,
            'additional_branch_monthly_pesos': (Decimal(p['additional_branch_monthly_centavos']) / Decimal(100)) if p['additional_branch_monthly_centavos'] is not None else None,
            'additional_branch_annual_pesos': (Decimal(p['additional_branch_annual_centavos']) / Decimal(100)) if p['additional_branch_annual_centavos'] is not None else None,
            'annual_savings_pesos': annual_savings,
            'commitment_months': MINIMUM_COMMITMENT_MONTHS,
            'annual_discount_percent': ANNUAL_DISCOUNT_PERCENT,
            'features_included': p['features_included'],
            'unlimited_admins': p['unlimited_admins'],
        })
    return summary
