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
from routedb.views import map_download

urlpatterns = [
    path('admin/', admin.site.urls),
    path('drf-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('v1/', include('routedb.urls')),
    re_path(
        r'^media/maps/(?P<hash>[-0-9a-zA-Z_])/(?P<hash2>[-0-9a-zA-Z_])/'
        r'(?P<id>(?P=hash)(?P=hash2)[-0-9a-zA-Z_]{9})_[a-zA-Z0-9-_]+',
        map_download,
        name='map_download',
    ),
]
