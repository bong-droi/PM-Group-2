from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import NguoiDung


@admin.register(NguoiDung)
class NguoiDungAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Thông tin hệ thống", {"fields": ("vai_tro", "ho_ten", "ngay_sinh", "gioi_tinh", "dia_chi", "so_dien_thoai")}),
    )
    list_display = ("username", "ho_ten", "email", "vai_tro", "is_staff", "is_active")
    list_filter = ("vai_tro", "is_staff", "is_active")
