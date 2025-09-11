"""
Servicios para el módulo de usuarios
"""
from django.utils import timezone
from .models import UserRequest


class RequestStatusService:
    """
    Service to manage and retrieve user request statuses.
    """
    
    @staticmethod
    def get_user_requests(user, request_type=None, status=None):
        """
        Get all requests for a specific user with optional filtering.
        
        Args:
            user: User object or ID
            request_type: Optional type of request to filter by
            status: Optional status to filter by
            
        Returns:
            QuerySet of UserRequest objects
        """
        if isinstance(user, int):
            user_id = user
        else:
            user_id = user.id
            
        # Start with base query for this user
        queryset = UserRequest.objects.filter(user_id=user_id)
        
        # Apply filters if provided
        if request_type:
            queryset = queryset.filter(request_type=request_type)
            
        if status:
            queryset = queryset.filter(status=status)
            
        # Return sorted by most recent first
        return queryset.order_by('-created_at')
    
    @staticmethod
    def get_request_details(request_id, user=None):
        """
        Get detailed information about a specific request.
        If user is provided, ensure it belongs to them.
        
        Args:
            request_id: ID of the request
            user: Optional User object to verify ownership
            
        Returns:
            UserRequest object or None if not found or not owned by user
        """
        try:
            if user:
                return UserRequest.objects.get(id=request_id, user=user)
            return UserRequest.objects.get(id=request_id)
        except UserRequest.DoesNotExist:
            return None
    
    @staticmethod
    def get_request_status_summary(user):
        """
        Get a summary of request statuses for a user.
        
        Args:
            user: User object or ID
            
        Returns:
            Dict with counts by status and type
        """
        if isinstance(user, int):
            user_id = user
        else:
            user_id = user.id
            
        # Get all requests for this user
        requests = UserRequest.objects.filter(user_id=user_id)
        
        # Count by status
        pending = requests.filter(status='pending').count()
        approved = requests.filter(status='approved').count()
        rejected = requests.filter(status='rejected').count()
        
        # Count by type
        counts_by_type = {}
        request_types = requests.values_list('request_type', flat=True).distinct()
        
        for req_type in request_types:
            counts_by_type[req_type] = requests.filter(request_type=req_type).count()
        
        return {
            'total': requests.count(),
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'by_type': counts_by_type
        }
    
    @staticmethod
    def get_recent_status_updates(user, days=30, limit=10):
        """
        Get recent status updates for a user's requests.
        
        Args:
            user: User object or ID
            days: Number of days to look back
            limit: Maximum number of updates to return
            
        Returns:
            List of recent status updates
        """
        if isinstance(user, int):
            user_id = user
        else:
            user_id = user.id
            
        start_date = timezone.now() - timezone.timedelta(days=days)
        
        # Get recently updated requests
        recent_updates = UserRequest.objects.filter(
            user_id=user_id,
            updated_at__gte=start_date
        ).order_by('-updated_at')[:limit]
        
        return recent_updates