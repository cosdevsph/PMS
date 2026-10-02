"""
Centralized source of truth for Malasakit PMS subscription plans, entitlements, and pricing.

Standard Plans:
  - Starter:      4 clinicians, 1 included branch | ₱3,999/mo,  ₱43,000/yr | Add'l branch: ₱2,000/mo, ₱24,000/yr
  - Growth:       8 clinicians, 1 included branch | ₱6,999/mo,  ₱75,000/yr | Add'l branch: ₱2,500/mo, ₱30,000/yr
  - Professional: 12 clinicians, 1 included branch | ₱9,999/mo, ₱108,000/yr | Add'l branch: ₱3,000/mo, ₱36,000/yr
  - Enterprise:   Custom clinicians, Custom branches, Custom pricing

Pricing Rule:
  - Standard plans include 100% full feature access and unlimited admin accounts.
  - Pricing is driven by Clinician capacity + Branch capacity.
  - Minimum commitment: 12 months.
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
    (PLAN_PROFESSIONAL, 'Professional'),
    (PLAN_ENTERPRISE, 'Enterprise'),
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
        'annual_price_centavos': 4300000,            # ₱43,000.00 (Save ₱4,988/yr)
        'additional_branch_monthly_centavos': 200000, # ₱2,000.00
        'additional_branch_annual_centavos': 2400000, # ₱24,000.00
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
        'annual_price_centavos': 7500000,            # ₱75,000.00 (Save ₱8,988/yr)
        'additional_branch_monthly_centavos': 250000, # ₱2,500.00
        'additional_branch_annual_centavos': 3000000, # ₱30,000.00
        'trial_days': 0,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': True,
    },
    PLAN_PROFESSIONAL: {
        'id': PLAN_PROFESSIONAL,
        'name': 'Professional',
        'badge': 'Advanced Operations',
        'description': 'Complete clinical infrastructure for high-volume practices and medical centers.',
        'clinician_limit': 12,
        'included_branches': 1,
        'monthly_price_centavos': 999900,            # ₱9,999.00
        'annual_price_centavos': 10800000,           # ₱108,000.00 (Save ₱11,988/yr)
        'additional_branch_monthly_centavos': 300000, # ₱3,000.00
        'additional_branch_annual_centavos': 3600000, # ₱36,000.00
        'trial_days': 0,
        'features_included': True,
        'unlimited_admins': True,
        'is_public': True,
    },
    PLAN_ENTERPRISE: {
        'id': PLAN_ENTERPRISE,
        'name': 'Enterprise',
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
            'features_included': p['features_included'],
            'unlimited_admins': p['unlimited_admins'],
        })
    return summary
