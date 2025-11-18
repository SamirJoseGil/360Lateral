"""
URLs para criterios de inversión
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvestmentCriteriaViewSet

app_name = 'investment_criteria'

router = DefaultRouter()
router.register(r'', InvestmentCriteriaViewSet, basename='criteria')

urlpatterns = [
    path('', include(router.urls)),
]
