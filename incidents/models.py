from django.contrib.gis.db import models


class BaoCaoSuCo(models.Model):
    class MucDo(models.TextChoices):
        THAP = "thap", "Thấp"
        TRUNG_BINH = "trung_binh", "Trung bình"
        CAO = "cao", "Cao"
        KHAN_CAP = "khan_cap", "Khẩn cấp"

    class TrangThaiXuLy(models.TextChoices):
        CHUA_XU_LY = "chua_xu_ly", "Chưa xử lý"
        DANG_XU_LY = "dang_xu_ly", "Đang xử lý"
        DA_HOAN_THANH = "da_hoan_thanh", "Đã hoàn thành"

    tieu_de = models.CharField(max_length=200)
    mo_ta = models.TextField()
    hinh_anh = models.ImageField(upload_to="su_co/", null=True, blank=True)
    vi_tri = models.PointField(geography=True, srid=4326)
    ha_tang = models.ForeignKey("assets.HaTang", on_delete=models.SET_NULL, null=True, blank=True, related_name="su_co")
    nguoi_bao_cao = models.ForeignKey("users.NguoiDung", on_delete=models.CASCADE, related_name="bao_cao")
    muc_do = models.CharField(max_length=20, choices=MucDo.choices, default=MucDo.TRUNG_BINH)
    trang_thai = models.CharField(max_length=20, choices=TrangThaiXuLy.choices, default=TrangThaiXuLy.CHUA_XU_LY)
    nhan_vien_ky_thuat = models.ForeignKey(
        "users.NguoiDung",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="su_co_duoc_giao",
        limit_choices_to={"vai_tro": "technical"},
    )
    ky_thuat_vien_duoc_giao = models.ManyToManyField(
        "users.NguoiDung",
        related_name="su_co_duoc_giao_nhieu_nguoi",
        blank=True,
        limit_choices_to={"vai_tro": "technical"},
    )
    xac_nhan_boi = models.ForeignKey(
        "users.NguoiDung",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="su_co_xac_nhan",
        limit_choices_to={"vai_tro": "operator"},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def so_ky_thuat_can(self):
        mapping = {
            self.MucDo.THAP: 1,
            self.MucDo.TRUNG_BINH: 2,
            self.MucDo.CAO: 3,
        }
        return mapping.get(self.muc_do, 3)

    @property
    def so_ky_thuat_da_phan_cong(self):
        return self.ky_thuat_vien_duoc_giao.count()

    @property
    def da_du_ky_thuat(self):
        return self.so_ky_thuat_da_phan_cong >= self.so_ky_thuat_can

    def __str__(self):
        return self.tieu_de


class ThongBaoSuCo(models.Model):
    nguoi_nhan = models.ForeignKey(
        "users.NguoiDung",
        on_delete=models.CASCADE,
        related_name="thong_bao_su_co",
    )
    su_co = models.ForeignKey("incidents.BaoCaoSuCo", on_delete=models.CASCADE, related_name="thong_bao")
    tieu_de = models.CharField(max_length=200)
    noi_dung = models.TextField()
    da_doc = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tieu_de} -> {self.nguoi_nhan.username}"
