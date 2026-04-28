from django.contrib import admin
from .models import BaoCaoSuCo, ThongBaoSuCo


@admin.register(BaoCaoSuCo)
class BaoCaoSuCoAdmin(admin.ModelAdmin):
    list_display = ("tieu_de", "nguoi_bao_cao", "trang_thai", "muc_do", "created_at")


@admin.register(ThongBaoSuCo)
class ThongBaoSuCoAdmin(admin.ModelAdmin):
    list_display = ("tieu_de", "nguoi_nhan", "su_co", "da_doc", "created_at")
