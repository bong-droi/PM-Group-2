from django.contrib.auth.models import AbstractUser
from django.db import models


class NguoiDung(AbstractUser):
    class VaiTro(models.TextChoices):
        ADMIN = "admin", "Quản trị viên"
        OPERATOR = "operator", "Nhân viên vận hành"
        TECHNICAL = "technical", "Nhân viên kỹ thuật"
        CITIZEN = "citizen", "Người dân"

    vai_tro = models.CharField(max_length=20, choices=VaiTro.choices, default=VaiTro.CITIZEN)
    ho_ten = models.CharField(max_length=255, blank=True)
    ngay_sinh = models.DateField(null=True, blank=True)
    gioi_tinh = models.CharField(
        max_length=20,
        choices=[
            ("nam", "Nam"),
            ("nu", "Nữ"),
            ("khac", "Khác"),
        ],
        blank=True,
    )
    dia_chi = models.TextField(blank=True)
    so_dien_thoai = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.username} ({self.vai_tro})"
