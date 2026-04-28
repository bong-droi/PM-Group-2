from django.urls import path
from .views import thong_ke_view

urlpatterns = [
    path("thongke/", thong_ke_view, name="thongke"),
]
