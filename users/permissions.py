from rest_framework.permissions import BasePermission
from .models import NguoiDung


class IsRole(BasePermission):
    allowed_roles = []

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.vai_tro in self.allowed_roles)


class IsAdmin(IsRole):
    allowed_roles = [NguoiDung.VaiTro.ADMIN]


class IsAdminOrOperator(IsRole):
    allowed_roles = [NguoiDung.VaiTro.ADMIN, NguoiDung.VaiTro.OPERATOR]


class IsAdminOperatorTechnical(IsRole):
    allowed_roles = [NguoiDung.VaiTro.ADMIN, NguoiDung.VaiTro.OPERATOR, NguoiDung.VaiTro.TECHNICAL]
