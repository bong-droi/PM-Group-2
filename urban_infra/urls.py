from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from core.views import (
    FrontendAppView,
    AdminDashboardView,
    OperatorDashboardView,
    TechnicalDashboardView,
    CitizenDashboardView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/", include("core.urls")),
    path("dashboard/admin/", AdminDashboardView.as_view(), name="admin_dashboard"),
    path("dashboard/operator/", OperatorDashboardView.as_view(), name="operator_dashboard"),
    path("dashboard/technical/", TechnicalDashboardView.as_view(), name="technical_dashboard"),
    path("dashboard/citizen/", CitizenDashboardView.as_view(), name="citizen_dashboard"),
    path("", FrontendAppView.as_view(), name="home"),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
