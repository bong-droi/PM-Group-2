from django.db import models


class NhatKyBaoTri(models.Model):
    class TienDo(models.TextChoices):
        CHUA_XU_LY = "chua_xu_ly", "Chưa xử lý"
        DANG_XU_LY = "dang_xu_ly", "Đang xử lý"
        HOAN_THANH = "hoan_thanh", "Đã hoàn thành"

    ha_tang = models.ForeignKey("assets.HaTang", on_delete=models.CASCADE, related_name="nhat_ky_bao_tri")
    su_co = models.ForeignKey("incidents.BaoCaoSuCo", on_delete=models.SET_NULL, null=True, blank=True, related_name="nhat_ky")
    ky_thuat_vien = models.ForeignKey(
        "users.NguoiDung",
        on_delete=models.CASCADE,
        related_name="nhat_ky_ky_thuat",
        limit_choices_to={"vai_tro": "technical"},
    )
    noi_dung = models.TextField()
    tien_do = models.CharField(max_length=20, choices=TienDo.choices, default=TienDo.DANG_XU_LY)
    ngay_bao_tri = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Nhật ký {self.ha_tang.ten} - {self.ky_thuat_vien.username}"
