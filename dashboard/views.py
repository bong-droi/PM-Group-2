from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from users.permissions import IsAdmin
from assets.models import HaTang
from incidents.models import BaoCaoSuCo


@api_view(["GET"])
@permission_classes([IsAdmin])
def thong_ke_view(request):
    tong_ha_tang = HaTang.objects.count()
    tong_su_co = BaoCaoSuCo.objects.count()
    su_co_theo_trang_thai = BaoCaoSuCo.objects.values("trang_thai").annotate(so_luong=Count("id")).order_by("trang_thai")
    ha_tang_theo_loai = HaTang.objects.values("loai__ten").annotate(so_luong=Count("id")).order_by("loai__ten")
    return Response(
        {
            "tong_ha_tang": tong_ha_tang,
            "tong_su_co": tong_su_co,
            "su_co_theo_trang_thai": list(su_co_theo_trang_thai),
            "ha_tang_theo_loai": list(ha_tang_theo_loai),
        }
    )
