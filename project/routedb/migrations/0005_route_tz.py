# Generated by Django 3.0.1 on 2020-01-25 07:34

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("routedb", "0004_route_country"),
    ]

    operations = [
        migrations.AddField(
            model_name="route",
            name="tz",
            field=models.CharField(default="", max_length=32),
            preserve_default=False,
        ),
    ]
