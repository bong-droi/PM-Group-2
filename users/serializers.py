from django.db.models import Count
from rest_framework import serializers
from .models import NguoiDung


class NguoiDungSerializer(serializers.ModelSerializer):
    so_su_co_duoc_giao = serializers.SerializerMethodField()

    class Meta:
        model = NguoiDung
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "ho_ten",
            "ngay_sinh",
            "gioi_tinh",
            "dia_chi",
            "vai_tro",
            "so_dien_thoai",
            "so_su_co_duoc_giao",
        ]

    def get_so_su_co_duoc_giao(self, obj):
        return getattr(obj, "so_su_co_duoc_giao", obj.su_co_duoc_giao_nhieu_nguoi.count())


class DangKyNguoiDungSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = NguoiDung
        fields = [
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "ho_ten",
            "ngay_sinh",
            "gioi_tinh",
            "dia_chi",
            "so_dien_thoai",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = NguoiDung(**validated_data, vai_tro=NguoiDung.VaiTro.CITIZEN)
        user.set_password(password)
        user.save()
        return user


class AdminNguoiDungSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    so_su_co_duoc_giao = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = NguoiDung
        fields = [
            "id",
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "ho_ten",
            "ngay_sinh",
            "gioi_tinh",
            "dia_chi",
            "vai_tro",
            "so_dien_thoai",
            "is_active",
            "is_staff",
            "so_su_co_duoc_giao",
        ]
        read_only_fields = ["so_su_co_duoc_giao"]

    def create(self, validated_data):
        password = validated_data.pop("password", None) or "changeme123"
        user = NguoiDung(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def get_so_su_co_duoc_giao(self, obj):
        return getattr(obj, "so_su_co_duoc_giao", obj.su_co_duoc_giao_nhieu_nguoi.count())

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


def get_ky_thuat_vien_theo_tai():
    return NguoiDung.objects.filter(vai_tro=NguoiDung.VaiTro.TECHNICAL).annotate(
        so_su_co_duoc_giao=Count("su_co_duoc_giao_nhieu_nguoi", distinct=True)
    ).order_by("so_su_co_duoc_giao", "username")
