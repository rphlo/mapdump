"""myroutechoices URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/3.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path

from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('drf-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api/v1/', include('routedb.urls')),
    path('', TemplateView.as_view(template_name='base.html'), name='index'),
    re_path(r'routes/[a-zA-Z0-9-_]{11}', TemplateView.as_view(template_name='frontend/route.html'), name='route_page'),
    re_path(r'athletes/[a-zA-Z0-9-_]{11}', TemplateView.as_view(template_name='frontend/athlete.html'), name='athlete_page'),
    re_path(r'.+', TemplateView.as_view(template_name='base.html'), name='catch_all')
]
