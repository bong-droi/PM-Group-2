from rest_framework import serializers
from users.serializers import NguoiDungSerializer
from .models import NhatKyBaoTri


class NhatKyBaoTriSerializer(serializers.ModelSerializer):
    ky_thuat_vien_info = NguoiDungSerializer(source="ky_thuat_vien", read_only=True)

    class Meta:
        model = NhatKyBaoTri
        fields = "__all__"
        read_only_fields = ["ky_thuat_vien"]
