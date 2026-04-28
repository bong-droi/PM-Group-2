from django.contrib.gis.geos import Point
from rest_framework import serializers
from .models import HaTang, LoaiHaTang, TrangThaiHaTang


class LoaiHaTangSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiHaTang
        fields = "__all__"


class TrangThaiHaTangSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrangThaiHaTang
        fields = "__all__"


class HaTangSerializer(serializers.ModelSerializer):
    vi_tri_lat = serializers.FloatField(write_only=True, required=False)
    vi_tri_lng = serializers.FloatField(write_only=True, required=False)

    vi_tri = serializers.SerializerMethodField()
    loai_ten = serializers.CharField(source="loai.ten", read_only=True)
    trang_thai_ten = serializers.CharField(source="trang_thai.ten_hien_thi", read_only=True)

    class Meta:
        model = HaTang
        fields = [
            "id",
            "ten",
            "loai",
            "loai_ten",
            "trang_thai",
            "trang_thai_ten",
            "vi_tri_diem",
            "vi_tri_duong",
            "vi_tri",
            "vi_tri_lat",
            "vi_tri_lng",
            "ngay_lap_dat",
            "nha_san_xuat",
            "ghi_chu",
            "created_at",
            "updated_at",
        ]

    def get_vi_tri(self, obj):
        if obj.vi_tri_diem:
            return {"type": "Point", "coordinates": [obj.vi_tri_diem.x, obj.vi_tri_diem.y]}
        if obj.vi_tri_duong:
            return {"type": "LineString", "coordinates": list(obj.vi_tri_duong.coords)}
        return None

    def validate(self, attrs):
        lat = attrs.pop("vi_tri_lat", None)
        lng = attrs.pop("vi_tri_lng", None)
        if lat is not None and lng is not None:
            attrs["vi_tri_diem"] = Point(float(lng), float(lat), srid=4326)

        vi_tri_diem = attrs.get("vi_tri_diem")
        vi_tri_duong = attrs.get("vi_tri_duong")
        loai = attrs.get("loai") or getattr(self.instance, "loai", None)
        if not loai:
            raise serializers.ValidationError("Loại hạ tầng là bắt buộc.")
        if loai.la_duong_tuyen and not vi_tri_duong and not getattr(self.instance, "vi_tri_duong", None):
            raise serializers.ValidationError("Loại hạ tầng này yêu cầu dữ liệu đường (LineString).")
        if not loai.la_duong_tuyen and not vi_tri_diem and not getattr(self.instance, "vi_tri_diem", None):
            raise serializers.ValidationError("Loại hạ tầng này yêu cầu dữ liệu điểm (Point).")
        return attrs


class CapNhatTrangThaiHaTangSerializer(serializers.Serializer):
    trang_thai_id = serializers.PrimaryKeyRelatedField(queryset=TrangThaiHaTang.objects.all(), source="trang_thai")
