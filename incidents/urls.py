from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import BaoCaoSuCoViewSet

router = DefaultRouter()
router.register(r"suco", BaoCaoSuCoViewSet, basename="suco")

urlpatterns = [
    path("", include(router.urls)),
]
