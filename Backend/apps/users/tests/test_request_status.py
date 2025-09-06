from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from apps.users.models import UserRequest

User = get_user_model()

class UserRequestTests(APITestCase):
    def setUp(self):
        # Create a regular user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpassword'
        )
        
        # Create a staff user
        self.staff_user = User.objects.create_user(
            username='staffuser',
            email='staff@example.com',
            password='staffpassword',
            is_staff=True
        )
        
        # Create some test requests for the user
        self.request1 = UserRequest.objects.create(
            user=self.user,
            request_type='access',
            title='Test Access Request',
            description='Need access to the system',
            status='pending'
        )
        
        self.request2 = UserRequest.objects.create(
            user=self.user,
            request_type='developer',
            title='Developer Application',
            description='I want to be a developer',
            status='in_review'
        )
        
        self.request3 = UserRequest.objects.create(
            user=self.staff_user,
            request_type='feature',
            title='Feature Request',
            description='Add new feature',
            status='approved'
        )
        
        # Set up client
        self.client = APIClient()
        
    def test_list_my_requests(self):
        """Test that users can see their own requests."""
        self.client.force_authenticate(user=self.user)
        url = reverse('userrequest-my-requests')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)  # Only user's own requests
        
    def test_request_detail(self):
        """Test that users can see details of their own request."""
        self.client.force_authenticate(user=self.user)
        url = reverse('userrequest-detail', args=[self.request1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.request1.id)
        
    def test_request_summary(self):
        """Test that users can get a summary of their requests."""
        self.client.force_authenticate(user=self.user)
        url = reverse('userrequest-summary')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 2)
        self.assertEqual(response.data['pending'], 1)
        
    def test_staff_can_see_all_requests(self):
        """Test that staff can see all requests."""
        self.client.force_authenticate(user=self.staff_user)
        url = reverse('userrequest-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)  # All requests
        
    def test_user_cannot_see_others_requests(self):
        """Test that users cannot see requests from other users."""
        self.client.force_authenticate(user=self.user)
        url = reverse('userrequest-detail', args=[self.request3.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_create_request(self):
        """Test creating a new request."""
        self.client.force_authenticate(user=self.user)
        url = reverse('userrequest-list')
        data = {
            'request_type': 'support',
            'title': 'Need Help',
            'description': 'I need help with the system'
        }
        response = self.client.post(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(UserRequest.objects.count(), 4)
        self.assertEqual(response.data['title'], 'Need Help')
        
    def test_filter_by_type_and_status(self):
        """Test filtering requests by type and status."""
        self.client.force_authenticate(user=self.user)
        url = reverse('userrequest-my-requests')
        response = self.client.get(f"{url}?type=access&status=pending")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.request1.id)