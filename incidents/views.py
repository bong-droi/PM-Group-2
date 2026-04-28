from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.models import NguoiDung
from users.permissions import IsAdminOrOperator
from .models import BaoCaoSuCo, ThongBaoSuCo
from .serializers import BaoCaoSuCoSerializer, ThongBaoSuCoSerializer


class BaoCaoSuCoViewSet(viewsets.ModelViewSet):
    queryset = BaoCaoSuCo.objects.select_related(
        "ha_tang", "nguoi_bao_cao", "nhan_vien_ky_thuat", "xac_nhan_boi"
    ).prefetch_related("ky_thuat_vien_duoc_giao").all()
    serializer_class = BaoCaoSuCoSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset().order_by("-created_at")
        if user.vai_tro == NguoiDung.VaiTro.CITIZEN:
            return qs.filter(nguoi_bao_cao=user)
        if user.vai_tro == NguoiDung.VaiTro.TECHNICAL:
            return qs.filter(ky_thuat_vien_duoc_giao=user).distinct()
        return qs

    def perform_create(self, serializer):
        serializer.save(nguoi_bao_cao=self.request.user)

    def perform_update(self, serializer):
        su_co_hien_tai = self.get_object()
        trang_thai_cu = su_co_hien_tai.trang_thai
        su_co = serializer.save()
        if (
            trang_thai_cu != BaoCaoSuCo.TrangThaiXuLy.DA_HOAN_THANH
            and su_co.trang_thai == BaoCaoSuCo.TrangThaiXuLy.DA_HOAN_THANH
        ):
            self._tao_thong_bao_hoan_thanh(su_co, self.request.user)

    @action(detail=True, methods=["patch"], url_path="xacnhan", permission_classes=[IsAdminOrOperator])
    def xac_nhan_va_phan_cong(self, request, pk=None):
        su_co = self.get_object()
        trang_thai_cu = su_co.trang_thai
        ky_thuat_vien_id = request.data.get("nhan_vien_ky_thuat_id")
        trang_thai = request.data.get("trang_thai", BaoCaoSuCo.TrangThaiXuLy.DANG_XU_LY)
        if su_co.da_du_ky_thuat and ky_thuat_vien_id:
            return Response(
                {"detail": f"Sự cố đã đủ {su_co.so_ky_thuat_can} kỹ thuật viên, không thể điều hướng thêm."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if ky_thuat_vien_id:
            try:
                ky_thuat_vien = NguoiDung.objects.get(id=ky_thuat_vien_id, vai_tro=NguoiDung.VaiTro.TECHNICAL)
            except NguoiDung.DoesNotExist:
                return Response({"detail": "Không tìm thấy nhân viên kỹ thuật."}, status=status.HTTP_400_BAD_REQUEST)
            if su_co.ky_thuat_vien_duoc_giao.filter(id=ky_thuat_vien.id).exists():
                return Response(
                    {"detail": "Kỹ thuật viên này đã được phân công cho sự cố."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            su_co.ky_thuat_vien_duoc_giao.add(ky_thuat_vien)
            # Giữ tương thích trường cũ cho dữ liệu hiện có.
            su_co.nhan_vien_ky_thuat = ky_thuat_vien
        su_co.trang_thai = trang_thai
        su_co.xac_nhan_boi = request.user
        su_co.save()
        if (
            trang_thai_cu != BaoCaoSuCo.TrangThaiXuLy.DA_HOAN_THANH
            and su_co.trang_thai == BaoCaoSuCo.TrangThaiXuLy.DA_HOAN_THANH
        ):
            self._tao_thong_bao_hoan_thanh(su_co, request.user)
        return Response(BaoCaoSuCoSerializer(su_co).data)

    def _tao_thong_bao_hoan_thanh(self, su_co, nguoi_cap_nhat):
        users_nhan = set(
            NguoiDung.objects.filter(vai_tro__in=[NguoiDung.VaiTro.ADMIN, NguoiDung.VaiTro.OPERATOR]).values_list(
                "id", flat=True
            )
        )
        users_nhan.add(su_co.nguoi_bao_cao_id)
        tieu_de = f"Sự cố đã hoàn thành: {su_co.tieu_de}"
        noi_dung = (
            f"Sự cố '{su_co.tieu_de}' đã được cập nhật sang trạng thái 'Đã hoàn thành' bởi "
            f"{nguoi_cap_nhat.username}."
        )
        thong_bao_list = [
            ThongBaoSuCo(nguoi_nhan_id=user_id, su_co=su_co, tieu_de=tieu_de, noi_dung=noi_dung)
            for user_id in users_nhan
        ]
        ThongBaoSuCo.objects.bulk_create(thong_bao_list)

    @action(detail=False, methods=["get"], url_path="thongbao")
    def thong_bao_cua_toi(self, request):
        qs = ThongBaoSuCo.objects.filter(nguoi_nhan=request.user).select_related("su_co")
        return Response(ThongBaoSuCoSerializer(qs, many=True).data)
