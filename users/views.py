from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .models import NguoiDung
from .permissions import IsAdmin, IsAdminOrOperator
from .serializers import (
    AdminNguoiDungSerializer,
    DangKyNguoiDungSerializer,
    NguoiDungSerializer,
    get_ky_thuat_vien_theo_tai,
)


class NguoiDungViewSet(viewsets.ModelViewSet):
    queryset = NguoiDung.objects.all().order_by("username")
    serializer_class = NguoiDungSerializer
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.action in ["create", "update", "partial_update"]:
            return AdminNguoiDungSerializer
        return NguoiDungSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(NguoiDungSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([AllowAny])
def dang_ky_view(request):
    serializer = DangKyNguoiDungSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    return Response(NguoiDungSerializer(user).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@permission_classes([IsAdminOrOperator])
def ky_thuat_vien_xep_hang_view(request):
    serializer = NguoiDungSerializer(get_ky_thuat_vien_theo_tai(), many=True)
    return Response(serializer.data)
