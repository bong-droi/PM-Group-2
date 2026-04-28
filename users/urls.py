from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import NguoiDungViewSet, dang_ky_view, ky_thuat_vien_xep_hang_view, me_view

router = DefaultRouter()
router.register(r"nguoidung", NguoiDungViewSet, basename="nguoidung")

urlpatterns = [
    path("", include(router.urls)),
    path("me/", me_view, name="me"),
    path("dangky/", dang_ky_view, name="dangky"),
    path("kythuatvien-xephang/", ky_thuat_vien_xep_hang_view, name="kythuatvien-xephang"),
]
