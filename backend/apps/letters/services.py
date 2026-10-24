import re
from django.utils import timezone
from django.utils.html import escape
from apps.patients.models import Patient
from apps.clinics.models import Practitioner
from apps.records.models import ClinicalNote

class LetterGeneratorService:
    """
    Handles parsing letter templates, replacing dynamic variables,
    and triggering PDF generation.
    """

    SUPPORTED_VARIABLES = {
        # Patient (Client)
        '{{patient.title}}': lambda p, pr, n, c, a, l: '',
        '{{patient.first_name}}': lambda p, pr, n, c, a, l: p.first_name if p else '',
        '{{patient.middle_initial}}': lambda p, pr, n, c, a, l: p.middle_name[0].upper() + '.' if p and p.middle_name else '',
        '{{patient.last_name}}': lambda p, pr, n, c, a, l: p.last_name if p else '',
        '{{patient.full_name}}': lambda p, pr, n, c, a, l: p.get_full_name() if p else '',
        '{{patient.sex}}': lambda p, pr, n, c, a, l: p.get_gender_display() if p and hasattr(p, 'get_gender_display') else '',
        '{{patient.gender}}': lambda p, pr, n, c, a, l: p.get_gender_display() if p and hasattr(p, 'get_gender_display') else '',
        '{{patient.dob}}': lambda p, pr, n, c, a, l: p.date_of_birth.strftime('%d/%m/%Y') if p and p.date_of_birth else '',
        '{{patient.email}}': lambda p, pr, n, c, a, l: p.email if p else '',
        '{{patient.phone}}': lambda p, pr, n, c, a, l: p.phone_number if p else (p.phone if hasattr(p, 'phone') else ''),
        '{{patient.address}}': lambda p, pr, n, c, a, l: p.address if p else '',
        
        # Patient Doctor (Case Primary Practitioner)
        '{{patient.doctor.automatic}}': lambda p, pr, n, c, a, l: c.primary_practitioner.user.get_full_name() if c and c.primary_practitioner else '',
        '{{patient.doctor.company}}': lambda p, pr, n, c, a, l: c.primary_practitioner.clinic.name if c and c.primary_practitioner and c.primary_practitioner.clinic else '',
        '{{patient.doctor.title}}': lambda p, pr, n, c, a, l: c.primary_practitioner.user.title if c and c.primary_practitioner and hasattr(c.primary_practitioner.user, 'title') and c.primary_practitioner.user.title else (c.primary_practitioner.title if c and c.primary_practitioner and hasattr(c.primary_practitioner, 'title') else ''),
        '{{patient.doctor.first_name}}': lambda p, pr, n, c, a, l: c.primary_practitioner.user.first_name if c and c.primary_practitioner else '',
        '{{patient.doctor.last_name}}': lambda p, pr, n, c, a, l: c.primary_practitioner.user.last_name if c and c.primary_practitioner else '',
        
        # Practitioner
        '{{practitioner.first_name}}': lambda p, pr, n, c, a, l: pr.user.first_name if pr else '',
        '{{practitioner.last_name}}': lambda p, pr, n, c, a, l: pr.user.last_name if pr else '',
        '{{practitioner.full_name}}': lambda p, pr, n, c, a, l: pr.user.get_full_name() if pr else '',
        '{{practitioner.title}}': lambda p, pr, n, c, a, l: pr.title if pr and hasattr(pr, 'title') else '',
        
        # Clinic
        '{{clinic.name}}': lambda p, pr, n, c, a, l: pr.clinic.name if pr and pr.clinic else (p.clinic.name if p and p.clinic else ''),
        '{{clinic.address}}': lambda p, pr, n, c, a, l: pr.clinic.address if pr and pr.clinic else (p.clinic.address if p and p.clinic else ''),
        '{{clinic.phone}}': lambda p, pr, n, c, a, l: pr.clinic.phone if pr and pr.clinic else (p.clinic.phone if p and p.clinic else ''),
        '{{clinic.email}}': lambda p, pr, n, c, a, l: pr.clinic.email if pr and pr.clinic else (p.clinic.email if p and p.clinic else ''),
        
        # Appointment
        '{{appointment.date}}': lambda p, pr, n, c, a, l: a.date.strftime('%d %B %Y') if a else '',
        '{{appointment.time}}': lambda p, pr, n, c, a, l: a.start_time.strftime('%I:%M %p') if a and a.start_time else '',
        '{{appointment.type}}': lambda p, pr, n, c, a, l: a.appointment_type if a else '',
        
        # Case
        '{{case.name}}': lambda p, pr, n, c, a, l: c.title if c else '',
        '{{case.title}}': lambda p, pr, n, c, a, l: c.title if c else '',
        '{{case.status}}': lambda p, pr, n, c, a, l: c.get_status_display() if c and hasattr(c, 'get_status_display') else '',
        '{{case.date_created}}': lambda p, pr, n, c, a, l: c.created_at.strftime('%d/%m/%Y') if c else '',
        '{{case.notes}}': lambda p, pr, n, c, a, l: c.description if c else '',
        
        # Case -> Sessions
        '{{case.sessions.approved_sessions}}': lambda p, pr, n, c, a, l: '',  # retired: Case session limits
        '{{case.sessions.package_sessions}}': lambda p, pr, n, c, a, l: '',  # retired: Case session limits
        '{{case.sessions.sessions_used}}': lambda p, pr, n, c, a, l: '',  # retired: Case session limits
        '{{case.sessions.sessions_remaining}}': lambda p, pr, n, c, a, l: '',  # retired: Case session limits
        '{{case.sessions.session_allocation}}': lambda p, pr, n, c, a, l: '',  # retired: Case session limits
        
        # Case -> Referral
        '{{case.referral.doctor}}': lambda p, pr, n, c, a, l: c.referred_by if c else '',
        '{{case.referral.date}}': lambda p, pr, n, c, a, l: '',
        '{{case.referral.reference}}': lambda p, pr, n, c, a, l: c.referral_info if c else '',
        
        # Case -> Payer
        '{{case.payer.name}}': lambda p, pr, n, c, a, l: c.get_payer_display() if c and hasattr(c, 'get_payer_display') else '',
        '{{case.payer.reference}}': lambda p, pr, n, c, a, l: '',
        
        # Legacy Case compatibility
        '{{case.number}}': lambda p, pr, n, c, a, l: str(c.id) if c else '',
        '{{case.start_date}}': lambda p, pr, n, c, a, l: c.created_at.strftime('%d %B %Y') if c else '',
        
        # Global
        '{{date.today}}': lambda p, pr, n, c, a, l: timezone.now().strftime('%d %B %Y'),
        '{{time.now}}': lambda p, pr, n, c, a, l: timezone.now().strftime('%I:%M %p'),
        
        # Addressee
        '{{addressee.automatic}}': lambda p, pr, n, c, a, l: p.get_full_name() if p else '',
        '{{addressee.company}}': lambda p, pr, n, c, a, l: '',
        '{{addressee.title}}': lambda p, pr, n, c, a, l: '',
        '{{addressee.first_name}}': lambda p, pr, n, c, a, l: p.first_name if p else '',
        '{{addressee.last_name}}': lambda p, pr, n, c, a, l: p.last_name if p else '',
        '{{addressee.email}}': lambda p, pr, n, c, a, l: p.email if p else '',
        '{{addressee.work}}': lambda p, pr, n, c, a, l: '',
        '{{addressee.mobile}}': lambda p, pr, n, c, a, l: p.phone if p else '',
        '{{addressee.home}}': lambda p, pr, n, c, a, l: '',
        
        # Sender
        '{{sender.automatic}}': lambda p, pr, n, c, a, l: pr.user.get_full_name() if pr and pr.user else '',
        '{{sender.title}}': lambda p, pr, n, c, a, l: pr.user.title if pr and hasattr(pr.user, 'title') and pr.user.title else (pr.title if pr and hasattr(pr, 'title') else ''),
        '{{sender.first_name}}': lambda p, pr, n, c, a, l: pr.user.first_name if pr and pr.user else '',
        '{{sender.last_name}}': lambda p, pr, n, c, a, l: pr.user.last_name if pr and pr.user else '',
        '{{sender.discipline}}': lambda p, pr, n, c, a, l: pr.get_discipline_display() if pr and hasattr(pr, 'get_discipline_display') else '',
        '{{sender.signature}}': lambda p, pr, n, c, a, l: f'<img src="data:image/png;base64,{l.signature_data}" style="max-height: 80px;" alt="Signature" />' if l and getattr(l, 'signature_data', None) else '',
    }

    # Values that are already HTML (an image); every other value is text and is escaped.
    RAW_HTML_VARIABLES = {'{{sender.signature}}'}

    @classmethod
    def _render_value(cls, var: str, value: str) -> str:
        """A merge-field value as it appears in the letter: escaped, and bold so it stands out from the template text."""
        if not value.strip():
            return ''
        if var in cls.RAW_HTML_VARIABLES:
            return value
        return f'<strong>{escape(value)}</strong>'

    @classmethod
    def replace_variables(
        cls, 
        content: str, 
        patient: Patient = None, 
        practitioner: Practitioner = None, 
        note: ClinicalNote = None,
        patient_case = None,
        appointment = None,
        letter = None
    ) -> str:
        """
        Scans content for {{variables}} and replaces them with corresponding data.
        """
        if not content:
            return ""
            
        result = content
        
        # Replace known supported variables
        for var, func in cls.SUPPORTED_VARIABLES.items():
            if var not in result:
                continue
            try:
                value = str(func(patient, practitioner, note, patient_case, appointment, letter) or '')
            except Exception:
                # If variable resolution fails, the field becomes empty
                value = ''
            rendered = cls._render_value(var, value)
            span = r'<span\b[^>]*data-id=["\']' + re.escape(var) + r'["\'][^>]*>.*?</span>'
            # An empty value also takes one following space, so "Dear {{title}} {{first_name}}" has no double space.
            tail = '' if rendered else r'(?:&nbsp;|\u00a0| )?'
            # 1. The TipTap merge-field span, 2. raw text without a span. A function is used as the
            # replacement so backslashes in a value are never read as a regex template.
            result = re.sub(span + tail, lambda _m, r=rendered: r, result, flags=re.IGNORECASE)
            result = result.replace(var, rendered)

        # Remove any remaining unimplemented variables (e.g., {{unknown.field}})
        result = re.sub(r'\{\{[^}]+\}\}', '', result)
        
        return result

    @classmethod
    def build_layout_html(
        cls,
        clinic_profile=None,
        patient=None,
        *,
        letter_head=True,
        date=True,
        addressee=True,
        today=None,
    ) -> str:
        """
        The letterhead, date and addressee blocks placed above the body of a letter.

        One builder for the PDF (`generate`) and the preview (`preview`). It uses tables, not flexbox,
        because xhtml2pdf ignores flexbox (the old layout came out as widely spaced single lines), and
        every value is HTML-escaped (clinic and patient text is user input).
        """
        parts = []

        if letter_head and clinic_profile:
            contact = ' | '.join(filter(None, [clinic_profile.get('phone'), clinic_profile.get('email')]))
            lines = [
                '<p style="margin: 0 0 2px 0; font-size: 18px; font-weight: bold; color: #0f172a;">'
                f'{escape((clinic_profile.get("name") or "").upper())}</p>'
            ]
            for line in (clinic_profile.get('address'), contact):
                if line:
                    lines.append(f'<p style="margin: 0; font-size: 11px; color: #334155;">{escape(line)}</p>')
            logo_cell = ''
            if clinic_profile.get('logo'):
                logo_cell = (
                    f'<td width="90" valign="middle" style="padding: 0 16px 14px 0;">'
                    f'<img src="{escape(clinic_profile["logo"])}" height="64" /></td>'
                )
            parts.append(
                '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 26px;"><tr>'
                f'{logo_cell}'
                f'<td valign="middle" style="padding: 0 0 14px 0; border-bottom: 1px solid #1e293b;">{"".join(lines)}</td>'
                '</tr></table>'
            )

        if date:
            when = today or timezone.now()
            parts.append(f'<p style="margin: 0 0 20px 0;">{when.strftime("%d %B %Y")}</p>')

        if addressee and patient:
            city_line = ' '.join(filter(None, [patient.city, patient.province, patient.postal_code]))
            lines = [(patient.get_full_name(), True)] + [(x, False) for x in (patient.address, city_line) if x]
            for i, (text, bold) in enumerate(lines):
                bottom = '30px' if i == len(lines) - 1 else '0'
                weight = ' font-weight: bold;' if bold else ''
                parts.append(f'<p style="margin: 0 0 {bottom} 0;{weight}">{escape(text)}</p>')

        return ''.join(parts)

    @staticmethod
    def letterhead_clinic(patient, fallback=None, appointment=None):
        """
        The clinic whose letterhead a letter carries:
          1. the branch of the appointment the letter is for (where the patient is being seen);
          2. else the branch the patient belongs to (`home_branch`), else the patient's clinic;
          3. else `fallback`.
        It never depends on who writes the letter or on which branches that practitioner works at.
        """
        if appointment is not None and getattr(appointment, 'clinic', None):
            return appointment.clinic
        if patient is not None:
            return patient.home_branch or patient.clinic or fallback
        return fallback

    @staticmethod
    def top_spacer_html(remove_top_space=False) -> str:
        """
        Space above the first block. A padded wrapper div makes xhtml2pdf inflate the spacing of every
        paragraph inside it, so the gap is a plain spacer element instead.
        """
        return '' if remove_top_space else '<div style="height: 30px; line-height: 30px;">&nbsp;</div>'

    @classmethod
    def generate_pdf(cls, html_content: str, output_path: str = None) -> bytes:
        """
        Generates a PDF from the given HTML content.
        """
        try:
            from xhtml2pdf import pisa
            from io import BytesIO
            
            result = BytesIO()
            # Wrap in basic HTML structure if not present
            if '<html' not in html_content.lower():
                # Convert newlines to <br> to preserve plain text formatting
                html_content = html_content.replace('\n', '<br>')
                html_content = f"""
                <html>
                <head>
                <style>
                    body {{ font-family: sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap; }}
                    p {{ margin-top: 0; margin-bottom: 8px; }}
                    h1 {{ font-size: 20px; margin-top: 16px; margin-bottom: 8px; }}
                    h2 {{ font-size: 18px; margin-top: 14px; margin-bottom: 8px; }}
                    h3 {{ font-size: 16px; margin-top: 12px; margin-bottom: 8px; }}
                    small, .text-small {{ font-size: 12px; }}
                </style>
                </head>
                <body><div>{html_content}</div></body></html>"""
                
            pisa_status = pisa.CreatePDF(
                html_content,
                dest=result
            )
            
            if pisa_status.err:
                raise Exception('PDF generation failed')
                
            return result.getvalue()
        except ImportError:
            # If xhtml2pdf is not available, raise an error instead of returning a dummy PDF that fails downstream validation
            raise ImportError("xhtml2pdf is not installed. Please install it to generate PDF letters.")
        except Exception as e:
            print(f"Error generating PDF: {e}")
            raise

    @classmethod
    def get_clinic_profile(cls, clinic, request=None):
        """
        Retrieves the unified clinic profile using the Invoice system's logic (InvoicePrintSettings).
        This ensures the Letterhead displays the correct Branch information.
        """
        if not clinic:
            return None
            
        from apps.billing.models import InvoicePrintSettings
        print_settings = InvoicePrintSettings.get_for_clinic(clinic)
        
        # Priority 1: logo_url stored in InvoicePrintSettings (Cloudinary URL)
        logo_url = print_settings.logo_url or None
        
        # Priority 2: clinic.logo ImageField (local filesystem or Cloudinary)
        if not logo_url and clinic.logo:
            try:
                raw_url = clinic.logo.url
                if request:
                    logo_url = request.build_absolute_uri(raw_url)
                else:
                    logo_url = raw_url
            except Exception:
                logo_url = None
        
        # Priority 3: fall back to parent clinic's logo if branch has none
        if not logo_url and clinic.parent_clinic:
            parent = clinic.parent_clinic
            parent_settings = InvoicePrintSettings.get_for_clinic(parent)
            logo_url = parent_settings.logo_url or None
            if not logo_url and parent.logo:
                try:
                    raw_url = parent.logo.url
                    if request:
                        logo_url = request.build_absolute_uri(raw_url)
                    else:
                        logo_url = raw_url
                except Exception:
                    logo_url = None
        
        # Force HTTPS for any Cloudinary URL to prevent Mixed Content errors
        if logo_url and logo_url.startswith('http://') and 'cloudinary.com' in logo_url:
            logo_url = logo_url.replace('http://', 'https://')
            
        return {
            'name': print_settings.clinic_name or clinic.name,
            'branch_name': clinic.name,
            'logo': logo_url or '',
            'address': print_settings.clinic_address or clinic.address,
            'phone': print_settings.clinic_phone or clinic.phone,
            'email': print_settings.clinic_email or clinic.email,
        }
