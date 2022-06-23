# Generated by Django 3.2.6 on 2022-06-23 13:13

import django_s3_storage.storage
import routedb.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("routedb", "0017_alter_usersettings_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="usersettings",
            name="avatar",
            field=models.ImageField(
                null=True,
                storage=django_s3_storage.storage.S3Storage(
                    aws_s3_bucket_name="drawmyroute-maps"
                ),
                upload_to=routedb.models.avatar_upload_path,
            ),
        ),
    ]