# Generated migration to add discipline field to User model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0006_user_last_password_change_user_password_rotation'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='discipline',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
