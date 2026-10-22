from django.test import SimpleTestCase

from apps.common.services.gemini_service import MALASAKIT_SYSTEM_PROMPT as PROMPT
from apps.subscriptions.plans import PLAN_CATALOG


class AssistantPromptFactsTests(SimpleTestCase):
    """The public AI assistant must quote the real prices and must not make claims the business cannot keep."""

    def test_prices_come_from_the_plan_catalog(self):
        for text in (
            '₱3,999/month', '₱43,189.20/year',
            '₱6,999/month', '₱75,589.20/year',
            '₱9,999/month', '₱107,989.20/year',
            '₱2,000/month', '₱21,600/year',
            'Growth + 1 additional branch = ₱8,999/month',
        ):
            self.assertIn(text, PROMPT)
        self.assertEqual(PLAN_CATALOG['PROFESSIONAL']['name'], 'Enterprise')
        self.assertIn('Enterprise: up to 12 clinicians', PROMPT)

    def test_commercial_rules_are_stated(self):
        self.assertIn('12-month minimum term', PROMPT)
        self.assertIn('end of the current 12-month term', PROMPT)
        self.assertIn('shared across all branches', PROMPT)
        self.assertIn('counts once', PROMPT)

    def test_no_claims_the_business_cannot_keep(self):
        lowered = PROMPT.lower()
        for claim in ('cancel anytime', '₱299', 'free data migration', 'aes-256', 'watch demo',
                      'priority support', 'mobile app access', 'bank-level'):
            self.assertNotIn(claim, lowered, claim)

    def test_hipaa_is_only_mentioned_as_aligned_or_as_a_prohibition(self):
        lowered = PROMPT.lower()
        self.assertIn('hipaa-aligned', lowered)
        self.assertIn('never say malasakit is "hipaa compliant"', lowered)
        # the only remaining occurrence of "hipaa compliant" is inside that prohibition
        self.assertEqual(lowered.count('hipaa compliant'), 1)

    def test_support_promises_are_limited_to_what_exists(self):
        self.assertIn('does not offer phone support, 24/7 support or dedicated account managers', PROMPT.lower())
        self.assertIn('Video Guides', PROMPT)

    def test_training_offer_is_stated_with_its_limits(self):
        lowered = PROMPT.lower()
        self.assertIn('free live demo', lowered)
        self.assertIn('negros island region', lowered)
        self.assertIn('scheduled in advance', lowered)
        self.assertIn('support@malasakitpms.ph', lowered)
        self.assertIn('never promise on-site training outside the negros island region', lowered)
        for stale in ('live training or on-site training', 'does not offer live'):
            self.assertNotIn(stale, lowered, stale)
