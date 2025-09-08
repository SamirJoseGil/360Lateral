# Views package for the stats application

from apps.stats.views.views import StatViewSet
from apps.stats.views.dashboard_views import (
    DashboardStatsView,
    DashboardSummaryView,
    UsersStatsView,
    LotesStatsView,
    DocumentosStatsView,
    RecentActivityView,
    EventsTableView,
    EventsDistributionView
)
from apps.stats.views.event_stats_views import (
    EventDashboardView,
    EventCountsView, 
    DailyEventsView,
    EventTypeDistributionView
)
from apps.stats.views.charts_views import (
    DashboardChartsView,
    LotesSummaryView,
    DocumentsCountView,
    DocumentsByMonthView,
    EventDistributionView as ChartsEventDistributionView
)