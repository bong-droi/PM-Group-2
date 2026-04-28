from django.contrib import admin
from .models import NhatKyBaoTri


@admin.register(NhatKyBaoTri)
class NhatKyBaoTriAdmin(admin.ModelAdmin):
    list_display = ("ha_tang", "ky_thuat_vien", "tien_do", "ngay_bao_tri")
