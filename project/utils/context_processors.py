from django.contrib.sites.models import Site
from django.config import settings


def url_front(request):
    return {
        'url_front': settings.URL_FRONT
    }


def site(request):
    return {
        'site': project.objects.get_current()
    }
