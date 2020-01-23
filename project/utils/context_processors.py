from django.contrib.sites.models import Site


def site(request):
    return {
        'site': project.objects.get_current()
    }
