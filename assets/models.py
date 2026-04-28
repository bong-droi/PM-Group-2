from django.contrib.gis.db import models


class LoaiHaTang(models.Model):
    ten = models.CharField(max_length=120, unique=True)
    mo_ta = models.TextField(blank=True)
    la_duong_tuyen = models.BooleanField(default=False)

    def __str__(self):
        return self.ten


class TrangThaiHaTang(models.Model):
    class MaTrangThai(models.TextChoices):
        DANG_HOAT_DONG = "dang_hoat_dong", "Đang hoạt động"
        HONG_HOC = "hong_hoc", "Hỏng hóc"
        BAO_TRI = "bao_tri", "Đang bảo trì"
        NGUNG_HOAT_DONG = "ngung_hoat_dong", "Ngừng hoạt động"

    ma = models.CharField(max_length=40, choices=MaTrangThai.choices, unique=True)
    ten_hien_thi = models.CharField(max_length=120)

    def __str__(self):
        return self.ten_hien_thi


class HaTang(models.Model):
    ten = models.CharField(max_length=200)
    loai = models.ForeignKey(LoaiHaTang, on_delete=models.PROTECT, related_name="ha_tang")
    trang_thai = models.ForeignKey(
        TrangThaiHaTang, on_delete=models.PROTECT, related_name="ha_tang", null=True, blank=True
    )
    vi_tri_diem = models.PointField(geography=True, null=True, blank=True, srid=4326)
    vi_tri_duong = models.LineStringField(geography=True, null=True, blank=True, srid=4326)
    ngay_lap_dat = models.DateField(null=True, blank=True)
    nha_san_xuat = models.CharField(max_length=200, blank=True)
    ghi_chu = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.ten
