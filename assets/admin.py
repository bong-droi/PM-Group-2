from django.contrib import admin
from .models import HaTang, LoaiHaTang, TrangThaiHaTang


@admin.register(LoaiHaTang)
class LoaiHaTangAdmin(admin.ModelAdmin):
    list_display = ("ten", "la_duong_tuyen")


@admin.register(TrangThaiHaTang)
class TrangThaiHaTangAdmin(admin.ModelAdmin):
    list_display = ("ma", "ten_hien_thi")


@admin.register(HaTang)
class HaTangAdmin(admin.ModelAdmin):
    list_display = ("ten", "loai", "trang_thai", "ngay_lap_dat")
