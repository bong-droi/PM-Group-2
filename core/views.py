from django.shortcuts import render
from django.views import View


class FrontendAppView(View):
    def get(self, request):
        return render(request, "index.html")


class AdminDashboardView(View):
    def get(self, request):
        return render(request, "admin/dashboard.html")


class OperatorDashboardView(View):
    def get(self, request):
        return render(request, "operator/dashboard.html")


class TechnicalDashboardView(View):
    def get(self, request):
        return render(request, "technical/dashboard.html")


class CitizenDashboardView(View):
    def get(self, request):
        return render(request, "citizen/dashboard.html")
