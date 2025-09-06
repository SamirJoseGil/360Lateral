from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from apps.stats.models import Stat
import json

User = get_user_model()

class EventStatsTests(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create some test events
        self.create_test_events()
        
    def create_test_events(self):
        # Create events with different types and timestamps
        event_types = ['view', 'search', 'action', 'error']
        now = timezone.now()
        
        for i in range(20):
            days_ago = i % 30  # Create events spread over last 30 days
            event_type = event_types[i % len(event_types)]
            
            # Create an event
            Stat.objects.create(
                name=f'Test Event {i}',
                type=event_type,
                timestamp=now - timedelta(days=days_ago),
                user_id=self.user.id if i % 3 == 0 else None,  # Some events have users, some don't
                session_id=f'session-{i // 3}' if i % 2 == 0 else None  # Some events have sessions
            )
            
    def test_event_dashboard_view(self):
        """Test the event dashboard endpoint."""
        url = reverse('stats-events-dashboard')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_events', response.data)
        self.assertIn('unique_users', response.data)
        self.assertIn('sessions', response.data)
        self.assertIn('errors', response.data)
        self.assertIn('daily_events', response.data)
        self.assertIn('event_types', response.data)
        
        # Test with days parameter
        response = self.client.get(f"{url}?days=15")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
    def test_event_counts_view(self):
        """Test the event counts endpoint."""
        url = reverse('stats-events-counts')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_events', response.data)
        self.assertIn('unique_users', response.data)
        self.assertIn('sessions', response.data)
        self.assertIn('errors', response.data)
        
        # Verify counts match what we expect
        self.assertEqual(response.data['total_events'], Stat.objects.count())
        
    def test_daily_events_view(self):
        """Test the daily events endpoint."""
        url = reverse('stats-events-daily')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        
        for entry in response.data:
            self.assertIn('date', entry)
            self.assertIn('count', entry)
            
    def test_event_type_distribution_view(self):
        """Test the event type distribution endpoint."""
        url = reverse('stats-events-types')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
        
        for entry in response.data:
            self.assertIn('type', entry)
            self.assertIn('count', entry)
            self.assertIn('percentage', entry)