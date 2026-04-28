from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="nguoidung",
            name="dia_chi",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="nguoidung",
            name="gioi_tinh",
            field=models.CharField(
                blank=True,
                choices=[("nam", "Nam"), ("nu", "Nữ"), ("khac", "Khác")],
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="nguoidung",
            name="ho_ten",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name="nguoidung",
            name="ngay_sinh",
            field=models.DateField(blank=True, null=True),
        ),
    ]
