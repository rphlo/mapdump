from django.core.management.base import BaseCommand
from routedb.models import Route


class Command(BaseCommand):
    help = "Remove image cache"

    def handle(self, *args, **options):
        Route.objects.all().update(
            has_image_w_header=False,
            has_image_w_route=False,
            has_image_w_header_route=False,
            has_image_thumbnail=False,
            has_image_blank=False,
        )
        self.stdout.write(self.style.SUCCESS("Done"))
