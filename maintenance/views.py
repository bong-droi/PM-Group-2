from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from users.models import NguoiDung
from users.permissions import IsAdmin, IsAdminOperatorTechnical
from .models import NhatKyBaoTri
from .serializers import NhatKyBaoTriSerializer


class NhatKyBaoTriViewSet(viewsets.ModelViewSet):
    queryset = NhatKyBaoTri.objects.select_related("ha_tang", "ky_thuat_vien", "su_co").all()
    serializer_class = NhatKyBaoTriSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update"]:
            return [IsAdminOperatorTechnical()]
        if self.action == "destroy":
            return [IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        user = self.request.user
        if user.vai_tro == NguoiDung.VaiTro.TECHNICAL:
            serializer.save(ky_thuat_vien=user)
        else:
            serializer.save()
