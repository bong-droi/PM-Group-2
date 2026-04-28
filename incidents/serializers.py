from django.contrib.gis.geos import Point
from rest_framework import serializers
from users.serializers import NguoiDungSerializer
from .models import BaoCaoSuCo, ThongBaoSuCo


class BaoCaoSuCoSerializer(serializers.ModelSerializer):
    nguoi_bao_cao_info = NguoiDungSerializer(source="nguoi_bao_cao", read_only=True)
    ky_thuat_vien_info = NguoiDungSerializer(source="nhan_vien_ky_thuat", read_only=True)
    ky_thuat_vien_duoc_giao_info = NguoiDungSerializer(source="ky_thuat_vien_duoc_giao", many=True, read_only=True)
    vi_tri_lat = serializers.FloatField(write_only=True, required=False)
    vi_tri_lng = serializers.FloatField(write_only=True, required=False)
    so_ky_thuat_can = serializers.IntegerField(read_only=True)
    so_ky_thuat_da_phan_cong = serializers.IntegerField(read_only=True)
    da_du_ky_thuat = serializers.BooleanField(read_only=True)

    class Meta:
        model = BaoCaoSuCo
        fields = "__all__"
        read_only_fields = ["nguoi_bao_cao", "xac_nhan_boi", "ky_thuat_vien_duoc_giao"]
        extra_kwargs = {
            "vi_tri": {"required": False},
        }

    def validate(self, attrs):
        lat = attrs.pop("vi_tri_lat", None)
        lng = attrs.pop("vi_tri_lng", None)
        if lat is not None and lng is not None:
            attrs["vi_tri"] = Point(float(lng), float(lat), srid=4326)
        elif self.instance is None and attrs.get("vi_tri") is None:
            raise serializers.ValidationError(
                {"vi_tri": "Vui lòng chọn vị trí hoặc cung cấp đầy đủ vi_tri_lat và vi_tri_lng."}
            )
        return attrs


class ThongBaoSuCoSerializer(serializers.ModelSerializer):
    su_co_tieu_de = serializers.CharField(source="su_co.tieu_de", read_only=True)

    class Meta:
        model = ThongBaoSuCo
        fields = ["id", "su_co", "su_co_tieu_de", "tieu_de", "noi_dung", "da_doc", "created_at"]
