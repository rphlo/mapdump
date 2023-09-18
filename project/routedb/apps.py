from django.apps import AppConfig
from routedb import patch

class RouteDBConfig(AppConfig):
    name = "routedb"
    
    def ready(self):
        patch.patch_requests_default_timeout()