from django.contrib.sites.models import Site
from django.conf import settings


def url_front(request):
    return {
        'URL_FRONT': settings.URL_FRONT
    }


def site(request):
    return {
        'site': project.objects.get_current()
    }
