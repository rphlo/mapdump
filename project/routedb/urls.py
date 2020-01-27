from django.urls import path, re_path, include
from . import views

urlpatterns = [
    path('routes/new', views.RouteCreate.as_view(), name='route_create'),
    path('latest-routes/', views.LatestRoutesList.as_view(), name='latest_routes_list'),
    re_path(r'^user/(?P<username>[a-zA-Z0-9_-]+)/?$', views.UserDetail.as_view(), name='user_detail'),
    re_path(r'^route/(?P<uid>[a-zA-Z0-9_-]+)/?$', views.RouteDetail.as_view(), name='route_detail'),
    path('auth/', include('rest_auth.urls')),
    path('auth/registration/', include('rest_auth.registration.urls')),
    path('auth/login', view=views.LoginView.as_view(), name='knox_login'),
]