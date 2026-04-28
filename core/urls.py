from django.urls import include, path

urlpatterns = [
    path("", include("assets.urls")),
    path("", include("incidents.urls")),
    path("", include("maintenance.urls")),
    path("", include("users.urls")),
    path("", include("dashboard.urls")),
]
