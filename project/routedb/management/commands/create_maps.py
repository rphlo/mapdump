from io import BytesIO
from django.core.management.base import BaseCommand
from routedb.models import Route
from utils.s3 import upload_to_s3


def create_map(route, show_header, show_route):
    suffix = '_header' if show_header else ''
    suffix += '_route' if show_route else ''
    if show_header or show_route:
        file_path = route.raster_map.path + suffix
        mime_type = 'image/jpeg'
        if not getattr(route, 'has_image_w' + suffix, False):
            img = route.route_image(show_header, show_route)
            up_buffer = BytesIO(img)
            up_buffer.seek(0)
            upload_to_s3('drawmyroute-maps', file_path, up_buffer)
            route.__setattr__('has_image_w' + suffix, True)
            route.save()


class Command(BaseCommand):
    help = 'Create all versions of map images'

    def handle(self, *args, **options):
        qs = Route.objects.all()
        for route in qs:
            create_map(route, True, True)
            create_map(route, True, False)
            create_map(route, False, True)
        self.stdout.write(self.style.SUCCESS('Done'))
