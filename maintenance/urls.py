from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import NhatKyBaoTriViewSet

router = DefaultRouter()
router.register(r"nhatky-baotri", NhatKyBaoTriViewSet, basename="nhatky-baotri")

urlpatterns = [path("", include(router.urls))]
