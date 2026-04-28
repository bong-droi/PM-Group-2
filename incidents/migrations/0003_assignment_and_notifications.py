import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def forward_fill_assigned_technicians(apps, schema_editor):
    BaoCaoSuCo = apps.get_model("incidents", "BaoCaoSuCo")
    for incident in BaoCaoSuCo.objects.exclude(nhan_vien_ky_thuat__isnull=True):
        incident.ky_thuat_vien_duoc_giao.add(incident.nhan_vien_ky_thuat_id)


def backward_clear_assigned_technicians(apps, schema_editor):
    BaoCaoSuCo = apps.get_model("incidents", "BaoCaoSuCo")
    for incident in BaoCaoSuCo.objects.all():
        incident.ky_thuat_vien_duoc_giao.clear()


class Migration(migrations.Migration):
    dependencies = [
        ("incidents", "0002_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="baocaosuco",
            name="ky_thuat_vien_duoc_giao",
            field=models.ManyToManyField(
                blank=True,
                limit_choices_to={"vai_tro": "technical"},
                related_name="su_co_duoc_giao_nhieu_nguoi",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.CreateModel(
            name="ThongBaoSuCo",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tieu_de", models.CharField(max_length=200)),
                ("noi_dung", models.TextField()),
                ("da_doc", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "nguoi_nhan",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="thong_bao_su_co",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "su_co",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="thong_bao",
                        to="incidents.baocaosuco",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.RunPython(forward_fill_assigned_technicians, backward_clear_assigned_technicians),
    ]
