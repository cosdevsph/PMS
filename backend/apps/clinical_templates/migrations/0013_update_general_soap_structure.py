from django.db import migrations


def update_general_soap_structure(apps, schema_editor):
    ClinicalTemplate = apps.get_model('clinical_templates', 'ClinicalTemplate')
    general_soap_structure = {
        "version": "1.0",
        "sections": [
            {
                "id": "soap_section",
                "title": "",
                "order": 1,
                "fields": [
                    {
                        "id": "body_chart",
                        "type": "chart",
                        "chartType": "body",
                        "label": "Body Chart",
                        "required": False,
                    },
                    {
                        "id": "subjective",
                        "type": "textarea",
                        "label": "Subjective",
                        "placeholder": "Enter subjective observations, patient history, or symptoms...",
                        "required": False,
                        "rows": 4,
                    },
                    {
                        "id": "objective",
                        "type": "textarea",
                        "label": "Objective",
                        "placeholder": "Enter objective findings, vital signs, or physical examination details...",
                        "required": False,
                        "rows": 4,
                    },
                    {
                        "id": "assessment",
                        "type": "textarea",
                        "label": "Assessment",
                        "placeholder": "Enter clinical assessment, diagnostic impression, or analysis...",
                        "required": False,
                        "rows": 4,
                    },
                    {
                        "id": "plan",
                        "type": "textarea",
                        "label": "Plan",
                        "placeholder": "Enter future treatment plan, follow-up, or recommendations...",
                        "required": False,
                        "rows": 4,
                    },
                ],
            }
        ],
    }

    ClinicalTemplate.objects.filter(
        name='General SOAP',
        is_system_template=True,
    ).update(structure=general_soap_structure)


def revert_general_soap_structure(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('clinical_templates', '0012_clinicaltemplate_is_system_template_and_more'),
    ]

    operations = [
        migrations.RunPython(update_general_soap_structure, revert_general_soap_structure),
    ]
