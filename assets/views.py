import json
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsAdmin, IsAdminOperatorTechnical
from .models import HaTang, LoaiHaTang, TrangThaiHaTang
from .serializers import (
    CapNhatTrangThaiHaTangSerializer,
    HaTangSerializer,
    LoaiHaTangSerializer,
    TrangThaiHaTangSerializer,
)


class HaTangViewSet(viewsets.ModelViewSet):
    queryset = HaTang.objects.select_related("loai", "trang_thai").all()
    serializer_class = HaTangSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]

    @action(detail=True, methods=["patch"], url_path="trangthai", permission_classes=[IsAdminOperatorTechnical])
    def cap_nhat_trang_thai(self, request, pk=None):
        ha_tang = self.get_object()
        serializer = CapNhatTrangThaiHaTangSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ha_tang.trang_thai = serializer.validated_data["trang_thai"]
        ha_tang.save(update_fields=["trang_thai", "updated_at"])
        return Response(HaTangSerializer(ha_tang).data)


class LoaiHaTangViewSet(viewsets.ModelViewSet):
    queryset = LoaiHaTang.objects.all()
    serializer_class = LoaiHaTangSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]


class TrangThaiHaTangViewSet(viewsets.ModelViewSet):
    queryset = TrangThaiHaTang.objects.all()
    serializer_class = TrangThaiHaTangSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAdmin()]
        return [IsAuthenticated()]


@api_view(["GET"])
@permission_classes([AllowAny])
def du_lieu_ban_do_view(request):
    data = []
    for item in HaTang.objects.select_related("loai", "trang_thai"):
        geometry = item.vi_tri_diem or item.vi_tri_duong
        if not geometry:
            continue
        data.append(
            {
                "type": "Feature",
                "geometry": json.loads(geometry.geojson),
                "properties": {
                    "id": item.id,
                    "ten": item.ten,
                    "loai": item.loai.ten,
                    "trang_thai": item.trang_thai.ten_hien_thi if item.trang_thai else "Chưa xác định",
                },
            }
        )
    return Response({"type": "FeatureCollection", "features": data})
