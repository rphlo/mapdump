from django.conf import settings
from django.contrib.sites.models import Site


def url_front(request):
    return {"URL_FRONT": settings.URL_FRONT}


def site(request):
    return {"site": Site.objects.get_current()}
