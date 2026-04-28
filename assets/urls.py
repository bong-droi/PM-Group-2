from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import HaTangViewSet, LoaiHaTangViewSet, TrangThaiHaTangViewSet, du_lieu_ban_do_view

router = DefaultRouter()
router.register(r"hatang", HaTangViewSet, basename="hatang")
router.register(r"loaihatang", LoaiHaTangViewSet, basename="loaihatang")
router.register(r"trangthai-hatang", TrangThaiHaTangViewSet, basename="trangthai-hatang")

urlpatterns = [
    path("", include(router.urls)),
    path("dulieubando/", du_lieu_ban_do_view, name="dulieubando"),
]
