from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.stats.services.dashboard_service import DashboardService

User = get_user_model()

class DashboardStatsTests(TestCase):
    """Pruebas para las estadísticas del dashboard"""
    
    def setUp(self):
        self.client = APIClient()
        # Crear un superusuario para las pruebas
        self.admin_user = User.objects.create_superuser(
            email='admin@example.com',
            password='adminpassword',
            username='admin'
        )
        # Crear un usuario regular para las pruebas
        self.user = User.objects.create_user(
            email='user@example.com',
            password='userpassword',
            username='regularuser'
        )
    
    def test_dashboard_stats_admin(self):
        """Prueba que los administradores puedan acceder a todas las estadísticas del dashboard"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('stats-dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('users', response.data)
        self.assertIn('lotes', response.data)
        self.assertIn('documentos', response.data)
        self.assertIn('actividad_reciente', response.data)
    
    def test_dashboard_stats_regular_user(self):
        """Prueba que los usuarios regulares puedan acceder a estadísticas del dashboard"""
        self.client.force_authenticate(user=self.user)
        url = reverse('stats-dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_users_stats_admin_only(self):
        """Prueba que solo los administradores puedan acceder a estadísticas de usuarios"""
        # Probar con usuario regular
        self.client.force_authenticate(user=self.user)
        url = reverse('stats-users')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Probar con administrador
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
    
    def test_lotes_stats_authenticated(self):
        """Prueba que los usuarios autenticados puedan acceder a estadísticas de lotes"""
        self.client.force_authenticate(user=self.user)
        url = reverse('stats-lotes')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('activos', response.data)
        self.assertIn('inactivos', response.data)
    
    def test_documentos_stats_authenticated(self):
        """Prueba que los usuarios autenticados puedan acceder a estadísticas de documentos"""
        self.client.force_authenticate(user=self.user)
        url = reverse('stats-documentos')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('pendientes', response.data)
        self.assertIn('aceptados', response.data)
        self.assertIn('rechazados', response.data)
    
    def test_recent_activity_authenticated(self):
        """Prueba que los usuarios autenticados puedan acceder a la actividad reciente"""
        self.client.force_authenticate(user=self.user)
        url = reverse('stats-recent-activity')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recent_events', response.data)
        self.assertIn('active_users', response.data)
        self.assertIn('activity_by_type', response.data)
    
    def test_unauthenticated_access(self):
        """Prueba que los usuarios no autenticados no puedan acceder a las estadísticas"""
        # Sin autenticar
        url = reverse('stats-dashboard')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)