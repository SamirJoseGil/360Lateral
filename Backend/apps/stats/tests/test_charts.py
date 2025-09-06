from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from apps.lotes.models import Lote
from apps.documents.models import Document
from apps.stats.models import Stat
import json

User = get_user_model()

class ChartsTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Set up some test data
        # (In a real test, you might create some lotes, documents, etc.)
    
    def test_dashboard_charts_view(self):
        """Test the dashboard charts endpoint returns valid data."""
        url = reverse('stats-charts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('lotes_summary', response.data)
        self.assertIn('documents_count', response.data)
        self.assertIn('documents_by_month', response.data)
        self.assertIn('event_distribution', response.data)
    
    def test_lotes_summary_view(self):
        """Test the lotes summary endpoint."""
        url = reverse('stats-lotes-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data)
        self.assertIn('activos', response.data)
        self.assertIn('inactivos', response.data)
    
    def test_documents_count_view(self):
        """Test the documents count endpoint."""
        url = reverse('stats-documents-count')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('count', response.data)
        self.assertIsInstance(response.data['count'], int)
    
    def test_documents_by_month_view(self):
        """Test the documents by month endpoint."""
        url = reverse('stats-documents-by-month')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        # Check we have 12 months
        self.assertEqual(len(response.data), 12)
        
        # Test with specific year
        response = self.client.get(f"{url}?year=2022")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_event_distribution_view(self):
        """Test the event distribution endpoint."""
        url = reverse('stats-charts-event-distribution')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        
        # Test with specific days parameter
        response = self.client.get(f"{url}?days=60")
        self.assertEqual(response.status_code, status.HTTP_200_OK)